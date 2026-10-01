import { describe, expect, it } from "vitest";
import { LAENDER, RUECKBLICK } from "../../app/land";
import { baueFall, type Fall } from "../../daten/kalibrierung/lade";
import griechenland from "../../daten/kalibrierung/griechenland.json";
import { baueKontext, standardWert } from "../kontext";
import { neuerStand, POLITIK_STANDARD, politikAn, politikSchritt, type Ueberlagerung } from "../politik";
import { naechstesWahljahr } from "../eingriffe";
import type { Ausloeser, Motiv } from "../politik-modus";
import { basisSzenario, politikUeber, rechne } from "../rechne";
import { startzustand } from "../start";
import type { Landesdaten, Szenario, Zustand } from "../typen";
import { eintrag } from "../verzeichnis";
import { testland } from "./testland";

// Siehe „Testland rechnet fest bitgenau wie vor 13.13“.
const FEST_VORHER = [153.9634300538552, 52.32767324866776, 3.674732422149323, 31.56676674957006];

const DE = LAENDER.DE;

describe("13.10 Grundlagen", () => {
  it("Verzeichnis kennt Grundeinstellung, Stellschrauben und Schwellen", () => {
    expect(eintrag("grund.politik").optionen).toEqual(["Fest", "Reagiert"]);
    for (const id of ["politik.steueranteil", "politik.kuerzeAlles", "politik.risiko"])
      expect(eintrag(id).art).toBe("stellschraube");
    expect(eintrag("politik.schwaecheJahre").standard).toBe(3);
    expect(eintrag("politik.risikoAufschlag").umstritten).toBe(true);
  });
  it("Standard ist reagiert; Rückblick und historische Fälle bleiben fest (tatsächliche Politik als Pfad)", () => {
    expect(POLITIK_STANDARD).toBe("reagiert");
    expect(politikAn({ ...DE.grund })).toBe(true);
    expect(politikAn({ ...DE.grund, politik: "fest" })).toBe(false);
    expect(RUECKBLICK.sz.grund.politik).toBe("fest");
    expect(baueFall(griechenland as unknown as Fall).sz.grund.politik).toBe("fest");
  });
  it("Grenzfall: alle Länder, 101 Jahre, reagiert: alles endlich", () => {
    for (const [code, land] of Object.entries(LAENDER)) {
      const r = rechne(land, basisSzenario(land, 101));
      for (const z of r)
        for (const [f, v] of Object.entries(z))
          if (typeof v === "number") expect(Number.isFinite(v), `${code} ${z.jahr} ${f}`).toBe(true);
    }
  });
  it("Überlagerung wirkt auf w, aenderung und verzoegert", () => {
    const sz = basisSzenario(DE, 11);
    const { c } = startzustand(DE, sz);
    const ueber: Record<string, number>[] = [{}, {}, { "staat.uebrige": 1 }, { "staat.uebrige": 1 }];
    const k = baueKontext(DE, sz, c, 3, ueber);
    const b = k.basis("staat.uebrige");
    expect(k.w("staat.uebrige")).toBe(b + 1);
    expect(k.aenderung("staat.uebrige")).toBe(0);
    expect(k.verzoegert("staat.uebrige", 2)).toBe(0.5);
    expect(baueKontext(DE, sz, c, 3).w("staat.uebrige")).toBe(b);
  });
  it("neue Felder im Startzustand", () => {
    const z = rechne(DE, basisSzenario(DE, 3));
    expect(z[0].politik).toEqual([]);
    expect(z[2].politikKonsol).toBe(0);
    expect(z[2].pauschal).toBe(z[2].schuldenregel);
  });
});

const reagiert = (land: Landesdaten, jahre: number, extra: Partial<Szenario> = {}): Szenario => ({
  ...basisSzenario(land, jahre),
  ...extra,
  // Die Fälle (Wahljahr 2032 in den USA usw.) sind vor M29 gemessen: ohne Haushaltsplan.
  grund: { ...land.grund, politik: "reagiert", haushaltsplan: "aus", ...(extra.grund ?? {}) },
});
const ereignisse = (r: Zustand[], art: string) => r.flatMap((z) => z.politik).filter((e) => e.art === art);
const punkte = (r: Zustand[], a?: Ausloeser) => ereignisse(r, "entscheidung").filter((e) => !a || e.ausloeser === a);
const kurz = (r: Zustand[]) => punkte(r).map((e) => `${e.jahr} ${e.ausloeser} ${e.motiv}`);
const fest = (sz: Szenario): Szenario => ({ ...sz, grund: { ...sz.grund, politik: "fest" } });

