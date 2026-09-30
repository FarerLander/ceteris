import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  IMF,
  IMF_KONSENS,
  imfKonsens,
  LAENDER,
  parseImf,
  parseOecdCsv,
  parseWeltbank,
  WELTBANK, schneideProjektionen,
  BIS_BANKEN, bisJahresende, bisJahresmittel, WELTBANK_BANKEN,
  OECD_GINI_QUELLE, parseOecdGini,
} from "./parser";
import { schreibeSchaetzung } from "./schaetze";
import { ergaenzeBanken, ergaenzeKurzzins } from "./schaetzung/datei";
import type { AutoDatei, Reihe } from "./typen";

const ORDNER = join(dirname(fileURLToPath(import.meta.url)), "laender");

async function hole(url: string, text = false): Promise<unknown> {
  for (let versuch = 1; versuch <= 3; versuch++) {
    try {
      const antwort = await fetch(url, {
        signal: AbortSignal.timeout(60_000),
        headers: { "User-Agent": "Wirtschaftssimulator/1.0 (Datenabruf)", Accept: text ? "*/*" : "application/json" },
      });
      if (!antwort.ok) throw new Error(`HTTP ${antwort.status}`);
      return text ? await antwort.text() : await antwort.json();
    } catch (fehler) {
      if (versuch === 3) throw fehler;
      await new Promise((r) => setTimeout(r, 1000 * versuch));
    }
  }
  throw new Error("unerreichbar");
}

// IWF-Prognosen je Größe. Fehlt eine, fehlen nur ihre Punkte; das Skript bricht nicht ab.
async function holeKonsens(iso3: string, ab: number) {
  const roh: Partial<Record<keyof typeof IMF_KONSENS, Reihe>> = {};
  for (const [g, imfCode] of Object.entries(IMF_KONSENS) as [keyof typeof IMF_KONSENS, string][]) {
    try {
      roh[g] = parseImf(await hole(`https://www.imf.org/external/datamapper/api/v1/${imfCode}/${iso3}`), imfCode, iso3);
    } catch (fehler) {
      console.warn(`IMF-Konsens ${imfCode}: ${String(fehler)}`);
    }
  }
  return imfKonsens(roh, ab, new Date().toISOString().slice(0, 10));
}

// OECD-Finanzmarktreihe (IRLT Rendite 10 Jahre, IR3TIB Kurzfristzins). Der OECD-Server lehnt
// Node-Anfragen zeitweise mit HTTP 500 ab, curl klappt; daher Rückfall auf curl.
async function holeOecd(iso3: string, mass: string): Promise<Reihe> {
  const url = `https://sdmx.oecd.org/public/rest/data/OECD.SDD.STES,DSD_STES@DF_FINMARK,4.0/${iso3}.A.${mass}.PA.....?startPeriod=2000&format=csvfilewithlabels`;
  let csv: string;
  try {
    csv = (await hole(url, true)) as string;
  } catch (fehler) {
    console.warn(`OECD per Node fehlgeschlagen (${String(fehler)}), versuche curl`);
    csv = execFileSync("curl", ["-sS", "--fail", "--max-time", "60", url], { encoding: "utf-8" });
  }
  return parseOecdCsv(csv, { REF_AREA: iso3, FREQ: "A", MEASURE: mass });
}
const KURZZINS_QUELLE = "OECD Financial market statistics IR3TIB";

// Spec 13.6: Bank- und Hauspreisreihen (Weltbank, BIS, OECD). Fehlt eine, fehlt nur sie.
async function holeBanken(code: string, iso3: string): Promise<{ reihen: Record<string, Reihe>; quellen: Record<string, string> }> {
  const reihen: Record<string, Reihe> = {};
  const quellen: Record<string, string> = {};
  const merke = (schluessel: string, reihe: Reihe, quelle: string) => {
    if (Object.keys(reihe).length === 0) return console.warn(`${code}: ${schluessel} fehlt (${quelle})`);
    reihen[schluessel] = reihe;
    quellen[schluessel] = quelle;
  };
  for (const [schluessel, [indikator, zusatz]] of Object.entries(WELTBANK_BANKEN)) {
    try {
      const url = `https://api.worldbank.org/v2/country/${iso3}/indicator/${indikator}?format=json&date=1995:2030&per_page=200${zusatz}`;
      merke(schluessel, parseWeltbank(await hole(url)), `World Bank ${indikator}`);
    } catch (fehler) {
      console.warn(`World Bank ${indikator}: ${String(fehler)}`);
    }
  }
  for (const [schluessel, [statistik, muster, art]] of Object.entries(BIS_BANKEN)) {
    try {
      const csv = (await hole(`https://stats.bis.org/api/v1/data/${statistik}/${muster.replace("{c}", code)}?format=csv`, true)) as string;
      merke(schluessel, art === "mittel" ? bisJahresmittel(csv) : bisJahresende(csv), `BIS ${statistik} ${muster.replace("{c}", code)}`);
    } catch (fehler) {
      console.warn(`BIS ${statistik}: ${String(fehler)}`);
    }
  }
  // OECD: Preis-Einkommen-Verhältnis, ganze Reihe (nicht für China und Russland). baueLand misst das
  // Startjahr am Mittel bis dahin.
  const url = `https://sdmx.oecd.org/public/rest/data/OECD.ECO.MPD,DSD_AN_HOUSE_PRICES@DF_HOUSE_PRICES,1.0/${iso3}.A.HPI_YDH_AVG....?startPeriod=1960&format=csvfilewithlabels`;
  try {
    let csv: string;
    try {
      csv = (await hole(url, true)) as string;
    } catch {
      csv = execFileSync("curl", ["-sS", "--fail", "--max-time", "60", url], { encoding: "utf-8" });
    }
    merke("hausEinkommen", parseOecdCsv(csv, { REF_AREA: iso3, FREQ: "A", MEASURE: "HPI_YDH_AVG" }), "OECD Analytical house prices indicators HPI_YDH_AVG");
  } catch (fehler) {
    console.warn(`OECD HPI_YDH_AVG: ${String(fehler)}`);
  }
  return { reihen, quellen };
}

