import { tk } from "./sprache";
import { standardWert } from "./kontext";
import { MASSE, masse, type MassId, type Masse } from "./masse";
import { pfadWert } from "./pfad";
import { rechne } from "./rechne";
import type {
  Grundeinstellungen,
  Landesdaten,
  Pfad,
  Szenario,
  Zustand,
} from "./typen";

export interface Aenderung {
  stell: Record<string, number>;
  grund?: Partial<Grundeinstellungen>;
}
export interface Paket {
  id: string;
  titel: string;
  baustein: string;
  warum: string;
  preis: string;
  quelle: string;
  setze(
    w: (id: string) => number,
    basis: (id: string) => number,
    g: Grundeinstellungen,
  ): Aenderung;
}
export interface Bewertung {
  paket: Paket;
  aenderung: Aenderung;
  geaendert: string[];
  masse: Masse; // Spec 13.13: die fünf Maße gegen den aktuellen Verlauf, im Endjahr
  zuwachs: number;
  schuld: number;
  krise: number;
  jahr: number;
}

export function aktuell(land: Landesdaten, sz: Szenario, id: string): number {
  const p = sz.stell[id];
  return p === undefined
    ? standardWert(id, land)
    : pfadWert(p, land.datenstand + 1);
}

export const PAKETE: Paket[] = [
  {
    id: "arbeit",
    titel: "Länger arbeiten",
    baustein: "Rente",
    warum:
      "Mehr Menschen arbeiten, weniger beziehen Rente. Das stützt Wachstum und Haushalt zugleich.",
    preis:
      "Härte für körperlich schwere Berufe. Braucht Ausnahmen oder einen flexiblen Übergang.",
    quelle: "OECD Pensions at a Glance",
    setze: (w) => ({
      stell: {
        "rente.alter": Math.max(w("rente.alter"), 69),
        "rente.niveau": Math.min(w("rente.niveau"), 47),
      },
    }),
  },
  {
    id: "fachkraefte",
    titel: "Fachkräfte gewinnen und schnell integrieren",
    baustein: "Migration",
    warum:
      "Junge, qualifizierte Zuwanderung mit schnellem Arbeitsmarktzugang zahlt über das Arbeitsleben mehr ein, als sie kostet.",
    preis:
      "Braucht Wohnraum, Sprachkurse und schnellere Berufsanerkennung. Das kostet zuerst Geld.",
    quelle: "OECD International Migration Outlook; ZEW",
    setze: (w) => ({
      stell: {
        "mig.netto": Math.max(w("mig.netto"), 450),
        "mig.anteilHoch": Math.max(w("mig.anteilHoch"), 0.55),
        "mig.anteilMittel": Math.min(w("mig.anteilMittel"), 1 - Math.max(w("mig.anteilHoch"), 0.55)),
        "mig.halbwert": Math.min(w("mig.halbwert"), 3),
        "mig.integrationspolitik": Math.max(w("mig.integrationspolitik"), 0.8),
      },
    }),
  },
  {
    id: "gruendungen",
    titel: "Gründungen finanzieren",
    baustein: "Innovation",
    warum:
      "Mehr Forschung und Wagniskapital heben die Produktivität. Kapitalgedeckte Rentenfonds liefern das Geld dafür.",
    preis:
      "Wirkt erst nach 5 bis 10 Jahren. Der Umstieg auf Kapitaldeckung belastet anfangs doppelt.",
    quelle: "Kortum/Lerner 2000",
    setze: (w, _b, g) => ({
      stell: {
        "innov.fue": Math.max(w("innov.fue"), 4.5),
        "innov.pensionsfondsVC": 1,
        "steuer.kapitalertrag": Math.min(w("steuer.kapitalertrag"), 0.22),
      },
      grund:
        g.rentensystem === "umlage" ? { rentensystem: "mischung" } : undefined,
    }),
  },
  {
    id: "energie",
    titel: "Energie schneller umbauen",
    baustein: "Energie",
    warum:
      "Schneller Ausbau senkt den Energiepreis auf lange Sicht und macht unabhängiger von Importen.",
    preis:
      "Hohe Investitionen in den ersten Jahren, dazu Netz- und Speicherausbau.",
    quelle: "IEA World Energy Outlook",
    setze: (w) => ({
      stell: {
        "energie.ausbauTempo": Math.max(w("energie.ausbauTempo"), 4.2),
        "energie.netzInvest": Math.max(w("energie.netzInvest"), 1),
      },
    }),
  },
  {
    id: "haushalt",
    titel: "Staatshaushalt entlasten",
    baustein: "Staat",
    warum:
      "Weniger Ausgaben und längere Laufzeiten halten Schuldenquote und Risikoaufschlag niedrig. Das senkt die Zinslast dauerhaft.",
    preis:
      "Kurzfristig mehr Arbeitslosigkeit. Die Kürzungen treffen konkrete Bereiche.",
    quelle: "Lehrbuch Schuldendynamik; Bohn 1998",
    setze: (w, b) => ({
      stell: {
        "staat.uebrige": Math.min(w("staat.uebrige"), b("staat.uebrige") - 2),
        "anleihen.laufzeit": Math.max(w("anleihen.laufzeit"), 10),
      },
    }),
  },
  {
    id: "familie",
    titel: "Familien stärken",
    baustein: "Demografie",
    warum: "Mehr Kinder heute heißt mehr Erwerbstätige in gut 20 Jahren.",
    preis:
      "Wirkt erst nach einer Generation und kostet sofort. Familienpolitik hebt die Geburtenrate nur begrenzt.",
    quelle: "OECD Family Database",
    setze: (w) => ({
      stell: {
        "demo.geburtenrate": Math.max(w("demo.geburtenrate"), 1.6),
        "staat.familie": Math.max(w("staat.familie"), 3),
      },
    }),
  },
  {
    id: "institutionen",
    titel: "Institutionen stärken",
    baustein: "Wirtschaftsordnung",
    warum:
      "Verlässliche Gerichte, weniger Staatsbetriebe, keine Preiskontrollen und keine Notenpresse: Investitionen kehren zurück, Kapital und Fachkräfte bleiben.",
    preis:
      "Wirkt langsam, über Jahre. Das Ende von Preiskontrollen lässt die aufgestauten Preise erst einmal steigen.",
    quelle: "Acemoglu/Johnson/Robinson 2001; Kornai 1992",
    // Nur, wo ein Hebel schlechter steht als der Landesstandard; sonst ändert das Paket nichts
    // und erscheint nicht.
    setze: (w, basis) => {
      const r = w("ordnung.rechtsstaat");
      const s = w("ordnung.staatsanteil");
      const zurueck = (id: string) => Math.min(w(id), basis(id));
      return {
        stell: {
          "ordnung.rechtsstaat": r < basis("ordnung.rechtsstaat") ? Math.min(100, r + 15) : r,
          "ordnung.staatsanteil": s > basis("ordnung.staatsanteil") ? Math.max(0, s - 10) : s,
          "ordnung.preiskontrollen": zurueck("ordnung.preiskontrollen"),
          "ordnung.notenbankfinanzierung": zurueck("ordnung.notenbankfinanzierung"),
          "ordnung.kreditlenkung": zurueck("ordnung.kreditlenkung"),
        },
      };
    },
  },
];

