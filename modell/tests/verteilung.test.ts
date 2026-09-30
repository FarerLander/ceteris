import { IST, LAENDER, RUECKBLICK } from "../../app/land";
import { standardWert } from "../kontext";
import { basisSzenario, rechne } from "../rechne";
import type { Pfad, SteuerId, Zustand } from "../typen";
import { eintrag } from "../verzeichnis";
import { testland } from "./testland";

// Spec 13.13: Gini und Armut reagieren auf Steuern, Transfers und Rentenniveau.
const SIEBEN = [
  "staat.giniEinkommensteuer",
  "staat.giniKapital",
  "staat.giniMwst",
  "staat.giniTransfers",
  "staat.giniRente",
  "staat.armutTransfers",
  "staat.armutRente",
];
const land = testland();
const lauf = (stell: Record<string, Pfad> = {}, aus: string[] = []) =>
  rechne(land, { ...basisSzenario(land, 26), stell, aus });
const basis = lauf();
const p = (id: string) => standardWert(id, land);
const st = p;
// Direkte Wirkung im ersten Jahr nach der Änderung: ohne den Anteil, der über die Arbeitslosigkeit läuft.
const gini = (v: Zustand[], t = 1) =>
  v[t].gini - basis[t].gini - p("staat.giniAlq") * (v[t].alq - basis[t].alq);
// Mehraufkommen einer Steuer in % BIP, wie das Modell es rechnet: Die Bemessungsgrundlage weicht dem
// Satz aus (staat.ts, aufkommen), mobile Grundlagen stärker.
const MOBIL = ["unternehmen", "kapitalertrag", "vermoegen"];
const mehr = (x: SteuerId, plus: number) => {
  const satz0 = st(`steuer.${x}`);
  const eps = p(`steuer.eps.${x}`) * (MOBIL.includes(x) ? 0.5 + p("handel.kapitalOffenheit") : 1);
  const b = land.start.steuerBasen[x];
  return (satz0 + plus) * b * Math.pow((1 - satz0 - plus) / (1 - satz0), eps) - satz0 * b;
};
const armut = (v: Zustand[], t = 1) =>
  v[t].armut - basis[t].armut - p("staat.armutAlq") * (v[t].alq - basis[t].alq);

