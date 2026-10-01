import { pfadWert } from "./pfad";
import type { Ueberlagerung } from "./politik-modus";
import { schockWirkung } from "./schocks";
import type {
  Konstanten,
  Kontext,
  Landesdaten,
  Szenario,
  WeltId,
} from "./typen";
import { eintrag } from "./verzeichnis";
import { WELT_STANDARD } from "./welt";

export function standardWert(id: string, land: Landesdaten): number {
  const e = eintrag(id);
  return land.standards[id] ?? e.standard;
}

export function wirkstaerke(id: string, land: Landesdaten): number {
  return standardWert(id, land);
}

// Nettoimport von Energie, bei dem ein Energieschock den Nachfrageschaden aus der Schocktabelle kostet
// (Deutschland 2023, Weltbank EG.IMP.CONS.ZS).
export const ENERGIE_IMPORT_BEZUG = 70.5;

export function baueKontext(
  land: Landesdaten,
  sz: Szenario,
  c: Konstanten,
  t: number,
  ueber?: Ueberlagerung,
): Kontext {
  const start = land.datenstand;
  const jahr = start + t;
  const basis = (id: string) => standardWert(id, land);
  const wBei = (id: string, j: number) => {
    const p = sz.stell[id];
    const w = p === undefined ? basis(id) : pfadWert(p, Math.max(j, start));
    // Politik reagiert (13.10): Abweichungen der Regierung auf den Stellwert.
    // Im Bereich der Stellschraube halten, auch wenn ein Nutzer-Pfad nach dem Eingriff springt.
    const u = ueber?.[j - start]?.[id];
    if (u === undefined) return w;
    const b = eintrag(id).bereich;
    return b ? Math.min(b[1], Math.max(b[0], w + u)) : w + u;
  };
  return {
    t,
    jahr,
    start,
    land,
    grund: sz.grund,
    c,
    w: (id) => wBei(id, jahr),
    wBei,
    basis,
    aenderung: (id) =>
      wBei(id, jahr) - (t <= 1 ? basis(id) : wBei(id, jahr - 1)),
    verzoegert: (id, lag) => {
      if (lag <= 0) return wBei(id, jahr) - basis(id);
      let summe = 0;
      for (let y = jahr - lag; y < jahr; y++) summe += wBei(id, y) - basis(id);
      return summe / lag;
    },
    p: (id) => {
      const e = eintrag(id);
      if (e.art !== "wirkstaerke" && e.art !== "schwelle")
        throw new Error(`${id} ist keine Wirkstärke`);
      if (sz.aus.includes(id)) return e.neutral ?? 0;
      return basis(id);
    },
    welt: (id: WeltId) => {
      const p = sz.welt[id];
      return p === undefined ? WELT_STANDARD[id] : pfadWert(p, jahr);
    },
    // Schocks vor dem Startjahr gehören zur Vergangenheit und werden ignoriert.
    schock: schockWirkung(sz.schocks.filter((x) => x.jahr >= start), jahr, energieFaktor(land, sz)),
  };
}

// Förderländer verlieren durch teure Energie keine Nachfrage; ihr Erlös läuft über den Rohstoffsektor (M36).
function energieFaktor(land: Landesdaten, sz: Szenario): number {
  const netto = land.start.energieNettoImport;
  if (netto === undefined) return 1;
  const id = "zufall.energieImport";
  const staerke = sz.aus.includes(id) ? (eintrag(id).neutral ?? 0) : standardWert(id, land);
  return 1 + staerke * (Math.max(0, netto) / ENERGIE_IMPORT_BEZUG - 1);
}
