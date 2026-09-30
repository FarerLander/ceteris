import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { bereinigeWahl, setzeWahl } from "../modell/auswertung";
import { standardWert } from "../modell/kontext";
import { pfadWert } from "../modell/pfad";
import { aktuell, anwenden, merke, nimmZurueck, type Aenderung, type Uebernahme } from "../modell/pakete";
import { basisSzenario, rechne } from "../modell/rechne";
import type { Ausloeser, Motiv } from "../modell/politik-modus";
import type { ReihenId } from "../modell/reihen";
import { dekodiere, istBasis, kodiere } from "../modell/szenario-code";
import type {
  Grundeinstellungen,
  Landesdaten,
  SchockArt,
  Szenario,
  Zustand,
} from "../modell/typen";

export interface Sim {
  land: Landesdaten;
  sz: Szenario;
  szWirksam: Szenario; // Szenario ohne Wahl-Einträge, die im Verlauf nicht wirken (für Link und Basislinie)
  verlauf: Zustand[];
  basis: Zustand[];
  idx: number;
  setIdx: Dispatch<SetStateAction<number>>;
  detail: ReihenId;
  setDetail(id: ReihenId): void;
  wert(id: string): number;
  setzeStell(id: string, wert: number): void;
  setzeGrund(g: Partial<Grundeinstellungen>): void;
  setzeJahre(jahre: number): void;
  schockHinzu(art: SchockArt): void;
  schockJahr(id: number, jahr: number): void;
  schockWeg(id: number): void;
  uebernehme(aenderung: Aenderung, titel: string): void;
  uebernommen: Uebernahme[];
  nimmZurueck(nr: number): void;
  zuruecksetzen(): void;
  ladeSzenario(sz: Szenario): void;
  setzeAus(id: string, aus: boolean): void;
  schockSetze(id: number, teil: { staerke?: number; dauer?: number }): void;
  // Spec 13.13: Wahl an einem Entscheidungspunkt; null = zurück zur wahrscheinlichen Entscheidung.
  setzeWahl(jahr: number, a: Ausloeser, m: Motiv | null): void;
}

function wertIn(land: Landesdaten, s: Szenario, id: string): number {
  const p = s.stell[id];
  return p === undefined ? standardWert(id, land) : pfadWert(p, land.datenstand + 1);
}

function ausLink(land: Landesdaten): Szenario | null {
  if (typeof window === "undefined") return null;
  const code = new URLSearchParams(window.location.search).get("s");
  return code ? dekodiere(code, land) : null;
}

