import { clamp } from "../mathe";
import type { Baustein, Kontext, Zustand } from "../typen";
import { realzinsBezug } from "./geld";

// Schattenkurs: so würde ein freier Kurs laufen (Zins, Leistungsbilanz, Rückkehr zum
// Gleichgewicht), gedrückt von Kapitalflucht. Für gelenkte und harte Währungen (Update 4a).
function schatten(alt: Zustand, neu: Zustand, k: Kontext, anker: number): number {
  const zinsAbw = neu.leitzins - neu.inflation - realzinsBezug(k);
  const lbAbw = alt.leistungsbilanz - k.c.lb0;
  let sch = alt.schattenkurs;
  sch *=
    1 +
    (k.p("handel.zinsWechselkurs") * zinsAbw + k.p("handel.lbWechselkurs") * lbAbw) / 100 -
    (k.p("ordnung.fluchtKurs") * neu.kapitalflucht) / 100;
  sch += (anker - sch) * k.p("handel.kkpRueckkehr");
  return clamp(sch, 0.05, 20);
}

export const handel: Baustein = (alt, neu, k) => {
  const r = k.grund.regime;
  const s = k.land.start;

  // Realer Wechselkurs (höher = teurer). Freie Währungen reagieren auf Zins und Leistungsbilanz
  // und kehren langsam zur Kaufkraftparität zurück; feste Kurse bewegen sich real über die Inflation.
  let q = alt.wechselkurs;
  // Gleichgewichtskurs steigt mit dem Auslandsvermögen (Transferproblem): wer dauerhaft
  // Vermögen aufbaut, wird real teurer. Gemessen ab dem Startbestand, damit das Startjahr stimmt.
  let anker = 1 + (k.p("handel.nfaWechselkurs") * (alt.nfa - s.nfa)) / 100;
  // Holländische Krankheit: mehr Rohstoffexporte als am Start werten auf (Update 4a).
  const x0 = s.rohstoffExporte ?? 0;
  if (x0 > 0)
    anker += (k.p("rohstoff.hollaendisch") * (neu.rohstoffExporte - x0)) / 100;
  if (r === "welt" || r === "eigen") {
    const zinsAbw = neu.leitzins - neu.inflation - k.c.realzins0;
    const lbAbw = alt.leistungsbilanz - k.c.lb0;
    const hafen =
      r === "welt"
        ? (k.p("handel.fluchtAufwertung") / 100) * k.schock.flucht
        : 0;
    q *=
      1 +
      (k.p("handel.zinsWechselkurs") * zinsAbw +
        k.p("handel.lbWechselkurs") * lbAbw) /
        100 +
      hafen;
    q += (anker - q) * k.p("handel.kkpRueckkehr");
    if (neu.kapitalflucht > 0) q *= 1 - (k.p("ordnung.fluchtKurs") * neu.kapitalflucht) / 100;
  } else {
    // Feste Kurse: real über die Inflation, dazu das Gegengewicht über Löhne und Preise.
    // Gemessen an der Leistungsbilanz des Startjahres: mehr Überschuss als am Start verteuert,
    // weniger verbilligt. Liegt der reale Kurs unter dem Gleichgewicht, holen die Preise auf.
    const partner =
      r === "euro" ? k.welt("euroInflation") : k.welt("weltInflation");
    const lbAbw = alt.leistungsbilanz - k.c.lb0;
    // Gelenkt: der offizielle Kurs folgt der Inflation nur so weit, wie er nachgeführt wird.
    const inflAbw =
      r === "gelenkt"
        ? (neu.inflation - partner) * (1 - k.w("handel.kursNachfuehrung"))
        : neu.inflation - partner;
    q *= 1 + (inflAbw + k.p("handel.lbPreisanpassung") * lbAbw) / 100;
    // Feste Kurse holen nur nach oben auf. Ein nachgeführter gelenkter Kurs folgt dem
    // Gleichgewicht auch nach unten, soweit er nachgeführt wird.
    const rueck = anker - q;
    q +=
      (rueck > 0 || r !== "gelenkt" ? Math.max(0, rueck) : rueck * k.w("handel.kursNachfuehrung")) *
      k.p("handel.kkpRueckkehr");
  }
  const sch = r === "gelenkt" || r === "hart" ? schatten(alt, neu, k, anker) : 0;
  // Nach einem Ventil springt der offizielle gelenkte Kurs auf den Schattenkurs.
  if (r === "gelenkt" && neu.ventilSeit === 0) q = sch;
  neu.wechselkurs = clamp(q, 0.05, 20);
  neu.schattenkurs = r === "gelenkt" || r === "hart" ? sch : neu.wechselkurs;
  neu.ueberbewertung =
    r === "gelenkt" || r === "hart"
      ? Math.max(0, neu.wechselkurs / neu.schattenkurs - 1) * 100
      : 0;
  neu.schwarzmarkt =
    r === "gelenkt" ? neu.ueberbewertung * (1 - k.w("handel.kapitalOffenheit")) : 0;
  neu.abwertung = (alt.wechselkurs / neu.wechselkurs - 1) * 100;

  const ueberWelt = neu.energiepreis / k.welt("weltEnergiepreis") - 1.3;
  neu.energieExportAnteil =
    alt.energieExportAnteil *
    (1 - k.p("handel.energieAbwanderung") * Math.max(0, ueberWelt));

  neu.weltnachfrage = alt.weltnachfrage * (1 + k.welt("nachfrage") / 100);
  const relativ = neu.weltnachfrage / (neu.Y / k.c.y0);
  const energieFaktor = 1 - s.energieExportAnteil + neu.energieExportAnteil;
  const zollAbw = k.w("handel.zoelle") - k.basis("handel.zoelle");
  const vergeltung = Math.max(0, 1 - k.p("handel.vergeltung") * zollAbw);
  const schock = Math.max(
    0,
    1 + k.schock.export * (0.5 + k.w("handel.abhaengigkeit")),
  );
  // Übrige Exporte wie bisher, bezogen auf den Start ohne Rohstoffe; Rohstoffe kommen dazu.
  const uebrigeStart = s.exporte - x0;
  const uebrige =
    uebrigeStart *
    Math.pow(relativ, k.p("handel.nachfrageElastizitaet")) *
    Math.pow(neu.wechselkurs, -k.p("handel.exportElastizitaet")) *
    energieFaktor *
    vergeltung *
    schock;
  neu.exporteOhneRohstoffe = uebrigeStart > 0 ? (100 * uebrige) / uebrigeStart : 100;
  neu.exporte = uebrige + neu.rohstoffExporte;

  const energieImporte =
    k.p("handel.energieImportAnteil") *
    (neu.energiepreis / 100 - 1) *
    (s.importquote > 0 ? neu.importquote / s.importquote : 0);
  // Importe: ein Teil sind Vorleistungen für Exporte, der Rest folgt dem eigenen Einkommen.
  const gehalt = k.p("handel.exportImportGehalt");
  const inland = Math.max(0, s.importe - gehalt * s.exporte);
  neu.importe = Math.max(
    0,
    inland *
      Math.pow(neu.Y / k.c.y0, k.p("handel.importEinkommen") - 1) *
      (1 + k.p("handel.importNachfrage") * neu.luecke) *
      Math.pow(neu.wechselkurs, k.p("handel.importElastizitaet")) *
      Math.max(0, 1 - k.p("handel.zollImport") * zollAbw) +
      gehalt * neu.exporte +
      energieImporte +
      // Vermögenseffekt: wer Auslandsvermögen aufbaut, gibt mehr aus. Das Angebot liegt fest,
      // also zeigt sich die Mehrausgabe in der Handelsbilanz. Hält die Bilanz langfristig begrenzt.
      (k.p("handel.vermoegensKonsum") / 100) * (alt.nfa - s.nfa),
  );

  neu.leistungsbilanz = neu.exporte - neu.importe + (k.p("handel.nfaRendite") / 100) * alt.nfa + k.land.start.lbRest;
  neu.nfa =
    (alt.nfa + neu.leistungsbilanz) / (1 + neu.wachstum + neu.inflation / 100);
  neu.reserve =
    r === "welt"
      ? clamp(
          alt.reserve -
            k.p("handel.reserveErosion") *
              (Math.max(0, neu.schuldQuote - 100) / 10 +
                Math.max(0, neu.qe - s.qe) / 10),
          0,
          1,
        )
      : alt.reserve;
};
