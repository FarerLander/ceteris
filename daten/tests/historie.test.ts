import { rechne } from "../../modell/rechne";
import autoDE from "../laender/DE.json";
import handDE from "../laender/DE-hand.json";
import histDE from "../laender/DE-historie.json";
import { baueRueckblick, istReihen } from "../historie";
import { BANKEN_STANDARD, bankenDaten } from "../../modell/banken-modus";
import { pruefeTreffsicherheit } from "../../modell/rueckblick";
import type { AutoDatei, HandDatei, HistorieDatei } from "../typen";

const HEUTE = new Date("2026-09-27");
const rb = () =>
  baueRueckblick(
    autoDE as unknown as AutoDatei,
    handDE as unknown as HandDatei,
    histDE as unknown as HistorieDatei,
    HEUTE,
  );

describe("Rückblick-Aufbau", () => {
  it("startet 2000 mit echten Daten und rechnet bis zum Datenstand", () => {
    const { land, sz, bis } = rb();
    expect(land.datenstand).toBe(2000);
    expect(bis).toBeGreaterThanOrEqual(2024);
    expect(sz.jahre).toBe(bis - 2000 + 1);
    expect(land.start.bip).toBeCloseTo(
      (autoDE as unknown as AutoDatei).reihen.bip[2000],
      6,
    );
    expect(land.standards["steuer.mwst"]).toBe(0.16);
    // Werte der Historie gehen vor automatischen Reihen (z. B. Ausgaben 2000 ohne UMTS-Erlöse).
    expect(land.start.ausgaben).toBe(47.6);
  });
  it("übernimmt Politikpfade, Weltpfade und Schocks", () => {
    const { sz } = rb();
    expect(sz.stell["steuer.mwst"]).toEqual([
      { ab: 2000, wert: 0.16 },
      { ab: 2007, wert: 0.19 },
    ]);
    expect(sz.welt.oel).toContainEqual({ ab: 2008, wert: 97 });
    expect(sz.schocks.map((s) => s.jahr)).toEqual([2009, 2020, 2022]);
  });
  it("die Rechnung läuft durch und bleibt endlich", () => {
    const { land, sz } = rb();
    const v = rechne(land, sz);
    expect(v).toHaveLength(sz.jahre);
    for (const z of v) {
      expect(Number.isFinite(z.Y)).toBe(true);
      expect(Number.isFinite(z.schuldQuote)).toBe(true);
    }
  });
});

describe("Spec 13.6: Rückblick mit Bankdaten", () => {
  it("das Rückblick-Land hat alle sieben Bankwerte des Jahres 2000 und einen Hauspreis-Trend", () => {
    const { land } = rb();
    expect(bankenDaten(land.start)).toBe(true);
    // Werte von 2000 aus der Historie, nicht die heutigen Ersatzwerte.
    expect(land.start.npl0).toBe((histDE as unknown as HistorieDatei).werte.npl0);
    expect(land.start.bankKapital0).toBe((histDE as unknown as HistorieDatei).werte.bankKapital0);
    expect(land.start.hausTrend0).toBeDefined();
  });
});

