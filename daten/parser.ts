import type { KonsensGroesse, KonsensQuelle } from "../modell/typen";
import type { Reihe } from "./typen";

export const LAENDER: Record<string, { iso3: string; name: string }> = {
  DE: { iso3: "DEU", name: "Deutschland" },
  US: { iso3: "USA", name: "USA" },
  JP: { iso3: "JPN", name: "Japan" },
  GB: { iso3: "GBR", name: "Vereinigtes Königreich" },
  FR: { iso3: "FRA", name: "Frankreich" },
  IT: { iso3: "ITA", name: "Italien" },
  CA: { iso3: "CAN", name: "Kanada" },
  CN: { iso3: "CHN", name: "China" },
  RU: { iso3: "RUS", name: "Russland" },
};

export const GRUPPEN = [
  "0004",
  "0509",
  "1014",
  "1519",
  "2024",
  "2529",
  "3034",
  "3539",
  "4044",
  "4549",
  "5054",
  "5559",
  "6064",
  "6569",
  "7074",
  "7579",
  "80UP",
];

// Schlüssel → Kandidaten (Code, Faktor). Der erste Code mit Daten gewinnt.
export const WELTBANK: Record<string, [string, number][]> = {
  bev: [["SP.POP.TOTL", 1e-6]],
  bevM: [["SP.POP.TOTL.MA.IN", 1e-6]],
  bevF: [["SP.POP.TOTL.FE.IN", 1e-6]],
  tfr: [["SP.DYN.TFRT.IN", 1]],
  lebenserwartung: [["SP.DYN.LE00.IN", 1]],
  bip: [["NY.GDP.MKTP.CN", 1e-9]],
  alq: [["SL.UEM.TOTL.ZS", 1]],
  investQuote: [["NE.GDI.TOTL.ZS", 1]],
  exporte: [["NE.EXP.GNFS.ZS", 1]],
  importe: [["NE.IMP.GNFS.ZS", 1]],
  importquote: [["EG.IMP.CONS.ZS", 0.01]],
  co2Mt: [
    ["EN.GHG.CO2.MT.CE.AR5", 1],
    ["EN.ATM.CO2E.KT", 1e-3],
  ],
  gini: [["SI.POV.GINI", 1]],
  privatkredit: [["FS.AST.PRVT.GD.ZS", 1]],
  bipProKopfReal: [["NY.GDP.PCAP.KD", 1]],
  leistungsbilanz: [["BN.CAB.XOKA.GD.ZS", 1]],
  wachstumReal: [["NY.GDP.MKTP.KD.ZG", 1]],
  erwerbspersonen: [["SL.TLF.TOTL.IN", 1e-6]],
  ...Object.fromEntries(
    GRUPPEN.flatMap((g) => [
      [`alterM_${g}`, [[`SP.POP.${g}.MA.5Y`, 1]]],
      [`alterF_${g}`, [[`SP.POP.${g}.FE.5Y`, 1]]],
    ]),
  ),
};

// Spec 13.6: Bankreihen. GFDD (Global Financial Development) liegt in einer eigenen Weltbank-Quelle.
export const WELTBANK_BANKEN: Record<string, [string, string]> = {
  npl: ["FB.AST.NPER.ZS", ""],
  bankKapital: ["FB.BNK.CAPA.ZS", ""],
  bankBilanz: ["GFDD.DI.02", "&source=32"],
};
// BIS-Schlüssel je Reihe (Statistik, Schlüssel mit {c} = Ländercode, Verdichtung auf Jahre).
export const BIS_BANKEN: Record<string, [string, string, "mittel" | "ende"]> = {
  hauspreisReal: ["WS_SPP", "Q.{c}.R.628", "mittel"],
  bankKredit: ["WS_TC", "Q.{c}.P.B.M.770.A", "ende"],
  kreditGesamt: ["WS_TC", "Q.{c}.P.A.M.770.A", "ende"],
};

export const IMF: Record<string, string> = {
  schuldQuote: "GGXWDG_NGDP",
  einnahmen: "rev",
  ausgaben: "exp",
  inflation: "PCPIPCH",
  privatschuld: "PVD_LS",
};

// Prognosen des IWF World Economic Outlook für den Konsens-Vergleich (Spec 12a).
export const IMF_KONSENS: Record<KonsensGroesse, string> = {
  wachstum: "NGDP_RPCH",
  inflation: "PCPIPCH",
  alq: "LUR",
  defizit: "GGXCNL_NGDP",
  schuldQuote: "GGXWDG_NGDP",
};

// Behält nur die Jahre nach dem letzten Messjahr `ab`. Ohne solche Werte gibt es keine Quelle.
export function imfKonsens(roh: Partial<Record<KonsensGroesse, Reihe>>, ab: number, stand: string): KonsensQuelle | null {
  const werte: KonsensQuelle["werte"] = {};
  for (const [g, r] of Object.entries(roh) as [KonsensGroesse, Reihe][]) {
    const vorn = Object.fromEntries(Object.entries(r).filter(([j]) => Number(j) > ab));
    if (Object.keys(vorn).length) werte[g] = vorn;
  }
  if (!Object.keys(werte).length) return null;
  return { kurz: "IWF", name: "IMF World Economic Outlook (DataMapper)", stand, url: "https://www.imf.org/external/datamapper", werte };
}

