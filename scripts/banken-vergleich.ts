// Vorher/Nachher für Spec 13.6: Basisläufe aller Länder und Rückblick Deutschland, Banken aus und an.
// Aufruf: npx tsx scripts/banken-vergleich.ts
import { IST, LAENDER, RUECKBLICK } from "../app/land";
import { basisSzenario, rechne } from "../modell/rechne";
import { pruefeTreffsicherheit } from "../modell/rueckblick";
import type { Zustand } from "../modell/typen";
import { eintrag } from "../modell/verzeichnis";

const f = (x: number, d = 0) => x.toFixed(d);
const HAUS = eintrag("schwelle.hausluecke").standard;
const KREDIT = eintrag("schwelle.kreditluecke").standard;
// Lampe in den zehn Jahren vor dem Jahr (Hauspreis- oder Kreditlücke über der Schwelle).
const lampeVor = (r: Zustand[], jahr: number) => r.some((z) => z.jahr < jahr && z.jahr >= jahr - 10 && (z.hausluecke > HAUS || z.kreditluecke > KREDIT));

console.log("| Land | Banken | Schuld 2035/2050/2075 | Rettungen (Jahr: % BIP) | ohne Lampe davor | Hauspreis-Lampe (Jahre) | Kreditlücke max | Hauspreis tief/hoch | faule Kredite max | Eigenkapital min (% vom Start) | Jahre mit Kreditklemme | Krisenjahre |");
console.log("|---|---|---|---|---|---|---|---|---|---|---|---|");
for (const [code, land] of Object.entries(LAENDER)) {
  for (const banken of ["aus", "an"] as const) {
    const r = rechne(land, { ...basisSzenario(land), grund: { ...land.grund, banken } });
    const j = (y: number) => r[y - land.datenstand];
    const rett = r.filter((z) => z.rettung > 0);
    console.log(
      `| ${code} | ${banken} | ${f(j(2035).schuldQuote)}/${f(j(2050).schuldQuote)}/${f(j(2075).schuldQuote)} | ${rett.map((z) => `${z.jahr}: ${f(z.rettung, 1)}`).join(", ") || "–"} | ${rett.filter((z) => !lampeVor(r, z.jahr)).map((z) => z.jahr).join(", ") || "–"} | ${r.filter((z) => z.hausluecke > HAUS).length} | ${f(Math.max(...r.map((z) => z.kreditluecke)), 1)} | ${f(Math.min(...r.map((z) => z.hauspreis)))}/${f(Math.max(...r.map((z) => z.hauspreis)))} | ${f(Math.max(...r.map((z) => z.npl)), 1)} | ${f((100 * Math.min(...r.map((z) => z.bankKapital))) / r[0].bankKapital)} | ${r.filter((z) => z.klemme > 0).length} | ${r.filter((z) => z.lage === "krise").length} |`,
    );
  }
}

console.log("\nRückblick Deutschland 2000–" + RUECKBLICK.bis + "\n");
console.log("| Reihe | Theil's U aus | an | RMSE aus | an |");
console.log("|---|---|---|---|---|");
const lauf = (banken: "aus" | "an") => rechne(RUECKBLICK.land, { ...RUECKBLICK.sz, grund: { ...RUECKBLICK.sz.grund, banken } });
const aus = lauf("aus"), an = lauf("an");
const tAus = pruefeTreffsicherheit(aus, IST), tAn = pruefeTreffsicherheit(an, IST);
tAus.forEach((t, i) =>
  console.log(`| ${t.name} | ${t.theilU === null ? "–" : f(t.theilU, 3)} | ${tAn[i].theilU === null ? "–" : f(tAn[i].theilU!, 3)} | ${t.rmseModell === null ? "–" : f(t.rmseModell, 3)} | ${tAn[i].rmseModell === null ? "–" : f(tAn[i].rmseModell!, 3)} |`),
);
console.log("\nRückblick mit Banken an: Jahr, Hauspreis real (Ist BIS, 2000 = 100), Hauspreislücke, faule Kredite, Eigenkapital, Klemme, Rettung\n");
const ist = IST.hauspreisReal ?? {};
for (const z of an)
  console.log(`${z.jahr} ${f(z.hauspreis, 1).padStart(6)} (${ist[z.jahr] === undefined ? "  –  " : f((100 * ist[z.jahr]) / ist[2000], 1).padStart(5)}) ${f(z.hausluecke, 1).padStart(6)} ${f(z.npl, 2).padStart(6)} ${f(z.bankKapital, 2).padStart(6)} ${f(z.klemme, 2).padStart(6)} ${f(z.rettung, 2).padStart(6)}`);
