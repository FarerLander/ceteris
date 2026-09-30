import { basisSzenario, rechne } from "../rechne";
import type { Szenario } from "../typen";
import { testland } from "./testland";

// Befunde aus der Schlussprüfung Phase 1.
const lauf = (land: ReturnType<typeof testland>, stell: Szenario["stell"] = {}, jahre = 101, extra: Partial<Szenario> = {}) =>
  rechne(land, { ...basisSzenario(land, jahre), stell, ...extra });

describe("C1: Kapitaldeckung zahlt nicht aus einem leeren Fonds", () => {
  it("ist der Fonds leer, trägt der Staat die Renten wieder", () => {
    // Laufende Beiträge fließen weiter durch den Fonds; der Staat trägt den Rest, nicht null.
    const umlage = testland();
    const kapital = testland({}, { rentensystem: "kapital" });
    const u = lauf(umlage), v = lauf(kapital);
    let geprueft = 0;
    for (let t = 1; t < v.length; t++) {
      if (v[t - 1].fondsQuote === 0 && v[t].fondsQuote === 0 && t > 40) {
        expect(v[t].rentenausgaben, String(v[t].jahr)).toBeGreaterThan(u[t].rentenausgaben * 0.5);
        geprueft++;
      }
    }
    expect(geprueft).toBeGreaterThan(0);
  });
});

describe("I1: Staatsschuld und Quote bleiben konsistent, auch bei Überschüssen", () => {
  it("Quote = Schuld / nominales BIP, auch wenn der Staat Vermögen aufbaut", () => {
    const v = lauf(testland(), { "steuer.einkommen": 0.45 });
    expect(v.some((z) => z.schuldNom < 0)).toBe(true);
    for (const z of v.slice(1)) expect(z.schuldQuote).toBeCloseTo((z.schuldNom / (z.Y * z.preisniveau)) * 100, 6);
  });
});

describe("I3: nach einem Ausgabenschock keine künstliche Schwingung", () => {
  it("Pandemie: danach ruhiges Wachstum, kein Boom, keine zweite Krise", () => {
    const v = lauf(testland(), {}, 16, { schocks: [{ id: 1, art: "pandemie", jahr: 2030, staerke: 1, dauer: 1 }] });
    for (let t = 7; t <= 11; t++) {
      expect(Math.abs(v[t].wachstum), String(v[t].jahr)).toBeLessThan(0.035);
      expect(v[t].lage, String(v[t].jahr)).not.toBe("boom");
      expect(v[t].lage, String(v[t].jahr)).not.toBe("krise");
    }
  });
});
