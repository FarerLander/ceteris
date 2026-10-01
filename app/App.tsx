import { useEffect, useRef, useState, type TouchEvent } from "react";
import {
  darfWischen,
  ladeEingeklappt,
  speichereEingeklappt,
  useHandy,
} from "./bildschirm";
import { Detaildiagramm } from "./komponenten/Detaildiagramm";
import { ErzaehlungKarte } from "./komponenten/Erzaehlung";
import { Kacheln } from "./komponenten/Kacheln";
import { Kopfleiste } from "./komponenten/Kopfleiste";
import { Annahmen } from "./komponenten/Annahmen";
import type { Ansicht } from "./komponenten/ansichten";
import { Rueckblick } from "./komponenten/Rueckblick";
import { Seitenleiste } from "./komponenten/Seitenleiste";
import { Vergleich } from "./komponenten/Vergleich";
import { Wege } from "./komponenten/Wege";
import { Warnlampen } from "./komponenten/Warnlampen";
import { Wetterband } from "./komponenten/Wetterband";
import { Wirkungsnetz } from "./komponenten/Wirkungsnetz";
import { stellschrauben } from "../modell/verzeichnis";
import { LAENDER, landAusLink } from "./land";
import type { Landesdaten } from "../modell/typen";
import { useSimulation } from "./simulation";
import { Symbole } from "./Symbole";
import { Einladung, Rueckfrage } from "./tour/Einladung";
import { ladeTour, speichereTour } from "./tour/speicher";
import { startTour, Tour, useTourStart } from "./tour/Tour";
import type { Szenario } from "../modell/typen";
import type { KapitelId, TourUi } from "./tour/typen";
import { kodiere } from "../modell/szenario-code";
import {
  setzeSprache as setzeModellSprache,
  t,
  type Sprache,
} from "../modell/sprache";
import { ladeSprache, speichereSprache } from "./sprache";

const VERFUEGBAR: Ansicht[] = [
  "uebersicht",
  "vergleich",
  "wirkungsnetz",
  "rueckblick",
  "annahmen",
];

function ausHash(): { ansicht: Ansicht; fokus: string | null } {
  const h = typeof window === "undefined" ? "" : window.location.hash.slice(1);
  const [name, fokus] = h.split(":");
  const ansicht = (VERFUEGBAR as string[]).includes(name)
    ? (name as Ansicht)
    : "uebersicht";
  const bekannt =
    fokus && stellschrauben().some((e) => e.id === fokus) ? fokus : null;
  return { ansicht, fokus: ansicht === "wirkungsnetz" ? bekannt : null };
}

// Sprache der Seite und Titel im Browser-Tab.
function seiteIn(s: Sprache): void {
  if (typeof document === "undefined") return;
  document.documentElement.lang = s;
  document.title = s === "de" ? "Ceteris – Wirtschaftssimulator" : "Ceteris – Economy Simulator";
}

