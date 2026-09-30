// Vorher/Nachher für Spec 13.2: Zinskurve und Kreditlücke je Land, Lampenjahre im Basislauf und im Rückblick.
// Aufruf: npx tsx scripts/fruehwarnung-vergleich.ts
import { LAENDER, RUECKBLICK } from "../app/land";
import { basisSzenario, rechne } from "../modell/rechne";
import type { Landesdaten, Szenario } from "../modell/typen";
import { warnlampen } from "../modell/warnlampen";

const f = (x: number) => x.toFixed(1);
const phasen = (land: Landesdaten, sz: Szenario, id: string) =>
  warnlampen(land, sz, rechne(land, sz)).filter((p) => p.id === id).map((p) => (p.von === p.bis ? `${p.von}` : `${p.von}–${p.bis}`)).join(", ") || "–";

console.log("| Land | Regime | Zinskurve Start (Pp.) | Kreditlücke Start (Pp.) | Lampe Zinskurve | Lampe Kreditlücke |");
console.log("|---|---|---|---|---|---|");
for (const [code, land] of Object.entries(LAENDER)) {
  const sz = basisSzenario(land, 51);
  const z0 = rechne(land, basisSzenario(land, 1))[0];
  console.log(`| ${code} | ${land.grund.regime} | ${f(z0.zinskurve)} | ${f(z0.kreditluecke)} | ${phasen(land, sz, "zinskurve")} | ${phasen(land, sz, "kredit")} |`);
}
const r = rechne(RUECKBLICK.land, RUECKBLICK.sz);
console.log(`\nRückblick Deutschland ${r[0].jahr}–${r[r.length - 1].jahr}: Lampe Zinskurve ${phasen(RUECKBLICK.land, RUECKBLICK.sz, "zinskurve")}; Lampe Kreditlücke ${phasen(RUECKBLICK.land, RUECKBLICK.sz, "kredit")}`);
console.log("Zinskurve je Jahr: " + r.map((z) => `${z.jahr} ${f(z.zinskurve)}`).join(", "));
console.log("Kreditlücke je Jahr: " + r.map((z) => `${z.jahr} ${f(z.kreditluecke)}`).join(", "));
