import { basisSzenario, rechne } from "../rechne";
import type { Szenario } from "../typen";
import { testland } from "./testland";

const land = testland();
const lauf = (stell: Szenario["stell"] = {}) => rechne(land, { ...basisSzenario(land, 51), stell });

describe("Automatische Beitragsanpassung Rente", () => {
  it("ist standardmäßig an: steigende Renten heben den Beitragssatz", () => {
    const v = lauf();
    expect(v[20].rentenausgaben).toBeGreaterThan(v[0].rentenausgaben + 1);
    expect(v[20].beitragsAufschlag).toBeGreaterThan(0);
  });
  it("deckt den Großteil des Rentenanstiegs: Schuld steigt deutlich weniger als ohne", () => {
    const an = lauf(), aus = lauf({ "rente.beitragsAutomatik": 0 });
    expect(aus[20].beitragsAufschlag).toBe(0);
    expect(an[20].schuldQuote).toBeLessThan(aus[20].schuldQuote - 10);
    expect(an[20].einnahmen).toBeGreaterThan(aus[20].einnahmen + 1);
  });
  it("höhere Beiträge verteuern Arbeit: etwas weniger Erwerbsbeteiligung", () => {
    const an = lauf(), aus = lauf({ "rente.beitragsAutomatik": 0 });
    expect(an[20].erwerbspersonen).toBeLessThan(aus[20].erwerbspersonen);
  });
  it("sinken die Renten unter den Start, sinkt der Beitrag nicht unter den gesetzlichen Satz", () => {
    const v = lauf({ "rente.niveau": 40 });
    for (const z of v) expect(z.beitragsAufschlag).toBeGreaterThanOrEqual(0);
  });
});
