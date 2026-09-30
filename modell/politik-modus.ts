// Grundeinstellung Politik (Spec 13.10). Eigenes Modul ohne Importe aus dem Rechenkern, damit
// Bausteine es lesen können, ohne einen Import-Kreis über pakete.ts und rechne.ts zu bilden.
import type { Grundeinstellungen } from "./typen";

export type PolitikModus = "fest" | "reagiert";
export const POLITIK_STANDARD: PolitikModus = "reagiert";
export const politikAn = (g: Grundeinstellungen): boolean =>
  (g.politik ?? POLITIK_STANDARD) === "reagiert";

// Index = Jahre seit Start.
export type Ueberlagerung = Record<string, number>[];

// Spec 13.13: An jedem Auslöser stehen drei Optionen nach Motiv.
export type Motiv = "macht" | "richtung" | "unbequem";
export type Ausloeser = "schwaeche" | "eng";
export type Struktur = "sozial" | "energie" | "handel" | "markt";
export const MOTIVE: Motiv[] = ["macht", "richtung", "unbequem"];

export interface PolitikEreignis {
  jahr: number;
  art: "entscheidung" | "ruecknahme" | "risiko";
  ausloeser?: Ausloeser; // bei "entscheidung"
  motiv?: Motiv; // gewählte Option
  vorwahl?: Motiv; // was die Regel gewählt hätte
  struktur?: Struktur; // bei motiv "richtung"
  paket?: string; // bei motiv "unbequem" und ausloeser "schwaeche": Paket-Kennung
}
