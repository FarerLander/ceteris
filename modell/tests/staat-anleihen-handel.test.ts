import { LAENDER } from "../../app/land";
import { aufschlagFormel } from "../anleihenformel";
import { anleihen } from "../bausteine/anleihen";
import { demografie } from "../bausteine/demografie";
import { energie } from "../bausteine/energie";
import { geld } from "../bausteine/geld";
import { handel } from "../bausteine/handel";
import { innovation } from "../bausteine/innovation";
import { ordnung } from "../bausteine/ordnung";
import { privatschuld } from "../bausteine/privatschuld";
import { aufkommen, staat } from "../bausteine/staat";
import { wachstum } from "../bausteine/wachstum";
import { baueKontext, wirkstaerke } from "../kontext";
import { basisSzenario, rechne } from "../rechne";
import type { Konstanten, Szenario } from "../typen";
import { testland } from "./testland";

const BS = [
  demografie,
  ordnung,
  energie,
  innovation,
  wachstum,
  privatschuld,
  geld,
  staat,
  anleihen,
  handel,
];
const land = testland();
const lauf = (stell: Szenario["stell"] = {}, jahre = 11) =>
  rechne(land, { ...basisSzenario(land, jahre), stell }, BS);
const p = (id: string) => wirkstaerke(id, land);

describe("Staat", () => {
  const v = lauf();
  it("erstes Jahr trifft die Startwerte von Einnahmen und Ausgaben", () => {
    expect(Math.abs(v[1].einnahmen - v[0].einnahmen)).toBeLessThan(0.8);
    expect(Math.abs(v[1].primaerausgaben - v[0].primaerausgaben)).toBeLessThan(
      0.8,
    );
  });
  it("Buchhaltung: Schuld(t+1) = Schuld(t) + Defizit(t)", () => {
    for (let t = 1; t < v.length; t++)
      expect(v[t].schuldNom).toBeCloseTo(
        v[t - 1].schuldNom + v[t].defizitNom,
        6,
      );
  });
  it("Laffer: das Aufkommen der Kapitalertragsteuer hat ein inneres Maximum", () => {
    const saetze = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
    const werte = saetze.map((s) => {
      const k = baueKontext(
        land,
        { ...basisSzenario(land), stell: { "steuer.kapitalertrag": s } },
        {} as Konstanten,
        1,
      );
      return aufkommen(k, "kapitalertrag", 0.8);
    });
    const max = werte.indexOf(Math.max(...werte));
    expect(max).toBeGreaterThan(0);
    expect(max).toBeLessThan(saetze.length - 1);
  });
});

describe("Anleihen", () => {
  it("bei 150 % Schuld: Gemeinschaftswährung steil, eigene Währung flach, TPI dämpft", () => {
    const euro = aufschlagFormel("euro", false, 150, 0.5, 2, 2, p);
    const eigen = aufschlagFormel("eigen", false, 150, 0.5, 2, 2, p);
    const tpi = aufschlagFormel("euro", true, 150, 0.5, 2, 2, p);
    expect(euro).toBeGreaterThan(3);
    expect(eigen).toBeLessThan(1);
    expect(tpi).toBeLessThan(euro * 0.5);
  });
  it("Rendite im ersten Jahr nahe am Startwert (Kalibrierung)", () => {
    const v = lauf({}, 2);
    expect(Math.abs(v[1].rendite - land.start.rendite)).toBeLessThan(0.5);
  });
});

describe("Handel", () => {
  it("Exporte im ersten Jahr nahe am Start", () => {
    const v = lauf({}, 2);
    expect(Math.abs(v[1].exporte - land.start.exporte)).toBeLessThan(2);
  });
  it("dauerhaft teure Energie lässt energieintensive Exporte schrumpfen", () => {
    const v = lauf({ "energie.co2Preis": 300 }, 21);
    expect(v[20].energieExportAnteil).toBeLessThan(
      land.start.energieExportAnteil,
    );
  });
  const weltLauf = (nachfrage: number, jahre: number, l = land) =>
    rechne(l, { ...basisSzenario(l, jahre), welt: { nachfrage } }, BS);
  it("Exporte folgen der relativen Weltnachfrage etwa eins zu eins", () => {
    const stark = weltLauf(5, 11);
    const normal = weltLauf(2.5, 11);
    const relativ = (v: typeof stark) => v[10].weltnachfrage / (v[10].Y / v[0].Y);
    const eps = Math.log(stark[10].exporte / normal[10].exporte) / Math.log(relativ(stark) / relativ(normal));
    expect(eps).toBeGreaterThan(0.6);
  });
  it("mehr Exporte ziehen Vorleistungsimporte nach", () => {
    expect(weltLauf(5, 11)[10].importe).toBeGreaterThan(weltLauf(2.5, 11)[10].importe + 1);
  });
  it("Importe wachsen mit dem eigenen Einkommen stärker als das BIP", () => {
    // Kurzer Zeitraum, damit der Vermögenseffekt den Einkommenseffekt nicht überlagert.
    const v = lauf({ "mig.netto": 1500 }, 7);
    const w = lauf({}, 7);
    expect(v[6].Y).toBeGreaterThan(w[6].Y);
    const inland = (j: (typeof v)[number]) => j.importe - p("handel.exportImportGehalt") * j.exporte;
    const eps = Math.log(inland(v[6]) / inland(w[6])) / Math.log(v[6].Y / w[6].Y);
    expect(eps).toBeGreaterThan(0.3);
  });
  it.each(["euro", "eigen", "welt", "hart"] as const)(
    "Wächter: Auslandsvermögen, Exportquote und Leistungsbilanz über 100 Jahre begrenzt (%s, M20)",
    (regime) => {
      const l = testland({}, { regime });
      const v = weltLauf(2.5, 101, l);
      expect(Math.abs(v[100].nfa)).toBeLessThan(500);
      expect(v[100].exporte).toBeLessThan(125);
      expect(Math.abs(v[100].leistungsbilanz)).toBeLessThan(15);
    },
  );
  // Restdrift, weil die Welt dauerhaft schneller wächst als das Land (Kritikpunkt M20).
  it.each(["euro", "eigen", "welt", "hart"] as const)(
    "Leistungsbilanz bleibt über 50 Jahre unter 40 % des BIP (%s)",
    (regime) => {
      const l = testland({}, { regime });
      const v = weltLauf(2.5, 51, l);
      expect(Math.abs(v[50].leistungsbilanz)).toBeLessThan(40);
    },
  );
});

