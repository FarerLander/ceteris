import { describe, expect, it } from "vitest";
import { LAENDER_HAND as LAENDER } from "../../app/land";
import { neutralLauf } from "./neutral-lauf";
import abzug from "./abzug.json";

// Update 4a: neue Mechanik darf die Basisläufe nicht verändern — bitgenau.
const ALT = abzug as unknown as Record<string, Record<string, number | string>[]>;
describe("Neutralität: Basisläufe wie beim letzten Abzug", () => {
  // Nur die Länder im Abzug; neue Länder kommen mit dem nächsten Abzug dazu.
  for (const code of Object.keys(ALT))
    it(code, () => {
      const r = neutralLauf(LAENDER[code]);
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
