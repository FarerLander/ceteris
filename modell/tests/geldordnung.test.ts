import { describe, expect, it } from "vitest";
import { DE } from "../../app/land";
import { basisSzenario, rechne } from "../rechne";

const lauf = (stell: Record<string, number>) =>
  rechne(DE, { ...basisSzenario(DE, 31), stell });

describe("Preiskontrollen und Notenbankfinanzierung (Update 4a)", () => {
  it("Preiskontrollen: gemessene Inflation erst tiefer, Knappheit steigt, Angebot sinkt", () => {
    const b = lauf({}),
      r = lauf({ "ordnung.preiskontrollen": 60 });
    expect(r[1].inflation).toBeLessThan(b[1].inflation - 0.5);
    expect(r[10].knappheit).toBeGreaterThan(1);
    expect(r[10].Y).toBeLessThan(b[10].Y);
  });
  it("Grenzfall: Kontrollen nach 10 Jahren weg — Inflation springt, Stau baut sich ab", () => {
    const r = rechne(DE, {
      ...basisSzenario(DE, 31),
      stell: {
        "ordnung.preiskontrollen": [
          { ab: DE.datenstand + 1, wert: 60 },
          { ab: DE.datenstand + 11, wert: 0 },
        ],
      },
    });
    expect(r[11].inflation).toBeGreaterThan(r[10].inflation + 1);
    expect(r[20].knappheit).toBeLessThan(0.01);
  });
  it("Notenbankfinanzierung bei großem Defizit: Inflation beschleunigt, ab Schwelle Krise", () => {
    const r = lauf({
      "ordnung.notenbankfinanzierung": 100,
      "staat.uebrige": DE.standards["staat.uebrige"] + 10,
    });
    expect(r[3].inflation).toBeGreaterThan(r[2].inflation);
    expect(r.some((z) => z.inflation > 100 && z.lage === "krise")).toBe(true);
  });
  it("Grenzfall: Hyperinflation über 50 Jahre bleibt rechenbar", () => {
    const r = rechne(DE, {
      ...basisSzenario(DE, 51),
      stell: {
        "ordnung.notenbankfinanzierung": 100,
        "staat.uebrige": DE.standards["staat.uebrige"] + 10,
      },
    });
    for (const z of r)
      for (const f of ["inflation", "schuldQuote", "preisniveau", "Y", "rendite"] as const)
        expect(Number.isFinite(z[f]), `${z.jahr} ${f}`).toBe(true);
  });
  it("Kreditlenkung: erst mehr Wachstum, dann sinkende Kapitaleffizienz und faule Kredite", () => {
    const b = lauf({}),
      r = lauf({ "ordnung.kreditlenkung": 60 });
    expect(r[3].investQuote).toBeGreaterThan(b[3].investQuote + 4);
    expect(r[5].Y).toBeGreaterThan(b[5].Y);
    expect(r[20].kapitalEffizienz).toBeLessThan(r[5].kapitalEffizienz);
    expect(Math.max(...r.map((z) => z.verdeckteSchuld))).toBeGreaterThan(5);
    expect(r.some((z) => z.uebernahme > 0)).toBe(true);
  });
});

describe("Befunde der Prüfung (Update 4a)", () => {
  it("Hyperinflation 50 Jahre: Realwirtschaft bleibt plausibel", () => {
    const E = { ...DE, grund: { ...DE.grund, regime: "eigen" as const } };
    const r = rechne(E, {
      ...basisSzenario(E, 51),
      stell: { "ordnung.notenbankfinanzierung": 100, "staat.uebrige": DE.standards["staat.uebrige"] + 10 },
    });
    for (const z of r.slice(1)) {
      expect(z.wachstum, `${z.jahr}`).toBeLessThan(0.1);
      expect(z.investQuote, `${z.jahr}`).toBeLessThan(60);
    }
  });
});

describe("T7-Patch", () => {
  it("Inflationsdeckel gilt auch nach dem Abbau eines riesigen Preisstaus", () => {
    const r = rechne(DE, {
      ...basisSzenario(DE, 51),
      stell: {
        "ordnung.notenbankfinanzierung": 100,
        "staat.uebrige": DE.standards["staat.uebrige"] + 20,
        "ordnung.preiskontrollen": [
          { ab: DE.datenstand + 1, wert: 60 },
          { ab: DE.datenstand + 40, wert: 0 },
        ],
      },
    });
    for (const z of r) expect(z.inflation, `${z.jahr}`).toBeLessThanOrEqual(1e6);
  });
});
