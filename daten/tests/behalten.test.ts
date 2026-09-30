import { describe, expect, it } from "vitest";
import { behalteAlte } from "../behalten";
import type { AutoDatei } from "../typen";

// 12b: Scheitert der Abruf einer Reihe, die es schon gab (OECD antwortet GitHub-Servern nicht immer),
// bleibt der alte Stand. Sonst verschiebt ein Netzfehler das Modell.
const datei = (reihen: AutoDatei["reihen"], fehlend: string[] = [], konsens?: AutoDatei["konsens"]): AutoDatei => ({
  code: "IT", iso3: "ITA", abgerufen: "x", reihen, quellen: Object.fromEntries(Object.keys(reihen).map((k) => [k, `Quelle ${k}`])), fehlend, konsens,
});
const iwf = (werte: NonNullable<AutoDatei["konsens"]>["werte"]) => ({ kurz: "IWF", name: "IWF", stand: "2026-09-28", werte });

describe("Alten Stand behalten, wenn ein Abruf scheitert", () => {
  it("fehlende Reihe kommt mit Quelle zurück und ist vermerkt", () => {
    const alt = datei({ rendite: { 2025: 3.5 }, bip: { 2025: 1 } });
    const neu = datei({ bip: { 2025: 1.1 } }, ["rendite"]);
    const r = behalteAlte(alt, neu);
    expect(r.reihen.rendite).toEqual({ 2025: 3.5 });
    expect(r.quellen.rendite).toBe("Quelle rendite");
    expect(r.reihen.bip).toEqual({ 2025: 1.1 });
    expect(r.fehlend).toEqual([]);
    expect(r.behalten).toEqual(["rendite"]);
  });
  it("Prognosen: fehlt eine Größe oder alles, bleibt der alte Stand", () => {
    const alt = datei({}, [], iwf({ schuldQuote: { 2031: 136 }, defizit: { 2031: -2.7 } }));
    expect(behalteAlte(alt, datei({})).konsens?.werte.schuldQuote).toEqual({ 2031: 136 });
    const r = behalteAlte(alt, datei({}, [], iwf({ schuldQuote: { 2031: 137 } })));
    expect(r.konsens?.werte).toEqual({ schuldQuote: { 2031: 137 }, defizit: { 2031: -2.7 } });
    expect(r.behalten).toEqual(["konsens.defizit"]);
  });
  it("ohne alte Datei und ohne Ausfall: unverändert, kein Vermerk", () => {
    const neu = datei({ bip: { 2025: 1 } });
    expect(behalteAlte(null, neu)).toEqual(neu);
    expect(behalteAlte(datei({ bip: { 2025: 0.9 } }), neu).behalten).toBeUndefined();
  });
});
