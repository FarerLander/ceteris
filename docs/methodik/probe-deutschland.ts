// Spec 13.13 Task 10: Deutsche Probe. Trifft die Vorwahl an den deutschen Entscheidungspunkten seit 2000
// die Art der tatsächlichen Entscheidung?
// Aufruf: npx tsx docs/methodik/probe-deutschland.ts [druckSchwelle] [verspaetung] > docs/methodik/ergebnis-probe.txt
// Der Rückblick rechnet fest (die tatsächliche Politik steht als Pfad im Szenario). Die Probe läuft auf
// diesem festen Verlauf mit: Sie zählt die Auslöser wie der Jahreslauf und fragt an jedem Punkt die
// Vorwahl ab. Die Eingriffe selbst wirken nicht zurück. Wahljahre: die tatsächlichen (2005 vorgezogen),
// nicht der feste Takt der App (1998 + 4 n).
import { IST, RUECKBLICK } from "../../app/land";
import { druck, eng, istVorwahljahr, istWahljahr, schwach, vorwahl, type Lagebild } from "../../modell/eingriffe";
import { baueKontext } from "../../modell/kontext";
import { ereignisText, neuerStand, politikSchritt } from "../../modell/politik";
import { rechne } from "../../modell/rechne";
import { startzustand } from "../../modell/start";
import type { Landesdaten, Zustand } from "../../modell/typen";

export const WAHLEN = [1998, 2002, 2005, 2009, 2013, 2017, 2021, 2025, 2029];
// Land, dessen fester Takt im Jahr j die tatsächlichen Wahljahre trifft.
export function landIm(land: Landesdaten, j: number): Landesdaten {
  const i = WAHLEN.findIndex((w, n) => w <= j && j < WAHLEN[n + 1]);
  return { ...land, politik: { ...land.politik!, letzteWahl: WAHLEN[i], legislatur: WAHLEN[i + 1] - WAHLEN[i] } };
}

// Gemessenes Wachstum pro Kopf (Anteil) und gemessene Arbeitslosenquote eines Jahres.
function gemessen(z: Zustand): Partial<Zustand> {
  const w = IST.wachstumReal?.[z.jahr], b = IST.bev?.[z.jahr], bVor = IST.bev?.[z.jahr - 1], alq = IST.alq?.[z.jahr];
  return {
    ...(w !== undefined && b !== undefined && bVor !== undefined ? { wachstumProKopf: (1 + w / 100) / (b / bVor) - 1 } : {}),
    ...(alq !== undefined ? { alq } : {}),
  };
}

// Entscheidungspunkte auf dem festen Rückblick-Verlauf. standards: nachgestellte Wirkstärken.
// mitIst: Wachstum pro Kopf und Arbeitslosigkeit aus den gemessenen Reihen statt aus dem Modell-Lauf
// (strukturelle Arbeitslosigkeit, Haushalt und Lage bleiben die des Modells).
export function probe(standards: Record<string, number> = {}, mitIst = false) {
  const basis: Landesdaten = { ...RUECKBLICK.land, standards: { ...RUECKBLICK.land.standards, ...standards } };
  const sz = RUECKBLICK.sz;
  const verlauf = rechne(RUECKBLICK.land, sz).map((z) => (mitIst ? { ...z, ...gemessen(z) } : z));
  const { c } = startzustand(basis, sz);
  const stand = neuerStand();
  const zeilen: { jahr: number; schwach: boolean; eng: boolean; druckSchwaeche: number; druckEng: number; wahl: string; ereignisse: Zustand["politik"]; falls: string; sperrklinke: number }[] = [];
  for (let t = 1; t < verlauf.length; t++) {
    const j = verlauf[t].jahr;
    const land = landIm(basis, j);
    const k = baueKontext(land, sz, c, t);
    const alt = verlauf[t - 1];
    const neu: Zustand = { ...verlauf[t], politik: [] };
    politikSchritt(stand, verlauf.slice(0, t), neu, k, sz);
    // Sperrklinke nach einem Schock: bleibende Mehrausgaben ab diesem Jahr (kein eigenes Ereignis).
    const sperrklinke = stand.wirkungen.filter((w) => w.id === "staat.uebrige" && w.bis === undefined && w.ab === j).reduce((a, w) => a + w.delta, 0);
    const l: Lagebild = { jahr: j, alt, schwachJahre: stand.schwachJahre, k, sz };
    zeilen.push({
      jahr: j,
      schwach: schwach(alt, k),
      eng: eng(alt, k),
      druckSchwaeche: druck("schwaeche", l),
      druckEng: druck("eng", l),
      wahl: istWahljahr(land, j) ? "Wahl" : istVorwahljahr(land, j) ? "Vorwahl" : "",
      ereignisse: neu.politik,
      // Was die Regel wählte, wenn in diesem Jahr ein Schwäche-Punkt entstünde.
      falls: vorwahl("schwaeche", l, k.w),
      sperrklinke,
    });
  }
  return zeilen;
}

if (process.argv[1]?.endsWith("probe-deutschland.ts")) {
  const schwelle = process.argv[2] ? Number(process.argv[2]) : undefined;
  const spaet = process.argv[3] ? Number(process.argv[3]) : undefined;
  const standards = { ...(schwelle !== undefined ? { "politik.druckSchwelle": schwelle } : {}), ...(spaet !== undefined ? { "politik.verspaetung": spaet } : {}) };
  console.log(`Deutsche Probe, Rückblick 2000–2025 fest. Wirksamkeit ${RUECKBLICK.land.politik!.wirksamkeit}, druckSchwelle ${schwelle ?? "Standard"}, verspaetung ${spaet ?? "Standard"}`);
  for (const mitIst of [false, true]) {
    console.log(mitIst ? "\n\nB. Auslöser Schwäche aus den gemessenen Reihen (Wachstum pro Kopf, Arbeitslosigkeit)" : "\nA. Auslöser aus dem Modell-Lauf des Rückblicks");
    console.log("\nJahr  Wahl     schwach eng  Druck Schwäche  Druck eng  Regel, falls Punkt  Entscheidungspunkt");
    for (const z of probe(standards, mitIst))
      console.log(
        `${z.jahr}  ${z.wahl.padEnd(8)} ${(z.schwach ? "ja" : "–").padEnd(7)} ${(z.eng ? "ja" : "–").padEnd(4)} ${z.druckSchwaeche.toFixed(2).padStart(8)}       ${z.druckEng.toFixed(2).padStart(6)}     ${z.falls.padEnd(18)}  ${[...z.ereignisse.map((e) => `${e.ausloeser ?? e.art}→${e.motiv ?? ""} | ${ereignisText(e)}`), ...(z.sperrklinke > 0 ? [`Sperrklinke: ${z.sperrklinke.toFixed(2)} % BIP bleiben`] : [])].join("; ")}`,
      );
  }
}
