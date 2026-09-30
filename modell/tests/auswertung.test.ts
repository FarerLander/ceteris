import { bereinigeWahl, bewerteOptionen, erzaehlung, geaendert, einzelwirkung, setzeWahl } from "../auswertung";
import { formatStell } from "../format";
import { anwenden, bewertePakete, PAKETE } from "../pakete";
import { basisSzenario, rechne } from "../rechne";
import { einheitFuer, REIHEN } from "../reihen";
import { eintrag } from "../verzeichnis";
import { testland } from "./testland";
import { standardWert } from "../kontext";
import type { Szenario } from "../typen";

const land = testland();
const sz = (stell = {}, grund = {}) => ({
  ...basisSzenario(land, 51),
  stell,
  grund: { ...land.grund, ...grund },
});

describe("formatStell", () => {
  it("zeigt Jahre ohne unnötige Nachkommastellen und Anteile als Prozent", () => {
    expect(formatStell(eintrag("rente.alter"), 69)).toBe("69 Jahre");
    expect(formatStell(eintrag("rente.alter"), 67.5)).toBe("67,5 Jahre");
    expect(formatStell(eintrag("steuer.kapitalertrag"), 0.26)).toBe("26 %");
    expect(formatStell(eintrag("energie.atom"), 2)).toBe("Neubau");
  });
});

describe("geaendert und einzelwirkung", () => {
  it("findet geänderte Stellschrauben und Grundeinstellungen", () => {
    expect(geaendert(land, sz())).toEqual([]);
    expect(
      geaendert(land, sz({ "rente.alter": 69 }, { regime: "eigen" })),
    ).toEqual(["rente.alter", "grund.regime"]);
  });
  it("Rentenalter 69 hebt Wohlstand und senkt Schuld", () => {
    const s = sz({ "rente.alter": 69 });
    const t = einzelwirkung(
      land,
      s,
      "rente.alter",
      rechne(land, basisSzenario(land, 51)),
    );
    expect(t.pc).toBeGreaterThan(0);
    expect(t.d).toBeLessThan(0);
    expect(t.wert).toBe("69 Jahre statt 67 Jahre");
  });
});

describe("erzaehlung", () => {
  it("Basislinie: keine Treiber, Verteilung zählt alle Jahre", () => {
    const e = erzaehlung(land, sz(), rechne(land, sz()));
    expect(e.treiber).toEqual([]);
    expect(Object.values(e.verteilung).reduce((a, b) => a + b, 0)).toBe(51);
    expect(e.titel.length).toBeGreaterThan(5);
  });
});

describe("Pakete", () => {
  it("höchstens drei, absteigend nach Zuwachs, alle positiv", () => {
    const b = bewertePakete(land, sz(), rechne(land, sz()));
    expect(b.length).toBeLessThanOrEqual(3);
    for (let i = 1; i < b.length; i++)
      expect(b[i - 1].zuwachs).toBeGreaterThanOrEqual(b[i].zuwachs);
    for (const x of b) expect(x.zuwachs).toBeGreaterThan(0.05);
  });
  it("ein übernommenes Paket verschwindet aus der Liste", () => {
    const s0 = sz();
    const erstes = bewertePakete(land, s0, rechne(land, s0))[0];
    const s1 = anwenden(s0, erstes.aenderung);
    expect(
      bewertePakete(land, s1, rechne(land, s1)).map((x) => x.paket.id),
    ).not.toContain(erstes.paket.id);
  });
  it("jedes Paket hat Warum, Preis und Quelle", () => {
    for (const p of PAKETE) expect(p.warum && p.preis && p.quelle).toBeTruthy();
  });
});

describe("abgeschaltete Annahmen", () => {
  it("zählen als Änderung und erscheinen als Treiber", () => {
    const s = { ...sz({ "staat.uebrige": land.standards["staat.uebrige"] + 3 }), aus: ["wachstum.multiplikator"] };
    expect(geaendert(land, s)).toContain("aus:wachstum.multiplikator");
    // M29: der Schalter Haushaltsplan zählt als Änderung.
    expect(geaendert(land, { ...basisSzenario(land), grund: { ...land.grund, haushaltsplan: "aus" } })).toContain("grund.haushaltsplan");
    const t = einzelwirkung(land, s, "aus:wachstum.multiplikator", rechne(land, basisSzenario(land, 51)));
    expect(t.name).toBe("Fiskalmultiplikator");
    expect(t.wert).toBe("abgeschaltet");
  });
});

