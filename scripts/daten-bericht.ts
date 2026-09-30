// 12b: Bericht für den Pull Request des Daten-Knopfs. Vergleicht die Länderdateien im Repo (HEAD) mit den
// frisch geholten. Aufruf: npx tsx scripts/daten-bericht.ts > bericht.md
// Setzt in GitHub Actions die Ausgabe aenderung=ja|nein; ohne Änderung kein Pull Request.
import { execFileSync } from "node:child_process";
import { appendFileSync, readFileSync } from "node:fs";
import { vergleicheLand } from "../daten/bericht";
import { LAENDER } from "../daten/parser";
import type { AutoDatei } from "../daten/typen";

const imRepo = (pfad: string): string | null => {
  try {
    return execFileSync("git", ["show", `HEAD:${pfad}`], {
      encoding: "utf-8",
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch {
    return null;
  }
};
const zahl = (x: number) =>
  x.toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const abschnitte: string[] = [];
for (const code of Object.keys(LAENDER)) {
  const pfad = `daten/laender/${code}.json`;
  const altText = imRepo(pfad);
  const neu = JSON.parse(readFileSync(pfad, "utf-8")) as AutoDatei;
  const zeilen = altText
    ? vergleicheLand(JSON.parse(altText) as AutoDatei, neu)
    : ["Land neu"];
  // Haushaltsplan (M29): Wert 2031 bzw. letztes Planjahr vorher und nachher.
  const planPfad = `daten/laender/${code}-plan.json`;
  const planAlt = imRepo(planPfad);
  const planNeu = readFileSync(planPfad, "utf-8");
  // Nur Werte zählen; das Abrufdatum im Kopf ändert sich bei jedem Lauf.
  const planWerte = (t: string) => {
    const x = JSON.parse(t);
    return JSON.stringify([x.datenstand, x.werte, x.impuls]);
  };
  if (planAlt && planWerte(planAlt) !== planWerte(planNeu)) {
    const a = JSON.parse(planAlt),
      n = JSON.parse(planNeu);
    const j = Math.max(...Object.keys(n.werte).map(Number));
    zeilen.push(
      `Haushaltsplan ${j} neu geeicht: ${zahl(a.werte[j] ?? 0)} → ${zahl(n.werte[j])} Pp. BIP (Impuls ${zahl(a.impuls?.[j] ?? 0)} → ${zahl(n.impuls[j])})`,
    );
    if (a.datenstand !== n.datenstand)
      zeilen.push(`Datenstand ${a.datenstand} → ${n.datenstand}`);
  }
  if (zeilen.length)
    abschnitte.push(`### ${code}\n\n${zeilen.map((z) => `- ${z}`).join("\n")}`);
}

const aenderung = abschnitte.length > 0;
console.log(
  aenderung
    ? `## Geänderte Daten\n\n${abschnitte.join("\n\n")}`
    : "Keine Änderungen an den Daten.",
);
if (process.env.GITHUB_OUTPUT)
  appendFileSync(
    process.env.GITHUB_OUTPUT,
    `aenderung=${aenderung ? "ja" : "nein"}\n`,
  );
