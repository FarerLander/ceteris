import { BAUSTEIN_IDS, BAUSTEINE } from "../bausteine";
import {
  feldNetz,
  landkarte,
  mitschriftVerlauf,
  schreibeMit,
  stellFelder,
} from "../netz/mitschrift";
import { basisSzenario, rechne } from "../rechne";
import { testland } from "./testland";

const land = testland();
const sz = basisSzenario(land, 12);

describe("Mitschrift", () => {
  it("zehn Bausteine in Rechenreihenfolge", () => {
    expect(BAUSTEIN_IDS).toHaveLength(BAUSTEINE.length);
    expect(BAUSTEIN_IDS[0]).toBe("demografie");
    expect(BAUSTEIN_IDS[9]).toBe("handel");
  });

  it("verändert die Rechnung nicht", () => {
    const { verlauf } = mitschriftVerlauf(land, sz);
    expect(verlauf).toEqual(rechne(land, { ...sz, jahre: 6 }));
  });

  it("findet bekannte Verbindungen", () => {
    const k = landkarte(schreibeMit(land, sz));
    const demoWachs = k.find(
      (x) => x.von === "demografie" && x.nach === "wachstum",
    );
    expect(demoWachs?.groessen).toContain("erwerbsfaehige");
    expect(demoWachs?.vorjahr).toBe(false);
    expect(k.some((x) => x.von === "anleihen" && x.nach === "staat")).toBe(
      true,
    );
    expect(k.every((x) => x.von !== x.nach)).toBe(true);
  });

  it("Stellschrauben und Feldnetz", () => {
    const m = schreibeMit(land, sz);
    expect(
      m.spuren.find((s) => s.id === "demografie")?.stell.has("rente.alter"),
    ).toBe(true);
    expect(stellFelder(m, "rente.alter").size).toBeGreaterThan(0);
    expect(feldNetz(m).get("erwerbsfaehige")?.size).toBeGreaterThan(0);
    expect(m.schreiber.schuldQuote).toBe("staat");
  });

  it("kurzer Rechenzeitraum ist erlaubt", () => {
    expect(() => schreibeMit(land, basisSzenario(land, 2))).not.toThrow();
  });
});
