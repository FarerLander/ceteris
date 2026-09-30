import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";
import { BANKEN_STANDARD, zoegernd } from "./banken-modus";
import { planAn } from "./haushaltsplan";
import { MOTIVE, politikAn, type Motiv } from "./politik-modus";
import { SCHOCKS } from "./schocks";
import type {
  Grundeinstellungen,
  Landesdaten,
  Pfad,
  Schock,
  SchockArt,
  Szenario,
} from "./typen";
import { eintrag, VERZEICHNIS } from "./verzeichnis";

const REGIME = ["welt", "eigen", "euro", "hart", "gelenkt"];
const RENTE = ["umlage", "mischung", "kapital"];
const HORIZONTE = [26, 51, 101];
export const STAERKEN = [0.5, 1, 1.5, 2, 3];
export const DAUERN = [1, 1.5, 2, 3];

function naechste(stufen: number[], v: number): number {
  const w = Math.min(stufen[stufen.length - 1], Math.max(stufen[0], v));
  return stufen.reduce((best, s) => (Math.abs(s - w) < Math.abs(best - w) ? s : best), stufen[0]);
}

interface Kompakt {
  v: number;
  j: unknown;
  g: Record<string, unknown>;
  s: Record<string, unknown>;
  k: unknown[];
  a: unknown[];
  w?: unknown; // Spec 13.13: Wahl an Entscheidungspunkten
}

// Kurzform für Links: nur Abweichungen, Schocks als Tupel.
export function kodiere(sz: Szenario): string {
  return compressToEncodedURIComponent(
    JSON.stringify({
      v: 1,
      j: sz.jahre,
      g: sz.grund,
      s: sz.stell,
      k: sz.schocks.map((x) => [x.art, x.jahr, x.staerke, x.dauer]),
      a: sz.aus,
      // Wahl der Nutzerin an Entscheidungspunkten (13.13), nur wenn es Einträge gibt.
      ...(sz.wahl && Object.keys(sz.wahl).length ? { w: sz.wahl } : {}),
    }),
  );
}

function istPfad(p: unknown): p is Pfad {
  if (typeof p === "number") return Number.isFinite(p);
  return (
    Array.isArray(p) &&
    p.length > 0 &&
    p.every(
      (x) =>
        x &&
        Number.isFinite((x as { ab: number }).ab) &&
        Number.isFinite((x as { wert: number }).wert),
    )
  );
}

// Liest einen Link-Code. Unbekanntes wird verworfen, Unlesbares ergibt null.
export function dekodiere(text: string, land: Landesdaten): Szenario | null {
  let d: Kompakt;
  try {
    const roh = decompressFromEncodedURIComponent(text);
    if (!roh) return null;
    d = JSON.parse(roh);
  } catch {
    return null;
  }
  if (!d || typeof d !== "object" || d.v !== 1) return null;
  const stellIds = new Set(
    VERZEICHNIS.filter((e) => e.art === "stellschraube").map((e) => e.id),
  );
  const umstritten = new Set(
    VERZEICHNIS.filter((e) => e.umstritten).map((e) => e.id),
  );
  const stell: Record<string, Pfad> = {};
  for (const [id, p] of Object.entries(d.s ?? {})) {
    if (!stellIds.has(id) || !istPfad(p)) continue;
    const [lo, hi] = eintrag(id).bereich ?? [-Infinity, Infinity];
    const begrenzt = (v: number) => Math.min(hi, Math.max(lo, v));
    stell[id] = typeof p === "number" ? begrenzt(p) : p.map((x) => ({ ab: x.ab, wert: begrenzt(x.wert) }));
  }
  const g = d.g ?? {};
  const grund: Grundeinstellungen = {
    regime: REGIME.includes(g.regime as string)
      ? (g.regime as Grundeinstellungen["regime"])
      : land.grund.regime,
    rentensystem: RENTE.includes(g.rentensystem as string)
      ? (g.rentensystem as Grundeinstellungen["rentensystem"])
      : land.grund.rentensystem,
    tpi: typeof g.tpi === "boolean" ? g.tpi : land.grund.tpi,
  };
  // Politik (13.10): alte Links ohne Feld rechnen mit dem Standard.
  if (g.politik === "fest" || g.politik === "reagiert") grund.politik = g.politik;
  // Banken und Rettung (13.6): alte Links ohne die Felder rechnen mit den Standards.
  if (g.banken === "an" || g.banken === "aus") grund.banken = g.banken;
  if (g.rettung === "schnell" || g.rettung === "zoegernd") grund.rettung = g.rettung;
  // Haushaltsplan (M29): alte Links ohne Feld rechnen mit dem Standard.
  if (g.haushaltsplan === "an" || g.haushaltsplan === "aus") grund.haushaltsplan = g.haushaltsplan;
  // Nur eigene Schock-Arten (keine geerbten Schlüssel wie toString), ganze Jahre nach dem Start,
  // Stärke und Dauer auf die angebotenen Stufen, keine Doppelten.
  const gesehen = new Set<string>();
  const schocks: Schock[] = (Array.isArray(d.k) ? d.k : [])
    .filter((x): x is [SchockArt, number, number, number] =>
      Array.isArray(x) && typeof x[0] === "string" && Object.hasOwn(SCHOCKS, x[0])
      && [1, 2, 3].every((i) => Number.isFinite(x[i])) && Number.isInteger(x[1]) && x[1] > land.datenstand)
    .filter((x) => {
      const schluessel = `${x[0]}|${x[1]}`;
      if (gesehen.has(schluessel)) return false;
      gesehen.add(schluessel);
      return true;
    })
    .map((x, i) => ({ id: i + 1, art: x[0], jahr: x[1], staerke: naechste(STAERKEN, x[2]), dauer: naechste(DAUERN, x[3]) }));
  const aus = (Array.isArray(d.a) ? d.a : []).filter(
    (id): id is string => typeof id === "string" && umstritten.has(id),
  );
  // Wahl an Entscheidungspunkten (13.13): nur Schlüssel „<Jahr>-<Auslöser>“ mit bekanntem Motiv. Alte
  // Links ohne das Feld und alles Unbekannte ergeben keine Wahl.
  const wahl: Record<string, Motiv> = {};
  if (d.w && typeof d.w === "object" && !Array.isArray(d.w))
    for (const [k, m] of Object.entries(d.w as Record<string, unknown>))
      if (/^\d{4}-(schwaeche|eng)$/.test(k) && typeof m === "string" && (MOTIVE as string[]).includes(m)) wahl[k] = m as Motiv;
  return {
    jahre: HORIZONTE.includes(d.j as number) ? (d.j as number) : 51,
    grund,
    stell,
    schocks,
    aus,
    welt: {},
    ...(Object.keys(wahl).length ? { wahl } : {}),
  };
}

export function istBasis(sz: Szenario, land: Landesdaten): boolean {
  return (
    Object.keys(sz.stell).length === 0 &&
    sz.schocks.length === 0 &&
    sz.aus.length === 0 &&
    Object.keys(sz.wahl ?? {}).length === 0 &&
    sz.jahre === 51 &&
    sz.grund.regime === land.grund.regime &&
    sz.grund.rentensystem === land.grund.rentensystem &&
    sz.grund.tpi === land.grund.tpi &&
    politikAn(sz.grund) === politikAn(land.grund) &&
    (sz.grund.banken ?? BANKEN_STANDARD) === (land.grund.banken ?? BANKEN_STANDARD) &&
    zoegernd(sz.grund) === zoegernd(land.grund) &&
    planAn(sz.grund) === planAn(land.grund)
  );
}
