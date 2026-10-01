import { describe, expect, it } from "vitest";
import { LAENDER } from "../../app/land";
import { basisSzenario, rechne } from "../rechne";

const CN = LAENDER.CN;
const RU = LAENDER.RU;

describe("Update 4b: China und Russland", () => {
  it("China: verdeckte Schuld im Basislauf ohne Übernahme; mit mehr Kreditlenkung übernimmt der Staat", () => {
    const b = rechne(CN, basisSzenario(CN, 51));
    expect(b[0].verdeckteSchuld).toBe(35);
    expect(b.every((z) => z.uebernahme === 0)).toBe(true);
    // Seit dem gleitenden Investitionsanker investiert China weniger; bei 70 bleibt die verdeckte Schuld knapp unter der Schwelle.
    const r = rechne(CN, { ...basisSzenario(CN, 51), stell: { "ordnung.kreditlenkung": 90 } });
    expect(r.some((z) => z.uebernahme > 0)).toBe(true);
  });
  it("Russland: Ölpreis 35 $ ab Jahr 3 — Haushalt verliert, Fonds zahlt aus", () => {
    const welt = { oel: [{ ab: RU.datenstand + 3, wert: 35 }] };
    // Mit den Standardwerten: Russlands Haushaltsregel leitet Mehreinnahmen in den Fonds (Landesstandard).
    const b = rechne(RU, basisSzenario(RU, 11));
    const r = rechne(RU, { ...basisSzenario(RU, 11), welt });
    expect(r[5].rohstoffExporte).toBeLessThan(b[5].rohstoffExporte - 2);
    expect(r[5].rohstoffFonds).toBeLessThan(b[5].rohstoffFonds);
    for (const z of r) expect(Number.isFinite(z.schuldQuote)).toBe(true);
  });
  it("Russland: Hyperinflations-Szenario treibt die Rohstofferlöse nicht ins Absurde", () => {
    const r = rechne(RU, {
      ...basisSzenario(RU, 51),
      stell: { "staat.uebrige": RU.standards["staat.uebrige"] + 20, "ordnung.notenbankfinanzierung": 100 },
    });
    // Größenordnung, nicht Punktwert: seit 13.5 Teil B fallen in der Depression auch die Investitionen,
    // das BIP liegt etwas tiefer und die Quote etwas höher (62 statt 58 % BIP).
    expect(Math.max(...r.map((z) => z.rohstoffExporte))).toBeLessThan(70);
  });
  for (const [code, L] of [["CN", CN], ["RU", RU]] as const) {
    it(`${code}: Basislauf ohne Schwarzmarkt, Startjahr ruhig, 100 Jahre rechenbar`, () => {
      const r = rechne(L, basisSzenario(L, 101));
      // Schwarzmarkt über den Standardzeitraum; gegen Ende des Jahrhunderts treiben Schuldenkrisen ihn hoch.
      expect(Math.max(...r.slice(0, 51).map((z) => z.schwarzmarkt))).toBeLessThan(5);
      // Ruhiger Start der Mechanik, ohne den Haushaltsplan (M29), der das erste Jahr gewollt verschiebt.
      const ruhig = rechne(L, { ...basisSzenario(L, 3), grund: { ...L.grund, haushaltsplan: "aus" } });
      expect(Math.abs(ruhig[1].primaer - ruhig[0].primaer)).toBeLessThan(1);
      for (const z of r) {
        expect(z.bev, `${z.jahr}`).toBeGreaterThan(0);
        for (const [f, v] of Object.entries(z))
          if (typeof v === "number") expect(Number.isFinite(v), `${z.jahr} ${f}`).toBe(true);
      }
    });
  }
  it("Russland: gelenkter Basislauf überhitzt nicht, Rendite hängt nicht auf Kriegsniveau", () => {
    const r = rechne(RU, basisSzenario(RU, 51));
    const z = r.find((x) => x.jahr === 2045)!;
    expect(Math.abs(z.luecke)).toBeLessThan(0.015);
    expect(z.alq).toBeGreaterThan(2.2);
    expect(z.rendite).toBeLessThan(8);
  });
});
