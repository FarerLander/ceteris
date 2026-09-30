// Politik als Verzerrung (Spec 13.13): Die Regierung wählt nicht das beste Paket. An jedem Auslöser
// stehen drei Optionen nach Motiv; eine Regel sagt, welche eine Regierung wahrscheinlich wählt.
// Keine Parteien, keine Wahlausgänge: Wahltermine sind feste Daten, die Richtung kommt aus der
// Struktur des Landes.
import { standardWert } from "./kontext";
import { PAKETE } from "./pakete";
import type { PolitikStand } from "./politik";
import type { Kontext, Landesdaten, SteuerId, Szenario, Zustand } from "./typen";
import { eintrag } from "./verzeichnis";

import type { Ausloeser, Motiv, Struktur } from "./politik-modus";
export type { Ausloeser, Motiv, Struktur } from "./politik-modus";

// Wirksamkeit der Regierung q (Weltbank WGI Government Effectiveness, 0–100 → 0–1). Ohne Angabe 0,7.
export const wirksamkeit = (land: Landesdaten): number => (land.politik?.wirksamkeit ?? 70) / 100;

// Jahre seit der letzten Wahl im festen Takt. null: kein Takt (Block fehlt oder Gewicht 0).
export function jahreSeitWahl(land: Landesdaten, jahr: number): number | null {
  const p = land.politik;
  if (!p || p.takt <= 0 || p.legislatur <= 0) return null;
  return (((jahr - p.letzteWahl) % p.legislatur) + p.legislatur) % p.legislatur;
}
export const istWahljahr = (land: Landesdaten, jahr: number): boolean => jahreSeitWahl(land, jahr) === 0;
export const istVorwahljahr = (land: Landesdaten, jahr: number): boolean =>
  jahreSeitWahl(land, jahr) === (land.politik?.legislatur ?? 0) - 1;
// Erstes Wahljahr ab `ab` (einschließlich).
export function naechstesWahljahr(land: Landesdaten, ab: number): number | null {
  const seit = jahreSeitWahl(land, ab);
  return seit === null ? null : seit === 0 ? ab : ab + land.politik!.legislatur - seit;
}

// Wirkstärke oder Schwelle wie k.p: abgeschaltet gilt der neutrale Wert.
const p = (land: Landesdaten, sz: Szenario, id: string): number =>
  sz.aus.includes(id) ? (eintrag(id).neutral ?? 0) : standardWert(id, land);

// Richtung der Großprogramme aus der Struktur des Landes (Startwerte), nicht aus einer Partei:
// ausgebauter Sozialstaat, Energieimporteur, Leistungsbilanzdefizit; sonst Markt.
export function struktur(land: Landesdaten, sz: Szenario): Struktur {
  const s = land.start;
  const signal = (wert: number, schwelle: number) => (schwelle > 0 ? wert / schwelle : 0);
  const sozial = s.rentenausgaben + standardWert("staat.gesundheit", land) + standardWert("staat.familie", land) + s.alg;
  const signale: [Struktur, number][] = [
    ["sozial", signal(sozial, p(land, sz, "politik.sozialSchwelle"))],
    ["energie", signal(s.importquote, p(land, sz, "politik.energieSchwelle"))],
    ["handel", signal(-(s.exporte - s.importe + (s.lbRest ?? 0)), p(land, sz, "politik.handelSchwelle"))],
  ];
  const [name, staerke] = signale.reduce((a, b) => (b[1] > a[1] ? b : a));
  return staerke >= 1 ? name : "markt";
}

// ---------- Auslöser ----------

// Schwäche: Wachstum pro Kopf unter der Schwelle aus 13.9 oder Arbeitslosigkeit deutlich über der strukturellen.
export const schwach = (alt: Zustand, k: Kontext): boolean =>
  alt.wachstumProKopf * 100 < k.p("schwelle.wachstum") ||
  alt.alq > alt.nairuEff + k.p("politik.alqAbstand");

// Enger Haushalt: wenig Spielraum oder hohe Zinslast (Anteile der Einnahmen).
export const eng = (alt: Zustand, k: Kontext): boolean =>
  alt.spielraum < k.p("politik.spielraumMin") || alt.topfZins > k.p("politik.zinsMax");

// Mindestens n der letzten n + nachsicht Jahre.
export const anhaltend = (jahre: boolean[], n: number, nachsicht: number): boolean =>
  jahre.slice(-(Math.ceil(n) + nachsicht)).filter(Boolean).length >= n;

// ---------- Druck und Vorwahl ----------

