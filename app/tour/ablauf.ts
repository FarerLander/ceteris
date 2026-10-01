import type { Sim } from "../simulation";
import type { Kapitel, Momentaufnahme, Schritt } from "./typen";

export interface Ablauf {
  kapitel: Kapitel;
  nr: number;
}

// Nächster anwendbarer Schritt; null am Ende des Kapitels.
export function naechster(a: Ablauf, sichtbar: (s: Schritt) => boolean): Ablauf | null {
  for (let nr = a.nr + 1; nr < a.kapitel.schritte.length; nr++)
    if (sichtbar(a.kapitel.schritte[nr])) return { ...a, nr };
  return null;
}

// Voriger anwendbarer Schritt; am Anfang bleibt die Tour stehen.
export function vorheriger(a: Ablauf, sichtbar: (s: Schritt) => boolean): Ablauf {
  for (let nr = a.nr - 1; nr >= 0; nr--)
    if (sichtbar(a.kapitel.schritte[nr])) return { ...a, nr };
  return a;
}

export function momentaufnahme(sim: Sim): Momentaufnahme {
  return {
    idx: sim.idx,
    detail: sim.detail,
    schocks: sim.sz.schocks.length,
    uebernommen: sim.uebernommen.length,
    stell: sim.sz.stell,
  };
}
