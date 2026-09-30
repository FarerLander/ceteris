// 12b: Was hat sich an den Daten eines Landes geändert? Sätze für den Pull Request des Daten-Knopfs.
// Das Abrufdatum allein ist keine Änderung.
import type { AutoDatei, Reihe } from "./typen";

const BENANNT: Record<string, [string, string]> = {
  schuldQuote: ["Staatsschuld", "% BIP"],
  wachstumReal: ["Wachstum real", "%"],
  inflation: ["Inflation", "%"],
  alq: ["Arbeitslosenquote", "%"],
  bev: ["Bevölkerung", "Mio."],
  einnahmen: ["Staatseinnahmen", "% BIP"],
  ausgaben: ["Staatsausgaben", "% BIP"],
  leistungsbilanz: ["Leistungsbilanz", "% BIP"],
  rendite: ["Rendite 10 Jahre", "%"],
};
const KONSENS: Record<string, [string, string]> = {
  wachstum: ["Wachstum", "%"],
  inflation: ["Inflation", "%"],
  alq: ["Arbeitslosenquote", "%"],
  defizit: ["Finanzierungssaldo", "% BIP"],
  schuldQuote: ["Staatsschuld", "% BIP"],
};

const zahl = (x: number) =>
  x.toLocaleString("de-DE", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
const gleich = (a: number, b: number) => Math.abs(a - b) < 1e-9;
const jahre = (r: Reihe) =>
  Object.keys(r)
    .map(Number)
    .sort((a, b) => a - b);

function reihe(k: string, alt: Reihe, neu: Reihe): string[] {
  const gemeinsam = jahre(neu).filter((j) => j in alt);
  const geaendert = gemeinsam.filter((j) => !gleich(alt[j], neu[j]));
  const hinzu = jahre(neu).filter((j) => !(j in alt));
  const name = BENANNT[k];
  if (!name) {
    const n = geaendert.length + hinzu.length;
    return n ? [`Reihe ${k}: ${n} Werte geändert oder neu`] : [];
  }
  const [titel, einheit] = name;
  const z: string[] = [];
  const letzter = gemeinsam[gemeinsam.length - 1];
  if (letzter !== undefined && geaendert.includes(letzter))
    z.push(
      `${titel} ${letzter}: ${zahl(alt[letzter])} → ${zahl(neu[letzter])} ${einheit}`,
    );
  for (const j of hinzu)
    z.push(`${titel} ${j}: neu ${zahl(neu[j])} ${einheit}`);
  const revidiert = geaendert.filter((j) => j !== letzter).length;
  if (revidiert) z.push(`${titel}: ${revidiert} ältere Werte revidiert`);
  return z;
}

export function vergleicheLand(alt: AutoDatei, neu: AutoDatei): string[] {
  const z: string[] = [];
  for (const k of new Set([
    ...Object.keys(alt.reihen),
    ...Object.keys(neu.reihen),
  ])) {
    if (!(k in neu.reihen)) z.push(`Reihe ${k} fehlt jetzt`);
    else if (!(k in alt.reihen)) z.push(`Reihe ${k} neu`);
    else z.push(...reihe(k, alt.reihen[k], neu.reihen[k]));
  }
  const a = alt.konsens?.werte ?? {},
    n = neu.konsens?.werte ?? {};
  for (const g of new Set([...Object.keys(a), ...Object.keys(n)]) as Set<
    keyof typeof n
  >) {
    const [titel, einheit] = KONSENS[g] ?? [g, ""];
    const ra = a[g] ?? {},
      rn = n[g] ?? {};
    const js = jahre(rn);
    const anders =
      js.some((j) => !(j in ra) || !gleich(ra[j], rn[j])) ||
      jahre(ra).some((j) => !(j in rn));
    if (!anders) continue;
    const j = js[js.length - 1];
    if (j === undefined) z.push(`IWF-Prognose ${titel} fehlt jetzt`);
    else if (j in ra)
      z.push(
        `IWF-Prognose ${titel} ${j}: ${zahl(ra[j])} → ${zahl(rn[j])} ${einheit}`.trim(),
      );
    else
      z.push(
        `IWF-Prognose ${titel} ${j}: neu ${zahl(rn[j])} ${einheit}`.trim(),
      );
  }
  return z;
}
