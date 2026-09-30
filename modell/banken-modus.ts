// Grundeinstellungen Banken und Rettung (Spec 13.6). Blatt-Modul wie politik-modus.ts: Bausteine
// lesen es, ohne einen Import-Kreis zu bilden.
import type { Grundeinstellungen, Landesdaten, Startwerte } from "./typen";

export type BankenModus = "an" | "aus";
// Entscheidung nach der Prüfung (Bauplan 13.6, Task 7, 30.09.2026): aus. Kein Krisenfall besteht
// vollständig, der Rückblick Deutschland wird mit „an“ schlechter, und Kanada zeigt im Basislauf
// Rettungen ohne Lampe davor (Kritikpunkte M31–M33).
export const BANKEN_STANDARD: BankenModus = "aus";
export type RettungModus = "schnell" | "zoegernd";
export const RETTUNG_STANDARD: RettungModus = "schnell";

// Die sieben Handwerte: alle oder keiner.
export const BANK_HANDWERTE = [
  "bankKapital0",
  "npl0",
  "bankBilanz0",
  "bankKreditAnteil",
  "bankStaatsAnteil",
  "hausVermoegen0",
  "hausBewertung0",
] as const satisfies readonly (keyof Startwerte)[];

export const bankenDaten = (s: Startwerte): boolean =>
  BANK_HANDWERTE.every((f) => Number.isFinite(s[f]));

export const bankenAn = (land: Landesdaten, g: Grundeinstellungen): boolean =>
  bankenDaten(land.start) && (g.banken ?? BANKEN_STANDARD) === "an";

export const zoegernd = (g: Grundeinstellungen): boolean =>
  (g.rettung ?? RETTUNG_STANDARD) === "zoegernd";
