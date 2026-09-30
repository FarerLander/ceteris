import { aufschlagFormel } from "../anleihenformel";
import { clamp } from "../mathe";
import type { Baustein } from "../typen";

export const anleihen: Baustein = (alt, neu, k) => {
  const r = k.grund.regime;
  const ziel = k.w("geld.inflationsziel");
  const formel = () =>
    aufschlagFormel(r, k.grund.tpi, neu.schuldQuote, k.w("anleihen.auslandsanteil"), neu.inflation, ziel, k.p, {
      nfa: alt.nfa,
      primaer: neu.primaer,
      reserve: alt.reserve,
    });

  // Ventile bei Überschuldung (Spec 7): Schuldenschnitt ohne eigene Notenbank, sonst Monetarisierung.
  const sperre = k.p("anleihen.sperrJahre");
  neu.schnittNom = 0;
  neu.ventilSeit = alt.ventilSeit + 1;
  neu.ventilArt = alt.ventilArt;
  // Abwertungsrisiko: überbewertete feste oder gelenkte Kurse kosten Zins, soweit Kapital frei fließt.
  const risiko =
    r === "hart" || r === "gelenkt"
      ? k.p("anleihen.abwertungsRisiko") * alt.ueberbewertung * k.w("handel.kapitalOffenheit")
      : 0;
  const zusatz = risiko > 0 ? k.schock.aufschlag + risiko : k.schock.aufschlag;
  // Gelenkt: bei geringem Auslandsanteil druckt die Notenbank, sonst Schuldenschnitt.
  const monetarisiert =
    r === "welt" || r === "eigen" || (r === "gelenkt" && k.w("anleihen.auslandsanteil") < 0.3);
  if (formel() + zusatz > k.p("anleihen.ausfallSchwelle") && alt.ventilSeit >= sperre) {
    neu.ventilSeit = 0;
    if (monetarisiert) {
      neu.ventilArt = 2;
      neu.qe += k.p("geld.monetarisierungQe");
    } else {
      neu.ventilArt = 1;
      neu.schnittNom = neu.schuldNom * k.p("anleihen.schnitt");
      neu.schuldNom -= neu.schnittNom;
      neu.schuldQuote = (neu.schuldNom / (neu.Y * neu.preisniveau)) * 100;
    }
  }
  const reputation =
    neu.ventilArt === 1 ? k.p("anleihen.reputation") * Math.max(0, 1 - neu.ventilSeit / sperre) : 0;
  // Politisches Risiko (13.10), sonst 0.
  neu.aufschlag = clamp(formel() + zusatz + reputation + neu.politikAufschlag, 0, 25);
  const neutral =
    k.welt("realzins") +
    (r === "euro" ? k.welt("euroInflation") : r === "hart" ? 0 : ziel);
  const erwartet = 0.5 * neu.leitzins + 0.5 * neutral;
  const rabatt = k.p("anleihen.reserveRabatt") * alt.reserve;
  const qe = k.p("anleihen.qeWirkung") * (neu.qe - k.land.start.qe);
  const flucht = k.schock.flucht * k.land.start.fluchtReaktion;
  neu.rendite =
    erwartet +
    k.w("anleihen.laufzeitpraemie") +
    k.welt("praemieWelt") +
    neu.aufschlag -
    rabatt -
    qe +
    flucht;
  if (k.c.praemieKorrektur !== 0) neu.rendite += k.c.praemieKorrektur;
  neu.effZins =
    alt.effZins +
    (neu.rendite - alt.effZins) / Math.max(1, k.w("anleihen.laufzeit"));
  neu.rMinusG = neu.effZins - (neu.wachstum * 100 + neu.inflation);
};
