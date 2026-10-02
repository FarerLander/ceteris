import { EINSTELLUNG } from "../faecher";
import { LAND_EINSTELLUNG } from "../land";
import { SPRACH_EINSTELLUNG } from "../sprache";
// jsdom kennt einige Browser-APIs nicht, die Recharts und die Bewegung nutzen.
if (typeof window !== "undefined") {
  // Tests laufen auf Deutsch. Die veröffentlichte App startet auf Englisch (sprache.test.tsx prüft das).
  Object.defineProperty(window.navigator, "language", { value: "de-DE", configurable: true });
  SPRACH_EINSTELLUNG.standard = "de";
  // Tests starten mit Deutschland. Die veröffentlichte App startet mit den USA (land.test prüft das).
  LAND_EINSTELLUNG.standard = "DE";
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
