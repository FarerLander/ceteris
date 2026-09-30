// Schätzdatei je Land (Spec 13.1). Läuft nur im Datenskript.
import { standardWert, wirkstaerke } from "../../modell/kontext";
import type { Schaetzwert } from "../../modell/typen";
import { KREDIT_LAMBDA } from "../../modell/fruehwarnung";
import { WELT_STANDARD } from "../../modell/welt";
import { hp } from "./hp";
import { baueLand } from "../land";
import type { AutoDatei, HandDatei, Reihe, SchaetzDatei } from "../typen";
import { schaetze, type Punkt } from "./modell";
import { letztesJahr, reihenAus, type Reihen } from "./reihen";
import { startwerte } from "./startwerte";

export const METHODE =
  "Kalman-Filter und -Glätter, Zustandsraummodell nach Laubach/Williams und OECD-NAIRU (Spec 13.1)";
const VON = 2000;
const MIN_JAHRE = 10;
// Energie- und Lieferkettenschock: Die Inflation dieser Jahre ist Angebot, nicht Auslastung. Der Filter
// kennt den Energiepreis-Kanal des Modells nicht und läse sie sonst als Überhitzung (NAIRU und Lücke zu hoch).
// Nur die Messwerte fehlen; Erwartung und Realzins bilden sich wie im Modell aus der Ist-Inflation.
export const ANGEBOTSSCHOCK = [2021, 2022, 2023];

const r3 = (x: number) => Math.round(x * 1000) / 1000;
const rund = (p: Punkt[]): Punkt[] =>
  p.map((x) => ({ jahr: x.jahr, wert: r3(x.wert), band: r3(x.band) }));
const rundW = (w: Schaetzwert): Schaetzwert => ({
  ...w,
  wert: r3(w.wert),
  band: r3(w.band),
  ...(w.hp !== undefined ? { hp: r3(w.hp) } : {}),
});

// Spec 13.2: Start der Kreditlücke. Einseitiger HP (λ wie im Modell) über die Privatschuld bis zum
// Startjahr. Fehlen die letzten Jahre, bleibt der Trend beim letzten Datenjahr, denn baueLand übernimmt
// auch das Niveau von dort; sonst meinten Niveau und Trend verschiedene Jahre (Befund der Prüfung).
export function kreditStart(auto: AutoDatei, jahr: number): { jahr: number; trend: number; steigung: number } | undefined {
  const r = auto.reihen.privatschuld ?? auto.reihen.privatkredit ?? {};
  const jahre = Object.keys(r).map(Number).filter((j) => j <= jahr).sort((x, y) => x - y);
  if (jahre.length < MIN_JAHRE) return undefined;
  const trend = hp(jahre.map((j) => r[j]), KREDIT_LAMBDA);
  const n = trend.length;
  const steigung = trend[n - 1] - trend[n - 2];
  return { jahr, trend: trend[n - 1], steigung };
}

// Spec 13.6: Start der Hauspreislücke. Derselbe Filter auf 100·ln(realer Hauspreis). Das Modell führt den
// Preis als Index mit Startjahr = 100; der Trend steht deshalb relativ zum Niveau des Startjahres.
export function hausStart(auto: AutoDatei, jahr: number): { jahr: number; trend: number; steigung: number; wachstum: number } | undefined {
  const r = auto.reihen.hauspreisReal ?? {};
  const jahre = Object.keys(r).map(Number).filter((j) => j <= jahr).sort((x, y) => x - y);
  if (jahre.length < MIN_JAHRE || r[jahr] === undefined || r[jahr - 1] === undefined) return undefined;
  const ln = jahre.map((j) => 100 * Math.log(r[j]));
  const trend = hp(ln, KREDIT_LAMBDA);
  const n = trend.length;
  return { jahr, trend: trend[n - 1] - ln[n - 1], steigung: trend[n - 1] - trend[n - 2], wachstum: ln[n - 1] - ln[n - 2] };
}

export function bereinigeSchock(r: Reihen): Reihen {
  return { ...r, infl: r.infl.map((v, i) => (ANGEBOTSSCHOCK.includes(r.jahre[i]) ? null : v)) };
}

export function schaetzDatei(auto: AutoDatei, hand: HandDatei): SchaetzDatei {
  const kopf = { code: auto.code, stand: auto.abgerufen, methode: METHODE };
  let jahr = 0;
  const kredit = (j: number) => {
    const k = j ? kreditStart(auto, j) : undefined;
    return k ? { kredit: { jahr: k.jahr, trend: r3(k.trend), steigung: r3(k.steigung) } } : {};
  };
  const haus = (j: number) => {
    const x = j ? hausStart(auto, j) : undefined;
    return x ? { haus: { jahr: x.jahr, trend: r3(x.trend), steigung: r3(x.steigung), wachstum: r3(x.wachstum) } } : {};
  };
  try {
    const land = baueLand(auto, hand);
    jahr = land.datenstand;
    const p = (id: string) => wirkstaerke(id, land);
    const reihen = bereinigeSchock(reihenAus(auto, VON, Math.min(jahr, letztesJahr(auto))));
    if (reihen.jahre.length < MIN_JAHRE) throw new Error(`zu wenige Jahre (${reihen.jahre.length})`);
    const s = schaetze(reihen, {
      okun: p("wachstum.okun"),
      phillips: p("geld.phillips"),
      persistenz: p("wachstum.lueckePersistenz"),
      zinsWirkung: p("wachstum.zinsWirkung"),
      anker: p("geld.anker"),
      ziel:
        land.grund.regime === "euro"
          ? WELT_STANDARD.euroInflation
          : standardWert("geld.inflationsziel", land),
    });
    return {
      ...kopf,
      jahr,
      kappa: r3(s.kappa),
      werte: startwerte(s, reihen, p("wachstum.alpha")).map(rundW),
      ...kredit(jahr),
      ...haus(jahr),
      reihen: {
        g: rund(s.g),
        luecke: rund(s.luecke),
        nairu: rund(s.nairu),
        rStern: s.rStern ? rund(s.rStern) : null,
      },
    };
  } catch (fehler) {
    return {
      ...kopf,
      jahr,
      kappa: 0,
      werte: [],
      reihen: { g: [], luecke: [], nairu: [], rStern: null },
      ...kredit(jahr),
      ...haus(jahr),
      fehler: fehler instanceof Error ? fehler.message : String(fehler),
    };
  }
}

// Nur die Reihe kurzzins ergänzen; alles andere bleibt byte-gleich (Muster --nur-konsens).
export function ergaenzeKurzzins(
  alt: AutoDatei,
  reihe: Reihe,
  quelle: string,
): AutoDatei {
  return {
    ...alt,
    reihen: { ...alt.reihen, kurzzins: reihe },
    quellen: { ...alt.quellen, kurzzins: quelle },
  };
}

// Nur die Bank- und Hauspreisreihen ergänzen (Spec 13.6); alles andere bleibt byte-gleich.
export function ergaenzeBanken(
  alt: AutoDatei,
  reihen: Record<string, Reihe>,
  quellen: Record<string, string>,
): AutoDatei {
  return {
    ...alt,
    reihen: { ...alt.reihen, ...reihen },
    quellen: { ...alt.quellen, ...quellen },
  };
}
