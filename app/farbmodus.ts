export type Farbmodus = "system" | "hell" | "dunkel";

const SCHLUESSEL = "wirtschaftssimulator.farbmodus";
export const NAECHSTER: Record<Farbmodus, Farbmodus> = { system: "hell", hell: "dunkel", dunkel: "system" };
export const NAME: Record<Farbmodus, string> = { system: "wie System", hell: "Hell", dunkel: "Dunkel" };

export function ladeFarbmodus(): Farbmodus {
  try {
    const m = window.localStorage.getItem(SCHLUESSEL);
    return m === "hell" || m === "dunkel" ? m : "system";
  } catch {
    return "system";
  }
}

// Setzt data-theme am Dokument; „system“ überlässt die Wahl dem Betriebssystem.
export function wendeFarbmodusAn(m: Farbmodus): void {
  const el = document.documentElement;
  if (m === "system") el.removeAttribute("data-theme");
  else el.setAttribute("data-theme", m === "hell" ? "light" : "dark");
}

export function speichereFarbmodus(m: Farbmodus): void {
  try {
    window.localStorage.setItem(SCHLUESSEL, m);
  } catch {
    // Ohne Speicher gilt die Wahl nur bis zum Neuladen.
  }
}