// jahre: Zeitraum ohne Szenario-Link (Smartphone 26 bis 2050, sonst 51).
export function useSimulation(land: Landesdaten, jahre = 51): Sim {
  const [sz, setSz] = useState<Szenario>(() => ausLink(land) ?? basisSzenario(land, jahre));
  const [idx, setIdx] = useState(15);
  const [detail, setDetail] = useState<ReihenId>("schuldQuote");
  const [uebernommen, setUebernommen] = useState<Uebernahme[]>([]);
  const paketNr = useRef(0);
  const schockNr = useRef(Math.max(0, ...sz.schocks.map((s) => s.id)));
  const gleiten = useRef(0);
  const gleitZiel = useRef<Record<string, number> | null>(null);
  const verlauf = useMemo(() => rechne(land, sz), [land, sz]);
  const basis = useMemo(
    () => rechne(land, basisSzenario(land, sz.jahre)),
    [land, sz.jahre],
  );

  // Spec 13.13 (G6): Wahl-Einträge, deren Punkt es im aktuellen Verlauf nicht gibt, wirken nicht. Das Szenario
  // behält sie (ein Zwischenstand beim Ziehen eines Reglers oder ein kürzerer Zeitraum soll die Wahl nicht
  // löschen); in den Link und in die Frage „Basislinie?“ geht nur, was wirkt.
  const szWirksam = useMemo(() => bereinigeWahl(sz, verlauf), [sz, verlauf]);

  // Das Szenario steht in der Adresszeile; die Basislinie ohne Parameter. Gedrosselt, weil Browser
  // häufige replaceState-Aufrufe mit einem Fehler blocken (Safari, Firefox).
  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        // Eine Sprache aus dem Link bleibt erhalten, damit geteilte Links ihre Sprache behalten.
        const spr = new URLSearchParams(window.location.search).get("sprache");
        const teile = [land.code === "DE" ? "" : `l=${land.code}`, istBasis(szWirksam, land) ? "" : `s=${kodiere(szWirksam)}`, spr ? `sprache=${spr}` : ""].filter(Boolean);
        const suche = teile.length ? `?${teile.join("&")}` : "";
        window.history.replaceState(null, "", `${window.location.pathname}${suche}${window.location.hash}`);
      } catch {
        // Gedrosselt: Beim nächsten Änderungsschub wird der Link erneut geschrieben.
      }
    }, 250);
    return () => window.clearTimeout(id);
  }, [szWirksam, land]);

  // Läuft noch ein Gleiten, springt es sofort ans Ziel; danach gilt die neue Eingabe.
  const beendeGleiten = () => {
    cancelAnimationFrame(gleiten.current);
    const ziel = gleitZiel.current;
    gleitZiel.current = null;
    if (ziel) setSz((s) => ({ ...s, stell: { ...s.stell, ...ziel } }));
  };
  const verwerfeGleiten = () => {
    cancelAnimationFrame(gleiten.current);
    gleitZiel.current = null;
  };

  return {
    land,
    sz,
    szWirksam,
    verlauf,
    basis,
    idx,
    setIdx,
    detail,
    setDetail,
    uebernommen,
    wert: (id) => aktuell(land, sz, id),
    setzeStell: (id, wert) => {
      beendeGleiten();
      setSz((s) => {
        const stell = { ...s.stell };
        if (Math.abs(wert - standardWert(id, land)) < 1e-9) delete stell[id];
        else stell[id] = wert;
        return { ...s, stell };
      });
    },
    setzeGrund: (g) => {
      beendeGleiten();
      setSz((s) => ({ ...s, grund: { ...s.grund, ...g } }));
    },
    setzeJahre: (jahre) => {
      beendeGleiten();
      // Schocks bleiben erhalten; außerhalb des Zeitraums ignoriert sie die Rechnung.
      setSz((s) => ({ ...s, jahre }));
      setIdx((i) => Math.min(i, jahre - 1));
    },
    schockHinzu: (art) => {
      beendeGleiten();
      setSz((s) => {
        const jahr = land.datenstand + Math.max(1, idx);
        if (s.schocks.some((x) => x.jahr === jahr && x.art === art)) return s;
        return { ...s, schocks: [...s.schocks, { id: ++schockNr.current, art, jahr, staerke: 1, dauer: 1 }] };
      });
    },
    schockJahr: (id, jahr) => {
      if (jahr <= land.datenstand || jahr >= land.datenstand + sz.jahre) return;
      beendeGleiten();
      setSz((s) => ({ ...s, schocks: s.schocks.map((x) => (x.id === id ? { ...x, jahr } : x)) }));
      setIdx(jahr - land.datenstand);
    },
    schockWeg: (id) => {
      beendeGleiten();
      setSz((s) => ({ ...s, schocks: s.schocks.filter((x) => x.id !== id) }));
    },
    schockSetze: (id, teil) => {
      beendeGleiten();
      setSz((s) => ({ ...s, schocks: s.schocks.map((x) => (x.id === id ? { ...x, ...teil } : x)) }));
    },
    setzeAus: (id, an) => {
      beendeGleiten();
      setSz((s) => ({ ...s, aus: an ? [...new Set([...s.aus, id])] : s.aus.filter((x) => x !== id) }));
    },
    setzeWahl: (jahr, a, m) => {
      beendeGleiten();
      setSz((s) => setzeWahl(land, s, jahr, a, m));
    },
    uebernehme: (aenderung, titel) => {
      // Ein noch gleitendes Paket gilt als vollständig übernommen, bevor das nächste kommt.
      const offen = gleitZiel.current;
      verwerfeGleiten();
      const aufgeloest: Szenario = offen ? { ...sz, stell: { ...sz.stell, ...offen } } : sz;
      const ziel = anwenden(aufgeloest, aenderung);
      setUebernommen((l) => [...l, merke(++paketNr.current, titel, aufgeloest, aenderung)]);
      const ruhig = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      if (ruhig) {
        setSz(ziel);
        return;
      }
      const ids = Object.keys(aenderung.stell);
      const von = Object.fromEntries(ids.map((id) => [id, wertIn(land, aufgeloest, id)]));
      const nach = Object.fromEntries(ids.map((id) => [id, wertIn(land, ziel, id)]));
      gleitZiel.current = nach;
      setSz((s) => ({ ...s, grund: ziel.grund, stell: { ...s.stell, ...(offen ?? {}) } }));
      const t0 = performance.now();
      const schritt = () => {
        const f = Math.min(1, (performance.now() - t0) / 400);
        const e = 1 - (1 - f) ** 3;
        const zwischen = Object.fromEntries(ids.map((id) => [id, von[id] + (nach[id] - von[id]) * e]));
        setSz((s) => ({ ...s, stell: { ...s.stell, ...zwischen } }));
        if (f < 1) gleiten.current = requestAnimationFrame(schritt);
        else gleitZiel.current = null;
      };
      gleiten.current = requestAnimationFrame(schritt);
    },
    nimmZurueck: (nr) => {
      // Ein noch gleitendes Paket gilt als vollständig übernommen, dann wird zurückgenommen.
      const offen = gleitZiel.current;
      verwerfeGleiten();
      const aufgeloest: Szenario = offen ? { ...sz, stell: { ...sz.stell, ...offen } } : sz;
      const r = nimmZurueck(aufgeloest, uebernommen, nr);
      setSz(r.sz);
      setUebernommen(r.liste);
    },
    zuruecksetzen: () => {
      verwerfeGleiten();
      setSz(basisSzenario(land, sz.jahre));
      setUebernommen([]);
    },
    ladeSzenario: (neu) => {
      verwerfeGleiten();
      schockNr.current = Math.max(0, ...neu.schocks.map((s) => s.id));
      setSz(neu);
      setUebernommen([]);
    },
  };
}
