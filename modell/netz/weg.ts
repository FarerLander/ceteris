import { fmt, formatStell } from "../format";
import { aktuell } from "../pakete";
import { rechne } from "../rechne";
import { REIHEN, type ReihenId } from "../reihen";
import type { Landesdaten, Szenario, Zustand } from "../typen";
import { t } from "../sprache";
import { eintrag, vName } from "../verzeichnis";
import { abweichung, GROESSEN, gName, KENNZAHLEN, merklich, stoss } from "./groessen";
import { feldNetz, stellFelder, type Mitschrift } from "./mitschrift";

export interface WegKnoten {
  feld: string;
  name: string;
  einheit: string;
  wert: number; // Abweichung: Pp. bei Quoten, % bei Niveaus
  spalte: 1 | 2 | 3 | 4;
  kennzahl: boolean;
  gut: -1 | 0 | 1;
}
export interface Weg {
  id: string;
  name: string;
  von: number;
  nach: number;
  jahr: number;
  knoten: WegKnoten[];
  kanten: [string, string][];
  satz: string;
}

const wertIn = (z: Zustand, f: string) =>
  (z as unknown as Record<string, number>)[f];
const istKennzahl = (f: string) =>
  (KENNZAHLEN as readonly string[]).includes(f);
const deltaText = (f: string, w: number) => {
  const g = GROESSEN[f];
  return `${w > 0 ? "+" : "−"}${fmt(Math.abs(w), Math.abs(w) < 1 ? 2 : 1)} ${g.art === "quote" ? t("Pp.") : "%"}`;
};

