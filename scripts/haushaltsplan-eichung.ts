// M29: Haushaltsplan je Land eichen, bis der Gesamtsaldo des Basislaufs (Politik fest) dem IWF folgt.
// Aufruf: npx tsx scripts/haushaltsplan-eichung.ts   (schreibt daten/laender/XX-plan.json)
// Nach neuen Daten (npm run daten) erneut laufen lassen; der Test haushaltsplan-eichung meldet das.
// Der Impuls (Wirkung auf die Nachfrage) ist der Plan ohne den Ausgleich dessen, was das Modell seit dem Start
// bei Renten (nach Beitragsautomatik) und Zinsen mehr ausgibt: Beides zählt im Fiskalimpuls nicht (Prüfung, Befund 1).
import { writeFileSync } from "fs";
import { LAENDER } from "../app/land";
import { modellWert } from "../modell/konsens";
import { basisSzenario, rechne } from "../modell/rechne";

const RUNDEN = 20;
for (const [code, land0] of Object.entries(LAENDER)) {
  const q = land0.konsens?.quellen.find((x) => x.kurz === "IWF");
  const ziel = q?.werte.defizit;
  if (!q || !ziel) {
    console.log(`${code}: kein IWF-Saldo, kein Plan`);
    continue;
  }
  const jahre = Object.keys(ziel).map(Number).filter((j) => j > land0.datenstand);
  const werte: Record<number, number> = Object.fromEntries(jahre.map((j) => [j, 0]));
  const impuls: Record<number, number> = Object.fromEntries(jahre.map((j) => [j, 0]));
  const lauf = () => {
    const land = { ...land0, plan: { datenstand: land0.datenstand, quelle: "", stand: "", werte, impuls } };
    return rechne(land, { ...basisSzenario(land), grund: { ...land.grund, politik: "fest", haushaltsplan: "an" } });
  };
  const abstand = (r: ReturnType<typeof lauf>, j: number) => ziel[j] - modellWert(r[j - land0.datenstand], "defizit");
  const drift = (r: ReturnType<typeof lauf>, j: number) => {
    const a = r[0], z = r[j - land0.datenstand];
    const beitrag = (z.beitragsAufschlag - a.beitragsAufschlag) * land0.start.steuerBasen.sozialabgaben;
    return z.rentenausgaben - a.rentenausgaben - beitrag + z.zinsausgaben - a.zinsausgaben;
  };
  let r = lauf();
  let fehler = Infinity;
  for (let i = 0; i < RUNDEN && fehler > 0.01; i++) {
    for (const j of jahre) {
      werte[j] += abstand(r, j);
      impuls[j] = werte[j] - drift(r, j);
    }
    r = lauf();
    fehler = Math.max(...jahre.map((j) => Math.abs(abstand(r, j))));
  }
  const runde = (x: Record<number, number>) => Object.fromEntries(jahre.map((j) => [j, Math.round(x[j] * 1000) / 1000]));
  const gerundet = runde(werte);
  const datei = { datenstand: land0.datenstand, quelle: `${q.name}, Finanzierungssaldo (geeicht)`, stand: q.stand, werte: gerundet, impuls: runde(impuls) };
  writeFileSync(`daten/laender/${code}-plan.json`, JSON.stringify(datei, null, 1) + "\n");
  console.log(`${code}: größte Abweichung ${fehler.toFixed(3)} Pp., Plan ${JSON.stringify(gerundet)}, Impuls ${JSON.stringify(runde(impuls))}`);
}
