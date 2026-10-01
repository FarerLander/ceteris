import { eintrag } from "../verzeichnis";
import autoGB from "../../daten/laender/GB.json";
import handGB from "../../daten/laender/GB-hand.json";
import autoFR from "../../daten/laender/FR.json";
import handFR from "../../daten/laender/FR-hand.json";
import autoIT from "../../daten/laender/IT.json";
import handIT from "../../daten/laender/IT-hand.json";
import autoCA from "../../daten/laender/CA.json";
import handCA from "../../daten/laender/CA-hand.json";
import autoDE from "../../daten/laender/DE.json";
import handDE from "../../daten/laender/DE-hand.json";
import autoJP from "../../daten/laender/JP.json";
import handJP from "../../daten/laender/JP-hand.json";
import autoUS from "../../daten/laender/US.json";
import handUS from "../../daten/laender/US-hand.json";
import { baueLand } from "../../daten/land";
import type { AutoDatei, HandDatei } from "../../daten/typen";
import { basisSzenario, rechne } from "../rechne";
import type { Zustand } from "../typen";
import { testland } from "./testland";

const HEUTE = new Date("2026-09-27");
const DE_SCHULD_2075 = 179.3911652321178;
const us = baueLand(
  autoUS as unknown as AutoDatei,
  handUS as unknown as HandDatei,
  HEUTE,
);
const jp = baueLand(
  autoJP as unknown as AutoDatei,
  handJP as unknown as HandDatei,
  HEUTE,
);
const endlich = (v: Zustand[]) =>
  v.every((z) =>
    [
      z.Y,
      z.schuldQuote,
      z.inflation,
      z.rendite,
      z.energiepreis,
      z.importe,
    ].every(Number.isFinite),
  );

describe("Währung", () => {
  it("Kurs und BIP in Landeswährung ändern die Quoten nicht", () => {
    const eur = testland({}, {});
    const yen = testland({ bip: 4300 * 160 }, {});
    yen.waehrung = { symbol: "¥", kurs: 160 };
    const stell = {
      "energie.co2Preis": 150,
      "energie.industrieSubvention": 40,
      "mig.netto": 900,
    };
    const a = rechne(eur, { ...basisSzenario(eur, 6), stell });
    const b = rechne(yen, { ...basisSzenario(yen, 6), stell });
    expect(b[5].einnahmen).toBeCloseTo(a[5].einnahmen, 6);
    expect(b[5].primaerausgaben).toBeCloseTo(a[5].primaerausgaben, 6);
  });
});

describe("USA und Japan rechnen plausibel", () => {
  it("Grenzfall: Japan startet ruhig, der Aufschlag bleibt klein", () => {
    const v = rechne(jp, basisSzenario(jp, 26));
    expect(Math.abs(v[1].primaer - v[0].primaer)).toBeLessThan(1);
    expect(Math.max(...v.map((z) => z.aufschlag))).toBeLessThan(3);
  });
  it("Grenzfall: USA als Energie-Nettoexporteur ohne Vorzeichenfehler", () => {
    const v = rechne(us, {
      ...basisSzenario(us, 26),
      schocks: [
        { id: 1, art: "oel", jahr: us.datenstand + 5, staerke: 1, dauer: 1 },
      ],
    });
    expect(us.start.importquote).toBeLessThan(0.1);
    expect(v[5].energiepreis).toBeGreaterThan(v[4].energiepreis);
    expect(v[5].importe).toBeGreaterThan(0);
  });
  it("beide Länder bleiben 100 Jahre endlich", () => {
    expect(endlich(rechne(us, basisSzenario(us, 101)))).toBe(true);
    expect(endlich(rechne(jp, basisSzenario(jp, 101)))).toBe(true);
  });
  it("Weltwährung: in einer Finanzkrise sinkt die US-Rendite", () => {
    const v = rechne(us, {
      ...basisSzenario(us, 8),
      schocks: [
        { id: 1, art: "krise", jahr: us.datenstand + 5, staerke: 1, dauer: 1 },
      ],
    });
    expect(v[5].rendite).toBeLessThan(v[4].rendite);
  });
});

describe("Schlussprüfung Phase 3", () => {
  it("I1: Schuldenbremse-Regler lässt Japan im ersten Jahr ruhig", () => {
    for (const wert of [0, 0.1]) {
      const v = rechne(jp, { ...basisSzenario(jp, 6), stell: { "staat.schuldenreaktion": wert } });
      expect(Math.abs(v[1].primaer - v[0].primaer), String(wert)).toBeLessThan(1);
    }
  });
});

