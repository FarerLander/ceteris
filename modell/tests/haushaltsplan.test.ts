import { describe, expect, it } from "vitest";
import { planImpuls, planWert } from "../haushaltsplan";
import { basisSzenario, rechne } from "../rechne";
import type { Landesdaten } from "../typen";
import { testland } from "./testland";

// M29: Haushaltsplan je Land, Pp. BIP Verbesserung des Primärsaldos gegenüber heute.
const mitPlan = (): Landesdaten => {
  const l = testland();
  const s = l.datenstand;
  return { ...l, plan: { datenstand: s, quelle: "Test", stand: "2026-09", werte: { [s + 1]: 1, [s + 2]: 2 }, impuls: { [s + 1]: 0.5, [s + 2]: 0.5 } } };
};

describe("Haushaltsplan", () => {
  it("Wert je Jahr: 0 vor dem Plan, danach der letzte Wert", () => {
    const l = mitPlan(), g = l.grund, s = l.datenstand;
    expect(planWert(l, g, s)).toBe(0);
    expect(planWert(l, g, s + 1)).toBe(1);
    expect(planWert(l, g, s + 2)).toBe(2);
    expect(planWert(l, g, s + 80)).toBe(2);
    expect(planWert(l, { ...g, haushaltsplan: "aus" }, s + 2)).toBe(0);
    expect(planImpuls(l, g, s + 2)).toBe(0.5);
    expect(planImpuls(l, { ...g, haushaltsplan: "aus" }, s + 2)).toBe(0);
  });
  it("Prüfung 1: Nachfrage sieht nur den Impuls, nicht den Ausgleich der Modell-Drift", () => {
    const l = mitPlan();
    const g = { ...l.grund, politik: "fest" as const };
    const voll = { ...l, plan: { ...l.plan!, impuls: l.plan!.werte } };
    const an = rechne(l, { ...basisSzenario(l, 5), grund: g });
    const mitVoll = rechne(voll, { ...basisSzenario(voll, 5), grund: g });
    expect(an[2].plan).toBe(mitVoll[2].plan);
    // Weniger Impuls, weniger Bremse: Das Wachstum im zweiten Planjahr liegt höher.
    expect(an[2].wachstum).toBeGreaterThan(mitVoll[2].wachstum);
  });
  it("wirkt nicht bei anderem Datenstand und ohne Plan", () => {
    const l = mitPlan();
    expect(planWert({ ...l, plan: { ...l.plan!, datenstand: l.datenstand + 1 } }, l.grund, l.datenstand + 2)).toBe(0);
    const t = testland();
    expect(planWert(t, t.grund, t.datenstand + 2)).toBe(0);
  });
  it("aus rechnet wie ohne Plan, bitgenau", () => {
    const l = mitPlan();
    const g = { ...l.grund, politik: "fest" as const };
    const aus = rechne(l, { ...basisSzenario(l), grund: { ...g, haushaltsplan: "aus" } });
    const t = testland();
    const ohne = rechne(t, { ...basisSzenario(t), grund: g });
    expect(aus.map((z) => z.schuldQuote)).toEqual(ohne.map((z) => z.schuldQuote));
  });
  it("an: Primärsaldo besser um den Plan, Nachfrage schwächer, 101 Jahre ohne NaN", () => {
    const l = mitPlan();
    const g = { ...l.grund, politik: "fest" as const };
    const an = rechne(l, { ...basisSzenario(l, 101), grund: g });
    const aus = rechne(l, { ...basisSzenario(l, 101), grund: { ...g, haushaltsplan: "aus" } });
    expect(an[2].plan).toBe(2);
    expect(an[1].primaer - aus[1].primaer).toBeGreaterThan(0.5);
    expect(an[1].wachstum).toBeLessThan(aus[1].wachstum);
    expect(an[30].schuldQuote).toBeLessThan(aus[30].schuldQuote);
    expect(an.every((z) => Number.isFinite(z.schuldQuote))).toBe(true);
  });
});
