import { schockWirkung, SCHOCKS } from "../schocks";

describe("schockWirkung", () => {
  it("ist ohne Schocks überall null", () => {
    const w = schockWirkung([], 2030);
    expect(Object.values(w).every((v) => v === 0)).toBe(true);
  });
  it("wirkt ab dem Schockjahr nach Tabelle", () => {
    const s = [
      { id: 1, art: "oel" as const, jahr: 2030, staerke: 1, dauer: 1 },
    ];
    expect(schockWirkung(s, 2029).energie).toBe(0);
    expect(schockWirkung(s, 2030).energie).toBe(
      SCHOCKS.oel.wirkung.energie![0],
    );
    expect(schockWirkung(s, 2031).energie).toBe(
      SCHOCKS.oel.wirkung.energie![1],
    );
    expect(schockWirkung(s, 2032).energie).toBe(0);
  });
  it("skaliert mit Stärke, streckt mit Dauer, Kippen bleibt 1", () => {
    const s = [
      { id: 1, art: "krise" as const, jahr: 2030, staerke: 2, dauer: 2 },
    ];
    expect(schockWirkung(s, 2030).luecke).toBe(
      2 * SCHOCKS.krise.wirkung.luecke![0],
    );
    expect(schockWirkung(s, 2031).luecke).toBe(
      2 * SCHOCKS.krise.wirkung.luecke![0],
    );
    expect(schockWirkung(s, 2032).luecke).toBe(
      2 * SCHOCKS.krise.wirkung.luecke![1],
    );
    expect(schockWirkung(s, 2030).krise).toBe(1);
  });
  it("addiert mehrere Schocks", () => {
    const s = [
      { id: 1, art: "oel" as const, jahr: 2030, staerke: 1, dauer: 1 },
      { id: 2, art: "sanktionen" as const, jahr: 2030, staerke: 1, dauer: 1 },
    ];
    expect(schockWirkung(s, 2030).energie).toBe(
      SCHOCKS.oel.wirkung.energie![0] + SCHOCKS.sanktionen.wirkung.energie![0],
    );
  });
});