// Standard-Entscheidung (Bauplan 13.6, Task 7): „an“ nur, wenn der Rückblick insgesamt nicht schlechter
// wird, keine Reihe neu über die Hürde U < 1 steigt, mindestens drei der vier Krisenfälle bestehen und
// keine Basislauf-Rettung ohne Lampe davor kommt. Keine der vier Bedingungen ist erfüllt.
describe("Spec 13.6: Rückblick Deutschland mit Banken an, Standard-Entscheidung", () => {
  const { land, sz } = rb();
  const ist = istReihen(autoDE as unknown as AutoDatei, histDE as unknown as HistorieDatei);
  const lauf = (banken?: "an" | "aus") => rechne(land, { ...sz, grund: { ...sz.grund, ...(banken ? { banken } : {}) } });
  const u = (v: ReturnType<typeof rechne>, id: string) => pruefeTreffsicherheit(v, ist).find((t) => t.id === id)!.theilU!;

  it("Standard ist „aus“: Der Rückblick rechnet ohne Angabe bitgenau wie mit „aus“", () => {
    expect(BANKEN_STANDARD).toBe("aus");
    const ohne = lauf(), aus = lauf("aus");
    ohne.forEach((z, i) => {
      for (const f of ["Y", "schuldQuote", "alq", "inflation", "rendite", "privatschuld"] as const) expect(z[f]).toBe(aus[i][f]);
      expect(z.rettung).toBe(0);
    });
  });
  it("mit „an“ wird der Rückblick schlechter: Wachstum, Inflation und Arbeitslosigkeit; Rentenausgaben über der Hürde", () => {
    const an = lauf("an"), aus = lauf("aus");
    for (const id of ["wachstum", "inflation", "alq"]) expect(u(an, id), id).toBeGreaterThan(u(aus, id) + 0.03);
    expect(u(aus, "rentenausgaben")).toBeLessThan(1);
    expect(u(an, "rentenausgaben")).toBeGreaterThan(1);
    // Die Schuld wird besser, aber aus dem falschen Grund (Rettung 2022, siehe unten).
    expect(u(an, "schuldQuote")).toBeLessThan(u(aus, "schuldQuote"));
  });
  it.fails("bekannte Lücke (M33): keine eigene Rettung 2000–2025", () => {
    expect(lauf("an").every((z) => z.rettung === 0)).toBe(true);
  });
  it.fails("bekannte Lücke (M33): keine Hauspreis-Lampe vor 2010", () => {
    expect(lauf("an").filter((z) => z.jahr < 2010).every((z) => z.hausluecke <= 15)).toBe(true);
  });
  it.fails("bekannte Lücke (M33): Hauspreis 2008 real unter dem von 2000 (gemessen −14 %)", () => {
    expect(lauf("an").find((z) => z.jahr === 2008)!.hauspreis).toBeLessThan(100);
  });
});

describe("Ist-Reihen für die Treffsicherheit", () => {
  it("enthalten alle neun Größen für 2000 bis zum Datenstand", () => {
    const ist = istReihen(autoDE as unknown as AutoDatei, histDE as unknown as HistorieDatei);
    for (const k of ["wachstumReal", "inflation", "alq", "schuldQuote", "bev", "erwerbspersonen", "rentenausgaben", "leistungsbilanz", "rendite"]) {
      expect(ist[k]?.[2000], k).toBeDefined();
      expect(ist[k]?.[2024], k).toBeDefined();
    }
    expect(ist.bev[1999]).toBeDefined();
    expect(ist.erwerbspersonen[1999]).toBeDefined();
  });
});

describe("Demografie-Pfade aus Daten", () => {
  it("Lebenserwartung und Geburtenrate folgen im Rückblick den World-Bank-Reihen", () => {
    const { sz, land } = rb();
    const le = (autoDE as unknown as AutoDatei).reihen.lebenserwartung;
    const pfad = sz.stell["demo.lebenserwartungTrend"] as { ab: number; wert: number }[];
    expect(pfad.find((x) => x.ab === 2011)!.wert).toBeCloseTo(le[2011] - le[2010], 9);
    const tfr = sz.stell["demo.geburtenrate"] as { ab: number; wert: number }[];
    expect(tfr.find((x) => x.ab === 2016)!.wert).toBeCloseTo((autoDE as unknown as AutoDatei).reihen.tfr[2016], 9);
    expect(land.start.lebenserwartung).toBeCloseTo(le[2000], 9);
  });
});

describe("Relative Politikpfade", () => {
  it("stellRelativ addiert auf den kalibrierten Standard des Startjahres", () => {
    const { sz, land } = rb();
    const pfad = sz.stell["staat.uebrige"] as { ab: number; wert: number }[];
    expect(pfad.find((x) => x.ab === 2009)!.wert).toBeCloseTo(land.standards["staat.uebrige"] + 1, 9);
    expect(pfad.find((x) => x.ab === 2011)!.wert).toBeCloseTo(land.standards["staat.uebrige"], 9);
  });
});
