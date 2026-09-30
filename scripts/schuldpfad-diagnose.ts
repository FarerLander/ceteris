// M29: Woher weicht die Schuld 2026–2031 vom IWF ab? Zerlegung je Land, Politik fest.
// Aufruf: npx tsx scripts/schuldpfad-diagnose.ts [land]
import { LAENDER } from "../app/land";
import { basisSzenario, rechne } from "../modell/rechne";

const f = (x: number | undefined, d = 1) => (x === undefined || Number.isNaN(x) ? "–" : x.toFixed(d));
const nur = process.argv[2];
const zeilen: string[] = [];
for (const [code, land] of Object.entries(LAENDER)) {
  if (nur && code !== nur) continue;
  const r = rechne(land, { ...basisSzenario(land), grund: { ...land.grund, politik: "fest" } });
  const q = land.konsens?.quellen.find((x) => x.kurz === "IWF");
  const w = q?.werte ?? {};
  const j = (y: number) => r[y - land.datenstand];
  console.log(`\n## ${code} (Datenstand ${land.datenstand})`);
  console.log("| Jahr | g M/IWF | π M/IWF | g+π nom M/IWF | Saldo M/IWF | Primär M | Zins M | effZins M | Schuld M/IWF |");
  console.log("|---|---|---|---|---|---|---|---|---|");
  for (let y = land.datenstand; y <= 2031; y++) {
    const z = j(y);
    const gi = w.wachstum?.[y], pi = w.inflation?.[y];
    console.log(`| ${y} | ${f(z.wachstum * 100)}/${f(gi)} | ${f(z.inflation)}/${f(pi)} | ${f(z.wachstum * 100 + z.inflation)}/${f(gi !== undefined && pi !== undefined ? gi + pi : undefined)} | ${f(z.primaer - z.zinsausgaben)}/${f(w.defizit?.[y])} | ${f(z.primaer)} | ${f(z.zinsausgaben)} | ${f(z.effZins, 2)} | ${f(z.schuldQuote)}/${f(w.schuldQuote?.[y])} |`);
  }
  // Summen 2026–2031
  let sM = 0, sI = 0, zinsM = 0, primM = 0;
  for (let y = land.datenstand + 1; y <= 2031; y++) {
    const z = j(y);
    sM += z.primaer - z.zinsausgaben; primM += z.primaer; zinsM += z.zinsausgaben;
    sI += w.defizit?.[y] ?? NaN;
  }
  const d0 = j(land.datenstand).schuldQuote, dM = j(2031).schuldQuote, dI = w.schuldQuote?.[2031] ?? NaN;
  zeilen.push(`| ${code} | ${f(d0)} | ${f(dM)} | ${f(dI)} | ${f(dM - dI)} | ${f(sM)} | ${f(sI)} | ${f(sI - sM)} | ${f(primM)} | ${f(zinsM)} |`);
}
console.log("\n| Land | Schuld Start | 2031 Modell | 2031 IWF | Abstand | Σ Saldo M | Σ Saldo IWF | Saldo-Lücke | Σ Primär M | Σ Zins M |");
console.log("|---|---|---|---|---|---|---|---|---|---|");
for (const z of zeilen) console.log(z);
