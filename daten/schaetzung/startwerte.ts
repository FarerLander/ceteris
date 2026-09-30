// Vom Filter zu Startwerten: Umrechnung und Plausibilität (Spec 13.1, Rückfall auf Handwerte).
import type { SchaetzGroesse, Schaetzwert } from "../../modell/typen";
import { hp } from "./hp";
import type { Schaetzung } from "./modell";
import type { Reihen } from "./reihen";

export const GRENZEN: Record<
  SchaetzGroesse,
  { bereich: [number, number]; band: number }
> = {
  tfpTrend: { bereich: [-0.5, 3.5], band: 0.8 },
  nairu: { bereich: [1, 15], band: 2.5 }, // Bereich der Stellschraube arbeit.nairu
  rStern: { bereich: [-4, 5], band: 3 },
  luecke: { bereich: [-10, 10], band: 5 },
};
export const KAPPA_MAX = 3;
const HP_LAMBDA = 6.25;
const ARBEIT_JAHRE = 10;

const komma = (x: number) => x.toFixed(1).replace(".", ",").replace("-", "−");

function pruefe(
  groesse: SchaetzGroesse,
  wert: number,
  band: number,
  kappa: number,
  hpWert?: number,
): Schaetzwert {
  const g = GRENZEN[groesse];
  const extra =
    hpWert !== undefined && Number.isFinite(hpWert) ? { hp: hpWert } : {};
  if (!Number.isFinite(wert) || !Number.isFinite(band))
    return {
      groesse,
      wert: 0,
      band: 0,
      gueltig: false,
      grund: "Schätzung nicht endlich",
      ...extra,
    };
  let grund: string | undefined;
  if (!(kappa <= KAPPA_MAX))
    grund = `Modell passt nicht zu den Daten (κ = ${komma(kappa)})`;
  else if (wert < g.bereich[0] || wert > g.bereich[1])
    grund = `außerhalb ${komma(g.bereich[0])} bis ${komma(g.bereich[1])}`;
  else if (band > g.band)
    grund = `Band ±${komma(band)} breiter als ${komma(g.band)}`;
  return {
    groesse,
    wert,
    band,
    gueltig: !grund,
    ...(grund ? { grund } : {}),
    ...extra,
  };
}

// Mittleres Wachstum des Arbeitspotenzials Erwerbspersonen·(1 − NAIRU) der letzten Jahre, in %.
function arbeitWachstum(s: Schaetzung, r: Reihen): number {
  const e = r.jahre.length - 1;
  const pot = (t: number) => {
    const ep = r.erwerbspersonen[t];
    return ep === null ? null : ep * (1 - s.nairu[t].wert / 100);
  };
  const werte: number[] = [];
  for (let t = Math.max(1, e - ARBEIT_JAHRE + 1); t <= e; t++) {
    const a = pot(t - 1),
      b = pot(t);
    if (a !== null && b !== null && a > 0 && b > 0)
      werte.push(100 * Math.log(b / a));
  }
  return werte.length ? werte.reduce((x, y) => x + y, 0) / werte.length : NaN;
}

export function startwerte(
  s: Schaetzung,
  r: Reihen,
  alpha: number,
): Schaetzwert[] {
  const e = r.jahre.length - 1;
  const gL = arbeitWachstum(s, r);
  const trend = r.y.length >= 3 ? hp(r.y, HP_LAMBDA) : [];
  const hpWert = trend.length
    ? (1 - alpha) * (trend[e] - trend[e - 1] - gL)
    : undefined;
  const tfp = pruefe(
    "tfpTrend",
    (1 - alpha) * (s.g[e].wert - gL),
    (1 - alpha) * s.g[e].band,
    s.kappa,
    hpWert,
  );
  const rStern: Schaetzwert = s.rStern
    ? pruefe("rStern", s.rStern[e].wert, s.rStern[e].band, s.kappa)
    : {
        groesse: "rStern",
        wert: 0,
        band: 0,
        gueltig: false,
        grund: "kein Kurzfristzins",
      };
  return [
    tfp,
    pruefe("nairu", s.nairu[e].wert, s.nairu[e].band, s.kappa),
    rStern,
    pruefe("luecke", s.luecke[e].wert, s.luecke[e].band, s.kappa),
  ];
}
