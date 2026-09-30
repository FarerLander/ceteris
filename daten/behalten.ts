// 12b: Scheitert der Abruf einer Reihe oder Prognose, die es schon gab, bleibt der alte Stand und wird
// in `behalten` vermerkt. Grund: Die OECD antwortet GitHub-Servern nicht immer; ein Netzfehler darf das
// Modell nicht verschieben.
import type { AutoDatei } from "./typen";

export function behalteAlte(alt: AutoDatei | null, neu: AutoDatei): AutoDatei {
  if (!alt) return neu;
  const behalten: string[] = [];
  const reihen = { ...neu.reihen }, quellen = { ...neu.quellen };
  for (const k of Object.keys(alt.reihen))
    if (!(k in reihen)) {
      reihen[k] = alt.reihen[k];
      if (alt.quellen[k]) quellen[k] = alt.quellen[k];
      behalten.push(k);
    }
  let konsens = neu.konsens;
  if (alt.konsens) {
    const werte = { ...(neu.konsens?.werte ?? {}) };
    for (const [g, r] of Object.entries(alt.konsens.werte) as [keyof typeof werte, (typeof werte)[keyof typeof werte]][])
      if (!werte[g] || Object.keys(werte[g]!).length === 0) {
        werte[g] = r;
        behalten.push(`konsens.${g}`);
      }
    konsens = { ...(neu.konsens ?? alt.konsens), werte };
  }
  if (!behalten.length) return neu;
  return { ...neu, reihen, quellen, konsens, fehlend: neu.fehlend.filter((k) => !behalten.includes(k)), behalten };
}
