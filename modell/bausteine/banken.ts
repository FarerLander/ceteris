import { bankenAn, zoegernd } from "../banken-modus";
import { clamp } from "../mathe";
import type { Baustein, Kontext, Zustand } from "../typen";

// Wachstum des Potenzials: BIP-Wachstum ohne die Änderung der Produktionslücke. Der Einbruch eines
// Krisenjahres zählt so nicht als „Einkommen gefallen, Häuser relativ teurer“.
export const potenzialWachstum = (alt: Zustand, neu: Zustand): number =>
  ((1 + neu.wachstum) * (1 + alt.luecke)) / (1 + neu.luecke) - 1;

// M1 Hauspreis (real). Der Grundwert folgt Einkommen pro Kopf und Realzins (Nutzerkosten, Poterba 1984);
// der Preis hat Schwung (Case/Shiller 1989), kehrt langsam zum Grundwert zurück und steigt mit
// Kredit über der normalen Ausweitung (Jordà/Schularick/Taylor 2015). hp und Grundwert in 100·ln.
export function hauspreisSchritt(alt: Zustand, neu: Zustand, k: Kontext): void {
  // Wie beim Kredit zählt der Realzins nur begrenzt: In der Hyperinflation hinkt der Bestandszins
  // der Inflation um Tausende Pp. hinterher, Häuser werden davon real nicht tausendfach teurer.
  // Maß ist die lange Rendite (Hypothekenzinsen folgen ihr), nicht der träge Bestandszins der Kredite.
  neu.rReal = clamp(neu.rendite - neu.inflErw, -5, 15);
  // Einkommen pro Kopf: Wächst nur die Bevölkerung, braucht es mehr Häuser, nicht teurere.
  neu.hausGrund =
    alt.hausGrund + 100 * Math.log(1 + neu.wachstumProKopf) - k.p("banken.hausZins") * (neu.rReal - alt.rReal);
  // Leitplanke ±30 (log-Punkte im Jahr): mehr gab es real in keiner der großen Blasen; sie hält die
  // Rechnung endlich, wenn Wirkstärken am Rand ihrer Spanne die Schleife überdrehen.
  neu.hausWachstum = clamp(
    k.p("banken.hausMomentum") * alt.hausWachstum +
      k.p("banken.hausAnpassung") * (alt.hausGrund - alt.hp) +
      k.p("banken.hausKredit") * alt.kreditUeber,
    -30,
    30,
  );
  neu.hp = alt.hp + neu.hausWachstum;
  neu.hauspreis = 100 * Math.exp(neu.hp / 100);
  // Hauswert in % BIP: Preis über Einkommen.
  neu.hausWert = (alt.hausWert * Math.exp(neu.hausWachstum / 100)) / (1 + neu.wachstumProKopf);
  // Für die Sicherheiten (M2, im Folgejahr): nur der Anstieg über dem Einkommenstrend je Kopf zählt.
  const bevWachstum = (1 + neu.wachstum) / (1 + neu.wachstumProKopf) - 1;
  neu.hausUeber = neu.hausWachstum - 100 * (potenzialWachstum(alt, neu) - bevWachstum);
}

