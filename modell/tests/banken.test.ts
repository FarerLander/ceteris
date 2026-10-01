import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { LAENDER } from "../../app/land";
import { baueFall, type Fall } from "../../daten/kalibrierung/lade";
import { bankenDaten } from "../banken-modus";
import { bilanzSchritt, hauspreisSchritt, potenzialWachstum } from "../bausteine/banken";
import { privatschuld } from "../bausteine/privatschuld";
import { baueKontext } from "../kontext";
import { basisSzenario, kopie, rechne } from "../rechne";
import { startzustand } from "../start";
import type { Grundeinstellungen, Landesdaten, Startwerte, Szenario, Zustand } from "../typen";
import { VERZEICHNIS, eintrag } from "../verzeichnis";
import { BANKWERTE, testland } from "./testland";

// Spec 13.6: Vermögenspreise und Banken.
const WIRKSTAERKEN = [
  "banken.hausMomentum",
  "banken.hausAnpassung",
  "banken.hausZins",
  "banken.hausKredit",
  "banken.sicherheiten",
  "banken.nplAlq",
  "banken.nplHaus",
  "banken.nplDsr",
  "banken.lgd",
  "banken.abschreibung",
  "banken.abschreibungZoegernd",
  "banken.heilung",
  "banken.klemme",
  "banken.kapitalkosten",
  "banken.staatBank",
  "banken.rendite",
];

describe("Gerüst Banken", () => {
  it("Bankdaten: nur mit allen sieben endlichen Handwerten", () => {
    expect(bankenDaten(testland().start)).toBe(false);
    expect(bankenDaten(testland(BANKWERTE).start)).toBe(true);
    expect(bankenDaten(testland({ ...BANKWERTE, npl0: NaN }).start)).toBe(
      false,
    );
    const { hausVermoegen0: _, ...sechs } = BANKWERTE;
    expect(bankenDaten(testland(sechs).start)).toBe(false);
  });

  it("Land ohne Bankdaten rechnet mit „an“ bitgenau wie mit „aus“", () => {
    const land = testland();
    const lauf = (banken: "an" | "aus") =>
      rechne(land, {
        ...basisSzenario(land),
        grund: { ...land.grund, banken },
      });
    const an = lauf("an");
    const aus = lauf("aus");
    expect(an).toHaveLength(aus.length);
    an.forEach((z, i) => {
      for (const [f, v] of Object.entries(z))
        if (typeof v === "number")
          expect(v, `${z.jahr} ${f}`).toBe(
            (aus[i] as unknown as Record<string, number>)[f],
          );
    });
  });

  it("Verzeichnis: alle Einträge aus dem Bauplan, Wirkstärken mit Quelle", () => {
    for (const id of WIRKSTAERKEN) {
      const e = eintrag(id);
      expect(e.art, id).toBe("wirkstaerke");
      expect(e.baustein, id).toBe("banken");
      expect(e.quelle.length, id).toBeGreaterThan(3);
    }
    for (const id of [
      "banken.hausZins",
      "banken.hausKredit",
      "banken.sicherheiten",
      "banken.klemme",
      "banken.kapitalkosten",
      "banken.staatBank",
    ]) {
      expect(eintrag(id).umstritten, id).toBe(true);
      expect(eintrag(id).neutral, id).toBe(0);
    }
    expect(eintrag("schwelle.bankMindest").standard).toBe(0.5);
    expect(eintrag("schwelle.hausluecke").standard).toBe(15);
    const e = eintrag("banken.eigenkapital");
    expect(e.art).toBe("stellschraube");
    expect(e.standard).toBe(0);
    expect(e.bereich).toEqual([-2, 10]);
    expect(e.schritt).toBe(0.5);
    expect(eintrag("grund.banken").optionen).toHaveLength(2);
    expect(eintrag("grund.rettung").optionen).toHaveLength(2);
    expect(
      VERZEICHNIS.filter((x) => x.baustein === "banken").length,
    ).toBeGreaterThanOrEqual(20);
  });

  it("Startzustand mit Bankwerten", () => {
    const land = testland(BANKWERTE);
    const { z, c } = startzustand(land, basisSzenario(land));
    expect(z.bankKapital).toBe(8);
    expect(z.hausGrund).toBe(-10);
    expect(z.hauspreis).toBe(100);
    expect(z.hp).toBe(0);
    expect(z.bilanz).toBe(200);
    expect(z.bankKapitalBetrag).toBeCloseTo(16, 12);
    expect(z.npl).toBe(2);
    expect(z.hausWert).toBe(180);
    expect(z.hausluecke).toBe(0);
    expect(z.rettung).toBe(0);
    expect(c.bilanzFaktor).toBeCloseTo(200 / 110, 12);
    expect(c.bankMindest).toBe(4);
    expect(c.bankZiel0).toBe(8);
    expect(c.bankVerlust0).toBeGreaterThan(0);
  });

  it("Startzustand ohne Bankwerte: Bankfelder 0, Hauspreis 100", () => {
    const land = testland();
    const { z } = startzustand(land, basisSzenario(land));
    expect(z.hauspreis).toBe(100);
    expect(z.hausWert).toBe(0);
    expect(z.bankKapital).toBe(0);
    expect(z.npl).toBe(0);
    expect(z.bilanz).toBe(0);
  });
});

const bankland = (start: Partial<Startwerte> = {}, grund: Partial<Grundeinstellungen> = {}) =>
  testland({ ...BANKWERTE, ...start }, { banken: "an", ...grund });
const lauf = (land: Landesdaten, extra: Partial<Szenario> = {}, jahre = 31) =>
  rechne(land, { ...basisSzenario(land, jahre), ...extra });

// Nur der Hauspreis-Schritt, mit festem Wachstum und festem Realzins.
function hausSchritte(land: Landesdaten, n: number, extra: Partial<Szenario> = {}, start: Partial<Zustand> = {}) {
  const sz = { ...basisSzenario(land, n + 1), ...extra };
  const { z, c } = startzustand(land, sz);
  const verlauf = [{ ...z, ...start }];
  for (let t = 1; t <= n; t++) {
    const alt = verlauf[t - 1];
    const neu = kopie(alt);
    neu.wachstum = 0.01;
    neu.wachstumProKopf = 0.01;
    neu.kreditUeber = 0;
    hauspreisSchritt(alt, neu, baueKontext(land, sz, c, t));
    verlauf.push(neu);
  }
  return verlauf;
}

