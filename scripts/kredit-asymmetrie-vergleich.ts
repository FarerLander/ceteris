// Vorher/Nachher für Spec 13.5 Teil A (Asymmetrie des Kreditimpulses): Argentinien 1992–2002 und Krisenfälle.
// Aufruf: npx tsx scripts/kredit-asymmetrie-vergleich.ts
import { readFileSync } from "node:fs";
import { baueFall, type Fall } from "../daten/kalibrierung/lade";
import { rechne } from "../modell/rechne";

for (const n of ["argentinien-1992", "griechenland"]) {
  const f = JSON.parse(readFileSync(`daten/kalibrierung/${n}.json`, "utf-8")) as Fall;
  const { land, sz } = baueFall(f);
  const r = rechne(land, sz);
  console.log(`\n${f.name} (${n})`);
  for (const z of r)
    console.log(`  ${z.jahr}: Lage ${z.lage}, Wachstum ${(z.wachstum * 100).toFixed(1)} %, Lücke ${(z.luecke * 100).toFixed(1)} %, Kreditimpuls ${z.kreditimpuls.toFixed(1)}, Aufschlag ${z.aufschlag.toFixed(1)}`);
}
