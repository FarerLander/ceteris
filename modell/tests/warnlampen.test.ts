import { basisSzenario, rechne } from "../rechne";
import type { Szenario } from "../typen";
import { warnlampen } from "../warnlampen";
import { mehrFuer } from "../reihen";
import { BANKWERTE, testland } from "./testland";

const land = testland();
const lauf = (stell: Szenario["stell"] = {}) => {
  const sz = { ...basisSzenario(land, 51), stell };
  return { sz, v: rechne(land, sz) };
};

describe("Warnlampen", () => {
  it("hohe Dauerdefizite lösen die Aufschlag-Warnung als zusammenhängende Phase aus", () => {
    const { sz, v } = lauf({
      "staat.uebrige": land.standards["staat.uebrige"] + 10,
    });
    const w = warnlampen(land, sz, v);
    const auf = w.filter((x) => x.id === "aufschlag");
    expect(auf.length).toBeGreaterThan(0);
    for (const p of auf) expect(p.bis).toBeGreaterThanOrEqual(p.von);
    expect(w.some((x) => x.id === "ventil")).toBe(true);
  });
  it("Grenzfall: Phasen einer Art überlappen nicht, eine Phase kann im letzten Jahr enden", () => {
    const { sz, v } = lauf({
      "staat.uebrige": land.standards["staat.uebrige"] + 10,
    });
    const w = warnlampen(land, sz, v);
    for (const id of new Set(w.map((x) => x.id))) {
      const ps = w.filter((x) => x.id === id).sort((a, b) => a.von - b.von);
      for (let i = 1; i < ps.length; i++)
        expect(ps[i].von).toBeGreaterThan(ps[i - 1].bis + 1);
    }
    const letztes = v[v.length - 1].jahr;
    expect(w.every((x) => x.bis <= letztes)).toBe(true);
  });
  it("Arbeitslosigkeit über 10 % nach Krisenschocks", () => {
    const sz: Szenario = {
      ...basisSzenario(land, 26),
      schocks: [
        { id: 1, art: "krise", jahr: 2030, staerke: 3, dauer: 1 },
        { id: 2, art: "pandemie", jahr: 2030, staerke: 2, dauer: 1 },
      ],
    };
    const w = warnlampen(land, sz, rechne(land, sz));
    expect(w.find((x) => x.id === "alq")?.von).toBe(2030);
  });
});

describe("13.2 Frühwarn-Lampen", () => {
  it("inverse Zinskurve: Lampe bei Euroraum-Leitzins 8 % ab Jahr 3, mit eigenem Diagramm", async () => {
    const { LAENDER } = await import("../../app/land");
    const DE = LAENDER.DE;
    const sz = { ...basisSzenario(DE, 10), welt: { euroLeitzins: [{ ab: DE.datenstand, wert: 2 }, { ab: DE.datenstand + 3, wert: 8 }] } };
    const p = warnlampen(DE, sz, rechne(DE, sz)).find((x) => x.id === "zinskurve");
    expect(p?.von).toBe(DE.datenstand + 3);
    expect(p?.reihe).toBe("zinskurve");
    expect(p?.text).toMatch(/Inverse Zinskurve/);
  });
  it("Kreditlücke: Lampe bei Startlücke 15 Pp., keine bei Startlücke 0", async () => {
    const { LAENDER } = await import("../../app/land");
    const DE = LAENDER.DE;
    const hoch = { ...DE, start: { ...DE.start, kreditTrend0: DE.start.privatschuld - 15, kreditSteigung0: 0 } };
    const sz = basisSzenario(DE, 6);
    const p = warnlampen(hoch, sz, rechne(hoch, sz)).find((x) => x.id === "kredit");
    expect(p?.von).toBe(DE.datenstand + 1);
    expect(p?.reihe).toBe("kreditluecke");
    const null0 = { ...DE, start: { ...DE.start, kreditTrend0: undefined, kreditSteigung0: undefined } };
    expect(warnlampen(null0, sz, rechne(null0, sz)).some((x) => x.id === "kredit")).toBe(false);
  });
  it("gelenkte Währung: keine Zinskurven-Lampe, der Staat setzt den Leitzins", async () => {
    const { LAENDER } = await import("../../app/land");
    const CN = LAENDER.CN;
    const sz = basisSzenario(CN, 51);
    const v = rechne(CN, sz);
    expect(v.some((z) => z.zinskurve < 0)).toBe(true);
    expect(warnlampen(CN, sz, v).some((x) => x.id === "zinskurve")).toBe(false);
  });
  it("Vorab-Hinweis: im Rückblick etwa alle 9 Jahre ein großer Schock", async () => {
    const { RUECKBLICK } = await import("../../app/land");
    const { schockAbstand } = await import("../warnlampen");
    expect(schockAbstand(RUECKBLICK.sz)).toBe(9);
  });
  it("Schwellen im Verzeichnis", async () => {
    const { eintrag } = await import("../verzeichnis");
    expect(eintrag("schwelle.zinskurve").standard).toBe(0);
    expect(eintrag("schwelle.kreditluecke").standard).toBe(10);
  });
});

describe("13.6 Lampen und Diagramme für Häuser und Banken", () => {
  // Preis im Startjahr 30 % über dem Trend (im ersten Jahr zieht der Trend schon nach).
  const bank = testland({ ...BANKWERTE, hausTrend0: -30 }, { banken: "an" });
  it("Hauspreis-Lampe, wenn der Preis mehr als 15 % über dem Trend liegt; mit eigenem Diagramm", () => {
    const sz = basisSzenario(bank, 26);
    const w = warnlampen(bank, sz, rechne(bank, sz));
    const haus = w.find((x) => x.id === "haus")!;
    expect(haus.von).toBe(2026);
    expect(haus.reihe).toBe("hausluecke");
    expect(haus.text).toMatch(/Hauspreise/);
  });
  it("Banken-Lampe, solange die Banken Kredit kürzen", () => {
    const duenn = testland({ ...BANKWERTE, bankKapital0: 2, bankBilanz0: 120 }, { banken: "an", rettung: "zoegernd" });
    const sz: Szenario = { ...basisSzenario(duenn, 26), schocks: [{ id: 1, art: "krise", jahr: 2028, staerke: 3, dauer: 1 }] };
    const v = rechne(duenn, sz);
    const b = warnlampen(duenn, sz, v).find((x) => x.id === "bank")!;
    expect(b.reihe).toBe("bankKapital");
    expect(v.find((z) => z.jahr === b.von)!.klemme).toBeGreaterThan(0);
    expect(v.find((z) => z.jahr === b.von - 1)!.klemme).toBe(0);
  });
  it("Banken aus: keine der beiden Lampen, keine Bank-Diagramme", () => {
    const sz = { ...basisSzenario(bank, 26), grund: { ...bank.grund, banken: "aus" as const } };
    const v = rechne(bank, sz);
    expect(warnlampen(bank, sz, v).some((x) => x.id === "haus" || x.id === "bank")).toBe(false);
    for (const id of ["hauspreis", "hausluecke", "bankKapital", "npl"] as const) expect(mehrFuer(v, v)).not.toContain(id);
    const an = rechne(bank, basisSzenario(bank, 26));
    for (const id of ["hauspreis", "hausluecke", "bankKapital", "npl"] as const) expect(mehrFuer(an, v)).toContain(id);
  });
});
