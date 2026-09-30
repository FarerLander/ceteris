// Frühwarn-Größen (Spec 13.2). Werden nach jedem Jahresschritt nur mitgeschrieben; nichts in der
// Rechnung liest sie, sie speisen Warnlampen und Diagramme.
import { bankenAn } from "./banken-modus";
import type { Kontext, Zustand } from "./typen";

// BIS: einseitiger HP-Filter mit λ = 400.000 für Quartale; für Jahresdaten 400.000/4⁴ (Ravn/Uhlig 2002).
export const KREDIT_LAMBDA = 1562.5;

// Der einseitige HP-Filter ist ein Kalman-Filter für einen lokalen linearen Trend (Messrauschen 1,
// Rauschen der Steigung 1/λ). Die stationäre Verstärkung macht ihn zu einer billigen Rekursion.
export function kreditGewichte(lambda: number): [number, number] {
  const q = 1 / lambda;
  let [p00, p01, p11] = [1e4, 0, 1e4];
  let g: [number, number] = [0, 0];
  for (let i = 0; i < 2000; i++) {
    // Vorhersage: Niveau' = Niveau + Steigung, Steigung' = Steigung + η
    const a00 = p00 + 2 * p01 + p11,
      a01 = p01 + p11,
      a11 = p11 + q;
    const f = a00 + 1;
    g = [a00 / f, a01 / f];
    [p00, p01, p11] = [a00 - g[0] * a00, a01 - g[0] * a01, a11 - g[1] * a01];
  }
  return g;
}
const [G0, G1] = kreditGewichte(KREDIT_LAMBDA);

// Bei Gemeinschaftswährung zählt der Euroraum-Leitzins, sonst der eigene (Spec 13.2).
export const leitzinsBezug = (k: Kontext, leitzins: number): number =>
  k.grund.regime === "euro" ? k.welt("euroLeitzins") : leitzins;

export function fruehwarnung(alt: Zustand, neu: Zustand, k: Kontext): void {
  const vorher = alt.kreditTrend + alt.kreditSteigung;
  const fehler = neu.privatschuld - vorher;
  neu.kreditTrend = vorher + G0 * fehler;
  neu.kreditSteigung = alt.kreditSteigung + G1 * fehler;
  neu.kreditluecke = neu.privatschuld - neu.kreditTrend;
  neu.zinskurve = neu.rendite - leitzinsBezug(k, neu.leitzins);
  // Hauspreis-Lücke (Spec 13.6): derselbe Filter auf 100·ln(Hauspreis).
  if (!bankenAn(k.land, k.grund)) return;
  const hausVorher = alt.hausTrend + alt.hausSteigung;
  const hausFehler = neu.hp - hausVorher;
  neu.hausTrend = hausVorher + G0 * hausFehler;
  neu.hausSteigung = alt.hausSteigung + G1 * hausFehler;
  neu.hausluecke = neu.hp - neu.hausTrend;
}
