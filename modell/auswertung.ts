import { standardWert } from "./kontext";
import { fmt, formatStell } from "./format";
import { LAGEN } from "./lage";
import { BANKEN_STANDARD, RETTUNG_STANDARD } from "./banken-modus";
import { planAn } from "./haushaltsplan";
import { ereignisText, schluessel } from "./politik";
import { MOTIVE, politikAn, type Ausloeser, type Motiv, type PolitikEreignis } from "./politik-modus";
import { aktuell } from "./pakete";
import { basisSzenario, rechne } from "./rechne";
import { LAGE_NAME } from "./reihen";
import { schockWirkung } from "./schocks";
import type {
  Grundeinstellungen,
  Landesdaten,
  Lage,
  Szenario,
  Zustand,
} from "./typen";
import { t } from "./sprache";
import { eintrag, vKanal, vName, vOption } from "./verzeichnis";

import { masse, type Masse } from "./masse";

export { MASSE, masse, type MassId, type Masse } from "./masse";

export interface Treiber {
  id: string;
  name: string;
  wert: string;
  kanal: string;
  pc: number;
  d: number;
  jahr: number;
}
export interface Erzaehlung {
  titel: string;
  unter: string;
  symbol: Lage;
  verteilung: Record<Lage, number>;
  treiber: Treiber[];
}

const GRUND_OPTIONEN: Record<
  keyof Grundeinstellungen,
  readonly (string | boolean)[]
> = {
  regime: ["welt", "eigen", "euro", "hart", "gelenkt"],
  rentensystem: ["umlage", "mischung", "kapital"],
  tpi: [false, true],
  politik: ["fest", "reagiert"],
  banken: ["aus", "an"],
  rettung: ["schnell", "zoegernd"],
  haushaltsplan: ["aus", "an"],
};

// Grundeinstellung mit Standard: Politik (Spec 13.10), Banken und Rettung (Spec 13.6), Haushaltsplan (M29)
// dürfen im Szenario fehlen.
const grundWert = (g: Grundeinstellungen, k: keyof Grundeinstellungen): string | boolean =>
  k === "haushaltsplan"
    ? planAn(g) ? "an" : "aus"
    : k === "politik"
    ? politikAn(g) ? "reagiert" : "fest"
    : k === "banken"
      ? (g.banken ?? BANKEN_STANDARD)
      : k === "rettung"
        ? (g.rettung ?? RETTUNG_STANDARD)
        : (g[k] as string | boolean);

function grundText(
  schluessel: keyof Grundeinstellungen,
  wert: string | boolean,
): string {
  return vOption(eintrag(`grund.${schluessel}`), GRUND_OPTIONEN[schluessel].indexOf(wert));
}

function grundKanal(
  schluessel: keyof Grundeinstellungen,
  wert: string | boolean,
): string {
  if (schluessel === "regime")
    return t("Risikoaufschlag, Zins und Handlungsspielraum der Notenbank");
  if (schluessel === "tpi")
    return t("die Deckelung des Risikoaufschlags durch die EZB");
  if (schluessel === "politik")
    return t("Konjunkturpakete, Großprogramme, Reformen und Sparen der Regierung");
  if (schluessel === "banken")
    return t("Hauspreise, faule Kredite und Bankenrettung");
  if (schluessel === "haushaltsplan")
    return t("die geplante Haushaltspolitik bis 2031 und ihre Wirkung auf Nachfrage und Schuld");
  if (schluessel === "rettung")
    return t("das Tempo, in dem Banken faule Kredite abschreiben");
  return wert === "umlage"
    ? t("die Rentenlast im Haushalt")
    : t("erst Doppelbelastung, später Entlastung und mehr Kapital für Gründungen");
}

export function geaendert(land: Landesdaten, sz: Szenario): string[] {
  const stell = Object.keys(sz.stell).filter(
    (id) => Math.abs(aktuell(land, sz, id) - standardWert(id, land)) > 1e-9,
  );
  const grund = (Object.keys(GRUND_OPTIONEN) as (keyof Grundeinstellungen)[])
    .filter((k) => grundWert(sz.grund, k) !== grundWert(land.grund, k))
    .map((k) => `grund.${k}`);
  return [...stell, ...grund, ...sz.aus.map((id) => `aus:${id}`)];
}