// Testland mit dauerhaft schwachem Wachstum (kein Produktivitätstrend), ohne Schock: Die Schwäche hält an.
const TAKT = { legislatur: 4, letzteWahl: 2025, takt: 1, wirksamkeit: 85 };
const LAHM = testland({ tfpTrend: 0 });
const LAHM_TAKT: Landesdaten = { ...LAHM, politik: TAKT };
const lahm = (land: Landesdaten, wahl?: Szenario["wahl"], extra: Partial<Szenario> = {}) =>
  reagiert(land, 31, { stell: { "staat.schuldenreaktion": 0 }, ...extra, ...(wahl ? { wahl } : {}) });

describe("13.13 Politik fest", () => {
  it("keine Ereignisse, keine Überlagerung; ohne Grundeinstellung gilt reagiert", () => {
    const sz = basisSzenario(DE, 31);
    const a = rechne(DE, fest(sz));
    expect(a.flatMap((z) => z.politik)).toEqual([]);
    expect(politikUeber(DE, fest(sz)).every((u) => Object.keys(u).length === 0)).toBe(true);
    const ohne = rechne(DE, { ...sz, grund: { ...DE.grund, politik: undefined } });
    expect(ohne[30].schuldQuote).toBe(rechne(DE, { ...sz, grund: { ...DE.grund, politik: "reagiert" } })[30].schuldQuote);
  });
  // Gemessen vor der Einführung der Entscheidungspunkte: Testland, fest, 31 Jahre, Investitionsanker fest.
  it("Testland rechnet fest bitgenau wie vor 13.13", () => {
    const v = rechne(LAHM, fest(lahm(LAHM, undefined, { aus: ["wachstum.investAnpassung"] })));
    expect([v[30].schuldQuote, v[30].bipProKopf, v[15].alq, v[30].gini]).toEqual(FEST_VORHER);
  });
});

