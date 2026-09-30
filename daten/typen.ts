import type { Grundeinstellungen, KonsensQuelle, Landesdaten, Schaetzwert, SchockArt, Startwerte, Waehrung, WeltId } from "../modell/typen";
import type { Punkt } from "./schaetzung/modell";

export type Reihe = Record<number, number>;

export interface AutoDatei {
  code: string;
  iso3: string;
  abgerufen: string;
  reihen: Record<string, Reihe>;
  quellen: Record<string, string>;
  fehlend: string[];
  konsens?: KonsensQuelle; // IWF-Prognosen, getrennt von den Ist-Reihen (Spec 12a)
}

export interface HandDatei {
  code: string;
  name: string;
  qualitaet: "gruen" | "gelb" | "rot";
  grund: Grundeinstellungen;
  standards: Record<string, number>;
  werte: Partial<Startwerte>; // nur von Hand gepflegte Startwerte
  ersatz: Partial<Startwerte>; // gilt, wenn eine automatische Reihe fehlt
  quellen: Record<string, string>;
  waehrung?: Waehrung;
  hinweis?: string;
  politik?: Landesdaten["politik"]; // Spec 13.13
  schaetzungAus?: Record<string, string>; // Größe → Grund: Handwert trotz gültiger Schätzung (Spec 13.1)
}

// Ergebnis des Kalman-Filters je Land (Spec 13.1), erzeugt von daten/schaetze.ts.
export interface SchaetzDatei {
  code: string;
  jahr: number; // Startjahr, für das die Werte gelten (= Datenstand)
  stand: string; // = auto.abgerufen, damit zwei Läufe byte-gleich sind
  methode: string;
  kappa: number;
  werte: Schaetzwert[];
  reihen: { g: Punkt[]; luecke: Punkt[]; nairu: Punkt[]; rStern: Punkt[] | null }; // für 13.5
  fehler?: string; // Schätzung nicht möglich; dann werte = []
  kredit?: { jahr: number; trend: number; steigung: number }; // Start der Kreditlücke (Spec 13.2)
  // Start der Hauspreislücke (Spec 13.6), in 100·ln(Index): Trend minus Niveau des Jahres, Steigung je
  // Jahr, realer Anstieg im Jahr.
  haus?: { jahr: number; trend: number; steigung: number; wachstum: number };
}

export interface HistorieDatei {
  politik?: Landesdaten["politik"]; // Spec 13.13: Wirksamkeit und Wahltakt im Startjahr des Rückblicks
  ist?: Record<string, Record<string, number>>; // Ist-Reihen ohne freie Schnittstelle
  stellRelativ?: Record<string, [number, number][]>; // Abweichung vom kalibrierten Standard des Startjahres
  start: number;
  standards: Record<string, number>;
  werte: Partial<Startwerte>;
  stell: Record<string, [number, number][]>;
  welt: Partial<Record<WeltId, Record<string, number>>>;
  schocks: { art: SchockArt; jahr: number; staerke: number }[];
  quellen: Record<string, string>;
}