export function einzelwirkung(
  land: Landesdaten,
  sz: Szenario,
  id: string,
  basis: Zustand[],
): Treiber {
  const b = basisSzenario(land, sz.jahre);
  let einzeln: Szenario, name: string, wert: string, kanal: string;
  if (id.startsWith("aus:")) {
    const wid = id.slice(4);
    const r = rechne(land, { ...b, aus: [wid] });
    const i = Math.min(35, sz.jahre - 1);
    return {
      id, name: vName(eintrag(wid)), wert: t("abgeschaltet"), kanal: t("diese umstrittene Annahme"),
      jahr: land.datenstand + i,
      pc: (r[i].bipProKopf / basis[i].bipProKopf - 1) * 100,
      d: r[i].schuldQuote - basis[i].schuldQuote,
    };
  }
  if (id.startsWith("grund.")) {
    const k = id.slice(6) as keyof Grundeinstellungen;
    einzeln = { ...b, grund: { ...b.grund, [k]: sz.grund[k] } };
    name = vName(eintrag(id));
    wert = t("{neu} statt {alt}", { neu: grundText(k, grundWert(sz.grund, k)), alt: grundText(k, grundWert(land.grund, k)) });
    kanal = grundKanal(k, grundWert(sz.grund, k));
  } else {
    const e = eintrag(id);
    einzeln = { ...b, stell: { [id]: sz.stell[id] } };
    name = vName(e);
    wert = t("{neu} statt {alt}", { neu: formatStell(e, aktuell(land, sz, id)), alt: formatStell(e, standardWert(id, land)) });
    kanal = vKanal(e);
  }
  const r = rechne(land, einzeln);
  const i = Math.min(35, sz.jahre - 1);
  return {
    id,
    name,
    wert,
    kanal,
    jahr: land.datenstand + i,
    pc: (r[i].bipProKopf / basis[i].bipProKopf - 1) * 100,
    d: r[i].schuldQuote - basis[i].schuldQuote,
  };
}

export function erzaehlung(
  land: Landesdaten,
  sz: Szenario,
  verlauf: Zustand[],
): Erzaehlung {
  const verteilung = Object.fromEntries(LAGEN.map((l) => [l, 0])) as Record<
    Lage,
    number
  >;
  for (const z of verlauf) verteilung[z.lage]++;
  // Bei Gleichstand gewinnt die frühere Lage laut LAGEN.
  const vorherrschend = [...LAGEN].sort(
    (a, b) => verteilung[b] - verteilung[a],
  )[0];
  // Im Schock: Schockjahr und Folgejahr, dazu jedes Jahr, in dem ein Schock
  // (mit seiner Dauer) die Krise selbst auslöst.
  const imSchock = (jahr: number) =>
    sz.schocks.some((s) => jahr >= s.jahr && jahr <= s.jahr + 1) ||
    schockWirkung(sz.schocks, jahr).krise > 0;
  const ersteKrise = verlauf.find(
    (z) => z.lage === "krise" && !imSchock(z.jahr),
  );
  const ende = verlauf[verlauf.length - 1],
    anfang = verlauf[0];

  let titel: string, unter: string, symbol: Lage;
  if (ersteKrise) {
    const schwelle = eintrag("schwelle.aufschlag").standard;
    titel = t("Ab {jahr} droht die Krise", { jahr: ersteKrise.jahr });
    unter =
      ersteKrise.aufschlag > schwelle
        ? t("Der Risikoaufschlag steigt über {schwelle} Prozentpunkte, bei einer Schuldenquote von {quote} %. Die Märkte zweifeln dann an der Tragfähigkeit.", { schwelle: fmt(schwelle, 0), quote: fmt(ersteKrise.schuldQuote, 0) })
        : ersteKrise.ventilSeit === 0
          ? t("Die Schuld wird untragbar. Es kommt zu einem Schuldenschnitt oder die Notenbank finanziert den Staat.")
          : ersteKrise.dsr > land.start.dsrSchwelle
            ? t("Die privaten Schulden werden zu teuer. Haushalte und Firmen müssen sich entschulden.")
            : t("Das Finanzsystem gerät ins Wanken.");
    symbol = "krise";
  } else {
    titel = t({
      krise: "Die Lage ist angespannt",
      depression: "Die Wirtschaft steckt in einer Depression",
      rezession: "Die Wirtschaft schrumpft immer wieder",
      stagflation: "Wenig Wachstum bei hoher Inflation",
      deflation: "Die Preise fallen über weite Strecken",
      boom: "Die Wirtschaft boomt über weite Strecken",
      schuldenwachstum: "Wachstum, aber auf Pump",
      wachstum: "Die Wirtschaft wächst solide",
      stagnation: "Die Wirtschaft kommt kaum vom Fleck",
    }[vorherrschend]);
    const werte = { jahr: ende.jahr, von: fmt(anfang.bipProKopf, 1), bis: fmt(ende.bipProKopf, 1), w: land.waehrung.symbol, lage: t(LAGE_NAME[vorherrschend]), n: verteilung[vorherrschend], gesamt: verlauf.length };
    unter =
      ende.bipProKopf >= anfang.bipProKopf
        ? t("Keine Krise bis {jahr}. Ökonomischer Wohlstand pro Kopf steigt von {von} auf {bis} Tsd. {w} ({lage} in {n} von {gesamt} Jahren).", werte)
        : t("Keine Krise bis {jahr}. Ökonomischer Wohlstand pro Kopf sinkt von {von} auf {bis} Tsd. {w} ({lage} in {n} von {gesamt} Jahren).", werte);
    symbol = vorherrschend;
  }

  const ids = geaendert(land, sz);
  const basis = ids.length ? rechne(land, basisSzenario(land, sz.jahre)) : [];
  const treiber = ids
    .map((id) => einzelwirkung(land, sz, id, basis))
    .sort(
      (a, b) =>
        Math.abs(b.pc) +
        Math.abs(b.d) / 5 -
        (Math.abs(a.pc) + Math.abs(a.d) / 5),
    )
    .slice(0, 6);
  return { titel, unter, symbol, verteilung, treiber };
}

