import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { fmt } from "../../modell/format";
import {
  KACHELN,
  REIHEN,
  einheitFuer,
  rName,
  wertVon,
  type ReihenId,
} from "../../modell/reihen";
import type { Sim } from "../simulation";

// Smartphone: Die Stellschrauben liegen auf einem Blatt, das von unten hochgezogen wird
// und an drei Stellen einrastet. Halb heißt: Regler unten, Wirkung oben weiter sichtbar.
export type Stufe = "zu" | "halb" | "voll";
const HALB = 0.55; // Anteil der Bildschirmhöhe, den das halbe Blatt zeigt

export function useBlatt() {
  const blatt = useRef<HTMLElement>(null);
  const griff = useRef<HTMLDivElement>(null);
  const zeile = useRef<HTMLDivElement>(null);
  const strich = useRef<HTMLSpanElement>(null);
  const [stufe, setStufe] = useState<Stufe>("zu");
  // Eingeklappt ragt nur Strich und Titelzeile heraus; beim Herunterscrollen nur der Strich.
  const [klein, setKlein] = useState(false);
  const [mass, setMass] = useState<{
    h: number;
    zu: number;
    klein: number;
    vh: number;
  } | null>(null);
  const [zieh, setZieh] = useState<number | null>(null);
  const start = useRef<{ y: number; von: number; t: number } | null>(null);

  useLayoutEffect(() => {
    const miss = () => {
      if (blatt.current && zeile.current && strich.current)
        setMass({
          h: blatt.current.offsetHeight,
          zu: zeile.current.offsetTop + zeile.current.offsetHeight + 4,
          klein: strich.current.offsetTop + strich.current.offsetHeight + 8,
          vh: window.innerHeight,
        });
    };
    miss();
    window.addEventListener("resize", miss);
    return () => window.removeEventListener("resize", miss);
  }, []);

  // Wie die Adresszeile in Safari: runter scrollen macht das Blatt klein, hoch scrollen holt die Zeile zurück.
  useEffect(() => {
    if (stufe !== "zu") return setKlein(false);
    let zuletzt = window.scrollY;
    const scroll = () => {
      const y = window.scrollY,
        dy = y - zuletzt;
      if (Math.abs(dy) < 8) return;
      zuletzt = y;
      setKlein(dy > 0 && y > 60);
    };
    window.addEventListener("scroll", scroll, { passive: true });
    return () => window.removeEventListener("scroll", scroll);
  }, [stufe]);

  const lage = (s: Stufe) => {
    if (!mass) return 0;
    const zu = mass.h - (klein ? mass.klein : mass.zu);
    return s === "voll"
      ? 0
      : s === "halb"
        ? Math.min(zu, Math.max(0, mass.h - mass.vh * HALB))
        : zu;
  };

  const runter = (ev: ReactPointerEvent<HTMLDivElement>) => {
    if ((ev.target as Element).closest("button")) return;
    start.current = { y: ev.clientY, von: lage(stufe), t: ev.timeStamp };
    ev.currentTarget.setPointerCapture(ev.pointerId);
  };
  const ziehen = (ev: ReactPointerEvent<HTMLDivElement>) => {
    if (!start.current) return;
    const y = start.current.von + ev.clientY - start.current.y;
    setZieh(Math.max(0, Math.min(lage("zu"), y)));
  };
  const los = (ev: ReactPointerEvent<HTMLDivElement>) => {
    const s = start.current;
    start.current = null;
    setZieh(null);
    if (!s) return;
    const dy = ev.clientY - s.y;
    if (Math.abs(dy) < 6) {
      // Tippen: zu → halb → voll, voll → halb
      setStufe(stufe === "zu" ? "halb" : stufe === "halb" ? "voll" : "halb");
      return;
    }
    // Schwung mitnehmen, dann an der nächsten Stufe einrasten.
    const tempo = dy / Math.max(1, ev.timeStamp - s.t);
    const ziel = s.von + dy + tempo * 180;
    const stufen: Stufe[] = ["voll", "halb", "zu"];
    setStufe(
      stufen.reduce((a, b) =>
        Math.abs(lage(b) - ziel) < Math.abs(lage(a) - ziel) ? b : a,
      ),
    );
  };

  const stil = mass
    ? {
        transform: `translateY(${zieh ?? lage(stufe)}px)`,
        transition: zieh === null ? undefined : "none",
      }
    : undefined;
  return {
    blatt,
    griff,
    zeile,
    strich,
    stufe,
    klein,
    setStufe,
    stil,
    griffEreignisse: {
      onPointerDown: runter,
      onPointerMove: ziehen,
      onPointerUp: los,
      onPointerCancel: los,
    },
  };
}

// Beim Verstellen zeigt der Griff kurz die Kennzahl, die sich am stärksten bewegt hat.
export function Aenderung({ sim, ruhe = null }: { sim: Sim; ruhe?: ReactNode }) {
  // Verglichen wird mit dem Stand vor dem ganzen Zug am Regler, nicht mit dem letzten Zwischenschritt.
  const anker = useRef(sim.verlauf);
  const letzter = useRef(sim.verlauf);
  const [zeige, setZeige] = useState<{
    id: ReihenId;
    alt: number;
    neu: number;
    jahr: number;
  } | null>(null);

  useEffect(() => {
    if (letzter.current === sim.verlauf) return;
    letzter.current = sim.verlauf;
    const alt = anker.current[sim.idx],
      neu = sim.verlauf[sim.idx];
    if (!alt || !neu) {
      anker.current = sim.verlauf;
      return;
    }
    let best: { id: ReihenId; alt: number; neu: number; mass: number } | null =
      null;
    for (const id of KACHELN) {
      const a = wertVon(alt, id),
        n = wertVon(neu, id);
      const mass = Math.abs(n - a) / Math.max(Math.abs(a), 1);
      if (
        Math.abs(n - a) >= Math.pow(10, -REIHEN[id].dez) / 2 &&
        (!best || mass > best.mass)
      )
        best = { id, alt: a, neu: n, mass };
    }
    setZeige(
      best && { id: best.id, alt: best.alt, neu: best.neu, jahr: neu.jahr },
    );
    const uhr = window.setTimeout(() => {
      anker.current = letzter.current;
      setZeige(null);
    }, 2500);
    return () => window.clearTimeout(uhr);
    // Nur bei neuem Verlauf; das Jahr wird beim Rechnen gelesen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sim.verlauf]);

  if (!zeige) return <>{ruhe}</>;
  const r = REIHEN[zeige.id];
  const klasse =
    r.gut === 0
      ? "neutral"
      : (zeige.neu - zeige.alt) * r.gut > 0
        ? "good"
        : "bad";
  return (
    <span className={`aenderung ${klasse}`} role="status">
      {rName(zeige.id)} {zeige.jahr}: {fmt(zeige.alt, r.dez)} →{" "}
      {fmt(zeige.neu, r.dez)} {einheitFuer(r, sim.land)}
    </span>
  );
}
