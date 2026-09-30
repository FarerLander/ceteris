// Vorher/Nachher für Spec 13.10: Basisläufe mit Politik fest und reagiert, dazu der Rückblick.
// Aufruf: npx tsx scripts/politik-vergleich.ts
import { IST, LAENDER, RUECKBLICK } from "../app/land";
import { basisSzenario, rechne } from "../modell/rechne";
import { pruefeTreffsicherheit } from "../modell/rueckblick";

const f = (x: number, d = 0) => x.toFixed(d);
console.log("| Land | Politik | Schuld 2035/2050/2075 | Spielraum 2050/2075 | Zinsen 2075 (% Einn.) | BIP pro Kopf 2075 | Krisenjahre | Ventile | Eingriffe |");
console.log("|---|---|---|---|---|---|---|---|---|");
for (const [code, land] of Object.entries(LAENDER)) {
  for (const politik of ["fest", "reagiert"] as const) {
    const r = rechne(land, { ...basisSzenario(land), grund: { ...land.grund, politik } });
    const j = (y: number) => r[y - land.datenstand];
    const ventile = r.filter((z) => z.ventilSeit === 0).map((z) => z.jahr).join(", ") || "–";
    const eingriffe = r.flatMap((z) => z.politik).map((e) => `${e.jahr} ${e.art === "entscheidung" ? `${e.ausloeser}→${e.motiv}${e.struktur ? " " + e.struktur : ""}` : e.art}${e.paket ? " " + e.paket : ""}`).join("; ") || "–";
    console.log(`| ${code} | ${politik} | ${f(j(2035).schuldQuote)}/${f(j(2050).schuldQuote)}/${f(j(2075).schuldQuote)} | ${f(j(2050).spielraum)}/${f(j(2075).spielraum)} | ${f(j(2075).topfZins)} | ${f(j(2075).bipProKopf, 1)} | ${r.filter((z) => z.lage === "krise").length} | ${ventile} | ${eingriffe} |`);
  }
}
console.log("\nRückblick Deutschland (Politik im Szenario: " + (RUECKBLICK.sz.grund.politik ?? "Standard") + ")\n");
for (const t of pruefeTreffsicherheit(rechne(RUECKBLICK.land, RUECKBLICK.sz), IST))
  console.log(`- ${t.name}: im Band ${t.imBand === null ? "–" : f(t.imBand * 100) + " %"}, RMSE Modell ${t.rmseModell === null ? "–" : f(t.rmseModell, 3)}`);
