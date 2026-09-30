// Historische Kalibrierfälle (Spec 9a): ein bestehendes Land als Gerüst, dazu die Werte des Falls.
// Die Fälle erscheinen nicht in der Oberfläche; sie laufen als Tests.
import { LAENDER } from "../../app/land";
import { kalibriereStandards } from "../../modell/start";
import type { Grundeinstellungen, Landesdaten, Pfad, Schock, Startwerte, Szenario, WeltId } from "../../modell/typen";

export interface Fall {
  name: string;
  vorlage: string; // Ländercode des Gerüsts
  start: number; // Startjahr
  jahre: number; // inkl. Startjahr
  grund?: Partial<Grundeinstellungen>;
  werte?: Partial<Startwerte>;
  standards?: Record<string, number>;
  stell?: Record<string, Pfad>;
  plus?: Record<string, Pfad>; // Zuschlag auf den kalibrierten Standard (z. B. staat.uebrige)
  welt?: Partial<Record<WeltId, Pfad>>;
  schocks?: Omit<Schock, "id">[];
  aus?: string[]; // abgeschaltete umstrittene Wirkstärken (z. B. Abwanderung hinter der Mauer)
  beobachtet?: Record<string, Record<string, number>>; // Größe → Jahr → Wert (nur zur Einordnung)
  quellen: Record<string, string>;
}

export function baueFall(f: Fall): { land: Landesdaten; sz: Szenario } {
  const v = LAENDER[f.vorlage];
  if (!v) throw new Error(`Unbekannte Vorlage ${f.vorlage}`);
  const land: Landesdaten = {
    ...v,
    code: f.name,
    name: f.name,
    datenstand: f.start,
    konsens: undefined,
    hinweis: undefined,
    grund: { ...v.grund, ...f.grund },
    start: { ...v.start, ...f.werte } as Startwerte,
    standards: { ...v.standards, ...f.standards },
  };
  land.standards = kalibriereStandards(land);
  const stell: Record<string, Pfad> = { ...f.stell };
  for (const [id, p] of Object.entries(f.plus ?? {})) {
    const b = land.standards[id];
    if (b === undefined) throw new Error(`Kein Standard für ${id}`);
    stell[id] = typeof p === "number" ? b + p : p.map((s) => ({ ab: s.ab, wert: b + s.wert }));
  }
  const sz: Szenario = {
    jahre: f.jahre,
    // Tatsächliche Politik steht als Pfad im Szenario; die Regierung reagiert nicht zusätzlich (13.10).
    grund: { ...land.grund, politik: "fest" },
    stell,
    schocks: (f.schocks ?? []).map((s, i) => ({ ...s, id: i + 1 })),
    aus: f.aus ?? [],
    welt: f.welt ?? {},
  };
  return { land, sz };
}