describe("Update 2 rechnet plausibel", () => {
  const bau = (auto: unknown, h: unknown) =>
    baueLand(auto as AutoDatei, h as HandDatei, HEUTE);
  const neu = {
    GB: bau(autoGB, handGB),
    FR: bau(autoFR, handFR),
    IT: bau(autoIT, handIT),
    CA: bau(autoCA, handCA),
  };

  it.each(Object.keys(neu))(
    "%s: Startjahr ruhig, 100 Jahre endlich",
    (code) => {
      const land = neu[code as keyof typeof neu];
      const v = rechne(land, basisSzenario(land, 101));
      expect(Math.abs(v[1].primaer - v[0].primaer)).toBeLessThan(1);
      expect(endlich(v)).toBe(true);
    },
  );

  it("Grenzfall: Kanada als Energie-Nettoexporteur ohne Vorzeichenfehler", () => {
    const ca = neu.CA;
    const v = rechne(ca, {
      ...basisSzenario(ca, 26),
      schocks: [
        { id: 1, art: "oel", jahr: ca.datenstand + 5, staerke: 1, dauer: 1 },
      ],
    });
    expect(ca.start.importquote).toBeLessThan(0);
    expect(v[5].energiepreis).toBeGreaterThan(v[4].energiepreis);
    expect(v[5].importe).toBeGreaterThan(0);
  });

  it("Grenzfall: Italien bleibt mit hoher Schuld im Startjahr ruhig", () => {
    const v = rechne(neu.IT, basisSzenario(neu.IT, 26));
    expect(neu.IT.start.schuldQuote).toBeGreaterThan(120);
    expect(Math.abs(v[1].aufschlag - v[0].aufschlag)).toBeLessThan(1);
  });

  it("Deutschland rechnet unverändert (Stand vor Update 2)", () => {
    const de0 = bau(autoDE, handDE);
    // Mechanik wie vor Update 2; die Reaktion der Regierung (13.10) ist hier aus.
    // 13.5 Teil A: mit abgeschalteter Asymmetrie des Kreditimpulses. 13.6: Banken aus.
    // 13.5 Teil B: Akzelerator aus, Zinswirkung auf Investitionen wie vorher (0,6). Investitionsanker fest.
    const de = { ...de0, standards: { ...de0.standards, "wachstum.investElastizitaet": 0.6 } };
    const v = rechne(de, { ...basisSzenario(de, 51), aus: ["wachstum.kreditAsymmetrie", "wachstum.akzelerator", "wachstum.investAnpassung"], grund: { ...de.grund, politik: "fest", banken: "aus" } });
    expect(v[50].schuldQuote).toBeCloseTo(DE_SCHULD_2075, 6);
  });
});

describe("Update 2: Nachprüfung", () => {
  const bau = (auto: unknown, h: unknown) => baueLand(auto as AutoDatei, h as HandDatei, HEUTE);
  const rendite = (auto: unknown, jahr: number) => (auto as AutoDatei).reihen.rendite[jahr];

  it.each([
    ["FR", autoFR, handFR],
    ["IT", autoIT, handIT],
  ])("%s: Startaufschlag trifft den beobachteten Abstand zur Bundesanleihe", (_c, auto, hand) => {
    const land = bau(auto, hand);
    const v = rechne(land, basisSzenario(land, 2));
    const ist = rendite(auto, land.datenstand) - rendite(autoDE, land.datenstand);
    expect(Math.abs(v[0].aufschlag - ist)).toBeLessThan(0.3);
  });

  it.each([
    ["GB", autoGB, handGB],
    ["FR", autoFR, handFR],
    ["IT", autoIT, handIT],
    ["CA", autoCA, handCA],
  ])("%s: wer im Basisszenario ein Ventil auslöst, trägt den M3-Hinweis", (_c, auto, hand) => {
    const land = bau(auto, hand);
    const v = rechne(land, basisSzenario(land, 51));
    const ventil = v.some((z, i) => i > 0 && z.ventilArt !== 0 && z.ventilSeit === 0);
    if (ventil) expect(land.hinweis).toMatch(/M3/);
  });

  it.each([
    ["GB", handGB],
    ["FR", handFR],
    ["IT", handIT],
    ["CA", handCA],
  ])("%s: alle Handstandards im Bereich des Verzeichnisses", (_c, hand) => {
    for (const [id, wert] of Object.entries((hand as unknown as HandDatei).standards)) {
      const [min, max] = eintrag(id).bereich!;
      expect([id, wert >= min && wert <= max]).toEqual([id, true]);
    }
  });
});
