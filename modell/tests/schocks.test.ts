import { LAENDER } from "../../app/land";
import { baueKontext } from "../kontext";
import { basisSzenario } from "../rechne";
import { startzustand } from "../start";
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

describe("Energieschocks nach Nettoimport (M36)", () => {
  const oel = [{ id: 1, art: "oel" as const, jahr: 2030, staerke: 1, dauer: 1 }];
  it("Faktor skaliert nur den Nachfrageschaden der Energieschocks", () => {
    expect(schockWirkung(oel, 2030, 0).luecke).toBe(0);
    expect(schockWirkung(oel, 2030, 0).energie).toBe(SCHOCKS.oel.wirkung.energie![0]);
    expect(schockWirkung(oel, 2030, 1).luecke).toBe(SCHOCKS.oel.wirkung.luecke![0]);
    const krise = [{ id: 2, art: "krise" as const, jahr: 2030, staerke: 1, dauer: 1 }];
    expect(schockWirkung(krise, 2030, 0).luecke).toBe(SCHOCKS.krise.wirkung.luecke![0]);
  });
  const kontext = (code: string, aus: string[] = []) => {
    const l = LAENDER[code];
    const sz = { ...basisSzenario(l), schocks: oel, aus };
    return baueKontext(l, sz, startzustand(l, sz).c, 2030 - l.datenstand).schock.luecke;
  };
  it("Deutschland wie bisher, Förderländer ohne Nachfrageschaden, Japan stärker", () => {
    expect(kontext("DE")).toBe(SCHOCKS.oel.wirkung.luecke![0]);
    expect(kontext("CA")).toBe(0);
    expect(kontext("RU")).toBe(0);
    expect(kontext("JP")).toBeLessThan(kontext("DE"));
  });
  it("abgeschaltet: alle Länder wie Deutschland", () => {
    expect(kontext("CA", ["zufall.energieImport"])).toBe(SCHOCKS.oel.wirkung.luecke![0]);
  });
});
