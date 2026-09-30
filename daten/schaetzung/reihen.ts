// Beobachtete Reihen eines Landes für den Kalman-Filter (Spec 13.1).
import type { AutoDatei, Reihe } from "../typen";

export interface Reihen {
  jahre: number[]; // von..bis
  y: number[]; // 100·ln des verketteten realen BIP, erstes Jahr 0
  alq: (number | null)[];
  infl: (number | null)[];
  inflVj: (number | null)[]; // Inflation des Vorjahres (für die Erwartung)
  kurz: (number | null)[]; // Kurzfristzins, null ohne Reihe
  erwerbspersonen: (number | null)[];
}

export const letztesJahr = (auto: AutoDatei): number =>
  Math.max(...Object.keys(auto.reihen.wachstumReal ?? {}).map(Number));

export function reihenAus(auto: AutoDatei, von: number, bis: number): Reihen {
  const jahre = Array.from({ length: bis - von + 1 }, (_, i) => von + i);
  const hol = (r: Reihe | undefined, j: number) => r?.[j] ?? null;
  const w = auto.reihen.wachstumReal ?? {};
  const y: number[] = [];
  for (const j of jahre) {
    if (w[j] === undefined) throw new Error(`Reales Wachstum fehlt: ${j}`);
    y.push(
      y.length === 0 ? 0 : y[y.length - 1] + 100 * Math.log(1 + w[j] / 100),
    );
  }
  const r = auto.reihen;
  return {
    jahre,
    y,
    alq: jahre.map((j) => hol(r.alq, j)),
    infl: jahre.map((j) => hol(r.inflation, j)),
    inflVj: jahre.map((j) => hol(r.inflation, j - 1)),
    kurz: jahre.map((j) => hol(r.kurzzins, j)),
    erwerbspersonen: jahre.map((j) => hol(r.erwerbspersonen, j)),
  };
}
