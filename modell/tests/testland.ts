import { kalibriereStandards } from "../start";
import type { Grundeinstellungen, Landesdaten, Startwerte } from "../typen";

// Deutschland-ähnliches Land mit festen Zahlen, unabhängig von echten Daten.
const ANTEILE = [
  4.7, 4.7, 4.6, 4.6, 5.2, 5.8, 6.6, 6.4, 6.1, 5.8, 6.6, 7.9, 7.4, 6.2, 5.0,
  4.2, 8.2,
];

// Bankwerte für Tests von Spec 13.6; das Testland selbst hat keine (Baustein rechnet dann nicht).
export const BANKWERTE = {
  bankKapital0: 8,
  npl0: 2,
  bankBilanz0: 200,
  bankKreditAnteil: 0.8,
  bankStaatsAnteil: 0.2,
  hausVermoegen0: 180,
  hausBewertung0: 10,
} satisfies Partial<Startwerte>;

export function testland(
  start: Partial<Startwerte> = {},
  grund: Partial<Grundeinstellungen> = {},
): Landesdaten {
  const summe = ANTEILE.reduce((a, b) => a + b, 0);
  const s: Startwerte = {
    bev: 83.5,
    altersanteile: ANTEILE.map((x) => x / summe),
    tfr: 1.35,
    lebenserwartung: 81,
    bip: 4300,
    kapitalkoeffizient: 3,
    tfpTrend: 0.6,
    lohnquote: 0.53,
    nairu: 3.5,
    alq: 3.5,
    erwerbsquote: 0.78,
    investQuote: 21,
    produktivitaetsLuecke: 0.9,
    inflation: 2.2,
    leitzins: 2,
    rendite: 2.6,
    effZins: 1.6,
    qe: 20,
    schuldQuote: 63,
    einnahmen: 47.5,
    ausgaben: 49.5,
    rentenausgaben: 10.3,
    alg: 1.4,
    steuerBasen: {
      einkommen: 55,
      sozialabgaben: 44,
      mwst: 37,
      unternehmen: 7.3,
      kapitalertrag: 3.5,
      vermoegen: 300,
      erbschaft: 10,
    },
    mix: { kohle: 0.23, gas: 0.18, oel: 0.03, atom: 0, ern: 0.56 },
    co2Mt: 650,
    importquote: 0.65,
    industrieTWh: 230,
    netzkosten: 30,
    energieExportAnteil: 0.15,
    exporte: 47,
    importe: 42,
    nfa: 70,
    lbRest: 0,
    privatschuld: 110,
    dsrSchwelle: 17,
    vcBasis: 0.07,
    eurogewicht: 0.28,
    fluchtReaktion: -0.5,
    reserve: 0,
    armut: 15.5,
    gini: 31.5,
    ...start,
  };
  const land: Landesdaten = {
    code: "TT",
    name: "Testland",
    datenstand: 2025,
    qualitaet: "gruen",
    // Das Testland prüft Mechanik; die Regierung reagiert nur, wenn ein Test das verlangt (13.10).
    grund: { regime: "euro", rentensystem: "umlage", tpi: false, politik: "fest", ...grund },
    waehrung: { symbol: "€", kurs: 1 },
    standards: {},
    start: s,
    markiert: [],
  };
  land.standards = kalibriereStandards(land);
  return land;
}
