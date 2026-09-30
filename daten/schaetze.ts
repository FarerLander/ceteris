// Kalman-Schätzung der unbeobachtbaren Startwerte (Spec 13.1). Liest XX.json und XX-hand.json,
// schreibt XX-schaetzung.json. Aufruf: npm run schaetzen -- DE | alle
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { LAENDER } from "./parser";
import { schaetzDatei } from "./schaetzung/datei";
import type { AutoDatei, HandDatei } from "./typen";

const ORDNER = join(dirname(fileURLToPath(import.meta.url)), "laender");
const lies = <T>(datei: string) => JSON.parse(readFileSync(join(ORDNER, datei), "utf-8")) as T;
const f = (x: number | undefined, d = 2) => (x === undefined ? "–" : x.toFixed(d));

export function schreibeSchaetzung(code: string): string {
  const hand = lies<HandDatei>(`${code}-hand.json`);
  const d = schaetzDatei(lies<AutoDatei>(`${code}.json`), hand);
  writeFileSync(join(ORDNER, `${code}-schaetzung.json`), JSON.stringify(d, null, 1) + "\n");
  if (d.fehler) return `${code}: Schätzung nicht möglich: ${d.fehler}`;
  const teil = (g: string, handwert?: number) => {
    const w = d.werte.find((x) => x.groesse === g)!;
    const hw = handwert === undefined ? "" : ` (Hand ${f(handwert, 2)})`;
    return `${g} ${w.gueltig ? "" : "[verworfen: " + w.grund + "] "}${f(w.wert)} ±${f(w.band)}${hw}`;
  };
  return `${code}: ${teil("tfpTrend", hand.werte.tfpTrend)}, ${teil("nairu", hand.werte.nairu)}, ${teil("rStern")}, ${teil("luecke")}, κ ${f(d.kappa)}`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const arg = (process.argv[2] ?? "alle").toUpperCase();
  for (const code of arg === "ALLE" ? Object.keys(LAENDER) : [arg]) console.log(schreibeSchaetzung(code));
}
