import type { Konsens, KonsensQuelle } from "../modell/typen";

// Handwerte ohne stabile Schnittstelle: daten/laender/XX-konsens.json.
export interface KonsensHandDatei {
  quellen: KonsensQuelle[];
  gruende?: Konsens["gruende"];
}

export function baueKonsens(auto?: KonsensQuelle, hand?: KonsensHandDatei): Konsens | undefined {
  const quellen = [...(auto ? [auto] : []), ...(hand?.quellen ?? [])].filter((q) =>
    Object.values(q.werte).some((r) => r && Object.keys(r).length),
  );
  return quellen.length ? { quellen, gruende: hand?.gruende ?? {} } : undefined;
}
