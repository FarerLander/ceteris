import { LAENDER } from "../../app/land";
import { basisSzenario, rechne } from "../rechne";
import { topf } from "../topf";

describe("Spielraum im Haushalt", () => {
  it("die vier Blöcke ergeben zusammen 100", () => {
    const t = topf(40, 2, 10, 12);
    expect(t.zins + t.rente + t.sozial + t.rest).toBeCloseTo(100, 10);
    expect(t.rest).toBeCloseTo(40, 10);
  });
  it("Deutschland 2025: rund die Hälfte der Einnahmen bleibt frei", () => {
    const z = rechne(LAENDER.DE, basisSzenario(LAENDER.DE, 2))[0];
    expect(z.spielraum).toBeGreaterThan(40);
    expect(z.spielraum).toBeLessThan(60);
    expect(z.topfZins + z.topfRente + z.topfSozial + z.spielraum).toBeCloseTo(100, 8);
  });
  it("höhere Zinsen verdrängen: Rendite rauf, Spielraum runter", () => {
    const l = LAENDER.US;
    // Politik fest: Sonst spart die Regierung gegen die höheren Zinsen an, und der Spielraum kann steigen.
    const grund = { ...l.grund, politik: "fest" as const };
    const b = rechne(l, { ...basisSzenario(l, 21), grund });
    const r = rechne(l, { ...basisSzenario(l, 21), grund, stell: { "anleihen.laufzeitpraemie": l.standards["anleihen.laufzeitpraemie"] + 2 } });
    expect(r[20].topfZins).toBeGreaterThan(b[20].topfZins);
    expect(r[20].spielraum).toBeLessThan(b[20].spielraum);
  });
  it("Einnahmen nahe null: keine Division durch null", () => {
    expect(Number.isFinite(topf(0, 1, 1, 1).rest)).toBe(true);
  });
});

describe("Warnlampe Spielraum", () => {
  it("meldet sich, wenn weniger als 10 % der Einnahmen frei bleiben", async () => {
    const { warnlampen } = await import("../warnlampen");
    const l = LAENDER.IT;
    // Prüft die Lampe: Mit reagierender Politik spart Italien vorher (13.10), deshalb hier fest; ohne
    // Rentenanpassung nach Landesrecht, sonst bleibt der Spielraum über 10 %.
    const sz = { ...basisSzenario(l, 51), aus: ["rente.anpassung", "rente.indexierung"], grund: { ...l.grund, politik: "fest" as const } };
    const verlauf = rechne(l, sz);
    const erstes = verlauf.find((z) => z.spielraum < 10);
    expect(erstes).toBeDefined();
    const phase = warnlampen(l, sz, verlauf).find((p) => p.id === "spielraum");
    expect(phase?.von).toBe(erstes!.jahr);
  });
  it("Deutschland 2025 ohne Warnung", async () => {
    const { warnlampen } = await import("../warnlampen");
    const l = LAENDER.DE;
    const sz = basisSzenario(l, 11);
    expect(warnlampen(l, sz, rechne(l, sz)).some((p) => p.id === "spielraum")).toBe(false);
  });
});
