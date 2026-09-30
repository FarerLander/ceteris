import type { Baustein, Kontext } from "../typen";
import { WELT_STANDARD } from "../welt";

// Rohstoffe (Spec 6.11, Update 4a), Teil von Baustein 3 „Energie und Rohstoffe“; energie.ts ruft
// die Funktion am Ende auf. Länder ohne Rohstoffexporte (G7) bleiben beim Startwert.

function index(k: Kontext, oel: number, gas: number, metalle: number): number {
  const g = k.land.start.rohstoffGewichte ?? { oel: 1, gas: 0, metalle: 0 };
  return (
    (g.oel * oel) / WELT_STANDARD.oel +
    (g.gas * gas) / WELT_STANDARD.gas +
    (g.metalle * metalle) / WELT_STANDARD.metalle
  );
}

// Preisindex im laufenden Jahr; Öl und Gas mit Energieschock.
export function preisindex(k: Kontext, mitSchock: boolean): number {
  const f = mitSchock ? 1 + k.schock.energie / 100 : 1;
  return index(k, k.welt("oel") * f, k.welt("gas") * f, k.welt("metalle"));
}

// Bezug: die Startdaten spiegeln die Standardpreise. Ein Szenario, das den Preis von Anfang an
// ändert, wirkt deshalb ab dem ersten Jahr.
// Historische Fälle geben den Preis ihres Startjahres an (rohstoffBezug).
export const preisindexStart = (k: Kontext): number => {
  const b = k.land.start.rohstoffBezug ?? WELT_STANDARD;
  return index(k, b.oel, b.gas, b.metalle);
};

export const rohstoffe: Baustein = (alt, neu, k) => {
  const s = k.land.start;
  const x0 = s.rohstoffExporte ?? 0;
  if (x0 <= 0) return; // Kein Rohstoffland: alles bleibt beim Startwert.
  const dR = k.w("ordnung.rechtsstaat") - k.basis("ordnung.rechtsstaat");
  const dS = k.w("ordnung.staatsanteil") - k.basis("ordnung.staatsanteil");
  neu.foerderZustand =
    alt.foerderZustand * (1 - k.p("rohstoff.verfall") * Math.max(0, (dS - dR) / 100));
  const sanktion = Math.max(
    0,
    1 + k.schock.rohstoff * (1 - 0.6 * k.w("rohstoff.diversifizierung")),
  );
  // Menge in % BIP schrumpft relativ, wenn die übrige Wirtschaft wächst.
  neu.rohstoffMenge = (k.w("rohstoff.foerderung") / 100) * neu.foerderZustand * sanktion;
  const menge = neu.rohstoffMenge * (k.c.y0 / alt.Y);
  // Ohne Gewichte (alle 0) gibt es keinen Preisindex: Preis wirkt dann nicht.
  const p0 = preisindexStart(k);
  // Weltpreise gelten in Fremdwährung: Wertet die Landeswährung real auf, sinkt der Erlös
  // in Landeswährung und damit der Anteil am BIP (Update 4c, Kalibrierfall Venezuela).
  // Nach einem Kurssturz (Hyperinflation) zählt der Kurs als Teiler höchstens bis 0,8; sonst
  // verdoppelte sich der Erlös mehrfach. Aufwertung wirkt voll (Venezuela 2013 rund 3,4-fach).
  neu.rohstoffExporte =
    (x0 * menge * (p0 > 0 ? preisindex(k, true) / p0 : 1)) / Math.max(0.8, alt.wechselkurs);

  // Haushalt: Mehreinnahmen über der Referenz (Startpreis) gehen zum Fondsanteil in den Fonds,
  // fehlt etwas, zahlt der Fonds, solange er reicht.
  const staat = s.rohstoffStaat ?? 0;
  const einnahmen = staat * neu.rohstoffExporte;
  const referenz = staat * x0 * menge;
  const f = k.w("rohstoff.fondsAnteil") / 100;
  const fondsAlt =
    (alt.rohstoffFonds * (1 + k.p("rohstoff.fondsRendite") / 100)) / (1 + alt.wachstum);
  const zufluss = einnahmen > referenz ? f * (einnahmen - referenz) : 0;
  const auszahlung =
    einnahmen < referenz ? Math.min(fondsAlt, f * (referenz - einnahmen)) : 0;
  neu.rohstoffFonds = fondsAlt + zufluss - auszahlung;
  neu.rohstoffHaushalt = einnahmen - zufluss + auszahlung - staat * x0;
};
