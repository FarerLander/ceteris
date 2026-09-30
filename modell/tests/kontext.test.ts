import { baueKontext } from "../kontext";
import type { Konstanten, Landesdaten, Szenario } from "../typen";

const land = {
  code: "XX",
  name: "Test",
  datenstand: 2025,
  qualitaet: "gruen",
  grund: { regime: "euro", rentensystem: "umlage", tpi: false },
  standards: { "rente.alter": 66 },
  start: {} as never,
  markiert: [],
  waehrung: { symbol: "€", kurs: 1 },
} as unknown as Landesdaten;
const sz = (stell: Szenario["stell"] = {}, aus: string[] = []): Szenario => ({
  jahre: 51,
  grund: land.grund,
  stell,
  schocks: [],
  aus,
  welt: {},
});
const c = {} as Konstanten;

describe("Kontext", () => {
  it("nimmt Landesstandard vor Verzeichnis-Standard", () => {
    const k = baueKontext(land, sz(), c, 1);
    expect(k.w("rente.alter")).toBe(66);
    expect(k.w("mig.netto")).toBe(300);
    expect(k.basis("rente.alter")).toBe(66);
  });
  it("liest Zeitpfade im laufenden Jahr", () => {
    const k = baueKontext(
      land,
      sz({
        "rente.alter": [
          { ab: 2025, wert: 66 },
          { ab: 2030, wert: 68 },
        ],
      }),
      c,
      6,
    );
    expect(k.jahr).toBe(2031);
    expect(k.w("rente.alter")).toBe(68);
    expect(k.wBei("rente.alter", 2027)).toBe(66);
  });
  it("aenderung misst gegen Vorjahr, im ersten Jahr gegen die Basis", () => {
    const s = sz({
      "handel.zoelle": [
        { ab: 2025, wert: 11.5 },
        { ab: 2028, wert: 21.5 },
      ],
    });
    expect(baueKontext(land, s, c, 1).aenderung("handel.zoelle")).toBe(10);
    expect(baueKontext(land, s, c, 2).aenderung("handel.zoelle")).toBe(0);
    expect(baueKontext(land, s, c, 3).aenderung("handel.zoelle")).toBe(10);
  });
  it("verzoegert rampt eine Dauer-Änderung linear hoch", () => {
    const s = sz({ "innov.fue": 4.1 });
    expect(baueKontext(land, s, c, 10).verzoegert("innov.fue", 5)).toBeCloseTo(
      1,
    );
    expect(baueKontext(land, s, c, 1).verzoegert("innov.fue", 0)).toBeCloseTo(
      1,
    );
  });
  it("p liefert neutralen Wert für abgeschaltete Wirkstärken und wirft bei Stellschrauben", () => {
    expect(baueKontext(land, sz(), c, 1).p("innov.fueRendite")).toBe(0.2);
    expect(
      baueKontext(land, sz({}, ["innov.fueRendite"]), c, 1).p(
        "innov.fueRendite",
      ),
    ).toBe(0);
    expect(() => baueKontext(land, sz(), c, 1).p("rente.alter")).toThrow(
      "rente.alter ist keine Wirkstärke",
    );
  });
  it("welt nutzt Standard oder Szenario-Pfad", () => {
    const k = baueKontext(
      land,
      { ...sz(), welt: { oel: [{ ab: 2030, wert: 120 }] } },
      c,
      5,
    );
    expect(k.welt("oel")).toBe(120);
    expect(k.welt("gas")).toBe(35);
  });
});
