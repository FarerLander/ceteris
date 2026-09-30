import { describe, expect, it } from "vitest";
import { PAKETE } from "../pakete";
import { ANTEILSGRUPPEN, anteilsGrenze } from "../verzeichnis";

describe("Anteilsgruppen", () => {
  it("begrenzt einen Anteil auf den Rest der Gruppe", () => {
    const w: Record<string, number> = { "mig.anteilHoch": 0.3, "mig.anteilMittel": 0.4 };
    expect(anteilsGrenze("mig.anteilHoch", (id) => w[id])).toBeCloseTo(0.6, 9);
    expect(anteilsGrenze("mig.anteilMittel", (id) => w[id])).toBeCloseTo(0.7, 9);
    const wege: Record<string, number> = { "mig.anteilArbeit": 0.5, "mig.anteilStudium": 0.3, "mig.anteilFamilie": 0.1 };
    expect(anteilsGrenze("mig.anteilFamilie", (id) => wege[id])).toBeCloseTo(0.2, 9);
    expect(anteilsGrenze("fiskal.mwst", () => 0)).toBe(Infinity);
  });
  it("Paket Fachkräfte hält die Qualifikationsanteile unter 100 %", () => {
    const p = PAKETE.find((x) => x.id === "fachkraefte")!;
    const w: Record<string, number> = { "mig.netto": 300, "mig.anteilHoch": 0.3, "mig.anteilMittel": 0.7, "mig.halbwert": 5, "mig.integrationspolitik": 0.5 };
    const stell = (p.setze as (...a: unknown[]) => { stell: Record<string, number> })((id: string) => w[id], undefined, undefined).stell;
    const [gruppe] = ANTEILSGRUPPEN;
    const summe = gruppe.ids.reduce((s, id) => s + (stell[id] ?? w[id]), 0);
    expect(summe).toBeLessThanOrEqual(1 + 1e-9);
  });
});
