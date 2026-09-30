import {
  demografie,
  lebenserwartungAus,
  sterberaten,
} from "../bausteine/demografie";
import { basisSzenario, rechne } from "../rechne";
import type { Szenario } from "../typen";
import { testland } from "./testland";

const land = testland();
const lauf = (
  stell: Szenario["stell"] = {},
  jahre = 11,
  extra: Partial<Szenario> = {},
) =>
  rechne(land, { ...basisSzenario(land, jahre), stell, ...extra }, [
    demografie,
  ]);

describe("Demografie", () => {
  it("Sterberaten treffen die Lebenserwartung", () => {
    expect(lebenserwartungAus(sterberaten(81, 0.085))).toBeCloseTo(81, 1);
    expect(lebenserwartungAus(sterberaten(70, 0.085))).toBeCloseTo(70, 1);
  });
  it("Buchhaltung: Bestand + Geburten − Tote + Zuwanderung − Abwanderung", () => {
    const v = lauf({ "mig.abwanderungQual": 100 });
    for (let t = 1; t < v.length; t++) {
      const erwartet =
        v[t - 1].bev +
        v[t].geburten -
        v[t].sterbefaelle +
        v[t].zuwanderung -
        v[t].abwanderung;
      expect(v[t].bev).toBeCloseTo(erwartet, 9);
    }
  });
  it("Geburten und Sterbefälle liegen in plausibler Größe", () => {
    const v = lauf();
    expect(v[1].geburten).toBeGreaterThan(0.5);
    expect(v[1].geburten).toBeLessThan(0.85);
    expect(v[1].sterbefaelle).toBeGreaterThan(0.7);
    expect(v[1].sterbefaelle).toBeLessThan(1.4);
  });
  it("höheres Rentenalter ergibt mehr Erwerbsfähige und weniger Rentner", () => {
    const a = lauf({ "rente.alter": 67 }),
      b = lauf({ "rente.alter": 69 });
    expect(b[1].erwerbsfaehige - a[1].erwerbsfaehige).toBeGreaterThan(1);
    expect(b[1].rentner).toBeLessThan(a[1].rentner);
  });
  it("höhere Qualifikation und aktive Integration ergeben mehr beschäftigte Zugewanderte", () => {
    const niedrig = lauf({ "mig.anteilHoch": 0.1, "mig.anteilMittel": 0.2 });
    const hoch = lauf({ "mig.anteilHoch": 0.7, "mig.anteilMittel": 0.2 });
    const aktiv = lauf({
      "mig.anteilHoch": 0.1,
      "mig.anteilMittel": 0.2,
      "mig.integrationspolitik": 1,
    });
    expect(hoch[10].migBeschaeftigte).toBeGreaterThan(
      niedrig[10].migBeschaeftigte,
    );
    expect(aktiv[10].migBeschaeftigte).toBeGreaterThan(
      niedrig[10].migBeschaeftigte,
    );
  });
  it("Stellvertreterkrieg bringt Geflüchtete als eigenen Jahrgang", () => {
    const v = lauf({}, 6, {
      schocks: [{ id: 1, art: "proxy", jahr: 2027, staerke: 1, dauer: 1 }],
    });
    expect(v[2].zuwanderung).toBeCloseTo(0.3 + 0.9, 9);
    expect(
      v[2].migJahrgaenge.some((j) => j.alterAnkunft === 30 && j.anzahl === 0.9),
    ).toBe(true);
    expect(v[2].integrationskosten).toBeGreaterThan(v[1].integrationskosten);
  });
  it("Grenzfall: starke Abwanderung über 100 Jahre lässt keine Jahrgänge negativ werden", () => {
    const v = lauf(
      { "mig.netto": 0, "mig.abwanderungQual": 300, "demo.geburtenrate": 1.0 },
      101,
    );
    for (const z of v) {
      expect(Math.min(...z.alter)).toBeGreaterThanOrEqual(0);
      expect(z.bev).toBeGreaterThan(0);
    }
  });
  it("Abwanderung Qualifizierter trifft vor allem die 25- bis 40-Jährigen", () => {
    const a = lauf({}, 2), b = lauf({ "mig.abwanderungQual": 100 }, 2);
    const fehlt = (von: number, bis: number) =>
      a[1].alter.slice(von, bis + 1).reduce((s, x) => s + x, 0) -
      b[1].alter.slice(von, bis + 1).reduce((s, x) => s + x, 0);
    expect(fehlt(25, 40)).toBeGreaterThan(0.7 * b[1].abwanderung);
    expect(fehlt(50, 65)).toBeLessThan(0.01 * b[1].abwanderung);
  });
  it("Abgewanderte fehlen mit der Beschäftigungsquote hoch Qualifizierter", () => {
    const voll = (stell: Szenario["stell"]) => rechne(land, { ...basisSzenario(land, 3), stell });
    const a = voll({}), b = voll({ "mig.abwanderungQual": 100 });
    const quote = (a[1].erwerbspersonen - b[1].erwerbspersonen) / b[1].abwanderung;
    expect(quote).toBeCloseTo(0.82, 2);
    expect(b[2].abwErwerbsalter).toBeCloseTo(b[1].abwanderung + b[2].abwanderung, 9);
    expect(b[1].migBeschaeftigte).toBeCloseTo(a[1].migBeschaeftigte, 9);
  });
  it("Zensus-Korrektur bereinigt gleichmäßig und senkt die Beschäftigung nur über die Erwerbsquote", () => {
    const voll = (stell: Szenario["stell"]) => rechne(land, { ...basisSzenario(land, 2), stell });
    const a = voll({}), b = voll({ "demo.zensusKorrektur": 100 });
    expect(b[1].abwanderung).toBeCloseTo(0.1, 9);
    expect(b[1].abwErwerbsalter).toBe(0);
    const quote = (a[1].erwerbspersonen - b[1].erwerbspersonen) / b[1].abwanderung;
    expect(quote).toBeLessThan(0.82);
  });
});
