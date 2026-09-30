import { describe, expect, it } from "vitest";
import { hp } from "./hp";
import { schaetze, type Parameter } from "./modell";
import type { Reihen } from "./reihen";
import { startwerte } from "./startwerte";

const P: Parameter = {
  okun: 0.5,
  phillips: 0.3,
  persistenz: 0.5,
  zinsWirkung: 0.3,
  anker: 0.7,
  ziel: 2,
};
const n = 26;
const jahre = Array.from({ length: n }, (_, i) => 2000 + i);
// Ruhiges Land: 1,5 % Wachstum, ALQ 5, Inflation am Ziel, Realzins 1, Erwerbspersonen +0,5 %/Jahr
function ruhig(over: Partial<Reihen> = {}): Reihen {
  return {
    jahre,
    y: jahre.map((_, i) => 1.5 * i),
    alq: jahre.map(() => 5),
    infl: jahre.map(() => 2),
    inflVj: jahre.map(() => 2),
    kurz: jahre.map(() => 3),
    erwerbspersonen: jahre.map((_, i) => 40 * Math.exp(0.005 * i)),
    ...over,
  };
}

describe("Zustandsraummodell", () => {
  it("ruhiges Land: g = 1,5, NAIRU = 5, Lücke 0, r* = 1", () => {
    const s = schaetze(ruhig(), P);
    const e = n - 1;
    expect(s.g[e].wert).toBeCloseTo(1.5, 1);
    expect(s.nairu[e].wert).toBeCloseTo(5, 1);
    expect(s.luecke[e].wert).toBeCloseTo(0, 1);
    expect(s.rStern![e].wert).toBeCloseTo(1, 0);
  });
  it("dauerhaft höhere ALQ ab 2012 ohne Inflationsdruck: NAIRU folgt", () => {
    const s = schaetze(ruhig({ alq: jahre.map((j) => (j < 2012 ? 5 : 8)) }), P);
    expect(s.nairu[n - 1].wert).toBeGreaterThan(7);
  });
  it("Rezession mit sinkender Inflation: negative Lücke, NAIRU bleibt", () => {
    const y = jahre.map((j, i) => 1.5 * i - (j >= 2023 ? 3 : 0));
    const alq = jahre.map((j) => (j >= 2023 ? 6.5 : 5));
    const infl = jahre.map((j) => (j >= 2023 ? 1 : 2));
    const inflVj = jahre.map((j) => (j >= 2024 ? 1 : 2));
    const s = schaetze(ruhig({ y, alq, infl, inflVj }), P);
    expect(s.luecke[n - 1].wert).toBeLessThan(-1);
    expect(s.nairu[n - 1].wert).toBeLessThan(6);
  });
  it("ohne Kurzfristzins: r* null, Rest geschätzt", () => {
    const s = schaetze(ruhig({ kurz: jahre.map(() => null) }), P);
    expect(s.rStern).toBeNull();
    expect(s.g[n - 1].wert).toBeCloseTo(1.5, 1);
  });
  it("Zins mit Lücken (Russland ab 2022): läuft, alles endlich", () => {
    const s = schaetze(
      ruhig({ kurz: jahre.map((j) => (j >= 2022 ? null : 3)) }),
      P,
    );
    expect(Number.isFinite(s.rStern![n - 1].wert)).toBe(true);
    expect(Number.isFinite(s.rStern![n - 1].band)).toBe(true);
  });
  it("Bänder am Rand breiter als in der Mitte (Glätter)", () => {
    const s = schaetze(ruhig({ alq: jahre.map((_, i) => 5 + Math.sin(i)) }), P);
    expect(s.nairu[n - 1].band).toBeGreaterThan(s.nairu[12].band);
  });
});

describe("HP-Gegenprobe", () => {
  it("lineare Reihe bleibt unverändert", () => {
    hp(
      jahre.map((_, i) => 2 * i),
      6.25,
    ).forEach((v, i) => expect(v).toBeCloseTo(2 * i, 8));
  });
});

describe("Startwerte und Plausibilität", () => {
  it("tfpTrend = (1−α)(g − gL): 0,65 · (1,5 − 0,5) = 0,65", () => {
    const r = ruhig();
    const w = startwerte(schaetze(r, P), r, 0.35);
    const tfp = w.find((x) => x.groesse === "tfpTrend")!;
    expect(tfp.wert).toBeCloseTo(0.65, 1);
    expect(tfp.gueltig).toBe(true);
    expect(tfp.hp).toBeCloseTo(0.65, 1);
    expect(w.map((x) => x.groesse)).toEqual([
      "tfpTrend",
      "nairu",
      "rStern",
      "luecke",
    ]);
  });
  it("Hyperinflationsjahr: κ zu groß oder Band zu breit → ungültig mit Grund, nichts NaN", () => {
    const infl = jahre.map((j) => (j === 2015 ? 400 : 2));
    const inflVj = jahre.map((j) => (j === 2016 ? 400 : 2));
    const r = ruhig({ infl, inflVj });
    const w = startwerte(schaetze(r, P), r, 0.35);
    expect(w.some((x) => !x.gueltig && x.grund)).toBe(true);
    w.forEach((x) => {
      expect(Number.isFinite(x.wert)).toBe(true);
      expect(Number.isFinite(x.band)).toBe(true);
    });
  });
  it("ohne Kurzfristzins: rStern ungültig mit Grund", () => {
    const r = ruhig({ kurz: jahre.map(() => null) });
    const rs = startwerte(schaetze(r, P), r, 0.35).find(
      (x) => x.groesse === "rStern",
    )!;
    expect(rs).toMatchObject({
      gueltig: false,
      grund: "kein Kurzfristzins",
      wert: 0,
      band: 0,
    });
  });
  it("Wert außerhalb des Bereichs: ungültig", () => {
    const r = ruhig({ y: jahre.map((_, i) => 9 * i) }); // 9 % Potenzialwachstum
    const tfp = startwerte(schaetze(r, P), r, 0.35).find(
      (x) => x.groesse === "tfpTrend",
    )!;
    expect(tfp.gueltig).toBe(false);
    expect(tfp.grund).toMatch(/außerhalb/);
  });
});
