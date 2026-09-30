import { describe, expect, it } from "vitest";
import { kalman, type System } from "./kalman";
import { inv, mal, einheit } from "./matrix";

// Lokales Niveau: x_t = x_{t−1} + η (q), y_t = x_t + ε (h)
function niveau(y: (number | null)[], q = 1, h = 1): System {
  return {
    m: 1,
    T: () => [[1]],
    c: () => [0],
    Q: [[q]],
    Z: [[1]],
    d: () => [0],
    H: [[h]],
    y: y.map((v) => [v]),
    x0: [0],
    P0: [[1e4]],
    diffus: 1,
  };
}
function zufall(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const normal = (u: () => number) =>
  Math.sqrt(-2 * Math.log(u() || 1e-12)) * Math.cos(2 * Math.PI * u());

describe("Matrix", () => {
  it("inv · a = Einheit", () => {
    const a = [
      [4, 1, 0],
      [1, 3, 1],
      [0, 1, 2],
    ];
    mal(inv(a), a).forEach((z, i) =>
      z.forEach((v, j) => expect(v).toBeCloseTo(i === j ? 1 : 0, 12)),
    );
  });
  it("singulär wirft", () =>
    expect(() =>
      inv([
        [1, 2],
        [2, 4],
      ]),
    ).toThrow());
  it("einheit", () =>
    expect(einheit(2)).toEqual([
      [1, 0],
      [0, 1],
    ]));
});

describe("Kalman", () => {
  it("konstante Reihe: geglättet überall der Wert", () => {
    const r = kalman(niveau(Array(30).fill(5), 0.01, 1));
    r.xs.forEach((x) => expect(x[0]).toBeCloseTo(5, 1));
  });
  it("stationäre Varianz q = h = 1: P = 0,618 (goldener Schnitt)", () => {
    const r = kalman(niveau(Array(60).fill(0)));
    expect(r.Pf[59][0][0]).toBeCloseTo((Math.sqrt(5) - 1) / 2, 6);
  });
  it("Glätter am Ende = Filter", () => {
    const r = kalman(niveau([1, 3, 2, 5, 4]));
    expect(r.xs[4][0]).toBe(r.xf[4][0]);
    expect(r.Ps[4][0][0]).toBe(r.Pf[4][0][0]);
  });
  it("fehlender Wert: Filter übernimmt die Vorhersage, Glätter liegt dazwischen", () => {
    const r = kalman(niveau([4, 4, 4, null, 6, 6, 6], 1, 0.01));
    expect(r.xf[3][0]).toBeCloseTo(r.xf[2][0], 10);
    expect(r.Pf[3][0][0]).toBeCloseTo(r.Pf[2][0][0] + 1, 10);
    expect(r.xs[3][0]).toBeCloseTo(5, 1);
  });
  it("κ² ≈ 1, wenn die Daten aus genau diesen Varianzen stammen", () => {
    const u = zufall(7);
    let x = 0;
    const y = Array.from(
      { length: 2000 },
      () => ((x += normal(u)), x + normal(u)),
    );
    expect(kalman(niveau(y)).kappa2).toBeGreaterThan(0.9);
    expect(kalman(niveau(y)).kappa2).toBeLessThan(1.1);
  });
  it("κ² ≈ 4, wenn alle Störungen doppelt so groß sind", () => {
    const u = zufall(11);
    let x = 0;
    const y = Array.from(
      { length: 2000 },
      () => ((x += 2 * normal(u)), x + 2 * normal(u)),
    );
    expect(kalman(niveau(y)).kappa2).toBeGreaterThan(3.5);
    expect(kalman(niveau(y)).kappa2).toBeLessThan(4.5);
  });
});