describe("Hauspreis (M1)", () => {
  it("ohne Überbewertung, Kreditüberhang und Zinsänderung wächst der Hauspreis mit dem Einkommen", () => {
    const v = hausSchritte(bankland({ hausBewertung0: 0 }), 30);
    const ziel = 100 * Math.log(1.01);
    expect(Math.abs(v[30].hausWachstum - ziel)).toBeLessThan(0.05);
    expect(v[30].hauspreis).toBeCloseTo(100 * Math.exp(v[30].hp / 100), 9);
    expect(v[30].hauspreis).toBeGreaterThan(100);
  });

  it("Hauswert in % BIP folgt dem Preis über dem Einkommen", () => {
    const v = hausSchritte(bankland(), 1);
    expect(v[1].hausWachstum).toBeCloseTo(-2, 12); // 0,2 × (−10 − 0)
    expect(v[1].hausWert).toBeCloseTo((180 * Math.exp(-0.02)) / 1.01, 9);
  });

  it("Überbewertung 30 %: Der Preis fällt real, im ersten Jahr zuerst", () => {
    const v = lauf(bankland({ hausBewertung0: 30 }));
    expect(v[1].hausWachstum).toBeLessThan(0);
    expect(v[10].hauspreis).toBeLessThan(v[0].hauspreis);
    expect(v[10].hauspreis).toBeLessThan(95);
  });

  it("Realzins-Sprung +2 Pp.: Hauspreis nach sieben Jahren mindestens 5 % tiefer", () => {
    const land = bankland({}, { regime: "eigen" });
    const ohne = lauf(land);
    const mit = lauf(land, { welt: { realzins: [{ ab: 2025, wert: 0.8 }, { ab: 2028, wert: 2.8 }] } });
    expect(mit[2].hauspreis).toBe(ohne[2].hauspreis);
    expect(mit[10].hauspreis).toBeLessThan(0.95 * ohne[10].hauspreis);
  });

  it("der Grundwert folgt dem Einkommen pro Kopf und der langen Rendite, nicht der Bevölkerung", () => {
    const land = bankland({ hausBewertung0: 0 });
    const sz = basisSzenario(land, 3);
    const { z, c } = startzustand(land, sz);
    const k = baueKontext(land, sz, c, 1);
    // Mehr Menschen, gleiches Einkommen je Kopf: Es werden mehr Häuser gebraucht, nicht teurere.
    const mehr = { ...kopie(z), wachstum: 0.03, wachstumProKopf: 0 };
    hauspreisSchritt(z, mehr, k);
    expect(mehr.hausGrund).toBeCloseTo(z.hausGrund, 12);
    // Dasselbe Potenzialwachstum zählt für „Preis über Einkommen“ nur je Kopf.
    expect(mehr.hausUeber).toBeCloseTo(mehr.hausWachstum - 0, 9);
    const reicher = { ...kopie(z), wachstum: 0.03, wachstumProKopf: 0.02 };
    hauspreisSchritt(z, reicher, k);
    expect(reicher.hausGrund - z.hausGrund).toBeCloseTo(100 * Math.log(1.02), 12);
    // Rendite 10 Jahre +1 Pp.: Grundwert −5 %.
    const teurer = { ...kopie(z), wachstum: 0, wachstumProKopf: 0, rendite: z.rendite + 1 };
    hauspreisSchritt(z, teurer, k);
    expect(teurer.hausGrund - z.hausGrund).toBeCloseTo(-5, 12);
    // Der Bestandszins der Kredite zählt dafür nicht.
    const bestand = { ...kopie(z), wachstum: 0, wachstumProKopf: 0, privatZins: z.privatZins + 3 };
    hauspreisSchritt(z, bestand, k);
    expect(bestand.hausGrund).toBeCloseTo(z.hausGrund, 12);
  });

  it("der Realzins zählt für den Grundwert nur zwischen −5 % und +15 %", () => {
    const land = bankland({ hausBewertung0: 0 });
    const sz = basisSzenario(land, 3);
    const { z, c } = startzustand(land, sz);
    const neu = kopie(z);
    neu.inflErw = 5000;
    hauspreisSchritt(z, neu, baueKontext(land, sz, c, 1));
    expect(neu.rReal).toBe(-5);
    neu.inflErw = -50;
    hauspreisSchritt(z, neu, baueKontext(land, sz, c, 1));
    expect(neu.rReal).toBe(15);
  });

  it("Leitplanke: Der reale Hauspreis ändert sich höchstens um 30 % im Jahr, der Hauswert bleibt positiv", () => {
    const land = bankland({ hausBewertung0: 0 });
    const hoch = hausSchritte(land, 1, {}, { kreditUeber: 100 })[1];
    expect(hoch.hausWachstum).toBe(30);
    const tief = hausSchritte(land, 1, {}, { kreditUeber: -250 })[1];
    expect(tief.hausWachstum).toBe(-30);
    expect(tief.hauspreis).toBeCloseTo(100 * Math.exp(-0.3), 9);
    expect(tief.hausWert).toBeCloseTo((180 * Math.exp(-0.3)) / 1.01, 9);
  });

  it("Kredit über normal treibt den Preis; abgeschaltet wirkt er nicht", () => {
    const land = bankland({ hausBewertung0: 0 });
    const mit = hausSchritte(land, 1, {}, { kreditUeber: 5 });
    const aus = hausSchritte(land, 1, { aus: ["banken.hausKredit"] }, { kreditUeber: 5 });
    expect(mit[1].hausWachstum).toBeCloseTo(5, 12);
    expect(aus[1].hausWachstum).toBe(0);
  });

  it("Kredit über normal misst gegen das nominale Potenzialwachstum; ohne Banken bleibt das Feld 0", () => {
    const land = bankland();
    const v = lauf(land, { schocks: [{ id: 1, art: "krise", jahr: 2028, staerke: 1, dauer: 1 }] }, 8);
    for (const t of [1, 3, 5, 7]) {
      const gPot = ((1 + v[t].wachstum) * (1 + v[t - 1].luecke)) / (1 + v[t].luecke) - 1;
      expect(potenzialWachstum(v[t - 1], v[t])).toBeCloseTo(gPot, 14);
      expect(v[t].kreditUeber).toBeCloseTo(v[t].kredit - v[t - 1].privatschuld * (gPot + v[t - 1].inflErw / 100), 12);
    }
    // Im Krisenjahr bricht das BIP ein, das Potenzial kaum.
    expect(v[3].wachstum).toBeLessThan(-0.03);
    expect(potenzialWachstum(v[2], v[3])).toBeGreaterThan(-0.01);
    const aus = lauf(land, { grund: { ...land.grund, banken: "aus" } }, 8);
    for (const z of aus) expect(z.kreditUeber).toBe(0);
  });

  it("Preisanstieg über dem Einkommen misst gegen das Potenzial, nicht gegen den Einbruch eines Jahres", () => {
    const land = bankland({ hausBewertung0: 0 });
    const sz = basisSzenario(land, 3);
    const { z, c } = startzustand(land, sz);
    const neu = kopie(z);
    neu.wachstum = -0.13;
    neu.luecke = z.luecke - 0.125;
    hauspreisSchritt(z, neu, baueKontext(land, sz, c, 1));
    neu.wachstumProKopf = -0.13;
    hauspreisSchritt(z, neu, baueKontext(land, sz, c, 1));
    const gPot = (0.87 * (1 + z.luecke)) / (1 + neu.luecke) - 1;
    expect(neu.hausUeber).toBeCloseTo(neu.hausWachstum - 100 * gPot, 9);
    expect(Math.abs(neu.hausUeber)).toBeLessThan(1);
  });

  it("Hauspreis-Lücke: Start aus dem Trend der Daten, danach einseitiger HP-Filter", () => {
    const land = bankland({ hausTrend0: -20 });
    const v = lauf(land, {}, 12);
    expect(v[0].hausluecke).toBe(20);
    expect(v[1].hausTrend).not.toBe(-20);
    for (const z of v) expect(z.hausluecke).toBeCloseTo(z.hp - z.hausTrend, 12);
    // Der Trend läuft dem Preis nach: Die Lücke schrumpft, springt aber nicht.
    expect(Math.abs(v[11].hausluecke)).toBeLessThan(20);
    expect(Math.abs(v[1].hausluecke - 20)).toBeLessThan(6);
    const aus = lauf(land, { grund: { ...land.grund, banken: "aus" } }, 12);
    expect(aus[11].hausTrend).toBe(-20);
    expect(aus[11].hauspreis).toBe(100);
  });
});

