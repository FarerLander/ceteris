import type { ReihenId } from "../../modell/reihen";
import type { Kapitel } from "./typen";

// Hilfe-Modus: Kapitel der geführten Tour. Texte auf Deutsch, übersetzt über t() (en.json).

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
      text: "Das Diagramm zeigt deine Linie, die Basislinie und ein Band aus vielen Zufallsläufen: So weit können unvorhergesehene Schocks den Verlauf verschieben. Die Punkte sind Prognosen des IWF.",
    },
    {
      id: "schock",
      ziel: "schocks",
      text: "Was passiert in einer Krise? Setz eine Finanzkrise im gewählten Jahr. Mit dem × in der Liste darunter nimmst du sie wieder heraus.",
      aufgabe: { art: "sim", erledigt: (a, b) => b.schocks > a.schocks },
      vormachen: (sim) => sim.schockHinzu("krise"),
    },
    {
      id: "warnlampen",
      ziel: "warnlampen",
      text: "Die Warnlampen melden, wenn etwas kippt: etwa wenn die Zinsen schneller wachsen als die Wirtschaft oder die Märkte an der Tragfähigkeit zweifeln.",
    },
    {
      id: "erzaehlung",
      ziel: "erzaehlung",
      text: "„Was passiert hier?“ erzählt den Verlauf in Worten, auch was die Regierung von selbst tut.",
    },
    {
      id: "wege",
      ziel: "wege",
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

export const KAPITEL: Kapitel[] = [erkundung];
