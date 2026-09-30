import { basisSzenario, rechne } from "../rechne";
import type { Landesdaten, Zustand } from "../typen";

// Der Lauf, den der Neutralitätstest mit dem Abzug vergleicht. scripts/abzug.ts zieht den Abzug mit
// genau diesem Lauf; beide müssen dieselben Einstellungen haben, sonst passt ein neuer Abzug nicht.
// Mechanik seit dem Abzug, abgeschaltet muss sie bitgenau wie vorher rechnen.
// 13.5 Teil A: Asymmetrie des Kreditimpulses (aus = symmetrisch).
// 13.5 Teil B: Akzelerator (aus = 0). Die Zinswirkung auf Investitionen ist von 0,6 auf 0,15 gesenkt;
// mit dem alten Wert rechnet die Mechanik bitgenau wie vorher. Öffentliche Investitionen: ohne Änderung
// am Hebel wirkt nichts.
// 13.1: Mechanik mit Handwerten. 13.10: Politik fest. 13.6: Banken aus. M29: Haushaltsplan aus.
export const NEU_AUS = ["wachstum.kreditAsymmetrie", "wachstum.akzelerator"];
export const ALTE_WERTE = { "wachstum.investElastizitaet": 0.6 };

export function neutralLauf(land0: Landesdaten): Zustand[] {
  const land = { ...land0, standards: { ...land0.standards, ...ALTE_WERTE } };
  return rechne(land, {
    ...basisSzenario(land),
    aus: NEU_AUS,
    grund: { ...land.grund, politik: "fest", banken: "aus", haushaltsplan: "aus" },
  });
}