// Ein Bilanz-Schritt vom Startzustand aus, mit gesetzten Werten für Vorjahr und Jahr.
function bilanzEinmal(
  land: Landesdaten,
  extra: Partial<Szenario> = {},
  alt0: Partial<Zustand> = {},
  neu0: Partial<Zustand> = {},
  jahr = 2,
) {
  const sz = { ...basisSzenario(land, 3), ...extra };
  const { z, c } = startzustand(land, sz);
  const alt = { ...z, ...alt0 };
  const neu = { ...kopie(alt), ...neu0 };
  // Zweites Modelljahr: Im ersten zählt der Sprung von der gemessenen zur gerechneten Rendite nicht (M7).
  bilanzSchritt(alt, neu, baueKontext(land, sz, c, jahr));
  return { alt, neu, c };
}
const BANKFELDER = ["hauspreis", "hp", "hausGrund", "hausWachstum", "hausWert", "hausluecke", "npl", "bilanz", "bankKapitalBetrag", "bankKapital", "rettung", "klemme", "schuldQuote"] as const;

// Eigenkapital plus Jahresgewinn im Testland: 5 % Rendite, dazu 0,2 Pp., weil die erwartete Inflation
// (2,2 %) über dem Ziel (2 %) liegt.
const RENDITE = 1 + 0.05 + 0.002;

