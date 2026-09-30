// Schreibt lagen-vorschau.html ins Temp-Verzeichnis: neun Lagen mit Symbol,
// Farbe und Bewegung, hell und dunkel nebeneinander. Aufruf: npm run vorschau
import { readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LAGE_SYMBOL } from "../app/lage-darstellung";
import { SYMBOLE } from "../app/symbol-daten";
import { LAGEN } from "../modell/lage";
import { LAGE_NAME } from "../modell/reihen";
import type { Lage } from "../modell/typen";

const ZIEL = join(tmpdir(), "lagen-vorschau.html");
const css = readFileSync("app/stil.css", "utf-8");
const block = (re: RegExp) => css.match(re)![1];
const hell = block(/^:root \{([^}]*)\}/m);
const dunkel = block(/:root\[data-theme="dark"\] \{([^}]*)\}/);
const farbe = (b: string, l: Lage) =>
  b.match(new RegExp(`--lage-${l}: (#[0-9a-f]{6});`))![1];

// Beispielband: jede Lage ein paar Jahre, wie ein Verlauf mit Schocks.
const band: Lage[] = [
  ...Array<Lage>(6).fill("wachstum"),
  ...Array<Lage>(3).fill("boom"),
  ...Array<Lage>(2).fill("stagflation"),
  ...Array<Lage>(2).fill("rezession"),
  ...Array<Lage>(3).fill("depression"),
  ...Array<Lage>(2).fill("deflation"),
  ...Array<Lage>(8).fill("stagnation"),
  ...Array<Lage>(10).fill("schuldenwachstum"),
  ...Array<Lage>(3).fill("krise"),
  ...Array<Lage>(12).fill("stagnation"),
];

const spalte = (titel: string, klasse: string, b: string) => `
  <section class="card spalte ${klasse}" ${klasse === "dunkel" ? 'data-theme="dark"' : ""}>
    <h2>${titel}</h2>
    <div class="kacheln">
      ${LAGEN.map(
        (l) => `
      <div class="kachel">
        <svg viewBox="0 0 100 100" aria-hidden="true" class="wetter wetter-${l}"><use href="#${LAGE_SYMBOL[l]}" /></svg>
        <b>${LAGE_NAME[l]}</b>
        <span class="feld" style="background: var(--lage-${l})"></span>
        <code>${farbe(b, l)}</code>
      </div>`,
      ).join("")}
    </div>
    <h3>Beispiel-Wetterband</h3>
    <div class="band vorschau-band">
      ${band.map((l) => `<span title="${LAGE_NAME[l]}" style="background: var(--lage-${l})"></span>`).join("")}
    </div>
    <div class="legend">
      ${LAGEN.map((l) => `<span><i style="background: var(--lage-${l})"></i>${LAGE_NAME[l]}</span>`).join("")}
    </div>
  </section>`;

const html = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Lagen-Vorschau</title>
<style>
${css}
.hell { ${hell} }
.dunkel { ${dunkel} }
.spalte { background: var(--paper); color: var(--ink); }
.vorschau-wrap { display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 16px; padding: 16px; max-width: 1200px; margin: 0 auto; }
.vorschau-kopf { max-width: 1200px; margin: 0 auto; padding: 16px 16px 0; }
.kacheln { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.kachel { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 10px 6px; border: 1px solid var(--line); border-radius: 14px; background: var(--paper-2); text-align: center; }
.kachel svg { width: 72px; height: 72px; }
.kachel b { font-size: 13px; line-height: 1.2; min-height: 2.4em; display: flex; align-items: center; }
.kachel .feld { width: 100%; height: 18px; border-radius: 6px; }
.kachel code { font-size: 12px; color: var(--muted); }
.vorschau-band { display: grid; grid-template-columns: repeat(${band.length}, 1fr); gap: 2px; height: 34px; }
.vorschau-band span { border-radius: 3px; }
</style>
</head>
<body>
${SYMBOLE}
<header class="vorschau-kopf">
  <h1>Neun Lagen: Symbole, Farben, Bewegung</h1>
  <p>Phase 3b. Die Symbole bewegen sich wie in der App; wer „Bewegung reduzieren“ eingestellt hat, sieht sie still. Jede Farbe hat gegen die Kartenfläche mindestens 3:1 Kontrast.</p>
</header>
<main class="vorschau-wrap">
${spalte("Hell", "hell", hell)}
${spalte("Dunkel", "dunkel", dunkel)}
</main>
</body>
</html>
`;
writeFileSync(ZIEL, html);
console.log(`${ZIEL} geschrieben`);
