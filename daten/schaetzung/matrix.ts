// Kleine dichte Matrizen für den Kalman-Filter (höchstens 5×5, nur im Datenskript).
export type Mat = number[][];

export const einheit = (n: number): Mat =>
  Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
  );

export const diag = (v: number[]): Mat =>
  v.map((x, i) => v.map((_, j) => (i === j ? x : 0)));

export const mal = (a: Mat, b: Mat): Mat =>
  a.map((zeile) =>
    b[0].map((_, j) => zeile.reduce((s, x, k) => s + x * b[k][j], 0)),
  );

export const malV = (a: Mat, v: number[]): number[] =>
  a.map((zeile) => zeile.reduce((s, x, k) => s + x * v[k], 0));

export const plus = (a: Mat, b: Mat): Mat =>
  a.map((z, i) => z.map((x, j) => x + b[i][j]));

export const minus = (a: Mat, b: Mat): Mat =>
  a.map((z, i) => z.map((x, j) => x - b[i][j]));

export const trans = (a: Mat): Mat => a[0].map((_, j) => a.map((z) => z[j]));

// Gauß-Jordan mit Pivotsuche.
export function inv(a: Mat): Mat {
  const n = a.length;
  const m = a.map((z, i) => [...z, ...einheit(n)[i]]);
  for (let s = 0; s < n; s++) {
    let p = s;
    for (let i = s + 1; i < n; i++)
      if (Math.abs(m[i][s]) > Math.abs(m[p][s])) p = i;
    if (Math.abs(m[p][s]) < 1e-12) throw new Error("Matrix singulär");
    [m[s], m[p]] = [m[p], m[s]];
    const f = m[s][s];
    m[s] = m[s].map((x) => x / f);
    for (let i = 0; i < n; i++)
      if (i !== s) {
        const g = m[i][s];
        if (g !== 0) m[i] = m[i].map((x, j) => x - g * m[s][j]);
      }
  }
  return m.map((z) => z.slice(n));
}