describe("13.13 Entscheidungspunkt Schwäche", () => {
  it("anhaltende Schwäche: ein Punkt, sobald drei Jahre schwach sind; ohne Wahl der Nutzerin gilt die Regel", () => {
    const r = rechne(LAHM, lahm(LAHM));
    const p = punkte(r, "schwaeche");
    expect(p[0].jahr).toBe(2028);
    expect(p.filter((e) => e.jahr === 2028)).toHaveLength(1);
    for (const e of punkte(r)) expect(e.motiv).toBe(e.vorwahl);
    // Bis zum Punkt wie fest.
    const f = rechne(LAHM, fest(lahm(LAHM)));
    for (let t = 0; t < 3; t++) expect(r[t].Y).toBe(f[t].Y);
    expect(r[5].Y).not.toBe(f[5].Y);
  });
  it("ohne Wahltakt: der nächste Punkt frühestens nach vier Jahren", () => {
    const jahre = punkte(rechne(LAHM, lahm(LAHM)), "schwaeche").map((e) => e.jahr);
    expect(jahre.slice(0, 3)).toEqual([2028, 2032, 2036]);
    for (let i = 1; i < jahre.length; i++) expect(jahre[i] - jahre[i - 1]).toBeGreaterThanOrEqual(4);
  });
  it("mit Wahltakt: ein Punkt je Legislatur, der nächste im ersten Jahr nach der Wahl", () => {
    const p = punkte(rechne(LAHM_TAKT, lahm(LAHM_TAKT)), "schwaeche");
    // 2028 ist Vorwahljahr (Wahl 2029): Machterhalt. Danach 2030, 2034, 2038: jeweils das Jahr nach der Wahl.
    expect(p.slice(0, 4).map((e) => `${e.jahr} ${e.motiv}`)).toEqual(["2028 macht", "2030 richtung", "2034 unbequem", "2038 unbequem"]);
    expect(p[2].paket).toBe("gruendungen");
    expect(p[1].struktur).toBe("sozial");
  });
  it("jede der drei Optionen lässt sich erzwingen; das Ereignis nennt Wahl und Regel", () => {
    const laeufe = (["macht", "richtung", "unbequem"] as const).map((m) => rechne(LAHM, lahm(LAHM, { "2028-schwaeche": m })));
    laeufe.forEach((r, i) => {
      const e = punkte(r, "schwaeche")[0];
      expect([e.jahr, e.motiv, e.vorwahl]).toEqual([2028, ["macht", "richtung", "unbequem"][i], "richtung"]);
    });
    const schuld = laeufe.map((r) => r[30].schuldQuote);
    expect(new Set(schuld).size).toBe(3);
    // Die Regel selbst zu wählen ändert nichts.
    expect(laeufe[1][30].schuldQuote).toBe(rechne(LAHM, lahm(LAHM))[30].schuldQuote);
  });
  it("Machterhalt: Ausgaben zwei Jahre +1 % BIP, danach bleiben 0,3; die Einkommensteuer holt sie in Schritten zurück", () => {
    const sz = lahm(LAHM, { "2028-schwaeche": "macht" });
    const u = politikUeber(LAHM, sz);
    expect([3, 4, 5, 6, 12].map((t) => u[t]["staat.uebrige"])).toEqual([1, 1, 0.3, 0.3, 0.3]);
    const basis = LAHM.start.steuerBasen.einkommen;
    expect(u[3]["steuer.einkommen"]).toBeUndefined();
    expect([4, 5, 6, 12].map((t) => u[t]["steuer.einkommen"] * basis)).toEqual([0.1, 0.2, 0.3, 0.3].map((x) => expect.closeTo(x, 9)));
    const r = rechne(LAHM, sz);
    const f = rechne(LAHM, fest(sz));
    expect(r[3].primaerausgaben - f[3].primaerausgaben).toBeGreaterThan(0.7);
    expect(r[5].primaerausgaben - f[5].primaerausgaben).toBeLessThan(0.6);
  });
  it("Machterhalt geht auch, wenn die Schuldenregel greift; nicht mehr, wenn die Märkte den Aufschlag hochtreiben", () => {
    // Ohne abgeschaltete Schuldenregel und mit steigender Schuld greift sie.
    const land = testland({ tfpTrend: 0 });
    const ohne = reagiert(land, 16, { stell: { "staat.uebrige": standardWert("staat.uebrige", land) + 3 } });
    const erster = punkte(rechne(land, ohne), "schwaeche")[0].jahr;
    const sz = { ...ohne, wahl: { [`${erster}-schwaeche`]: "macht" as const } };
    const r = rechne(land, sz);
    const e = punkte(r, "schwaeche")[0];
    expect(r[e.jahr - 2025 - 1].schuldenregel).toBeGreaterThan(0);
    expect(e.motiv).toBe("macht");
    // Aufschlag über der Schwelle: Die Wahl fällt auf die Regel zurück.
    const krise = testland({ tfpTrend: 0, schuldQuote: 220 });
    const sk = reagiert(krise, 16, { wahl: { "2028-schwaeche": "macht" } });
    const rk = rechne(krise, sk);
    const ek = punkte(rk, "schwaeche").find((x) => x.jahr === 2028)!;
    expect(ek).toBeDefined();
    expect(rk[2].aufschlag).toBeGreaterThan(standardWert("schwelle.aufschlag", krise));
    expect(ek.motiv).not.toBe("macht");
  });
  it("Großprogramm höchstens eins je zehn Jahre (Regel ohne Wahl der Nutzerin)", () => {
    for (const [code, land] of Object.entries(LAENDER)) {
      const programme = punkte(rechne(land, reagiert(land, 101)), "schwaeche").filter((e) => e.motiv === "richtung").map((e) => e.jahr);
      // Ausnahme nur, wenn weder Ausgaben (Märkte) noch eine Reform (Paket ausgeschöpft) gehen.
      for (let i = 1; i < programme.length; i++) expect(programme[i] - programme[i - 1], `${code} ${programme.join(", ")}`).toBeGreaterThanOrEqual(10);
    }
  });
  it("Unbequem mit Wahltakt: eine Legislatur später nimmt die Regierung 30 % zurück", () => {
    const sz = lahm(LAHM_TAKT, { "2028-schwaeche": "unbequem" });
    const r = rechne(LAHM_TAKT, sz);
    expect(punkte(r, "schwaeche")[0]).toMatchObject({ jahr: 2028, motiv: "unbequem", vorwahl: "macht", paket: "gruendungen" });
    // 2028 + 4 = 2032, erstes Wahljahr ab dann: 2033.
    expect(ereignisse(r, "ruecknahme")[0].jahr).toBe(2033);
    const u = politikUeber(LAHM_TAKT, sz);
    const voll = u[7]["innov.fue"]; // 2032: eingeglitten
    expect(voll).toBeCloseTo((0.3 + 0.5 * 0.85) * (4.5 - standardWert("innov.fue", LAHM_TAKT)), 9);
    expect(u[3]["innov.fue"]).toBeCloseTo(voll / 3, 9);
    expect(u[8]["innov.fue"]).toBeCloseTo(0.7 * voll, 9);
    // Ohne Wahltakt keine Rücknahme.
    expect(ereignisse(rechne(LAHM, lahm(LAHM, { "2028-schwaeche": "unbequem" })), "ruecknahme")).toEqual([]);
  });
  it("Grenzfall: Wahl an einem Punkt, den es nicht gibt, wirkt nicht; unbekanntes Motiv auch nicht", () => {
    const ohne = rechne(LAHM, lahm(LAHM));
    for (const wahl of [{ "2099-schwaeche": "unbequem" }, { "2029-schwaeche": "macht" }, { "2028-eng": "macht" }, { "2028-schwaeche": "irgendwas" }, { kaputt: "macht" }] as unknown as Szenario["wahl"][]) {
      const mit = rechne(LAHM, lahm(LAHM, wahl));
      expect(kurz(mit), JSON.stringify(wahl)).toEqual(kurz(ohne));
      expect(mit[30].schuldQuote).toBe(ohne[30].schuldQuote);
    }
  });
  it("Grenzfall: Eine frühere Wahl verschiebt spätere Punkte; die Wahl an einem verschwundenen Punkt verfällt", () => {
    const ohne = rechne(LAHM, lahm(LAHM));
    const frueh = rechne(LAHM, lahm(LAHM, { "2028-schwaeche": "unbequem" }));
    const spaet = punkte(ohne, "eng")[0].jahr;
    expect(punkte(frueh, "eng").map((e) => e.jahr)).not.toContain(spaet);
    const beide = rechne(LAHM, lahm(LAHM, { "2028-schwaeche": "unbequem", [`${spaet}-eng`]: "macht" }));
    expect(kurz(beide)).toEqual(kurz(frueh));
    expect(beide[30].schuldQuote).toBe(frueh[30].schuldQuote);
    // Am Punkt, den es gibt, wirkt dieselbe Wahl.
    expect(punkte(rechne(LAHM, lahm(LAHM, { [`${spaet}-eng`]: "macht" })), "eng")[0]).toMatchObject({ jahr: spaet, motiv: "macht" });
  });
  it("Großprogramm gleitet über drei Jahre ein und bleibt", () => {
    const sz = lahm(LAHM, {}, { jahre: 8 });
    const u = politikUeber(LAHM, sz);
    expect(punkte(rechne(LAHM, sz))[0]).toMatchObject({ jahr: 2028, motiv: "richtung", struktur: "sozial" });
    expect(u[3]["staat.familie"]).toBeCloseTo(0.4 / 3, 9);
    expect(u[5]["staat.familie"]).toBeCloseTo(0.4, 9);
    expect(u[5]["rente.niveau"]).toBeGreaterThan(0);
  });
});