// Lage am Entscheidungspunkt, aus dem Vorjahr. k ist der Kontext des Jahres `jahr`.
export interface Lagebild {
  jahr: number;
  alt: Zustand;
  schwachJahre: boolean[];
  k: Kontext;
  sz: Szenario;
  letztesProgramm?: number; // Jahr des letzten Großprogramms (Richtung bei Schwäche), fehlt: keins
}

// Wie stark der Auslöser drückt: Dauer und Stärke. Rund 1 heißt: lange und deutlich.
export function druck(a: Ausloeser, l: Lagebild): number {
  const { alt, k } = l;
  if (a === "schwaeche")
    return (
      l.schwachJahre.slice(-7).filter(Boolean).length / 7 +
      Math.max(0, alt.alq - alt.nairuEff - k.p("politik.alqAbstand")) / 5
    );
  return (
    Math.max(0, k.p("politik.spielraumMin") - alt.spielraum) / 10 +
    Math.max(0, alt.topfZins - k.p("politik.zinsMax")) / 10 +
    Math.max(0, alt.aufschlag) / k.p("schwelle.aufschlag")
  );
}

// Machterhalt bei Schwäche gibt Geld aus. Das geht nur, solange die Märkte mitspielen (Risikoaufschlag
// unter der Warnschwelle). Eine greifende Schuldenregel hält eine Regierung davon nicht ab: Sie umgeht sie
// (Spec 13.13, Beispiel Sondervermögen 2025).
const machtMoeglich = (l: Lagebild): boolean => l.alt.aufschlag <= l.k.p("schwelle.aufschlag");
// Großprogramme legt eine Regierung nur ab und zu auf (Spec 13.13): nicht, solange das letzte keine
// politik.programmAbstand Jahre zurückliegt.
const programmFrisch = (l: Lagebild): boolean =>
  l.letztesProgramm !== undefined && l.jahr - l.letztesProgramm < l.k.p("politik.programmAbstand");

// Die Option, die eine Regierung in dieser Lage wahrscheinlich wählt. Ohne Zufall: dasselbe Land in
// derselben Lage entscheidet immer gleich. Meist Machterhalt oder Richtung; „Unbequem“ erst unter hohem
// Druck, bei wirksamer Regierung und nicht kurz vor der Wahl (Verzerrungen 1 und 5).
export function vorwahl(a: Ausloeser, l: Lagebild, wirksam: (id: string) => number): Motiv {
  const { k, alt, jahr } = l;
  const q = wirksamkeit(k.land);
  const wahlnah = istWahljahr(k.land, jahr) || istVorwahljahr(k.land, jahr);
  let unbequem = druck(a, l) * (0.5 + q) >= k.p("politik.druckSchwelle") && !wahlnah;
  if (unbequem && a === "schwaeche") {
    // Zu spät: Je schwächer die Regierung, desto länger muss die Schwäche schon anhalten.
    const n = k.p("politik.reformJahre") + Math.round(k.p("politik.verspaetung") * (1 - q));
    unbequem = anhaltend(l.schwachJahre, n, 2) && schwaecheOption("unbequem", l, wirksam) !== null;
  }
  if (unbequem) return "unbequem";
  if ((wahlnah || alt.lage === "krise") && (a === "eng" || machtMoeglich(l))) return "macht";
  // Ein Großprogramm nur ab und zu; sonst die bequeme Möglichkeit. Lassen die Märkte keine Ausgaben zu,
  // zwingen sie die Regierung zur unbequemen Entscheidung (Beispiel Italien 2011), wenn es eine gibt.
  if (a === "schwaeche" && programmFrisch(l)) {
    if (machtMoeglich(l)) return "macht";
    if (schwaecheOption("unbequem", l, wirksam) !== null) return "unbequem";
  }
  return "richtung";
}

// ---------- Wirkungen ----------

// Eine Änderung an einer Stellschraube über die Zeit: gleitet ab `ab` über `gleit` Jahre linear auf
// `delta`, endet nach `bis` (einschließlich; fehlt = dauerhaft). ruecknahme: Teil-Rücknahme einer Reform.
export interface Wirkung {
  id: string;
  delta: number;
  ab: number;
  gleit: number;
  bis?: number;
  ruecknahme?: true;
}
export function wirkungIm(w: Wirkung, jahr: number): number {
  if (jahr < w.ab || (w.bis !== undefined && jahr > w.bis)) return 0;
  return w.delta * Math.min(1, (jahr - w.ab + 1) / Math.max(1, w.gleit));
}

