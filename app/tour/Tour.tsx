import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { t } from "../../modell/sprache";
import type { Sim } from "../simulation";
import { momentaufnahme, naechster, vorheriger } from "./ablauf";
import { KAPITEL } from "./kapitel";
import type {
  Kapitel,
  KapitelId,
  Momentaufnahme,
  Schritt,
  TourUi,
} from "./typen";

// Hilfe-Modus: geführte Tour. Hebt den Bereich eines Schritts hervor, zeigt die Sprechblase daneben und
// schaltet weiter, sobald eine Mitmach-Aufgabe erledigt ist.

// Pause nach einer erledigten Aufgabe, damit man die Wirkung sieht (Tests setzen 0).
export const TOUR_EINSTELLUNG = { pause: 1200 };

const EREIGNIS = "ceteris-tour";

// Startet ein Kapitel; die Ansicht hört auf das Ereignis (Einladung, Menü, Tests).
export function startTour(k: KapitelId | Kapitel): void {
  window.dispatchEvent(new CustomEvent(EREIGNIS, { detail: k }));
}

export function useTourStart(): [Kapitel | null, (k: Kapitel | null) => void] {
  const [kapitel, setKapitel] = useState<Kapitel | null>(null);
  useEffect(() => {
    const hoere = (ev: Event) => {
      const d = (ev as CustomEvent<KapitelId | Kapitel>).detail;
      setKapitel(
        typeof d === "string" ? (KAPITEL.find((k) => k.id === d) ?? null) : d,
      );
    };
    window.addEventListener(EREIGNIS, hoere);
    return () => window.removeEventListener(EREIGNIS, hoere);
  }, []);
  return [kapitel, setKapitel];
}

const ruhig = () =>
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const zielVon = (s: Schritt): HTMLElement | null =>
  s.ziel
    ? document.querySelector<HTMLElement>(`[data-tour="${s.ziel}"]`)
    : null;

