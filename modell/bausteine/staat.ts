import { clamp } from "../mathe";
import { planWert } from "../haushaltsplan";
import { politikAn } from "../politik-modus";
import { topf } from "../topf";
import { STEUERN, type Baustein, type Kontext, type SteuerId } from "../typen";

const KAPITAL = { umlage: 0, mischung: 0.5, kapital: 1 } as const;
const MOBIL: SteuerId[] = ["unternehmen", "kapitalertrag", "vermoegen"];

// Aufkommen in % BIP. Die Bemessungsgrundlage weicht dem Satz aus (Laffer-Effekt);
// mobile Grundlagen weichen stärker aus, je offener der Kapitalverkehr.
export function aufkommen(k: Kontext, x: SteuerId, offenheit: number): number {
  const satz = k.w(`steuer.${x}`);
  const satz0 = k.basis(`steuer.${x}`);
  const eps =
    k.p(`steuer.eps.${x}`) * (MOBIL.includes(x) ? 0.5 + offenheit : 1);
  const faktor = Math.pow(
    Math.max(1e-6, 1 - satz) / Math.max(1e-6, 1 - satz0),
    eps,
  );
  return satz * k.land.start.steuerBasen[x] * faktor;
}

export const staat: Baustein = (alt, neu, k) => {
  const s = k.land.start;
  const offenheit = k.w("handel.kapitalOffenheit");
  const steuern = STEUERN.reduce(
    (summe, x) => summe + aufkommen(k, x, offenheit),
    0,
  );
  const yNom = neu.Y * neu.preisniveau;
  const co2Haushalt =
    Math.round(k.w("energie.co2Verwendung")) === 0
      ? ((neu.co2Einnahmen * k.land.waehrung.kurs) / neu.Y) * 100
      : 0;

  // Rente: Umlage oder Kapitaldeckung (Umstieg über Jahre, anfangs Doppelbelastung)
  const kap = KAPITAL[k.grund.rentensystem];
  // Ein vorhandener Reservefonds zählt als bereits geschaffter Teil des Umstiegs.
  const vorlauf = (s.fondsQuote0 ?? 0) / (k.p("rente.deckungJahre") * s.rentenausgaben);
  const kapWirksam = kap * Math.min(1, k.t / k.p("rente.umstiegJahre") + vorlauf);
  const renteGesamt =
    ((neu.rentner * (k.w("rente.niveau") / 100) * s.lohnquote) /
      Math.max(0.1, neu.beschaeftigte)) *
    100 *
    k.c.rentenFaktor;
  const einzahlung =
    kap *
    k.p("rente.beitragsanteil") *
    aufkommen(k, "sozialabgaben", offenheit);
  // Der Fonds zahlt höchstens, was er hat; den Rest trägt der Staat.
  // Der Ertrag auf den Startfonds steckt schon in den Einnahmen (sonstige Einnahmen) und wird nicht doppelt gezählt.
  const fonds0 = s.fondsQuote0 ?? 0;
  const verfuegbar = Math.max(
    0,
    alt.fondsQuote * (1 + k.p("rente.fondsRendite") / 100) - fonds0 * (k.p("rente.fondsRendite") / 100) + einzahlung,
  );
  const auszahlung = Math.min(renteGesamt * kapWirksam, verfuegbar);
  neu.rentenausgaben = renteGesamt - auszahlung;
  // Bei Umlage bleibt ein vorhandener Reservefonds als Anteil am BIP stehen.
  neu.fondsQuote = kap === 0 ? alt.fondsQuote : (verfuegbar - auszahlung) / (1 + neu.wachstum);

  // Automatische Beitragsanpassung: Beiträge decken einen Teil des Rentenanstiegs über den Startwert.
  const zusatz = k.w("rente.beitragsAutomatik") >= 0.5
    ? k.p("rente.beitragsDeckung") * Math.max(0, neu.rentenausgaben - s.rentenausgaben)
    : 0;
  neu.beitragsAufschlag = zusatz / s.steuerBasen.sozialabgaben;
  // Rohstoffeinnahmen: Abweichung vom Start (0 für Länder ohne Rohstoffe).
  neu.einnahmen =
    steuern + k.c.sonstigeEinnahmen + co2Haushalt - einzahlung + zusatz + neu.rohstoffHaushalt;

  const arbeitslose = neu.erwerbspersonen * (neu.alq / 100);
  neu.algAusgaben =
    ((arbeitslose * k.w("sozial.lohnersatz") * s.lohnquote) /
      Math.max(0.1, neu.beschaeftigte)) *
    100 *
    k.c.algFaktor;
  const integration = ((neu.integrationskosten * k.land.waehrung.kurs) / neu.Y) * 100;
  const subvention =
    ((k.w("energie.industrieSubvention") * s.industrieTWh * k.land.waehrung.kurs) / 1000 / neu.Y) *
    100;
  // Gegensteuern: Schuldenregel plus Marktdisziplin (steigende Aufschläge erzwingen Sparen).
  // Gegensteuern auf Veränderungen gegenüber dem Startjahr: Der Ausgangsstand steckt schon in den Daten.
  neu.schuldenregel = k.w("staat.schuldenreaktion") * (Math.max(0, alt.schuldQuote - 60) - Math.max(0, k.c.sq0 - 60));
  // Politik reagiert (13.10): Die Konsolidierung der Regierung ersetzt die pauschale Schuldenregel, nicht zusätzlich.
  neu.pauschal =
    politikAn(k.grund) && neu.schuldenregel > 0
      ? Math.max(0, neu.schuldenregel - neu.politikKonsol)
      : neu.schuldenregel;
  const konsolidierung = clamp(
    neu.pauschal
      + k.p("staat.marktdisziplin") * (alt.aufschlag - k.c.auf0),
    -10,
    10,
  );
  neu.konsolidierung = konsolidierung;
  // Haushaltsplan bis 2031 (M29): geplante Konsolidierung, 0 ohne Plan oder wenn abgeschaltet.
  neu.plan = planWert(k.land, k.grund, k.jahr);
  neu.primaerausgaben =
    neu.rentenausgaben +
    neu.algAusgaben +
    k.w("staat.gesundheit") +
    k.w("staat.familie") +
    k.w("staat.verteidigung") +
    k.w("innov.bildung") +
    k.w("innov.fue") / 3 +
    k.w("staat.uebrige") +
    // Öffentliche Investitionen: Der heutige Wert steckt in den übrigen Ausgaben, hier zählt die Änderung.
    (k.w("staat.investitionen") - k.basis("staat.investitionen")) +
    integration +
    subvention +
    k.schock.ausgaben - konsolidierung - neu.plan +
    neu.staatsbetriebVerlust;

  neu.primaerVorjahr = alt.primaer;
  neu.primaer = neu.einnahmen - neu.primaerausgaben;
  const zinsenNom = (alt.effZins / 100) * alt.schuldNom;
  neu.zinsausgaben = (zinsenNom / yNom) * 100;
  const t = topf(neu.einnahmen, neu.zinsausgaben, neu.rentenausgaben, k.w("staat.gesundheit") + k.w("staat.familie") + neu.algAusgaben);
  neu.topfZins = t.zins;
  neu.topfRente = t.rente;
  neu.topfSozial = t.sozial;
  neu.spielraum = t.rest;
  neu.defizitNom = ((neu.primaerausgaben - neu.einnahmen) / 100) * yNom + zinsenNom + (k.w("staat.finanztransaktionen") / 100) * yNom;
  // Faule Kredite der Staatsbanken: verdeckte Schuld, ab der Schwelle übernimmt der Staat (Update 4a).
  const dL = k.w("ordnung.kreditlenkung") - k.basis("ordnung.kreditlenkung");
  let verdeckt =
    (alt.verdeckteSchuld +
      ((k.p("ordnung.faulQuote") * Math.max(0, dL)) / 100) * neu.investQuote) /
    (1 + neu.wachstum + neu.inflation / 100);
  neu.uebernahme = 0;
  if (verdeckt > k.p("schwelle.verdeckteUebernahme")) {
    neu.uebernahme = verdeckt;
    verdeckt = 0;
  }
  neu.verdeckteSchuld = verdeckt;
  neu.schuldNom = alt.schuldNom + neu.defizitNom;
  if (neu.uebernahme > 0) neu.schuldNom += (neu.uebernahme / 100) * yNom;
  // Negativ heißt: Der Staat hat mehr Vermögen als Schulden.
  neu.schuldQuote = (neu.schuldNom / yNom) * 100;

  // Grob, im UI so gekennzeichnet
  const lohnersatzAbw = k.w("sozial.lohnersatz") - k.basis("sozial.lohnersatz");
  // Spec 13.13: Steuern, Transfers und Rentenniveau verteilen um. k.w enthält die Eingriffe der Regierung.
  // Aufkommen einer Steuer gegenüber heute, in % BIP. Gezählt wird, was das Modell einnimmt: Weicht die
  // Bemessungsgrundlage dem Satz aus, gleicht die Steuer auch weniger aus.
  const mehr = (x: SteuerId) => aufkommen(k, x, offenheit) - k.basis(`steuer.${x}`) * s.steuerBasen[x];
  const d = (id: string) => k.w(id) - k.basis(id);
  const umverteilung =
    k.p("staat.giniEinkommensteuer") * mehr("einkommen") +
    k.p("staat.giniKapital") * (mehr("kapitalertrag") + mehr("vermoegen") + mehr("erbschaft")) -
    k.p("staat.giniMwst") * mehr("mwst") +
    k.p("staat.giniTransfers") * d("staat.familie") +
    k.p("staat.giniRente") * d("rente.niveau");
  neu.armut = clamp(
    s.armut +
      k.p("staat.armutAlq") * (neu.alq - s.alq) -
      k.p("staat.armutLohnersatz") * lohnersatzAbw -
      k.p("staat.armutTransfers") * d("staat.familie") -
      k.p("staat.armutRente") * d("rente.niveau"),
    0,
    100,
  );
  neu.gini = clamp(
    s.gini +
      k.p("staat.giniAlq") * (neu.alq - s.alq) -
      k.p("staat.giniLohnersatz") * lohnersatzAbw -
      umverteilung,
    15,
    70,
  );
};
