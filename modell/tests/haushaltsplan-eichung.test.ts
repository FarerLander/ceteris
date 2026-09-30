import { describe, expect, it } from "vitest";
import { LAENDER, RUECKBLICK } from "../../app/land";
import { modellWert, TOLERANZ } from "../konsens";
import { basisSzenario, rechne } from "../rechne";

// M29: Mit Plan folgt der Gesamtsaldo des Basislaufs dem IWF. Rot nach neuen Daten → scripts/haushaltsplan-eichung.ts.
describe("Haushaltsplan geeicht auf den IWF", () => {
  for (const [code, land] of Object.entries(LAENDER))
    it(code, () => {
      expect(land.plan?.datenstand, "Plan zum Datenstand").toBe(land.datenstand);
      const iwf = land.konsens?.quellen.find((q) => q.kurz === "IWF")?.werte.defizit ?? {};
      expect(Object.keys(iwf).length).toBeGreaterThan(0);
      const r = rechne(land, { ...basisSzenario(land), grund: { ...land.grund, politik: "fest" } });
      for (const [j, soll] of Object.entries(iwf))
        expect(Math.abs(modellWert(r[+j - land.datenstand], "defizit") - soll), `${code} ${j}`).toBeLessThanOrEqual(TOLERANZ.defizit);
    });
  // Prüfung M29, Befund 3: Mit Politik „reagiert“ (Standard) greift die Regierung bei Schwäche ein, einzelne
  // Jahre weichen dann bis 1 Pp. ab (Kanada 2030). Im Mittel 2026–2031, den der Konsens-Satz zeigt, trifft es.
  for (const [code, land] of Object.entries(LAENDER))
    it(`${code}: mit Politik reagiert im Mittel 2026–2031 auf dem IWF`, () => {
      const iwf = land.konsens!.quellen.find((q) => q.kurz === "IWF")!.werte.defizit!;
      const r = rechne(land, { ...basisSzenario(land), grund: { ...land.grund, politik: "reagiert" } });
      const ab = Object.entries(iwf).map(([j, soll]) => modellWert(r[+j - land.datenstand], "defizit") - soll);
      expect(Math.abs(ab.reduce((x, y) => x + y, 0) / ab.length)).toBeLessThanOrEqual(TOLERANZ.defizit);
    });
  it("Rückblick ohne Plan", () => expect(RUECKBLICK.land.plan).toBeUndefined());
});
