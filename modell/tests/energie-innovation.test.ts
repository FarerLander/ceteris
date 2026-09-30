import { energie } from "../bausteine/energie";
import { innovation } from "../bausteine/innovation";
import { ordnung } from "../bausteine/ordnung";
import { basisSzenario, rechne } from "../rechne";
import type { Szenario } from "../typen";
import { testland } from "./testland";

const land = testland();
const lauf = (
  bs: Parameters<typeof rechne>[2],
  stell: Szenario["stell"] = {},
  jahre = 51,
  extra: Partial<Szenario> = {},
) => rechne(land, { ...basisSzenario(land, jahre), stell, ...extra }, bs);

describe("Ordnung (Phase 1 neutral)", () => {
  it("setzt alle Ausgaben auf null", () => {
    const v = lauf([ordnung], {}, 3);
    expect(v[2].investAufschlag).toBe(0);
    expect(v[2].knappheit).toBe(0);
  });
});

describe("Energie", () => {
  it("startet nahe Index 100", () => {
    const v = lauf([energie], {}, 2);
    expect(v[1].energiepreis).toBeGreaterThan(95);
    expect(v[1].energiepreis).toBeLessThan(105);
  });
  it("Mix bleibt eine gültige Verteilung, auch bei Höchsttempo und Atom-Neubau", () => {
    const v = lauf([energie], { "energie.ausbauTempo": 6, "energie.atom": 2 });
    for (const z of v) {
      const m = z.mix;
      expect(m.kohle + m.gas + m.oel + m.atom + m.ern).toBeCloseTo(1, 9);
      expect(
        Math.min(m.kohle, m.gas, m.oel, m.atom, m.ern),
      ).toBeGreaterThanOrEqual(0);
    }
  });
  it("Kohleausstieg 2030 bringt Kohle 2030 auf null", () => {
    const v = lauf([energie], { "energie.kohleausstieg": 2030 }, 7);
    expect(v[4].mix.kohle).toBeGreaterThan(0);
    expect(v[5].mix.kohle).toBe(0);
  });
  it("höherer CO₂-Preis: sofort teurer, langfristig weniger CO₂", () => {
    const a = lauf([energie], { "energie.co2Preis": 70 }, 11),
      b = lauf([energie], { "energie.co2Preis": 200 }, 11);
    expect(b[1].energiepreis).toBeGreaterThan(a[1].energiepreis + 10);
    expect(b[10].co2Mt).toBeLessThan(a[10].co2Mt);
  });
  it("Lieferstopp verteuert Energie, Diversifizierung dämpft", () => {
    const schocks = [
      { id: 1, art: "sanktionen" as const, jahr: 2030, staerke: 1, dauer: 1 },
    ];
    const eng = lauf([energie], { "energie.diversifizierung": 0 }, 7, {
      schocks,
    });
    const breit = lauf([energie], { "energie.diversifizierung": 1 }, 7, {
      schocks,
    });
    expect(eng[5].energiepreis - eng[4].energiepreis).toBeGreaterThan(
      breit[5].energiepreis - breit[4].energiepreis,
    );
    expect(breit[5].energiepreis).toBeGreaterThan(breit[4].energiepreis);
  });
});

describe("Innovation", () => {
  it("mehr F&E wirkt verzögert auf den Innovationsbeitrag", () => {
    const v = lauf([innovation], { "innov.fue": 4.1 }, 31);
    expect(v[1].innovBeitrag).toBeCloseTo((0.2 * (1 / 7)) / 100, 9);
    expect(v[30].innovBeitrag).toBeGreaterThan(0.0019);
    expect(v[30].innovBeitrag).toBeLessThanOrEqual(0.002);
  });
  it("niedrigere Exit-Steuer hebt Wagniskapital", () => {
    const v = lauf([innovation], { "innov.exitSteuer": 0.16 }, 2);
    expect(v[1].vcQuote).toBeCloseTo(0.07 * 1.2, 9);
  });
});
