import { wirkstaerke } from "../modell/kontext";
import { kalibriereStandards } from "../modell/start";
import type { Landesdaten, Schaetzwert, Startwerte } from "../modell/typen";
import { GRUPPEN } from "./parser";
import type { AutoDatei, HandDatei, Reihe, SchaetzDatei } from "./typen";

export const KERN = ["bev", "bip", "alq", "schuldQuote", "inflation"];

function letztesJahr(r: Reihe | undefined, grenze: number): number | undefined {
  if (!r) return undefined;
  const jahre = Object.keys(r)
    .map(Number)
    .filter((j) => j <= grenze);
  return jahre.length ? Math.max(...jahre) : undefined;
}

// Spec 13.1: Nur Produktivitätstrend und NAIRU ersetzen Handwerte; neutraler Realzins und
// Produktionslücke werden nur angezeigt (Bauplan 13.1, Entscheidungen 1 und 2).
const ERSETZBAR = ["tfpTrend", "nairu"] as const;
export const BESTAETIGT = "Handwert liegt im Band, bestätigt";

function uebernimmSchaetzung(
  s: SchaetzDatei,
  hand: HandDatei,
  start: Startwerte,
  datenstand: number,
): NonNullable<Landesdaten["schaetzung"]> {
  const kopf = { jahr: s.jahr, kappa: s.kappa };
  if (s.fehler) return { ...kopf, werte: [], hinweis: `Schätzung nicht möglich: ${s.fehler}` };
  if (s.jahr !== datenstand)
    return { ...kopf, werte: [], hinweis: `Schätzung für ${s.jahr}, Datenstand ${datenstand}: Handwerte` };
  const werte = s.werte.map((w): Schaetzwert => {
    const ersetzbar = (ERSETZBAR as readonly string[]).includes(w.groesse);
    if (!ersetzbar) return { ...w, genutzt: false };
    const g = w.groesse as (typeof ERSETZBAR)[number];
    const handwert = hand.werte[g];
    // Liegt der Handwert im Band, widersprechen ihm die Daten nicht: er bleibt (Befund der Prüfung 13.1).
    const imBand = handwert !== undefined && Math.abs(handwert - w.wert) <= w.band;
    const urteil = imBand ? BESTAETIGT : hand.schaetzungAus?.[g];
    const genutzt = w.gueltig && !urteil;
    if (genutzt) start[g] = w.wert;
    return {
      ...w,
      genutzt,
      ...(handwert !== undefined ? { handwert } : {}),
      ...(w.gueltig && urteil ? { grund: urteil } : {}),
      ...(w.gueltig && imBand ? { bestaetigt: true } : {}),
    };
  });
  return { ...kopf, werte };
}

