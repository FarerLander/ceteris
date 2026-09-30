import { describe, expect, it } from "vitest";
import { DE, LAENDER } from "../../app/land";
import { basisSzenario, rechne } from "../rechne";
import { kalibriereStandards } from "../start";
import { dekodiere, kodiere } from "../szenario-code";
import type { Landesdaten } from "../typen";

// Testland: Deutschland mit gelenkter Währung und weitgehend geschlossenem Kapitalverkehr.
const G: Landesdaten = {
  ...DE,
  grund: { ...DE.grund, regime: "gelenkt" },
  standards: { ...DE.standards, "handel.kapitalOffenheit": 0.2 },
};
G.standards = kalibriereStandards(G);
const druck = { "ordnung.notenbankfinanzierung": 60, "staat.uebrige": G.standards["staat.uebrige"] + 6 };

describe("Gelenkte Währung (Update 4a)", () => {
  it("Grenzfall: ohne Eingriff kein Schwarzmarkt", () => {
    const r = rechne(G, basisSzenario(G, 26));
    for (const z of r) expect(z.schwarzmarkt).toBeLessThan(1);
  });
  it("gelenkt rechnet anders als eigene Währung (M13)", () => {
    const stell = { "ordnung.notenbankfinanzierung": 50, "staat.uebrige": G.standards["staat.uebrige"] + 6 };
    const E = { ...G, grund: { ...G.grund, regime: "eigen" as const } };
    const eigen = rechne(E, { ...basisSzenario(E, 11), stell });
    const gel = rechne(G, { ...basisSzenario(G, 11), stell });
    expect(gel[5].leitzins - gel[5].inflation).toBeLessThan(eigen[5].leitzins - eigen[5].inflation - 1);
  });
  it("Kurs nicht nachgeführt bei hoher Inflation: Schwarzmarkt-Aufschlag wächst", () => {
    const r = rechne(G, { ...basisSzenario(G, 11), stell: { ...druck, "handel.kursNachfuehrung": 0 } });
    expect(r[8].schwarzmarkt).toBeGreaterThan(50);
    expect(r[8].exporte).toBeLessThan(r[1].exporte);
  });
  it("offener Kapitalverkehr: Überbewertung zeigt sich im Zins, nicht am Schwarzmarkt", () => {
    const stell = { ...druck, "handel.kursNachfuehrung": 0, "handel.kapitalOffenheit": 1 };
    const r = rechne(G, { ...basisSzenario(G, 11), stell });
    expect(r[6].schwarzmarkt).toBe(0);
    expect(r[6].aufschlag).toBeGreaterThan(r[1].aufschlag + 2);
  });
  it("Grenzfall: alter Link mit gelenkter Währung lädt und rechnet", () => {
    const sz = dekodiere(
      kodiere({ ...basisSzenario(DE, 26), grund: { ...DE.grund, regime: "gelenkt" } }),
      DE,
    );
    expect(sz?.grund.regime).toBe("gelenkt");
    const r = rechne(DE, sz!);
    expect(r.every((z) => Number.isFinite(z.schuldQuote))).toBe(true);
  });
});

describe("Befunde der Prüfung: gelenkt ohne Eingriff in allen Ländern", () => {
  for (const [code, land] of Object.entries(LAENDER))
    // Kein Aufschaukeln. Der politische Leitzins startet beim Realzins des Startjahres und nähert sich
    // dem Weltrealzins; Schattenkurs, Nachfrage und Kredit messen am selben Pfad (Update 4b).
    it(`${code}: Kapitalverkehr zu, Kurs nachgeführt → kein Aufschaukeln`, () => {
      const L: Landesdaten = { ...land, grund: { ...land.grund, regime: "gelenkt" } };
      L.standards = kalibriereStandards(L);
      const r = rechne(L, { ...basisSzenario(L, 51), stell: { "handel.kapitalOffenheit": 0 } });
      expect(Math.max(...r.map((z) => z.schwarzmarkt))).toBeLessThan(5);
    });
});