describe("13.13 Sperrklinke bei Schocks und Wahljahr", () => {
  const pandemie = [{ id: 1, art: "pandemie" as const, jahr: 2027, staerke: 1, dauer: 1 }];
  it("Pandemie (Ausgaben 4 und 2 % BIP): Ab dem dritten Jahr bleiben 1,2 % BIP", () => {
    const land = testland();
    const u = politikUeber(land, reagiert(land, 8, { schocks: pandemie }));
    expect([2, 3, 4, 5].map((t) => u[t]["staat.uebrige"] ?? 0)).toEqual([0, 0, 1.2, 1.2]);
    const aus = politikUeber(land, reagiert(land, 8, { schocks: pandemie, aus: ["politik.sperrklinke"] }));
    expect([2, 3, 4, 5].map((t) => aus[t]["staat.uebrige"] ?? 0)).toEqual([0, 0, 0, 0]);
  });
  it("Wahljahr-Effekt: Standard 0; mit 0,3 % BIP nur in Wahljahren, abschaltbar, ohne Wahltakt nie", () => {
    const mit = (land: Landesdaten, aus: string[] = []) => politikUeber(land, reagiert(land, 7, { aus })).map((x) => x["staat.uebrige"] ?? 0);
    const land = { ...testland(), politik: TAKT };
    expect(mit(land)).toEqual([0, 0, 0, 0, 0, 0, 0]);
    const an = { ...land, standards: { ...land.standards, "politik.wahljahr": 0.3 } };
    expect(mit(an)).toEqual([0, 0, 0, 0, 0.3, 0, 0]); // 2029
    expect(mit(an, ["politik.wahljahr"])).toEqual([0, 0, 0, 0, 0, 0, 0]);
    expect(mit({ ...an, politik: { ...TAKT, takt: 0 } })).toEqual([0, 0, 0, 0, 0, 0, 0]);
    expect(mit({ ...testland(), standards: an.standards })).toEqual([0, 0, 0, 0, 0, 0, 0]);
  });
});

