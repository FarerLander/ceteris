import { fmt } from "./format";
import { locale, t } from "./sprache";
import type { ReihenId } from "./reihen";
import type { Konsens, KonsensGroesse, Zustand } from "./typen";

// Welche offizielle Größe zu welchem Diagramm gehört (Spec 12a).
export const KONSENS_REIHE: Partial<Record<ReihenId, KonsensGroesse>> = {
  bipProKopf: "wachstum",
  inflation: "inflation",
  alq: "alq",
  schuldQuote: "schuldQuote",
  primaer: "defizit",
};

// Bis zu diesem Abstand (Pp.) deckt sich das Modell mit einer Quelle.
export const TOLERANZ: Record<KonsensGroesse, number> = {
  wachstum: 0.3,
  inflation: 0.3,
  alq: 0.5,
  defizit: 0.5,
  schuldQuote: 3,
};

const NAME: Record<KonsensGroesse, string> = {
  wachstum: "Wachstum",
  inflation: "Inflation",
  alq: "Arbeitslosigkeit",
  defizit: "Finanzierungssaldo mit Zinsen",
  schuldQuote: "Staatsschuld",
};
const EINHEIT: Record<KonsensGroesse, string> = {
  wachstum: "%",
  inflation: "%",
  alq: "%",
  defizit: "% BIP",
  schuldQuote: "% BIP",
};

export function modellWert(z: Zustand, g: KonsensGroesse): number {
  if (g === "wachstum") return z.wachstum * 100;
  if (g === "defizit") return z.primaer - z.zinsausgaben;
  return z[g];
}

function datum(stand: string): Date | null {
  const d = new Date(stand);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function istVeraltet(stand: string, heute: Date): boolean {
  const d = datum(stand);
  if (!d) return true;
  const grenze = new Date(heute);
  grenze.setFullYear(grenze.getFullYear() - 1);
  return d < grenze;
}

// Monat und Jahr des Stands. UTC, sonst rutscht der Monatserste westlich von Greenwich in den Vormonat.
export function standText(stand: string): string {
  const d = datum(stand);
  return d ? d.toLocaleDateString(locale(), { month: "short", year: "numeric", timeZone: "UTC" }) : t("Stand unbekannt");
}

export interface KonsensPunkte {
  kurz: string;
  stand: string;
  veraltet: boolean;
  abgrenzung?: string;
  werte: Record<number, number>;
}

// Punkte fürs Diagramm. Wachstum wird ab dem Startjahr zum BIP pro Kopf verkettet
// (Bevölkerung aus dem Modell) und endet an der ersten Lücke. Der Saldo bekommt nur Sätze.
export function konsensPunkte(
  konsens: Konsens | undefined,
  verlauf: Zustand[],
  id: ReihenId,
  heute = new Date(),
): KonsensPunkte[] {
  const g = KONSENS_REIHE[id];
  if (!konsens || !g || g === "defizit") return [];
  const start = verlauf[0].jahr;
  const aus: KonsensPunkte[] = [];
  for (const q of konsens.quellen) {
    const r = q.werte[g];
    if (!r) continue;
    const werte: Record<number, number> = {};
    if (g === "wachstum") {
      let vor = verlauf[0];
      let proKopf = vor.bipProKopf;
      for (const z of verlauf.slice(1)) {
        const w = r[z.jahr];
        if (w === undefined) break;
        proKopf *= (1 + w / 100) * (vor.bev / z.bev);
        werte[z.jahr] = proKopf;
        vor = z;
      }
    } else {
      for (const z of verlauf)
        if (z.jahr > start && r[z.jahr] !== undefined)
          werte[z.jahr] = r[z.jahr];
    }
    if (Object.keys(werte).length)
      aus.push({
        kurz: q.kurz,
        stand: q.stand,
        veraltet: istVeraltet(q.stand, heute),
        abgrenzung: q.abgrenzung?.[g],
        werte,
      });
  }
  return aus;
}

const mittel = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

// Ein Satz je Quelle für das (i) des Diagramms.
export function konsensSaetze(
  konsens: Konsens | undefined,
  verlauf: Zustand[],
  id: ReihenId,
  heute = new Date(),
): string[] {
  const g = KONSENS_REIHE[id];
  if (!konsens || !g) return [];
  const start = verlauf[0].jahr;
  const saetze: string[] = [];
  for (const q of konsens.quellen) {
    const r = q.werte[g];
    if (!r) continue;
    const gemeinsam = verlauf.filter(
      (z) => z.jahr > start && r[z.jahr] !== undefined,
    );
    if (!gemeinsam.length) continue;
    const von = gemeinsam[0].jahr;
    const bis = gemeinsam[gemeinsam.length - 1].jahr;
    const quelle = `${q.kurz} (${standText(q.stand)}${istVeraltet(q.stand, heute) ? `, ${t("veraltet")}` : ""})`;
    const pegel = g === "schuldQuote";
    const m = pegel
      ? modellWert(gemeinsam[gemeinsam.length - 1], g)
      : mittel(gemeinsam.map((z) => modellWert(z, g)));
    const w = pegel ? r[bis] : mittel(gemeinsam.map((z) => r[z.jahr]));
    const dez = pegel ? 0 : 1;
    const zeit = pegel
      ? `${bis}`
      : von === bis
        ? `${von}`
        : t("im Schnitt {von}–{bis}", { von, bis });
    const kopf = t("{groesse} {zeit}: Modell {m} {einheit}, {quelle} {w} {einheit}.", { groesse: t(NAME[g]), zeit, m: fmt(m, dez), einheit: t(EINHEIT[g]), quelle, w: fmt(w, dez) });
    const abgrenzung = q.abgrenzung?.[g];
    if (abgrenzung) {
      saetze.push(
        `${kopf} ${t("Andere Abgrenzung ({abgrenzung}), kein direkter Vergleich.", { abgrenzung: t(abgrenzung) })}`,
      );
      continue;
    }
    if (Math.abs(m - w) <= TOLERANZ[g]) {
      saetze.push(`${kopf} ${t("Deckt sich mit {quelle}.", { quelle: q.kurz })}`);
      continue;
    }
    const tiefer = m < w;
    const richtung =
      g === "wachstum"
        ? tiefer
          ? t("Das Modell ist vorsichtiger")
          : t("Das Modell ist optimistischer")
        : tiefer
          ? t("Das Modell liegt darunter")
          : t("Das Modell liegt darüber");
    const grund = tiefer
      ? konsens.gruende[g]?.tiefer
      : konsens.gruende[g]?.hoeher;
    saetze.push(`${kopf} ${grund ? t("{richtung}, weil {grund}.", { richtung, grund: t(grund) }) : `${richtung}.`}`);
  }
  return saetze;
}
