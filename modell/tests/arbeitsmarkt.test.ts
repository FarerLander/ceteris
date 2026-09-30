import { basisSzenario, rechne } from "../rechne";
import type { Szenario } from "../typen";
import { testland } from "./testland";

const land = testland({ nairu: 7, alq: 7 });
const lauf = (stell: Szenario["stell"] = {}, welt: Szenario["welt"] = {}) =>
  rechne(land, { ...basisSzenario(land, 21), stell, welt });

describe("Arbeitsmarkt-Trend (M15)", () => {
  it("NAIRU und Erwerbsquote sind Stellschrauben mit dem Startwert des Landes als Standard", () => {
    expect(land.standards["arbeit.nairu"]).toBe(7);
    expect(land.standards["arbeit.erwerbsquote"]).toBe(0.78);
  });
  it("eine niedrigere NAIRU senkt die Arbeitslosigkeit schrittweise", () => {
    const basis = lauf(), reform = lauf({ "arbeit.nairu": 4 });
    expect(reform[1].alq).toBeGreaterThan(4.5);
    expect(reform[1].alq).toBeLessThan(basis[1].alq);
    expect(reform[15].alq).toBeLessThan(4.5);
  });
  it("eine höhere Erwerbsquote hebt die Erwerbspersonen schrittweise", () => {
    const basis = lauf(), mehr = lauf({ "arbeit.erwerbsquote": 0.84 });
    expect(mehr[1].erwerbspersonen).toBeGreaterThan(basis[1].erwerbspersonen);
    expect(mehr[15].erwerbspersonen / basis[15].erwerbspersonen).toBeGreaterThan(1.06);
  });
});

describe("Erwerbsquoten-Trend des Landes (M24)", () => {
  it("hebt die Erwerbsquote über die Trendjahre und hört dann auf", () => {
    const mitTrend = testland({ erwerbsquoteTrend: 0.003, erwerbsquoteTrendJahre: 10 });
    const v = rechne(mitTrend, basisSzenario(mitTrend, 31));
    expect(v[5].eqEff).toBeGreaterThan(0.78);
    expect(v[30].eqEff).toBeCloseTo(0.81, 2);
    expect(mitTrend.standards["arbeit.erwerbsquote"]).toBe(0.78);
  });
  it("ohne Trend bleibt die Erwerbsquote beim Startwert", () => {
    expect(lauf()[20].eqEff).toBeCloseTo(0.78, 6);
  });
});

describe("Laufzeitprämie folgt der Welt (M16)", () => {
  it("ein weltweiter Prämienrückgang senkt die Rendite", () => {
    const basis = lauf(), tief = lauf({}, { praemieWelt: -2 });
    expect(tief[5].rendite).toBeCloseTo(basis[5].rendite - 2, 0);
  });
});
