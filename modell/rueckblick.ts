import type { Zustand } from "./typen";

// Treffsicherheit im Rückblick nach Spec 11: Band = 1 Standardabweichung der Ist-Werte um ihren Trend,
// Vergleichsmodell „alles bleibt, wie es ist“, harte Hürde Theil's U < 1, Ziel ⅔ der Jahre im Band.

export type Vergleichsart = "konstant" | "wachstum";

export interface RueckReihe {
  id: string;
  name: string;
  einheit: string;
  dez: number;
  modell(z: Zustand): number;
  ist: string; // Schlüssel der Ist-Reihe
  vergleich: Vergleichsart;
}

export const RUECK_REIHEN: RueckReihe[] = [
  {
    id: "wachstum",
    name: "BIP-Wachstum real",
    einheit: "%",
    dez: 1,
    modell: (z) => z.wachstum * 100,
    ist: "wachstumReal",
    vergleich: "konstant",
  },
  {
    id: "inflation",
    name: "Inflation",
    einheit: "%",
    dez: 1,
    modell: (z) => z.inflation,
    ist: "inflation",
    vergleich: "konstant",
  },
  {
    id: "alq",
    name: "Arbeitslosenquote",
    einheit: "%",
    dez: 1,
    modell: (z) => z.alq,
    ist: "alq",
    vergleich: "konstant",
  },
  {
    id: "schuldQuote",
    name: "Staatsschuldenquote",
    einheit: "% BIP",
    dez: 0,
    modell: (z) => z.schuldQuote,
    ist: "schuldQuote",
    vergleich: "konstant",
  },
  {
    id: "bev",
    name: "Bevölkerung",
    einheit: "Mio.",
    dez: 1,
    modell: (z) => z.bev,
    ist: "bev",
    vergleich: "wachstum",
  },
  {
    id: "erwerbspersonen",
    name: "Erwerbsbevölkerung",
    einheit: "Mio.",
    dez: 1,
    modell: (z) => z.erwerbspersonen,
    ist: "erwerbspersonen",
    vergleich: "wachstum",
  },
  {
    id: "rentenausgaben",
    name: "Rentenausgaben",
    einheit: "% BIP",
    dez: 1,
    modell: (z) => z.rentenausgaben,
    ist: "rentenausgaben",
    vergleich: "konstant",
  },
  {
    id: "leistungsbilanz",
    name: "Leistungsbilanz",
    einheit: "% BIP",
    dez: 1,
    modell: (z) => z.leistungsbilanz,
    ist: "leistungsbilanz",
    vergleich: "konstant",
  },
  {
    id: "rendite",
    name: "Rendite 10 Jahre",
    einheit: "%",
    dez: 1,
    modell: (z) => z.rendite,
    ist: "rendite",
    vergleich: "konstant",
  },
];

export interface Punkt {
  jahr: number;
  modell: number;
  ist: number | null;
  vergleich: number | null;
  unten: number | null;
  oben: number | null;
}

export interface Treffsicherheit {
  id: string;
  name: string;
  einheit: string;
  dez: number;
  sd: number | null;
  jahre: number;
  imBand: number | null;
  rmseModell: number | null;
  rmseVergleich: number | null;
  theilU: number | null;
  huerde: boolean | null;
  ziel: boolean | null;
  punkte: Punkt[];
}

// Residuen-Standardabweichung um die Regressionsgerade (Divisor n − 2).
export function trendStd(
  werte: { jahr: number; wert: number }[],
): number | null {
  const n = werte.length;
  if (n < 3) return null;
  const mx = werte.reduce((s, p) => s + p.jahr, 0) / n;
  const my = werte.reduce((s, p) => s + p.wert, 0) / n;
  const sxx = werte.reduce((s, p) => s + (p.jahr - mx) ** 2, 0);
  const b =
    sxx === 0
      ? 0
      : werte.reduce((s, p) => s + (p.jahr - mx) * (p.wert - my), 0) / sxx;
  const rss = werte.reduce(
    (s, p) => s + (p.wert - (my + b * (p.jahr - mx))) ** 2,
    0,
  );
  return Math.sqrt(rss / (n - 2));
}

export function vergleichsPfad(
  reihe: Record<number, number>,
  jahre: number[],
  art: Vergleichsart,
): (number | null)[] {
  const start = jahre[0];
  const s0 = reihe[start];
  if (s0 === undefined) return jahre.map(() => null);
  const vorjahr = reihe[start - 1];
  const rate = art === "wachstum" && vorjahr ? s0 / vorjahr - 1 : 0;
  return jahre.map((j) => s0 * (1 + rate) ** (j - start));
}

const rmse = (d: number[]) =>
  Math.sqrt(d.reduce((s, x) => s + x * x, 0) / d.length);

export function pruefeTreffsicherheit(
  verlauf: Zustand[],
  ist: Record<string, Record<number, number>>,
): Treffsicherheit[] {
  const jahre = verlauf.map((z) => z.jahr);
  return RUECK_REIHEN.map((r) => {
    const reihe = ist[r.ist] ?? {};
    const vergleich = vergleichsPfad(reihe, jahre, r.vergleich);
    const vorhanden = jahre
      .filter((j) => reihe[j] !== undefined)
      .map((j) => ({ jahr: j, wert: reihe[j] }));
    const sd = trendStd(vorhanden);
    const punkte: Punkt[] = verlauf.map((zz, i) => {
      const iw = reihe[zz.jahr] ?? null;
      return {
        jahr: zz.jahr,
        modell: r.modell(zz),
        ist: iw,
        vergleich: vergleich[i],
        unten: iw !== null && sd !== null ? iw - sd : null,
        oben: iw !== null && sd !== null ? iw + sd : null,
      };
    });
    const gezaehlt = punkte
      .slice(1)
      .filter(
        (p): p is Punkt & { ist: number; vergleich: number } =>
          p.ist !== null && p.vergleich !== null,
      );
    const leer: Treffsicherheit = {
      id: r.id,
      name: r.name,
      einheit: r.einheit,
      dez: r.dez,
      sd,
      jahre: gezaehlt.length,
      imBand: null,
      rmseModell: null,
      rmseVergleich: null,
      theilU: null,
      huerde: null,
      ziel: null,
      punkte,
    };
    if (sd === null || gezaehlt.length === 0) return leer;
    const fehlerM = gezaehlt.map((p) => p.modell - p.ist);
    const fehlerV = gezaehlt.map((p) => p.vergleich - p.ist);
    const rm = rmse(fehlerM),
      rv = rmse(fehlerV);
    const theilU = rv === 0 ? (rm === 0 ? 0 : Infinity) : rm / rv;
    const imBand =
      gezaehlt.filter((p) => Math.abs(p.modell - p.ist) <= sd + 1e-12).length /
      gezaehlt.length;
    return {
      ...leer,
      imBand,
      rmseModell: rm,
      rmseVergleich: rv,
      theilU,
      huerde: theilU < 1,
      ziel: imBand >= 2 / 3,
    };
  });
}

export function bewerte(
  t: Treffsicherheit,
): "Hürde verfehlt" | "Ziel erreicht" | "Ziel verfehlt" | "keine Daten" {
  if (t.huerde === null) return "keine Daten";
  if (!t.huerde) return "Hürde verfehlt";
  return t.ziel ? "Ziel erreicht" : "Ziel verfehlt";
}