// M3, M4, M6, M7: faule Kredite, Eigenkapital, Kursverluste auf Staatsanleihen, Rettung.
// Beträge in % BIP. Bestände des Vorjahres werden auf das BIP des Jahres umgerechnet (÷ 1 + gNom).
export function bilanzSchritt(alt: Zustand, neu: Zustand, k: Kontext): void {
  const s = k.land.start;
  const langsam = zoegernd(k.grund);
  const wNormal = k.p("banken.abschreibung");
  const w = langsam ? k.p("banken.abschreibungZoegernd") : wNormal;
  // Zögernd heilt nicht mehr, es verschiebt nur: Abschreibung und Heilung laufen beide langsamer, im
  // selben Verhältnis. Von den faulen Krediten geht am Ende derselbe Anteil verloren, nur später, und
  // sie bleiben länger in den Büchern (Caballero/Hoshi/Kashyap 2008).
  const heilung = k.p("banken.heilung") * (w / wNormal);

  // M3: Zufluss aus Arbeitslosigkeit, fallenden Hauspreisen und hohem Schuldendienst (Nkusu 2011).
  // Der Grundzufluss hält die Quote im ruhigen Jahr auf dem Startwert.
  const zufluss =
    s.npl0! * (wNormal + k.p("banken.heilung")) +
    k.p("banken.nplAlq") * Math.max(0, neu.alq - neu.nairuEff) +
    k.p("banken.nplHaus") * Math.max(0, -neu.hausWachstum) +
    k.p("banken.nplDsr") * Math.max(0, neu.dsr - s.dsrSchwelle);
  neu.npl = clamp(alt.npl * (1 - w - heilung) + zufluss, 0, 60);
  // Nur der Anteil der Privatschuld bei Banken trifft die Bank (Bauplan, Entscheidung 1).
  const verlust = w * (alt.npl / 100) * k.p("banken.lgd") * alt.privatschuld * s.bankKreditAnteil!;

  // M7: Kursverlust = Bestand × Duration × Renditeanstieg, höchstens der Bestand; fallende Renditen
  // bringen Kursgewinne.
  // Nicht im ersten Modelljahr: Dort springt die Rendite vom gemessenen auf den gerechneten Wert; das ist
  // eine Nahtstelle des Modells, kein Kursverlust.
  const anleihenVerlust =
    (k.t <= 1 ? 0 : 1) *
    k.p("banken.staatBank") *
    s.bankStaatsAnteil! *
    Math.max(0, alt.schuldQuote) * // hat der Staat Vermögen statt Schuld, halten die Banken keine Anleihen

    clamp(((k.w("anleihen.laufzeit") / 2) * (neu.rendite - alt.rendite)) / 100, -1, 1);

  // M4: Eigenkapital = Vorjahr + Gewinn − Abschreibungen − Kursverluste; über dem Ziel wird ausgeschüttet.
  const gNom = neu.wachstum + neu.inflation / 100;
  const ziel = k.c.bankZiel0 + k.w("banken.eigenkapital");
  neu.bilanz = k.c.bilanzFaktor * neu.privatschuld;
  // Gewinn: Eigenkapitalrendite auf das Start-Eigenkapital je Bilanz, dazu die normale Abschreibung. Die
  // Rendite ist nominal und wächst mit der Inflation; in normalen Jahren hält die Bank mindestens mit dem
  // Wachstum der Wirtschaft Schritt (sonst zehrte jede höhere Inflation das Eigenkapital mechanisch auf).
  // Bezug ist das Inflationsziel des Landes, nicht die Inflation des Startjahres.
  const rendite = Math.max(k.p("banken.rendite") / 100 + (neu.inflErw - k.basis("geld.inflationsziel")) / 100, gNom);
  const gewinn = alt.bilanz * ((k.c.bankZiel0 / 100) * rendite + k.c.bankVerlust0);
  let betrag = (alt.bankKapitalBetrag + gewinn - verlust - anleihenVerlust) / (1 + gNom);
  betrag = Math.min(betrag, (ziel / 100) * neu.bilanz);
  // Ohne Kredit keine Bank: Die Quote bleibt dann auf dem Ziel stehen.
  const quote = (b: number) => (neu.bilanz > 1e-9 ? (b / neu.bilanz) * 100 : ziel);

  // M6: Rettung geht direkt in die Staatsschuld (wie die Übernahme verdeckter Schuld), nicht ins Defizit.
  // Aufgefüllt wird mindestens bis zur Schwelle (auch wenn die Vorgabe darunter liegt), und nur, wenn
  // wirklich etwas fehlt: keine Rettung aus Rundung.
  const bis = langsam ? k.c.bankMindest : Math.max(ziel, k.c.bankMindest);
  const noetig = langsam ? quote(betrag) <= 0 : quote(betrag) < k.c.bankMindest - 1e-9;
  const luecke = ((bis - quote(betrag)) / 100) * neu.bilanz;
  neu.rettung = noetig && luecke > 1e-6 ? luecke : 0;
  if (neu.rettung > 0) {
    betrag += neu.rettung;
    const yNom = neu.Y * neu.preisniveau;
    neu.schuldNom += (neu.rettung / 100) * yNom;
    neu.schuldQuote = (neu.schuldNom / yNom) * 100;
  }
  neu.bankKapitalBetrag = betrag;
  neu.bankKapital = quote(betrag);
}

// Vermögenspreise und Banken (Spec 13.6). Rechnet am Ende des Jahres mit den fertigen Werten;
// die Rückwirkung auf den Kredit läuft über das Vorjahr in privatschuld.ts.
export const banken: Baustein = (alt, neu, k) => {
  if (!bankenAn(k.land, k.grund)) return;
  hauspreisSchritt(alt, neu, k);
  // Kredit über der normalen Ausweitung: treibt im Folgejahr die Hauspreise (M1). Normal ist, was
  // die Schuldenquote bei Potenzialwachstum hält.
  neu.kreditUeber = neu.kredit - alt.privatschuld * (potenzialWachstum(alt, neu) + alt.inflErw / 100);
  bilanzSchritt(alt, neu, k);
};
