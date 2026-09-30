// Vorher/Nachher für Spec 13.1: Handwerte gegen Kalman-Startwerte, dazu der Rückblick.
// Aufruf: npx tsx scripts/schaetzung-vergleich.ts
import { IST, LAENDER, LAENDER_HAND, RUECKBLICK } from "../app/land";
import { basisSzenario, rechne } from "../modell/rechne";
import { pruefeTreffsicherheit } from "../modell/rueckblick";
import type { Landesdaten, Zustand } from "../modell/typen";

const f = (x: number | undefined, d = 1) => (x === undefined || !Number.isFinite(x) ? "–" : x.toFixed(d));
const mittel = (r: Zustand[], von: number, bis: number) => {
  const z = r.filter((x) => x.jahr >= von && x.jahr <= bis);
  return (z.reduce((s, x) => s + x.wachstum, 0) / z.length) * 100;
};
const iwf = (land: Landesdaten, von: number, bis: number) => {
  const w = land.konsens?.quellen.find((q) => q.kurz === "IWF")?.werte.wachstum;
  if (!w) return undefined;
  const j = Object.keys(w).map(Number).filter((x) => x >= von && x <= bis);
  return j.length ? j.reduce((s, x) => s + w[x], 0) / j.length : undefined;
};

console.log("| Land | tfpTrend Hand → Kalman ±Band (HP) | NAIRU Hand → Kalman ±Band | r* ±Band | Lücke Start | κ | Wachstum 2026–30 Hand / Kalman / IWF | Wachstum 2026–35 Hand / Kalman | Schuld 2050 Hand / Kalman | Krisenjahre Hand / Kalman |");
console.log("|---|---|---|---|---|---|---|---|---|---|");
for (const code of Object.keys(LAENDER)) {
  const k = LAENDER[code], h = LAENDER_HAND[code];
  const w = (g: string) => k.schaetzung?.werte.find((x) => x.groesse === g);
  const zelle = (g: "tfpTrend" | "nairu", hand: number) => {
    const x = w(g);
    if (!x) return `${f(hand, 2)} (keine Schätzung)`;
    const hp = x.hp !== undefined ? ` (HP ${f(x.hp, 2)})` : "";
    return x.genutzt ? `${f(hand, 2)} → **${f(x.wert, 2)}** ±${f(x.band, 2)}${hp}` : `${f(hand, 2)} bleibt (${x.grund}; Schätzung ${f(x.wert, 2)})`;
  };
  const anzeige = (g: string) => {
    const x = w(g);
    return !x ? "–" : x.gueltig ? `${f(x.wert)} ±${f(x.band)}` : `verworfen (${x.grund})`;
  };
  const rh = rechne(h, basisSzenario(h)), rk = rechne(k, basisSzenario(k));
  const j = (r: Zustand[], y: number) => r.find((z) => z.jahr === y);
  const krise = (r: Zustand[]) => r.filter((z) => z.lage === "krise").length;
  console.log(`| ${code} | ${zelle("tfpTrend", h.start.tfpTrend)} | ${zelle("nairu", h.start.nairu)} | ${anzeige("rStern")} | ${anzeige("luecke")} | ${f(k.schaetzung?.kappa, 2)} | ${f(mittel(rh, 2026, 2030))} / ${f(mittel(rk, 2026, 2030))} / ${f(iwf(k, 2026, 2030))} | ${f(mittel(rh, 2026, 2035))} / ${f(mittel(rk, 2026, 2035))} | ${f(j(rh, 2050)?.schuldQuote, 0)} / ${f(j(rk, 2050)?.schuldQuote, 0)} | ${krise(rh)} / ${krise(rk)} |`);
}
console.log("\nRückblick Deutschland (Politik im Szenario: " + (RUECKBLICK.sz.grund.politik ?? "Standard") + ")\n");
for (const t of pruefeTreffsicherheit(rechne(RUECKBLICK.land, RUECKBLICK.sz), IST))
  console.log(`- ${t.name}: im Band ${t.imBand === null ? "–" : f(t.imBand * 100, 0) + " %"}, RMSE Modell ${t.rmseModell === null ? "–" : f(t.rmseModell, 3)}`);
