import { standardWert } from "../../modell/kontext";
import type { ReihenId } from "../../modell/reihen";
import type { Kapitel, TourUi } from "./typen";

// Hilfe-Modus: Kapitel der geführten Tour. Texte auf Deutsch, übersetzt über t() (en.json).

// Die Schritte der Erkundung liegen in der Übersicht; ein vorher gestartetes Kapitel kann einen anderen Reiter offen lassen.
const zurUebersicht = (ui: TourUi) => ui.setzeAnsicht("uebersicht");

const erkundung: Kapitel = {
  id: "erkundung",
  titel: "Erste Erkundung",
  schritte: [
    {
      id: "willkommen",
      ziel: null,
      text: "Willkommen bei Ceteris. Das Modell rechnet, wie sich ein Land in den nächsten Jahrzehnten entwickelt, wenn alles so weiterläuft, und was sich ändert, wenn du eingreifst. Ein Erkundungsmodell, keine Prognose.",
    },
    {
      id: "land",
      ziel: "land",
      seitenleiste: 0,
      text: "Hier wählst du das Land. Neun stehen zur Auswahl; die Tour läuft mit dem, das gerade eingestellt ist.",
    },
    {
      id: "jahr",
      ziel: "lage",
      vorbereiten: zurUebersicht,
      text: "Das Wetterband zeigt die Lage Jahr für Jahr: Wachstum, Stagnation, Krise. Tippe auf ein späteres Jahr, etwa 2050.",
      aufgabe: { art: "sim", erledigt: (a, b) => b.idx !== a.idx },
      vormachen: (sim) =>
        sim.setIdx(
          Math.min(sim.verlauf.length - 1, 2050 - sim.land.datenstand),
        ),
    },
    {
      id: "kennzahlen",
      ziel: "kennzahlen",
      vorbereiten: zurUebersicht,
      text: "Die Kennzahlen gelten für das gewählte Jahr, verglichen mit der Basislinie: heutige Politik, unverändert fortgeschrieben. Tippe eine Kachel an.",
      aufgabe: { art: "sim", erledigt: (a, b) => b.detail !== a.detail },
      vormachen: (sim) =>
        sim.setDetail(
          (sim.detail === "bipProKopf" ? "alq" : "bipProKopf") as ReihenId,
        ),
    },
    {
      id: "diagramm",
      ziel: "diagramm",
      vorbereiten: zurUebersicht,
      text: "Das Diagramm zeigt deine Linie, die Basislinie und ein Band aus vielen Zufallsläufen: So weit können unvorhergesehene Schocks den Verlauf verschieben. Die Punkte sind Prognosen des IWF.",
    },
    {
      id: "schock",
      ziel: "schocks",
      vorbereiten: zurUebersicht,
      text: "Was passiert in einer Krise? Setz eine Finanzkrise im gewählten Jahr. Mit dem × in der Liste darunter nimmst du sie wieder heraus.",
      aufgabe: { art: "sim", erledigt: (a, b) => b.schocks > a.schocks },
      vormachen: (sim) => sim.schockHinzu("krise"),
    },
    {
      id: "warnlampen",
      ziel: "warnlampen",
      vorbereiten: zurUebersicht,
      text: "Die Warnlampen melden, wenn etwas kippt: etwa wenn die Zinsen schneller wachsen als die Wirtschaft oder die Märkte an der Tragfähigkeit zweifeln.",
    },
    {
      id: "erzaehlung",
      ziel: "erzaehlung",
      vorbereiten: zurUebersicht,
      text: "„Was passiert hier?“ erzählt den Verlauf in Worten, auch was die Regierung von selbst tut.",
    },
    {
      id: "wege",
      ziel: "wege",
      vorbereiten: zurUebersicht,
      text: "Drei Politikpakete, die den Wohlstand am stärksten heben, jeweils mit ihrem Preis. Übernimm eines und schau, was sich ändert.",
      aufgabe: {
        art: "sim",
        erledigt: (a, b) => b.uebernommen > a.uebernommen,
      },
      vormachen: () => ({ klick: '[data-tour="wege"] article button' }),
    },
    {
      id: "ende",
      ziel: "anzeige",
      seitenleiste: 0,
      text: "Sprache und hell oder dunkel stellst du hier um. Über das „?“ oben rechts gibt es weitere Kapitel: Wirkungsnetz, Selbst einstellen, Vergleichen und prüfen.",
    },
  ],
};

