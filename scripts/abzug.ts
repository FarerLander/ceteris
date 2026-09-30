// Abzug der Basisläufe aller Länder als JSON (Neutralitätstest für Update 4a).
// Aufruf: npx tsx scripts/abzug.ts > modell/tests/abzug.json
// 13.1: Mechanik mit Handwerten bitgenau. M29: ohne Haushaltsplan, wie neutral.test.ts.
import { LAENDER_HAND as LAENDER } from "../app/land";
import { basisSzenario, rechne } from "../modell/rechne";

const aus: Record<string, Record<string, number | string>[]> = {};
for (const [code, land] of Object.entries(LAENDER)) {
  aus[code] = rechne(land, { ...basisSzenario(land), grund: { ...land.grund, politik: "fest", haushaltsplan: "aus" } }).map((z) => {
    const r: Record<string, number | string> = {};
    for (const [f, v] of Object.entries(z)) if (typeof v === "number") r[f] = v;
    for (const [f, v] of Object.entries(z.mix)) r[`mix.${f}`] = v;
    r.lage = z.lage;
    return r;
  });
}
process.stdout.write(JSON.stringify(aus));
