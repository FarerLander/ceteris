import type { WeltId } from "./typen";

// Vorgegebene Pfade für das Ausland. Im Szenario überschreibbar (Szenario.welt).
export const WELT_STANDARD: Record<WeltId, number> = {
  realzins: 0.8, // % neutraler Weltrealzins
  nachfrage: 2.5, // % reales Wachstum der Weltnachfrage
  oel: 70, // $/Barrel
  gas: 35, // €/MWh
  kohle: 100, // €/t
  euroLeitzins: 2.0, // %
  euroInflation: 2.0, // %
  weltInflation: 2.5, // %
  grenzeWachstum: 1.0, // % Produktivitätswachstum an der Grenze (USA)
  bestandWachstum: 1.5, // % Wachstum des Währungsbestands (nur harte Währung)
  weltEnergiepreis: 100, // Index Industrie-Energiepreis Wettbewerber
  praemieWelt: 0, // Pp. Abweichung der weltweiten Laufzeitprämie vom Startjahr
  metalle: 100, // Index Metallpreise
};