// Umsetzungsgrad einer unbequemen Entscheidung (Verzerrung 2, verwässert).
const umsetzung = (k: Kontext): number =>
  Math.min(1, k.p("politik.umsetzungMin") + k.p("politik.umsetzungSpanne") * wirksamkeit(k.land));

// Änderung, die im Bereich der Stellschraube bleibt. Sie kehrt ihr Vorzeichen nie um: Liegt der Wert
// schon jenseits des Rands (ein Pfad der Nutzerin springt), bleibt die Änderung 0.
export const imBereich = (id: string, delta: number, wirksam: (id: string) => number): number => {
  const b = eintrag(id).bereich;
  if (!b) return delta;
  const w = wirksam(id);
  return delta >= 0 ? Math.max(0, Math.min(delta, b[1] - w)) : Math.min(0, Math.max(delta, b[0] - w));
};

// % BIP je €/MWh Zuschuss für Industriestrom.
const jeEuroIndustriestrom = (alt: Zustand, k: Kontext): number =>
  ((k.land.start.industrieTWh * k.land.waehrung.kurs) / 1000 / alt.Y) * 100;

// ---------- Optionen bei Schwäche ----------

export interface SchwaecheOption {
  wirkungen: Wirkung[];
  struktur?: Struktur;
  paket?: string;
}

// null: Option nicht möglich (Machterhalt bei hohem Risikoaufschlag, Programm am Rand, Paket ausgeschöpft).
export function schwaecheOption(m: Motiv, l: Lagebild, wirksam: (id: string) => number): SchwaecheOption | null {
  const { k, alt, jahr: j } = l;
  const s = k.land.start;
  const gleit = k.p("politik.gleitJahre");
  if (m === "macht") {
    if (!machtMoeglich(l)) return null;
    // Konjunkturpaket als Konsum. Ein Teil bleibt (Sperrklinke) und wird über die kalte Progression
    // zurückgeholt (Defizit-Neigung: geben sichtbar, nehmen unsichtbar).
    const paket = k.p("politik.konjunktur");
    const dauer = k.p("politik.konjunkturJahre");
    const wirkungen: Wirkung[] = [{ id: "staat.uebrige", delta: paket, ab: j, gleit: 1, bis: j + dauer - 1 }];
    const bleibt = k.p("politik.sperrklinke") * paket;
    if (bleibt > 0) {
      wirkungen.push({ id: "staat.uebrige", delta: bleibt, ab: j + dauer, gleit: 1 });
      const jeJahr = k.p("politik.kalteProgression");
      const satz = imBereich("steuer.einkommen", bleibt / s.steuerBasen.einkommen, wirksam);
      if (jeJahr > 0 && satz > 0) wirkungen.push({ id: "steuer.einkommen", delta: satz, ab: j + 1, gleit: Math.ceil(satz / jeJahr) });
    }
    return { wirkungen };
  }
  if (m === "richtung") {
    // Großprogramm, dauerhaft, folgt der Struktur des Landes (Verzerrung 6).
    const art = struktur(k.land, l.sz);
    const umfang = k.p("politik.programm");
    const roh: [string, number][] =
      art === "sozial"
        ? [
            ["rente.niveau", (0.6 * umfang * wirksam("rente.niveau")) / Math.max(1e-9, alt.rentenausgaben)],
            ["staat.familie", 0.4 * umfang],
          ]
        : art === "energie"
          ? [["energie.industrieSubvention", umfang / Math.max(1e-9, jeEuroIndustriestrom(alt, k))]]
          : art === "handel"
            ? [["handel.zoelle", k.p("politik.programmZoll")]]
            : [
                ["steuer.unternehmen", (-0.5 * umfang) / s.steuerBasen.unternehmen],
                ["steuer.einkommen", (-0.5 * umfang) / s.steuerBasen.einkommen],
              ];
    const wirkungen = roh
      .map(([id, d]): Wirkung => ({ id, delta: imBereich(id, d, wirksam), ab: j, gleit }))
      .filter((w) => Math.abs(w.delta) > 1e-9);
    // Stehen alle Stellschrauben des Programms schon am Rand, gibt es kein Programm.
    if (!wirkungen.length) return null;
    return { wirkungen, struktur: art };
  }
  // Unbequem: ein Teil des Pakets, das zum Auslöser passt, nicht das rechnerisch beste. Schalter und
  // Grundeinstellungen (Rentensystem) bewegt die Regierung nicht.
  const id = alt.alq > alt.nairuEff + k.p("politik.alqAbstand") ? "arbeit" : "gruendungen";
  const paket = PAKETE.find((x) => x.id === id)!;
  const ziel = paket.setze(wirksam, k.basis, l.sz.grund).stell;
  const grad = umsetzung(k);
  const wirkungen: Wirkung[] = [];
  for (const [hebel, z] of Object.entries(ziel)) {
    if (eintrag(hebel).optionen) continue;
    const delta = imBereich(hebel, grad * (z - wirksam(hebel)), wirksam);
    // Ein Rest unter 1 % des Bereichs der Stellschraube zählt als ausgeschöpft.
    const b = eintrag(hebel).bereich;
    if (Math.abs(delta) > (b ? 0.01 * (b[1] - b[0]) : 1e-9)) wirkungen.push({ id: hebel, delta, ab: j, gleit });
  }
  if (!wirkungen.length) return null;
  // Rücknahme: In der folgenden Legislatur dreht die Regierung einen Teil zurück.
  const anteil = k.p("politik.ruecknahme");
  const wahl = k.land.politik ? naechstesWahljahr(k.land, j + k.land.politik.legislatur) : null;
  if (anteil > 0 && wahl !== null)
    for (const w of [...wirkungen]) wirkungen.push({ id: w.id, delta: -anteil * w.delta, ab: wahl, gleit: 1, ruecknahme: true });
  return { wirkungen, paket: id };
}

