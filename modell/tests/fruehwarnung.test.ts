import { describe, expect, it } from "vitest";
import { LAENDER } from "../../app/land";
import DE from "../../daten/laender/DE.json";
import { hp } from "../../daten/schaetzung/hp";
import { KREDIT_LAMBDA, kreditGewichte } from "../fruehwarnung";
import { basisSzenario, rechne } from "../rechne";
import type { Landesdaten } from "../typen";

const mitStart = (
  land: Landesdaten,
  werte: Partial<Landesdaten["start"]>,
): Landesdaten => ({
  ...land,
  start: { ...land.start, ...werte },
});

describe("13.2 Frühwarnung im Rechenkern", () => {
  it("stationäre Verstärkung für λ = 1.562,5", () => {
    const [g0, g1] = kreditGewichte(KREDIT_LAMBDA);
    expect(g0).toBeCloseTo(0.2016, 3);
    expect(g1).toBeCloseTo(0.0226, 3);
  });

  it("Rekursion trifft den einseitigen HP-Filter auf der deutschen Privatschuld", () => {
    const r = (
      DE as unknown as { reihen: { privatschuld: Record<string, number> } }
    ).reihen.privatschuld;
    const y = Object.keys(r)
      .map(Number)
      .sort((a, b) => a - b)
      .map((j) => r[j]);
    const [g0, g1] = kreditGewichte(KREDIT_LAMBDA);
    const t0 = 19;
    const start = hp(y.slice(0, t0 + 1), KREDIT_LAMBDA);
    let L = start[t0],
      S = start[t0] - start[t0 - 1];
    for (let t = t0 + 1; t < y.length; t++) {
      const p = L + S,
        e = y[t] - p;
      L = p + g0 * e;
      S += g1 * e;
      expect(
        Math.abs(L - hp(y.slice(0, t + 1), KREDIT_LAMBDA)[t]),
      ).toBeLessThan(0.3);
    }
  });

  it("Startlücke: ohne Trend 0, mit Trend = Privatschuld − 15 genau 15", () => {
    const DEland = LAENDER.DE;
    expect(
      rechne(
        mitStart(DEland, {
          kreditTrend0: undefined,
          kreditSteigung0: undefined,
        }),
        basisSzenario(DEland, 2),
      )[0].kreditluecke,
    ).toBe(0);
    const z = rechne(
      mitStart(DEland, {
        kreditTrend0: DEland.start.privatschuld - 15,
        kreditSteigung0: 0,
      }),
      basisSzenario(DEland, 2),
    )[0];
    expect(z.kreditluecke).toBeCloseTo(15, 10);
  });

  it("Euro-Land: Zinskurve misst am Euroraum-Leitzins", () => {
    const land = LAENDER.DE;
    const sz = {
      ...basisSzenario(land, 6),
      welt: { euroLeitzins: [{ ab: land.datenstand, wert: 2 }, { ab: land.datenstand + 3, wert: 8 }] },
    };
    const z = rechne(land, sz)[3];
    expect(z.zinskurve).toBeCloseTo(z.rendite - 8, 10);
  });

  it("anderes Regime: Zinskurve misst am eigenen Leitzins", () => {
    const land = LAENDER.US;
    const z = rechne(land, basisSzenario(land, 4))[2];
    expect(z.zinskurve).toBeCloseTo(z.rendite - z.leitzins, 10);
  });

  it("alle Länder 101 Jahre und Hyperinflation: Felder endlich", () => {
    const laeufe = Object.values(LAENDER).map((l) =>
      rechne(l, basisSzenario(l, 101)),
    );
    const RU = LAENDER.RU;
    laeufe.push(
      rechne(RU, {
        ...basisSzenario(RU, 30),
        stell: {
          "staat.uebrige": RU.standards["staat.uebrige"] + 20,
          "ordnung.notenbankfinanzierung": 100,
        },
      }),
    );
    for (const r of laeufe)
      for (const z of r)
        for (const f of [
          "zinskurve",
          "kreditTrend",
          "kreditSteigung",
          "kreditluecke",
        ] as const)
          expect(Number.isFinite(z[f]), `${z.jahr} ${f}`).toBe(true);
  });
});
