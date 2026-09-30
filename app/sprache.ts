import { SPRACHEN, type Sprache } from "../modell/sprache";

const SCHLUESSEL = "wirtschaftssimulator.sprache";
const gueltig = (s: string | null): s is Sprache => !!s && (SPRACHEN as string[]).includes(s);

// Sprache beim ersten Besuch: Englisch, auch bei deutschem Browser. Die Tests setzen Deutsch.
export const SPRACH_EINSTELLUNG: { standard: Sprache } = { standard: "en" };

// Reihenfolge: Link (?sprache=de), eigene Wahl im Browser-Speicher, sonst der Standard.
export function ladeSprache(): Sprache {
  if (typeof window === "undefined") return "de";
  const ausLink = new URLSearchParams(window.location.search).get("sprache");
  if (gueltig(ausLink)) return ausLink;
  try {
    const m = window.localStorage.getItem(SCHLUESSEL);
    if (gueltig(m)) return m;
  } catch {
    // Speicher gesperrt: weiter mit dem Standard.
  }
  return SPRACH_EINSTELLUNG.standard;
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
