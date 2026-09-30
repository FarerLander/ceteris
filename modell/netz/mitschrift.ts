import { BAUSTEINE, BAUSTEIN_IDS } from "../bausteine";
import { rechne } from "../rechne";
import type {
  Baustein,
  BausteinId,
  Landesdaten,
  Szenario,
  Zustand,
} from "../typen";

export interface Spur {
  id: BausteinId;
  liest: Set<string>; // im selben Jahr von einem früheren Baustein geschrieben
  liestVorjahr: Set<string>; // Stand des Vorjahres
  schreibt: Set<string>;
  stell: Set<string>; // abgefragte Stellschrauben
}
export interface Mitschrift {
  spuren: Spur[];
  schreiber: Record<string, BausteinId>; // Feld → erster Baustein, der es schreibt
}
export interface Kante {
  von: BausteinId;
  nach: BausteinId;
  groessen: string[];
  vorjahr: boolean; // nur über Vorjahreswerte verbunden
}

const STELL_ZUGRIFFE = new Set(["w", "wBei", "aenderung", "verzoegert"]);

// Rechnet das Szenario kurz mit eingewickelten Bausteinen und notiert jeden Zugriff. Die Rechnung selbst bleibt gleich.
export function mitschriftVerlauf(
  land: Landesdaten,
  sz: Szenario,
  jahre = 6,
): { mitschrift: Mitschrift; verlauf: Zustand[] } {
  const spuren: Spur[] = BAUSTEIN_IDS.map((id) => ({
    id,
    liest: new Set(),
    liestVorjahr: new Set(),
    schreibt: new Set(),
    stell: new Set(),
  }));
  const schreiber: Record<string, BausteinId> = {};
  let diesesJahr = new Set<string>();
  const gewickelt: Baustein[] = BAUSTEINE.map((b, i) => (alt, neu, k) => {
    if (i === 0) diesesJahr = new Set();
    const s = spuren[i];
    const selbst = new Set<string>();
    const a = new Proxy(alt, {
      get(t, p) {
        if (typeof p === "string") s.liestVorjahr.add(p);
        return Reflect.get(t, p);
      },
    });
    const n = new Proxy(neu, {
      get(t, p) {
        if (typeof p === "string" && !selbst.has(p))
          (diesesJahr.has(p) ? s.liest : s.liestVorjahr).add(p);
        return Reflect.get(t, p);
      },
      set(t, p, v) {
        if (typeof p === "string") {
          selbst.add(p);
          diesesJahr.add(p);
          s.schreibt.add(p);
          schreiber[p] ??= s.id;
        }
        return Reflect.set(t, p, v);
      },
    });
    const kk = new Proxy(k, {
      get(t, p) {
        const f = Reflect.get(t, p);
        if (
          typeof p !== "string" ||
          !STELL_ZUGRIFFE.has(p) ||
          typeof f !== "function"
        )
          return f;
        return (id: string, ...rest: unknown[]) => {
          s.stell.add(id);
          return (f as (...x: unknown[]) => unknown)(id, ...rest);
        };
      },
    });
    b(a, n, kk);
  });
  const verlauf = rechne(
    land,
    { ...sz, jahre: Math.min(sz.jahre, jahre) },
    gewickelt,
  );
  return { mitschrift: { spuren, schreiber }, verlauf };
}

export function schreibeMit(
  land: Landesdaten,
  sz: Szenario,
  jahre = 6,
): Mitschrift {
  return mitschriftVerlauf(land, sz, jahre).mitschrift;
}

export function landkarte(m: Mitschrift): Kante[] {
  const kanten = new Map<string, Kante>();
  for (const s of m.spuren) {
    for (const [menge, vorjahr] of [
      [s.liest, false],
      [s.liestVorjahr, true],
    ] as const) {
      for (const f of menge) {
        const von = m.schreiber[f];
        if (!von || von === s.id) continue;
        const key = `${von}>${s.id}`;
        const k = kanten.get(key) ?? {
          von,
          nach: s.id,
          groessen: [],
          vorjahr: true,
        };
        if (!k.groessen.includes(f)) k.groessen.push(f);
        if (!vorjahr) k.vorjahr = false;
        kanten.set(key, k);
      }
    }
  }
  return [...kanten.values()];
}

export function feldNetz(m: Mitschrift): Map<string, Set<string>> {
  const netz = new Map<string, Set<string>>();
  for (const s of m.spuren)
    for (const r of [...s.liest, ...s.liestVorjahr])
      for (const w of s.schreibt) {
        if (r === w) continue;
        if (!netz.has(r)) netz.set(r, new Set());
        netz.get(r)!.add(w);
      }
  return netz;
}

export function stellFelder(m: Mitschrift, id: string): Set<string> {
  const felder = new Set<string>();
  for (const s of m.spuren)
    if (s.stell.has(id)) for (const w of s.schreibt) felder.add(w);
  return felder;
}
