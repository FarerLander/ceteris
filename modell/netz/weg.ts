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
  ab: number | null; // Kalenderjahr, mit dem das Fenster beginnt, wenn die Wirkung erst spät einsetzt
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
  const lang = Math.min(sz.jahre, 41);
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
  // Setzt die Wirkung erst nach dem Zehn-Jahres-Fenster ein (neue Reaktoren nach dem Vorlauf), beginnt das
  // Fenster mit dem ersten merklichen Jahr; sonst zeigte das Bild nichts.
  const merkt = (tt: number) =>
    Object.entries(GROESSEN).some(([f, g]) => Math.abs(abweichung(g, wertIn(a[tt], f), wertIn(b[tt], f))) >= merklich(g));
  let erstesJahr = 0;
  for (let tt = 1; tt < lang && !erstesJahr; tt++) if (merkt(tt)) erstesJahr = tt;
  const n0 = Math.min(10, lang - 1);
  const versatz = erstesJahr > n0 ? Math.min(erstesJahr - 1, lang - 1 - n0) : 0;
  const n = Math.min(10, lang - 1 - versatz);
  const at = (tt: number) => a[versatz + tt];
  const bt = (tt: number) => b[versatz + tt];

  const alle = Object.entries(GROESSEN).map(([feld, g]) => {
    const wert = abweichung(g, wertIn(at(n), feld), wertIn(bt(n), feld));
    let erstes = 0;
    for (let t = 1; t <= n; t++)
      if (
        Math.abs(abweichung(g, wertIn(at(t), feld), wertIn(bt(t), feld))) >=
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
  const ab = versatz > 0 ? at(1).jahr : null;
  const spaet = ab === null ? "" : `${t("Die Wirkung setzt erst {jahr} ein, nach {m} Jahren.", { jahr: ab, m: erstesJahr })} `;
  if (!stark && zwischen.length === 0) {
    satz = t("{kopf}: innerhalb von {n} Jahren kaum Wirkung.", { kopf, n: versatz + n });
  } else {
    const ueber = merkZ.length
      ? ` ${t("Der Weg führt über {stationen}.", { stationen: merkZ.slice(0, 2).join(t(" und ")) })}`
      : "";
    const bis = at(n).jahr;
    const wirkung = stark
      ? ab === null
        ? t("nach {n} Jahren {groesse} {delta}", { n, groesse: gName(stark.feld), delta: deltaText(stark.feld, stark.wert) })
        : t("Bis {jahr}: {groesse} {delta}", { jahr: bis, groesse: gName(stark.feld), delta: deltaText(stark.feld, stark.wert) })
      : ab === null
        ? t("nach {n} Jahren bewegen sich die fünf Kennzahlen kaum", { n })
        : t("Bis {jahr} bewegen sich die fünf Kennzahlen kaum", { jahr: bis });
    satz = `${kopf}: ${spaet}${wirkung}${wirkung.endsWith(".") ? "" : "."}${ueber}`;
  }
  return { id, name: vName(e), von, nach, jahr: n, knoten, kanten, satz, ab };
}

export { deltaText };
