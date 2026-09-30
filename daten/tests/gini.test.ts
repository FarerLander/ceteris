import { readFileSync } from "node:fs";
import { IST, LAENDER, RUECKBLICK } from "../../app/land";
import autoDE from "../laender/DE.json";
import handDE from "../laender/DE-hand.json";
import { baueLand } from "../land";
import { parseOecdGini } from "../parser";
import type { AutoDatei, HandDatei } from "../typen";

// Spec 13.13: Gini einheitlich aus der OECD Income Distribution Database, wo es sie gibt.
const OECD_LAENDER = ["DE", "US", "JP", "GB", "FR", "IT", "CA"];
const HEUTE = new Date("2026-09-30");

describe("parseOecdGini", () => {
  const csv = readFileSync("daten/tests/fixtures/oecd-idd.csv", "utf-8");
  it("liest den Gini des verfügbaren Einkommens je Land auf der Skala 0–100", () => {
    expect(parseOecdGini(csv, "DEU")).toEqual({ 2021: 31.3, 2022: 30.9 });
    expect(parseOecdGini(csv, "USA")).toEqual({ 2021: 37.5, 2022: 39.6 });
    expect(parseOecdGini(csv, "JPN")).toEqual({ 2021: 33.8 });
    expect(parseOecdGini(csv, "FRA")).toEqual({});
  });
  it("nimmt nur die neue Einkommensdefinition, alle Altersgruppen", () => {
    const kopf =
      "REF_AREA,MEASURE,AGE,METHODOLOGY,DEFINITION,TIME_PERIOD,OBS_VALUE";
    const zeilen = [
      "DEU,INC_DISP_GINI,_T,METH2011,D_CUR,2011,0.293",
      "DEU,INC_DISP_GINI,_T,METH2012,D_CUR,2011,0.2905",
      "DEU,INC_DISP_GINI,Y18T65,METH2012,D_CUR,2012,0.3",
      "DEU,INC_MRKT_GINI,_T,METH2012,D_CUR,2012,0.5",
      "DEU,INC_DISP_GINI,_T,METH2012,D_PREV,2012,0.31",
    ];
    expect(parseOecdGini([kopf, ...zeilen].join("\n"), "DEU")).toEqual({
      2011: 29.1,
    });
  });
});

describe("Gini-Startwerte", () => {
  it("sieben Länder aus der OECD, mit Jahr in der Quelle", () => {
    for (const c of OECD_LAENDER)
      expect([c, LAENDER[c].quellen?.gini]).toEqual([
        c,
        expect.stringMatching(/^OECD Income Distribution Database.*, 20\d\d$/),
      ]);
  });
  it("China und Russland aus der Weltbank, mit Hinweis zur Vergleichbarkeit", () => {
    for (const c of ["CN", "RU"]) {
      expect([c, LAENDER[c].quellen?.gini]).toEqual([
        c,
        expect.stringMatching(/^Weltbank SI\.POV\.GINI, 20\d\d/),
      ]);
      expect(LAENDER[c].hinweis).toContain(
        "Ungleichheit: Weltbank-Messung, nicht direkt mit den übrigen Ländern vergleichbar.",
      );
    }
  });
  it("die Datenlage nennt je Land nur die genutzte Quelle, nicht die Rohreihe der OECD", () => {
    for (const [c, l] of Object.entries(LAENDER)) expect([c, Object.keys(l.quellen ?? {}).includes("giniOecd")]).toEqual([c, false]);
  });
  it("alle neun Startwerte liegen zwischen 20 und 60", () => {
    for (const [c, l] of Object.entries(LAENDER)) {
      expect([c, l.start.gini > 20 && l.start.gini < 60]).toEqual([c, true]);
    }
  });
  it("Deutschland: letzter OECD-Wert, ohne Ersatzwert aus EU-SILC und ohne Markierung", () => {
    const auto = autoDE as unknown as AutoDatei;
    const jahr = Math.max(...Object.keys(auto.reihen.giniOecd).map(Number));
    expect(LAENDER.DE.start.gini).toBe(auto.reihen.giniOecd[jahr]);
    expect(LAENDER.DE.quellen?.gini).toContain(String(jahr));
    expect((handDE as unknown as HandDatei).ersatz.gini).toBeUndefined();
    expect(LAENDER.DE.markiert.filter((m) => m.startsWith("gini"))).toEqual([]);
  });
  it("OECD-Wert älter als sechs Jahre: Weltbank gilt, markiert wie bisher", () => {
    const auto = autoDE as unknown as AutoDatei;
    const alt: AutoDatei = {
      ...auto,
      reihen: { ...auto.reihen, giniOecd: { 2015: 29.3 } },
    };
    const l = baueLand(alt, handDE as unknown as HandDatei, HEUTE);
    expect(l.quellen?.gini).toMatch(/^Weltbank/);
    expect(l.start.gini).toBe(
      auto.reihen.gini[Math.max(...Object.keys(auto.reihen.gini).map(Number))],
    );
    expect(l.markiert.some((m) => m.startsWith("gini"))).toBe(true);
  });
  it("Rückblick Deutschland: Start 2000 und Ist-Reihe aus der OECD", () => {
    expect(RUECKBLICK.land.start.gini).toBe(26.4);
    expect(RUECKBLICK.land.quellen?.gini).toMatch(/^Startwert 2000: OECD/);
    expect(IST.gini[2000]).toBe(26.4);
    expect(IST.gini[2005]).toBe(29.7);
    expect(IST.gini[2021]).toBe(31.3);
  });
});