// Spec 13.13: Gini aus der OECD Income Distribution Database. Für Länder ohne Werte (China, Russland)
// bleibt die Reihe leer; dann gilt die Weltbank. Der OECD-Server lehnt Node-Anfragen zeitweise mit
// HTTP 500 ab (siehe holeOecd), deshalb curl. Bei HTTP 429 wartet der Abruf und versucht es erneut.
async function holeGini(iso3: string): Promise<Reihe> {
  const url = `https://sdmx.oecd.org/public/rest/data/OECD.WISE.INE,DSD_WISE_IDD@DF_IDD/${iso3}.A.INC_DISP_GINI..._T.METH2012.D_CUR.?startPeriod=2000&format=csvfilewithlabels`;
  for (let versuch = 1; ; versuch++) {
    const aus = execFileSync("curl", ["-sS", "--max-time", "60", "-w", "\n%{http_code}", url], { encoding: "utf-8" });
    const ende = aus.lastIndexOf("\n");
    const status = Number(aus.slice(ende + 1));
    if (status === 404) return {}; // keine Werte für dieses Land
    if (status === 200) return parseOecdGini(aus.slice(0, ende), iso3);
    if (status !== 429 || versuch === 5) throw new Error(`OECD IDD: HTTP ${status}`);
    await new Promise((r) => setTimeout(r, 60_000));
  }
}

const letztesBipJahr = (datei: AutoDatei) => Math.max(...Object.keys(datei.reihen.bip ?? {}).map(Number));

