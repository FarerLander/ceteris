import { describe, expect, it } from "vitest";
import { basisSzenario, rechne } from "../rechne";
import { startzustand } from "../start";
import type { Szenario } from "../typen";
import { eintrag } from "../verzeichnis";
import { testland } from "./testland";
import { IST, LAENDER, RUECKBLICK } from "../../app/land";

// Spec 13.5 Teil B: Investitionen folgen der Auslastung; öffentliche Investitionen bauen einen Kapitalstock auf.
const land = testland();
const lauf = (extra: Partial<Szenario> = {}, jahre = 31) => rechne(land, { ...basisSzenario(land, jahre), ...extra });
const krise = { schocks: [{ id: 1, art: "krise" as const, jahr: 2030, staerke: 1, dauer: 1 }] };

describe("Akzelerator (Hypothese 2)", () => {
  it("Verzeichnis: Akzelerator 0,44 abschaltbar; Zinswirkung auf Investitionen 0,15", () => {
    const a = eintrag("wachstum.akzelerator");
    expect(a.art).toBe("wirkstaerke");
    expect(a.standard).toBe(0.44);
    expect(a.umstritten).toBe(true);
    expect(a.neutral).toBe(0);
    expect(eintrag("wachstum.investElastizitaet").standard).toBe(0.15);
  });

  it("in der Rezession fällt die Investitionsquote: 0,44 Pp. je Prozent Lücke des Vorjahres", () => {
    const mit = lauf(krise, 9);
    const ohne = lauf({ ...krise, aus: ["wachstum.akzelerator"] }, 9);
    // Im Krisenjahr selbst zählt die Lücke des Vorjahres (im Testland leicht negativ).
    expect(mit[5].investQuote - ohne[5].investQuote).toBeCloseTo(0.44 * mit[4].luecke * 100, 1);
    expect(Math.abs(mit[5].investQuote - ohne[5].investQuote)).toBeLessThan(0.5);
    // Im Jahr darauf: Die Lücke von 2030 drückt die Quote.
    expect(mit[6].investQuote - ohne[6].investQuote).toBeCloseTo(0.44 * mit[5].luecke * 100, 0);
    expect(mit[6].investQuote - ohne[6].investQuote).toBeLessThan(-1.5);
    expect(mit[6].investQuote).toBeLessThan(mit[4].investQuote - 1);
  });

  it("eine Krise kostet dauerhaft: weniger Kapital, niedrigeres BIP pro Kopf als ohne Akzelerator", () => {
    const verlust = (aus: string[]) => {
      const basis = lauf({ aus });
      const k = lauf({ ...krise, aus });
      return { bip: k[20].bipProKopf / basis[20].bipProKopf - 1, kapital: k[20].K / basis[20].K - 1 };
    };
    const mit = verlust([]), ohne = verlust(["wachstum.akzelerator"]);
    expect(mit.kapital).toBeLessThan(ohne.kapital - 0.002);
    expect(mit.bip).toBeLessThan(ohne.bip);
  });

  it("keine Schwingung: Im Basislauf bleibt die Lücke so ruhig wie ohne Akzelerator", () => {
    const sd = (v: number[]) => {
      const m = v.reduce((a, b) => a + b, 0) / v.length;
      return Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / v.length);
    };
    const mit = sd(lauf({}, 51).slice(5).map((z) => z.luecke * 100));
    const ohne = sd(lauf({ aus: ["wachstum.akzelerator"] }, 51).slice(5).map((z) => z.luecke * 100));
    expect(mit).toBeLessThan(ohne + 0.05);
  });
});

