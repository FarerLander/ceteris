// Spec 13.13 Task 2, Hilfsskript: Rückblick Deutschland als JSON (Modell-Gini, Arbeitslosigkeit, Hebel je Jahr).
// Aufruf: npx tsx docs/methodik/gini-rueckblick.ts   (wird von pruefung-gini.py gelesen)
import { IST, RUECKBLICK } from "../../app/land";
import { pfadWert } from "../../modell/pfad";
import { rechne } from "../../modell/rechne";
import { VERZEICHNIS } from "../../modell/verzeichnis";

const { land, sz } = RUECKBLICK;
const HEBEL = ["steuer.einkommen", "steuer.mwst", "steuer.kapitalertrag", "steuer.vermoegen", "steuer.erbschaft", "staat.familie", "rente.niveau", "sozial.lohnersatz"];
// „Modell alt“: ohne die Treiber aus 13.13. Seit Task 3 stehen sie im Verzeichnis und werden hier
// abgeschaltet; das Python-Skript rechnet sie von Hand dazu.
const SIEBEN = ["staat.giniEinkommensteuer", "staat.giniKapital", "staat.giniMwst", "staat.giniTransfers", "staat.giniRente", "staat.armutTransfers", "staat.armutRente"];
const eingebaut = SIEBEN.filter((id) => VERZEICHNIS.some((e) => e.id === id));
const verlauf = rechne(land, { ...sz, aus: [...sz.aus, ...eingebaut] });
// „Modell neu“, sobald die Treiber eingebaut sind: der Lauf des Modells selbst (mit ausweichender Bemessungsgrundlage).
const mit = eingebaut.length ? rechne(land, sz) : null;
const wert = (id: string, jahr: number) => (sz.stell[id] === undefined ? land.standards[id] : pfadWert(sz.stell[id], jahr));
console.log(
  JSON.stringify({
    start: { gini: land.start.gini, armut: land.start.armut, alq: land.start.alq, steuerBasen: land.start.steuerBasen },
    basis: Object.fromEntries(HEBEL.map((id) => [id, land.standards[id]])),
    jahre: verlauf.map((z, i) => ({ jahr: z.jahr, gini: z.gini, giniNeu: mit ? mit[i].gini : null, armut: z.armut, alq: z.alq, hebel: Object.fromEntries(HEBEL.map((id) => [id, wert(id, z.jahr)])) })),
    istGini: IST.gini ?? null,
  }),
);
