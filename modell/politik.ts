// Politik reagiert (Spec 13.10, neu gefasst in 13.13): Die Regierung antwortet auf lange Schwäche und
// einen engen Haushalt. An jedem Auslöser entsteht ein Entscheidungspunkt mit drei Optionen
// (Machterhalt, Richtung, Unbequem); eine Regel wählt vor, die Nutzerin kann umschalten (sz.wahl).
// Die Reaktion schreibt das Szenario nicht um, sondern legt je Jahr Abweichungen über die Stellwerte
// (Einheit der Stellschraube), die der Kontext in k.w addiert.
import {
  anhaltend,
  eng,
  engSchritt,
  imBereich,
  istWahljahr,
  naechstesWahljahr,
  schwach,
  schwaecheOption,
  struktur,
  vorwahl,
  wirkungIm,
  type Lagebild,
  type Wirkung,
} from "./eingriffe";
import { PAKETE, pText } from "./pakete";
import { MOTIVE, type Ausloeser, type Motiv, type PolitikEreignis, type Struktur } from "./politik-modus";
import { t } from "./sprache";
import { eintrag } from "./verzeichnis";
import type { Kontext, Szenario, Zustand } from "./typen";

export { POLITIK_STANDARD, politikAn, type PolitikEreignis, type PolitikModus, type Ueberlagerung } from "./politik-modus";
export { anhaltend, eng, konsolidiere, schwach } from "./eingriffe";

export interface PolitikStand {
  schwachJahre: boolean[]; // je Jahr seit dem Start: schwach?
  engSeit: number;
  nichtEng: number;
  letzterPunkt: Record<Ausloeser, number>; // Jahr des letzten Entscheidungspunkts, 0 = keiner
  wirkungen: Wirkung[]; // aus Schwäche-Optionen und Sperrklinke
  engMotiv: Motiv | null; // laufende Phase bei engem Haushalt
  engBis: number; // Machterhalt: letztes Jahr der Umgehung
  kuerzung: Record<string, number>; // kumulierte Abweichung je Stellschraube (enger Haushalt)
  kuerzBasis: Record<string, number>; // Wert je Ausgabenbereich beim ersten Sparjahr
  schockAusgabenMax: number; // Höchstwert der Schock-Ausgaben im laufenden Schock
  letztesProgramm: number; // Jahr des letzten Großprogramms, 0 = keins
  risikoBis: number; // letztes Jahr mit politischem Risiko, 0 = keins
}

export function neuerStand(): PolitikStand {
  return {
    schwachJahre: [],
    engSeit: 0,
    nichtEng: 0,
    letzterPunkt: { schwaeche: 0, eng: 0 },
    wirkungen: [],
    engMotiv: null,
    engBis: 0,
    kuerzung: {},
    kuerzBasis: {},
    schockAusgabenMax: 0,
    letztesProgramm: 0,
    risikoBis: 0,
  };
}

// Schlüssel eines Entscheidungspunkts in sz.wahl und im Link.
export const schluessel = (jahr: number, a: Ausloeser): string => `${jahr}-${a}`;

// „n Jahre in Folge“ heißt für die Schwäche überall: mindestens n der letzten n + NACHSICHT Jahre, auf
// der Hauptlinie wie in den Zufallsläufen (Spec 13.13, behebt M37). Der enge Haushalt bleibt wörtlich:
// Spielraum und Zinslast springen nicht.
export const NACHSICHT = 2;

const strukturVon = (l: Lagebild): Struktur => struktur(l.k.land, l.sz);

// Großprogramme nach der Struktur des Landes, benannt nach dem, was sie tun.
const PROGRAMM: Record<Struktur, string> = {
  sozial: "höhere Renten und Familienleistungen",
  energie: "Zuschuss für Industriestrom",
  handel: "höhere Zölle",
  markt: "Steuersenkung",
};

const addiere = (u: Record<string, number>, id: string, x: number) => {
  if (x !== 0) u[id] = (u[id] ?? 0) + x;
};

