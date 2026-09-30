import { bankenAn } from "../banken-modus";
import { clamp } from "../mathe";
import type { Baustein } from "../typen";
import { potenzialWachstum } from "./banken";
import { realzinsBezug } from "./geld";

// Dalio-Zyklen: Kredit steigt bei niedrigem Schuldendienst und Realzins, über der Schwelle wird entschuldet.
export const privatschuld: Baustein = (alt, neu, k) => {
  const banken = bankenAn(k.land, k.grund);
  // Kapitalkosten (Spec 13.6): mehr vorgeschriebenes Eigenkapital verteuert neuen Kredit.
  const aufschlag =
    k.p("privat.zinsaufschlag") + (banken ? k.p("banken.kapitalkosten") * k.w("banken.eigenkapital") : 0);
  // Der Bestandszins folgt dem Neugeschäft nur nach und nach (Zinsbindung).
  neu.privatZins = alt.privatZins + (alt.leitzins + aufschlag - alt.privatZins) / k.p("privat.zinsbindung");
  neu.dsr = alt.privatschuld * (neu.privatZins / 100 + k.p("privat.tilgung"));
  const gNom = alt.wachstum + alt.inflation / 100;
  // Normale Kreditausweitung folgt dem nominalen Trend, nicht dem schwankenden Vorjahreswachstum.
  const gTrend = k.land.start.tfpTrend / 100 + alt.inflErw / 100;
  // Wie in wachstum.ts: nur über der Anker-Schwelle zählt der Realzins höchstens bis −5 % (Update 4c).
  const realzinsRoh = alt.leitzins - alt.inflation;
  const realzins = alt.inflation > k.p("geld.ankerSchwelle") ? Math.max(-5, realzinsRoh) : realzinsRoh;
  let kredit =
    alt.privatschuld * gTrend +
    k.p("privat.dsrReaktion") * (k.c.dsr0 - neu.dsr) -
    k.p("privat.zinsReaktion") * (realzins - realzinsBezug(k));
  const ueber = neu.dsr - k.land.start.dsrSchwelle;
  if (ueber > 0) kredit -= k.p("privat.entschuldung") * ueber;
  if (banken) {
    // Normale Ausweitung mit dem Potenzial statt nur mit dem Produktivitätstrend: Wächst die Wirtschaft
    // auch über mehr Erwerbstätige, bliebe die Schuldenquote sonst nicht stehen, sie schrumpfte.
    kredit += alt.privatschuld * clamp(potenzialWachstum(alt, neu) - k.land.start.tfpTrend / 100, -0.03, 0.03);
    // M2 Sicherheiten (Goodhart/Hofmann 2008; Mian/Sufi 2011): Steigt der Hauspreis schneller als das
    // Einkommen (Potenzial), wächst der Kredit mit; fällt er, schrumpft der Spielraum. Die Schleife zum
    // Boom. Maß ist der Kreditbestand, nicht das Hausvermögen: Wo viel Eigentum wenig beliehen ist
    // (Italien, Deutschland), trägt ein Preisanstieg wenig neuen Kredit.
    // Leitplanke wie bei der Klemme: höchstens 10 % des Bestands im Jahr, in beide Richtungen.
    const grenze = 0.1 * alt.privatschuld;
    const sicherheiten = clamp(k.p("banken.sicherheiten") * (alt.hausUeber / 100) * alt.privatschuld, -grenze, grenze);
    // Der Boom endet am Schuldendienst: Über der Schwelle des Landes wird entschuldet (oben), die
    // faulen Kredite steigen, der Preis fällt, und derselbe Term zieht den Kredit dann nach unten.
    kredit += sicherheiten;
    // M5 Kreditklemme (Bernanke/Lown 1991): Unter der Messlatte kürzen Banken den Kredit. Messlatte
    // ist das heutige Eigenkapital, bei gesenkter Vorgabe die Vorgabe. Eigenkapital über dem heutigen
    // ist Puffer: Wer hineinfällt, schüttet nicht aus, kürzt aber keinen Kredit (wie in Basel III).
    // Ein Zehntel unter der Messlatte wird geduldet: Wächst die Bilanz im Aufschwung schneller als das
    // Eigenkapital, sinkt die Quote etwas, ohne dass eine Bank deshalb Kredit kürzt.
    const messlatte = 0.9 * Math.min(k.c.bankZiel0, k.c.bankZiel0 + k.w("banken.eigenkapital"));
    const ziel = (k.p("banken.klemme") * Math.max(0, messlatte - alt.bankKapital) * alt.privatschuld) / 100;
    // Banken bauen Kredit über Jahre ab und wieder auf, nicht von einem Jahr aufs andere: jedes Jahr
    // der halbe Weg. Sonst springt der Kreditimpuls im Sägezahn.
    // Nie mehr als 10 % des Bestands in einem Jahr (auch wenn der Bestand seit dem Vorjahr geschrumpft ist).
    const klemme = Math.min(0.1 * alt.privatschuld, 0.5 * alt.klemme + 0.5 * ziel);
    neu.klemme = klemme < 0.05 ? 0 : klemme;
    kredit -= neu.klemme;
  }
  neu.kredit = kredit;
  neu.kreditimpuls = kredit - alt.kredit;
  neu.privatschuld = Math.max(0, (alt.privatschuld + kredit) / (1 + gNom));
};
