import { bisJahresende, bisJahresmittel, LAENDER, parseImf, parseOecdCsv, parseWeltbank, schneideProjektionen } from "../parser";

describe("parseWeltbank", () => {
  it("liest Jahr und Wert, überspringt null, wendet Faktor an", () => {
    const json = [
      { page: 1 },
      [
        { date: "2024", value: 84000000 },
        { date: "2023", value: null },
        { date: "2022", value: 83800000 },
      ],
    ];
    expect(parseWeltbank(json)).toEqual({ 2024: 84000000, 2022: 83800000 });
    expect(parseWeltbank(json, 1e-6)).toEqual({ 2024: 84, 2022: 83.8 });
  });
  it("liefert leere Reihe bei Fehlerantwort", () => {
    expect(parseWeltbank([{ message: [{ id: "120" }] }])).toEqual({});
  });
});

describe("parseImf", () => {
  it("liest die Werte des Landes", () => {
    const json = {
      values: { GGXWDG_NGDP: { DEU: { "2023": 62.9, "2024": 63.5 } } },
    };
    expect(parseImf(json, "GGXWDG_NGDP", "DEU")).toEqual({
      2023: 62.9,
      2024: 63.5,
    });
  });
  it("liefert leere Reihe, wenn Land fehlt", () => {
    expect(parseImf({ values: { X: {} } }, "X", "DEU")).toEqual({});
  });
});

describe("parseOecdCsv", () => {
  it("filtert Zeilen nach Spalten und liest TIME_PERIOD/OBS_VALUE", () => {
    const csv = [
      "REF_AREA,Reference area,FREQ,MEASURE,TIME_PERIOD,OBS_VALUE",
      "DEU,Germany,A,IRLT,2023,2.46",
      "DEU,Germany,A,IRLT,2024,2.34",
      "FRA,France,A,IRLT,2024,3.0",
      "DEU,Germany,M,IRLT,2024-01,2.1",
    ].join("\n");
    expect(
      parseOecdCsv(csv, { REF_AREA: "DEU", FREQ: "A", MEASURE: "IRLT" }),
    ).toEqual({ 2023: 2.46, 2024: 2.34 });
  });
  it("versteht Anführungszeichen mit Kommas", () => {
    const csv =
      'REF_AREA,Reference area,TIME_PERIOD,OBS_VALUE\nDEU,"Germany, Federal Republic",2024,2.3';
    expect(parseOecdCsv(csv, { REF_AREA: "DEU" })).toEqual({ 2024: 2.3 });
  });
});

describe("schneideProjektionen", () => {
  it("entfernt Jahre nach dem Grenzjahr nur aus den genannten Reihen", () => {
    const r = { schuldQuote: { 2024: 63, 2025: 63.5, 2026: 64 }, bev: { 2025: 83, 2026: 83.1 } };
    expect(schneideProjektionen(r, ["schuldQuote"], 2025)).toEqual({ schuldQuote: { 2024: 63, 2025: 63.5 }, bev: { 2025: 83, 2026: 83.1 } });
  });
});

describe("LAENDER", () => {
  it("kennt die sieben Länder von Version 1 und Update 2", () => {
    expect(LAENDER).toEqual({
      DE: { iso3: "DEU", name: "Deutschland" },
      US: { iso3: "USA", name: "USA" },
      JP: { iso3: "JPN", name: "Japan" },
      GB: { iso3: "GBR", name: "Vereinigtes Königreich" },
      FR: { iso3: "FRA", name: "Frankreich" },
      IT: { iso3: "ITA", name: "Italien" },
      CA: { iso3: "CAN", name: "Kanada" },
      CN: { iso3: "CHN", name: "China" },
      RU: { iso3: "RUS", name: "Russland" },
    });
  });
});

describe("BIS-Quartalsreihen (Spec 13.6)", () => {
  const csv = [
    "FREQ,REF_AREA,VALUE,UNIT_MEASURE,UNIT_MULT,BREAKS,COVERAGE,TITLE_TS,TIME_PERIOD,OBS_VALUE,OBS_STATUS,OBS_CONF,OBS_PRE_BREAK",
    "Q,DE,R,628,0,,,,2023-Q3,131.4,A,F,",
    "Q,DE,R,628,0,,,,2023-Q4,128.8,A,F,",
    "Q,DE,R,628,0,,,,2024-Q1,100,A,F,",
    "Q,DE,R,628,0,,,,2024-Q2,110,A,F,",
    "Q,DE,R,628,0,,,,2024-Q3,120,A,F,",
    "Q,DE,R,628,0,,,,2024-Q4,130,A,F,",
    "Q,DE,R,628,0,,,,2025-Q1,NaN,A,F,",
    "Q,DE,R,628,0,,,,2025-Q2,129.6,A,F,",
  ].join("\n");
  it("Jahresmittel nur aus vollständigen Jahren", () => {
    expect(bisJahresmittel(csv)).toEqual({ 2024: 115 });
  });
  it("Jahresende nimmt das vierte Quartal", () => {
    expect(bisJahresende(csv)).toEqual({ 2023: 128.8, 2024: 130 });
  });
  it("Fehlerseite statt CSV: leere Reihe", () => {
    expect(bisJahresmittel("<?xml version=\"1.0\" ?><message:Error>")).toEqual({});
  });
});
