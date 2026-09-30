import { kalibriereStandards } from "../modell/start";
import type { Landesdaten, Szenario, WeltId } from "../modell/typen";
import { altersverteilung, teileAuf } from "../modell/alter";
import { baueLand } from "./land";
import type { AutoDatei, HandDatei, HistorieDatei } from "./typen";

// Baut Land (Startjahr = hist.start) und Szenario (tatsächliche Politik, Weltpfade, Schocks) für den Rückblick-Test.
// Die heutige Schwelle passt nicht zum Startjahr: ohne eigenen Wert berechnet baueLand sie neu.
function ohneSchwelle(w: HandDatei["werte"], entfernen: boolean): HandDatei["werte"] {
  if (!entfernen) return w;
  const { dsrSchwelle: _weg, ...rest } = w;
  return rest;
}

export function baueRueckblick(
  auto: AutoDatei,
  hand: HandDatei,
  hist: HistorieDatei,
  heute = new Date(),
): { land: Landesdaten; sz: Szenario; bis: number } {
  const bis = baueLand(auto, hand, heute).datenstand;
  const handDamals: HandDatei = {
    ...hand,
    standards: { ...hand.standards, ...hist.standards },
    // Der Erwerbsquoten-Trend gilt nur nach vorn; der Rückblick hat einen eigenen Pfad.
    werte: ohneSchwelle({ ...hand.werte, erwerbsquoteTrend: 0, ...hist.werte }, hist.werte.dsrSchwelle === undefined),
  };
  const land = baueLand(auto, handDamals, heute, hist.start);
  // Werte der Historie gehen vor automatischen Reihen (z. B. Ausgaben 2000 ohne UMTS-Erlöse).
  Object.assign(land.start, hist.werte);
  if (hist.politik) land.politik = { ...hist.politik };
  // Der Gini des Startjahres ist ein Handwert der Historie (Spec 13.13); die Quelle wandert mit.
  if (hist.werte.gini !== undefined && hist.quellen.gini) land.quellen = { ...land.quellen, gini: hist.quellen.gini };
  land.standards = kalibriereStandards(land);
  // Erwerbsquote im Startjahr aus der Ist-Erwerbsbevölkerung ableiten (bezogen auf die Jahrgänge bis zum
  // Rentenalter des Modells); der historische Pfad wird im selben Verhältnis mitgeführt.
  const lfIst = auto.reihen.erwerbspersonen?.[hist.start];
  let eqFaktor = 1;
  if (lfIst !== undefined) {
    const alter = altersverteilung(land.start.bev, land.start.altersanteile);
    const ef = teileAuf(alter, land.standards["rente.alter"] ?? 67).erwerbsfaehige;
    const eqAlt = land.start.erwerbsquote;
    land.start.erwerbsquote = lfIst / ef;
    eqFaktor = land.start.erwerbsquote / eqAlt;
    land.standards = kalibriereStandards(land);
  }
  const stell = Object.fromEntries(
    Object.entries(hist.stell).map(([id, paare]) => [
      id,
      paare.map(([ab, wert]) => ({ ab, wert })),
    ]),
  );
  const welt = Object.fromEntries(
    Object.entries(hist.welt).map(([id, jahre]) => [
      id,
      Object.entries(jahre ?? {}).map(([j, wert]) => ({ ab: Number(j), wert })),
    ]),
  ) as Szenario["welt"];
  // Demografie im Rückblick aus echten Reihen: Lebenserwartung als Jahresänderung, Geburtenrate als Wert.
  const le = auto.reihen.lebenserwartung ?? {};
  const tfr = auto.reihen.tfr ?? {};
  const jahre = Array.from({ length: bis - hist.start }, (_, i) => hist.start + 1 + i);
  const leJahre = jahre.filter((j) => le[j] !== undefined && le[j - 1] !== undefined);
  if (leJahre.length) stell["demo.lebenserwartungTrend"] = leJahre.map((j) => ({ ab: j, wert: le[j] - le[j - 1] }));
  const tfrJahre = jahre.filter((j) => tfr[j] !== undefined);
  if (tfrJahre.length) stell["demo.geburtenrate"] = tfrJahre.map((j) => ({ ab: j, wert: tfr[j] }));
  for (const [id, paare] of Object.entries(hist.stellRelativ ?? {})) {
    const basis = land.standards[id] ?? 0;
    stell[id] = paare.map(([ab, delta]) => ({ ab, wert: basis + delta }));
  }
  if (stell["arbeit.erwerbsquote"]) {
    stell["arbeit.erwerbsquote"] = (stell["arbeit.erwerbsquote"] as { ab: number; wert: number }[]).map((x) => ({ ab: x.ab, wert: x.wert * eqFaktor }));
  }
  const sz: Szenario = {
    jahre: bis - hist.start + 1,
    // Tatsächliche Politik steht als Pfad im Szenario; die Regierung reagiert nicht zusätzlich (13.10).
    grund: { ...land.grund, politik: "fest" },
    stell,
    schocks: hist.schocks.map((s, i) => ({
      id: i + 1,
      art: s.art,
      jahr: s.jahr,
      staerke: s.staerke,
      dauer: 1,
    })),
    aus: [],
    welt,
  };
  return { land, sz, bis };
}

export type { WeltId };

// Alle Ist-Reihen für den Rückblick: automatische Reihen plus Handreihen aus der Historie-Datei.
export function istReihen(auto: AutoDatei, hist?: HistorieDatei): Record<string, Record<number, number>> {
  const aus: Record<string, Record<number, number>> = { ...auto.reihen };
  for (const [k, jahre] of Object.entries(hist?.ist ?? {})) {
    aus[k] = Object.fromEntries(Object.entries(jahre).map(([j, w]) => [Number(j), w]));
  }
  return aus;
}
