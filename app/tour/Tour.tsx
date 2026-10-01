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
  letzterErreicht,
}: {
  sim: Sim;
  ui: TourUi;
  kapitel: Kapitel;
  handy: boolean;
  ende(fertig: boolean): void;
  letzterErreicht?(): void; // für einen Abschluss, falls die Ansicht im letzten Schritt neu aufgebaut wird
}) {
  const passt = (s: Schritt) => !s.nurWenn || s.nurWenn(sim);
  const [nr, setNr] = useState(() => kapitel.schritte.findIndex(passt));
  const [erledigt, setErledigt] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  // Ziel gefunden; bis dahin bleibt die Sprechblase weg.
  const [gefunden, setGefunden] = useState(false);
  const start = useRef<Momentaufnahme>(momentaufnahme(sim));
  const blase = useRef<HTMLDivElement>(null);
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
    setGefunden(!schritt.ziel);
    let el: HTMLElement | null = null;
    const miss = () => el && setRect(el.getBoundingClientRect());
    // Nach einem Reiterwechsel ist das Ziel erst nach dem nächsten Zeichnen da: bis zu einer Sekunde warten,
    // erst dann gilt der Schritt als nicht anwendbar.
    let versuche = 0;
    let id = 0;
    const suche = () => {
      el = zielVon(schritt);
      if (schritt.ziel && !el) {
        if (++versuche > 20) return weiter();
        id = window.setTimeout(suche, 50);
        return;
      }
      setGefunden(true);
      // Smartphone: Ziel nach oben, damit die Karte unten es nicht verdeckt.
      // Im Blatt steht die Karte oben, also dort in die Mitte.
      const oben = handy && schritt.seitenleiste === undefined;
      el?.scrollIntoView?.({ block: oben ? "start" : "center", behavior: ruhig() ? "auto" : "smooth" });
      miss();
    };
    suche();
    window.addEventListener("scroll", miss, true);
    window.addEventListener("resize", miss);
    // Sanftes Scrollen meldet nicht überall jedes Ereignis: zusätzlich regelmäßig nachmessen.
    const takt = window.setInterval(miss, 250);
    return () => {
      window.clearInterval(takt);
      window.clearTimeout(id);
      window.removeEventListener("scroll", miss, true);
      window.removeEventListener("resize", miss);
    };
  }, [nr]);

  // Aufgabe am Zustand der Simulation.
  useEffect(() => {
    const a = schritt?.aufgabe;
    if (erledigt || !a) return;
    if (a.art === "sim" ? a.erledigt(start.current, momentaufnahme(sim)) : a.art === "pruefe" && a.erledigt())
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
      // Tasten in Eingabefeldern, Auswahllisten und Reglern gehören dem Feld.
      const z = ev.target as HTMLElement | null;
      if (ev.defaultPrevented || z?.closest?.("input, select, textarea, [contenteditable=true], [role=slider]")) return;
      if (ev.key === "Escape") ende(false);
      else if (ev.key === "ArrowRight" && !offen) weiter();
      else if (ev.key === "ArrowLeft") zurueck();
    };
    window.addEventListener("keydown", taste);
    return () => window.removeEventListener("keydown", taste);
  });

  // Fokus in die Sprechblase, sobald sie steht (auch bei Mitmach-Schritten ohne „Weiter“).
  useEffect(() => {
    if (gefunden || !schritt?.ziel) blase.current?.querySelector<HTMLElement>(".haupt")?.focus({ preventScroll: true });
  }, [nr, gefunden, offen]);
  // Letzter Schritt erreicht: Das Kapitel zählt als erledigt, auch wenn die Ansicht jetzt neu aufgebaut wird.
  useEffect(() => {
    if (schritt && !naechster({ kapitel, nr }, passt)) letzterErreicht?.();
  }, [nr]);

  if (!schritt || (schritt.ziel && !gefunden)) return null;
  const vormachen = () => {
    const r = schritt.vormachen?.(sim, ui);
    // Als Ereignis, nicht .click(): Die Bausteine des Wirkungsnetzes sind SVG-Elemente.
    if (r && "klick" in r) document.querySelector(r.klick)?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
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
    // Großes Ziel ohne Platz darüber und darunter: unten rechts im Bild.
    stil =
      rect.bottom + 230 < window.innerHeight
        ? { top: rect.bottom + 12, left: links }
        : rect.top > 242
          ? { top: rect.top - 12, left: links, transform: "translateY(-100%)" }
          : { bottom: 16, right: 16 };
  }
  const pad = 6;
  return createPortal(
    <>
      {rect && (
        <div
          className="tour-licht"
          aria-hidden="true"
          // Im Dokument verankert, nicht am Bildschirm: Auf dem Smartphone verschiebt sich „fixed“ gegen den
          // sichtbaren Ausschnitt, und so scrollt die Hervorhebung von selbst mit.
          style={{
            top: rect.top + window.scrollY - pad,
            left: rect.left + window.scrollX - pad,
            width: rect.width + 2 * pad,
            height: rect.height + 2 * pad,
          }}
        />
      )}
      {!rect && <div className="tour-schleier" aria-hidden="true" />}
      <div
        className={`tour-blase${handy ? " unten" : ""}${handy && schritt.seitenleiste !== undefined && (!rect || rect.top + rect.height / 2 > window.innerHeight / 2) ? " oben" : ""}${!handy && !rect ? " mitte" : ""}`}
        role="dialog"
        ref={blase}
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
            <button type="button" className="haupt" onClick={weiter}>
              {letzter ? t("Fertig") : t("Weiter")}
            </button>
          )}
        </div>
      </div>
    </>,
    document.body,
  );
}