describe("13.13 Entscheidungspunkt enger Haushalt", () => {
  const US = LAENDER.US;
  const FR = LAENDER.FR;
  const groesste = (u: Ueberlagerung, id: string) => u.reduce((a, x) => Math.max(a, Math.abs(x[id] ?? 0)), 0);
  // Seit K1 der Prüfung entscheidet jede Legislatur bei anhaltender Enge neu. Was eine Option tut, zeigt
  // sich deshalb bis zum nächsten Punkt „eng“.
  const bisZumNaechsten = (land: Landesdaten, sz: Szenario, u: Ueberlagerung) => {
    const p = punkte(rechne(land, sz), "eng").map((e) => e.jahr - land.datenstand);
    return u.slice(0, p[1] ?? u.length);
  };
  const ersterEng = (land: Landesdaten) => punkte(rechne(land, reagiert(land, 51)), "eng")[0];
  const mitWahl = (land: Landesdaten, m: Motiv, extra: Partial<Szenario> = {}) => reagiert(land, 51, { ...extra, wahl: { [`${ersterEng(land).jahr}-eng`]: m } });
  it("USA: nach zwei engen Jahren ein Punkt; im Wahljahr umgeht die Regierung die Schuldenregel", () => {
    const e = ersterEng(US);
    expect(e).toMatchObject({ jahr: 2032, motiv: "macht", vorwahl: "macht" });
    // Die Umgehung hält bis zur nächsten Wahl (2036); im Jahr danach entscheidet die neue Regierung.
    expect(punkte(rechne(US, reagiert(US, 51)), "eng")[1].jahr).toBe(2037);
  });
  it("Machterhalt: Investitionen aufgeschoben, Schuldenregel halbiert, versteckte Einnahmen; die Schuld steigt schneller als bei Unbequem", () => {
    const e = ersterEng(US);
    const i = e.jahr - US.datenstand;
    const u = politikUeber(US, mitWahl(US, "macht"));
    expect(u[i]["staat.investitionen"]).toBeLessThan(0);
    expect(u[i]["steuer.sozialabgaben"]).toBeCloseTo(0.002, 12);
    expect(u[i]["staat.schuldenreaktion"]).toBeCloseTo(-0.5 * standardWert("staat.schuldenreaktion", US), 12);
    expect(u[i + 5]["staat.schuldenreaktion"] ?? 0).toBe(0);
    expect(u[i]["rente.niveau"] ?? 0).toBe(0);
    // Die aufgeschobenen Investitionen bleiben aufgeschoben, auch nach dem Ende der Umgehung.
    expect(u[i + 10]["staat.investitionen"]).toBeLessThan(0);
    // Kurzfristig sieht das Umgehen besser aus (versteckte Einnahmen, keine Sparrezession).
    const macht = rechne(US, mitWahl(US, "macht"));
    const unbequem = rechne(US, mitWahl(US, "unbequem"));
    expect(macht[i + 4].schuldQuote).toBeLessThan(unbequem[i + 4].schuldQuote);
  });
  it("Richtung im Sozialstaat (Frankreich): Steuern auf Kapital, Vermögen, Unternehmen; das Rentenniveau bleibt", () => {
    // Ohne Großprogramm (abgeschaltet), damit nur der enge Haushalt die Hebel bewegt.
    const ohneProgramm = reagiert(FR, 51, { aus: ["politik.programm"] });
    const jahr = punkte(rechne(FR, ohneProgramm), "eng")[0].jahr;
    const sz = { ...ohneProgramm, wahl: { [`${jahr}-eng`]: "richtung" as const } };
    const u = bisZumNaechsten(FR, sz, politikUeber(FR, sz));
    expect(punkte(rechne(FR, sz), "eng")[0]).toMatchObject({ jahr, motiv: "richtung", struktur: "sozial" });
    const j = jahr - FR.datenstand;
    for (const x of ["kapitalertrag", "vermoegen", "unternehmen"]) expect(u[j + 1][`steuer.${x}`]).toBeGreaterThan(0);
    // Ab dem Punkt bewegt die Option weder Rente noch übrige Ausgaben (früher Beschlossenes bleibt stehen).
    const ab = (id: string) => Math.max(...u.slice(j).map((x) => Math.abs((x[id] ?? 0) - (u[j - 1][id] ?? 0))));
    expect(ab("rente.niveau")).toBe(0);
    expect(ab("staat.uebrige")).toBe(0);
  });
  it("Richtung sonst (USA): Sozialleistungen sinken, keine Steuern", () => {
    const u = bisZumNaechsten(US, mitWahl(US, "richtung"), politikUeber(US, mitWahl(US, "richtung")));
    const ende = u[u.length - 1];
    expect(ende["sozial.lohnersatz"]).toBeLessThan(0);
    expect(groesste(u, "steuer.einkommen") + groesste(u, "steuer.mwst") + groesste(u, "steuer.kapitalertrag")).toBe(0);
    expect(punkte(rechne(US, mitWahl(US, "richtung")), "eng")[0]).toMatchObject({ motiv: "richtung", struktur: "markt" });
  });
  it("Unbequem: die Konsolidierung aus 13.10, aber das Rentenniveau sinkt je Jahr höchstens halb so schnell", () => {
    const sz = mitWahl(US, "unbequem", { stell: { "politik.steueranteil": 0, "staat.uebrige": 10 } });
    const u = politikUeber(US, sz);
    const schritte = u.slice(1).map((x, t) => (u[t]["rente.niveau"] ?? 0) - (x["rente.niveau"] ?? 0)).filter((d) => d > 1e-9);
    expect(schritte.length).toBeGreaterThan(1);
    const raum = 0.2 * standardWert("rente.niveau", US);
    // Je Jahr höchstens die Hälfte dessen, was noch gekürzt werden dürfte (20 % des Werts zu Beginn).
    let uebrig = raum;
    for (const d of schritte) {
      expect(d).toBeLessThanOrEqual(uebrig / 2 + 1e-9);
      uebrig -= d;
    }
    expect(groesste(u, "staat.uebrige")).toBe(0); // schon am unteren Rand
  });
  it("Steueranteil 0: nur Kürzungen; 1: nur Steuern (Unbequem)", () => {
    const s0 = mitWahl(US, "unbequem", { stell: { "politik.steueranteil": 0 } });
    const s1 = mitWahl(US, "unbequem", { stell: { "politik.steueranteil": 1 } });
    const u0 = bisZumNaechsten(US, s0, politikUeber(US, s0));
    const u1 = bisZumNaechsten(US, s1, politikUeber(US, s1));
    expect(groesste(u0, "steuer.einkommen") + groesste(u0, "steuer.mwst")).toBe(0);
    expect(groesste(u0, "staat.uebrige")).toBeGreaterThan(0);
    expect(groesste(u1, "steuer.mwst")).toBeGreaterThan(0);
    expect(groesste(u1, "rente.niveau") + groesste(u1, "staat.gesundheit")).toBe(0);
  });
  it("ersetzt die Schuldenregel, nicht zusätzlich", () => {
    const r = rechne(US, mitWahl(US, "unbequem"));
    expect(r.some((z) => z.politikKonsol > 0)).toBe(true);
    expect(r.some((z) => z.schuldenregel > 0 && z.pauschal < z.schuldenregel)).toBe(true);
    for (const z of r.slice(1))
      if (z.schuldenregel > 0) expect(z.pauschal).toBeCloseTo(Math.max(0, z.schuldenregel - z.politikKonsol), 12);
      else expect(z.pauschal).toBe(z.schuldenregel);
  });
  it("die Phase endet nach zwei nicht engen Jahren; die Kürzungen bleiben", () => {
    const sz = mitWahl(US, "unbequem");
    const r = rechne(US, sz);
    const u = politikUeber(US, sz);
    const ende = u[u.length - 1];
    expect(Object.values(ende).some((x) => x !== 0)).toBe(true);
    const p = punkte(r, "eng").map((e) => e.jahr);
    for (let i = 1; i < p.length; i++) expect(p[i] - p[i - 1]).toBeGreaterThanOrEqual(4);
  });
});

