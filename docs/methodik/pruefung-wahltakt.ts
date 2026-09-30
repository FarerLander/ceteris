// Spec 13.13 Task 7: Ist der Wahljahr-Effekt (Haushalt im Wahljahr großzügiger) in den Daten der App sichtbar?
// Aufruf: npx tsx docs/methodik/pruefung-wahltakt.ts > docs/methodik/ergebnis-wahltakt.txt
// Abhängig: Änderung des Haushaltssaldos (Einnahmen − Ausgaben, % BIP, IWF) gegen das Vorjahr.
// Erklärend: Wahljahr (tatsächliche Wahljahre, ungeprüft) und die Änderung der
// Produktionslücke (Kalman-Schätzung 13.1). Für Deutschland zusätzlich der Primärsaldo mit den Zinsen
// des Rückblick-Laufs (eine gemessene Zinsreihe hat die App nicht).
import { readFileSync } from "node:fs";
import { RUECKBLICK } from "../../app/land";
import { rechne } from "../../modell/rechne";

const WAHLEN: Record<string, number[]> = {
  DE: [2002, 2005, 2009, 2013, 2017, 2021, 2025],
  US: [2000, 2004, 2008, 2012, 2016, 2020, 2024],
  JP: [2000, 2003, 2005, 2009, 2012, 2014, 2017, 2021, 2024],
  GB: [2001, 2005, 2010, 2015, 2017, 2019, 2024],
  FR: [2002, 2007, 2012, 2017, 2022],
  IT: [2001, 2006, 2008, 2013, 2018, 2022],
  CA: [2000, 2004, 2006, 2008, 2011, 2015, 2019, 2021, 2025],
};
// Krisenjahre, in denen der Saldo aus anderen Gründen springt; zweite Schätzung ohne sie.
const KRISE = [2009, 2010, 2020, 2021];

type Zeile = { land: string; jahr: number; dSaldo: number; wahl: number; vorwahl: number; dLuecke: number };
const lies = (f: string) => JSON.parse(readFileSync(`daten/laender/${f}`, "utf-8"));
const zeilen: Zeile[] = [];
for (const land of Object.keys(WAHLEN)) {
  const r = lies(`${land}.json`).reihen as Record<string, Record<string, number>>;
  const luecke = Object.fromEntries((lies(`${land}-schaetzung.json`).reihen.luecke as { jahr: number; wert: number }[]).map((p) => [p.jahr, p.wert]));
  const saldo = (j: number) => r.einnahmen[j] - r.ausgaben[j];
  for (let j = 2001; j <= 2024; j++) {
    if ([j, j - 1].some((y) => r.einnahmen[y] === undefined || r.ausgaben[y] === undefined || luecke[y] === undefined)) continue;
    zeilen.push({ land, jahr: j, dSaldo: saldo(j) - saldo(j - 1), wahl: WAHLEN[land].includes(j) ? 1 : 0, vorwahl: WAHLEN[land].includes(j + 1) ? 1 : 0, dLuecke: luecke[j] - luecke[j - 1] });
  }
}

// Kleinste Quadrate mit Standardfehlern (Gauß-Jordan, wenige Spalten).
function ols(y: number[], X: number[][]) {
  const n = y.length, k = X[0].length;
  const A = Array.from({ length: k }, (_, i) => Array.from({ length: k }, (_, j) => X.reduce((s, x) => s + x[i] * x[j], 0)));
  const inv = A.map((z, i) => [...z, ...Array.from({ length: k }, (_, j) => (i === j ? 1 : 0))]);
  for (let i = 0; i < k; i++) {
    const p = inv[i][i];
    for (let j = 0; j < 2 * k; j++) inv[i][j] /= p;
    for (let m = 0; m < k; m++) if (m !== i) { const f = inv[m][i]; for (let j = 0; j < 2 * k; j++) inv[m][j] -= f * inv[i][j]; }
  }
  const I = inv.map((z) => z.slice(k));
  const b = I.map((z) => z.reduce((s, v, j) => s + v * X.reduce((t, x, r) => t + x[j] * y[r], 0), 0));
  const res = y.map((v, r) => v - X[r].reduce((s, x, j) => s + x * b[j], 0));
  const s2 = res.reduce((s, e) => s + e * e, 0) / (n - k);
  return b.map((bi, i) => ({ b: bi, t: bi / Math.sqrt(s2 * I[i][i]) }));
}
const f = (x: number, d = 2) => x.toFixed(d).replace("-", "−");
function schaetze(titel: string, d: Zeile[], mitVorwahl = false) {
  const laender = [...new Set(d.map((z) => z.land))];
  const X = d.map((z) => [z.wahl, ...(mitVorwahl ? [z.vorwahl] : []), z.dLuecke, ...laender.map((l) => (z.land === l ? 1 : 0))]);
  const e = ols(d.map((z) => z.dSaldo), X);
  const namen = ["Wahljahr", ...(mitVorwahl ? ["Vorwahljahr"] : []), "Änderung der Lücke"];
  console.log(`${titel} (n = ${d.length}, Wahljahre ${d.filter((z) => z.wahl).length})`);
  namen.forEach((n, i) => console.log(`  ${n.padEnd(20)} ${f(e[i].b).padStart(6)} Pp.  (t ${f(e[i].t, 1)})`));
  return e[0];
}

console.log("1. LÄNDER-PANEL: sieben Länder mit Wahltakt, 2001–2024, Ländereffekte\n");
const alle = schaetze("A. Alle Jahre", zeilen);
const ruhig = schaetze("\nB. Ohne Krisenjahre 2009, 2010, 2020, 2021", zeilen.filter((z) => !KRISE.includes(z.jahr)));
schaetze("\nC. Mit Vorwahljahr, ohne Krisenjahre", zeilen.filter((z) => !KRISE.includes(z.jahr)), true);
console.log("\n2. JE LAND, ohne Krisenjahre");
for (const land of Object.keys(WAHLEN)) schaetze(`\n${land}`, zeilen.filter((z) => z.land === land && !KRISE.includes(z.jahr)));

console.log("\n3. DEUTSCHLAND, Primärsaldo (Saldo plus Zinsen aus dem Rückblick-Lauf des Modells), 2001–2024");
const rb = rechne(RUECKBLICK.land, RUECKBLICK.sz);
const zins = Object.fromEntries(rb.map((z) => [z.jahr, (z.topfZins * z.einnahmen) / 100]));
const de = zeilen.filter((z) => z.land === "DE").map((z) => ({ ...z, dSaldo: z.dSaldo + zins[z.jahr] - zins[z.jahr - 1] }));
schaetze("Alle Jahre", de);
schaetze("\nOhne Krisenjahre", de.filter((z) => !KRISE.includes(z.jahr)));

console.log("\n4. URTEIL");
const trifft = (e: { b: number; t: number }) => e.b < 0 && Math.abs(e.t) >= 1.5;
console.log(`Regel: Saldo im Wahljahr schlechter (Vorzeichen negativ) und |t| ≥ 1,5 im Länder-Panel → Standard 0,3 % BIP; sonst 0.`);
console.log(`Alle Jahre: ${f(alle.b)} Pp., t ${f(alle.t, 1)} → ${trifft(alle) ? "erfüllt" : "nicht erfüllt"}. Ohne Krisenjahre: ${f(ruhig.b)} Pp., t ${f(ruhig.t, 1)} → ${trifft(ruhig) ? "erfüllt" : "nicht erfüllt"}.`);
console.log(`Standard für politik.wahljahr: ${trifft(alle) || trifft(ruhig) ? "0,3" : "0"}`);
