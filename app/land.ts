import autoDE from "../daten/laender/DE.json";
import handDE from "../daten/laender/DE-hand.json";
import histDE from "../daten/laender/DE-historie.json";
import { baueRueckblick, istReihen } from "../daten/historie";
import autoJP from "../daten/laender/JP.json";
import handJP from "../daten/laender/JP-hand.json";
import autoUS from "../daten/laender/US.json";
import handUS from "../daten/laender/US-hand.json";
import konsDE from "../daten/laender/DE-konsens.json";
import konsJP from "../daten/laender/JP-konsens.json";
import konsUS from "../daten/laender/US-konsens.json";
import autoCA from "../daten/laender/CA.json";
import handCA from "../daten/laender/CA-hand.json";
import konsCA from "../daten/laender/CA-konsens.json";
import autoFR from "../daten/laender/FR.json";
import handFR from "../daten/laender/FR-hand.json";
import konsFR from "../daten/laender/FR-konsens.json";
import autoGB from "../daten/laender/GB.json";
import handGB from "../daten/laender/GB-hand.json";
import konsGB from "../daten/laender/GB-konsens.json";
import autoIT from "../daten/laender/IT.json";
import handIT from "../daten/laender/IT-hand.json";
import konsIT from "../daten/laender/IT-konsens.json";
import autoCN from "../daten/laender/CN.json";
import handCN from "../daten/laender/CN-hand.json";
import konsCN from "../daten/laender/CN-konsens.json";
import autoRU from "../daten/laender/RU.json";
import handRU from "../daten/laender/RU-hand.json";
import konsRU from "../daten/laender/RU-konsens.json";
import schDE from "../daten/laender/DE-schaetzung.json";
import schUS from "../daten/laender/US-schaetzung.json";
import schJP from "../daten/laender/JP-schaetzung.json";
import schGB from "../daten/laender/GB-schaetzung.json";
import schFR from "../daten/laender/FR-schaetzung.json";
import schIT from "../daten/laender/IT-schaetzung.json";
import schCA from "../daten/laender/CA-schaetzung.json";
import schCN from "../daten/laender/CN-schaetzung.json";
import schRU from "../daten/laender/RU-schaetzung.json";
import planDE from "../daten/laender/DE-plan.json";
import planUS from "../daten/laender/US-plan.json";
import planJP from "../daten/laender/JP-plan.json";
import planGB from "../daten/laender/GB-plan.json";
import planFR from "../daten/laender/FR-plan.json";
import planIT from "../daten/laender/IT-plan.json";
import planCA from "../daten/laender/CA-plan.json";
import planCN from "../daten/laender/CN-plan.json";
import planRU from "../daten/laender/RU-plan.json";
import { baueKonsens, type KonsensHandDatei } from "../daten/konsens";
import { baueLand } from "../daten/land";
import type { Haushaltsplan, Landesdaten } from "../modell/typen";
import type { AutoDatei, HandDatei, HistorieDatei, SchaetzDatei } from "../daten/typen";

// Konsens hängt nur an der Ansicht der Gegenwart, nie am Rückblick.
function mitKonsens(land: Landesdaten, auto: unknown, hand: unknown): Landesdaten {
  return { ...land, konsens: baueKonsens((auto as AutoDatei).konsens, hand as KonsensHandDatei) };
}

// Spec 13.1: mit Schätzung (Kalman) die Ansicht der Gegenwart, ohne die Handfassung für den Neutralitätstest.
// Der Haushaltsplan (M29) hängt wie der Konsens nur an der Gegenwart, nie am Rückblick.
function baue(auto: unknown, hand: unknown, kons: unknown, plan: unknown, sch?: unknown): Landesdaten {
  const land = baueLand(auto as AutoDatei, hand as HandDatei, undefined, undefined, sch as SchaetzDatei | undefined);
  return { ...mitKonsens(land, auto, kons), plan: plan as Haushaltsplan | undefined };
}

const QUELLEN: Record<string, [unknown, unknown, unknown, unknown, unknown]> = {
  DE: [autoDE, handDE, konsDE, schDE, planDE],
  US: [autoUS, handUS, konsUS, schUS, planUS],
  JP: [autoJP, handJP, konsJP, schJP, planJP],
  GB: [autoGB, handGB, konsGB, schGB, planGB],
  FR: [autoFR, handFR, konsFR, schFR, planFR],
  IT: [autoIT, handIT, konsIT, schIT, planIT],
  CA: [autoCA, handCA, konsCA, schCA, planCA],
  CN: [autoCN, handCN, konsCN, schCN, planCN],
  RU: [autoRU, handRU, konsRU, schRU, planRU],
};

export const LAENDER: Record<string, Landesdaten> = Object.fromEntries(
  Object.entries(QUELLEN).map(([code, [a, h, k, sch, p]]) => [code, baue(a, h, k, p, sch)]),
);
export const LAENDER_HAND: Record<string, Landesdaten> = Object.fromEntries(
  // Handfassung ohne Plan (M29): Der Plan ist auf die Startwerte mit Schätzung geeicht.
  Object.entries(QUELLEN).map(([code, [a, h, k]]) => [code, baue(a, h, k, undefined)]),
);
export const DE = LAENDER.DE;

export const IST = istReihen(autoDE as unknown as AutoDatei, histDE as unknown as HistorieDatei);
export const RUECKBLICK = baueRueckblick(autoDE as unknown as AutoDatei, handDE as unknown as HandDatei, histDE as unknown as HistorieDatei);

export function landAusLink(): string {
  const l = typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("l");
  return l && Object.hasOwn(LAENDER, l) ? l : "DE";
}
