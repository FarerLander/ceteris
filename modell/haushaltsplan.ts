// Haushaltspläne bis 2031 (M29). Blatt-Modul wie banken-modus.ts: Bausteine lesen es ohne Import-Kreis.
// Der Plan ist geeicht: Mit ihm folgt der Gesamtsaldo des Basislaufs dem IWF (scripts/haushaltsplan-eichung.ts).
import type { Grundeinstellungen, Landesdaten } from "./typen";

export type HaushaltsplanModus = "an" | "aus";
export const HAUSHALTSPLAN_STANDARD: HaushaltsplanModus = "an";
export const planAn = (g: Grundeinstellungen): boolean =>
  (g.haushaltsplan ?? HAUSHALTSPLAN_STANDARD) === "an";

// Wert einer Planreihe im Jahr: vor dem ersten Planjahr 0, nach dem letzten bleibt der letzte Wert
// (beschlossene Maßnahmen gelten fort). Ein Plan zu einem anderen Datenstand wirkt nicht.
function stufe(land: Landesdaten, g: Grundeinstellungen, jahr: number, reihe: "werte" | "impuls"): number {
  const p = land.plan;
  if (!p || !planAn(g) || p.datenstand !== land.datenstand) return 0;
  let wert = 0;
  for (const j of Object.keys(p[reihe]).map(Number).sort((a, b) => a - b)) if (jahr >= j) wert = p[reihe][j];
  return wert;
}

// Senkung der Primärausgaben in % BIP (positiv = weniger Defizit). Enthält den Ausgleich dessen, was das
// Modell bei Renten und Zinsen anders rechnet als der IWF.
export const planWert = (land: Landesdaten, g: Grundeinstellungen, jahr: number): number =>
  stufe(land, g, jahr, "werte");

// Der Teil, der als bewusste Politik auf die Nachfrage wirkt: der Plan ohne den Ausgleich der Renten- und
// Zinsdrift, die im Fiskalimpuls ohnehin nicht zählen (Prüfung M29, Befund 1).
export const planImpuls = (land: Landesdaten, g: Grundeinstellungen, jahr: number): number =>
  stufe(land, g, jahr, "impuls");
