import type { KapitelId } from "./typen";

// Fortschritt der Tour nur im Browser; ist der Speicher gesperrt, beginnt sie eben von vorn.
export interface TourStand {
  gesehen: boolean;
  erledigt: KapitelId[];
}

const SCHLUESSEL = "ceteris.tour";
const LEER: TourStand = { gesehen: false, erledigt: [] };

export function ladeTour(): TourStand {
  try {
    const roh = window.localStorage.getItem(SCHLUESSEL);
    if (!roh) return { ...LEER, erledigt: [] };
    const x = JSON.parse(roh) as Partial<TourStand>;
    return { gesehen: x.gesehen === true, erledigt: Array.isArray(x.erledigt) ? x.erledigt : [] };
  } catch {
    return { ...LEER, erledigt: [] };
  }
}

export function speichereTour(s: TourStand): void {
  try {
    window.localStorage.setItem(SCHLUESSEL, JSON.stringify(s));
  } catch {
    // Speicher gesperrt: nichts zu tun.
  }
}
