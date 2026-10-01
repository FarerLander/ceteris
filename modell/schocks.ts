import { tk } from "./sprache";
import type { Schock, SchockArt, SchockKanal, SchockWirkung } from "./typen";

// Wirkung pro Jahr nach Schockbeginn. Einheiten: energie % Preisaufschlag auf Öl/Gas/Kohle,
// inflation Pp., luecke % BIP, gA Anteil Produktivitätswachstum, alq Pp., ausgaben % BIP,
// beschaeftigte Mio., flucht 1 = Flucht in sichere Häfen, aufschlag Pp., krise 1/0,
// zuwanderung Mio. Flüchtlinge, export Anteil der Exporte, rohstoff Anteil der Rohstoffexporte.
// energieLuecke: Der Nachfrageschaden kommt vom teuren Energieimport und skaliert mit dem Nettoimport des Landes.
export const SCHOCKS: Record<
  SchockArt,
  { name: string; txt: string; wirkung: Partial<Record<SchockKanal, number[]>>; energieLuecke?: true }
> = {
  oel: {
    name: "Ölpreisschock",
    txt: "Öl und Gas werden für zwei Jahre deutlich teurer.",
    wirkung: { energie: [70, 30], inflation: [2.5, 0.8], luecke: [-1, -0.5] },
    energieLuecke: true,
  },
  krise: {
    name: "Finanzkrise",
    txt: "Banken und Kredit stocken, Kapital flieht in sichere Häfen.",
    wirkung: {
      luecke: [-4, -1.5],
      alq: [1, 0.5],
      flucht: [1],
      krise: [1],
      gA: [-0.005],
    },
  },
  pandemie: {
    name: "Pandemie",
    txt: "Einbruch im ersten Jahr, schnelle Erholung, Hilfspakete, danach Lieferketten-Inflation.",
    wirkung: {
      luecke: [-5, 1.5],
      alq: [1, 0.5],
      ausgaben: [4, 2],
      inflation: [-0.5, 2.5],
      krise: [1],
    },
  },
  proxy: {
    name: "Stellvertreterkrieg",
    txt: "Krieg in der Nachbarschaft ohne eigene Beteiligung: Energieschock, Sanktionen, Aufrüstung, Flüchtlinge.",
    wirkung: {
      energie: [60, 35, 15],
      inflation: [2, 1, 0.3],
      luecke: [-1, -0.5],
      ausgaben: [2.1, 2.1, 1.8, 1, 1],
      zuwanderung: [0.9],
    },
    energieLuecke: true,
  },
  krieg: {
    name: "Krieg mit Beteiligung",
    txt: "Eigene Kriegsbeteiligung: Rüstung stark hoch, Mobilisierung zieht Arbeitskräfte ab, danach Wiederaufbau.",
    wirkung: {
      gA: [-0.03, -0.01, 0, 0.01, 0.01, 0.01],
      beschaeftigte: [-1.5, -2, -1],
      energie: [80, 60, 30],
      inflation: [4, 3, 1.5],
      ausgaben: [6, 6, 5, 3, 2],
      aufschlag: [2, 2, 1],
      krise: [1, 1],
    },
  },
  handel: {
    name: "Handelskrieg",
    txt: "Zölle auf Exporte, Hauptabnehmer kaufen weniger.",
    wirkung: {
      export: [-0.08, -0.06, -0.03],
      inflation: [0.8, 0.6, 0.2],
      luecke: [-1, -0.8, -0.3],
    },
  },
  sanktionen: {
    name: "Lieferstopp Energie",
    txt: "Ein Hauptlieferant stoppt Gas und Öl.",
    wirkung: {
      energie: [90, 50, 20],
      inflation: [3, 1.5, 0.5],
      luecke: [-1.5, -0.5],
    },
    energieLuecke: true,
  },
  rohstoffsanktion: {
    name: "Sanktionen gegen Rohstoffexporte",
    txt: "Abnehmer kaufen weniger Öl, Gas und Metalle.",
    wirkung: { rohstoff: [-0.3, -0.25, -0.2, -0.1] },
  },
};

export const KANAELE: SchockKanal[] = [
  "energie",
  "inflation",
  "luecke",
  "gA",
  "alq",
  "ausgaben",
  "beschaeftigte",
  "flucht",
  "aufschlag",
  "krise",
  "zuwanderung",
  "export",
  "rohstoff",
];

export function leereWirkung(): SchockWirkung {
  return Object.fromEntries(KANAELE.map((k) => [k, 0])) as SchockWirkung;
}

// energieFaktor: Nachfrageschaden der Energieschocks relativ zu einem Land wie Deutschland (M36).
export function schockWirkung(schocks: Schock[], jahr: number, energieFaktor = 1): SchockWirkung {
  const w = leereWirkung();
  for (const s of schocks) {
    const seit = jahr - s.jahr;
    if (seit < 0) continue;
    const idx = Math.floor(seit / Math.max(0.25, s.dauer));
    const def = SCHOCKS[s.art].wirkung;
    const faktor = SCHOCKS[s.art].energieLuecke ? energieFaktor : 1;
    for (const kanal of KANAELE) {
      const reihe = def[kanal];
      if (!reihe || idx >= reihe.length) continue;
      w[kanal] += kanal === "krise" ? reihe[idx] : reihe[idx] * s.staerke * (kanal === "luecke" ? faktor : 1);
    }
  }
  w.krise = w.krise > 0 ? 1 : 0;
  return w;
}

// Angezeigte Texte eines Schocks in der gewählten Sprache (Spec 12c).
export const sName = (a: SchockArt) => tk(`s:${a}:name`, SCHOCKS[a].name);
export const sText = (a: SchockArt) => tk(`s:${a}:txt`, SCHOCKS[a].txt);