export function anwenden(sz: Szenario, a: Aenderung): Szenario {
  return {
    ...sz,
    stell: { ...sz.stell, ...a.stell },
    grund: { ...sz.grund, ...(a.grund ?? {}) },
  };
}

// Ein Paket auf das aktuelle Szenario gerechnet: fünf Maße im Endjahr gegen `verlauf`.
// null: Das Paket ändert nichts mehr.
export function bewertePaket(land: Landesdaten, sz: Szenario, verlauf: Zustand[], paket: Paket): Bewertung | null {
  const ende = sz.jahre - 1;
  const w = (id: string) => aktuell(land, sz, id);
  const b = (id: string) => standardWert(id, land);
  const aenderung = paket.setze(w, b, sz.grund);
  const geaendert = Object.keys(aenderung.stell).filter((id) => Math.abs(aenderung.stell[id] - w(id)) > 1e-9);
  const grundNeu =
    aenderung.grund &&
    Object.entries(aenderung.grund).some(([k, v]) => sz.grund[k as keyof Grundeinstellungen] !== v);
  if (!geaendert.length && !grundNeu) return null;
  const r = rechne(land, anwenden(sz, aenderung));
  const m = masse(r, verlauf, ende);
  return {
    paket,
    aenderung,
    geaendert,
    masse: m,
    zuwachs: m.wohlstand,
    schuld: m.schuld,
    krise: r.filter((z) => z.lage === "krise").length - verlauf.filter((z) => z.lage === "krise").length,
    jahr: land.datenstand + ende,
  };
}

