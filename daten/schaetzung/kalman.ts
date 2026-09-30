// Kalman-Filter und Rauch-Tung-Striebel-Glätter (Durbin/Koopman 2012, Kap. 4). Läuft nur im Datenskript (Spec 13.1).
import { inv, mal, malV, minus, plus, trans, type Mat } from "./matrix";

export interface System {
  m: number; // Zustände
  T: (t: number) => Mat; // Übergang in Schritt t (x_t = T(t)·x_{t−1} + c(t) + η)
  c: (t: number) => number[];
  Q: Mat;
  Z: Mat; // p×m
  d: (t: number) => number[]; // Messung: y_t = Z·x_t + d(t) + ε
  H: Mat; // p×p
  y: (number | null)[][]; // n×p, null = fehlt
  x0: number[];
  P0: Mat;
  diffus: number; // so viele erste Schritte zählen nicht für κ²
}

export interface Ergebnis {
  xf: number[][];
  Pf: Mat[];
  xs: number[][];
  Ps: Mat[];
  kappa2: number; // Σ v'F⁻¹v / Anzahl Messwerte, ab Schritt `diffus`
}

export function kalman(s: System): Ergebnis {
  const n = s.y.length;
  const xp: number[][] = [],
    Pp: Mat[] = [],
    xf: number[][] = [],
    Pf: Mat[] = [];
  let summe = 0,
    anzahl = 0;
  for (let t = 0; t < n; t++) {
    let a: number[], P: Mat;
    if (t === 0) {
      a = s.x0;
      P = s.P0;
    } else {
      const T = s.T(t);
      a = malV(T, xf[t - 1]).map((x, i) => x + s.c(t)[i]);
      P = plus(mal(mal(T, Pf[t - 1]), trans(T)), s.Q);
    }
    xp.push(a);
    Pp.push(P);
    const zeilen = s.y[t]
      .map((v, i) => (v === null ? -1 : i))
      .filter((i) => i >= 0);
    if (zeilen.length === 0) {
      xf.push(a);
      Pf.push(P);
      continue;
    }
    const Z = zeilen.map((i) => s.Z[i]);
    const d = s.d(t);
    const H = zeilen.map((i) => zeilen.map((j) => s.H[i][j]));
    const v = zeilen.map(
      (i, k) => (s.y[t][i] as number) - malV(Z, a)[k] - d[i],
    );
    const PZt = mal(P, trans(Z));
    const Finv = inv(plus(mal(Z, PZt), H));
    const K = mal(PZt, Finv);
    xf.push(a.map((x, i) => x + malV(K, v)[i]));
    Pf.push(minus(P, mal(K, trans(PZt))));
    if (t >= s.diffus) {
      summe += v.reduce((acc, vi, i) => acc + vi * malV(Finv, v)[i], 0);
      anzahl += v.length;
    }
  }
  const xs = xf.map((x) => [...x]),
    Ps = Pf.map((p) => p.map((z) => [...z]));
  for (let t = n - 2; t >= 0; t--) {
    const J = mal(mal(Pf[t], trans(s.T(t + 1))), inv(Pp[t + 1]));
    const dx = xs[t + 1].map((x, i) => x - xp[t + 1][i]);
    xs[t] = xf[t].map((x, i) => x + malV(J, dx)[i]);
    Ps[t] = plus(Pf[t], mal(mal(J, minus(Ps[t + 1], Pp[t + 1])), trans(J)));
  }
  return { xf, Pf, xs, Ps, kappa2: anzahl ? summe / anzahl : NaN };
}
