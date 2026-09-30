import { describe, expect, it } from "vitest";
import DE from "../laender/DE.json";
import type { AutoDatei } from "../typen";
import { letztesJahr, reihenAus } from "./reihen";

const auto = (reihen: AutoDatei["reihen"]): AutoDatei => ({
  code: "XX",
  iso3: "XXX",
  abgerufen: "2026-01-01",
  reihen,
  quellen: {},
  fehlend: [],
});

describe("Reihen für den Filter", () => {
  it("verkettet das reale Wachstum in 100·ln", () => {
    const r = reihenAus(
      auto({
        wachstumReal: { 2000: 0, 2001: 2, 2002: -1 },
        alq: {},
        inflation: {},
      }),
      2000,
      2002,
    );
    expect(r.y[0]).toBe(0);
    expect(r.y[1]).toBeCloseTo(100 * Math.log(1.02), 12);
    expect(r.y[2]).toBeCloseTo(100 * (Math.log(1.02) + Math.log(0.99)), 12);
  });
  it("fehlende Werte werden null, Vorjahresinflation verschoben", () => {
    const r = reihenAus(
      auto({
        wachstumReal: { 2000: 1, 2001: 1 },
        alq: { 2001: 5 },
        inflation: { 1999: 1, 2000: 2 },
      }),
      2000,
      2001,
    );
    expect(r.alq).toEqual([null, 5]);
    expect(r.infl).toEqual([2, null]);
    expect(r.inflVj).toEqual([1, 2]);
    expect(r.kurz).toEqual([null, null]);
  });
  it("Lücke im Wachstum wirft", () => {
    expect(() =>
      reihenAus(
        auto({ wachstumReal: { 2000: 1, 2002: 1 }, alq: {}, inflation: {} }),
        2000,
        2002,
      ),
    ).toThrow(/2001/);
  });
  it("Deutschland: 26 Jahre bis zum Datenstand", () => {
    const a = DE as unknown as AutoDatei;
    const bis = letztesJahr(a);
    const r = reihenAus(a, 2000, bis);
    expect(r.jahre.length).toBe(bis - 1999);
    expect(r.alq.every((x) => x !== null)).toBe(true);
  });
});
