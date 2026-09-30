// Abzug der Basisläufe aller Länder als JSON (Neutralitätstest für Update 4a).
// Aufruf: npx tsx scripts/abzug.ts > modell/tests/abzug.json
// Derselbe Lauf wie im Neutralitätstest (modell/tests/neutral-lauf.ts).
import { LAENDER_HAND as LAENDER } from "../app/land";
import { neutralLauf } from "../modell/tests/neutral-lauf";

const aus: Record<string, Record<string, number | string>[]> = {};
for (const [code, land] of Object.entries(LAENDER)) {
  aus[code] = neutralLauf(land).map((z) => {
    const r: Record<string, number | string> = {};
    for (const [f, v] of Object.entries(z)) if (typeof v === "number") r[f] = v;
    for (const [f, v] of Object.entries(z.mix)) r[`mix.${f}`] = v;
    r.lage = z.lage;
    return r;
  });
}
process.stdout.write(JSON.stringify(aus));
