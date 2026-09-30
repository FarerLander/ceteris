import { bankenAn } from "./banken-modus";
import { t } from "./sprache";
import { wirkstaerke } from "./kontext";
import { pfadWert } from "./pfad";
import type { ReihenId } from "./reihen";
import type { Landesdaten, Szenario, Zustand } from "./typen";
import { WELT_STANDARD } from "./welt";

export type WarnId =
  | "rg"
  | "aufschlag"
  | "dsr"
  | "alq"
  | "energie"
  | "reserve"
  | "spielraum"
  | "hyper"
  | "schwarzmarkt"
  | "verdeckt"
  | "zinskurve"
  | "kredit"
  | "haus"
  | "bank"
  | "ventil";
export interface Warnphase {
  id: WarnId;
  von: number;
  bis: number;
  text: string;
  reihe: ReihenId;
}

const TEXT: Record<Exclude<WarnId, "ventil">, [string, ReihenId]> = {
  rg: [
    "Zins über Wachstum bei Primärdefizit: Die Schuldenquote steigt von selbst.",
    "schuldQuote",
  ],
  aufschlag: [
    "Risikoaufschlag über der Kipp-Schwelle: Die Märkte zweifeln an der Tragfähigkeit.",
    "aufschlag",
  ],
  dsr: [
    "Private Schulden zu teuer: Haushalte und Firmen müssen sich entschulden.",
    "bipProKopf",
  ],
  alq: ["Arbeitslosigkeit über 10 %.", "alq"],
  energie: [
    "Energie mehr als 50 % teurer als bei Wettbewerbern: Industrie wandert ab.",
    "energiepreis",
  ],
  reserve: ["Der Reservewährungsstatus bröckelt.", "schuldQuote"],
  spielraum: [
    "Zinsen, Renten und Sozialausgaben lassen weniger als 10 % der Einnahmen für alle anderen Aufgaben.",
    "spielraum",
  ],
  hyper: ["Inflation über 100 %: Hyperinflation.", "inflation"],
  schwarzmarkt: [
    "Schwarzmarkt-Aufschlag über 20 %: Der offizielle Kurs ist zu teuer.",
    "schwarzmarkt",
  ],
  verdeckt: [
    "Verdeckte Schuld der Staatsbanken über 15 % BIP: Der Staat muss sie bald übernehmen.",
    "verdeckteSchuld",
  ],
  zinskurve: [
    "Inverse Zinskurve: Die Rendite 10 Jahre liegt unter dem Leitzins. In den USA ging dem meist eine Rezession voraus.",
    "zinskurve",
  ],
  kredit: [
    "Kreditlücke über 10 Pp.: Die Privatschuld liegt weit über ihrem Trend. Bester bekannter Vorbote von Bankenkrisen.",
    "kreditluecke",
  ],
  haus: [
    "Hauspreise mehr als 15 % über ihrem Trend: Kreditfinanzierte Immobilienblasen enden oft in Bankenkrisen.",
    "hausluecke",
  ],
  bank: [
    "Banken mit zu wenig Eigenkapital: Sie vergeben weniger Kredit.",
    "bankKapital",
  ],
};

function imJahr(
  alt: Zustand,
  z: Zustand,
  land: Landesdaten,
  sz: Szenario,
): WarnId[] {
  const ids: WarnId[] = [];
  const welt =
    sz.welt.weltEnergiepreis === undefined
      ? WELT_STANDARD.weltEnergiepreis
      : pfadWert(sz.welt.weltEnergiepreis, z.jahr);
  if (z.rMinusG > 0 && z.primaer < 0) ids.push("rg");
  if (z.aufschlag > wirkstaerke("schwelle.aufschlag", land))
    ids.push("aufschlag");
  if (z.dsr > land.start.dsrSchwelle) ids.push("dsr");
  if (z.alq > 10) ids.push("alq");
  if (z.energiepreis > 1.5 * welt) ids.push("energie");
  if (sz.grund.regime === "welt" && z.reserve < alt.reserve - 1e-6)
    ids.push("reserve");
  if (z.spielraum < 10) ids.push("spielraum");
  if (z.inflation > wirkstaerke("schwelle.hyperinflation", land)) ids.push("hyper");
  if (z.schwarzmarkt > 20) ids.push("schwarzmarkt");
  if (z.verdeckteSchuld > 15) ids.push("verdeckt");
  // Bei gelenkter Währung setzt der Staat den Leitzins; die Kurve ist dort kein Marktsignal.
  if (sz.grund.regime !== "gelenkt" && z.zinskurve < wirkstaerke("schwelle.zinskurve", land)) ids.push("zinskurve");
  if (z.kreditluecke > wirkstaerke("schwelle.kreditluecke", land)) ids.push("kredit");
  // Häuser und Banken (Spec 13.6): nur, wenn der Baustein rechnet.
  if (bankenAn(land, sz.grund)) {
    if (z.hausluecke > wirkstaerke("schwelle.hausluecke", land)) ids.push("haus");
    if (z.klemme > 0) ids.push("bank");
  }
  if (z.ventilSeit === 0) ids.push("ventil");
  return ids;
}

// Fasst Warnungen je Art zu zusammenhängenden Jahresphasen zusammen.
export function warnlampen(
  land: Landesdaten,
  sz: Szenario,
  verlauf: Zustand[],
): Warnphase[] {
  const phasen: Warnphase[] = [];
  const offen = new Map<WarnId, Warnphase>();
  for (let j = 1; j < verlauf.length; j++) {
    const z = verlauf[j];
    for (const id of imJahr(verlauf[j - 1], z, land, sz)) {
      const p = offen.get(id);
      if (p && p.bis === z.jahr - 1) {
        p.bis = z.jahr;
        continue;
      }
      const [text, reihe] =
        id === "ventil"
          ? [
              (
                z.ventilArt === 1
                  ? "Schuldenschnitt: Die Gläubiger verzichten auf einen großen Teil ihrer Forderungen."
                  : "Monetarisierung: Die Notenbank kauft Staatsschulden, die Inflation steigt."
              ),
              "schuldQuote" as ReihenId,
            ]
          : TEXT[id];
      const neu: Warnphase = { id, von: z.jahr, bis: z.jahr, text: t(text), reihe };
      offen.set(id, neu);
      phasen.push(neu);
    }
  }
  return phasen.sort((a, b) => a.von - b.von || a.id.localeCompare(b.id));
}

// Vorab-Hinweis (Spec 13.4): so viele Jahre lagen im Rückblick im Mittel zwischen zwei großen Schocks.
export function schockAbstand(rueckblick: Szenario): number {
  return Math.round(rueckblick.jahre / Math.max(1, rueckblick.schocks.length));
}