// Was die Regierung von selbst getan hat (Spec 13.10): Wirkung gegen denselben Lauf mit Politik fest,
// getrennt von den Treibern der Nutzerin oder des Nutzers.
export function politikWirkung(land: Landesdaten, sz: Szenario, verlauf: Zustand[]): Treiber | null {
  if (!politikAn(sz.grund)) return null;
  const n = verlauf.reduce((a, z) => a + z.politik.length, 0);
  if (!n) return null;
  const fest = rechne(land, { ...sz, grund: { ...sz.grund, politik: "fest" } });
  const i = Math.min(35, sz.jahre - 1);
  return {
    id: "politik",
    name: t("Die Regierung reagiert"),
    wert: n === 1 ? t("1 Eingriff") : t("{n} Eingriffe", { n }),
    kanal: t("Konjunkturpakete, Großprogramme, Reformen und Sparen der Regierung"),
    jahr: land.datenstand + i,
    pc: (verlauf[i].bipProKopf / fest[i].bipProKopf - 1) * 100,
    d: verlauf[i].schuldQuote - fest[i].schuldQuote,
  };
}

// ---------- Entscheidungspunkte (Spec 13.13) ----------

export interface OptionsBewertung {
  motiv: Motiv;
  moeglich: boolean;
  grund?: string; // warum die Option nicht möglich ist
  masse: Masse; // fünf Maße im Endjahr gegen den Lauf mit der Vorwahl
  name: string;
  beschreibung: string; // was die Regierung mit dieser Option tut
  zahlt: string;
  spaeter: string;
}

// Je Option: Name der Karte, wer zahlt, was es später kostet. Fest je Option, keine Bewertung, keine Lager.
const OPTION_TEXT: Record<Ausloeser, Record<Motiv, [string, string, string]>> = {
  schwaeche: {
    macht: ["Konjunktur mit Ausgaben stützen", "Alle Steuerzahler, schleichend über die Einkommensteuer", "Ein Teil der Ausgaben bleibt, die Steuerlast steigt unbemerkt"],
    richtung: ["Großes Programm", "Je nach Programm: Beitragszahler, Stromkunden und Steuerzahler, Verbraucher", "Dauerhafte Ausgabe oder höhere Preise; schwer zurückzunehmen"],
    unbequem: ["Reform, ein Teil davon", "Die Betroffenen der Reform", "Ein Teil wird später zurückgenommen"],
  },
  eng: {
    macht: ["Schuldenregel umgehen", "Künftige Haushalte, Beitragszahler", "Aufgeschobene Investitionen, höhere Schuld"],
    richtung: ["Lasten verteilen", "Je nach Struktur: Kapital und Unternehmen oder Empfänger von Sozialleistungen", "Abwanderung von Kapital oder mehr Ungleichheit"],
    unbequem: ["Sparen", "Alle, die staatliche Leistungen nutzen, und Steuerzahler", "Weniger Nachfrage in den Sparjahren"],
  },
};