export function parseWeltbank(json: unknown, faktor = 1): Reihe {
  const r: Reihe = {};
  if (!Array.isArray(json) || !Array.isArray(json[1])) return r;
  for (const zeile of json[1] as { date: string; value: number | null }[]) {
    if (zeile.value === null || zeile.value === undefined) continue;
    const jahr = Number(zeile.date);
    if (Number.isInteger(jahr)) r[jahr] = zeile.value * faktor;
  }
  return r;
}

export function parseImf(json: unknown, code: string, iso3: string): Reihe {
  const werte = (
    json as { values?: Record<string, Record<string, Record<string, number>>> }
  )?.values?.[code]?.[iso3];
  const r: Reihe = {};
  if (!werte) return r;
  for (const [jahr, wert] of Object.entries(werte))
    if (typeof wert === "number") r[Number(jahr)] = wert;
  return r;
}

function zerlegeCsvZeile(zeile: string): string[] {
  const felder: string[] = [];
  let feld = "",
    inAnf = false;
  for (let i = 0; i < zeile.length; i++) {
    const z = zeile[i];
    if (z === '"') {
      if (inAnf && zeile[i + 1] === '"') {
        feld += '"';
        i++;
      } else inAnf = !inAnf;
    } else if (z === "," && !inAnf) {
      felder.push(feld);
      feld = "";
    } else feld += z;
  }
  felder.push(feld);
  return felder;
}

export function parseOecdCsv(
  text: string,
  filter: Record<string, string>,
): Reihe {
  const zeilen = text.trim().split(/\r?\n/);
  const kopf = zerlegeCsvZeile(zeilen[0]);
  const iZeit = kopf.indexOf("TIME_PERIOD"),
    iWert = kopf.indexOf("OBS_VALUE");
  const r: Reihe = {};
  if (iZeit < 0 || iWert < 0) return r;
  const bedingungen = Object.entries(filter).map(
    ([spalte, soll]) => [kopf.indexOf(spalte), soll] as const,
  );
  for (const zeile of zeilen.slice(1)) {
    const f = zerlegeCsvZeile(zeile);
    if (bedingungen.some(([i, soll]) => i < 0 || f[i] !== soll)) continue;
    const jahr = Number(f[iZeit]),
      wert = Number(f[iWert]);
    if (Number.isInteger(jahr) && Number.isFinite(wert)) r[jahr] = wert;
  }
  return r;
}

// Spec 13.13: Gini des verfügbaren Einkommens aus der OECD Income Distribution Database, neue
// Einkommensdefinition (seit 2012), alle Altersgruppen. Die OECD liefert 0–1; das Modell rechnet 0–100.
export const OECD_GINI_QUELLE = "OECD Income Distribution Database (Gini verfügbares Einkommen)";
export function parseOecdGini(csv: string, iso3: string): Reihe {
  const roh = parseOecdCsv(csv, { REF_AREA: iso3, MEASURE: "INC_DISP_GINI", AGE: "_T", METHODOLOGY: "METH2012", DEFINITION: "D_CUR" });
  return Object.fromEntries(Object.entries(roh).map(([j, w]) => [j, Math.round(w * 1000) / 10]));
}

// IMF-Reihen enthalten Projektionen. Alles nach dem letzten Messjahr fällt weg.
export function schneideProjektionen(reihen: Record<string, Reihe>, schluessel: string[], bis: number): Record<string, Reihe> {
  const aus: Record<string, Reihe> = {};
  for (const [k, r] of Object.entries(reihen)) {
    aus[k] = schluessel.includes(k) ? Object.fromEntries(Object.entries(r).filter(([j]) => Number(j) <= bis)) : r;
  }
  return aus;
}

// BIS-CSV mit Quartalen (TIME_PERIOD „2024-Q3“) → Quartalswerte je Jahr.
function bisQuartale(text: string): Record<number, (number | undefined)[]> {
  const zeilen = text.trim().split(/\r?\n/);
  const kopf = zerlegeCsvZeile(zeilen[0] ?? "");
  const iZeit = kopf.indexOf("TIME_PERIOD"),
    iWert = kopf.indexOf("OBS_VALUE");
  const q: Record<number, (number | undefined)[]> = {};
  if (iZeit < 0 || iWert < 0) return q;
  for (const zeile of zeilen.slice(1)) {
    const f = zerlegeCsvZeile(zeile);
    const m = /^(\d{4})-Q([1-4])$/.exec(f[iZeit] ?? "");
    const wert = Number(f[iWert]);
    if (!m || f[iWert] === "" || !Number.isFinite(wert)) continue;
    (q[Number(m[1])] ??= [])[Number(m[2]) - 1] = wert;
  }
  return q;
}

// Jahresmittel, nur aus Jahren mit allen vier Quartalen (Preisindizes).
export function bisJahresmittel(text: string): Reihe {
  const r: Reihe = {};
  for (const [jahr, w] of Object.entries(bisQuartale(text))) {
    const alle = [0, 1, 2, 3].map((i) => w[i]);
    if (alle.every((x) => x !== undefined)) r[Number(jahr)] = (alle as number[]).reduce((a, b) => a + b, 0) / 4;
  }
  return r;
}

// Stand am Jahresende: viertes Quartal (Bestände in % BIP).
export function bisJahresende(text: string): Reihe {
  const r: Reihe = {};
  for (const [jahr, w] of Object.entries(bisQuartale(text))) if (w[3] !== undefined) r[Number(jahr)] = w[3];
  return r;
}