describe("Bankbilanz (M3, M4, M6, M7): ein Schritt", () => {
  it("ruhiges Jahr: faule Kredite und Eigenkapital bleiben stehen", () => {
    const { neu } = bilanzEinmal(bankland());
    expect(neu.npl).toBeCloseTo(2, 12);
    expect(neu.bilanz).toBeCloseTo(200, 12);
    expect(neu.bankKapital).toBeCloseTo(8, 9);
    expect(neu.rettung).toBe(0);
  });

  it("Zufluss aus Arbeitslosigkeit, fallenden Hauspreisen und Schuldendienst über der Schwelle", () => {
    const land = bankland();
    const ruhe = 2 * (1 - 0.4 - 0.15) + 2 * (0.4 + 0.15);
    expect(bilanzEinmal(land, {}, {}, { alq: 5.5 }).neu.npl).toBeCloseTo(ruhe + 1 * 2, 12);
    expect(bilanzEinmal(land, {}, {}, { hausWachstum: -10 }).neu.npl).toBeCloseTo(ruhe + 0.3 * 10, 12);
    expect(bilanzEinmal(land, {}, {}, { hausWachstum: 10 }).neu.npl).toBeCloseTo(ruhe, 12);
    expect(bilanzEinmal(land, {}, {}, { dsr: 19 }).neu.npl).toBeCloseTo(ruhe + 0.3 * 2, 12);
    expect(bilanzEinmal(land, {}, { npl: 80 }, { alq: 40 }).neu.npl).toBe(60);
  });

  it("Abschreibungen mindern das Eigenkapital; zögernd schreibt langsamer ab und behält die faulen Kredite", () => {
    const land = bankland();
    const schnell = bilanzEinmal(land, {}, { npl: 30 });
    const zoeg = bilanzEinmal(land, { grund: { ...land.grund, rettung: "zoegernd" } }, { npl: 30 });
    // Verlust = 0,4 × 30 % × 0,45 × 110 × 0,8 = 4,752 % BIP. Der Gewinn (5,2 % auf 16 % BIP Eigenkapital,
    // dazu die normale Abschreibung 0,3168) fängt einen Teil ab.
    const g = land.start.tfpTrend / 100 + land.start.inflation / 100;
    expect(schnell.neu.bankKapitalBetrag).toBeCloseTo((16 * RENDITE + 0.3168 - 4.752) / (1 + g), 9);
    expect(zoeg.neu.bankKapitalBetrag).toBeGreaterThan(schnell.neu.bankKapitalBetrag);
    expect(zoeg.neu.bankKapitalBetrag).toBeLessThanOrEqual(16);
    expect(zoeg.neu.npl).toBeGreaterThan(schnell.neu.npl + 1.5);
  });

  it("schnelle Rettung: unter der Mindestschwelle füllt der Staat auf das Ziel auf, die Staatsschuld steigt um denselben Betrag", () => {
    const land = bankland();
    const { alt, neu } = bilanzEinmal(land, {}, { bankKapitalBetrag: 6, bankKapital: 3 });
    // Auffüllen von gut 3,5 % auf 8 % der Bilanz (200 % BIP).
    expect(neu.rettung).toBeGreaterThan(8.5);
    expect(neu.rettung).toBeLessThan(9.5);
    expect(neu.bankKapital).toBeCloseTo(8, 9);
    expect(neu.schuldQuote).toBeCloseTo(alt.schuldQuote + neu.rettung, 9);
    expect(neu.schuldNom).toBeCloseTo(alt.schuldNom + (neu.rettung / 100) * neu.Y * neu.preisniveau, 6);
    // Knapp über der Schwelle (4 %) rettet niemand.
    expect(bilanzEinmal(land, {}, { bankKapitalBetrag: 9, bankKapital: 4.5 }).neu.rettung).toBe(0);
  });

  it("zögernde Rettung: erst bei aufgezehrtem Eigenkapital, nur bis zur Mindestschwelle", () => {
    const land = bankland();
    const sz = { grund: { ...land.grund, rettung: "zoegernd" as const } };
    const knapp = bilanzEinmal(land, sz, { bankKapitalBetrag: 6, bankKapital: 3 });
    expect(knapp.neu.rettung).toBe(0);
    expect(knapp.neu.bankKapital).toBeLessThan(4);
    const leer = bilanzEinmal(land, sz, { bankKapitalBetrag: -2, bankKapital: -1 });
    expect(leer.neu.rettung).toBeGreaterThan(8);
    expect(leer.neu.rettung).toBeLessThan(9);
    expect(leer.neu.bankKapital).toBeCloseTo(4, 9);
  });

  it("nach einem Verlust baut die Bank das Eigenkapital aus Gewinnen wieder auf", () => {
    // 6 % statt 8 %: über der Rettungsschwelle, unter dem Ziel. Gewinn 5 % auf das Start-Eigenkapital.
    const { neu } = bilanzEinmal(bankland(), {}, { bankKapitalBetrag: 12, bankKapital: 6 });
    expect(neu.rettung).toBe(0);
    expect(neu.bankKapital).toBeGreaterThan(6.15);
    expect(neu.bankKapital).toBeLessThan(6.4);
  });

  it("hohe Inflation im Startjahr: Die Marge hält die Quote trotzdem", () => {
    const { neu, c } = bilanzEinmal(bankland({ inflation: 25, leitzins: 27, rendite: 28, effZins: 20 }));
    expect(c.bankVerlust0).toBeCloseTo(0.3168 / 200, 12);
    expect(neu.bankKapital).toBeCloseTo(8, 9);
  });

  it("Gewinn wächst mit der Inflation: Ein höheres Inflationsziel zehrt das Eigenkapital nicht auf", () => {
    // Prüfbefund: Mit fester Marge lief die Quote bei hoher Inflation gegen Start × 5 / nominales Wachstum,
    // mit Jahrzehnten Kreditklemme.
    const land = bankland({ hausBewertung0: 0 }, { regime: "eigen" });
    const v = lauf(land, { stell: { "geld.inflationsziel": 5 } }, 51);
    expect(v[50].inflation).toBeGreaterThan(4);
    for (const z of v.slice(5)) {
      expect(z.bankKapital, `${z.jahr} Eigenkapital`).toBeGreaterThan(0.98 * 8);
      expect(z.klemme, `${z.jahr} Klemme`).toBe(0);
    }
  });

  it("zögernd heilt nicht mehr, es verschiebt nur: Von 100 faulen Krediten gehen am Ende gleich viele verloren", () => {
    // Anteil, der abgeschrieben wird statt zu gesunden: Abschreibung / (Abschreibung + Heilung).
    const land = bankland();
    const schritt = (rettung: "schnell" | "zoegernd") => bilanzEinmal(land, { grund: { ...land.grund, rettung } }, { npl: 30 }).neu.npl;
    const abgang = (npl: number) => 1 - (npl - 2 * 0.55) / 30; // Grundzufluss 2 × (0,4 + 0,15)
    expect(abgang(schritt("schnell"))).toBeCloseTo(0.4 + 0.15, 9);
    // zögernd: Abschreibung 0,08; Heilung im selben Verhältnis kleiner (0,15 × 0,08 / 0,4 = 0,03)
    expect(abgang(schritt("zoegernd"))).toBeCloseTo(0.08 + 0.03, 9);
    expect(0.08 / (0.08 + 0.03)).toBeCloseTo(0.4 / (0.4 + 0.15), 9);
  });

  it("M7 zählt nicht im ersten Modelljahr: Der Sprung von der gemessenen zur gerechneten Rendite ist kein Kursverlust", () => {
    const land = bankland();
    const tief = { bankKapitalBetrag: 12, bankKapital: 6 };
    const erstes = bilanzEinmal(land, {}, tief, { rendite: 5.6 }, 1);
    const ruhig = bilanzEinmal(land, {}, tief, {}, 1);
    expect(erstes.neu.bankKapitalBetrag).toBe(ruhig.neu.bankKapitalBetrag);
    const zweites = bilanzEinmal(land, {}, tief, { rendite: 5.6 }, 2);
    expect(zweites.neu.bankKapitalBetrag).toBeLessThan(ruhig.neu.bankKapitalBetrag - 1);
  });

  it("Gewinn misst die Inflation am Ziel des Landes, nicht am Startjahr: hohe Startinflation drückt den Gewinn später nicht", () => {
    const land = bankland({ inflation: 5 });
    // Erwartete Inflation zurück auf 2 %: Rendite 5 %, nicht 5 − 3 = 2 %.
    const { neu } = bilanzEinmal(land, {}, { bankKapitalBetrag: 12, bankKapital: 6 }, { inflErw: 2, inflation: 2 });
    const g = neu.wachstum + 0.02;
    expect(neu.bankKapitalBetrag).toBeCloseTo((12 + 16 * 0.05) / (1 + g), 9);
  });

  it("M7 bei Staatsvermögen statt Staatsschuld: kein Kursgewinn aus steigenden Renditen", () => {
    const land = bankland();
    // Eigenkapital unter dem Ziel, damit die Ausschüttung einen Gewinn nicht verdeckt.
    const tief = { bankKapitalBetrag: 12, bankKapital: 6 };
    const vermoegen = bilanzEinmal(land, {}, { ...tief, schuldQuote: -40 }, { rendite: 5.6 });
    const ohne = bilanzEinmal(land, {}, { ...tief, schuldQuote: 0 }, { rendite: 5.6 });
    expect(vermoegen.neu.bankKapitalBetrag).toBe(ohne.neu.bankKapitalBetrag);
  });

  it("keine Rettung aus Rundung: Liegt das Ziel unter der Mindestschwelle, zahlt der Staat nichts", () => {
    // Start-Eigenkapital 3,5 %, Vorgabe −2 Pp.: Ziel 1,5 % liegt unter der Schwelle 1,75 %.
    const land = bankland({ bankKapital0: 3.5 });
    const v = lauf(land, { stell: { "banken.eigenkapital": -2 } }, 21);
    for (const z of v) expect(z.rettung === 0 || z.rettung > 0.01, `${z.jahr}: ${z.rettung}`).toBe(true);
    expect(v.filter((z) => z.lage === "krise" && z.rettung > 0 && z.rettung < 0.01)).toHaveLength(0);
  });

  it("die Rettung gilt nur im Jahr: im Folgejahr wieder 0", () => {
    const { neu } = bilanzEinmal(bankland(), {}, { rettung: 7 });
    expect(neu.rettung).toBe(0);
  });

  it("Stellschraube Eigenkapital hebt das Ziel: Gewinne bleiben in der Bank, bis es erreicht ist", () => {
    const land = bankland();
    const { neu } = bilanzEinmal(land, { stell: { "banken.eigenkapital": 3 } }, { npl: 0 });
    expect(neu.bankKapital).toBeGreaterThan(8);
    expect(neu.bankKapital).toBeLessThan(11);
    // Ohne höheres Ziel wird der Überschuss ausgeschüttet.
    expect(bilanzEinmal(land, {}, { npl: 0 }).neu.bankKapital).toBeCloseTo(8, 9);
  });

  it("M7: steigende Rendite kostet Eigenkapital über die Staatsanleihen; abgeschaltet nicht", () => {
    const land = bankland();
    const hoch = bilanzEinmal(land, {}, {}, { rendite: 5.6 });
    // 1 × 0,2 × 63 % BIP × (7 Jahre / 2) × 3 Pp. = 1,323 % BIP
    const g = land.start.tfpTrend / 100 + land.start.inflation / 100;
    expect(hoch.neu.bankKapitalBetrag).toBeCloseTo((16 * RENDITE - 1.323) / (1 + g), 9);
    const aus = bilanzEinmal(land, { aus: ["banken.staatBank"] }, {}, { rendite: 5.6 });
    expect(aus.neu.bankKapital).toBeCloseTo(8, 9);
  });

  it("M7: Der Kursverlust ist höchstens der Bestand an Staatsanleihen", () => {
    const land = bankland({}, { rettung: "zoegernd" });
    const { neu } = bilanzEinmal(land, {}, {}, { rendite: 500 });
    const g = land.start.tfpTrend / 100 + land.start.inflation / 100;
    // Bestand: 0,2 × 63 % BIP = 12,6 % BIP. Zögernd, damit keine Rettung das Bild verdeckt; die Marge
    // deckt 0,3168 Abschreibung, zögernd fallen nur 0,06336 an.
    expect(neu.rettung).toBe(0);
    expect(neu.bankKapitalBetrag).toBeCloseTo((16 * RENDITE + 0.3168 - 0.06336 - 12.6) / (1 + g), 9);
  });

  it("China, keine Doppelzählung: Kreditlenkung ändert den Zufluss fauler Kredite nicht", () => {
    const CN = LAENDER.CN;
    const grund = { ...CN.grund, banken: "an" as const };
    const neu0 = { alq: CN.start.nairu + 2, hausWachstum: -5 };
    const normal = bilanzEinmal(CN, { grund }, {}, neu0);
    const gelenkt = bilanzEinmal(CN, { grund, stell: { "ordnung.kreditlenkung": 70 } }, {}, neu0);
    expect(gelenkt.neu.npl).toBe(normal.neu.npl);
    expect(gelenkt.neu.bankKapitalBetrag).toBe(normal.neu.bankKapitalBetrag);
  });
});

