import { t, tk } from "../sprache";
import { eintrag } from "../verzeichnis";
import type { BausteinId } from "../typen";

export interface Groesse {
  name: string;
  einheit: string;
  art: "quote" | "niveau"; // Quote: Abweichung in Pp.; Niveau: in %
  faktor?: number; // Anteil → Prozent
}

// Anzeigenamen der Zwischengrößen. Nur Namen, keine Verbindungen (die ermittelt die Mitschrift).
export const GROESSEN: Record<string, Groesse> = {
  bev: { name: "Bevölkerung", einheit: "Mio.", art: "niveau" },
  erwerbsfaehige: {
    name: "Menschen im Erwerbsalter",
    einheit: "Mio.",
    art: "niveau",
  },
  rentner: { name: "Rentnerinnen und Rentner", einheit: "Mio.", art: "niveau" },
  migBeschaeftigte: {
    name: "Beschäftigte Zugewanderte",
    einheit: "Mio.",
    art: "niveau",
  },
  energiepreis: { name: "Energiepreis", einheit: "Index", art: "niveau" },
  co2Mt: { name: "CO₂-Ausstoß", einheit: "Mio. t", art: "niveau" },
  vcQuote: { name: "Wagniskapital", einheit: "% BIP", art: "quote" },
  A: { name: "Produktivität", einheit: "Index", art: "niveau" },
  K: { name: "Kapitalstock", einheit: "Mrd.", art: "niveau" },
  investQuote: { name: "Investitionsquote", einheit: "% BIP", art: "quote" },
  luecke: {
    name: "Produktionslücke",
    einheit: "% Potenzial",
    art: "quote",
    faktor: 100,
  },
  Y: { name: "Wirtschaftsleistung", einheit: "Mrd.", art: "niveau" },
  wachstum: { name: "Wachstum", einheit: "%", art: "quote", faktor: 100 },
  erwerbspersonen: { name: "Erwerbspersonen", einheit: "Mio.", art: "niveau" },
  beschaeftigte: { name: "Erwerbstätige", einheit: "Mio.", art: "niveau" },
  alq: { name: "Arbeitslosigkeit", einheit: "%", art: "quote" },
  privatschuld: { name: "Privatschuld", einheit: "% BIP", art: "quote" },
  kreditimpuls: { name: "Kreditimpuls", einheit: "% BIP", art: "quote" },
  inflation: { name: "Inflation", einheit: "%", art: "quote" },
  leitzins: { name: "Leitzins", einheit: "%", art: "quote" },
  einnahmen: { name: "Staatseinnahmen", einheit: "% BIP", art: "quote" },
  rentenausgaben: { name: "Rentenausgaben", einheit: "% BIP", art: "quote" },
  algAusgaben: {
    name: "Ausgaben für Arbeitslose",
    einheit: "% BIP",
    art: "quote",
  },
  zinsausgaben: { name: "Zinsausgaben", einheit: "% BIP", art: "quote" },
  primaer: { name: "Primärsaldo", einheit: "% BIP", art: "quote" },
  spielraum: { name: "Spielraum im Haushalt", einheit: "% Einnahmen", art: "quote" },
  schuldQuote: { name: "Staatsschuld", einheit: "% BIP", art: "quote" },
  rendite: { name: "Rendite 10 Jahre", einheit: "%", art: "quote" },
  aufschlag: { name: "Risikoaufschlag", einheit: "Pp.", art: "quote" },
  exporte: { name: "Exporte", einheit: "% BIP", art: "quote" },
  importe: { name: "Importe", einheit: "% BIP", art: "quote" },
  leistungsbilanz: { name: "Leistungsbilanz", einheit: "% BIP", art: "quote" },
  wechselkurs: { name: "Wechselkurs", einheit: "Index", art: "niveau" },
  bipProKopf: { name: "Ökon. Wohlstand pro Kopf", einheit: "Tsd.", art: "niveau" },
  armut: { name: "Armutsquote", einheit: "%", art: "quote" },
  gini: { name: "Ungleichheit (Gini)", einheit: "Punkte", art: "quote" },
  kapitalflucht: { name: "Kapitalflucht", einheit: "% BIP", art: "quote" },
  knappheit: { name: "Knappheit", einheit: "Index", art: "quote" },
  schwarzmarkt: { name: "Schwarzmarkt-Aufschlag", einheit: "%", art: "quote" },
  verdeckteSchuld: { name: "Verdeckte Schuld", einheit: "% BIP", art: "quote" },
  rohstoffExporte: { name: "Rohstoffexporte", einheit: "% BIP", art: "quote" },
  investAufschlag: { name: "Investitionsrisiko", einheit: "Pp.", art: "quote" },
  hauspreis: { name: "Hauspreise (real)", einheit: "Index", art: "niveau" },
  hausluecke: { name: "Hauspreis-Lücke", einheit: "%", art: "quote" },
  hausWert: { name: "Hausvermögen", einheit: "% BIP", art: "quote" },
  npl: { name: "Faule Kredite", einheit: "% der Kredite", art: "quote" },
  bankKapital: { name: "Eigenkapital der Banken", einheit: "% der Bilanz", art: "quote" },
  klemme: { name: "Kreditklemme", einheit: "% BIP", art: "quote" },
  rettung: { name: "Bankenrettung", einheit: "% BIP", art: "quote" },
};

export const KENNZAHLEN = [
  "bipProKopf",
  "schuldQuote",
  "alq",
  "inflation",
  "spielraum",
] as const;

export const BAUSTEIN_NAME: Record<BausteinId, string> = {
  demografie: "Demografie und Migration",
  ordnung: "Wirtschaftsordnung",
  energie: "Energie und Rohstoffe",
  innovation: "Innovation",
  wachstum: "Wachstum und Arbeitsmarkt",
  privatschuld: "Privatschuld",
  geld: "Geld und Zins",
  staat: "Staat, Steuern, Rente",
  anleihen: "Anleihen",
  handel: "Handel und Währung",
  banken: "Häuser und Banken",
  zufall: "Zufallsschocks",
};

// Ein Stoß: 10 % der Spanne, auf den Schritt gerundet, nach oben; am oberen Rand nach unten.
export function stoss(id: string, wert: number): number {
  const e = eintrag(id);
  if (e.optionen) return (Math.round(wert) + 1) % e.optionen.length;
  const [lo, hi] = e.bereich!;
  const schritt = e.schritt ?? (hi - lo) / 100;
  const d = Math.max(
    schritt,
    Math.round((0.1 * (hi - lo)) / schritt) * schritt,
  );
  const rund = (x: number) => Math.round(x / schritt) * schritt;
  return wert + d <= hi + 1e-9 ? rund(wert + d) : rund(wert - d);
}

export function merklich(g: Groesse): number {
  return g.art === "quote" ? 0.05 : 0.1;
}

export function abweichung(g: Groesse, a: number, b: number): number {
  if (g.art === "quote") return (b - a) * (g.faktor ?? 1);
  return a === 0 ? 0 : (b / a - 1) * 100;
}

// Angezeigte Namen in der gewählten Sprache (Spec 12c).
export const gName = (id: string) => (GROESSEN[id] ? tk(`g:${id}:name`, GROESSEN[id].name) : id);
export const bName = (b: BausteinId) => t(BAUSTEIN_NAME[b]);

