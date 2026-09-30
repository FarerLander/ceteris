import { altersverteilung, teileAuf } from "../alter";
import { basisSzenario, rechne } from "../rechne";
import { startzustand } from "../start";
import { testland } from "./testland";

describe("Alter", () => {
  it("verteilt die Bevölkerung vollständig auf 101 Jahrgänge", () => {
    const a = altersverteilung(80, Array(17).fill(1 / 17));
    expect(a).toHaveLength(101);
    expect(a.reduce((x, y) => x + y, 0)).toBeCloseTo(80, 9);
  });
  it("teilt bei gebrochenem Rentenalter den Jahrgang auf", () => {
    const a = Array(101).fill(1);
    const t = teileAuf(a, 67.5);
    expect(t.kinder).toBe(15);
    expect(t.erwerbsfaehige).toBeCloseTo(52.5);
    expect(t.rentner).toBeCloseTo(33.5);
  });
});

describe("Startzustand", () => {
  const land = testland();
  const { z, c } = startzustand(land, basisSzenario(land));
  it("übernimmt BIP, Bevölkerung, Schuld und Energiepreis-Index 100", () => {
    expect(z.Y).toBe(4300);
    expect(z.bev).toBeCloseTo(83.5, 6);
    expect(z.schuldQuote).toBe(63);
    expect(z.energiepreis).toBe(100);
    expect(z.jahr).toBe(2025);
  });
  it("kalibriert Renten- und ALG-Faktor so, dass die Startwerte getroffen werden", () => {
    expect(c.rentenFaktor).toBeGreaterThan(0);
    expect(c.algFaktor).toBeGreaterThan(0);
    expect(z.rentenausgaben).toBe(10.3);
  });
  it("übrige Ausgaben schließen die Ausgabenlücke", () => {
    expect(land.standards["staat.uebrige"]).toBeCloseTo(
      49.5 - 1.008 - 10.3 - 1.4 - 8 - 2.2 - 2.1 - 4.5 - 3.1 / 3,
      6,
    );
  });
  it("sonstige Einnahmen sind positiv", () => {
    expect(c.sonstigeEinnahmen).toBeGreaterThan(0);
  });
});

describe("rechne ohne Bausteine", () => {
  it("liefert jahre Zustände mit fortlaufenden Jahren", () => {
    const land = testland();
    const v = rechne(land, basisSzenario(land, 26), []);
    expect(v).toHaveLength(26);
    expect(v[25].jahr).toBe(2050);
    expect(v[0]).not.toBe(v[1]);
  });
});
