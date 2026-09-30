import { planImpuls } from "../haushaltsplan";
import { clamp } from "../mathe";
import { STEUERN, type Baustein } from "../typen";
import { realzinsBezug } from "./geld";
import { aufkommen } from "./staat";

export const wachstum: Baustein = (alt, neu, k) => {
  const alpha = k.p("wachstum.alpha");
  const delta = k.p("wachstum.abschreibung");

  // Humankapital: Bildung wirkt mit Verzug
  neu.bildWirk =
    alt.bildWirk +
    (k.w("innov.bildung") - k.basis("innov.bildung") - alt.bildWirk) /
      k.p("wachstum.bildungsVerzug");
  neu.h = alt.h * (1 + (k.p("wachstum.bildungsRendite") * neu.bildWirk) / 100);

  // Produktivität: Trend + Innovation − Energiebremse + Aufholen + Schock
  neu.grenze = alt.grenze * (1 + k.welt("grenzeWachstum") / 100);
  // Schwacher Rechtsstaat bremst das Aufholen (Update 4a).
  const dR = k.w("ordnung.rechtsstaat") - k.basis("ordnung.rechtsstaat");
  const aufholen =
    k.p("wachstum.konvergenz") *
    (Math.log(alt.grenze / alt.A) - k.c.lnLuecke0) *
    Math.max(0, 1 + (k.p("ordnung.konvergenzRechtsstaat") * dR) / 100);
  // Öffentlicher Kapitalstock (Spec 13.5 Teil B): nur die Abweichung vom Pfad mit heutiger Investition.
  // Mehr Investition baut Bestand auf, Kürzen lässt ihn verfallen (höchstens bis auf ein Zehntel). Was
  // gebaut ist, wirkt im Jahr darauf auf die Produktivität (Bom/Ligthart 2014).
  neu.oeffKapital = Math.max(
    -0.9 * k.c.oeffKapital0,
    (alt.oeffKapital * (1 - k.p("staat.oeffAbschreibung"))) / (1 + alt.wachstum) +
      (k.w("staat.investitionen") - k.basis("staat.investitionen")),
  );
  neu.oeffWirk = k.p("staat.oeffKapital") * Math.log(1 + alt.oeffKapital / k.c.oeffKapital0);
  const gA =
    k.land.start.tfpTrend / 100 +
    (neu.oeffWirk - alt.oeffWirk) +
    neu.innovBeitrag -
    k.p("wachstum.energieBremse") * Math.max(0, neu.energiepreis - 100) +
    aufholen +
    k.schock.gA +
    (neu.ordnungNiveau - alt.ordnungNiveau);
  neu.A = alt.A * (1 + gA);

  // Arbeit
  // Arbeitsmarkt-Trend: Reformen und Beteiligung wirken schrittweise.
  const anpassung = k.p("arbeit.anpassung");
  neu.nairuEff = alt.nairuEff + (k.w("arbeit.nairu") - alt.nairuEff) * anpassung;
  // Steigende Beteiligung von Älteren und Frauen: Landestrend auf die eingestellte Erwerbsquote.
  const eqTrend =
    (k.land.start.erwerbsquoteTrend ?? 0) *
    Math.min(k.t, k.land.start.erwerbsquoteTrendJahre ?? 0);
  neu.eqEff =
    alt.eqEff + (k.w("arbeit.erwerbsquote") + eqTrend - alt.eqEff) * anpassung;
  const eq =
    neu.eqEff -
    k.p("wachstum.lohnersatzElastizitaet") *
      (k.w("sozial.lohnersatz") - k.basis("sozial.lohnersatz")) - k.p("wachstum.abgabenElastizitaet") * alt.beitragsAufschlag;
  neu.erwerbspersonen = Math.max(
    0.01,
    (neu.erwerbsfaehige - neu.migErwerbsalter + neu.abwErwerbsalter) * eq +
      neu.migBeschaeftigte -
      neu.abwBeschaeftigte +
      k.schock.beschaeftigte,
  );
  const lPot = neu.erwerbspersonen * (1 - neu.nairuEff / 100);

  // Kapital: Investitionen folgen der Auslastung des Vorjahres (Akzelerator, Spec 13.5 Teil B) und,
  // schwächer, den Kapitalkosten
  const keil =
    k.p("wachstum.steuerkeilU") *
      (k.w("steuer.unternehmen") - k.basis("steuer.unternehmen")) +
    k.p("wachstum.steuerkeilK") *
      (k.w("steuer.kapitalertrag") - k.basis("steuer.kapitalertrag"));
  // Kreditlenkung durch Staatsbanken (Update 4a).
  const dL = k.w("ordnung.kreditlenkung") - k.basis("ordnung.kreditlenkung");
  // Realzins nach unten begrenzt: bei Hyperinflation hinkt die Rendite den Erwartungen weit hinterher.
  const kapitalkosten =
    Math.max(-10, alt.rendite - alt.inflErw) + delta * 100 + keil + neu.investAufschlag;
  neu.investQuote = clamp(
    k.land.start.investQuote -
      k.p("wachstum.investElastizitaet") * (kapitalkosten - k.c.userCost0) +
      k.p("wachstum.akzelerator") * alt.luecke * 100 +
      0.5 * (neu.umbauInvest - k.c.umbau0) -
      k.p("ordnung.fluchtInvest") * neu.kapitalflucht +
      k.p("ordnung.lenkInvest") * dL,
    5,
    60,
  );
  // Gelenkte Kredite landen oft in schlechten Projekten: weniger Kapital je investiertem Euro.
  neu.kapitalEffizienz =
    alt.kapitalEffizienz +
    (1 - (k.p("ordnung.lenkVerlust") * Math.max(0, dL)) / 100 - alt.kapitalEffizienz) /
      k.p("ordnung.lenkJahre");
  neu.K =
    (1 - delta) * alt.K + neu.kapitalEffizienz * (neu.investQuote / 100) * alt.Y;

  // Potenzial und Nachfrage
  let yPot = neu.A * neu.K ** alpha * (lPot * neu.h) ** (1 - alpha);
  // Knappheit durch Preiskontrollen senkt das Angebot (Update 4a, höchstens 50 %).
  if (alt.knappheit > 0)
    yPot *= 1 - Math.min(0.5, (k.p("ordnung.knappheitAngebot") * alt.knappheit) / 100);
  // Rohstoffsektor: sinkt die Fördermenge, fehlt sein Anteil an der Wirtschaftsleistung (Update 4c).
  const x0 = k.land.start.rohstoffExporte ?? 0;
  if (x0 > 0 && neu.rohstoffMenge !== 1) yPot *= 1 + (x0 / 100) * (neu.rohstoffMenge - 1);
  // Fiskalimpuls nur aus bewusster Politik (Hebel, Schock-Ausgaben, Gegensteuern), im selben Jahr.
  // Automatische Stabilisatoren und Rentendrift zählen nicht, sonst schaukelt sich die Nachfrage auf.
  const ausgaben = ["staat.gesundheit", "staat.familie", "staat.verteidigung", "staat.uebrige", "staat.investitionen", "innov.bildung"]
    .reduce((summe, id) => summe + k.w(id) - k.basis(id), 0) + (k.w("innov.fue") - k.basis("innov.fue")) / 3;
  const offenheit = k.w("handel.kapitalOffenheit");
  const steuern = STEUERN.reduce(
    (summe, x) => summe + aufkommen(k, x, offenheit) - k.basis(`steuer.${x}`) * k.land.start.steuerBasen[x], 0);
  // Haushaltsplan (M29): nur der Teil, der bewusste Politik ist, nicht der Ausgleich der Renten- und Zinsdrift.
  neu.diskret = ausgaben - steuern + k.schock.ausgaben - alt.konsolidierung - planImpuls(k.land, k.grund, k.jahr);
  const fiskalImpuls = (neu.diskret - alt.diskret) / 100;
  // Über der Anker-Schwelle (Hyperinflation) regt ein Realzins unter −5 % nichts mehr an; das Geld
  // flieht (Update 4c, Kalibrierfall Venezuela). Darunter unverändert.
  // Kreditrückgang wirkt stärker als Kreditzuwachs, der Mittelwert bleibt (Spec 13.5 Teil A).
  const asym = k.p("wachstum.kreditAsymmetrie");
  const kreditGewicht = alt.kreditimpuls < 0 ? asym : 2 - asym;
  const realzinsN = alt.leitzins - alt.inflErw;
  const zinsLuecke =
    ((alt.inflErw > k.p("geld.ankerSchwelle") ? Math.max(-5, realzinsN) : realzinsN) - realzinsBezug(k)) / 100;
  neu.luecke = clamp(
    k.p("wachstum.lueckePersistenz") * alt.luecke +
      k.p("wachstum.multiplikator") * fiskalImpuls +
      (k.p("wachstum.kreditImpuls") * kreditGewicht * alt.kreditimpuls) / 100 -
      k.p("wachstum.zinsWirkung") * zinsLuecke +
      k.schock.luecke / 100,
    -0.2,
    0.1,
  );
  // Im Jahr nach einem Schuldenschnitt bricht die Nachfrage ein.
  if (alt.ventilArt === 1 && alt.ventilSeit === 0) neu.luecke = Math.max(-0.2, neu.luecke - k.p("anleihen.ausfallKosten") / 100);
  neu.Y = yPot * (1 + neu.luecke);
  neu.alq = clamp(
    neu.nairuEff - k.p("wachstum.okun") * neu.luecke * 100 + k.schock.alq,
    0.5,
    50,
  );
  neu.beschaeftigte = neu.erwerbspersonen * (1 - neu.alq / 100);
  neu.wachstum = neu.Y / alt.Y - 1;
  neu.bipProKopf = neu.Y / neu.bev;
  neu.wachstumProKopf = neu.bipProKopf / alt.bipProKopf - 1;
  neu.hoechstProKopf = Math.max(alt.hoechstProKopf, neu.bipProKopf);
  neu.minusJahre = neu.wachstumProKopf < 0 ? alt.minusJahre + 1 : 0;
};
