import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { baueFall, type Fall } from "../../daten/kalibrierung/lade";
import { kriterien, laufFall } from "../../scripts/banken-kalibrierung";
import { rechne } from "../rechne";
import type { Zustand } from "../typen";

// Historische Kalibrierfälle (Spec 9a, Update 4c). Prüfmaßstab: Richtung und Größenordnung.
// Verfehlte Kriterien stehen als „bekannte Lücke“ mit Kritikpunkt; wird eine Lücke geschlossen,
// schlägt der Test an und kann zu einem normalen Test werden.
const lauf = (n: string) => {
  const f = JSON.parse(readFileSync(`daten/kalibrierung/${n}.json`, "utf-8")) as Fall;
  const { land, sz } = baueFall(f);
  return rechne(land, sz);
};
const im = (r: Zustand[], j: number) => r.find((z) => z.jahr === j)!;
const zwischen = (r: Zustand[], a: number, b: number) => r.filter((z) => z.jahr >= a && z.jahr <= b);
const mittel = (r: Zustand[], a: number, b: number) => {
  const x = zwischen(r, a, b).map((z) => z.wachstumProKopf * 100);
  return x.reduce((s, v) => s + v, 0) / x.length;
};

describe("Kalibrierfall Venezuela 1999–2021", () => {
  const r = lauf("venezuela");
  it("Hyperinflation über 1.000 % in 2017–2019", () => {
    expect(Math.max(...zwischen(r, 2017, 2019).map((z) => z.inflation))).toBeGreaterThan(1000);
  });
  it("Förderverfall: Förderzustand 2020 unter 0,6", () => expect(im(r, 2020).foerderZustand).toBeLessThan(0.6));
  it("Abwanderung: Bevölkerung 2020 mindestens 5 % unter demselben Lauf ohne Abwanderung", () => {
    const f = JSON.parse(readFileSync("daten/kalibrierung/venezuela.json", "utf-8")) as Fall;
    const { land, sz } = baueFall({ ...f, aus: ["ordnung.abwanderung"] });
    expect(im(r, 2020).bev).toBeLessThan(0.95 * im(rechne(land, sz), 2020).bev);
  });
  it("Rohstofferlöse bleiben auch bei Kurssprüngen in der Größenordnung (unter 60 % BIP)", () => {
    expect(Math.max(...r.map((z) => z.rohstoffExporte))).toBeLessThan(60);
  });
  it.fails("bekannte Lücke (M26): BIP pro Kopf 2013 → 2020 mindestens −50 %", () => {
    expect(im(r, 2020).bipProKopf / im(r, 2013).bipProKopf).toBeLessThanOrEqual(0.5);
  });
});

describe("Kalibrierfall UdSSR 1950–1991", () => {
  const r = lauf("udssr");
  it("1950er: Wachstum pro Kopf über 3 %", () => expect(mittel(r, 1951, 1959)).toBeGreaterThan(3));
  it("Kapitaleffizienz 1985 unter 0,85", () => expect(im(r, 1985).kapitalEffizienz).toBeLessThan(0.85));
  it.fails("bekannte Lücke (M27): 1980er Wachstum pro Kopf unter 1 %", () => {
    expect(mittel(r, 1980, 1989)).toBeLessThan(1);
  });
});

describe("Kalibrierfall DDR neben BRD 1950–1989", () => {
  it("Produktivität der DDR 1989 zwischen 30 und 60 % der BRD", () => {
    const d = im(lauf("ddr"), 1989), b = im(lauf("brd"), 1989);
    const q = d.Y / d.beschaeftigte / (b.Y / b.beschaeftigte);
    expect(q).toBeGreaterThan(0.3);
    expect(q).toBeLessThan(0.6);
  });
});

describe("Kalibrierfall Argentinien", () => {
  // Seit 13.5 Teil A erfüllt, aber aus dem falschen Grund: Die Lage „Krise“ 2002 entsteht aus dem
  // Sägezahn des Kreditimpulses bei Deflation (Kritikpunkt M30), nicht aus der Überbewertung (M3 bleibt offen).
  it("1992–2002 Lage „Krise“ 2001 (±1) unter harter Währung (erfüllt über den Kredit-Sägezahn, M30)", () => {
    const r = lauf("argentinien-1992");
    expect(zwischen(r, 2000, 2002).some((z) => z.lage === "krise")).toBe(true);
  });
  it.fails("bekannte Lücke (M3): 1992–2002 Schuldenschnitt 2001 (±1) unter harter Währung", () => {
    const r = lauf("argentinien-1992");
    expect(zwischen(r, 2000, 2002).some((z) => z.ventilSeit === 0 && z.ventilArt === 1)).toBe(true);
  });
  it("2005–2023: Schwarzmarkt-Aufschlag über 50 % in einer Phase mit Kapitalkontrollen", () => {
    const r = lauf("argentinien-2005");
    const max = Math.max(...[...zwischen(r, 2012, 2015), ...zwischen(r, 2019, 2023)].map((z) => z.schwarzmarkt));
    expect(max).toBeGreaterThan(50);
  });
});