// Reaktion für das Jahr k.jahr aus dem Vorjahr. Gibt die Überlagerung dieses Jahres zurück und
// hängt Ereignisse an neu.politik. k enthält die Überlagerungen der Vorjahre, nicht die dieses Jahres.
export function politikSchritt(
  stand: PolitikStand,
  verlauf: Zustand[],
  neu: Zustand,
  k: Kontext,
  sz: Szenario,
): Record<string, number> {
  const alt = verlauf[verlauf.length - 1];
  const j = k.jahr;
  const u: Record<string, number> = {};
  // Wirksam heißt: Szenario plus bleibende Eingriffe (begonnene Dauerwirkungen voll, Kürzungen), ohne
  // befristete Pakete und ohne noch nicht fällige Rücknahmen.
  // Im Bereich der Stellschraube gehalten wie im Kontext (wBei): Was jenseits des Rands liegt, wirkt nicht.
  const wirksam = (id: string) => {
    let x = k.w(id) + (stand.kuerzung[id] ?? 0);
    for (const w of stand.wirkungen) if (w.id === id && w.bis === undefined && w.ab <= j) x += w.delta;
    const b = eintrag(id).bereich;
    return b ? Math.min(b[1], Math.max(b[0], x)) : x;
  };
  const l: Lagebild = { jahr: j, alt, schwachJahre: stand.schwachJahre, k, sz, ...(stand.letztesProgramm ? { letztesProgramm: stand.letztesProgramm } : {}) };
  // Ein Entscheidungspunkt je Auslöser und Legislatur: Der nächste ist im ersten Jahr nach der nächsten
  // Wahl möglich (neue Regierungen entscheiden früh). Ohne Wahltakt: nach punktAbstand Jahren.
  const abstandOk = (a: Ausloeser) => {
    const letzter = stand.letzterPunkt[a];
    if (letzter === 0) return true;
    const wahl = naechstesWahljahr(k.land, letzter + 1);
    return j >= (wahl === null ? letzter + k.p("politik.punktAbstand") : wahl + 1);
  };
  // Die Wahl der Nutzerin gilt nur an einem Punkt, der in diesem Jahr wirklich entsteht.
  const gewaehlt = (a: Ausloeser): Motiv | undefined => {
    const m = sz.wahl?.[schluessel(j, a)];
    return m !== undefined && MOTIVE.includes(m) ? m : undefined;
  };

  // 1. Auslöser zählen.
  stand.schwachJahre.push(schwach(alt, k));
  if (eng(alt, k)) {
    stand.engSeit++;
    stand.nichtEng = 0;
  } else {
    stand.engSeit = 0;
    stand.nichtEng++;
    if (stand.nichtEng >= k.p("politik.abklingJahre")) stand.engMotiv = null;
  }
  // Die Umgehung der Schuldenregel endet mit der Legislatur.
  if (stand.engMotiv === "macht" && j > stand.engBis) stand.engMotiv = null;

  // 2. Entscheidungspunkt Schwäche: sobald sie anhält, höchstens einer je punktAbstand Jahre.
  if (anhaltend(stand.schwachJahre, k.p("politik.schwaecheJahre"), NACHSICHT) && abstandOk("schwaeche")) {
    const regel = vorwahl("schwaeche", l, wirksam);
    let motiv = gewaehlt("schwaeche") ?? regel;
    let option = schwaecheOption(motiv, l, wirksam);
    // Gewählte Option nicht möglich (hoher Risikoaufschlag, Paket ausgeschöpft): Es gilt die Regel.
    if (!option) {
      motiv = regel;
      option = schwaecheOption(regel, l, wirksam);
    }
    if (option) {
      stand.wirkungen.push(...option.wirkungen);
      stand.letzterPunkt.schwaeche = j;
      if (motiv === "richtung") stand.letztesProgramm = j;
      neu.politik.push({
        jahr: j,
        art: "entscheidung",
        ausloeser: "schwaeche",
        motiv,
        vorwahl: regel,
        ...(option.struktur ? { struktur: option.struktur } : {}),
        ...(option.paket ? { paket: option.paket } : {}),
      });
    }
  }

  // 3. Entscheidungspunkt enger Haushalt. Die Option läuft, solange der Haushalt eng ist; ihre
  // Kürzungen und Steuern bleiben nach dem Ende der Phase bestehen. Hält die Enge an, entscheidet die
  // nächste Legislatur neu (auch wenn die laufende Option erschöpft ist); die Umgehung der Schuldenregel
  // endet ohnehin mit der Wahl.
  if ((stand.engMotiv === null || stand.engMotiv !== "macht") && stand.engSeit >= k.p("politik.engJahre") && abstandOk("eng")) {
    const regel = vorwahl("eng", l, wirksam);
    const motiv = gewaehlt("eng") ?? regel;
    stand.engMotiv = motiv;
    // Die Umgehung hält bis zur nächsten Wahl; ohne Wahltakt punktAbstand Jahre.
    stand.engBis = motiv === "macht" ? (naechstesWahljahr(k.land, j + 1) ?? j + k.p("politik.punktAbstand") - 1) : 0;
    stand.letzterPunkt.eng = j;
    neu.politik.push({
      jahr: j,
      art: "entscheidung",
      ausloeser: "eng",
      motiv,
      vorwahl: regel,
      ...(motiv === "richtung" ? { struktur: strukturVon(l) } : {}),
    });
  }
  if (stand.engMotiv && eng(alt, k)) neu.politikKonsol += engSchritt(stand.engMotiv, stand, l, wirksam);
  // Machterhalt umgeht die Schuldenregel: Sie wirkt in dieser Zeit nur halb.
  if (stand.engMotiv === "macht") addiere(u, "staat.schuldenreaktion", -0.5 * wirksam("staat.schuldenreaktion"));
  for (const [id, x] of Object.entries(stand.kuerzung)) addiere(u, id, x);

  // 4. Wahljahr: etwas großzügiger (Verzerrung 5; Standard 0, siehe Prüfung Wahltakt).
  if (istWahljahr(k.land, j)) addiere(u, "staat.uebrige", k.p("politik.wahljahr") * (k.land.politik?.takt ?? 0));

  // 5. Sperrklinke bei Schocks: Krisenausgaben fallen nach dem Schock nicht ganz zurück (Verzerrung 3).
  if (k.schock.ausgaben > 0) stand.schockAusgabenMax = Math.max(stand.schockAusgabenMax, k.schock.ausgaben);
  else if (stand.schockAusgabenMax > 0) {
    // Nur so weit, wie die Stellschraube Platz hat (W1 der Prüfung).
    const bleibt = imBereich("staat.uebrige", k.p("politik.sperrklinke") * stand.schockAusgabenMax, wirksam);
    if (bleibt > 0) stand.wirkungen.push({ id: "staat.uebrige", delta: bleibt, ab: j, gleit: 1 });
    stand.schockAusgabenMax = 0;
  }

  // 6. Wirkungen der Schwäche-Optionen und der Sperrklinke in diesem Jahr.
  stand.wirkungen = stand.wirkungen.filter((w) => w.bis === undefined || w.bis >= j);
  for (const w of stand.wirkungen) addiere(u, w.id, wirkungIm(w, j));
  if (stand.wirkungen.some((w) => w.ruecknahme && w.ab === j)) neu.politik.push({ jahr: j, art: "ruecknahme" });

  // 7. Politisches Risiko (umstritten, Standard aus): Nach einer Krise zersplittern Regierungen.
  const risikoAn = k.w("politik.risiko") >= 0.5;
  if (risikoAn && alt.lage === "krise") {
    if (j > stand.risikoBis) neu.politik.push({ jahr: j, art: "risiko" });
    stand.risikoBis = j + k.p("politik.risikoJahre") - 1;
  }
  neu.politikAufschlag = risikoAn && j <= stand.risikoBis ? k.p("politik.risikoAufschlag") : 0;

  return u;
}