async function main() {
  const code = (process.argv[2] ?? "DE").toUpperCase();
  const land = LAENDER[code];
  if (!land)
    throw new Error(
      `Unbekanntes Land: ${code}. Bekannt: ${Object.keys(LAENDER).join(", ")}`,
    );
  const pfad = join(ORDNER, `${code}.json`);
  // Nur die Prognosen erneuern; die Ist-Reihen bleiben byte-gleich (neue Daten gelten nie unbemerkt).
  if (process.argv.includes("--nur-konsens")) {
    const alt = JSON.parse(readFileSync(pfad, "utf-8")) as AutoDatei;
    const konsens = await holeKonsens(land.iso3, letztesBipJahr(alt));
    if (konsens) alt.konsens = konsens;
    else delete alt.konsens;
    writeFileSync(pfad, JSON.stringify(alt, null, 1) + "\n");
    console.log(`${pfad}: Konsens ${konsens ? Object.keys(konsens.werte).join(", ") : "fehlt"}`);
    return;
  }
  // Nur den Kurzfristzins ergänzen und schätzen (Spec 13.1); die übrigen Reihen bleiben byte-gleich.
  if (process.argv.includes("--nur-schaetzung")) {
    const alt = JSON.parse(readFileSync(pfad, "utf-8")) as AutoDatei;
    const kurz = await holeOecd(land.iso3, "IR3TIB");
    if (Object.keys(kurz).length) writeFileSync(pfad, JSON.stringify(ergaenzeKurzzins(alt, kurz, KURZZINS_QUELLE), null, 1) + "\n");
    else console.warn(`${code}: kein Kurzfristzins`);
    console.log(schreibeSchaetzung(code));
    return;
  }
  // Nur die Bank- und Hauspreisreihen ergänzen und schätzen (Spec 13.6); der Rest bleibt byte-gleich.
  if (process.argv.includes("--nur-banken")) {
    const alt = JSON.parse(readFileSync(pfad, "utf-8")) as AutoDatei;
    const b = await holeBanken(code, land.iso3);
    writeFileSync(pfad, JSON.stringify(ergaenzeBanken(alt, b.reihen, b.quellen), null, 1) + "\n");
    console.log(`${pfad}: ${Object.keys(b.reihen).join(", ") || "keine Bankreihen"}`);
    console.log(schreibeSchaetzung(code));
    return;
  }
  // Nur den OECD-Gini ergänzen (Spec 13.13); die übrigen Reihen bleiben byte-gleich.
  if (process.argv.includes("--nur-gini")) {
    const alt = JSON.parse(readFileSync(pfad, "utf-8")) as AutoDatei;
    const gini = await holeGini(land.iso3);
    const jahre = Object.keys(gini);
    if (jahre.length) writeFileSync(pfad, JSON.stringify(ergaenzeBanken(alt, { giniOecd: gini }, { giniOecd: OECD_GINI_QUELLE }), null, 1) + "\n");
    console.log(`${pfad}: OECD-Gini ${jahre.length ? `${jahre[0]}–${jahre[jahre.length - 1]}` : "fehlt, Weltbank gilt"}`);
    return;
  }
  const datei: AutoDatei = {
    code,
    iso3: land.iso3,
    abgerufen: new Date().toISOString(),
    reihen: {},
    quellen: {},
    fehlend: [],
  };
  const merke = (schluessel: string, reihe: Reihe, quelle: string) => {
    if (Object.keys(reihe).length === 0) return false;
    datei.reihen[schluessel] = reihe;
    datei.quellen[schluessel] = quelle;
    return true;
  };

  for (const [schluessel, kandidaten] of Object.entries(WELTBANK)) {
    let gefunden = false;
    for (const [indikator, faktor] of kandidaten) {
      const url = `https://api.worldbank.org/v2/country/${land.iso3}/indicator/${indikator}?format=json&date=1995:2030&per_page=200`;
      try {
        gefunden = merke(
          schluessel,
          parseWeltbank(await hole(url), faktor),
          `World Bank ${indikator}`,
        );
      } catch (fehler) {
        console.warn(`World Bank ${indikator}: ${String(fehler)}`);
      }
      if (gefunden) break;
    }
    if (!gefunden) datei.fehlend.push(schluessel);
  }

  for (const [schluessel, imfCode] of Object.entries(IMF)) {
    try {
      const json = await hole(
        `https://www.imf.org/external/datamapper/api/v1/${imfCode}/${land.iso3}`,
      );
      if (
        !merke(
          schluessel,
          parseImf(json, imfCode, land.iso3),
          `IMF DataMapper ${imfCode}`,
        )
      )
        datei.fehlend.push(schluessel);
    } catch (fehler) {
      console.warn(`IMF ${imfCode}: ${String(fehler)}`);
      datei.fehlend.push(schluessel);
    }
  }

  for (const [schluessel, mass, quelle] of [
    ["rendite", "IRLT", "OECD Financial market statistics IRLT"],
    ["kurzzins", "IR3TIB", KURZZINS_QUELLE],
  ] as const) {
    try {
      if (!merke(schluessel, await holeOecd(land.iso3, mass), quelle)) datei.fehlend.push(schluessel);
    } catch (fehler) {
      console.warn(`OECD ${mass}: ${String(fehler)}`);
      datei.fehlend.push(schluessel);
    }
  }

  try {
    if (!merke("giniOecd", await holeGini(land.iso3), OECD_GINI_QUELLE)) datei.fehlend.push("giniOecd");
  } catch (fehler) {
    console.warn(`OECD Gini: ${String(fehler)}`);
    datei.fehlend.push("giniOecd");
  }

  const banken = await holeBanken(code, land.iso3);
  Object.assign(datei.reihen, banken.reihen);
  Object.assign(datei.quellen, banken.quellen);

  const bipJahre = Object.keys(datei.reihen.bip ?? {}).map(Number);
  if (bipJahre.length) datei.reihen = schneideProjektionen(datei.reihen, Object.keys(IMF), Math.max(...bipJahre));
  if (bipJahre.length) {
    const konsens = await holeKonsens(land.iso3, Math.max(...bipJahre));
    if (konsens) datei.konsens = konsens;
  }
  mkdirSync(ORDNER, { recursive: true });
  writeFileSync(pfad, JSON.stringify(datei, null, 1) + "\n");
  console.log(
    `${pfad}: ${Object.keys(datei.reihen).length} Reihen, fehlend: ${datei.fehlend.join(", ") || "keine"}`,
  );
  console.log(schreibeSchaetzung(code));
}

main().catch((fehler) => {
  console.error(fehler);
  process.exit(1);
});