describe("13.13 Befunde der Prüfung", () => {
  it("K1: hält die Enge an, entsteht je Legislatur ein neuer Punkt, auch wenn die laufende Option erschöpft ist", () => {
    const US = LAENDER.US;
    const r = rechne(US, reagiert(US, 51));
    const eng = punkte(r, "eng").map((e) => e.jahr);
    // 2032 Machterhalt bis zur Wahl 2036, 2037 eine neue Entscheidung; die Enge hält an, also 2041 wieder.
    expect(eng.slice(0, 3)).toEqual([2032, 2037, 2041]);
    for (let i = 1; i < eng.length; i++) {
      const wahl = naechstesWahljahr(US, eng[i - 1] + 1)!;
      expect(eng[i]).toBeGreaterThanOrEqual(wahl + 1);
    }
  });
  it("W1: die Sperrklinke hebt keine Stellschraube über ihren Bereich; Kürzungen zählen nur, was wirkt", () => {
    const IT = LAENDER.IT;
    const sz = reagiert(IT, 51, { stell: { "staat.uebrige": 30 }, schocks: [{ id: 1, art: "pandemie", jahr: 2027, staerke: 1, dauer: 1 }] });
    const u = politikUeber(IT, sz);
    for (const x of u) expect(30 + (x["staat.uebrige"] ?? 0), "staat.uebrige roh").toBeLessThanOrEqual(30 + 1e-9);
  });
});