// Satz für Wetterband und Erzählung. Keine Parteien, keine Wahlausgänge, keine Richtungsnamen (Spec
// Abschnitt 2 und 13.13): Die Optionen heißen nach dem, was sie tun.
export function ereignisText(e: PolitikEreignis): string {
  const jahr = e.jahr;
  if (e.art === "risiko") return t("{jahr}: Regierungsbildung schwierig, Risikoaufschlag steigt", { jahr });
  if (e.art === "ruecknahme") return t("{jahr}: Ein Teil der Reform wird zurückgenommen", { jahr });
  if (e.ausloeser === "schwaeche") {
    if (e.motiv === "macht") return t("{jahr}: Regierung stützt die Konjunktur mit Ausgaben", { jahr });
    if (e.motiv === "richtung")
      return t("{jahr}: Regierung legt ein großes Programm auf: {programm}", { jahr, programm: t(PROGRAMM[e.struktur ?? "markt"]) });
    const p = PAKETE.find((x) => x.id === e.paket);
    return t("{jahr}: Regierung beschließt einen Teil von „{paket}“", { jahr, paket: p ? pText(p, "titel") : (e.paket ?? "") });
  }
  if (e.motiv === "macht") return t("{jahr}: Regierung umgeht die Schuldenregel und schiebt Investitionen auf", { jahr });
  if (e.motiv === "richtung")
    return e.struktur === "sozial"
      ? t("{jahr}: Regierung erhöht Steuern auf Kapital und Unternehmen", { jahr })
      : t("{jahr}: Regierung kürzt Sozialleistungen", { jahr });
  return t("{jahr}: Regierung beginnt zu sparen", { jahr });
}
