import { describe, expect, it } from "vitest";
import { DE } from "../../app/land";
import { basisSzenario, rechne } from "../rechne";
import { kalibriereStandards } from "../start";
import type { Landesdaten } from "../typen";

// Testland: Deutschland als Rohstoffexporteur (15 % BIP, halb staatlich, Fonds 20 % BIP).
const ROH: Landesdaten = {
  ...DE,
  start: {
    ...DE.start,
    rohstoffExporte: 15,
    rohstoffStaat: 0.5,
    rohstoffFonds0: 20,
    rohstoffGewichte: { oel: 0.6, gas: 0.3, metalle: 0.1 },
  },
};
ROH.standards = kalibriereStandards(ROH);

describe("Rohstoffe (Update 4a)", () => {
  it("Preis-Einbruch: mit Fonds bleibt der Haushalt stabil, ohne nicht", () => {
    const welt = {
      oel: [{ ab: ROH.datenstand + 3, wert: 35 }],
      gas: [{ ab: ROH.datenstand + 3, wert: 17 }],
    };
    const mit = rechne(ROH, { ...basisSzenario(ROH, 11), welt, stell: { "rohstoff.fondsAnteil": 100 } });
    const ohne = rechne(ROH, { ...basisSzenario(ROH, 11), welt, stell: { "rohstoff.fondsAnteil": 0 } });
    expect(Math.abs(mit[4].rohstoffHaushalt)).toBeLessThan(0.5);
    expect(ohne[4].rohstoffHaushalt).toBeLessThan(-2);
    expect(mit[4].rohstoffFonds).toBeLessThan(mit[2].rohstoffFonds);
  });
  it("Holländische Krankheit: Preisboom wertet auf, Exporte ohne Rohstoffe fallen", () => {
    const b = rechne(ROH, basisSzenario(ROH, 11));
    const r = rechne(ROH, { ...basisSzenario(ROH, 11), welt: { oel: 140, gas: 70 } });
    expect(r[8].wechselkurs).toBeGreaterThan(b[8].wechselkurs);
    expect(r[8].exporteOhneRohstoffe).toBeLessThan(b[8].exporteOhneRohstoffe);
  });
  it("Förderverfall bei hohem Staatsanteil und schwachem Rechtsstaat", () => {
    const r = rechne(ROH, {
      ...basisSzenario(ROH, 21),
      stell: { "ordnung.staatsanteil": 60, "ordnung.rechtsstaat": 40 },
    });
    expect(r[20].foerderZustand).toBeLessThan(0.5);
  });
  it("Sanktionen: Diversifizierung dämpft", () => {
    const s = [{ id: 1, art: "rohstoffsanktion" as const, jahr: ROH.datenstand + 1, staerke: 1, dauer: 1 }];
    const eng = rechne(ROH, { ...basisSzenario(ROH, 6), schocks: s, stell: { "rohstoff.diversifizierung": 0 } });
    const breit = rechne(ROH, { ...basisSzenario(ROH, 6), schocks: s, stell: { "rohstoff.diversifizierung": 1 } });
    expect(breit[1].rohstoffExporte).toBeGreaterThan(eng[1].rohstoffExporte);
  });
  it("Grenzfall: Rohstoff-Regler in Deutschland wirken nicht", () => {
    const r = rechne(DE, {
      ...basisSzenario(DE, 11),
      stell: { "rohstoff.foerderung": 200, "rohstoff.fondsAnteil": 100 },
    });
    expect(r[10].schuldQuote).toBe(rechne(DE, basisSzenario(DE, 11))[10].schuldQuote);
  });
});

describe("T7-Patch", () => {
  it("Rohstoffgewichte alle 0: keine Division durch 0", () => {
    const L: Landesdaten = { ...ROH, start: { ...ROH.start, rohstoffGewichte: { oel: 0, gas: 0, metalle: 0 } } };
    const r = rechne(L, basisSzenario(L, 6));
    for (const z of r) expect(Number.isFinite(z.rohstoffExporte)).toBe(true);
  });
});
