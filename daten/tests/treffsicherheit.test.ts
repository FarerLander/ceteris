import { existsSync, readFileSync } from "node:fs";
import { rechne } from "../../modell/rechne";
import { bewerte, pruefeTreffsicherheit } from "../../modell/rueckblick";
import { baueRueckblick, istReihen } from "../historie";
import { LAENDER } from "../parser";
import type { AutoDatei, HandDatei, HistorieDatei } from "../typen";

const HEUTE = new Date("2026-09-27");
// Festgelegt (Abschnitt 11 der Spezifikation): Größen, die die harte Hürde verfehlen dürfen,
// mit Obergrenze, damit sie nicht schlechter werden.
const BEKANNTE_SCHWAECHEN: Record<string, Record<string, number>> = {
  DE: { schuldQuote: 1.3 },
};
const lies = <T>(p: string) => JSON.parse(readFileSync(p, "utf-8")) as T;

for (const code of Object.keys(LAENDER)) {
  const pfad = `daten/laender/${code}-historie.json`;
  describe(`Treffsicherheit ${code}`, () => {
    if (!existsSync(pfad)) {
      it("Grenzfall: ohne Historie kein Hürdentest (Kritikpunkt T4)", () =>
        expect(code).not.toBe("DE"));
      return;
    }
    const auto = lies<AutoDatei>(`daten/laender/${code}.json`);
    const hist = lies<HistorieDatei>(pfad);
    const { land, sz } = baueRueckblick(
      auto,
      lies<HandDatei>(`daten/laender/${code}-hand.json`),
      hist,
      HEUTE,
    );
    const liste = pruefeTreffsicherheit(
      rechne(land, sz),
      istReihen(auto, hist),
    );
    it("alle neun Größen haben Ist-Daten", () => {
      for (const t of liste) expect(bewerte(t), t.name).not.toBe("keine Daten");
    });
    for (const t of liste) {
      const schwaeche = BEKANNTE_SCHWAECHEN[code]?.[t.id];
      if (schwaeche !== undefined) {
        it(`bekannte Schwäche: ${t.name} wird nicht schlechter (Theil's U < ${schwaeche}, Spec 11)`, () => {
          expect(t.theilU!, `${t.name}: U = ${t.theilU}`).toBeLessThan(schwaeche);
        });
        continue;
      }
      it(`harte Hürde: ${t.name} schlägt „alles bleibt“ (Theil's U < 1)`, () => {
        expect(t.theilU!, `${t.name}: U = ${t.theilU}`).toBeLessThan(1);
      });
    }
  });
}