describe("13.13 Robustheit", () => {
  it("Grenzfall: Land ohne Politik-Block rechnet mit q 0,7 und ohne Takt, alles endlich", () => {
    const land = testland({ tfpTrend: 0, schuldQuote: 110 });
    expect(land.politik).toBeUndefined();
    const r = rechne(land, reagiert(land, 101));
    expect(punkte(r).length).toBeGreaterThan(0);
    for (const z of r)
      for (const [f, v] of Object.entries(z)) if (typeof v === "number") expect(Number.isFinite(v), `${z.jahr} ${f}`).toBe(true);
  });
  it("Grenzfall: alle neun Länder, 101 Jahre: jede bewegte Stellschraube bleibt in ihrem Bereich", () => {
    for (const [code, land] of Object.entries(LAENDER)) {
      const sz = reagiert(land, 101);
      const ueber = politikUeber(land, sz);
      const { c } = startzustand(land, sz);
      for (let t = 1; t < sz.jahre; t++) {
        const k = baueKontext(land, sz, c, t, ueber);
        for (const [id, x] of Object.entries(ueber[t] ?? {})) {
          expect(Number.isFinite(x), `${code} ${k.jahr} ${id}`).toBe(true);
          const [lo, hi] = eintrag(id).bereich!;
          expect(k.w(id), `${code} ${k.jahr} ${id}`).toBeGreaterThanOrEqual(lo - 1e-9);
          expect(k.w(id), `${code} ${k.jahr} ${id}`).toBeLessThanOrEqual(hi + 1e-9);
        }
      }
    }
  });
  it("Grenzfall: Hebel schon am Rand (Zölle 30, Rentenniveau 35, Einkommensteuer 45 %): Optionen wirken nur so weit wie möglich", () => {
    const rand = { "handel.zoelle": 30, "rente.niveau": 35, "steuer.einkommen": 0.45, "staat.schuldenreaktion": 0 };
    for (const m of ["macht", "richtung", "unbequem"] as const) {
      const sz = reagiert(LAHM_TAKT, 31, { stell: rand, wahl: { "2028-schwaeche": m } });
      const r = rechne(LAHM_TAKT, sz);
      expect(r.every((z) => Number.isFinite(z.schuldQuote) && Number.isFinite(z.Y)), m).toBe(true);
      for (const x of politikUeber(LAHM_TAKT, sz)) expect(x["steuer.einkommen"] ?? 0, m).toBeLessThanOrEqual(1e-12);
    }
  });
  it("wirksame Hebel bleiben im Bereich, auch wenn ein Pfad nach dem Auslösen springt", () => {
    const faelle: [Landesdaten, Szenario][] = [
      [LAENDER.IT, reagiert(LAENDER.IT, 51, { stell: { "rente.niveau": [{ ab: 2025, wert: standardWert("rente.niveau", LAENDER.IT) }, { ab: 2060, wert: 35 }] } })],
      [LAENDER.US, reagiert(LAENDER.US, 51, { stell: { "politik.steueranteil": 1, "steuer.mwst": [{ ab: 2025, wert: standardWert("steuer.mwst", LAENDER.US) }, { ab: 2060, wert: 0.3 }] } })],
      [LAENDER.US, reagiert(LAENDER.US, 51, { stell: { "politik.steueranteil": 0, "staat.uebrige": [{ ab: 2025, wert: standardWert("staat.uebrige", LAENDER.US) }, { ab: 2060, wert: 10 }] } })],
    ];
    for (const [land, sz] of faelle) {
      const ueber = politikUeber(land, sz);
      const { c } = startzustand(land, sz);
      for (let t = 1; t < sz.jahre; t++) {
        const k = baueKontext(land, sz, c, t, ueber);
        for (const id of Object.keys(ueber[t] ?? {})) {
          const [lo, hi] = eintrag(id).bereich!;
          expect(k.w(id), `${land.code} ${k.jahr} ${id}`).toBeGreaterThanOrEqual(lo - 1e-9);
          expect(k.w(id), `${land.code} ${k.jahr} ${id}`).toBeLessThanOrEqual(hi + 1e-9);
        }
      }
    }
  });
  it("die Schwäche zählt mit Nachsicht: drei der letzten fünf Jahre reichen (M37)", () => {
    const sz = reagiert(DE, 11, { stell: { "staat.schuldenreaktion": 0 } });
    const { z, c } = startzustand(DE, sz);
    const lauf = (muster: boolean[]) => {
      const stand = neuerStand();
      const verlauf = [{ ...z, schuldenregel: 0, aufschlag: 0 }];
      const arten: string[] = [];
      muster.forEach((schwachJahr, i) => {
        const t = i + 1;
        verlauf[t - 1] = { ...verlauf[t - 1], wachstumProKopf: schwachJahr ? -0.01 : 0.02, alq: verlauf[t - 1].nairuEff };
        const neu: Zustand = { ...verlauf[t - 1], jahr: verlauf[t - 1].jahr + 1, politik: [] };
        politikSchritt(stand, verlauf, neu, baueKontext(DE, sz, c, t, []), sz);
        arten.push(...neu.politik.map((e) => `${e.art} ${e.ausloeser}`));
        verlauf.push(neu);
      });
      return arten;
    };
    expect(lauf([true, true, false, true])).toEqual(["entscheidung schwaeche"]);
    expect(lauf([true, false, false, true, false])).toEqual([]);
  });
});