describe("13.13 Gini und Armut: neue Treiber", () => {
  it("die sieben Wirkstärken stehen als umstritten im Verzeichnis, neutral 0", () => {
    for (const id of SIEBEN) {
      const e = eintrag(id);
      expect([id, e.art, e.baustein, e.umstritten, e.neutral]).toEqual([
        id,
        "wirkstaerke",
        "staat",
        true,
        0,
      ]);
      expect(e.standard).toBeGreaterThan(0);
    }
  });
  it("ohne Änderung an den Hebeln rechnet der Lauf bitgenau wie mit abgeschalteten Treibern", () => {
    const aus = lauf({}, SIEBEN);
    expect(aus).toHaveLength(basis.length);
    basis.forEach((z, i) => {
      for (const [f, v] of Object.entries(z))
        if (typeof v === "number")
          expect(
            (aus[i] as unknown as Record<string, number>)[f],
            `${z.jahr} ${f}`,
          ).toBe(v);
    });
  });
  it("Einkommensteuer +2 Punkte senkt den Gini um Wirkstärke × Mehraufkommen", () => {
    const v = lauf({ "steuer.einkommen": st("steuer.einkommen") + 0.02 });
    expect(gini(v)).toBeCloseTo(
      -p("staat.giniEinkommensteuer") * mehr("einkommen", 0.02),
      6,
    );
    expect(v[25].gini).toBeLessThan(basis[25].gini);
  });
  it("Mehrwertsteuer +2 Punkte hebt den Gini", () => {
    const v = lauf({ "steuer.mwst": st("steuer.mwst") + 0.02 });
    expect(gini(v)).toBeCloseTo(p("staat.giniMwst") * mehr("mwst", 0.02), 6);
    expect(gini(v)).toBeGreaterThan(0);
  });
  it("Vermögensteuer, Erbschaftsteuer und Kapitalertragsteuer senken den Gini", () => {
    const v = lauf({
      "steuer.vermoegen": st("steuer.vermoegen") + 0.005,
      "steuer.erbschaft": st("steuer.erbschaft") + 0.02,
    });
    expect(gini(v)).toBeCloseTo(
      -p("staat.giniKapital") * (mehr("vermoegen", 0.005) + mehr("erbschaft", 0.02)),
      6,
    );
    const k = lauf({
      "steuer.kapitalertrag": st("steuer.kapitalertrag") + 0.1,
    });
    expect(gini(k)).toBeCloseTo(-p("staat.giniKapital") * mehr("kapitalertrag", 0.1), 6);
    expect(gini(k)).toBeLessThan(0);
  });
  it("gezählt wird das Aufkommen des Modells: Eine Steuer, die nichts mehr einbringt, gleicht nicht aus", () => {
    // Kapitalertragsteuer auf 90 %: Die Grundlage weicht aus, das Aufkommen sinkt.
    const plus = 0.9 - st("steuer.kapitalertrag");
    expect(mehr("kapitalertrag", plus)).toBeLessThan(0);
    const v = lauf({ "steuer.kapitalertrag": 0.9 });
    expect(gini(v)).toBeCloseTo(-p("staat.giniKapital") * mehr("kapitalertrag", plus), 6);
    expect(gini(v)).toBeGreaterThan(0);
  });
  it("Belege: eigene Schätzung heißt „an Daten kalibriert“, dünn belegte Werte sagen es in der Quelle", () => {
    for (const id of SIEBEN) expect([id, eintrag(id).beleg]).toEqual([id, "kalibriert"]);
    const duenn = SIEBEN.filter((id) => eintrag(id).quelle.includes("dünn belegt"));
    expect(duenn).toEqual(["staat.giniKapital", "staat.giniMwst", "staat.giniTransfers", "staat.giniRente", "staat.armutRente"]);
  });
  it("Eingriffe der Regierung bewegen den Gini (Politik reagiert)", () => {
    const us = LAENDER.US;
    const sz = { ...basisSzenario(us), grund: { ...us.grund, politik: "reagiert" as const } };
    const mit = rechne(us, sz);
    const ohne = rechne(us, { ...sz, aus: [...sz.aus, ...SIEBEN] });
    expect(mit.flatMap((z) => z.politik).length).toBeGreaterThan(0);
    expect(Math.max(...mit.map((z, i) => Math.abs(z.gini - ohne[i].gini)))).toBeGreaterThan(0.1);
  });
  it("Familienleistungen +1 % BIP senken Gini und Armut", () => {
    const v = lauf({ "staat.familie": st("staat.familie") + 1 });
    expect(gini(v)).toBeCloseTo(-p("staat.giniTransfers"), 6);
    expect(armut(v)).toBeCloseTo(-p("staat.armutTransfers"), 6);
  });
  it("Rentenniveau −5 Punkte hebt Gini und Armut", () => {
    const v = lauf({ "rente.niveau": st("rente.niveau") - 5 });
    expect(gini(v)).toBeCloseTo(5 * p("staat.giniRente"), 6);
    expect(armut(v)).toBeCloseTo(5 * p("staat.armutRente"), 6);
  });
  it.each([
    ["staat.giniEinkommensteuer", "steuer.einkommen", 0.02, gini],
    ["staat.giniKapital", "steuer.vermoegen", 0.005, gini],
    ["staat.giniKapital", "steuer.erbschaft", 0.02, gini],
    ["staat.giniKapital", "steuer.kapitalertrag", 0.1, gini],
    ["staat.giniMwst", "steuer.mwst", 0.02, gini],
    ["staat.giniTransfers", "staat.familie", 1, gini],
    ["staat.giniRente", "rente.niveau", -5, gini],
    ["staat.armutTransfers", "staat.familie", 1, armut],
    ["staat.armutRente", "rente.niveau", -5, armut],
  ] as const)(
    "%s abgeschaltet: %s wirkt nicht mehr direkt",
    (wirk, hebel, delta, mass) => {
      expect(
        Math.abs(mass(lauf({ [hebel]: st(hebel) + delta }))),
      ).toBeGreaterThan(1e-3);
      expect(mass(lauf({ [hebel]: st(hebel) + delta }, [wirk]))).toBeCloseTo(
        0,
        9,
      );
    },
  );
  it("Extremwerte: alle Hebel am Rand ihres Bereichs, Gini bleibt endlich und zwischen 15 und 70", () => {
    const steuern = [
      "steuer.einkommen",
      "steuer.kapitalertrag",
      "steuer.vermoegen",
      "steuer.erbschaft",
      "steuer.mwst",
      "staat.familie",
      "rente.niveau",
    ];
    for (const rand of [0, 1] as const) {
      const v = lauf(
        Object.fromEntries(
          steuern.map((id) => [id, eintrag(id).bereich![rand]]),
        ),
      );
      for (const z of v) {
        expect(
          Number.isFinite(z.gini) && Number.isFinite(z.armut),
          `${z.jahr}`,
        ).toBe(true);
        expect(z.gini).toBeGreaterThanOrEqual(15);
        expect(z.gini).toBeLessThanOrEqual(70);
        expect(z.armut).toBeGreaterThanOrEqual(0);
      }
    }
  });
  it("Rückblick Deutschland: Gini trifft die Ist-Reihe nicht schlechter als ohne die neuen Treiber", () => {
    const rmse = (v: Zustand[]) => {
      const paare = v
        .filter((z) => IST.gini?.[z.jahr] !== undefined)
        .map((z) => z.gini - IST.gini[z.jahr]);
      expect(paare.length).toBeGreaterThan(15);
      return Math.sqrt(paare.reduce((a, d) => a + d * d, 0) / paare.length);
    };
    const neu = rechne(RUECKBLICK.land, RUECKBLICK.sz);
    const alt = rechne(RUECKBLICK.land, {
      ...RUECKBLICK.sz,
      aus: [...RUECKBLICK.sz.aus, ...SIEBEN],
    });
    // Die Hebel des Rückblicks (Einkommensteuer, Mehrwertsteuer, Rentenniveau, Familie) bewegen den Gini.
    expect(neu.some((z, i) => Math.abs(z.gini - alt[i].gini) > 0.1)).toBe(true);
    expect(rmse(neu)).toBeLessThanOrEqual(rmse(alt));
  });
});
