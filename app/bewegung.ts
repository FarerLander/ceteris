import { useEffect, useRef, useState } from "react";

const ANFRAGE = "(prefers-reduced-motion: reduce)";

export function useBewegung(): boolean {
  const [ruhig, setRuhig] = useState(
    () =>
      typeof window !== "undefined" && !!window.matchMedia?.(ANFRAGE).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia?.(ANFRAGE);
    if (!mq) return;
    const f = () => setRuhig(mq.matches);
    mq.addEventListener?.("change", f);
    return () => mq.removeEventListener?.("change", f);
  }, []);
  return !ruhig;
}

// Zählt in `dauer` ms zum Zielwert, mit weichem Auslaufen.
export function useZaehler(ziel: number, dauer = 400): number {
  const bewegt = useBewegung();
  const [wert, setWert] = useState(ziel);
  const aktuell = useRef(ziel);
  useEffect(() => {
    if (!bewegt) {
      aktuell.current = ziel;
      setWert(ziel);
      return;
    }
    const von = aktuell.current;
    const t0 = performance.now();
    let id = 0;
    const schritt = () => {
      const f = Math.min(1, (performance.now() - t0) / dauer);
      const v = von + (ziel - von) * (1 - (1 - f) ** 3);
      aktuell.current = v;
      setWert(v);
      if (f < 1) id = requestAnimationFrame(schritt);
    };
    id = requestAnimationFrame(schritt);
    return () => cancelAnimationFrame(id);
  }, [ziel, bewegt, dauer]);
  return bewegt ? wert : ziel;
}