describe("13.10 politisches Risiko", () => {
  it("Standard aus, an nach Krise +0,5 Pp. für fünf Jahre, abschaltbar", () => {
    const schock = [{ id: 1, art: "krise" as const, jahr: DE.datenstand + 2, staerke: 1, dauer: 1 }];
    const aus = rechne(DE, reagiert(DE, 16, { schocks: schock }));
    const an = rechne(DE, reagiert(DE, 16, { schocks: schock, stell: { "politik.risiko": 1 } }));
    const k = an.findIndex((z) => z.lage === "krise");
    expect(k).toBeGreaterThan(0);
    expect(aus.every((z) => z.politikAufschlag === 0)).toBe(true);
    expect(an[k + 1].politikAufschlag).toBe(0.5);
    expect(an[k + 1].aufschlag).toBeGreaterThan(aus[k + 1].aufschlag);
    expect(ereignisse(an, "risiko")).toHaveLength(1);
    const letzte = an.map((z) => z.lage).lastIndexOf("krise");
    expect(an[letzte + 6]?.politikAufschlag ?? 0).toBe(0);
    const neutral = rechne(DE, reagiert(DE, 16, { schocks: schock, stell: { "politik.risiko": 1 }, aus: ["politik.risikoAufschlag"] }));
    expect(neutral[k + 1].politikAufschlag).toBe(0);
  });
});