describe("Bankbilanz im Lauf", () => {
  // Dünne Bank: wenig Eigenkapital je Kredit, damit eine Krise die Mindestschwelle reißt.
  const DUENN = { bankKapital0: 2, bankBilanz0: 120 };
  const krise = { schocks: [{ id: 1, art: "krise" as const, jahr: 2028, staerke: 3, dauer: 1 }] };

  it("ruhiger Basislauf 50 Jahre: Eigenkapital und faule Kredite im Band, keine Rettung", () => {
    const v = lauf(bankland({ hausBewertung0: 0 }), {}, 51);
    for (const z of v) {
      expect(Math.abs(z.bankKapital - 8), `${z.jahr} Eigenkapital`).toBeLessThan(0.5);
      expect(Math.abs(z.npl - 2), `${z.jahr} faule Kredite`).toBeLessThan(1);
      expect(z.rettung, `${z.jahr}`).toBe(0);
    }
  });

  it("Finanzkrise: faule Kredite steigen, Eigenkapital fällt", () => {
    const v = lauf(bankland(), krise, 12);
    expect(Math.max(...v.map((z) => z.npl))).toBeGreaterThan(v[2].npl + 1.5);
    expect(Math.min(...v.map((z) => z.bankKapital))).toBeLessThan(v[2].bankKapital - 0.2);
  });

  it("dünne Bank in der Krise: Rettung wird Staatsschuld, Lage Krise", () => {
    const land = bankland(DUENN);
    const an = lauf(land, krise, 14);
    const aus = lauf(land, { ...krise, grund: { ...land.grund, banken: "aus" } }, 14);
    const i = an.findIndex((z) => z.rettung > 0);
    expect(i).toBeGreaterThan(3);
    expect(an[i].schuldQuote - aus[i].schuldQuote).toBeGreaterThanOrEqual(an[i].rettung - 1);
    expect(an[i].lage).toBe("krise");
    expect(an[i].bankKapital).toBeCloseTo(2, 6);
  });

  it("zögernd: Rettung später oder gar nicht, faule Kredite länger hoch", () => {
    const land = bankland(DUENN);
    const schnell = lauf(land, krise, 14);
    const zoeg = lauf(land, { ...krise, grund: { ...land.grund, rettung: "zoegernd" } }, 14);
    const erste = (v: Zustand[]) => {
      const i = v.findIndex((z) => z.rettung > 0);
      return i < 0 ? Infinity : i;
    };
    expect(erste(zoeg)).toBeGreaterThan(erste(schnell));
    const hoch = (v: Zustand[]) => v.filter((z) => z.npl > 5).length;
    expect(hoch(schnell)).toBeGreaterThan(0);
    expect(hoch(zoeg)).toBeGreaterThan(hoch(schnell));
  });

  it("M7 im Lauf: Die weltweite Laufzeitprämie +3 Pp. drückt das Eigenkapital im selben Jahr", () => {
    const land = bankland();
    const welt = { praemieWelt: [{ ab: 2025, wert: 0 }, { ab: 2028, wert: 3 }] };
    const ohne = lauf(land, {}, 6);
    const mit = lauf(land, { welt }, 6);
    const aus = lauf(land, { welt, aus: ["banken.staatBank"] }, 6);
    expect(mit[3].rendite).toBeGreaterThan(ohne[3].rendite + 2);
    // 1,3 % BIP Kursverlust; den größeren Teil fängt der Jahresgewinn ab.
    expect(mit[3].bankKapital).toBeLessThan(ohne[3].bankKapital - 0.1);
    expect(aus[3].bankKapital).toBeCloseTo(ohne[3].bankKapital, 9);
  });

  it("China mit Kreditlenkung 90: Staatsbanken-Verluste laufen weiter über die verdeckte Schuld", () => {
    const CN = LAENDER.CN;
    const sz = { ...basisSzenario(CN, 51), stell: { "ordnung.kreditlenkung": 90 } };
    const an = rechne(CN, { ...sz, grund: { ...CN.grund, banken: "an" } });
    const aus = rechne(CN, { ...sz, grund: { ...CN.grund, banken: "aus" } });
    expect(an.some((z) => z.uebernahme > 0)).toBe(true);
    // Der Bankbaustein zählt die Verluste der Staatsbanken nicht noch einmal: Über 50 Jahre übernimmt der
    // Staat mit und ohne Banken etwa gleich viel verdeckte Schuld (das Jahr kann sich um eines verschieben).
    const summe = (v: Zustand[]) => v.reduce((a, z) => a + z.uebernahme, 0);
    expect(summe(an)).toBeGreaterThan(0.8 * summe(aus));
    expect(summe(an)).toBeLessThan(1.2 * summe(aus));
    for (const z of an) for (const f of BANKFELDER) expect(Number.isFinite(z[f]), `${z.jahr} ${f}`).toBe(true);
  });

  for (const name of ["venezuela", "argentinien-1992"])
    it(`Robustheit ${name}: Bankfelder endlich, faule Kredite in [0, 60], Rettung ≥ 0`, () => {
      const f = JSON.parse(readFileSync(`daten/kalibrierung/${name}.json`, "utf-8")) as Fall;
      for (const rettung of ["schnell", "zoegernd"] as const) {
        // Bankwerte der Vorlage (Russland bzw. Italien).
        const { land, sz } = baueFall({ ...f, grund: { ...f.grund, banken: "an", rettung } });
        expect(bankenDaten(land.start)).toBe(true);
        const v = rechne(land, sz);
        expect(v.some((z) => z.hauspreis !== 100)).toBe(true);
        for (const z of v) {
          for (const feld of BANKFELDER) expect(Number.isFinite(z[feld]), `${z.jahr} ${feld}`).toBe(true);
          expect(z.npl, `${z.jahr}`).toBeGreaterThanOrEqual(0);
          expect(z.npl, `${z.jahr}`).toBeLessThanOrEqual(60);
          expect(z.rettung, `${z.jahr}`).toBeGreaterThanOrEqual(0);
          expect(z.hausWert, `${z.jahr}`).toBeGreaterThanOrEqual(0);
          expect(z.hauspreis, `${z.jahr}`).toBeGreaterThan(0.01);
          // Hyperinflation macht Häuser nicht real tausendfach teurer: Der Realzins zählt nur begrenzt.
          expect(z.hauspreis, `${z.jahr}`).toBeLessThan(1000);
        }
      }
    });
});

