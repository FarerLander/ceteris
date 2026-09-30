import { describe, expect, it } from "vitest";
import { LAENDER_HAND as LAENDER } from "../../app/land";
import { basisSzenario, rechne } from "../rechne";
import abzug from "./abzug.json";

// Update 4a: neue Mechanik darf die Basisläufe nicht verändern — bitgenau.
const ALT = abzug as unknown as Record<string, Record<string, number | string>[]>;
// Mechanik seit dem Abzug, abgeschaltet muss sie bitgenau wie vorher rechnen.
// 13.5 Teil A: Asymmetrie des Kreditimpulses (aus = symmetrisch).
// 13.5 Teil B: Akzelerator (aus = 0). Die Zinswirkung auf Investitionen ist von 0,6 auf 0,15 gesenkt;
// mit dem alten Wert rechnet die Mechanik bitgenau wie vorher. Öffentliche Investitionen: ohne Änderung
// am Hebel wirkt nichts.
const NEU_AUS = ["wachstum.kreditAsymmetrie", "wachstum.akzelerator"];
const ALTE_WERTE = { "wachstum.investElastizitaet": 0.6 };

describe("Neutralität: Basisläufe wie beim letzten Abzug", () => {
  // Nur die Länder im Abzug; neue Länder kommen mit dem nächsten Abzug dazu.
  for (const code of Object.keys(ALT))
    it(code, () => {
      const land = { ...LAENDER[code], standards: { ...LAENDER[code].standards, ...ALTE_WERTE } };
      // 13.1: Mechanik mit Handwerten bitgenau. 13.10: Politik fest muss bitgenau gleich bleiben.
      // 13.6: Banken aus = wie vorher. M29: Haushaltsplan aus = wie vorher.
      const r = rechne(land, { ...basisSzenario(land), aus: NEU_AUS, grund: { ...land.grund, politik: "fest", banken: "aus", haushaltsplan: "aus" } });
      const alt = ALT[code];
      expect(r).toHaveLength(alt.length);
      r.forEach((z, i) => {
        const neu: Record<string, unknown> = { ...z, lage: z.lage };
        for (const [f, v] of Object.entries(z.mix)) neu[`mix.${f}`] = v;
        for (const [f, v] of Object.entries(alt[i]))
          // JSON kennt kein −0: Nullen per ===, alles andere bitgenau.
          if (v === 0) expect(neu[f] === 0, `${code} ${z.jahr} ${f}`).toBe(true);
          else expect(neu[f], `${code} ${z.jahr} ${f}`).toBe(v);
      });
    });
});