const wirkungsnetz: Kapitel = {
  id: "wirkungsnetz",
  titel: "Wirkungsnetz: Warum passiert das?",
  schritte: [
    {
      id: "karte",
      ziel: "netz-karte",
      vorbereiten: (ui) => ui.setzeAnsicht("wirkungsnetz"),
      text: "Die Landkarte zeigt die zehn Bausteine des Modells in der Reihenfolge, in der es jedes Jahr rechnet: von der Bevölkerung über Wachstum und Staat bis zu Handel und Banken.",
    },
    {
      id: "weg",
      ziel: "netz-weg",
      vorbereiten: (ui) => ui.setzeAnsicht("wirkungsnetz"),
      text: "Wähle hier die Stellschraube „Rentenalter“. Dann leuchtet ihr Weg auf: was im ersten Jahr wirkt, was nach zwei bis drei und was nach vier bis zehn Jahren.",
      aufgabe: { art: "pruefe", erledigt: () => window.location.hash.includes(":rente.alter") },
      vormachen: (_sim, ui) => ui.setzeFokus("rente.alter"),
    },
    {
      id: "baustein",
      ziel: "netz-karte",
      vorbereiten: (ui) => ui.setzeAnsicht("wirkungsnetz"),
      text: "Tippe einen Baustein an. Du siehst, was er ausrechnet und von welchen Bausteinen er seine Eingänge bekommt.",
      aufgabe: { art: "klick", innerhalb: ".netz-baustein" },
      vormachen: () => ({ klick: '[data-baustein="staat"]' }),
    },
    {
      id: "regierung",
      ziel: "netz-regierung",
      vorbereiten: (ui) => ui.setzeAnsicht("wirkungsnetz"),
      text: "Nicht nur du drehst an den Stellschrauben. Steht die Politik auf „Reagiert“, greift auch die Regierung ein, mit typischen Schwächen: zu spät, verwässert, vor der Wahl gar nicht. Hier steht, wie sie im Modell entscheidet.",
    },
    {
      id: "regler",
      ziel: "hauptregler",
      seitenleiste: 1,
      text: "Jeder Regler in der Seitenleiste führt mit einem Klick hierher: So siehst du zu jeder Stellschraube, worüber sie wirkt.",
    },
  ],
};

const einstellen: Kapitel = {
  id: "einstellen",
  titel: "Selbst einstellen",
  schritte: [
    {
      id: "hauptregler",
      ziel: "hauptregler",
      seitenleiste: 1,
      vorbereiten: (ui) => ui.setzeAnsicht("uebersicht"),
      text: "Die Hauptregler sind die wichtigsten Stellschrauben. Erhöhe das Rentenalter um zwei Jahre und schau, wie sich die Kennzahlen ändern.",
      aufgabe: { art: "sim", erledigt: (a, b) => b.stell["rente.alter"] !== a.stell["rente.alter"] },
      vormachen: (sim) => sim.setzeStell("rente.alter", standardWert("rente.alter", sim.land) + 2),
    },
    {
      id: "alle",
      ziel: "alle",
      seitenleiste: 2,
      text: "Unter „Alle Stellschrauben“ liegen über hundert Regler, nach Bereichen sortiert: Steuern, Renten, Energie, Migration und mehr. Hier lohnt es sich, mitzudenken.",
    },
    {
      id: "grund",
      ziel: "grund",
      seitenleiste: 0,
      text: "Die Grundeinstellungen sind die großen Weichen: welche Währung das Land hat, wie die Renten finanziert werden und ob die Regierung auf Krisen von selbst reagiert.",
    },
    {
      id: "entscheidungen",
      ziel: "entscheidungen",
      vorbereiten: (ui) => ui.setzeAnsicht("uebersicht"),
      nurWenn: (sim) => sim.verlauf.some((z) => z.politik.length > 0),
      text: "Die Zeichen über dem Wetterband sind Entscheidungen der Regierung. Öffne eine: Du siehst, welche Möglichkeiten sie hatte, und kannst auf eine andere umschalten.",
      aufgabe: { art: "klick", innerhalb: "button" },
      vormachen: () => ({ klick: '[data-tour="entscheidungen"] button' }),
    },
    {
      id: "szenarien",
      ziel: "szenarien",
      seitenleiste: 3,
      text: "Ein Szenario kannst du unter einem Namen speichern oder als Link teilen: Wer den Link öffnet, sieht genau deinen Stand.",
    },
    {
      id: "zurueck",
      ziel: "zurueck",
      seitenleiste: 3,
      text: "„Zurück zur Basislinie“ nimmt alle Änderungen auf einmal zurück.",
    },
  ],
};

const pruefen: Kapitel = {
  id: "pruefen",
  titel: "Vergleichen und prüfen",
  schritte: [
    {
      id: "vergleich",
      ziel: "vergleich",
      vorbereiten: (ui) => ui.setzeAnsicht("vergleich"),
      text: "Im Vergleich steht dein Szenario neben der Basislinie oder einem gespeicherten Szenario, der Unterschied farbig.",
    },
    {
      id: "rueckblick",
      ziel: "rueckblick",
      vorbereiten: (ui) => ui.setzeAnsicht("rueckblick"),
      text: "Der Rückblick prüft das Modell an der Wirklichkeit: Wie gut hätte es die Jahre 2000 bis 2025 getroffen, wenn man es damals gestartet hätte?",
    },
    {
      id: "annahmen",
      ziel: "annahmen",
      vorbereiten: (ui) => ui.setzeAnsicht("annahmen"),
      text: "Unter Annahmen zeigt das Modell ehrlich seine Grenzen: oben wählst du Kritikpunkte, Wirkstärken oder Datenlage. Umstrittene Wirkstärken kannst du einzeln abschalten.",
    },
  ],
};

export const KAPITEL: Kapitel[] = [erkundung, wirkungsnetz, einstellen, pruefen];