// Ein Schritt des Kredit-Bausteins vom Startzustand aus, mit gesetzten Vorjahreswerten.
function kreditEinmal(land: Landesdaten, extra: Partial<Szenario> = {}, alt0: Partial<Zustand> = {}, neu0: Partial<Zustand> = {}) {
  const sz = { ...basisSzenario(land, 3), ...extra };
  const { z, c } = startzustand(land, sz);
  const alt = { ...z, ...alt0 };
  const neu = { ...kopie(alt), ...neu0 };
  privatschuld(alt, neu, baueKontext(land, sz, c, 1));
  return neu;
}
const wechsel = (x: number[]) => x.filter((v, i) => i > 0 && Math.sign(v) !== Math.sign(x[i - 1]) && v !== 0).length;

describe("Rückwirkung auf den Kredit (M2, M5, Kapitalkosten): ein Schritt", () => {
  it("M2: Steigt der Hauspreis schneller als das Einkommen, wächst der Kredit mit", () => {
    const land = bankland();
    const alt0 = { hausUeber: 9 };
    const mit = kreditEinmal(land, {}, alt0);
    const aus = kreditEinmal(land, { aus: ["banken.sicherheiten"] }, alt0);
    // 0,2 × 9 % × 110 % BIP Kreditbestand = 1,98 % BIP
    expect(mit.kredit - aus.kredit).toBeCloseTo(1.98, 9);
    // Das Hausvermögen selbst zählt nicht: Länder mit viel Eigentum und wenig Hypotheken beleihen wenig.
    expect(kreditEinmal(land, {}, { hausUeber: 9, hausWert: 400 }).kredit).toBe(mit.kredit);
    // Fällt der Preis hinter das Einkommen zurück, schrumpft der Spielraum.
    expect(kreditEinmal(land, {}, { hausUeber: -9 }).kredit - aus.kredit).toBeCloseTo(-1.98, 9);
    const d = (a: Partial<Zustand>, aus2: string[] = []) =>
      kreditEinmal(land, { aus: aus2 }, a).kredit - kreditEinmal(land, { aus: ["banken.sicherheiten", ...aus2] }, a).kredit;
    // Leitplanke: aus Sicherheiten höchstens 10 % des Kreditbestands im Jahr, in beide Richtungen.
    expect(d({ hausUeber: 80 })).toBeCloseTo(11, 9);
    expect(d({ hausUeber: -80 })).toBeCloseTo(-11, 9);
    // Wächst der Preis nur mit dem Einkommen, wirkt der Term nicht — auch nicht im Jahr nach einem Einbruch.
    const gleich = { hausUeber: 0, hausWachstum: -1, wachstum: -0.13 };
    expect(kreditEinmal(land, {}, gleich).kredit).toBe(kreditEinmal(land, { aus: ["banken.sicherheiten"] }, gleich).kredit);
  });

  it("normale Kreditausweitung folgt dem Potenzialwachstum, nicht nur dem Produktivitätstrend", () => {
    // Testland: Produktivitätstrend 0,6 %. Wächst das Potenzial mit 2,6 % (mehr Erwerbstätige), wächst der
    // Kredit um 110 × 2 Pp. = 2,2 % BIP mehr: Die Schuldenquote bleibt, statt zu schrumpfen.
    const land = bankland();
    const ruhe = kreditEinmal(land);
    const schnell = kreditEinmal(land, {}, {}, { wachstum: 0.026 });
    expect(schnell.kredit - ruhe.kredit).toBeCloseTo(2.2, 9);
    // Einbruch eines Jahres (Lücke fällt mit): Das Potenzial wächst weiter, der Kredit ändert sich nicht.
    const einbruch = kreditEinmal(land, {}, {}, { wachstum: -0.1, luecke: (1 - 0.1) / (1 + 0.006) - 1 });
    expect(einbruch.kredit).toBeCloseTo(ruhe.kredit, 9);
    // Leitplanke ±3 Pp.: Ein Sprung des Potenzials (Krieg, Wiederaufbau) zählt nur begrenzt.
    expect(kreditEinmal(land, {}, {}, { wachstum: 0.2 }).kredit - ruhe.kredit).toBeCloseTo(3.3, 9);
    // Ohne Banken bleibt die Rechnung beim Produktivitätstrend.
    const ohne = testland();
    expect(kreditEinmal(ohne, {}, {}, { wachstum: 0.026 }).kredit).toBe(kreditEinmal(ohne).kredit);
  });

  it("M5: Eigenkapital unter dem Ziel kürzt den Kredit, höchstens um 10 % des Bestands", () => {
    const land = bankland();
    const mit = kreditEinmal(land, {}, { bankKapital: 6 });
    const aus = kreditEinmal(land, { aus: ["banken.klemme"] }, { bankKapital: 6 });
    // Messlatte 8 %, Duldung ein Zehntel: ab 7,2 %. Ziel 2,5 × 1,2 Pp. × 110 % BIP = 3,3 % BIP; die Banken
    // gehen jedes Jahr den halben Weg dorthin (kein An-Aus von Jahr zu Jahr).
    expect(mit.klemme).toBeCloseTo(1.65, 9);
    expect(aus.klemme).toBe(0);
    expect(aus.kredit - mit.kredit).toBeCloseTo(1.65, 9);
    expect(kreditEinmal(land, {}, { bankKapital: 6, klemme: 1.65 }).klemme).toBeCloseTo(2.475, 9);
    // Ist das Eigenkapital wieder da, läuft die Klemme aus.
    expect(kreditEinmal(land, {}, { bankKapital: 8, klemme: 2 }).klemme).toBeCloseTo(1, 9);
    expect(kreditEinmal(land, {}, { bankKapital: 8, klemme: 0.02 }).klemme).toBe(0);
    expect(kreditEinmal(land, {}, { bankKapital: -5, klemme: 11 }).klemme).toBeCloseTo(11, 9);
    // Auch nach der Glättung nie mehr als 10 % des Bestands (Grenzfall): Bestand geschrumpft, alte Klemme hoch.
    expect(kreditEinmal(land, {}, { bankKapital: -5, klemme: 14 }).klemme).toBeCloseTo(11, 9);
    expect(kreditEinmal(land, {}, { bankKapital: 8 }).klemme).toBe(0);
    // Wächst die Bilanz schneller als das Eigenkapital, sinkt die Quote etwas: noch keine Klemme.
    expect(kreditEinmal(land, {}, { bankKapital: 7.3 }).klemme).toBe(0);
  });

  it("M5: Mehr vorgeschriebenes Eigenkapital ist ein Puffer, keine Klemme; weniger senkt die Messlatte", () => {
    const land = bankland();
    // +3 Pp.: Die Bank steht bei 8 %, baut aus Gewinnen auf — ohne Kreditklemme.
    expect(kreditEinmal(land, { stell: { "banken.eigenkapital": 3 } }, { bankKapital: 8 }).klemme).toBe(0);
    expect(kreditEinmal(land, { stell: { "banken.eigenkapital": 3 } }, { bankKapital: 6.2 }).klemme).toBeCloseTo(1.375, 9);
    // −2 Pp.: Die Messlatte ist 6 %, die Klemme beginnt bei 5,4 %.
    expect(kreditEinmal(land, { stell: { "banken.eigenkapital": -2 } }, { bankKapital: 6 }).klemme).toBe(0);
    expect(kreditEinmal(land, { stell: { "banken.eigenkapital": -2 } }, { bankKapital: 4.4 }).klemme).toBeCloseTo(1.375, 9);
  });

  it("Kapitalkosten: jeder Pp. mehr Eigenkapital verteuert neuen Kredit um 0,13 Pp.", () => {
    const land = bankland();
    const basis = kreditEinmal(land);
    const mehr = kreditEinmal(land, { stell: { "banken.eigenkapital": 3 } });
    // Zinsbindung 5 Jahre: im ersten Jahr kommt ein Fünftel im Bestand an.
    expect(mehr.privatZins - basis.privatZins).toBeCloseTo((0.13 * 3) / 5, 9);
    expect(kreditEinmal(land, { stell: { "banken.eigenkapital": 3 }, aus: ["banken.kapitalkosten"] }).privatZins).toBe(basis.privatZins);
  });

  it("Banken aus: Bankdaten im Land ändern den Kredit nicht", () => {
    const ohne = testland();
    const mitDaten = testland(BANKWERTE, { banken: "aus" });
    const alt0 = { hausUeber: 10, bankKapital: 1 };
    const a = kreditEinmal(ohne, { stell: { "banken.eigenkapital": 3 } }, alt0);
    const b = kreditEinmal(mitDaten, { stell: { "banken.eigenkapital": 3 } }, alt0);
    expect(b.kredit).toBe(a.kredit);
    expect(b.privatZins).toBe(a.privatZins);
    expect(b.klemme).toBe(0);
  });
});

