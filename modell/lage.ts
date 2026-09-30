import type { Kontext, Lage, Zustand } from "./typen";

// Reihenfolge = Prüfreihenfolge = Anzeigereihenfolge (Spec 10, Lage-Einstufung).
export const LAGEN: readonly Lage[] = [
  "krise",
  "depression",
  "rezession",
  "stagflation",
  "deflation",
  "boom",
  "schuldenwachstum",
  "wachstum",
  "stagnation",
];

// Erste zutreffende Regel gilt. Wachstum immer pro Kopf, in Prozent.
export function lage(alt: Zustand, neu: Zustand, k: Kontext): Lage {
  const g = neu.wachstumProKopf * 100;
  const inflationHoch =
    neu.inflation > k.w("geld.inflationsziel") + k.p("schwelle.inflationHoch");
  if (
    neu.aufschlag > k.p("schwelle.aufschlag") ||
    neu.inflation > k.p("schwelle.hyperinflation") ||
    neu.ventilSeit === 0 ||
    neu.dsr > k.land.start.dsrSchwelle ||
    k.schock.krise > 0 ||
    neu.rettung > 0 // Bankenrettung (Spec 13.6)
  )
    return "krise";
  if (
    neu.minusJahre >= k.p("schwelle.depressionJahre") ||
    neu.bipProKopf <
      neu.hoechstProKopf * (1 - k.p("schwelle.depressionAbstand") / 100)
  )
    return "depression";
  if (g < k.p("schwelle.rezession")) return "rezession";
  if (g < k.p("schwelle.wachstum") && inflationHoch) return "stagflation";
  if (neu.inflation < k.p("schwelle.deflation")) return "deflation";
  if (neu.luecke > 0 && (g > k.p("schwelle.boom") || inflationHoch))
    return "boom";
  if (g > k.p("schwelle.wachstum"))
    return neu.schuldQuote - alt.schuldQuote > k.p("schwelle.schuldAnstieg")
      ? "schuldenwachstum"
      : "wachstum";
  return "stagnation";
}