// ---------- Optionen bei engem Haushalt ----------

// Kürzungen in dieser Reihenfolge; Verteidigung und Bildung nur mit Schalter (Spec 13.10).
export const KUERZEN = ["staat.uebrige", "energie.industrieSubvention", "rente.niveau", "staat.gesundheit", "staat.familie"];
export const KUERZEN_SCHALTER = ["staat.verteidigung", "innov.bildung"];
const STEUERN_KONSOL = ["einkommen", "mwst"] as const;
// Soziale Versprechen lassen sich kaum zurücknehmen (Sperrklinke): halb so schnell.
const GEBREMST = ["rente.niveau", "sozial.lohnersatz"];

// Der Sparschritt eines Jahres in % BIP. Wenig Spielraum: Abstand zu 10 % der Einnahmen. Hohe Zinslast:
// Abstand des Primärsaldos zu dem Saldo, der die Schuldenquote hält ((r − g) / (1 + g) × Schuld,
// Lehrbuch), plus der Zinsüberhang über 15 %, damit die Schuld sinkt, bis die Zinslast wieder tragbar ist.
export function sparschritt(alt: Zustand, k: Kontext): number {
  const E = alt.einnahmen / 100;
  const spielraumLuecke = Math.max(0, k.p("politik.spielraumMin") - alt.spielraum) * E;
  const gNom = alt.wachstum + alt.inflation / 100;
  const haltend = ((alt.effZins / 100 - gNom) / (1 + gNom)) * alt.schuldQuote;
  const ueberhang = alt.topfZins - k.p("politik.zinsMax");
  const zinsLuecke = ueberhang > 0 ? Math.max(0, haltend + ueberhang * E - alt.primaer) : 0;
  return Math.min(k.p("politik.konsolMax"), k.p("politik.konsolTeil") * Math.max(spielraumLuecke, zinsLuecke));
}

const verschiebe = (stand: PolitikStand, id: string, x: number) => {
  stand.kuerzung[id] = (stand.kuerzung[id] ?? 0) + x;
};

// Steuer um `betrag` % BIP erhöhen (Nennbetrag über die Bemessungsgrundlage), höchstens bis zur
// Bereichsgrenze. Gibt die umgesetzten % BIP zurück.
function erhoeheSteuer(stand: PolitikStand, x: SteuerId, satz: number, k: Kontext, wirksam: (id: string) => number): number {
  const id = `steuer.${x}`;
  const hoch = eintrag(id).bereich?.[1] ?? 1;
  const d = Math.min(satz, Math.max(0, hoch - wirksam(id)));
  if (d <= 0) return 0;
  verschiebe(stand, id, d);
  return d * k.land.start.steuerBasen[x];
}

