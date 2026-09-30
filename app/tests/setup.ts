import { EINSTELLUNG } from "../faecher";
// jsdom kennt einige Browser-APIs nicht, die Recharts und die Bewegung nutzen.
if (typeof window !== "undefined") {
  // Tests laufen auf Deutsch (erster Besuch: Sprache des Browsers).
  Object.defineProperty(window.navigator, "language", { value: "de-DE", configurable: true });
  class Beobachter {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  (globalThis as { ResizeObserver?: unknown }).ResizeObserver ??= Beobachter;
  window.matchMedia ??= ((q: string) => ({
    matches: false,
    media: q,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
  Element.prototype.scrollIntoView ??= function () {};
  window.requestAnimationFrame ??= (cb: FrameRequestCallback) => window.setTimeout(() => cb(performance.now()), 16);
  window.cancelAnimationFrame ??= (id: number) => window.clearTimeout(id);
  // Das Unsicherheitsband (Spec 13.4) rechnet in den Tests mit wenigen Läufen; sonst kosten Tests,
  // die Zeit vorspulen, Hunderte volle Läufe. faecher.test.tsx setzt seine Zahl selbst.
  Object.assign(EINSTELLUNG, { laeufe: 4 });
  // Jeder Test startet ohne Szenario-Link und ohne gespeicherte Szenarien.
  afterEach(() => {
    window.history.replaceState(null, "", "/");
    window.localStorage.clear();
  });
}
