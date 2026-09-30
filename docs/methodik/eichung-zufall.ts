// Spec 13.4: Eichung der Zufallsläufe. Aufruf: npx tsx docs/methodik/eichung-zufall.ts [Läufe]
// 1) Streuung des Wachstums in ruhigen Jahren gegen die gemessene (Deutschland).
// 2) Rückblick Deutschland 2000–2025 ohne die gesetzten Schocks: Liegt die Wirklichkeit im Band?
// 3) Basisläufe der neun Länder: Band 2050, Anteil Schuldenkrise, Schocks je Lauf, Rechenzeit.
import { IST, LAENDER, RUECKBLICK } from "../../app/land";
import { basisSzenario, rechne, rechneZufall } from "../../modell/rechne";
import type { ReihenId } from "../../modell/reihen";
import { RUECK_REIHEN } from "../../modell/rueckblick";
import type { Szenario } from "../../modell/typen";
import { faecher, naechsterLauf, neueSammlung, zieher, zufallsLauf } from "../../modell/zufall";

const N = Number(process.argv[2] ?? 200);
const f = (x: number, d = 1) => x.toFixed(d);
const sd = (xs: number[]) => { const m = xs.reduce((a, b) => a + b, 0) / xs.length; return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / xs.length); };
const GROSS = ["zufall.kriseBasis", "zufall.oel", "zufall.pandemie", "zufall.proxy"];

console.log("== 1) Streuung des Wachstums (Pp.) ==");
const ruhig = Object.entries(IST.wachstumReal ?? {}).filter(([j]) => Number(j) >= 1995 && ![2008, 2009, 2010, 2020, 2021, 2022].includes(Number(j))).map(([, x]) => x);
const alle = Object.entries(IST.wachstumReal ?? {}).filter(([j]) => Number(j) >= 1995).map(([, x]) => x);
console.log(`Deutschland gemessen ab 1995: ruhige Jahre SD ${f(sd(ruhig), 2)} (n ${ruhig.length}), alle Jahre SD ${f(sd(alle), 2)} (n ${alle.length})`);
for (const code of ["DE", "US", "JP", "FR"]) {
  const l = LAENDER[code];
  const sz = { ...basisSzenario(l, 26) };
  const nur = { ...sz, aus: GROSS };
  const glatt = rechne(l, sz);
  const abw = (s: Szenario) => { const a: number[] = []; for (let nr = 0; nr < 100; nr++) zufallsLauf(l, s, 1, nr).forEach((z, t) => t > 0 && a.push((z.wachstum - glatt[t].wachstum) * 100)); return Math.sqrt(a.reduce((x, y) => x + y * y, 0) / a.length); };
  console.log(`${code} Modell: nur Konjunktur SD ${f(abw(nur), 2)}, mit großen Schocks SD ${f(abw(sz), 2)}`);
}

console.log("\n== 2) Rückblick Deutschland ohne gesetzte Schocks: Wirklichkeit im Band? ==");
const ohne: Szenario = { ...RUECKBLICK.sz, schocks: [] };
const laeufe = Array.from({ length: N }, (_, nr) => zufallsLauf(RUECKBLICK.land, ohne, 1, nr));
const linie = rechne(RUECKBLICK.land, ohne);
const q = (xs: number[], p: number) => { const a = [...xs].sort((x, y) => x - y); const i = p * (a.length - 1); const u = Math.floor(i); return u + 1 < a.length ? a[u] + (i - u) * (a[u + 1] - a[u]) : a[u]; };
console.log("| Reihe | Jahre | im Band 10–90 | im Band 25–75 | unter dem Band | über dem Band | Band 2025 (10/50/90) | Linie ohne Zufall 2025 | gemessen |");
console.log("|---|---|---|---|---|---|---|---|---|");
for (const r of RUECK_REIHEN) {
  const ist = (IST as Record<string, Record<string, number>>)[r.ist] ?? {};
  let n = 0, in80 = 0, in50 = 0, unter = 0, ueber = 0;
  const band = (t: number) => { const xs = laeufe.map((l) => r.modell(l[t])); return [q(xs, 0.1), q(xs, 0.25), q(xs, 0.5), q(xs, 0.75), q(xs, 0.9)]; };
  linie.forEach((z, t) => {
    const w = ist[z.jahr];
    if (t === 0 || w === undefined) return;
    const [p10, p25, , p75, p90] = band(t);
    n++;
    if (w >= p10 && w <= p90) in80++;
    if (w >= p25 && w <= p75) in50++;
    if (w < p10) unter++;
    if (w > p90) ueber++;
  });
  const T = linie.length - 1;
  const e = band(T);
  console.log(`| ${r.id} | ${n} | ${f((in80 / n) * 100, 0)} % | ${f((in50 / n) * 100, 0)} % | ${unter} | ${ueber} | ${f(e[0])}/${f(e[2])}/${f(e[4])} | ${f(r.modell(linie[T]))} | ${ist[linie[T].jahr] === undefined ? "–" : f(ist[linie[T].jahr])} |`);
}
console.log("\n== 3) Basisläufe: Band 2050 (10 / 50 / 90), Linie ohne Zufall, Schuldenkrise bis 2050 und 2075 ==");
console.log("| Land | Schuld 2050: Linie | Band | BIP pro Kopf 2050: Linie | Band | Schuldenkrise bis 2050 | bis 2075 | Linie selbst | Schocks je Lauf | ms je Lauf |");
console.log("|---|---|---|---|---|---|---|---|---|---|");
for (const code of Object.keys(LAENDER)) {
  const l = LAENDER[code];
  const sz = basisSzenario(l);
  const b = rechne(l, sz);
  const t0 = performance.now();
  const sm = neueSammlung(l, sz, N);
  while (naechsterLauf(sm));
  const ms = (performance.now() - t0) / N;
  const fa = faecher(sm);
  const t = b.findIndex((z) => z.jahr === 2050), T = b.length - 1;
  const bd = (id: ReihenId, d = 0) => `${f(fa.band[id].p10[t], d)} / ${f(fa.band[id].p50[t], d)} / ${f(fa.band[id].p90[t], d)}`;
  const selbst = b.findIndex((z, i) => i > 0 && (z.ventilSeit === 0 || z.aufschlag > 3));
  console.log(`| ${code} | ${f(b[t].schuldQuote, 0)} | ${bd("schuldQuote")} | ${f(b[t].bipProKopf, 1)} | ${bd("bipProKopf", 1)} | ${f(fa.schuldenkrise[t] * 100, 0)} % | ${f(fa.schuldenkrise[T] * 100, 0)} % | ${selbst < 0 ? "nie" : b[selbst].jahr} | ${f(fa.schocksJeLauf, 1)} | ${f(ms, 1)} |`);
}