export function berechneWeg(
  land: Landesdaten,
  sz: Szenario,
  id: string,
  m: Mitschrift,
): Weg {
  const e = eintrag(id);
  const von = aktuell(land, sz, id);
  const lang = Math.min(sz.jahre, 31);
  const a = rechne(land, { ...sz, jahre: lang });
  const mit = (w: number) => rechne(land, { ...sz, jahre: lang, stell: { ...sz.stell, [id]: w } });
  const bewegt = (v: Zustand[]) =>
    Object.entries(GROESSEN).some(([f, g]) => Math.abs(abweichung(g, wertIn(a[lang - 1], f), wertIn(v[lang - 1], f))) >= merklich(g));
  // Auswahl: die nächste Möglichkeit, die etwas bewegt (ohne Reaktoren sind Ausstieg und Laufzeit verlängern gleich).
  const kandidaten = e.optionen
    ? e.optionen.slice(1).map((_, i) => (Math.round(von) + 1 + i) % e.optionen!.length)
    : [stoss(id, von)];
  let nach = kandidaten[0];
  let b = mit(nach);
  for (const w of kandidaten.slice(1)) {
    if (bewegt(b)) break;
    const v = mit(w);
    if (bewegt(v)) [nach, b] = [w, v];
  }
  const n = Math.min(10, lang - 1);

  const alle = Object.entries(GROESSEN).map(([feld, g]) => {
    const wert = abweichung(g, wertIn(a[n], feld), wertIn(b[n], feld));
    let erstes = 0;
    for (let t = 1; t <= n; t++)
      if (
        Math.abs(abweichung(g, wertIn(a[t], feld), wertIn(b[t], feld))) >=
        merklich(g)
      ) {
        erstes = t;
        break;
      }
    return { feld, g, wert, erstes, staerke: Math.abs(wert) / merklich(g) };
  });
  const zwischen = alle
    .filter((x) => !istKennzahl(x.feld) && x.erstes > 0 && Math.abs(x.wert) >= merklich(x.g))
    .sort((x, y) => y.staerke - x.staerke)
    .slice(0, 10);
  const kennz = alle.filter((x) => istKennzahl(x.feld));
  const knoten: WegKnoten[] = [...zwischen, ...kennz].map((x) => {
    const kennzahl = istKennzahl(x.feld);
    const richtung = kennzahl ? REIHEN[x.feld as ReihenId].gut : 0;
    const merk = Math.abs(x.wert) >= merklich(x.g);
    return {
      feld: x.feld,
      name: gName(x.feld),
      einheit: x.g.einheit,
      wert: x.wert,
      spalte: kennzahl ? 4 : x.erstes <= 1 ? 1 : x.erstes <= 3 ? 2 : 3,
      kennzahl,
      gut: (merk && richtung !== 0 ? Math.sign(x.wert) * richtung : 0) as
        | -1
        | 0
        | 1,
    };
  });

  // Verbindungen: erreichbar über das Feldnetz, ohne einen anderen angezeigten Knoten zu passieren.
  const netz = feldNetz(m);
  const gezeigt = new Set(knoten.map((k) => k.feld));
  const erreicht = (start: Iterable<string>, ohne: string): string[] => {
    const treffer = new Set<string>();
    const gesehen = new Set<string>();
    const offen = [...start];
    while (offen.length) {
      const f = offen.pop()!;
      if (gesehen.has(f)) continue;
      gesehen.add(f);
      if (gezeigt.has(f) && f !== ohne) {
        treffer.add(f);
        continue;
      }
      for (const w of netz.get(f) ?? []) offen.push(w);
    }
    return [...treffer];
  };
  const roh: [string, string][] = [];
  for (const f of erreicht(stellFelder(m, id), "")) roh.push(["stell", f]);
  for (const k of knoten) for (const f of erreicht(netz.get(k.feld) ?? [], k.feld)) roh.push([k.feld, f]);
  // Lesbarkeit: nur vorwärts in der Zeit, je Knoten die zwei stärksten Vorgänger (die Stellschraube zuerst).
  const spalteVon = (f: string) => (f === "stell" ? 0 : knoten.find((k) => k.feld === f)!.spalte);
  const staerkeVon = (f: string) => (f === "stell" ? Infinity : alle.find((x) => x.feld === f)!.staerke);
  const kanten: [string, string][] = [];
  for (const k of knoten)
    roh
      .filter(([a, b]) => b === k.feld && spalteVon(a) < spalteVon(b))
      .sort(([a], [b]) => staerkeVon(b) - staerkeVon(a))
      .slice(0, 2)
      .forEach((kante) => kanten.push(kante));

  // Satz
  const kopf = `${vName(e)} ${formatStell(e, von)} → ${formatStell(e, nach)}`;
  // Frühe Stationen zuerst, innerhalb derselben Spalte die stärkeren.
  const merkZ = knoten.filter((k) => !k.kennzahl).sort((a, b) => a.spalte - b.spalte).map((k) => k.name);
  const stark = kennz
    .filter((x) => Math.abs(x.wert) >= merklich(x.g))
    .sort((x, y) => y.staerke - x.staerke)[0];
  let satz: string;
  if (!stark && zwischen.length === 0) {
    // Erstes Jahr nach dem Fenster, in dem sich etwas merklich bewegt (z. B. neue Reaktoren nach dem Vorlauf).
    let spaet = 0;
    for (let tt = n + 1; tt < lang && !spaet; tt++)
      if (Object.entries(GROESSEN).some(([f, g]) => Math.abs(abweichung(g, wertIn(a[tt], f), wertIn(b[tt], f))) >= merklich(g)))
        spaet = tt;
    satz = spaet
      ? t("{kopf}: innerhalb von {n} Jahren kaum Wirkung; merklich wird sie erst nach {m} Jahren ({jahr}).", { kopf, n, m: spaet, jahr: a[spaet].jahr })
      : t("{kopf}: innerhalb von {n} Jahren kaum Wirkung.", { kopf, n });
  } else {
    const ueber = merkZ.length
      ? ` ${t("Der Weg führt über {stationen}.", { stationen: merkZ.slice(0, 2).join(t(" und ")) })}`
      : "";
    const wirkung = stark
      ? t("nach {n} Jahren {groesse} {delta}", { n, groesse: gName(stark.feld), delta: deltaText(stark.feld, stark.wert) })
      : t("nach {n} Jahren bewegen sich die fünf Kennzahlen kaum", { n });
    satz = `${kopf}: ${wirkung}${wirkung.endsWith(".") ? "" : "."}${ueber}`;
  }
  return { id, name: vName(e), von, nach, jahr: n, knoten, kanten, satz };
}

export { deltaText };
