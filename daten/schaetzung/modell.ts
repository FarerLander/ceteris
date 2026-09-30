// Zustandsraummodell für Potenzial, Produktionslücke, NAIRU und neutralen Realzins (Spec 13.1).
// Vorbilder: Laubach/Williams 2003 (r* = g + z), OECD-NAIRU (Richardson u. a. 2000).
// Die Wirkstärken sind die des Simulators, damit Startwerte und Mechanik zusammenpassen.
import { kalman } from "./kalman";
import { diag, type Mat } from "./matrix";
import type { Reihen } from "./reihen";

export interface Parameter {
  okun: number;
  phillips: number;
  persistenz: number;
  zinsWirkung: number;
  anker: number;
  ziel: number;
}

// Standardabweichungen der Störungen vor κ, in % bzw. Pp. pro Jahr (Begründung in docs/quellen.md).
export const SIGMA = {
  yStern: 0.3,
  g: 0.1,
  luecke: 1.2,
  nairu: 0.25,
  z: 0.2,
  y: 0.1,
  alq: 0.3,
  infl: 1.0,
};

export interface Punkt {
  jahr: number;
  wert: number;
  band: number;
}

export interface Schaetzung {
  kappa: number;
  g: Punkt[];
  luecke: Punkt[];
  nairu: Punkt[];
  rStern: Punkt[] | null;
}

const [G, C, U, Z] = [1, 2, 3, 4]; // Zustand [y*, g, c, u*, z]

export function schaetze(r: Reihen, p: Parameter): Schaetzung {
  // Erwartete Inflation wie in geld.ts, Realzins wie in wachstum.ts
  const erw = r.inflVj.map((v) =>
    v === null ? null : p.anker * p.ziel + (1 - p.anker) * v,
  );
  const zins = r.kurz.map((i, t) =>
    i === null || erw[t] === null ? null : i - (erw[t] as number),
  );
  const mitZins = zins.some((x) => x !== null);
  const beta = (t: number) =>
    t > 0 && zins[t - 1] !== null ? p.zinsWirkung : 0;
  const T = (t: number): Mat => [
    [1, 1, 0, 0, 0],
    [0, 1, 0, 0, 0],
    [0, beta(t), p.persistenz, 0, beta(t)],
    [0, 0, 0, 1, 0],
    [0, 0, 0, 0, 1],
  ];
  const anfang = r.y.slice(0, 6);
  const g0 =
    anfang.length > 1
      ? (anfang[anfang.length - 1] - anfang[0]) / (anfang.length - 1)
      : 0;
  const e = kalman({
    m: 5,
    T,
    c: (t) => [0, 0, -beta(t) * (t > 0 ? (zins[t - 1] ?? 0) : 0), 0, 0],
    Q: diag(
      [SIGMA.yStern, SIGMA.g, SIGMA.luecke, SIGMA.nairu, SIGMA.z].map(
        (s) => s * s,
      ),
    ),
    Z: [
      [1, 0, 1, 0, 0],
      [0, 0, -p.okun, 1, 0],
      [0, 0, p.phillips, 0, 0],
    ],
    d: (t) => [0, 0, erw[t] ?? 0],
    H: diag([SIGMA.y, SIGMA.alq, SIGMA.infl].map((s) => s * s)),
    y: r.jahre.map((_, t) => [
      r.y[t],
      r.alq[t],
      r.infl[t] === null || erw[t] === null ? null : r.infl[t],
    ]),
    x0: [r.y[0], g0, 0, r.alq[0] ?? 5, 0],
    P0: diag([1e4, 1e4, 1e4, 1e4, 1e4]),
    diffus: 3,
  });
  const kappa = Math.sqrt(e.kappa2);
  const reihe = (i: number): Punkt[] =>
    r.jahre.map((jahr, t) => ({
      jahr,
      wert: e.xs[t][i],
      band: kappa * Math.sqrt(e.Ps[t][i][i]),
    }));
  return {
    kappa,
    g: reihe(G),
    luecke: reihe(C),
    nairu: reihe(U),
    rStern: mitZins
      ? r.jahre.map((jahr, t) => ({
          jahr,
          wert: e.xs[t][G] + e.xs[t][Z],
          band:
            kappa *
            Math.sqrt(e.Ps[t][G][G] + e.Ps[t][Z][Z] + 2 * e.Ps[t][G][Z]),
        }))
      : null,
  };
}
