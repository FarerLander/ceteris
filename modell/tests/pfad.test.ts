import { pfadWert } from "../pfad";

describe("pfadWert", () => {
  it("gibt Konstanten unverändert zurück", () => {
    expect(pfadWert(67, 2030)).toBe(67);
  });
  it("nimmt die letzte Stufe, deren Jahr erreicht ist", () => {
    const p = [
      { ab: 2025, wert: 67 },
      { ab: 2030, wert: 68 },
      { ab: 2035, wert: 69 },
    ];
    expect(pfadWert(p, 2029)).toBe(67);
    expect(pfadWert(p, 2030)).toBe(68);
    expect(pfadWert(p, 2040)).toBe(69);
  });
  it("nutzt vor der ersten Stufe deren Wert und sortiert selbst", () => {
    const p = [
      { ab: 2035, wert: 69 },
      { ab: 2030, wert: 68 },
    ];
    expect(pfadWert(p, 2000)).toBe(68);
    expect(pfadWert(p, 2036)).toBe(69);
  });
  it("wirft bei leerem Pfad", () => {
    expect(() => pfadWert([], 2030)).toThrow("Leerer Zeitpfad");
  });
});
