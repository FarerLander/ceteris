import { demografie } from "../bausteine/demografie";
import { basisSzenario, rechne } from "../rechne";
import { testland } from "./testland";

describe("Lebenserwartung als Zeitpfad", () => {
  it("der Trend summiert sich Jahr für Jahr auf, ein späterer Wechsel wirkt nicht rückwirkend", () => {
    const land = testland();
    const sz = { ...basisSzenario(land, 11), stell: { "demo.lebenserwartungTrend": [{ ab: 2025, wert: 0.2 }, { ab: 2030, wert: 0 }] } };
    const v = rechne(land, sz, [demografie]);
    expect(v[4].lebenserwartung).toBeCloseTo(81 + 0.2 * 4, 9);
    expect(v[10].lebenserwartung).toBeCloseTo(81 + 0.2 * 4, 9);
  });
});