describe("Öffentliche Investitionen (Hypothese 6)", () => {
  const basis = land.standards["staat.investitionen"] ?? eintrag("staat.investitionen").standard;

  it("Verzeichnis und Startzustand: Hebel, zwei Wirkstärken, Bestand aus Investition ÷ (Abschreibung + Trendwachstum)", () => {
    const e = eintrag("staat.investitionen");
    expect(e.art).toBe("stellschraube");
    expect(e.bereich).toEqual([0, 8]);
    expect(eintrag("staat.oeffKapital").standard).toBe(0.1);
    expect(eintrag("staat.oeffKapital").umstritten).toBe(true);
    expect(eintrag("staat.oeffAbschreibung").standard).toBe(0.045);
    const { z, c } = startzustand(land, basisSzenario(land));
    expect(z.oeffKapital).toBe(0);
    expect(z.oeffWirk).toBe(0);
    expect(c.oeffKapital0).toBeCloseTo(basis / (0.045 + land.start.tfpTrend / 100), 9);
  });

  it("ohne Änderung am Hebel bleibt alles bitgenau wie ohne den Mechanismus", () => {
    const a = lauf({}, 26), b = lauf({ aus: ["staat.oeffKapital"] }, 26);
    a.forEach((z, i) => {
      for (const f of ["Y", "A", "schuldQuote", "primaerausgaben", "luecke"] as const) expect(z[f], `${z.jahr} ${f}`).toBe(b[i][f]);
      expect(z.oeffKapital).toBe(0);
    });
  });

  it("1 % BIP mehr: Ausgaben steigen um 1 % BIP, der Bestand wächst, die Produktivität folgt", () => {
    const b = lauf({}, 26);
    const mehr = lauf({ stell: { "staat.investitionen": basis + 1 } }, 26);
    // Die Schuldenregel des Testlands steuert einen Teil gegen; der Rest kommt als Ausgabe an.
    expect(mehr[1].primaerausgaben - b[1].primaerausgaben).toBeGreaterThan(0.7);
    expect(mehr[1].primaerausgaben - b[1].primaerausgaben).toBeLessThanOrEqual(1 + 1e-9);
    expect(mehr[1].oeffKapital).toBeCloseTo(1, 9);
    expect(mehr[10].oeffKapital).toBeGreaterThan(6.5);
    expect(mehr[10].oeffKapital).toBeLessThan(9);
    // Elastizität 0,10: nach 25 Jahren rund 2 % mehr Produktivität.
    expect(mehr[25].A / b[25].A - 1).toBeGreaterThan(0.015);
    expect(mehr[25].A / b[25].A - 1).toBeLessThan(0.035);
    expect(mehr[25].bipProKopf).toBeGreaterThan(b[25].bipProKopf * 1.015);
    // Abgeschaltet bleibt nur die Ausgabe.
    const aus = lauf({ stell: { "staat.investitionen": basis + 1 }, aus: ["staat.oeffKapital"] }, 26);
    expect(aus[25].A).toBeCloseTo(b[25].A, 9);
    expect(aus[1].primaerausgaben).toBeCloseTo(mehr[1].primaerausgaben, 9);
  });

  it("Kürzen lässt die Substanz verfallen; der Bestand fällt nie unter ein Zehntel", () => {
    const b = lauf({}, 51);
    const null0 = lauf({ stell: { "staat.investitionen": 0 } }, 51);
    expect(null0[10].oeffKapital).toBeLessThan(0);
    expect(null0[25].A).toBeLessThan(b[25].A * 0.97);
    const { c } = startzustand(land, basisSzenario(land));
    for (const z of null0) {
      expect(z.oeffKapital).toBeGreaterThanOrEqual(-0.9 * c.oeffKapital0 - 1e-9);
      expect(Number.isFinite(z.A)).toBe(true);
    }
  });

  it("zurück auf den Standard: Der Zusatzbestand schreibt sich ab, die Wirkung klingt aus", () => {
    const pfad = [{ ab: 2025, wert: basis + 2 }, { ab: 2035, wert: basis }];
    const v = lauf({ stell: { "staat.investitionen": pfad } }, 51);
    expect(v[10].oeffKapital).toBeGreaterThan(v[30].oeffKapital * 2);
    expect(v[50].oeffWirk).toBeLessThan(v[10].oeffWirk / 3);
    expect(v[50].oeffWirk).toBeGreaterThan(0);
  });
});

describe("Investitionsanker (M34)", () => {
  it("gleitet zur Quote, die den Kapitalstock hält; aus = Startquote", () => {
    const l = LAENDER.CN;
    const sz = { ...basisSzenario(l), grund: { ...l.grund, politik: "fest" as const } };
    const an = rechne(l, sz);
    const aus = rechne(l, { ...sz, aus: [...sz.aus, "wachstum.investAnpassung"] });
    const am = (r: typeof an, j: number) => r.find((z) => z.jahr === j)!;
    expect(am(an, 2050).investQuote).toBeLessThan(am(aus, 2050).investQuote - 5);
    expect(am(an, 2050).K / am(an, 2050).Y).toBeLessThan(am(aus, 2050).K / am(aus, 2050).Y);
  });

  it("Rückblick Deutschland trifft die Investitionsquote besser (vorher 4,7 Pp.)", () => {
    const rb = rechne(RUECKBLICK.land, RUECKBLICK.sz);
    const ist = IST.investQuote!;
    const m = rb.filter((z) => ist[z.jahr] !== undefined);
    const rmse = Math.sqrt(m.reduce((a, z) => a + (z.investQuote - ist[z.jahr]) ** 2, 0) / m.length);
    expect(rmse).toBeLessThan(2.5);
  });
});

describe("Öffentlicher Kapitalstock: gemessener Bestand als Bezug (M35)", () => {
  const wirkung = (code: string) => {
    const l = LAENDER[code];
    const sz = { ...basisSzenario(l), grund: { ...l.grund, politik: "fest" as const } };
    const b = rechne(l, sz), m = rechne(l, { ...sz, stell: { "staat.investitionen": l.standards["staat.investitionen"]! + 1 } });
    const t = b.findIndex((z) => z.jahr === 2050);
    return m[t].bipProKopf / b[t].bipProKopf - 1;
  };
  it("Bezug ist der IWF-Bestand des Landes", () => {
    expect(startzustand(LAENDER.DE, basisSzenario(LAENDER.DE)).c.oeffKapital0).toBe(44);
    expect(startzustand(LAENDER.JP, basisSzenario(LAENDER.JP)).c.oeffKapital0).toBe(121);
  });
  it("kleiner Bestand, größerer Ertrag je Euro: Deutschland gewinnt mehr als doppelt so viel wie Japan", () => {
    expect(wirkung("DE")).toBeGreaterThan(2 * wirkung("JP"));
  });
});
