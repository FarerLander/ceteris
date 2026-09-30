import { describe, expect, it } from "vitest";
import DE from "../laender/DE.json";
import DEhand from "../laender/DE-hand.json";
import type { AutoDatei, HandDatei } from "../typen";
import { bereinigeSchock, ergaenzeBanken, ergaenzeKurzzins, hausStart, kreditStart, schaetzDatei } from "./datei";
import { reihenAus } from "./reihen";

const a = DE as unknown as AutoDatei,
  h = DEhand as unknown as HandDatei;

describe("Schätzdatei", () => {
  it("Deutschland: Jahr = Datenstand, vier Werte, Reihen ab 2000", () => {
    const d = schaetzDatei(a, h);
    expect(d.fehler).toBeUndefined();
    expect(d.werte.map((w) => w.groesse)).toEqual([
      "tfpTrend",
      "nairu",
      "rStern",
      "luecke",
    ]);
    expect(d.reihen.luecke[0].jahr).toBe(2000);
    expect(d.stand).toBe(a.abgerufen);
  });
  it("zweimal schätzen: byte-gleich", () => {
    expect(JSON.stringify(schaetzDatei(a, h))).toBe(
      JSON.stringify(schaetzDatei(a, h)),
    );
  });
  it("Wachstum fehlt: fehler statt Ausnahme", () => {
    const kaputt = { ...a, reihen: { ...a.reihen, wachstumReal: { 2000: 1 } } };
    const d = schaetzDatei(kaputt, h);
    expect(d.fehler).toBeTruthy();
    expect(d.werte).toEqual([]);
  });
  it("ergaenzeKurzzins lässt alle anderen Reihen byte-gleich", () => {
    const neu = ergaenzeKurzzins(
      a,
      { 2000: 4.4 },
      "OECD Financial market statistics IR3TIB",
    );
    const { kurzzins, ...rest } = neu.reihen;
    const { kurzzins: _alt, ...restAlt } = a.reihen as Record<string, unknown>;
    expect(JSON.stringify(rest)).toBe(JSON.stringify(restAlt));
    expect(kurzzins).toEqual({ 2000: 4.4 });
    expect(neu.abgerufen).toBe(a.abgerufen);
  });
  it("Angebotsschock: nur die Inflations-Messwerte 2021–2023 fehlen, die Erwartung nutzt die Ist-Inflation", () => {
    const r = bereinigeSchock(reihenAus(a, 2000, 2025));
    const i = (j: number) => j - 2000;
    expect([2021, 2022, 2023].map((j) => r.infl[i(j)])).toEqual([null, null, null]);
    expect(r.infl[i(2024)]).toBe(a.reihen.inflation[2024]);
    expect(r.inflVj[i(2024)]).toBe(a.reihen.inflation[2023]);
  });
  it("13.2: Kredittrend im Datenstand-Jahr, gleiches Bezugsjahr wie das Niveau (nicht fortgeschrieben)", () => {
    const d = schaetzDatei(a, h);
    expect(d.kredit?.jahr).toBe(d.jahr);
    const r = a.reihen.privatschuld;
    const letztes = Math.max(...Object.keys(r).map(Number));
    // baueLand übernimmt das Niveau des letzten Datenjahres; der Trend muss dasselbe Jahr meinen.
    const { trend, steigung } = kreditStart(a, letztes)!;
    expect(kreditStart(a, d.jahr)).toMatchObject({ jahr: d.jahr, trend, steigung });
  });
  it("13.2: zu kurze Privatschuld-Reihe → kein Kredittrend", () => {
    const kurz = { ...a, reihen: { ...a.reihen, privatschuld: { 2016: 1, 2017: 2, 2018: 3, 2019: 4, 2020: 5, 2021: 6, 2022: 7, 2023: 8, 2024: 9 } } };
    expect(kreditStart(kurz, 2025)).toBeUndefined();
    const ohne = { ...a, reihen: { ...a.reihen, privatschuld: {}, privatkredit: {} } };
    expect(schaetzDatei(ohne, h).kredit).toBeUndefined();
  });
  it("13.6: Hauspreis-Trend im Datenstand-Jahr, relativ zum Niveau des Jahres", () => {
    const d = schaetzDatei(a, h);
    expect(d.haus?.jahr).toBe(d.jahr);
    const r = a.reihen.hauspreisReal;
    // Wachstum = Änderung von 100·ln(Index) gegenüber dem Vorjahr
    expect(d.haus!.wachstum).toBeCloseTo(100 * Math.log(r[d.jahr] / r[d.jahr - 1]), 2);
    // Trend minus Niveau: Die Lücke im Startjahr ist −trend.
    expect(Math.abs(d.haus!.trend)).toBeLessThan(40);
    // Gleichmäßig 2 % im Jahr: Der Trend liegt auf der Reihe, Steigung 2.
    const glatt = { ...a, reihen: { ...a.reihen, hauspreisReal: Object.fromEntries(Array.from({ length: 30 }, (_, i) => [1996 + i, 100 * Math.exp(0.02 * i)])) } };
    const g = hausStart(glatt, 2025)!;
    expect(g.trend).toBeCloseTo(0, 6);
    expect(g.steigung).toBeCloseTo(2, 6);
    expect(g.wachstum).toBeCloseTo(2, 6);
  });
  it("13.6: ohne Hauspreis im Startjahr oder mit zu kurzer Reihe kein Trend", () => {
    const { hauspreisReal: r, ...rest } = a.reihen;
    expect(schaetzDatei({ ...a, reihen: rest }, h).haus).toBeUndefined();
    const { [2025]: _weg, ...bis2024 } = r;
    expect(hausStart({ ...a, reihen: { ...rest, hauspreisReal: bis2024 } }, 2025)).toBeUndefined();
    expect(hausStart({ ...a, reihen: { ...rest, hauspreisReal: { 2023: 100, 2024: 101, 2025: 102 } } }, 2025)).toBeUndefined();
  });
  it("13.6: ergaenzeBanken lässt alle anderen Reihen byte-gleich", () => {
    const neu = ergaenzeBanken(a, { npl: { 2024: 1.5 } }, { npl: "Test" });
    expect(neu.reihen.npl).toEqual({ 2024: 1.5 });
    expect(neu.quellen.npl).toBe("Test");
    const { npl: _n, ...alt } = neu.reihen;
    const { npl: _m, ...vorher } = a.reihen;
    expect(JSON.stringify(alt)).toBe(JSON.stringify(vorher));
    expect(neu.abgerufen).toBe(a.abgerufen);
  });
});