console.log("\n== 4) Politikvergleich mit derselben Zufallsfolge: Anteil der Läufe mit Schuldenkrise ==");
console.log("| Land | Szenario | bis 2050 | bis 2075 | Schuld 2075: Linie | Band 10 / 50 / 90 |");
console.log("|---|---|---|---|---|---|");
for (const [code, name, stell] of [["DE", "Basis", {}], ["DE", "Rentenalter 70", { "rente.alter": 70 }], ["FR", "Basis", {}], ["FR", "Rentenalter 67", { "rente.alter": 67 }], ["IT", "Basis", {}], ["IT", "Rentenalter 70", { "rente.alter": 70 }]] as const) {
  const l = LAENDER[code];
  const sz = { ...basisSzenario(l), stell: { ...stell } };
  const b = rechne(l, sz);
  const sm = neueSammlung(l, sz, N);
  while (naechsterLauf(sm));
  const fa = faecher(sm);
  const t = b.findIndex((z) => z.jahr === 2050), T = b.length - 1;
  console.log(`| ${code} | ${name} | ${f(fa.schuldenkrise[t] * 100, 0)} % | ${f(fa.schuldenkrise[T] * 100, 0)} % | ${f(b[T].schuldQuote, 0)} | ${f(fa.band.schuldQuote.p10[T], 0)} / ${f(fa.band.schuldQuote.p50[T], 0)} / ${f(fa.band.schuldQuote.p90[T], 0)} |`);
}

console.log("\n== 5) Häuser und Banken „an“: Platzt die Blase jetzt durch den Zufall? ==");
console.log("| Land | Banken | Finanzkrisen je Lauf | Läufe mit Bankenrettung | Hauspreis: größter Rückgang über 5 Jahre, Median der Läufe | Linie ohne Zufall |");
console.log("|---|---|---|---|---|---|");
for (const code of ["US", "CA", "DE", "GB"]) for (const banken of ["aus", "an"] as const) {
  const l = LAENDER[code];
  const sz = { ...basisSzenario(l), grund: { ...l.grund, banken } };
  const fall = (v: { hauspreis: number }[]) => Math.min(0, ...v.slice(5).map((z, i) => (z.hauspreis / Math.max(1e-9, v[i].hauspreis) - 1) * 100));
  let krisen = 0, rettung = 0;
  const faelle: number[] = [];
  const M = Math.min(N, 100);
  for (let nr = 0; nr < M; nr++) {
    const zz = zieherMit(l, sz, nr);
    krisen += zz.krisen;
    if (zz.v.some((z) => z.rettung > 0)) rettung++;
    faelle.push(fall(zz.v));
  }
  faelle.sort((a, b) => a - b);
  console.log(`| ${code} | ${banken} | ${f(krisen / M, 2)} | ${f((rettung / M) * 100, 0)} % | ${banken === "an" ? f(faelle[Math.floor(M / 2)], 0) + " %" : "–"} | ${banken === "an" ? f(fall(rechne(l, sz)), 0) + " %" : "–"} |`);
}
function zieherMit(l: (typeof LAENDER)[string], sz: Szenario, nr: number) {
  const z = zieher(l, sz, 1, nr);
  let krisen = 0;
  const v = rechneZufall(l, sz, (alt, jahr, schocks) => {
    const zug = z(alt, jahr, schocks);
    krisen += zug.schocks.filter((s) => s.art === "krise").length;
    return zug;
  });
  return { v, krisen };
}