export function App() {
  const [code, setCode] = useState(landAusLink);
  const [spr, setSpr] = useState<Sprache>(() => {
    const s = ladeSprache();
    setzeModellSprache(s);
    seiteIn(s);
    return s;
  });
  const setzeSprache = (s: Sprache) => {
    setzeModellSprache(s);
    speichereSprache(s);
    seiteIn(s);
    setSpr(s);
  };
  const setzeLand = (c: string) => {
    // Adresszeile vor dem Neuaufbau zurücksetzen, damit kein Szenario des alten Landes ins neue gerät.
    const spr = new URLSearchParams(window.location.search).get("sprache");
    const teile = [
      c === "DE" ? "" : `l=${c}`,
      spr ? `sprache=${spr}` : "",
    ].filter(Boolean);
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${teile.length ? `?${teile.join("&")}` : ""}${window.location.hash}`,
    );
    setCode(c);
  };
  // Stand der Tour über den Neuaufbau hinweg (Sprachwechsel im letzten Schritt).
  const tourStand = useRef<TourStand>({ laufend: null, letzter: false, vorher: null });
  // Neuaufbau bei Land- oder Sprachwechsel; das Szenario steht in der Adresse und bleibt.
  return (
    <Ansichten
      key={`${code}-${spr}`}
      land={LAENDER[code]}
      setzeLand={setzeLand}
      setzeSprache={setzeSprache}
      tourStand={tourStand}
    />
  );
}

// Laufende Tour, ob ihr letzter Schritt erreicht ist, und der Stand vor ihrem Start (Szenario als Link-Code).
interface TourStand {
  laufend: KapitelId | null;
  letzter: boolean;
  vorher: { code: string; land: string; idx: number; sz: Szenario } | null;
}

function Ansichten({
  land,
  setzeLand,
  setzeSprache,
  tourStand,
}: {
  land: Landesdaten;
  setzeLand(code: string): void;
  setzeSprache(s: Sprache): void;
  tourStand: { current: TourStand };
}) {
  const handy = useHandy();
  // Auf dem Smartphone passt ein langer Zeitraum schlecht ins Diagramm: ohne Link bis 2050.
  const sim = useSimulation(land, handy ? 26 : 51);
  const [start] = useState(ausHash);
  const [ansicht, setAnsicht] = useState<Ansicht>(start.ansicht);
  const [fokus, setFokusRoh] = useState<string | null>(start.fokus);
  const schreibeAnker = (a: Ansicht, f: string | null) =>
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${window.location.search}${a === "uebersicht" ? "" : `#${a}${a === "wirkungsnetz" && f ? `:${f}` : ""}`}`,
    );
  const setze = (a: Ansicht) => {
    setAnsicht(a);
    schreibeAnker(a, fokus);
  };
  const setzeFokus = (f: string) => {
    setFokusRoh(f);
    setAnsicht("wirkungsnetz");
    schreibeAnker("wirkungsnetz", f);
  };
  const [eingeklappt, setEingeklappt] = useState(ladeEingeklappt);
  const setzeEingeklappt = (zu: boolean) => {
    speichereEingeklappt(zu);
    setEingeklappt(zu);
  };
  // Hilfe-Modus: Die Tour darf Reiter wechseln und die Seitenleiste öffnen; was sie geöffnet hat, schließt sie wieder.
  const [tour, setTour] = useTourStart();
  const tourOeffnete = useRef(false);
  // Smartphone: Das Blatt merkt sich seine Stufe vor der Tour und kehrt beim Schließen dorthin zurück.
  const tourUi: TourUi = {
    setzeAnsicht: setze,
    setzeFokus,
    oeffneSeitenleiste(seite = 0) {
      if (handy) {
        // Seite nach oben: Das Blatt liegt fest über ihr, die Hervorhebung im Dokument; so decken sich beide.
        window.scrollTo?.({ top: 0 });
        window.dispatchEvent(new CustomEvent("ceteris-blatt", { detail: seite }));
      }
      else if (eingeklappt) {
        tourOeffnete.current = true;
        setEingeklappt(false);
      }
    },
    schliesseSeitenleiste() {
      if (handy) return void window.dispatchEvent(new CustomEvent("ceteris-blatt", { detail: -1 }));
      if (!tourOeffnete.current) return;
      tourOeffnete.current = false;
      setEingeklappt(true);
    },
  };
  // Einladung beim ersten Besuch, nicht bei einem geteilten Szenario-Link.
  const [einladen, setEinladen] = useState(
    () => !ladeTour().gesehen && !new URLSearchParams(window.location.search).has("s"),
  );
  const gesehen = () => {
    speichereTour({ ...ladeTour(), gesehen: true });
    setEinladen(false);
  };
  // Stand beim Start der Tour; hat die Tour das Szenario verändert, fragt sie am Ende nach. Hat sie nur das Jahr
  // geändert, kehrt sie still zum alten Jahr zurück.
  const [rueckfrage, setRueckfrage] = useState(false);
  const ts = tourStand.current;
  if (tour && ts.laufend !== tour.id) {
    // Neues Kapitel; eine offene Rückfrage gilt dann als „So lassen“.
    if (!ts.laufend) ts.vorher = { code: kodiere(sim.szWirksam), land: land.code, idx: sim.idx, sz: sim.sz };
    ts.laufend = tour.id;
    ts.letzter = false;
  }
  useEffect(() => {
    if (tour && rueckfrage) setRueckfrage(false);
  }, [tour]);
  const erledige = (id: KapitelId) => {
    const stand = ladeTour();
    speichereTour({ gesehen: true, erledigt: stand.erledigt.includes(id) ? stand.erledigt : [...stand.erledigt, id] });
  };
  const abschluss = (fertig: boolean, id: KapitelId) => {
    if (fertig) erledige(id);
    else speichereTour({ ...ladeTour(), gesehen: true });
    const v = ts.vorher;
    ts.laufend = null;
    ts.letzter = false;
    if (v && v.land === land.code && v.code !== kodiere(sim.szWirksam)) setRueckfrage(true);
    else {
      if (v && v.land === land.code && v.idx !== sim.idx) sim.setIdx(v.idx);
      ts.vorher = null;
    }
  };
  const tourEnde = (fertig: boolean) => {
    tourUi.schliesseSeitenleiste();
    setEinladen(false);
    if (tour) abschluss(fertig, tour.id);
    setTour(null);
    document.querySelector<HTMLElement>(".tour-menue-knopf")?.focus();
  };
  // Neuaufbau mitten in der Tour (Land- oder Sprachwechsel): Tour sauber abschließen.
  useEffect(() => {
    if (ts.laufend && !tour) abschluss(ts.letzter, ts.laufend);
  }, []);
  const rueckfrageEnde = (zurueck: boolean) => {
    const v = ts.vorher;
    if (zurueck && v) {
      sim.ladeSzenario(v.sz);
      sim.setIdx(v.idx);
    }
    ts.vorher = null;
    setRueckfrage(false);
  };
  // Smartphone: Wischen nach links oder rechts wechselt den Reiter (nicht während der Tour).
  const wisch = useRef<{ x: number; y: number } | null>(null);
  const wischStart = (ev: TouchEvent) => {
    const p = ev.touches[0];
    wisch.current =
      handy && !tour && ev.touches.length === 1 && darfWischen(ev.target)
        ? { x: p.clientX, y: p.clientY }
        : null;
  };
  const wischEnde = (ev: TouchEvent) => {
    const s = wisch.current;
    wisch.current = null;
    if (!s) return;
    const p = ev.changedTouches[0];
    const dx = p.clientX - s.x,
      dy = p.clientY - s.y;
    if (Math.abs(dx) < 70 || Math.abs(dx) < 2 * Math.abs(dy)) return;
    const i = VERFUEGBAR.indexOf(ansicht) + (dx < 0 ? 1 : -1);
    if (i < 0 || i >= VERFUEGBAR.length) return;
    setze(VERFUEGBAR[i]);
    window.scrollTo({ top: 0 });
  };
  return (
    <>
      <Symbole />
      <div className={`app${!handy && eingeklappt ? " eingeklappt" : ""}`}>
        <Seitenleiste
          sim={sim}
          setzeLand={setzeLand}
          zeigeWirkung={setzeFokus}
          handy={handy}
          setzeSprache={setzeSprache}
          eingeklappt={eingeklappt}
          setzeEingeklappt={setzeEingeklappt}
        />
        <main className="main" onTouchStart={wischStart} onTouchEnd={wischEnde}>
          <Kopfleiste ansicht={ansicht} setze={setze} verfuegbar={VERFUEGBAR} />
          {einladen && !tour && (
            <Einladung
              los={() => {
                gesehen();
                startTour("erkundung");
              }}
              spaeter={gesehen}
            />
          )}
          {/* Abschnitte tragen Anker für die Chips der Kopfleiste. */}
          {(ansicht === "uebersicht" || ansicht === "vergleich") && (
            <div className="abschnitt" id="abschnitt-lage" data-tour="lage">
              <Wetterband sim={sim} />
            </div>
          )}
          {ansicht === "uebersicht" && (
            <>
              <div className="abschnitt" id="abschnitt-zahlen" data-tour="kennzahlen">
                <Kacheln sim={sim} />
              </div>
              <div className="abschnitt" id="abschnitt-diagramm" data-tour="diagramm">
                <Detaildiagramm sim={sim} />
              </div>
              <div className="abschnitt" id="abschnitt-warnlampen" data-tour="warnlampen">
                <Warnlampen sim={sim} />
              </div>
              <div className="abschnitt" id="abschnitt-erzaehlung" data-tour="erzaehlung">
                <ErzaehlungKarte sim={sim} />
              </div>
              <div className="abschnitt" id="abschnitt-wege" data-tour="wege">
                <Wege sim={sim} />
              </div>
            </>
          )}
          {ansicht === "vergleich" && (
            <div data-tour="vergleich">
              <Vergleich sim={sim} />
            </div>
          )}
          {ansicht === "wirkungsnetz" && (
            <Wirkungsnetz sim={sim} fokus={fokus} setzeFokus={setzeFokus} />
          )}
          {ansicht === "rueckblick" && (
            <div data-tour="rueckblick">
              <Rueckblick landCode={land.code} />
            </div>
          )}
          {ansicht === "annahmen" && (
            <div data-tour="annahmen">
              <Annahmen sim={sim} />
            </div>
          )}
          <p className="foot">
            {t(
              "Datenstand {jahr}. Quellen und Annahmen im Reiter „Annahmen“ und in docs/quellen.md.",
              { jahr: sim.land.datenstand },
            )}
          </p>
        </main>
      </div>
      {tour && (
        <Tour
          key={tour.id}
          sim={sim}
          ui={tourUi}
          kapitel={tour}
          handy={handy}
          ende={tourEnde}
          letzterErreicht={() => (ts.letzter = true)}
        />
      )}
      {rueckfrage && <Rueckfrage zurueck={() => rueckfrageEnde(true)} lassen={() => rueckfrageEnde(false)} />}
    </>
  );
}
