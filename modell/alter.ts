// Bevölkerung als 101 Einzeljahrgänge (0–100, 100 = 100 und älter).
export function altersverteilung(bev: number, anteile: number[]): number[] {
  const a = new Array(101).fill(0);
  for (let g = 0; g < 16; g++)
    for (let j = 0; j < 5; j++) a[g * 5 + j] = (bev * anteile[g]) / 5;
  const gewicht = Array.from({ length: 21 }, (_, i) => Math.exp(-0.12 * i));
  const summe = gewicht.reduce((x, y) => x + y, 0);
  for (let i = 0; i < 21; i++)
    a[80 + i] = (bev * anteile[16] * gewicht[i]) / summe;
  return a;
}

export function teileAuf(alter: number[], rentenalter: number) {
  const r = Math.min(100, Math.max(16, rentenalter));
  const ganz = Math.floor(r);
  const rest = r - ganz;
  let kinder = 0,
    erwerbsfaehige = 0,
    rentner = 0;
  for (let a = 0; a <= 100; a++) {
    if (a < 15) kinder += alter[a];
    else if (a < ganz) erwerbsfaehige += alter[a];
    else if (a === ganz) {
      erwerbsfaehige += alter[a] * rest;
      rentner += alter[a] * (1 - rest);
    } else rentner += alter[a];
  }
  return { kinder, erwerbsfaehige, rentner };
}