describe("Währung in der Anzeige", () => {
  it("Wohlstand pro Kopf trägt das Symbol des Landes", () => {
    const yen = { ...land, waehrung: { symbol: "¥", kurs: 1 } };
    expect(einheitFuer(REIHEN.bipProKopf, yen)).toBe("Tsd. ¥");
    expect(einheitFuer(REIHEN.bipProKopf, land)).toBe("Tsd. €");
    const kurz = { ...sz(), jahre: 11 };
    expect(erzaehlung(yen, kurz, rechne(yen, kurz)).unter).toMatch(/Tsd\. ¥/);
  });
});

// ---------- 13.13: Optionen an einem Entscheidungspunkt ----------
describe("bewerteOptionen und setzeWahl (Spec 13.13)", () => {
  const lahm = testland({ tfpTrend: 0 });
  const reagiert = (wahl?: Record<string, "macht" | "richtung" | "unbequem">): Szenario =>
    ({ ...basisSzenario(lahm, 41), stell: { "staat.schuldenreaktion": 0 }, grund: { ...lahm.grund, politik: "reagiert" as const }, ...(wahl ? { wahl } : {}) });
  const punkt = (sz: Szenario, a: "schwaeche" | "eng", n = 0) =>
    rechne(lahm, sz).flatMap((z) => z.politik).filter((e) => e.art === "entscheidung" && e.ausloeser === a)[n];
  it("drei Einträge in der Reihenfolge macht, richtung, unbequem; die Vorwahl hat Maße 0; Texte nicht leer", () => {
    const sz = reagiert();
    const e = punkt(sz, "schwaeche");
    const o = bewerteOptionen(lahm, sz, e);
    expect(o.map((x) => x.motiv)).toEqual(["macht", "richtung", "unbequem"]);
    const regel = o.find((x) => x.motiv === e.vorwahl)!;
    expect(Object.values(regel.masse)).toEqual([0, 0, 0, 0, 0]);
    for (const x of o) {
      for (const text of [x.name, x.beschreibung, x.zahlt, x.spaeter]) expect(text.length).toBeGreaterThan(5);
      expect(Object.values(x.masse).every(Number.isFinite)).toBe(true);
    }
    // Die anderen unterscheiden sich von der Vorwahl.
    expect(o.filter((x) => x.motiv !== e.vorwahl).every((x) => Object.values(x.masse).some((m) => Math.abs(m) > 1e-6))).toBe(true);
  });
  it("Maße stimmen mit einem Lauf mit erzwungener Wahl überein", () => {
    const sz = reagiert();
    const e = punkt(sz, "schwaeche");
    const o = bewerteOptionen(lahm, sz, e);
    const schluessel = `${e.jahr}-schwaeche`;
    const v = rechne(lahm, reagiert({ [schluessel]: "macht" }));
    const r = rechne(lahm, reagiert({ [schluessel]: e.vorwahl! }));
    expect(o[0].masse.schuld).toBeCloseTo(v[40].schuldQuote - r[40].schuldQuote, 9);
  });
  it("nicht mögliche Option: moeglich false mit Grund", () => {
    // Unbequem, wenn das passende Paket schon umgesetzt ist (Gründungen: Forschung 4,5, Kapitalertragsteuer 22 %).
    const sz: Szenario = { ...reagiert(), stell: { "staat.schuldenreaktion": 0, "innov.fue": 4.5, "steuer.kapitalertrag": 0.22 } };
    const e = rechne(lahm, sz).flatMap((z) => z.politik).find((x) => x.art === "entscheidung" && x.ausloeser === "schwaeche" && x.paket === undefined)!;
    const o = bewerteOptionen(lahm, sz, e);
    const macht = o.find((x) => !x.moeglich)!;
    expect(macht.motiv).toBe("unbequem");
    expect(macht.moeglich).toBe(false);
    expect(macht.grund!.length).toBeGreaterThan(5);
    expect(o.filter((x) => x.moeglich).length).toBe(2);
  });
  it("setzeWahl setzt und löscht; ohne Einträge bleibt kein Feld", () => {
    const sz = reagiert();
    const a = setzeWahl(lahm, sz, 2028, "schwaeche", "macht");
    expect(a.wahl).toEqual({ "2028-schwaeche": "macht" });
    const b = setzeWahl(lahm, a, 2028, "schwaeche", null);
    expect(b.wahl).toBeUndefined();
  });
  it("Grenzfall: nach dem Umschalten bleibt kein Eintrag für einen Punkt, den es nicht mehr gibt", () => {
    const spaet = punkt(reagiert(), "eng").jahr;
    const sz = reagiert({ [`${spaet}-eng`]: "macht" });
    // Eine frühe Wahl verschiebt die Punkte: Den späten gibt es danach nicht mehr.
    const neu = setzeWahl(lahm, sz, 2028, "schwaeche", "unbequem");
    expect(neu.wahl).toEqual({ "2028-schwaeche": "unbequem" });
    // Bleibt der späte Punkt bestehen, bleibt seine Wahl.
    const b = setzeWahl(lahm, sz, 2028, "schwaeche", "richtung");
    // „Richtung“ ist 2028 die Vorwahl: Wer sie wählt, kehrt zur Regel zurück, es bleibt kein Eintrag dafür.
    expect(b.wahl).toEqual({ [`${spaet}-eng`]: "macht" });
    // Ein Eintrag, den es von Anfang an nicht gab, wird beim nächsten Umschalten abgeräumt.
    const tot = setzeWahl(lahm, reagiert({ "2030-eng": "macht" }), 2028, "schwaeche", "macht");
    expect(tot.wahl).toEqual({ "2028-schwaeche": "macht" });
  });
});

