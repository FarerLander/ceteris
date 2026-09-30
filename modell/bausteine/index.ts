import type { Baustein, BausteinId } from "../typen";
import { anleihen } from "./anleihen";
import { banken } from "./banken";
import { demografie } from "./demografie";
import { energie } from "./energie";
import { geld } from "./geld";
import { handel } from "./handel";
import { innovation } from "./innovation";
import { ordnung } from "./ordnung";
import { privatschuld } from "./privatschuld";
import { staat } from "./staat";
import { wachstum } from "./wachstum";

// Reihenfolge laut Spec Abschnitt 6; Banken (13.6) am Ende, mit den fertigen Werten des Jahres.
export const BAUSTEINE: Baustein[] = [
  demografie,
  ordnung,
  energie,
  innovation,
  wachstum,
  privatschuld,
  geld,
  staat,
  anleihen,
  handel,
  banken,
];

// Kennungen in derselben Reihenfolge, für Mitschrift und Wirkungsnetz.
export const BAUSTEIN_IDS: BausteinId[] = [
  "demografie",
  "ordnung",
  "energie",
  "innovation",
  "wachstum",
  "privatschuld",
  "geld",
  "staat",
  "anleihen",
  "handel",
  "banken",
];
