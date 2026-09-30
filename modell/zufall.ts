// Zufallsschocks und Unsicherheitsbänder (Spec 13.4). Die Hauptlinie bleibt ohne Zufall; hier
// entstehen viele Läufe mit gewürfelten Schocks und daraus ein Fächer (Quantile je Jahr).
import { bankenAn } from "./banken-modus";
import { standardWert } from "./kontext";
import { rechneZufall, type Zieher } from "./rechne";
import { SCHOCKS } from "./schocks";
import { REIHEN, wertVon, type ReihenId } from "./reihen";
import type {
  Landesdaten,
  Schock,
  SchockArt,
  Szenario,
  Zustand,
} from "./typen";
import { eintrag } from "./verzeichnis";

export const LAEUFE = 200;
export const SAAT = 1;

// Gewürfelte Arten, in fester Reihenfolge (die Reihenfolge bestimmt die Zufallsfolge).
export const ZUFALL_ARTEN: readonly SchockArt[] = [
  "krise",
  "oel",
  "pandemie",
  "proxy",
];
// Nach einem Schock beginnt so viele Jahre kein neuer derselben Art (sein Verlauf läuft noch).
const SPERRE = 3;
// Vor einem gesetzten Schock derselben Art bleibt der Zufall so viele Jahre still.
const VORLAUF = 2;
// So viele Jahre wirkt ein Schock: längster Kanal mal Dauer.
const wirkJahre = (s: Schock): number =>
  Math.ceil(Math.max(...Object.values(SCHOCKS[s.art].wirkung).map((r) => r.length)) * Math.max(0.25, s.dauer));
const STAERKE_BEREICH: [number, number] = [0.4, 2.5];

// Wert aus dem Verzeichnis; abgeschaltete Einträge (Annahmen) zählen mit ihrem neutralen Wert.
function p(land: Landesdaten, sz: Szenario, id: string): number {
  return sz.aus.includes(id)
    ? (eintrag(id).neutral ?? 0)
    : standardWert(id, land);
}

