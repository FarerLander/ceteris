import type { Ansicht } from "../komponenten/ansichten";
import type { Sim } from "../simulation";

// Hilfe-Modus: Kapitel und Schritte der geführten Tour.

// Was die Tour an der Oberfläche bewegen darf.
export interface TourUi {
  setzeAnsicht(a: Ansicht): void;
  setzeFokus(id: string): void;
  // Desktop: Seitenleiste aufklappen; Smartphone: Blatt öffnen, auf Seite `seite`.
  oeffneSeitenleiste(seite?: number): void;
  // Stellt den Zustand vor dem Schritt wieder her.
  schliesseSeitenleiste(): void;
}

// Zustand, an dem eine Aufgabe erkennt, dass sie erledigt ist.
export interface Momentaufnahme {
  idx: number;
  detail: string;
  schocks: number;
  uebernommen: number;
  stell: Record<string, unknown>;
}

export interface Schritt {
  id: string;
  ziel: string | null; // Wert von data-tour; null = Mitte des Bildschirms
  text: string; // deutscher Text, übersetzt über t()
  aufgabe?:
    | { art: "sim"; erledigt(start: Momentaufnahme, jetzt: Momentaufnahme): boolean }
    | { art: "klick"; innerhalb: string }; // Selektor relativ zum Ziel
  // Führt die Aufgabe aus; gibt einen Selektor zurück, wenn ein Element geklickt werden soll.
  vormachen?(sim: Sim, ui: TourUi): void | { klick: string };
  vorbereiten?(ui: TourUi): void;
  seitenleiste?: number; // Ziel liegt in der Seitenleiste (Seite im Blatt auf dem Smartphone)
  nurWenn?(sim: Sim): boolean; // sonst übersprungen
}

export type KapitelId = "erkundung" | "wirkungsnetz" | "einstellen" | "pruefen";

export interface Kapitel {
  id: KapitelId;
  titel: string;
  schritte: Schritt[];
}
