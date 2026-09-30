// Sprachen der App (Spec 12c). Deutsch steht im Code und ist die Quelle; andere Sprachen liegen in
// app/sprachen/<code>.json. Schlüssel ist der deutsche Text selbst (Oberfläche) oder eine Kennung
// wie „v:<id>:name“ (Verzeichnis, Reihen, Kritikpunkte). Fehlt ein Text, erscheint der deutsche.
import en from "../app/sprachen/en.json";

export type Sprache = "de" | "en";
export const SPRACHEN: Sprache[] = ["de", "en"];
export const SPRACH_NAME: Record<Sprache, string> = { de: "Deutsch", en: "English" };
const LOCALE: Record<Sprache, string> = { de: "de-DE", en: "en-GB" };
const TEXTE: Record<Sprache, Record<string, string>> = { de: {}, en };

let aktuell: Sprache = "de";
export const sprache = (): Sprache => aktuell;
export const locale = (): string => LOCALE[aktuell];
export function setzeSprache(s: Sprache): void {
  aktuell = s;
}

type Werte = Record<string, string | number>;
const setzeEin = (s: string, w?: Werte) =>
  w ? s.replace(/\{(\w+)\}/g, (m, k: string) => (k in w ? String(w[k]) : m)) : s;

// Für Tests: sammelt Schlüssel, zu denen in der gewählten Sprache der Text fehlt.
let fehlend: Set<string> | null = null;
export function sammleFehlende(s: Set<string> | null): void {
  fehlend = s;
}
function nachschlagen(schluessel: string, deutsch: string): string {
  if (aktuell === "de") return deutsch;
  const x = TEXTE[aktuell][schluessel];
  if (x === undefined) fehlend?.add(schluessel);
  return x ?? deutsch;
}

// Oberflächentext: Schlüssel = deutscher Text, Platzhalter in geschweiften Klammern.
export function t(deutsch: string, werte?: Werte): string {
  return setzeEin(nachschlagen(deutsch, deutsch), werte);
}

// Text mit eigener Kennung (z. B. „v:ordnung.rechtsstaat:name“); deutsch aus dem Code.
export function tk(schluessel: string, deutsch: string, werte?: Werte): string {
  return setzeEin(nachschlagen(schluessel, deutsch), werte);
}

export function hatText(s: Sprache, schluessel: string): boolean {
  return schluessel in TEXTE[s];
}