export function Tour({
  sim,
  ui,
  kapitel,
  handy,
  ende,
}: {
  sim: Sim;
  ui: TourUi;
  kapitel: Kapitel;
  handy: boolean;
  ende(fertig: boolean): void;
}) {
  const passt = (s: Schritt) => !s.nurWenn || s.nurWenn(sim);
  const [nr, setNr] = useState(() => kapitel.schritte.findIndex(passt));
  const [erledigt, setErledigt] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const start = useRef<Momentaufnahme>(momentaufnahme(sim));
  const schritt: Schritt | undefined = kapitel.schritte[nr];

  const weiter = () => {
    const n = naechster({ kapitel, nr }, passt);
    if (n) setNr(n.nr);
    else ende(true);
  };
  const zurueck = () => setNr(vorheriger({ kapitel, nr }, passt).nr);

  // Kein anwendbarer Schritt: sofort fertig.
  useEffect(() => {
    if (nr < 0) ende(true);
  }, [nr]);

  // Neuer Schritt: vorbereiten, Ziel suchen, hinscrollen; fehlt das Ziel, weiter.
  useEffect(() => {
    if (!schritt) return;
    schritt.vorbereiten?.(ui);
    if (schritt.seitenleiste !== undefined)
      ui.oeffneSeitenleiste(schritt.seitenleiste);
    else ui.schliesseSeitenleiste();
    start.current = momentaufnahme(sim);
    setErledigt(false);
    setRect(null);
    let el: HTMLElement | null = null;
    const miss = () => el && setRect(el.getBoundingClientRect());
    const id = window.requestAnimationFrame(() => {
      el = zielVon(schritt);
      if (schritt.ziel && !el) return weiter();
      el?.scrollIntoView?.({
        block: "center",
        behavior: ruhig() ? "auto" : "smooth",
      });
      miss();
    });
    window.addEventListener("scroll", miss, true);
    window.addEventListener("resize", miss);
    return () => {
      window.cancelAnimationFrame(id);
      window.removeEventListener("scroll", miss, true);
      window.removeEventListener("resize", miss);
    };
  }, [nr]);

  // Aufgabe am Zustand der Simulation.
  useEffect(() => {
    const a = schritt?.aufgabe;
    if (
      a?.art === "sim" &&
      !erledigt &&
      a.erledigt(start.current, momentaufnahme(sim))
    )
      setErledigt(true);
  });

  // Aufgabe als Klick im Zielbereich.
  useEffect(() => {
    const a = schritt?.aufgabe;
    if (a?.art !== "klick") return;
    const el = zielVon(schritt!);
    if (!el) return;
    const klick = (ev: Event) => {
      if ((ev.target as Element | null)?.closest?.(a.innerhalb))
        setErledigt(true);
    };
    el.addEventListener("click", klick);
    return () => el.removeEventListener("click", klick);
  }, [nr]);

  // Erledigt: kurz zeigen, dann weiter.
  useEffect(() => {
    if (!erledigt) return;
    const id = window.setTimeout(weiter, TOUR_EINSTELLUNG.pause);
    return () => window.clearTimeout(id);
  }, [erledigt]);

  const offen = !!schritt?.aufgabe && !erledigt;
  useEffect(() => {
    const taste = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") ende(false);
      else if (ev.key === "ArrowRight" && !offen) weiter();
      else if (ev.key === "ArrowLeft") zurueck();
    };
    window.addEventListener("keydown", taste);
    return () => window.removeEventListener("keydown", taste);
  });

  if (!schritt) return null;
  const vormachen = () => {
    const r = schritt.vormachen?.(sim, ui);
    if (r && "klick" in r)
      document.querySelector<HTMLElement>(r.klick)?.click();
  };
  const letzter = !naechster({ kapitel, nr }, passt);

  // Sprechblase unter dem Ziel, wenn Platz ist, sonst darüber; ohne Ziel in der Mitte.
  const BREITE = 340;
  let stil: CSSProperties | undefined;
  if (!handy && rect) {
    const links = Math.max(
      12,
      Math.min(
        window.innerWidth - BREITE - 12,
        rect.left + rect.width / 2 - BREITE / 2,
      ),
    );
    stil =
      rect.bottom + 230 < window.innerHeight
        ? { top: rect.bottom + 12, left: links }
        : {
            top: Math.max(12, rect.top - 12),
            left: links,
            transform: "translateY(-100%)",
          };
  }
  const pad = 6;
  return createPortal(
    <>
      {rect && (
        <div
          className="tour-licht"
          aria-hidden="true"
          style={{
            top: rect.top - pad,
            left: rect.left - pad,
            width: rect.width + 2 * pad,
            height: rect.height + 2 * pad,
          }}
        />
      )}
      {!rect && <div className="tour-schleier" aria-hidden="true" />}
      <div
        className={`tour-blase${handy ? " unten" : ""}${!handy && !rect ? " mitte" : ""}`}
        role="dialog"
        aria-label={t("Tour: {titel}", { titel: t(kapitel.titel) })}
        style={stil}
      >
        <div className="tour-kopf">
          <span className="tour-zaehler">
            {t("{nr} von {n}", { nr: nr + 1, n: kapitel.schritte.length })}
          </span>
          <button
            type="button"
            className="tour-zu"
            aria-label={t("Tour beenden")}
            onClick={() => ende(false)}
          >
            ✕
          </button>
        </div>
        <p aria-live="polite">{t(schritt.text)}</p>
        {erledigt && <p className="tour-geschafft">{t("Geschafft!")}</p>}
        <div className="tour-knoepfe">
          <button
            type="button"
            onClick={zurueck}
            disabled={nr === kapitel.schritte.findIndex(passt)}
          >
            {t("Zurück")}
          </button>
          {offen ? (
            <>
              <button type="button" onClick={weiter}>
                {t("Überspringen")}
              </button>
              <button type="button" className="haupt" onClick={vormachen}>
                {t("Zeig’s mir")}
              </button>
            </>
          ) : (
            <button type="button" className="haupt" onClick={weiter} autoFocus>
              {letzter ? t("Fertig") : t("Weiter")}
            </button>
          )}
        </div>
      </div>
    </>,
    document.body,
  );
}