describe("M3: Aufschlag aus Auslandsschuld, Defizit und Panik", () => {
  const p = (id: string) => (({
    "anleihen.kEuro": 0.012, "anleihen.schwelle": 60, "anleihen.nfaRisiko": 0.03, "anleihen.nfaSchwelle": 60,
    "anleihen.defizitRisiko": 0.25, "anleihen.defizitSchwelle": 3, "anleihen.panik": 0.5, "anleihen.panikSchwelle": 5,
    "anleihen.tpiDaempfung": 0.3, "anleihen.kGelenkt": 0.01,
  }) as Record<string, number>)[id];
  const v = { nfa: -120, primaer: -10, reserve: 0 };
  it("Auslandsschuld und Defizit erhöhen den Aufschlag, eine Reservewährung schützt", () => {
    const ohne = aufschlagFormel("euro", true, 150, 0.7, 2, 2, p);
    expect(aufschlagFormel("euro", true, 150, 0.7, 2, 2, p, v)).toBeCloseTo(ohne + 0.03 * 60 + 0.25 * 7, 6);
    expect(aufschlagFormel("euro", true, 150, 0.7, 2, 2, p, { ...v, reserve: 1 })).toBeCloseTo(ohne, 6);
  });
  const ohnePanik = (id: string) => (id === "anleihen.panik" ? 0 : p(id));
  it("Panik wirkt ohne Schutzprogramm und bei harter Währung, nicht mit TPI, nicht gelenkt", () => {
    const mit = aufschlagFormel("euro", false, 150, 0.7, 2, 2, p, v);
    const ohne = aufschlagFormel("euro", false, 150, 0.7, 2, 2, ohnePanik, v);
    expect(mit).toBeCloseTo(ohne + 0.5 * (ohne - 5), 6);
    const hartP = (id: string) => (id === "anleihen.kHart" ? 0.02 : p(id));
    const hartOhne = (id: string) => (id === "anleihen.panik" ? 0 : hartP(id));
    expect(aufschlagFormel("hart", false, 150, 0.7, 2, 2, hartP, v)).toBeGreaterThan(aufschlagFormel("hart", false, 150, 0.7, 2, 2, hartOhne, v));
    expect(aufschlagFormel("euro", true, 150, 0.7, 2, 2, p, v)).toBe(aufschlagFormel("euro", true, 150, 0.7, 2, 2, ohnePanik, v));
    expect(aufschlagFormel("gelenkt", false, 150, 0.7, 2, 2, p, v)).toBe(aufschlagFormel("gelenkt", false, 150, 0.7, 2, 2, p));
  });
  it("Reservewährung dämpft auch die Panik", () => {
    const r1 = { ...v, reserve: 1 };
    expect(aufschlagFormel("euro", false, 150, 0.7, 2, 2, p, r1)).toBe(aufschlagFormel("euro", false, 150, 0.7, 2, 2, ohnePanik, r1));
  });
  it("Abschalten der drei Teile ändert die Rendite im ersten Jahr kaum (Startwert nicht in der Prämie gefangen)", () => {
    const FR = LAENDER.FR;
    // Ohne Haushaltsplan (M29): Der Plan ändert das Defizit im ersten Jahr gewollt.
    const grund = { ...FR.grund, haushaltsplan: "aus" as const };
    const an = rechne(FR, { ...basisSzenario(FR, 3), grund });
    const aus = rechne(FR, { ...basisSzenario(FR, 3), grund, aus: ["anleihen.nfaRisiko", "anleihen.defizitRisiko", "anleihen.panik"] });
    // Übrig bleibt nur die Veränderung im ersten Jahr (Defizit 3,57 → 3,81 % × 0,25 ≈ 0,06); vorher 0,2.
    expect(Math.abs(aus[1].rendite - an[1].rendite)).toBeLessThan(0.1);
  });
});
