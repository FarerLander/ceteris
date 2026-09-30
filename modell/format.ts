import { locale } from "./sprache";
import { vEinheit, vOption, type Eintrag } from "./verzeichnis";

export function fmt(v: number, dez = 0): string {
  return v.toLocaleString(locale(), {
    minimumFractionDigits: dez,
    maximumFractionDigits: dez,
  });
}

function dezimalen(schritt: number): number {
  const t = String(schritt);
  return t.includes(".") ? t.split(".")[1].length : 0;
}

export function formatStell(e: Eintrag, v: number): string {
  if (e.optionen) return vOption(e, Math.round(v));
  if (e.einheit === "Anteil") {
    const d = Number.isInteger(Math.round(v * 1000) / 10) ? 0 : 1;
    return `${fmt(v * 100, d)} %`;
  }
  const d = Number.isInteger(v) ? 0 : dezimalen(e.schritt ?? 1);
  return e.einheit ? `${fmt(v, d)} ${vEinheit(e)}` : fmt(v, d);
}