describe("Boom und Krise aus dem Modell selbst", () => {
  // Eigene Währung: Der Leitzins folgt dem Weltrealzins ganz (im Euro nur mit dem Gewicht des Landes).
  // Anstoß in der Größe der USA 2001–2005: Realzins 4 Pp. tiefer, acht Jahre lang.
  const land = bankland({ hausBewertung0: 0 }, { regime: "eigen" });
  const billig = { welt: { realzins: [{ ab: 2025, wert: 0.8 }, { ab: 2027, wert: -3.2 }, { ab: 2035, wert: 0.8 }] } };
  const OHNE = ["banken.sicherheiten", "banken.hausKredit"];
  // Gipfel im Boom-Fenster (die ersten 20 Jahre), nicht der langsame Anstieg mit dem Einkommen danach.
  const gipfel = (v: Zustand[]) => Math.max(...v.slice(0, 21).map((z) => z.hauspreis));
  const lueckeMax = (v: Zustand[]) => Math.max(...v.slice(3, 13).map((z) => z.kreditluecke));

  it("acht Jahre billiges Geld: Hauspreis real über +20 %, Kreditlücke deutlich offen, danach fällt der Preis", () => {
    const v = lauf(land, billig, 46);
    expect(gipfel(v)).toBeGreaterThan(120);
    expect(lueckeMax(v)).toBeGreaterThan(6);
    const wann = v.findIndex((z) => z.hauspreis === gipfel(v));
    expect(wann).toBeGreaterThan(3);
    expect(wann).toBeLessThan(15);
    expect(Math.min(...v.slice(wann, wann + 12).map((z) => z.hauspreis))).toBeLessThan(0.85 * gipfel(v));
    // Der Abschwung folgt der Zinswende: faule Kredite steigen, ohne gesetzten Krisenschock.
    expect(Math.max(...v.slice(wann).map((z) => z.npl))).toBeGreaterThan(v[wann].npl + 1);
  });

  it("ohne Sicherheiten-Schleife ist derselbe Boom höchstens halb so groß", () => {
    const mit = lauf(land, billig, 46);
    const ohne = lauf(land, { ...billig, aus: OHNE }, 46);
    expect(gipfel(ohne) - 100).toBeLessThan(0.5 * (gipfel(mit) - 100));
    expect(lueckeMax(mit)).toBeGreaterThan(lueckeMax(ohne) + 2);
  });

  it("kein Dauerschwingen: nach dem Boom höchstens drei Vorzeichenwechsel der Lücken in 30 Jahren", () => {
    const v = lauf(land, billig, 46);
    expect(wechsel(v.slice(15, 46).map((z) => z.kreditluecke))).toBeLessThanOrEqual(3);
    expect(wechsel(v.slice(15, 46).map((z) => z.hausluecke))).toBeLessThanOrEqual(3);
  });

  it("Eigenkapital +3 Pp.: Kredit teurer, weniger Privatschuld, die Krise wird milder (Lernpunkt 6)", () => {
    const l = bankland({ hausBewertung0: 0 });
    const krise = { schocks: [{ id: 1, art: "krise" as const, jahr: 2035, staerke: 3, dauer: 1 }] };
    const normal = lauf(l, krise, 26);
    const mehr = lauf(l, { ...krise, stell: { "banken.eigenkapital": 3 } }, 26);
    expect(mehr[5].privatZins).toBeGreaterThan(normal[5].privatZins + 0.2);
    expect(mehr[9].bankKapital).toBeGreaterThan(9.5);
    expect(mehr[9].privatschuld).toBeLessThan(normal[9].privatschuld);
    const ruhig = lauf(l, {}, 21);
    const ruhigMehr = lauf(l, { stell: { "banken.eigenkapital": 3 } }, 21);
    expect(ruhigMehr[20].privatschuld).toBeLessThan(ruhig[20].privatschuld);
    // Das Schockjahr (2035) ist gesetzt und in beiden Läufen gleich tief. Die Banken verlieren 2036,
    // kürzen den Kredit 2037, und die Nachfrage spürt es 2038. Gemessen wird ab dann.
    const tief = (v: Zustand[]) => Math.min(...v.slice(13).map((z) => z.luecke));
    expect(tief(mehr)).toBeGreaterThan(tief(normal) + 0.005);
    const klemme = (v: Zustand[]) => v.slice(10).reduce((s, z) => s + z.klemme, 0);
    expect(klemme(normal)).toBeGreaterThan(5);
    expect(klemme(mehr)).toBeLessThan(0.2 * klemme(normal));
  });
});