// Ausgaben der Reihe nach um zusammen `rest` % BIP kürzen. Kein Bereich sinkt um mehr als
// politik.kuerzGrenze seines Werts beim ersten Sparjahr und nicht unter seinen Bereich.
function kuerze(stand: PolitikStand, liste: string[], rest: number, alt: Zustand, k: Kontext, wirksam: (id: string) => number, sperrklinke: boolean): number {
  // % BIP je Einheit der Stellschraube.
  const faktor = (id: string) =>
    id === "energie.industrieSubvention"
      ? jeEuroIndustriestrom(alt, k)
      : id === "rente.niveau"
        ? alt.rentenausgaben / Math.max(1, wirksam(id))
        : id === "sozial.lohnersatz"
          ? alt.algAusgaben / Math.max(1e-9, wirksam(id))
          : 1;
  let umgesetzt = 0;
  for (const id of liste) {
    if (rest <= 0) break;
    const f = faktor(id);
    if (f <= 0) continue;
    const tief = eintrag(id).bereich?.[0] ?? 0;
    const grenze = ((k.p("politik.kuerzGrenze") / 100) * (stand.kuerzBasis[id] ?? 0)) + (stand.kuerzung[id] ?? 0);
    const raum = Math.max(0, Math.min(grenze, wirksam(id) - tief));
    const bremse = sperrklinke && GEBREMST.includes(id) ? 0.5 : 1;
    const kuerzung = Math.min(raum * f * bremse, rest);
    if (kuerzung <= 0) continue;
    verschiebe(stand, id, -kuerzung / f);
    rest -= kuerzung;
    umgesetzt += kuerzung;
  }
  return umgesetzt;
}

// Ein Sparschritt (Spec 13.10). Gibt die umgesetzten % BIP zurück (Steuern mit dem Nennbetrag vor
// Ausweichen). faktor: Umsetzungsgrad; sperrklinke: Rente und Lohnersatz nur halb so schnell (Spec 13.13).
export function konsolidiere(stand: PolitikStand, alt: Zustand, k: Kontext, wirksam: (id: string) => number, faktor = 1, sperrklinke = false): number {
  const s = k.land.start;
  const schritt = sparschritt(alt, k) * faktor;
  const anteil = Math.min(1, Math.max(0, k.w("politik.steueranteil")));
  let umgesetzt = 0;
  // Steuern: je zur Hälfte Einkommen- und Mehrwertsteuer, höchstens bis zur Bereichsgrenze.
  for (const x of STEUERN_KONSOL) umgesetzt += erhoeheSteuer(stand, x, (anteil * schritt) / 2 / s.steuerBasen[x], k, wirksam);
  const liste = k.w("politik.kuerzeAlles") >= 0.5 ? [...KUERZEN, ...KUERZEN_SCHALTER] : KUERZEN;
  return umgesetzt + kuerze(stand, liste, (1 - anteil) * schritt, alt, k, wirksam, sperrklinke);
}

// Ein Jahr der gewählten Option bei engem Haushalt. Schreibt in stand.kuerzung wie konsolidiere und gibt
// die umgesetzten % BIP zurück. Die halbierte Schuldenregel (Machterhalt) setzt der Jahreslauf.
export function engSchritt(m: Motiv, stand: PolitikStand, l: Lagebild, wirksam: (id: string) => number): number {
  const { alt, k } = l;
  const merke = (ids: string[]) => {
    for (const id of ids) stand.kuerzBasis[id] ??= wirksam(id);
  };
  if (m === "unbequem") {
    // Die Konsolidierung aus 13.10, aber verwässert und mit Sperrklinke bei Rente und Sozialem.
    merke([...KUERZEN, ...KUERZEN_SCHALTER]);
    return konsolidiere(stand, alt, k, wirksam, umsetzung(k), true);
  }
  const schritt = sparschritt(alt, k);
  let umgesetzt = 0;
  if (m === "macht") {
    // Umgehen: versteckte Einnahmen (Abgaben, kalte Progression) und aufgeschobene Investitionen.
    const jeJahr = k.p("politik.kalteProgression");
    for (const x of ["sozialabgaben", "einkommen"] as const) umgesetzt += erhoeheSteuer(stand, x, jeJahr, k, wirksam);
    const aufschub: [string, number][] = [["staat.investitionen", 0.3], ["innov.bildung", 0.1], ["energie.netzInvest", 0.1]];
    merke(aufschub.map(([id]) => id));
    for (const [id, anteil] of aufschub) umgesetzt += kuerze(stand, [id], anteil * schritt, alt, k, wirksam, false);
    return umgesetzt;
  }
  // Richtung: Lastenverteilung nach der Struktur. Der Sozialstaat holt das Geld bei Kapital, Vermögen und
  // Unternehmen; alle anderen kürzen Sozialleistungen.
  if (struktur(k.land, l.sz) === "sozial") {
    for (const x of ["kapitalertrag", "vermoegen", "unternehmen"] as const)
      umgesetzt += erhoeheSteuer(stand, x, schritt / 3 / k.land.start.steuerBasen[x], k, wirksam);
    return umgesetzt;
  }
  const sozial = ["sozial.lohnersatz", "staat.familie", "rente.niveau"];
  merke(sozial);
  return kuerze(stand, sozial, schritt, alt, k, wirksam, false);
}
