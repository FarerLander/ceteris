// Hodrick-Prescott-Filter, nur als Gegenprobe zum Kalman-Trend (Spec 13.1; Hamilton 2018).
// λ = 6,25 für Jahresdaten (Ravn/Uhlig 2002).
import { inv, malV } from "./matrix";

export function hp(y: number[], lambda: number): number[] {
  const n = y.length;
  // A = I + λ·DᵀD mit der zweiten Differenzenmatrix D
  const A = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
  );
  for (let k = 0; k < n - 2; k++) {
    const d = [1, -2, 1];
    for (let a = 0; a < 3; a++)
      for (let b = 0; b < 3; b++) A[k + a][k + b] += lambda * d[a] * d[b];
  }
  return malV(inv(A), y);
}