export function baueLand(
  auto: AutoDatei,
  hand: HandDatei,
  heute = new Date(),
  stand?: number,
  schaetzung?: SchaetzDatei,
): Landesdaten {
  const grenze = heute.getFullYear() - 1;
  const stände = KERN.map((k) => {
    const j = letztesJahr(auto.reihen[k], grenze);
    if (j === undefined)
      throw new Error(`Kernreihe ${k} fehlt für ${auto.code}`);
    return j;
  });
  // Mit `stand` wird ein bestimmtes Jahr Startjahr (Rückblick), sonst das letzte vollständige.
  const datenstand = stand ?? Math.min(...stände);
  const markiert: string[] = [];

  const wert = (schluessel: string, ersatz?: number): number => {
    const r = auto.reihen[schluessel];
    if (r?.[datenstand] !== undefined) return r[datenstand];
    const j = letztesJahr(r, datenstand);
    if (j !== undefined && datenstand - j <= 2) {
      markiert.push(schluessel);
      return r![j];
    }
    if (ersatz !== undefined) {
      markiert.push(`${schluessel} (Ersatz)`);
      return ersatz;
    }
    if (j !== undefined) {
      markiert.push(`${schluessel} (fehlt)`);
      return r![j];
    }
    throw new Error(`Keine Daten für ${schluessel} (${auto.code})`);
  };

  // Spec 13.13: Gini einheitlich aus der OECD, wo es sie gibt. Verteilungsdaten erscheinen mit Jahren
  // Verzug: Bis sechs Jahre alt gilt der letzte Wert (OECD ohne Markierung, Weltbank markiert, wenn er
  // nicht aus dem Startjahr stammt). Sonst Ersatzwert nach der Regel oben.
  const jOecd = letztesJahr(auto.reihen.giniOecd, datenstand);
  const jWb = letztesJahr(auto.reihen.gini, datenstand);
  const frisch = (j: number | undefined): j is number => j !== undefined && datenstand - j <= 6;
  let gini: number, giniQuelle: string;
  if (frisch(jOecd)) {
    gini = auto.reihen.giniOecd[jOecd];
    giniQuelle = `${auto.quellen.giniOecd}, ${jOecd}`;
  } else if (frisch(jWb)) {
    gini = auto.reihen.gini[jWb];
    giniQuelle = `Weltbank SI.POV.GINI, ${jWb}`;
    if (jWb !== datenstand) markiert.push("gini");
  } else {
    gini = wert("gini", hand.ersatz.gini);
    giniQuelle = markiert.includes("gini (Ersatz)") ? "Ersatzwert aus der Handdatei" : `Weltbank SI.POV.GINI, ${jWb}`;
  }

  const bev = wert("bev");
  const bevM = wert("bevM", bev / 2),
    bevF = wert("bevF", bev / 2);
  const roh = GRUPPEN.map(
    (g) =>
      (wert(`alterM_${g}`) * bevM + wert(`alterF_${g}`) * bevF) / 100 / bev,
  );
  const summe = roh.reduce((a, b) => a + b, 0);
  const e = hand.ersatz;

  const start = {
    ...hand.werte,
    bev,
    altersanteile: roh.map((x) => x / summe),
    tfr: wert("tfr", e.tfr),
    lebenserwartung: wert("lebenserwartung", e.lebenserwartung),
    bip: wert("bip"),
    alq: wert("alq"),
    investQuote: wert("investQuote", e.investQuote),
    exporte: wert("exporte", e.exporte),
    importe: wert("importe", e.importe),
    importquote: wert("importquote", e.importquote),
    co2Mt: wert("co2Mt", e.co2Mt),
    gini,
    schuldQuote: wert("schuldQuote"),
    inflation: wert("inflation"),
    einnahmen: wert("einnahmen", e.einnahmen),
    ausgaben: wert("ausgaben", e.ausgaben),
    privatschuld: auto.reihen.privatschuld
      ? wert("privatschuld", e.privatschuld)
      : wert("privatkredit", e.privatschuld),
    rendite: wert("rendite", e.rendite),
  } as Startwerte;

  const geschaetzt = schaetzung ? uebernimmSchaetzung(schaetzung, hand, start, datenstand) : undefined;
  // Spec 13.2: Start der Kreditlücke, nur im Datenstand-Jahr.
  if (schaetzung?.kredit?.jahr === datenstand) {
    start.kreditTrend0 = schaetzung.kredit.trend;
    start.kreditSteigung0 = schaetzung.kredit.steigung;
  }

  // Spec 13.6: Bankwerte. Handwert geht vor, dann der letzte Wert der Reihe bis zum Startjahr (die
  // Bankreihen enden teils früher), dann der Ersatzwert. Fehlt einer der sieben, rechnet der Baustein nicht.
  const letzter = (schluessel: string): number | undefined => {
    const r = auto.reihen[schluessel];
    const j = letztesJahr(r, datenstand);
    return j === undefined ? undefined : r![j];
  };
  const bankKredit = auto.reihen.bankKredit ?? {};
  const kreditGesamt = auto.reihen.kreditGesamt ?? {};
  const jAnteil = Math.max(...Object.keys(bankKredit).map(Number).filter((j) => j <= datenstand && kreditGesamt[j] > 0), -Infinity);
  // Bewertung: Preis-Einkommen-Verhältnis des Startjahres gegen sein Mittel bis zum Startjahr. Für heute
  // ist das der Wert der OECD; für ein früheres Startjahr (Rückblick) ohne Wissen aus der Zukunft.
  const pe = auto.reihen.hausEinkommen ?? {};
  const peJahre = Object.keys(pe).map(Number).filter((j) => j <= datenstand);
  const peLetztes = letztesJahr(pe, datenstand);
  const bewertung =
    peLetztes === undefined
      ? undefined
      : 100 * (pe[peLetztes] / (peJahre.reduce((a, j) => a + pe[j], 0) / peJahre.length) - 1);
  const bank: Record<string, number | undefined> = {
    bankKapital0: start.bankKapital0 ?? letzter("bankKapital") ?? e.bankKapital0,
    npl0: start.npl0 ?? letzter("npl") ?? e.npl0,
    // Die Bilanzreihe (GFDD) endet für manche Länder weit vor dem Startjahr; älter als 6 Jahre gilt nicht.
    bankBilanz0:
      start.bankBilanz0 ??
      (datenstand - (letztesJahr(auto.reihen.bankBilanz, datenstand) ?? -Infinity) <= 6 ? letzter("bankBilanz") : undefined) ??
      e.bankBilanz0,
    bankKreditAnteil:
      start.bankKreditAnteil ??
      (Number.isFinite(jAnteil) ? Math.min(1, bankKredit[jAnteil] / kreditGesamt[jAnteil]) : e.bankKreditAnteil),
    hausBewertung0: start.hausBewertung0 ?? bewertung ?? e.hausBewertung0,
  };
  for (const [k, v] of Object.entries(bank)) if (v !== undefined) (start as unknown as Record<string, number>)[k] = v;
  if (schaetzung?.haus?.jahr === datenstand) {
    start.hausTrend0 = schaetzung.haus.trend;
    start.hausSteigung0 = schaetzung.haus.steigung;
    start.hausWachstum0 = schaetzung.haus.wachstum;
  }

  const land: Landesdaten = {
    code: hand.code,
    name: hand.name,
    datenstand,
    qualitaet: hand.qualitaet,
    grund: { ...hand.grund },
    standards: { ...hand.standards },
    start,
    markiert,
    // Für den Gini steht die genutzte Quelle mit Jahr; die Rohreihe der OECD erscheint nicht eigens.
    quellen: Object.fromEntries(Object.entries({ ...auto.quellen, gini: giniQuelle }).filter(([k]) => k !== "giniOecd")),
    waehrung: hand.waehrung ?? { symbol: "€", kurs: 1 },
    ...(hand.hinweis ? { hinweis: hand.hinweis } : {}),
    ...(hand.politik ? { politik: { ...hand.politik } } : {}),
    ...(geschaetzt ? { schaetzung: geschaetzt } : {}),
  };
  // Ohne Handwert liegt die Entschuldungs-Schwelle 4 Pp. über dem Schuldendienst im Startjahr.
  if (hand.werte.dsrSchwelle === undefined) {
    const st = land.start;
    st.dsrSchwelle = st.privatschuld * ((st.leitzins + wirkstaerke("privat.zinsaufschlag", land)) / 100 + wirkstaerke("privat.tilgung", land)) + 4;
  }
  // Rest der Leistungsbilanz (Einkommen, Übertragungen), damit das Startjahr den Ist-Wert trifft.
  const lbIst = auto.reihen.leistungsbilanz?.[datenstand];
  const st = land.start;
  st.lbRest = hand.werte.lbRest ?? (lbIst === undefined ? 0
    : lbIst - (st.exporte - st.importe + (wirkstaerke("handel.nfaRendite", land) / 100) * st.nfa));
  land.standards = kalibriereStandards(land);
  return land;
}