describe("bereinigeWahl (G6 der Prüfung)", () => {
  const lahm = testland({ tfpTrend: 0 });
  const sz = (wahl?: Record<string, "macht" | "richtung" | "unbequem">, politik: "fest" | "reagiert" = "reagiert"): Szenario =>
    ({ ...basisSzenario(lahm, 41), stell: { "staat.schuldenreaktion": 0 }, grund: { ...lahm.grund, politik }, ...(wahl ? { wahl } : {}) });
  it("entfernt Einträge ohne Punkt und solche, die der Regel entsprechen; lässt wirksame stehen", () => {
    const s = sz({ "2028-schwaeche": "macht", "2031-eng": "macht", "2030-schwaeche": "unbequem" });
    const neu = bereinigeWahl(s, rechne(lahm, s));
    expect(neu.wahl).toEqual({ "2028-schwaeche": "macht" });
    const regel = rechne(lahm, sz()).flatMap((z) => z.politik).find((e) => e.art === "entscheidung")!;
    const gleich = sz({ [`${regel.jahr}-${regel.ausloeser}`]: regel.vorwahl! });
    expect(bereinigeWahl(gleich, rechne(lahm, gleich)).wahl).toBeUndefined();
  });
  it("Einträge hinter dem Ende des Zeitraums bleiben (sie gelten wieder, wenn der Zeitraum länger wird)", () => {
    const kurz = { ...sz({ "2028-schwaeche": "macht", "2070-eng": "macht" }), jahre: 26 };
    expect(bereinigeWahl(kurz, rechne(lahm, kurz)).wahl).toEqual({ "2028-schwaeche": "macht", "2070-eng": "macht" });
  });
  it("der Grund für nicht möglichen Machterhalt nennt nur den Risikoaufschlag (die Schuldenregel hält nicht ab)", () => {
    const hoch = testland({ tfpTrend: 0, schuldQuote: 220 });
    const s: Szenario = { ...basisSzenario(hoch, 16), grund: { ...hoch.grund, politik: "reagiert" } };
    const e = rechne(hoch, s).flatMap((z) => z.politik).find((x) => x.art === "entscheidung" && x.ausloeser === "schwaeche")!;
    const m = bewerteOptionen(hoch, s, e).find((x) => x.motiv === "macht")!;
    expect(m.moeglich).toBe(false);
    expect(m.grund).toMatch(/Risikoaufschlag/);
    expect(m.grund).not.toMatch(/Schuldenregel/);
  });
  it("ändert nichts, wenn nichts zu räumen ist (dasselbe Objekt), und nichts bei Politik fest", () => {
    const s = sz({ "2028-schwaeche": "macht" });
    expect(bereinigeWahl(s, rechne(lahm, s))).toBe(s);
    const f = sz({ "2028-schwaeche": "macht" }, "fest");
    expect(bereinigeWahl(f, rechne(lahm, f))).toBe(f);
  });
});

