import { describe, expect, it } from "vitest";
import { naechster, vorheriger, momentaufnahme } from "../tour/ablauf";
import { ladeTour, speichereTour } from "../tour/speicher";
import type { Kapitel, Schritt } from "../tour/typen";
import type { Sim } from "../simulation";

// Hilfe-Modus: Ablauf der Tour und Fortschritt im Browser-Speicher.
const s = (id: string): Schritt => ({ id, ziel: null, text: id });
const KAP: Kapitel = { id: "erkundung", titel: "Test", schritte: [s("a"), s("b"), s("c"), s("d")] };

describe("Tour: Ablauf", () => {
  it("geht weiter und endet nach dem letzten Schritt", () => {
    const alle = () => true;
    expect(naechster({ kapitel: KAP, nr: 0 }, alle)?.nr).toBe(1);
    expect(naechster({ kapitel: KAP, nr: 3 }, alle)).toBeNull();
  });
  it("überspringt nicht anwendbare Schritte, vor und zurück", () => {
    const ohneB = (x: Schritt) => x.id !== "b";
    expect(naechster({ kapitel: KAP, nr: 0 }, ohneB)?.nr).toBe(2);
    expect(vorheriger({ kapitel: KAP, nr: 2 }, ohneB).nr).toBe(0);
    expect(naechster({ kapitel: KAP, nr: 2 }, (x) => x.id === "a")).toBeNull();
  });
  it("bleibt am Anfang stehen", () => {
    expect(vorheriger({ kapitel: KAP, nr: 0 }, () => true).nr).toBe(0);
  });
  it("Momentaufnahme zählt Jahr, Detail, Schocks, Übernahmen und Stellwerte", () => {
    const sim = { idx: 5, detail: "schuldQuote", sz: { schocks: [{}, {}], stell: { "rente.alter": 69 } }, uebernommen: [{}] } as unknown as Sim;
    expect(momentaufnahme(sim)).toEqual({ idx: 5, detail: "schuldQuote", schocks: 2, uebernommen: 1, stell: { "rente.alter": 69 } });
  });
});

describe("Tour: Speicher", () => {
  it("ohne Eintrag: nicht gesehen, nichts erledigt; speichert und lädt", () => {
    expect(ladeTour()).toEqual({ gesehen: false, erledigt: [] });
    speichereTour({ gesehen: true, erledigt: ["erkundung"] });
    expect(ladeTour()).toEqual({ gesehen: true, erledigt: ["erkundung"] });
  });
  it("gesperrter oder kaputter Speicher bricht nichts", () => {
    const echt = Object.getOwnPropertyDescriptor(window, "localStorage")!;
    Object.defineProperty(window, "localStorage", { configurable: true, get() { throw new Error("gesperrt"); } });
    try {
      expect(ladeTour()).toEqual({ gesehen: false, erledigt: [] });
      expect(() => speichereTour({ gesehen: true, erledigt: [] })).not.toThrow();
    } finally {
      Object.defineProperty(window, "localStorage", echt);
    }
    window.localStorage.setItem("ceteris.tour", "{kaputt");
    expect(ladeTour()).toEqual({ gesehen: false, erledigt: [] });
  });
});
