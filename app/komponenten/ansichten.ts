export type Ansicht = "uebersicht" | "vergleich" | "wirkungsnetz" | "rueckblick" | "annahmen";

export const NAMEN: Record<Ansicht, string> = {
  uebersicht: "Übersicht",
  vergleich: "Vergleich",
  wirkungsnetz: "Wirkungsnetz",
  rueckblick: "Rückblick",
  annahmen: "Annahmen",
};