// Ohne `nach`: wie vor Spec 13.13 die drei Pakete mit dem größten Zuwachs, nur solche über 0,05 %.
// Mit `nach`: alle Pakete, die etwas ändern, gereiht nach dem Maß in seiner Richtung, die ersten drei.
export function bewertePakete(
  land: Landesdaten,
  sz: Szenario,
  verlauf: Zustand[],
  nach?: MassId,
): Bewertung[] {
  const liste: Bewertung[] = [];
  for (const paket of PAKETE) {
    const b = bewertePaket(land, sz, verlauf, paket);
    if (b && (nach || b.masse.wohlstand > 0.05)) liste.push(b);
  }
  const id = nach ?? "wohlstand";
  const richtung = MASSE.find((x) => x.id === id)!.mehrIstVorn ? -1 : 1;
  return liste.sort((x, y) => richtung * (x.masse[id] - y.masse[id])).slice(0, 3);
}

// Übernommene Pakete, jedes einzeln zurücknehmbar. Gemerkt wird je Stellschraube und
// Grundeinstellung der Wert davor und der vom Paket gesetzte Wert.
type GrundId = keyof Grundeinstellungen;
export interface Uebernahme {
  nr: number;
  titel: string;
  stell: Record<string, { vorher: Pfad | undefined; nachher: number }>;
  grund: Partial<Record<GrundId, { vorher: Grundeinstellungen[GrundId]; nachher: Grundeinstellungen[GrundId] }>>;
}

export function merke(nr: number, titel: string, sz: Szenario, a: Aenderung): Uebernahme {
  const stell: Uebernahme["stell"] = {};
  for (const [id, wert] of Object.entries(a.stell)) stell[id] = { vorher: sz.stell[id], nachher: wert };
  const grund: Uebernahme["grund"] = {};
  for (const [k, wert] of Object.entries(a.grund ?? {}) as [GrundId, Grundeinstellungen[GrundId]][]) {
    if (wert !== undefined && wert !== sz.grund[k]) grund[k] = { vorher: sz.grund[k], nachher: wert };
  }
  return { nr, titel, stell, grund };
}

// Nimmt ein Paket zurück. Hat ein späteres Paket denselben Hebel gesetzt, bleibt dessen Wert,
// es erbt aber den Wert von davor. Wurde der Hebel seither von Hand verstellt, bleibt er, wie er ist.
export function nimmZurueck(
  sz: Szenario,
  liste: Uebernahme[],
  nr: number,
): { sz: Szenario; liste: Uebernahme[] } {
  const i = liste.findIndex((u) => u.nr === nr);
  if (i < 0) return { sz, liste };
  const p = liste[i];
  const rest = liste.map((u) => ({ ...u, stell: { ...u.stell }, grund: { ...u.grund } }));
  rest.splice(i, 1);
  const stell = { ...sz.stell };
  const grund = { ...sz.grund };
  for (const [id, { vorher, nachher }] of Object.entries(p.stell)) {
    const spaeter = rest.slice(i).find((u) => u.stell[id]);
    if (spaeter) {
      spaeter.stell[id] = { ...spaeter.stell[id], vorher };
      continue;
    }
    const jetzt = stell[id];
    if (typeof jetzt !== "number" || Math.abs(jetzt - nachher) > 1e-9) continue;
    if (vorher === undefined) delete stell[id];
    else stell[id] = vorher;
  }
  for (const [k, g] of Object.entries(p.grund) as [GrundId, NonNullable<Uebernahme["grund"][GrundId]>][]) {
    const spaeter = rest.slice(i).find((u) => u.grund[k]);
    if (spaeter) {
      spaeter.grund[k] = { ...spaeter.grund[k]!, vorher: g.vorher };
      continue;
    }
    if (grund[k] === g.nachher) (grund as Record<GrundId, unknown>)[k] = g.vorher;
  }
  return { sz: { ...sz, stell, grund }, liste: rest };
}

// Angezeigte Texte eines Pakets in der gewählten Sprache (Spec 12c).
export const pText = (p: Paket, feld: "titel" | "baustein" | "warum" | "preis") => tk(`p:${p.id}:${feld}`, p[feld]);