// Name der Karte einer Option, übersetzt.
export const optionName = (a: Ausloeser, m: Motiv): string => t(OPTION_TEXT[a][m][0]);

const mitWahl = (sz: Szenario, k: string, m: Motiv | null): Szenario => {
  const wahl = { ...(sz.wahl ?? {}) };
  if (m === null) delete wahl[k];
  else wahl[k] = m;
  const { wahl: _alt, ...rest } = sz;
  return Object.keys(wahl).length ? { ...rest, wahl } : rest;
};
const punktIn = (v: Zustand[], jahr: number, a: Ausloeser): PolitikEreignis | undefined =>
  v.flatMap((z) => z.politik).find((e) => e.art === "entscheidung" && e.jahr === jahr && e.ausloeser === a);

// Rechnet das Szenario je Option einmal bis zum Ende; Maße gegen den Lauf mit der Vorwahl.
export function bewerteOptionen(land: Landesdaten, sz: Szenario, e: PolitikEreignis): OptionsBewertung[] {
  const a = e.ausloeser ?? "schwaeche";
  const k = schluessel(e.jahr, a);
  const ende = sz.jahre - 1;
  const referenz = rechne(land, mitWahl(sz, k, null));
  return MOTIVE.map((motiv) => {
    const v = motiv === e.vorwahl ? referenz : rechne(land, mitWahl(sz, k, motiv));
    const punkt = punktIn(v, e.jahr, a);
    // Fällt der Lauf auf eine andere Option zurück, ist die gewählte in dieser Lage nicht möglich.
    const moeglich = punkt?.motiv === motiv;
    const [name, zahlt, spaeter] = OPTION_TEXT[a][motiv];
    return {
      motiv,
      moeglich,
      ...(moeglich
        ? {}
        : {
            grund:
              motiv === "macht"
                ? t("Nicht möglich: Der Risikoaufschlag ist zu hoch für zusätzliche Ausgaben.")
                : motiv === "richtung"
                  ? t("Nicht möglich: Die Stellschrauben dieses Programms stehen schon am Rand.")
                  : t("Nicht möglich: Das passende Paket ist schon umgesetzt."),
          }),
      masse: moeglich ? masse(v, referenz, ende) : { wohlstand: 0, gini: 0, armut: 0, schuld: 0, co2: 0 },
      name: t(name),
      beschreibung: ereignisText(moeglich ? punkt! : { ...e, motiv }),
      zahlt: t(zahlt),
      spaeter: t(spaeter),
    };
  });
}

// Setzt die Wahl der Nutzerin an einem Entscheidungspunkt (null oder die Vorwahl selbst: zurück zur
// Regel) und räumt Einträge ab, zu denen der neue Verlauf keinen Punkt mehr hat.
export function setzeWahl(land: Landesdaten, sz: Szenario, jahr: number, a: Ausloeser, m: Motiv | null): Szenario {
  const neu = mitWahl(sz, schluessel(jahr, a), m);
  return neu.wahl ? bereinigeWahl(neu, rechne(land, neu)) : neu;
}

// Räumt Einträge ab, zu denen `verlauf` keinen Punkt hat oder die der Regel entsprechen (G6 der Prüfung).
// Gibt dasselbe Objekt zurück, wenn nichts zu räumen ist. Stehen bleiben: bei „Politik fest“ alles (es gibt
// keine Punkte, und wer zurück auf „reagiert“ schaltet, soll seine Wahl wiederfinden) und Einträge hinter dem
// Ende des Zeitraums (sie gelten wieder, wenn der Zeitraum länger wird).
export function bereinigeWahl(sz: Szenario, verlauf: Zustand[]): Szenario {
  if (!sz.wahl || !politikAn(sz.grund)) return sz;
  const ende = verlauf[verlauf.length - 1].jahr;
  const punkte = new Map(verlauf.flatMap((z) => z.politik).filter((e) => e.art === "entscheidung").map((e) => [schluessel(e.jahr, e.ausloeser!), e]));
  let neu = sz;
  for (const [k, motiv] of Object.entries(sz.wahl)) {
    if (Number(k.slice(0, 4)) > ende) continue;
    const p = punkte.get(k);
    if (!p || p.vorwahl === motiv) neu = mitWahl(neu, k, null);
  }
  return neu;
}