describe("Zögern kostet (Lernpunkt 5)", () => {
  // Prüfbefund: Vor der Korrektur der Heilung war „zögernd“ in Deutschland und den USA billiger als „schnell“.
  for (const code of ["DE", "US", "FR"])
    it(`${code}, Finanzkrise Stärke 3: zögernd spart dem Staat die Rettung, kostet aber mehr Kredit und lässt faule Kredite länger stehen`, () => {
      const l = LAENDER[code];
      const r = (rettung: "schnell" | "zoegernd") =>
        rechne(l, { ...basisSzenario(l, 31), grund: { ...l.grund, banken: "an", rettung, politik: "fest" }, schocks: [{ id: 1, art: "krise", jahr: 2030, staerke: 3, dauer: 1 }] });
      const schnell = r("schnell"), zoeg = r("zoegernd");
      const summe = (v: Zustand[], f: (z: Zustand) => number) => v.reduce((a, z) => a + f(z), 0);
      expect(summe(zoeg, (z) => z.rettung)).toBeLessThan(summe(schnell, (z) => z.rettung));
      expect(summe(zoeg, (z) => z.klemme)).toBeGreaterThan(1.5 * summe(schnell, (z) => z.klemme));
      expect(zoeg.filter((z) => z.npl > 5).length).toBeGreaterThan(1.5 * schnell.filter((z) => z.npl > 5).length);
      // Wohlstand 15 Jahre danach: zögernd nicht besser (höchstens ein halbes Prozent Abstand nach oben).
      expect(zoeg[20].bipProKopf).toBeLessThan(1.005 * schnell[20].bipProKopf);
    });
});

describe("Robustheit der Schleife (Grenzfall)", () => {
  for (const code of Object.keys(LAENDER))
    it(`${code}: 101 Jahre, auch bei Weltrealzins −3 %: Hauspreis unter dem Zwölffachen des Starts, Privatschuld unter 400 % BIP`, () => {
      // Mit den echten Bankdaten des Landes (Kanada startet 57 % überbewertet, China mit 99 % Bankanteil).
      const l = LAENDER[code];
      const grund = { ...l.grund, banken: "an" as const };
      for (const welt of [{}, { realzins: -3 }]) {
        const v = rechne(l, { ...basisSzenario(l, 101), grund, welt });
        for (const z of v) {
          for (const [f, w] of Object.entries(z)) if (typeof w === "number") expect(Number.isFinite(w), `${z.jahr} ${f}`).toBe(true);
          // Schranke gegen ein Aufschaukeln, nicht gegen Wachstum über 100 Jahre. Seit 13.13 (andere Eingriffe
          // der Regierung) erreicht China im Stressfall 2125 den Wert 1097; mit Politik fest 937.
          expect(z.hauspreis, `${z.jahr} Hauspreis`).toBeLessThan(1200);
          expect(z.privatschuld, `${z.jahr} Privatschuld`).toBeLessThan(400);
        }
      }
    });

  // Ränder der Spannen aus dem Verzeichnis: Kredit → Hauspreis 2, Hauspreis → Kredit 0,3.
  const OBEN = { "banken.hausKredit": 2, "banken.sicherheiten": 0.3 };
  const ALLES_OBEN = { ...OBEN, "banken.hausMomentum": 0.7, "banken.hausZins": 8 };
  // Grenze für den Hauspreis: das Zehnfache; wenn alle vier Wirkstärken zugleich am Rand stehen, das
  // Zwanzigfache (dort schwingt die Schleife dauerhaft, die Leitplanken halten sie endlich).
  for (const [name, std, grenze] of [["Schleife am oberen Ende der Spanne", OBEN, 1000], ["alle Hauspreis-Wirkstärken am oberen Ende", ALLES_OBEN, 2000]] as const)
    it(`${name}, 101 Jahre: alles endlich, Hauspreis und Privatschuld begrenzt`, () => {
      const l = bankland({ hausBewertung0: 0 }, { regime: "eigen" });
      l.standards = { ...l.standards, ...std };
      for (const welt of [{}, { realzins: -3 }]) {
        const v = rechne(l, { ...basisSzenario(l, 101), welt });
        for (const z of v) {
          for (const [f, w] of Object.entries(z))
            if (typeof w === "number") expect(Number.isFinite(w), `${z.jahr} ${f}`).toBe(true);
          expect(z.hauspreis, `${z.jahr} Hauspreis`).toBeLessThan(grenze);
          expect(z.hausWert, `${z.jahr} Hauswert`).toBeGreaterThan(0);
          expect(z.privatschuld, `${z.jahr} Privatschuld`).toBeLessThan(400);
        }
      }
    });

  it("zögernde Rettung, Finanzkrise Stärke 5: Klemme höchstens 10 % des Bestands, Privatschuld ≥ 0, keine NaN", () => {
    const l = bankland({ bankKapital0: 2, bankBilanz0: 120 }, { rettung: "zoegernd" });
    const v = lauf(l, { schocks: [{ id: 1, art: "krise", jahr: 2028, staerke: 5, dauer: 1 }] }, 31);
    expect(Math.max(...v.map((z) => z.klemme))).toBeGreaterThan(0);
    expect(Math.min(...v.map((z) => z.bankKapital))).toBeLessThan(1);
    v.forEach((z, i) => {
      if (i > 0) expect(z.klemme, `${z.jahr}`).toBeLessThanOrEqual(0.1 * v[i - 1].privatschuld + 1e-12);
      expect(z.privatschuld, `${z.jahr}`).toBeGreaterThanOrEqual(0);
      for (const [f, w] of Object.entries(z))
        if (typeof w === "number") expect(Number.isFinite(w), `${z.jahr} ${f}`).toBe(true);
    });
  });
});