// Kleiner, schneller Zufallsgenerator mit fester Saat (mulberry32): gleiche Saat, gleiche Folge.
function generator(saat: number): () => number {
  let a = saat >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Standardnormal aus zwei Gleichverteilten (Box/Muller).
const normal = (u1: number, u2: number) =>
  Math.sqrt(-2 * Math.log(Math.max(u1, 1e-12))) * Math.cos(2 * Math.PI * u2);

// Wahrscheinlichkeit einer Finanzkrise im nächsten Jahr, in Prozent. Steigt mit der Kreditlücke und,
// wenn „Häuser und Banken“ an ist, mit der Hauspreislücke (Kritikpunkt M31).
export function krisenRisiko(
  land: Landesdaten,
  sz: Szenario,
  kreditluecke: number,
  hausluecke: number,
): number {
  const basis = p(land, sz, "zufall.kriseBasis") / 100;
  if (basis <= 0) return 0;
  const haus = bankenAn(land, sz.grund)
    ? p(land, sz, "zufall.kriseHaus") * hausluecke
    : 0;
  const x =
    Math.log(basis / (1 - basis)) +
    p(land, sz, "zufall.kriseKredit") * kreditluecke +
    haus;
  return Math.min(p(land, sz, "zufall.kriseMax"), 100 / (1 + Math.exp(-x)));
}

// Zieher für einen Lauf. Jedes Jahr werden gleich viele Zufallszahlen in fester Reihenfolge gezogen,
// egal was passiert: So treffen zwei Szenarien mit derselben Saat auf dieselbe Zufallsfolge.
export function zieher(
  land: Landesdaten,
  sz: Szenario,
  saat: number,
  nr: number,
): Zieher {
  const zufall = generator(
    Math.imul(saat, 0x9e3779b1) ^ Math.imul(nr + 1, 0x85ebca6b),
  );
  const streuung = p(land, sz, "zufall.staerke");
  const konjunktur = p(land, sz, "zufall.konjunktur");
  const ruhe = p(land, sz, "zufall.kriseRuhe");
  let id = 0;
  return (alt: Zustand, jahr: number, schocks: Schock[]) => {
    const neu: Schock[] = [];
    for (const art of ZUFALL_ARTEN) {
      const u = zufall();
      const n = normal(zufall(), zufall());
      const risiko =
        art === "krise"
          ? krisenRisiko(land, sz, alt.kreditluecke, alt.hausluecke)
          : p(land, sz, `zufall.${art}`);
      if (u * 100 >= risiko) continue;
      const sperre = art === "krise" ? Math.max(SPERRE, ruhe) : SPERRE;
      // Schocks vor dem Startjahr gehören zur Vergangenheit; das Modell ignoriert sie, der Zufall auch.
      const gesperrt = schocks.some(
        (s) =>
          s.art === art &&
          s.jahr >= land.datenstand &&
          (s.jahr <= jahr ? jahr - s.jahr < Math.max(sperre, wirkJahre(s)) : s.jahr - jahr <= VORLAUF),
      );
      if (gesperrt) continue;
      const staerke = Math.min(
        STAERKE_BEREICH[1],
        Math.max(STAERKE_BEREICH[0], Math.exp(streuung * n)),
      );
      neu.push({
        id: --id,
        art,
        jahr,
        staerke: Math.round(staerke * 100) / 100,
        dauer: 1,
      });
    }
    return { schocks: neu, luecke: konjunktur * normal(zufall(), zufall()) };
  };
}

export function zufallsLauf(
  land: Landesdaten,
  sz: Szenario,
  saat: number,
  nr: number,
): Zustand[] {
  return rechneZufall(land, sz, zieher(land, sz, saat, nr));
}

// Schuldenkrise des Staates: Risikoaufschlag über der Krisenschwelle oder ein Ventil (Schuldenschnitt, Inflation).
export function schuldenkrise(
  land: Landesdaten,
  sz: Szenario,
  z: Zustand,
): boolean {
  return z.ventilSeit === 0 || z.aufschlag > p(land, sz, "schwelle.aufschlag");
}

export interface Sammlung {
  land: Landesdaten;
  sz: Szenario;
  saat: number;
  laeufe: number;
  fertig: number;
  ids: ReihenId[];
  werte: Float64Array[]; // je Reihe: [Jahr × Lauf]
  krise: Uint8Array; // [Jahr × Lauf]: Schuldenkrise bis zu diesem Jahr
  schocks: number;
}

export function neueSammlung(
  land: Landesdaten,
  sz: Szenario,
  laeufe = LAEUFE,
  saat = SAAT,
): Sammlung {
  const ids = Object.keys(REIHEN) as ReihenId[];
  return {
    land,
    sz,
    saat,
    laeufe,
    fertig: 0,
    ids,
    werte: ids.map(() => new Float64Array(sz.jahre * laeufe)),
    krise: new Uint8Array(sz.jahre * laeufe),
    schocks: 0,
  };
}

// Rechnet den nächsten Lauf. Gibt zurück, ob noch Läufe fehlen (für das Rechnen in Häppchen).
export function naechsterLauf(s: Sammlung): boolean {
  if (s.fertig >= s.laeufe) return false;
  const nr = s.fertig;
  const z = zieher(s.land, s.sz, s.saat, nr);
  const verlauf = rechneZufall(s.land, s.sz, (alt, jahr, schocks) => {
    const zug = z(alt, jahr, schocks);
    s.schocks += zug.schocks.length;
    return zug;
  });
  let krise = 0;
  verlauf.forEach((zustand, t) => {
    s.ids.forEach(
      (id, i) => (s.werte[i][t * s.laeufe + nr] = wertVon(zustand, id)),
    );
    if (t > 0 && schuldenkrise(s.land, s.sz, zustand)) krise = 1;
    s.krise[t * s.laeufe + nr] = krise;
  });
  s.fertig++;
  return s.fertig < s.laeufe;
}

export interface Band {
  p10: number[];
  p25: number[];
  p50: number[];
  p75: number[];
  p90: number[];
}

export interface Faecher {
  laeufe: number;
  band: Record<ReihenId, Band>;
  beispiel: Record<ReihenId, number[]>; // ein einzelner Lauf (der erste)
  schuldenkrise: number[]; // Anteil der Läufe mit Schuldenkrise bis zum Jahr (Index wie der Verlauf)
  schocksJeLauf: number; // mittlere Zahl großer Zufallsschocks
}

// Quantil einer sortierten Liste, linear zwischen den Nachbarn.
function quantil(sortiert: Float64Array, q: number): number {
  const x = q * (sortiert.length - 1);
  const i = Math.floor(x);
  return i + 1 < sortiert.length
    ? sortiert[i] + (x - i) * (sortiert[i + 1] - sortiert[i])
    : sortiert[i];
}

// Auswertung der bisher gerechneten Läufe.
export function faecher(s: Sammlung): Faecher {
  const n = Math.max(1, s.fertig);
  const jahre = s.sz.jahre;
  const band = {} as Record<ReihenId, Band>;
  const beispiel = {} as Record<ReihenId, number[]>;
  s.ids.forEach((id, i) => {
    const b: Band = { p10: [], p25: [], p50: [], p75: [], p90: [] };
    const einer: number[] = [];
    for (let t = 0; t < jahre; t++) {
      const zeile = s.werte[i].slice(t * s.laeufe, t * s.laeufe + n);
      einer.push(zeile[0]);
      zeile.sort();
      b.p10.push(quantil(zeile, 0.1));
      b.p25.push(quantil(zeile, 0.25));
      b.p50.push(quantil(zeile, 0.5));
      b.p75.push(quantil(zeile, 0.75));
      b.p90.push(quantil(zeile, 0.9));
    }
    band[id] = b;
    beispiel[id] = einer;
  });
  const schuldenkrise: number[] = [];
  for (let t = 0; t < jahre; t++) {
    let summe = 0;
    for (let nr = 0; nr < n; nr++) summe += s.krise[t * s.laeufe + nr];
    schuldenkrise.push(summe / n);
  }
  return {
    laeufe: s.fertig,
    band,
    beispiel,
    schuldenkrise,
    schocksJeLauf: s.schocks / n,
  };
}
