import { useEffect, useState } from "react";

// Smartphone-Bedienung (Stellschrauben als Blatt von unten) nur unter dieser Breite.
const HANDY = "(max-width: 700px)";
const SCHLUESSEL = "wirtschaftssimulator.seitenleiste";

function passt(abfrage: string): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia(abfrage).matches
  );
}

export function useHandy(): boolean {
  const [handy, setHandy] = useState(() => passt(HANDY));
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const m = window.matchMedia(HANDY);
    const neu = () => setHandy(m.matches);
    m.addEventListener("change", neu);
    return () => m.removeEventListener("change", neu);
  }, []);
  return handy;
}

export function ladeEingeklappt(): boolean {
  try {
    return window.localStorage.getItem(SCHLUESSEL) === "zu";
  } catch {
    return false;
  }
}

export function speichereEingeklappt(zu: boolean): void {
  try {
    window.localStorage.setItem(SCHLUESSEL, zu ? "zu" : "auf");
  } catch {
    // Ohne Speicher gilt der Zustand nur bis zum Neuladen.
  }
}

// Wischen nach links oder rechts, nicht bei Eingaben, Diagrammen oder seitlich scrollenden Bereichen.
export function darfWischen(ziel: EventTarget | null): boolean {
  let el = ziel instanceof Element ? ziel : null;
  if (el?.closest("input, select, textarea, svg, [data-kein-wischen]"))
    return false;
  while (el && el !== document.body) {
    if (el instanceof HTMLElement && el.scrollWidth > el.clientWidth + 2) {
      const ox = getComputedStyle(el).overflowX;
      if (ox === "auto" || ox === "scroll") return false;
    }
    el = el.parentElement;
  }
  return true;
}
