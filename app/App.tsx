import { useRef, useState, type TouchEvent } from "react";
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

export function App() {
  const [code, setCode] = useState(landAusLink);
  const [spr, setSpr] = useState<Sprache>(() => {
    const s = ladeSprache();
    setzeModellSprache(s);
    if (typeof document !== "undefined") document.documentElement.lang = s;
    return s;
  });
  const setzeSprache = (s: Sprache) => {
    setzeModellSprache(s);
    speichereSprache(s);
    document.documentElement.lang = s;
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
  // Neuaufbau bei Land- oder Sprachwechsel; das Szenario steht in der Adresse und bleibt.
  return (
    <Ansichten
      key={`${code}-${spr}`}
      land={LAENDER[code]}
      setzeLand={setzeLand}
      setzeSprache={setzeSprache}
    />
  );
}

function Ansichten({
  land,
  setzeLand,
  setzeSprache,
}: {
  land: Landesdaten;
  setzeLand(code: string): void;
  setzeSprache(s: Sprache): void;
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
  // Smartphone: Wischen nach links oder rechts wechselt den Reiter.
  const wisch = useRef<{ x: number; y: number } | null>(null);
  const wischStart = (ev: TouchEvent) => {
    const p = ev.touches[0];
    wisch.current =
      handy && ev.touches.length === 1 && darfWischen(ev.target)
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
          {/* Abschnitte tragen Anker für die Chips der Kopfleiste. */}
          {(ansicht === "uebersicht" || ansicht === "vergleich") && (
            <div className="abschnitt" id="abschnitt-lage">
              <Wetterband sim={sim} />
            </div>
          )}
          {ansicht === "uebersicht" && (
            <>
              <div className="abschnitt" id="abschnitt-zahlen">
                <Kacheln sim={sim} />
              </div>
              <div className="abschnitt" id="abschnitt-diagramm">
                <Detaildiagramm sim={sim} />
              </div>
              <div className="abschnitt" id="abschnitt-warnlampen">
                <Warnlampen sim={sim} />
              </div>
              <div className="abschnitt" id="abschnitt-erzaehlung">
                <ErzaehlungKarte sim={sim} />
              </div>
              <div className="abschnitt" id="abschnitt-wege">
                <Wege sim={sim} />
              </div>
            </>
          )}
          {ansicht === "vergleich" && <Vergleich sim={sim} />}
          {ansicht === "wirkungsnetz" && (
            <Wirkungsnetz sim={sim} fokus={fokus} setzeFokus={setzeFokus} />
          )}
          {ansicht === "rueckblick" && <Rueckblick landCode={land.code} />}
          {ansicht === "annahmen" && <Annahmen sim={sim} />}
          <p className="foot">
            {t(
              "Datenstand {jahr}. Quellen und Annahmen im Reiter „Annahmen“ und in docs/quellen.md.",
              { jahr: sim.land.datenstand },
            )}
          </p>
        </main>
      </div>
    </>
  );
}
