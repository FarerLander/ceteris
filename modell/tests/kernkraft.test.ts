import { LAENDER } from "../../app/land";
import { basisSzenario, rechne } from "../rechne";
import type { Szenario } from "../typen";

const lauf = (code: string, stell: Szenario["stell"], jahre = 51) =>
  rechne(LAENDER[code], { ...basisSzenario(LAENDER[code], jahre), stell });

describe("Kernkraft-Neubau", () => {
  it("liefert erst nach dem Vorlauf Strom, dann 1 Pp. je Jahr bis zum Ausbauziel", () => {
    const v = lauf("DE", { "energie.atom": 2 });
    expect(v[12].mix.atom).toBe(0);
    expect(v[13].mix.atom).toBeCloseTo(0.01, 10);
    expect(v[50].mix.atom).toBeCloseTo(0.25, 10);
    const hoch = lauf("DE", { "energie.atom": 2, "energie.atomZiel": 40 });
    expect(hoch[50].mix.atom).toBeCloseTo(0.38, 10);
  });
  it("ein Land über dem Ziel hält seinen Anteil (Frankreich fällt nicht auf 25 %)", () => {
    const v = lauf("FR", { "energie.atom": 2 });
    const start = LAENDER.FR.start.mix.atom;
    for (const z of v) expect(z.mix.atom).toBeGreaterThanOrEqual(start - 1e-12);
  });
  it("senkt Energiepreis, Gasimporte und CO₂ gegenüber dem Ausstieg", () => {
    const aus = lauf("DE", {});
    const neu = lauf("DE", { "energie.atom": 2 });
    expect(neu[25].energiepreis).toBeLessThan(aus[25].energiepreis);
    expect(neu[25].importquote).toBeLessThan(aus[25].importquote);
    expect(neu[25].co2Mt).toBeLessThan(aus[25].co2Mt);
  });
  it("abbezahlte Reaktoren kosten nur noch den Weiterbetrieb", () => {
    const de = LAENDER.DE;
    const sz = { ...basisSzenario(de, 81), stell: { "energie.atom": 2 } };
    const normal = rechne(de, sz);
    const kurz = rechne({ ...de, standards: { ...de.standards, "energie.atomAbzahlung": 20 } }, sz);
    // Bis 20 Jahre nach dem ersten neuen Reaktor gleich, danach mit kurzer Abzahlung billiger.
    expect(kurz[32].energiepreis).toBeCloseTo(normal[32].energiepreis, 10);
    expect(kurz[60].energiepreis).toBeLessThan(normal[60].energiepreis - 1);
  });
});

describe("Wirkungsnetz bei später Wirkung", () => {
  it("Neubau in Deutschland: Fenster beginnt 2038, Spalten zeigen die Wirkung", async () => {
    const { schreibeMit } = await import("../netz/mitschrift");
    const { berechneWeg } = await import("../netz/weg");
    const de = LAENDER.DE;
    const sz = basisSzenario(de, 51);
    const w = berechneWeg(de, sz, "energie.atom", schreibeMit(de, sz));
    expect(w.nach).toBe(2);
    expect(w.ab).toBe(2038);
    expect(w.satz).toContain("Die Wirkung setzt erst 2038 ein, nach 13 Jahren.");
    expect(w.knoten.some((k) => !k.kennzahl && k.name === "Energiepreis")).toBe(true);
  });
  it("frühe Wirkung behält das gewohnte Fenster", async () => {
    const { schreibeMit } = await import("../netz/mitschrift");
    const { berechneWeg } = await import("../netz/weg");
    const de = LAENDER.DE;
    const sz = basisSzenario(de, 51);
    expect(berechneWeg(de, sz, "rente.alter", schreibeMit(de, sz)).ab).toBeNull();
  });
});
