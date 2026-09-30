import { SPRACHEN, type Sprache } from "../modell/sprache";

const SCHLUESSEL = "wirtschaftssimulator.sprache";
const gueltig = (s: string | null): s is Sprache => !!s && (SPRACHEN as string[]).includes(s);

// Reihenfolge: Link (?sprache=en), Browser-Speicher, Sprache des Browsers, sonst Englisch.
export function ladeSprache(): Sprache {
  if (typeof window === "undefined") return "de";
  const ausLink = new URLSearchParams(window.location.search).get("sprache");
  if (gueltig(ausLink)) return ausLink;
  try {
    const m = window.localStorage.getItem(SCHLUESSEL);
    if (gueltig(m)) return m;
  } catch {
    // Speicher gesperrt: weiter mit der Browsersprache.
  }
  return (navigator.language ?? "").toLowerCase().startsWith("de") ? "de" : "en";
}

export function speichereSprache(s: Sprache): void {
  try {
    window.localStorage.setItem(SCHLUESSEL, s);
  } catch {
    // Speicher gesperrt: Wahl gilt nur für diese Sitzung.
  }
  const p = new URLSearchParams(window.location.search);
  if (p.has("sprache")) {
    p.set("sprache", s);
    window.history.replaceState(null, "", `${window.location.pathname}?${p}${window.location.hash}`);
  }
}
