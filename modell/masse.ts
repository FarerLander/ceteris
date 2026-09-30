import type { Zustand } from "./typen";

// Spec 13.13: Jedes Paket und jede Option der Regierung zeigt dieselben fünf Maße nebeneinander.
// Kein Mischindex: Gewichte zwischen Wachstum, Verteilung und Umwelt wären selbst eine Wertung.
export type MassId = "wohlstand" | "gini" | "armut" | "schuld" | "co2";
export type Masse = Record<MassId, number>;

// Reihenfolge der Anzeige. mehrIstVorn: Richtung der Reihung (Wohlstand absteigend, alle anderen
// aufsteigend). gut: Färbung wie in den Diagrammen; der Gini trägt keine Wertung.
export const MASSE: { id: MassId; name: string; einheit: string; dez: number; mehrIstVorn: boolean; gut: -1 | 0 | 1 }[] = [
  { id: "wohlstand", name: "Ökonomischer Wohlstand pro Kopf", einheit: "%", dez: 1, mehrIstVorn: true, gut: 1 },
  { id: "gini", name: "Ungleichheit (Gini)", einheit: "Punkte", dez: 2, mehrIstVorn: false, gut: 0 },
  { id: "armut", name: "Armut", einheit: "Pp.", dez: 1, mehrIstVorn: false, gut: -1 },
  { id: "schuld", name: "Staatsschuld", einheit: "Pp.", dez: 0, mehrIstVorn: false, gut: -1 },
  { id: "co2", name: "CO₂-Ausstoß", einheit: "%", dez: 1, mehrIstVorn: false, gut: -1 },
];

// Unterschied von `verlauf` gegen `referenz` im Jahr t: wohlstand und co2 in %, gini in Punkten,
// armut und schuld in Prozentpunkten.
export function masse(verlauf: Zustand[], referenz: Zustand[], t: number): Masse {
  const v = verlauf[t],
    r = referenz[t];
  return {
    wohlstand: (v.bipProKopf / r.bipProKopf - 1) * 100,
    gini: v.gini - r.gini,
    armut: v.armut - r.armut,
    schuld: v.schuldQuote - r.schuldQuote,
    co2: (v.co2Mt / r.co2Mt - 1) * 100,
  };
}
