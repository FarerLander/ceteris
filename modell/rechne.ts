import { BAUSTEINE } from "./bausteine";
import { fruehwarnung } from "./fruehwarnung";
import { baueKontext } from "./kontext";
import { lage } from "./lage";
import { neuerStand, politikAn, politikSchritt, type Ueberlagerung } from "./politik";
import { startzustand } from "./start";
import type { Baustein, Landesdaten, Schock, Szenario, Zustand } from "./typen";

// Zufallsschocks (Spec 13.4): Vor jedem Jahr entscheidet der Zieher aus dem Vorjahr, welche Schocks
// neu beginnen und wie stark die Nachfrage zufällig abweicht (% BIP). Ohne Zieher rechnet alles wie bisher.
export type Zieher = (alt: Zustand, jahr: number, schocks: Schock[]) => { schocks: Schock[]; luecke: number };

export function basisSzenario(land: Landesdaten, jahre = 51): Szenario {
  return {
    jahre,
    grund: { ...land.grund },
    stell: {},
    schocks: [],
    aus: [],
    welt: {},
  };
}

export function kopie(z: Zustand): Zustand {
  return {
    ...z,
    alter: [...z.alter],
    migJahrgaenge: z.migJahrgaenge.map((j) => ({ ...j })),
    mix: { ...z.mix },
    atomZubau: [...z.atomZubau],
    politik: [],
  };
}

export function rechne(
  land: Landesdaten,
  sz: Szenario,
  bausteine: Baustein[] = BAUSTEINE,
): Zustand[] {
  return rechneMit(land, sz, bausteine).verlauf;
}

export function rechneZufall(land: Landesdaten, sz: Szenario, zieher: Zieher): Zustand[] {
  return rechneMit(land, sz, BAUSTEINE, zieher).verlauf;
}

// Überlagerungen der Regierung je Jahr (Spec 13.10), für Tests und Anzeige.
export function politikUeber(land: Landesdaten, sz: Szenario): Ueberlagerung {
  return rechneMit(land, sz, BAUSTEINE).ueber;
}

function rechneMit(
  land: Landesdaten,
  sz: Szenario,
  bausteine: Baustein[],
  zieher?: Zieher,
): { verlauf: Zustand[]; ueber: Ueberlagerung } {
  const { z, c } = startzustand(land, sz);
  const verlauf: Zustand[] = [z];
  const reagiert = politikAn(sz.grund);
  const ueber: Ueberlagerung = [{}];
  const stand = neuerStand();
  for (let t = 1; t < sz.jahre; t++) {
    const alt = verlauf[t - 1];
    const neu = kopie(alt);
    neu.jahr = alt.jahr + 1;
    // Zufallsschocks dieses Jahres zuerst: Die Regierung sieht ihre Ausgaben (Sperrklinke, Spec 13.13).
    const zug = zieher?.(alt, neu.jahr, sz.schocks);
    if (zug?.schocks.length) sz = { ...sz, schocks: [...sz.schocks, ...zug.schocks] };
    // Politik reagiert: erst die Reaktion aus dem Vorjahr, dann der Jahresschritt mit ihr.
    if (reagiert) ueber[t] = politikSchritt(stand, verlauf, neu, baueKontext(land, sz, c, t, ueber), sz);
    const k = baueKontext(land, sz, c, t, reagiert ? ueber : undefined);
    if (zug) k.schock.luecke += zug.luecke;
    for (const b of bausteine) b(alt, neu, k);
    fruehwarnung(alt, neu, k);
    neu.lage = lage(alt, neu, k);
    // Währungsschnitt, rein rechnerisch: Quoten bleiben gleich, die Zahlen bleiben endlich.
    if (neu.preisniveau > 1e12)
      for (const f of ["preisniveau", "schuldNom", "defizitNom", "schnittNom"] as const)
        neu[f] /= 1e12;
    verlauf.push(neu);
  }
  return { verlauf, ueber };
}
