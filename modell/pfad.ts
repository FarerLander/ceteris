import type { Pfad } from "./typen";

// Zeitpfad: eine Zahl oder Stufen „ab Jahr X gilt Wert Y“.
export function pfadWert(p: Pfad, jahr: number): number {
  if (typeof p === "number") return p;
  if (p.length === 0) throw new Error("Leerer Zeitpfad");
  const sortiert = [...p].sort((a, b) => a.ab - b.ab);
  let wert = sortiert[0].wert;
  for (const s of sortiert) if (jahr >= s.ab) wert = s.wert;
  return wert;
}
