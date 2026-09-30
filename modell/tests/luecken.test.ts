import { basisSzenario, rechne } from "../rechne";
import { testland } from "./testland";

describe("Leistungsbilanz-Rest", () => {
  it("die Leistungsbilanz im Startjahr enthält den Rest aus Einkommen und Übertragungen", () => {
    const l = testland({ lbRest: -1.5 });
    const v = rechne(l, basisSzenario(l, 3));
    expect(v[0].leistungsbilanz).toBeCloseTo(47 - 42 + 0.03 * 70 - 1.5, 9);
    expect(
      v[2].leistungsbilanz - (v[2].exporte - v[2].importe + 0.03 * v[1].nfa),
    ).toBeCloseTo(-1.5, 9);
  });
});

describe("Finanztransaktionen", () => {
  it("erhöhen die Schuld, ohne Primärsaldo und Nachfrage zu berühren", () => {
    const l = testland();
    const ohne = rechne(l, basisSzenario(l, 4));
    const mit = rechne(l, {
      ...basisSzenario(l, 4),
      stell: {
        "staat.finanztransaktionen": [
          { ab: 2025, wert: 0 },
          { ab: 2027, wert: 5 },
          { ab: 2028, wert: 0 },
        ],
      },
    });
    expect(mit[2].primaer).toBeCloseTo(ohne[2].primaer, 9);
    expect(mit[2].luecke).toBeCloseTo(ohne[2].luecke, 9);
    expect(mit[2].schuldQuote - ohne[2].schuldQuote).toBeGreaterThan(4.5);
    expect(mit[2].schuldNom).toBeCloseTo(
      mit[1].schuldNom + mit[2].defizitNom - mit[2].schnittNom,
      6,
    );
  });
});