describe("Kalibrierfall Russland 1995–2000", () => {
  const r = lauf("russland-1995");
  it.fails("bekannte Lücke (M28): Desinflation 1996–1997, Inflation 1997 unter 40 %", () => {
    expect(im(r, 1997).inflation).toBeLessThan(40);
  });
  it("Kapitalflucht in der Krise 1998–1999", () => expect(zwischen(r, 1998, 1999).some((z) => z.kapitalflucht > 0)).toBe(true));
  // Das Ventil öffnet, aber über den Inflationsaufschlag, nicht über Schuld und Ölpreis (M3, M28).
  it("Krise mit Ventil 1998 (±1), Staatsschuld davor positiv", () => {
    const v = zwischen(r, 1997, 1999).find((z) => z.ventilSeit === 0 && z.lage === "krise");
    expect(v).toBeDefined();
    expect(im(r, v!.jahr - 1).schuldQuote).toBeGreaterThan(0);
  });
});

describe("Kalibrierfall Kuba 1960–2020", () => {
  const r = lauf("kuba");
  it("Knappheit dauerhaft über 0 (ab 1963)", () => expect(zwischen(r, 1963, 2020).every((z) => z.knappheit > 0)).toBe(true));
  it.fails("bekannte Lücke (M26): Wegfall der Sowjet-Hilfe → BIP pro Kopf 1990 → 1993 mindestens −25 %", () => {
    expect(im(r, 1993).bipProKopf / im(r, 1990).bipProKopf).toBeLessThanOrEqual(0.75);
  });
});

describe("Kalibrierfall Griechenland 2008–2015 (Ventil, M3)", () => {
  const r = lauf("griechenland");
  it("BIP 2008 → 2013 fällt (Richtung)", () => expect(im(r, 2013).Y).toBeLessThan(im(r, 2008).Y));
  it.fails("bekannte Lücke (M3): BIP 2008 → 2013 rund −25 % (mindestens −15 %)", () => {
    expect(im(r, 2013).Y / im(r, 2008).Y).toBeLessThanOrEqual(0.85);
  });
  it("Schuldenschnitt 2011–2013 (M3: Auslandsschuld, Defizit, Panik ohne Schutzprogramm)", () => {
    expect(zwischen(r, 2011, 2013).some((z) => z.ventilSeit === 0 && z.ventilArt === 1)).toBe(true);
  });
  it("ohne die drei Aufschlag-Teile kein Schuldenschnitt (Wirkung liegt im Mechanismus)", () => {
    const f = JSON.parse(readFileSync("daten/kalibrierung/griechenland.json", "utf-8")) as Fall;
    const { land, sz } = baueFall({ ...f, aus: ["anleihen.nfaRisiko", "anleihen.defizitRisiko", "anleihen.panik"] });
    expect(rechne(land, sz).some((z) => z.ventilSeit === 0)).toBe(false);
  });
});

// Spec 13.6: Fälle mit Bankenkrise. Die Kriterien stehen in scripts/banken-kalibrierung.ts (dasselbe
// Skript druckt sie mit Werten). Der Boom entsteht aus der gemessenen Geldpolitik; in USA, Spanien
// und Irland ist die Finanzkrise 2008/2009 als Auslöser gesetzt (M31).
describe("Bankenkrisen (Spec 13.6)", () => {
  for (const [fall, liste] of Object.entries(kriterien()))
    describe(fall, () => {
      for (const [name, ok, wert, luecke] of liste)
        (luecke ? it.fails : it)(`${luecke ? `bekannte Lücke (${luecke}): ` : ""}${name} — ${wert}`, () => expect(ok).toBe(true));
    });
  it("alle fünf Fälle rechnen endlich, faule Kredite in [0, 60], Rettung ≥ 0", () => {
    for (const n of ["usa-2000", "spanien-1998", "irland-2002", "japan-1985", "kanada-2000"])
      for (const z of laufFall(n)) {
        for (const [f, w] of Object.entries(z)) if (typeof w === "number") expect(Number.isFinite(w), `${n} ${z.jahr} ${f}`).toBe(true);
        expect(z.npl).toBeGreaterThanOrEqual(0);
        expect(z.npl).toBeLessThanOrEqual(60);
        expect(z.rettung).toBeGreaterThanOrEqual(0);
      }
  });
  it("mit Banken „aus“ rechnen die Fälle ohne Hauspreis und ohne Rettung", () => {
    const r = laufFall("usa-2000", { banken: "aus" });
    expect(r.every((z) => z.hauspreis === 100 && z.rettung === 0 && z.klemme === 0)).toBe(true);
  });
});
