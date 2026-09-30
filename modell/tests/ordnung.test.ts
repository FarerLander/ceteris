import { describe, expect, it } from "vitest";
import { DE } from "../../app/land";
import { basisSzenario, rechne } from "../rechne";

const lauf = (stell: Record<string, number>) =>
  rechne(DE, { ...basisSzenario(DE, 31), stell });

describe("Wirtschaftsordnung (Update 4a)", () => {
  it("Rechtsstaat runter: Investitionen sinken, Abwanderung steigt, Produktivität sinkt mit Verzug", () => {
    const b = lauf({}),
      r = lauf({ "ordnung.rechtsstaat": 40 });
    expect(r[3].investQuote).toBeLessThan(b[3].investQuote - 1);
    expect(r[5].abwanderungOrdnung).toBeGreaterThan(0);
    expect(r[30].A / b[30].A).toBeLessThan(r[5].A / b[5].A);
    expect(r[30].A / b[30].A).toBeLessThan(0.9);
  });
  it("Staatsanteil hoch: Verluste im Haushalt, Produktivität niedriger", () => {
    const b = lauf({}),
      r = lauf({ "ordnung.staatsanteil": 50 });
    expect(r[10].staatsbetriebVerlust).toBeCloseTo(0.03 * 45, 6);
    expect(r[30].A).toBeLessThan(b[30].A);
    expect(r[10].schuldQuote).toBeGreaterThan(b[10].schuldQuote);
  });
  it("umstrittene Wirkstärke aus: Ergebnis wie Basis nur über diesen Kanal", () => {
    const aus = rechne(DE, {
      ...basisSzenario(DE, 31),
      stell: { "ordnung.staatsanteil": 50 },
      aus: ["ordnung.staatsbetriebVerlust", "ordnung.staatTfp"],
    });
    expect(aus[30].schuldQuote).toBe(lauf({})[30].schuldQuote);
  });
});
