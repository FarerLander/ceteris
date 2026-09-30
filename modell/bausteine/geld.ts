import { clamp } from "../mathe";
import type { Baustein, Kontext } from "../typen";

// Gelenkte Währung: neutraler Realzins. Startet beim Realzins des Startjahres und nähert sich
// jedes Jahr dem Weltrealzins (Update 4b). Leitzins und Schattenkurs messen daran.
// Bezug des Realzinses für Nachfrage, Kredit und Schattenkurs: bei gelenkter Währung dieser Pfad,
// sonst der Realzins des Startjahres.
export function realzinsBezug(k: Kontext): number {
  return k.grund.regime === "gelenkt" ? gelenktNeutral(k) : k.c.realzins0;
}

export function gelenktNeutral(k: Kontext): number {
  return (
    k.welt("realzins") +
    (k.c.realzins0 - k.welt("realzins")) *
      Math.pow(1 - 1 / k.p("geld.gelenktAngleichung"), k.t)
  );
}

export const geld: Baustein = (alt, neu, k) => {
  const regime = k.grund.regime;
  const ziel = k.w("geld.inflationsziel");
  const energieDruck =
    k.p("energie.durchreichInflation") * (neu.energiepreis - alt.energiepreis);
  const importDruck = k.p("geld.importDurchwirkung") * alt.abwertung;
  const zollDruck = k.p("handel.zollInflation") * k.aenderung("handel.zoelle");
  const auslastung = k.p("geld.phillips") * neu.luecke * 100;

  if (regime === "hart") {
    // Kein Inflationsziel: Preise folgen dem Verhältnis von Währungsbestand zu Wirtschaftsleistung.
    neu.inflErw = 0.5 * alt.inflErw + 0.5 * alt.inflation;
    neu.inflation =
      k.welt("bestandWachstum") -
      neu.wachstum * 100 +
      auslastung +
      energieDruck +
      zollDruck +
      k.schock.inflation;
  } else {
    // Über der Schwelle bröckelt der Anker der Erwartungen (Update 4a).
    const schwelle = k.p("geld.ankerSchwelle");
    const anker =
      k.p("geld.anker") / (1 + Math.max(0, alt.inflation - schwelle) / schwelle);
    neu.inflErw = anker * ziel + (1 - anker) * alt.inflation;
    neu.inflation =
      neu.inflErw +
      auslastung +
      energieDruck +
      importDruck +
      zollDruck +
      k.schock.inflation;
  }
  // Nach einer Monetarisierung (Ventil) drei Jahre Inflationsschub.
  if (alt.ventilArt === 2 && alt.ventilSeit < 3) neu.inflation += k.p("geld.monetarisierung");
  // Notenbankfinanzierung (Cagan 1956): der finanzierte Teil des Defizits trifft auf die Geldnachfrage,
  // die bei hoher erwarteter Inflation schrumpft.
  const defizitVj =
    alt.Y > 0 ? (alt.defizitNom / (alt.Y * alt.preisniveau)) * 100 : 0;
  const betrag =
    (k.w("ordnung.notenbankfinanzierung") / 100) * Math.max(0, defizitVj);
  if (betrag > 0) {
    const nachfrage =
      k.p("geld.basisgeld") *
      Math.exp((-k.p("geld.cagan") * Math.max(0, alt.inflErw)) / 100);
    neu.inflation += (100 * betrag) / Math.max(0.1, nachfrage);
  }
  neu.inflation = clamp(neu.inflation, -20, 1e6);

  // Preiskontrollen: ein Teil der Inflation wird unterdrückt und staut sich; fallen die
  // Kontrollen, holen die Preise den Stau nach. Knappheit = kontrollierter Anteil × Stau.
  neu.inflationWahr = neu.inflation;
  const schwelleAnker = k.p("geld.ankerSchwelle");
  const c = k.w("ordnung.preiskontrollen") / 100;
  // Bei hoher Inflation brechen Kontrollen zusammen: die Unterdrückung lässt über derselben
  // Schwelle nach wie der Anker (Update 4c, Kalibrierfall Venezuela 2016–2019; Kornai 1992).
  const halt = 1 / (1 + Math.max(0, neu.inflation - schwelleAnker) / schwelleAnker);
  const unterdrueckt =
    c * k.p("ordnung.unterdrueckung") * Math.max(0, neu.inflation) * halt;
  const abbau = k.p("ordnung.stauAbbau") * (1 - c) * alt.preisstau;
  neu.preisstau = Math.max(0, alt.preisstau + unterdrueckt - abbau);
  if (unterdrueckt !== 0 || abbau !== 0)
    neu.inflation = Math.min(1e6, neu.inflation - unterdrueckt + abbau);
  neu.knappheit = c * neu.preisstau;

  const taylor = Math.max(
    k.p("geld.untergrenze"),
    k.welt("realzins") +
      neu.inflation +
      0.5 * (neu.inflation - ziel) +
      k.w("geld.gewichtAuslastung") * neu.luecke * 100,
  );
  if (regime === "euro") {
    const g = k.land.start.eurogewicht;
    neu.leitzins = (1 - g) * k.welt("euroLeitzins") + g * taylor;
  } else if (regime === "hart") {
    neu.leitzins = Math.max(0, k.welt("realzins") + neu.inflErw);
  } else if (regime === "gelenkt") {
    // Politischer Leitzins: folgt der Inflation nur schwach, der Realzins sinkt (Update 4a).
    // Ausgangspunkt ist der Realzins des Startjahres; der Abstand zum Weltrealzins baut sich
    // über die Jahre ab (Update 4b).
    neu.leitzins = Math.max(
      k.p("geld.untergrenze"),
      gelenktNeutral(k) +
        ziel +
        k.p("geld.gelenktInflation") * (neu.inflation - ziel) +
        k.w("geld.gewichtAuslastung") * neu.luecke * 100,
    );
  } else {
    neu.leitzins = taylor;
  }
  neu.qe = regime === "hart" ? 0 : Math.max(0, alt.qe + k.w("geld.qeTempo"));
  neu.preisniveau = alt.preisniveau * (1 + neu.inflation / 100);
};
