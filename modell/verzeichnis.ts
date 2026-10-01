import { t, tk } from "./sprache";
import type { BausteinId, Beleg } from "./typen";

export interface Eintrag {
  id: string;
  art: "stellschraube" | "wirkstaerke" | "schwelle" | "grundeinstellung" | "korrektur";
  baustein: BausteinId;
  name: string;
  einheit: string;
  standard: number;
  bereich?: [number, number];
  schritt?: number;
  quelle: string;
  beleg?: Beleg;
  umstritten?: boolean;
  neutral?: number;
  erklaerung: string;
  kanal?: string; // „wirkt über …“ für die Erzählung
  haupt?: boolean;
  optionen?: string[]; // Auswahl: Index = Wert
}

type Extra = Partial<
  Pick<Eintrag, "umstritten" | "neutral" | "kanal" | "haupt" | "optionen">
>;
const L: Eintrag[] = [];

function stell(
  id: string,
  baustein: BausteinId,
  name: string,
  einheit: string,
  standard: number,
  bereich: [number, number],
  schritt: number,
  quelle: string,
  erklaerung: string,
  kanal: string,
  extra: Extra = {},
) {
  L.push({
    id,
    art: "stellschraube",
    baustein,
    name,
    einheit,
    standard,
    bereich,
    schritt,
    quelle,
    erklaerung,
    kanal,
    ...extra,
  });
}
function wirk(
  id: string,
  baustein: BausteinId,
  name: string,
  einheit: string,
  standard: number,
  quelle: string,
  beleg: Beleg,
  erklaerung: string,
  extra: Extra = {},
) {
  L.push({
    id,
    art: "wirkstaerke",
    baustein,
    name,
    einheit,
    standard,
    quelle,
    beleg,
    erklaerung,
    ...extra,
  });
}
function schwelle(
  id: string,
  baustein: BausteinId,
  name: string,
  einheit: string,
  standard: number,
  quelle: string,
  erklaerung: string,
) {
  L.push({
    id,
    art: "schwelle",
    baustein,
    name,
    einheit,
    standard,
    quelle,
    beleg: "lehrbuch",
    erklaerung,
  });
}
function grund(
  id: string,
  name: string,
  optionen: string[],
  erklaerung: string,
) {
  L.push({
    id,
    art: "grundeinstellung",
    baustein: "geld",
    name,
    einheit: "",
    standard: 0,
    quelle: "Spec Abschnitt 7",
    erklaerung,
    optionen,
  });
}
const U = (neutral: number): Extra => ({ umstritten: true, neutral });

// ---------- Grundeinstellungen ----------
grund(
  "grund.regime",
  "Währung",
  [
    "Weltwährung",
    "Eigene Währung",
    "Gemeinsame Währung",
    "Harte Währung",
    "Gelenkte Währung",
  ],
  "Legt fest, wie Zins, Risikoaufschlag und Wechselkurs reagieren.",
);
grund(
  "grund.rentensystem",
  "Rentensystem",
  ["Umlage", "Mischung", "Kapitaldeckung"],
  "Umlage zahlt Renten aus laufenden Beiträgen, Kapitaldeckung aus einem angesparten Fonds.",
);
grund(
  "grund.tpi",
  "EZB-Schutzprogramm (TPI)",
  ["aus", "an"],
  "Die EZB deckelt den Risikoaufschlag. Nur bei gemeinsamer Währung wirksam.",
);

L.push({ id: "grund.politik", art: "grundeinstellung", baustein: "staat", name: "Politik", einheit: "", standard: 0,
  quelle: "Spec 13.10, 13.13", optionen: ["Fest", "Reagiert"],
  erklaerung: "Fest: Die Stellschrauben bleiben, wie eingestellt. Reagiert: Bei langer Schwäche und engem Haushalt entscheidet die Regierung. Sie wählt nicht die beste Lösung, sondern zwischen drei Möglichkeiten; du kannst an jedem Punkt umschalten." });
L.push({ id: "grund.haushaltsplan", art: "grundeinstellung", baustein: "staat", name: "Haushaltspläne bis 2031", einheit: "", standard: 0,
  quelle: "IWF World Economic Outlook, Finanzierungssaldo 2026–2031 (geeicht); Kritikpunkt M29", optionen: ["Ohne", "Einhalten"],
  erklaerung: "Einhalten: Bis 2031 folgt der Haushalt den Plänen, die der IWF in seine Prognose einrechnet; danach bleiben die Maßnahmen bestehen. Ohne: keine Pläne; Renten und Zinsen entwickeln sich, wie das Modell sie rechnet." });

// ---------- Demografie und Migration ----------
stell(
  "demo.geburtenrate",
  "demografie",
  "Geburtenrate",
  "Kinder je Frau",
  1.35,
  [1.0, 2.2],
  0.05,
  "Destatis",
  "Durchschnittliche Kinderzahl je Frau.",
  "mehr Erwerbstätige ab etwa 20 Jahren später",
);
stell(
  "demo.lebenserwartungTrend",
  "demografie",
  "Anstieg der Lebenserwartung",
  "Jahre pro Jahr",
  0.15,
  [0, 0.3],
  0.01,
  "Destatis, 15. koordinierte Bevölkerungsvorausberechnung",
  "Wie schnell die Lebenserwartung bei Geburt steigt.",
  "mehr Rentenjahre",
);
stell(
  "mig.netto",
  "demografie",
  "Nettozuwanderung",
  "Tsd. pro Jahr",
  300,
  [0, 3000],
  10,
  "Destatis Wanderungsstatistik",
  "Zuzüge minus Fortzüge pro Jahr.",
  "zusätzliche Erwerbstätige, abhängig von Qualifikation und Integrationstempo",
  { haupt: true },
);
stell(
  "mig.alterAnkunft",
  "demografie",
  "Durchschnittsalter bei Ankunft",
  "Jahre",
  28,
  [18, 50],
  1,
  "Destatis",
  "Je jünger bei Ankunft, desto länger zahlen Zugewanderte ein.",
  "die Zahl der Jahre im Erwerbsleben",
);
stell(
  "mig.anteilHoch",
  "demografie",
  "Anteil hoch Qualifizierter",
  "Anteil",
  0.3,
  [0, 1],
  0.05,
  "OECD International Migration Outlook",
  "Anteil der Zugewanderten mit Hochschulabschluss.",
  "die Beschäftigungsquote der Zugewanderten",
);
stell(
  "mig.anteilMittel",
  "demografie",
  "Anteil mittel Qualifizierter",
  "Anteil",
  0.4,
  [0, 1],
  0.05,
  "OECD International Migration Outlook",
  "Anteil mit Berufsausbildung. Der Rest gilt als niedrig qualifiziert.",
  "die Beschäftigungsquote der Zugewanderten",
);
stell(
  "mig.anteilArbeit",
  "demografie",
  "Zuwanderungsweg Arbeit",
  "Anteil",
  0.25,
  [0, 1],
  0.05,
  "BAMF Migrationsbericht",
  "Kommen mit Arbeitsvertrag, sofortiger Arbeitsmarktzugang.",
  "die Wartezeit bis zum Arbeitsmarkt",
);
stell(
  "mig.anteilStudium",
  "demografie",
  "Zuwanderungsweg Studium",
  "Anteil",
  0.1,
  [0, 1],
  0.05,
  "BAMF Migrationsbericht",
  "Kommen zum Studium.",
  "die Wartezeit bis zum Arbeitsmarkt",
);
stell(
  "mig.anteilFamilie",
  "demografie",
  "Zuwanderungsweg Familie",
  "Anteil",
  0.3,
  [0, 1],
  0.05,
  "BAMF Migrationsbericht",
  "Familiennachzug. Der Rest gilt als Asyl.",
  "die Wartezeit bis zum Arbeitsmarkt",
);
stell(
  "mig.halbwert",
  "demografie",
  "Integrationstempo (Halbwertszeit)",
  "Jahre",
  5,
  [1, 12],
  0.5,
  "OECD/EU Indicators of Immigrant Integration",
  "Jahre, bis die Hälfte des Abstands zur Beschäftigungsquote aufgeholt ist.",
  "die Zeit, bis Zugewanderte so oft arbeiten wie das Ziel erlaubt",
);
stell(
  "mig.integrationspolitik",
  "demografie",
  "Integrationspolitik",
  "0–1",
  0.5,
  [0, 1],
  0.1,
  "Spec 6.1",
  "Sprachkurse, Berufsanerkennung, Arbeitsverbote. 1 = sehr aktiv.",
  "ein schnelleres Integrationstempo",
);
stell(
  "mig.abwanderungQual",
  "demografie",
  "Abwanderung Qualifizierter",
  "Tsd. pro Jahr",
  0,
  [0, 300],
  10,
  "Spec 6.1",
  "Zusätzlich zur üblichen Auswanderung, die schon in der Nettozuwanderung steckt. Gehen meist mit 25 bis 40 und fehlen mit der Beschäftigungsquote hoch Qualifizierter.",
  "weniger Erwerbstätige im besten Alter",
);
// Nur für den Rückblick: statistische Bereinigung der Bevölkerung (Zensus 2011), in keiner Oberfläche.
L.push({
  id: "demo.zensusKorrektur",
  art: "korrektur",
  baustein: "demografie",
  name: "Zensus-Korrektur",
  einheit: "Tsd.",
  standard: 0,
  quelle: "Destatis, Zensus 2011",
  erklaerung: "Gleichmäßige Bereinigung der 18- bis 65-Jährigen, keine Abwanderung.",
});
wirk(
  "demo.gompertzB",
  "demografie",
  "Anstieg der Sterblichkeit mit dem Alter",
  "pro Jahr",
  0.095,
  "Gompertz-Gesetz; an den Rückblick DE kalibriert (Spanne 0,08–0,11)",
  "kalibriert",
  "Sterblichkeit wächst pro Lebensjahr um etwa 8,5 %.",
);
wirk(
  "mig.quoteHoch",
  "demografie",
  "Ziel-Beschäftigungsquote hoch Qualifizierter",
  "Anteil",
  0.82,
  "OECD International Migration Outlook 2023",
  "studie",
  "",
);
wirk(
  "mig.quoteMittel",
  "demografie",
  "Ziel-Beschäftigungsquote mittel Qualifizierter",
  "Anteil",
  0.7,
  "OECD International Migration Outlook 2023",
  "studie",
  "",
);
wirk(
  "mig.quoteNiedrig",
  "demografie",
  "Ziel-Beschäftigungsquote niedrig Qualifizierter",
  "Anteil",
  0.55,
  "OECD International Migration Outlook 2023",
  "studie",
  "",
);
wirk(
  "mig.warteArbeit",
  "demografie",
  "Wartezeit Arbeit",
  "Jahre",
  0,
  "BAMF Migrationsbericht",
  "studie",
  "",
);
wirk(
  "mig.warteStudium",
  "demografie",
  "Wartezeit Studium",
  "Jahre",
  2,
  "BAMF Migrationsbericht",
  "studie",
  "",
);
wirk(
  "mig.warteFamilie",
  "demografie",
  "Wartezeit Familie",
  "Jahre",
  1,
  "BAMF Migrationsbericht",
  "studie",
  "",
);
wirk(
  "mig.warteAsyl",
  "demografie",
  "Wartezeit Asyl",
  "Jahre",
  2,
  "BAMF, IAB-BAMF-SOEP-Befragung",
  "studie",
  "",
);
wirk(
  "mig.kostenArbeit",
  "demografie",
  "Integrationskosten Arbeit",
  "Tsd. € pro Kopf und Jahr",
  1,
  "Sachverständigenrat Migration",
  "studie",
  "",
);
wirk(
  "mig.kostenStudium",
  "demografie",
  "Integrationskosten Studium",
  "Tsd. € pro Kopf und Jahr",
  2,
  "Sachverständigenrat Migration",
  "studie",
  "",
);
wirk(
  "mig.kostenFamilie",
  "demografie",
  "Integrationskosten Familie",
  "Tsd. € pro Kopf und Jahr",
  6,
  "Sachverständigenrat Migration",
  "studie",
  "",
);
wirk(
  "mig.kostenAsyl",
  "demografie",
  "Integrationskosten Asyl",
  "Tsd. € pro Kopf und Jahr",
  12,
  "Bonin (ZEW); Bundeshaushalt Flüchtlingskosten",
  "studie",
  "",
);
wirk(
  "mig.sozialAnreiz",
  "demografie",
  "Sozialleistungen als Zuwanderungsanreiz",
  "Elastizität",
  0.5,
  "Borjas 1999 (Welfare Magnets)",
  "studie",
  "Höhere Lohnersatzquote zieht mehr Zuwanderung an.",
  U(0),
);
wirk("mig.fluchtAnteilHoch", "demografie", "Anteil hoch Qualifizierter unter Geflüchteten", "Anteil", 0.15, "IAB-BAMF-SOEP-Befragung", "studie", "");
wirk("mig.fluchtAnteilMittel", "demografie", "Anteil mittel Qualifizierter unter Geflüchteten", "Anteil", 0.35, "IAB-BAMF-SOEP-Befragung", "studie", "");

// ---------- Energie ----------
stell(
  "energie.ausbauTempo",
  "energie",
  "Ausbautempo Erneuerbare",
  "Pp. pro Jahr",
  2.0,
  [0, 6],
  0.1,
  "Fraunhofer ISE Energy-Charts",
  "Um wie viele Prozentpunkte der Erneuerbaren-Anteil am Strom pro Jahr steigt.",
  "Energiepreis und Importabhängigkeit auf lange Sicht",
);
stell(
  "energie.kohleausstieg",
  "energie",
  "Kohleausstieg",
  "Jahr",
  2038,
  [2025, 2060],
  1,
  "Kohleverstromungsbeendigungsgesetz",
  "Jahr, ab dem kein Kohlestrom mehr erzeugt wird.",
  "Strommix, CO₂-Ausstoß und Energiepreis",
);
stell(
  "energie.atom",
  "energie",
  "Atomkraft",
  "",
  0,
  [0, 2],
  1,
  "Atomgesetz",
  "Ausstieg, Laufzeitverlängerung oder Neubau (10–15 Jahre Vorlauf).",
  "Strommix und steuerbare Leistung",
  { optionen: ["Ausstieg", "Laufzeit verlängern", "Neubau"] },
);
stell(
  "energie.co2Preis",
  "energie",
  "CO₂-Preis",
  "€/t",
  70,
  [0, 300],
  5,
  "EU-ETS 2025",
  "Preis pro Tonne CO₂.",
  "den Energiepreis und damit Industrie und Inflation",
  { haupt: true },
);
stell(
  "energie.co2Verwendung",
  "energie",
  "Verwendung der CO₂-Einnahmen",
  "",
  0,
  [0, 2],
  1,
  "Spec 6.2",
  "Wohin die Einnahmen aus dem CO₂-Preis fließen.",
  "Haushalt oder Industriepreis",
  {
    optionen: [
      "Staatshaushalt",
      "Rückzahlung an Bürger",
      "Industrieentlastung",
    ],
  },
);
stell(
  "energie.industrieSubvention",
  "energie",
  "Industriestrom-Zuschuss",
  "€/MWh",
  0,
  [0, 80],
  5,
  "Spec 6.2",
  "Staatlicher Zuschuss je Megawattstunde Industriestrom.",
  "einen niedrigeren Industriepreis auf Kosten des Haushalts",
);
stell(
  "energie.netzInvest",
  "energie",
  "Netz- und Speicher-Investitionen",
  "% BIP",
  0.5,
  [0, 2],
  0.1,
  "Bundesnetzagentur Netzentwicklungsplan",
  "Investitionen in Netze und Speicher.",
  "niedrigere Integrationskosten der Erneuerbaren",
);
stell(
  "energie.diversifizierung",
  "energie",
  "Diversifizierung der Energieimporte",
  "0–1",
  0.6,
  [0, 1],
  0.1,
  "Spec 6.2",
  "Viele Lieferländer und LNG statt einer Pipeline. 1 = breit gestreut.",
  "die Wucht von Lieferschocks",
);
wirk(
  "energie.kostenErn",
  "energie",
  "Stromkosten Erneuerbare",
  "€/MWh",
  50,
  "IEA/NEA Projected Costs of Generating Electricity 2020",
  "studie",
  "",
);
wirk(
  "energie.integrationskosten",
  "energie",
  "Integrationskosten bei 100 % Erneuerbaren",
  "€/MWh",
  60,
  "Agora Energiewende; IEA",
  "studie",
  "Speicher und Reserve werden mit steigendem Anteil teurer.",
  U(0),
);
wirk(
  "energie.kostenAtomAlt",
  "energie",
  "Stromkosten bestehende Atomkraftwerke",
  "€/MWh",
  35,
  "IEA/NEA 2020",
  "studie",
  "",
);
wirk(
  "energie.kostenAtomNeu",
  "energie",
  "Stromkosten neue Atomkraftwerke",
  "€/MWh",
  95,
  "IEA/NEA 2020",
  "studie",
  "",
);
wirk(
  "energie.umbauKosten",
  "energie",
  "Investitionen je Pp. Ausbautempo",
  "% BIP",
  0.25,
  "Agora Energiewende Klimaneutrales Deutschland",
  "studie",
  "",
);
wirk(
  "energie.co2Vermeidung",
  "energie",
  "Emissionsrückgang außerhalb des Stroms je €/t",
  "Anteil pro Jahr",
  0.0003,
  "UBA Projektionsbericht",
  "studie",
  "",
  U(0),
);
wirk(
  "energie.stromAnteilCo2",
  "energie",
  "Anteil des Stroms am CO₂-Ausstoß",
  "Anteil",
  0.35,
  "Umweltbundesamt",
  "studie",
  "",
);
wirk(
  "energie.durchreichInflation",
  "energie",
  "Energiepreis → Inflation",
  "Pp. je Indexpunkt",
  0.04,
  "EZB Economic Bulletin 2/2023",
  "studie",
  "",
);

// ---------- Innovation ----------
stell(
  "innov.fue",
  "innovation",
  "Forschung und Entwicklung",
  "% BIP",
  3.1,
  [1, 6],
  0.1,
  "Stifterverband / Destatis",
  "Ausgaben für F&E von Staat und Wirtschaft. Ein Drittel trägt der Staat.",
  "höheres Produktivitätswachstum, mit einigen Jahren Verzug",
  { haupt: true },
);
stell(
  "innov.bildung",
  "innovation",
  "Bildungsausgaben",
  "% BIP",
  4.5,
  [3, 8],
  0.1,
  "Destatis Bildungsfinanzbericht",
  "Öffentliche Bildungsausgaben.",
  "mehr Humankapital nach etwa zehn Jahren",
);
stell(
  "innov.exitSteuer",
  "innovation",
  "Steuer auf Firmenverkäufe und Mitarbeiterbeteiligungen",
  "Anteil",
  0.26,
  [0, 0.5],
  0.01,
  "EStG",
  "Steuersatz auf Gewinne beim Verkauf von Start-ups.",
  "mehr oder weniger Wagniskapital",
);
stell(
  "innov.huerden",
  "innovation",
  "Gründungs- und Insolvenzhürden",
  "0–1",
  0.5,
  [0, 1],
  0.1,
  "Weltbank B-READY",
  "Bürokratie bei Gründung und Scheitern. 1 = sehr hoch.",
  "die Zahl neuer Firmen",
);
stell(
  "innov.pensionsfondsVC",
  "innovation",
  "Pensionsfonds dürfen in Wagniskapital",
  "",
  0,
  [0, 1],
  1,
  "Spec 6.3",
  "Ob kapitalgedeckte Rentenfonds einen kleinen Teil in Start-ups anlegen dürfen.",
  "mehr Wagniskapital aus Rentenfonds",
  { optionen: ["Nein", "Ja"] },
);
wirk(
  "innov.fueRendite",
  "innovation",
  "Soziale Rendite von F&E",
  "Anteil",
  0.2,
  "Jones/Williams 1998",
  "studie",
  "Ein Prozentpunkt mehr F&E hebt das Produktivitätswachstum um 0,2 Pp.",
  U(0),
);
wirk(
  "innov.vcFaktor",
  "innovation",
  "Wirksamkeit Wagniskapital gegenüber F&E",
  "Faktor",
  3.5,
  "Kortum/Lerner 2000",
  "studie",
  "",
  U(0),
);
wirk(
  "innov.vcExitElastizitaet",
  "innovation",
  "Wagniskapital je Pp. Exit-Steuer",
  "Anteil je Anteil",
  2,
  "Gompers/Lerner 1998",
  "studie",
  "",
  U(0),
);
wirk(
  "innov.fondsVC",
  "innovation",
  "Anteil der Rentenfonds in Wagniskapital",
  "Anteil",
  0.003,
  "OECD Pension Markets in Focus",
  "studie",
  "",
);
wirk(
  "innov.huerdenWirkung",
  "innovation",
  "Wirkung der Gründungshürden",
  "Anteil",
  0.5,
  "Klapper/Laeven/Rajan 2006",
  "studie",
  "",
  U(0),
);
wirk(
  "innov.verzug",
  "innovation",
  "Verzug bis Innovation wirkt",
  "Jahre",
  7,
  "Kortum/Lerner 2000",
  "studie",
  "",
);

// ---------- Wachstum ----------
L.push({ id: "arbeit.nairu", art: "stellschraube", baustein: "wachstum", name: "Strukturelle Arbeitslosigkeit (NAIRU)", einheit: "%",
  standard: 3.5, bereich: [1, 15], schritt: 0.1, quelle: "EU-Kommission AMECO (NAWRU)",
  erklaerung: "Arbeitslosigkeit, die auch bei normaler Konjunktur bleibt. Arbeitsmarktreformen senken sie.",
  kanal: "dauerhaft mehr oder weniger Beschäftigte" });
L.push({ id: "arbeit.erwerbsquote", art: "stellschraube", baustein: "wachstum", name: "Erwerbsquote", einheit: "Anteil",
  standard: 0.78, bereich: [0.5, 0.95], schritt: 0.01, quelle: "Destatis Mikrozensus",
  erklaerung: "Anteil der Erwerbsfähigen, die arbeiten oder Arbeit suchen. Steigt mit Frauen- und Älterenbeschäftigung.",
  kanal: "mehr Erwerbspersonen" });
wirk("arbeit.anpassung", "wachstum", "Tempo, mit dem Arbeitsmarktreformen wirken", "Anteil pro Jahr", 0.3, "IAB-Evaluation der Hartz-Reformen; OECD Employment Outlook", "studie", "Anteil des Abstands zum neuen Ziel, der pro Jahr geschlossen wird.");
wirk(
  "wachstum.alpha",
  "wachstum",
  "Kapitalanteil (Cobb-Douglas)",
  "Anteil",
  0.35,
  "Solow",
  "lehrbuch",
  "",
);
wirk(
  "wachstum.abschreibung",
  "wachstum",
  "Abschreibungsrate",
  "Anteil pro Jahr",
  0.06,
  "Lehrbuch",
  "lehrbuch",
  "",
);
wirk(
  "wachstum.bildungsRendite",
  "wachstum",
  "Bildung → Humankapital",
  "Anteil je Pp.",
  0.15,
  "Hanushek/Woessmann 2015",
  "studie",
  "",
  U(0),
);
wirk(
  "wachstum.bildungsVerzug",
  "wachstum",
  "Verzug Bildung",
  "Jahre",
  10,
  "Hanushek/Woessmann 2015",
  "studie",
  "",
);
wirk(
  "wachstum.energieBremse",
  "wachstum",
  "Energiepreis bremst Produktivität",
  "Anteil je Indexpunkt",
  0.00005,
  "IMF WEO April 2023, Kap. 3",
  "studie",
  "",
  U(0),
);
wirk(
  "wachstum.konvergenz",
  "wachstum",
  "Aufholgeschwindigkeit",
  "Anteil pro Jahr",
  0.02,
  "Barro/Sala-i-Martin",
  "lehrbuch",
  "",
);
wirk(
  "wachstum.investElastizitaet",
  "wachstum",
  "Investitionen je Pp. Kapitalkosten",
  "Pp. BIP",
  0.15,
  "Eigene Schätzung auf der Macrohistory-Datenbank (Spec 13.5 Teil B): 0,04 bis 0,15 Pp. je Pp. realem Langfristzins; Chirinko/Fazzari/Meyer 1999 fanden eine kleine Nutzerkosten-Elastizität",
  "studie",
  "Bis Spec 13.5 Teil B stand hier 0,6. Damit rechnete das Modell im Rückblick Deutschland eine Investitionsquote von 28 bis 30 %, gemessen waren es 19 bis 23 %.",
  U(0),
);
wirk(
  "wachstum.investAnpassung",
  "wachstum",
  "Investitionen kehren zum Normalwert zurück",
  "Anteil pro Jahr",
  0.1,
  "Eigene Schätzung auf der Macrohistory-Datenbank: 18 Länder 1955–2019, Länder-Fixeffekte, 0,107 (Standardfehler 0,013); 1986–2019 0,099",
  "studie",
  "Die Investitionsquote nähert sich jedes Jahr um diesen Teil des Abstands der Quote, die den Kapitalstock im Verhältnis zum BIP hält (Abschreibung plus Trendwachstum mal Kapitalkoeffizient). Aus: Sie bleibt für immer bei der Quote des Startjahres.",
  U(0),
);
wirk(
  "wachstum.akzelerator",
  "wachstum",
  "Auslastung → Investitionen (Akzelerator)",
  "Pp. BIP je % Lücke",
  0.44,
  "Eigene Schätzung auf der Macrohistory-Datenbank (Spec 13.5 Teil B): 18 Länder 1955–2019, 0,44 mit der Lücke des Vorjahres (t 6,4); Gegenprobe auf den Daten der App in allen neun Ländern positiv",
  "studie",
  "Sind die Anlagen gut ausgelastet, investieren Firmen mehr; in der Rezession streichen sie Investitionen. Deshalb kostet eine Krise dauerhaft Wohlstand (Cerra/Saxena 2008).",
  U(0),
);
wirk(
  "wachstum.steuerkeilU",
  "wachstum",
  "Unternehmensteuer → Kapitalkosten",
  "Pp. je Anteil",
  10,
  "Hall/Jorgenson",
  "lehrbuch",
  "",
);
wirk(
  "wachstum.steuerkeilK",
  "wachstum",
  "Kapitalertragsteuer → Kapitalkosten",
  "Pp. je Anteil",
  3,
  "Hall/Jorgenson",
  "lehrbuch",
  "",
);
wirk(
  "wachstum.lohnersatzElastizitaet",
  "wachstum",
  "Lohnersatz senkt Erwerbsbeteiligung",
  "Anteil je Anteil",
  0.15,
  "OECD Employment Outlook",
  "studie",
  "",
  U(0),
);
wirk(
  "wachstum.lueckePersistenz",
  "wachstum",
  "Beharrung der Produktionslücke",
  "Anteil",
  0.5,
  "Lehrbuch",
  "lehrbuch",
  "",
);
wirk(
  "wachstum.multiplikator",
  "wachstum",
  "Fiskalmultiplikator",
  "Faktor",
  0.8,
  "Ramey 2019",
  "studie",
  "",
  U(0),
);
wirk(
  "wachstum.kreditImpuls",
  "wachstum",
  "Kreditimpuls → Nachfrage",
  "Faktor",
  0.4,
  "Biggs/Mayer/Pick 2009",
  "studie",
  "",
  U(0),
);
wirk(
  "wachstum.kreditAsymmetrie",
  "wachstum",
  "Kreditrückgang wirkt stärker als Kreditzuwachs",
  "Faktor",
  1.2,
  "Jordà/Schularick/Taylor 2013; eigene Schätzung auf der Macrohistory-Datenbank (Spec 13.5 Teil A): negativer Impuls rund 2,4-mal so stark wie positiver",
  "studie",
  "Ein negativer Kreditimpuls wirkt mit diesem Faktor, ein positiver mit 2 minus Faktor; der Mittelwert bleibt. 1 = symmetrisch. Gedämpft unter dem gemessenen 1,42, weil der Rückblick Deutschland sonst bei den Rentenausgaben schlechter wird.",
  U(1),
);
wirk(
  "wachstum.zinsWirkung",
  "wachstum",
  "Realzins → Nachfrage",
  "Faktor",
  0.3,
  "Lehrbuch IS-Kurve",
  "lehrbuch",
  "",
);
wirk(
  "wachstum.okun",
  "wachstum",
  "Okunsches Gesetz",
  "Pp. ALQ je % Lücke",
  0.5,
  "Okun 1962",
  "lehrbuch",
  "",
);

// ---------- Privatschuld ----------
wirk(
  "privat.zinsaufschlag",
  "privatschuld",
  "Kreditzins über Leitzins",
  "Pp.",
  2,
  "Bundesbank MFI-Zinsstatistik",
  "studie",
  "",
);
wirk("privat.zinsbindung", "privatschuld", "Durchschnittliche Zinsbindung privater Kredite", "Jahre", 5, "Bundesbank MFI-Zinsstatistik", "studie", "Zinsänderungen erreichen den Bestand nur nach und nach.");
wirk(
  "privat.tilgung",
  "privatschuld",
  "Tilgungsrate",
  "Anteil pro Jahr",
  0.08,
  "BIS Debt Service Ratios",
  "studie",
  "",
);
wirk(
  "privat.dsrReaktion",
  "privatschuld",
  "Kredit reagiert auf Schuldendienst",
  "Pp. je Pp.",
  0.5,
  "Drehmann/Juselius 2012",
  "studie",
  "",
  U(0),
);
wirk(
  "privat.zinsReaktion",
  "privatschuld",
  "Kredit reagiert auf Realzins",
  "Pp. je Pp.",
  0.8,
  "Drehmann/Juselius 2012",
  "studie",
  "",
  U(0),
);
wirk(
  "privat.entschuldung",
  "privatschuld",
  "Entschuldung über der Schwelle",
  "Pp. je Pp.",
  1.5,
  "Dalio 2018; BIS",
  "studie",
  "",
  U(0),
);

// ---------- Geld ----------
stell(
  "geld.inflationsziel",
  "geld",
  "Inflationsziel",
  "%",
  2,
  [0, 5],
  0.5,
  "EZB-Strategie 2021",
  "Ziel der Notenbank.",
  "Inflation und Zinsniveau",
);
stell(
  "geld.gewichtAuslastung",
  "geld",
  "Gewicht der Auslastung im Leitzins",
  "Faktor",
  0.5,
  [0, 1.5],
  0.1,
  "Taylor 1993",
  "Wie stark die Notenbank auf Konjunktur reagiert.",
  "die Reaktion des Leitzinses",
);
stell(
  "geld.qeTempo",
  "geld",
  "Anleihekäufe der Notenbank (QE/QT)",
  "% BIP pro Jahr",
  0,
  [-3, 5],
  0.5,
  "EZB",
  "Positive Werte: Notenbank kauft Staatsanleihen. Negative: sie baut ab.",
  "niedrigere Renditen durch Käufe",
);
wirk(
  "geld.anker",
  "geld",
  "Verankerung der Inflationserwartung",
  "Anteil",
  0.7,
  "Lehrbuch Neukeynesianisch",
  "lehrbuch",
  "",
);
wirk(
  "geld.phillips",
  "geld",
  "Phillips-Kurve",
  "Pp. je % Lücke",
  0.3,
  "Lehrbuch",
  "lehrbuch",
  "",
);
wirk(
  "geld.importDurchwirkung",
  "geld",
  "Abwertung → Inflation",
  "Pp. je %",
  0.15,
  "Campa/Goldberg 2005",
  "studie",
  "",
);
wirk(
  "geld.untergrenze",
  "geld",
  "Untergrenze des Leitzinses",
  "%",
  -0.5,
  "EZB 2019",
  "lehrbuch",
  "",
);

// ---------- Staat ----------
stell(
  "steuer.einkommen",
  "staat",
  "Einkommensteuer (Durchschnittssatz)",
  "Anteil",
  0.19,
  [0.05, 0.45],
  0.01,
  "BMF Steuerschätzung",
  "Durchschnittlicher Satz auf Arbeitseinkommen.",
  "Einnahmen und Arbeitsanreize",
);
stell(
  "steuer.sozialabgaben",
  "staat",
  "Sozialabgaben",
  "Anteil",
  0.4,
  [0.2, 0.55],
  0.01,
  "DRV/GKV Beitragssätze",
  "Summe der Beitragssätze.",
  "Einnahmen und Arbeitskosten",
);
stell(
  "steuer.mwst",
  "staat",
  "Mehrwertsteuer",
  "Anteil",
  0.19,
  [0.05, 0.3],
  0.01,
  "UStG",
  "Regelsatz.",
  "Einnahmen und Konsum",
);
stell(
  "steuer.unternehmen",
  "staat",
  "Unternehmensteuer",
  "Anteil",
  0.3,
  [0, 0.6],
  0.01,
  "BMF",
  "Körperschaft- plus Gewerbesteuer.",
  "Einnahmen, Gewinnverlagerung und Investitionen",
);
stell(
  "steuer.kapitalertrag",
  "staat",
  "Kapitalertragsteuer",
  "Anteil",
  0.26,
  [0, 0.9],
  0.01,
  "EStG",
  "Steuer auf Zinsen, Dividenden, Kursgewinne.",
  "Kapitalflucht und weniger Investitionen (Laffer-Effekt)",
  { haupt: true },
);
stell(
  "steuer.vermoegen",
  "staat",
  "Vermögensteuer",
  "Anteil",
  0,
  [0, 0.05],
  0.005,
  "Spec 6.7",
  "Jährlicher Satz auf Nettovermögen.",
  "Einnahmen und Kapitalflucht",
);
stell(
  "steuer.erbschaft",
  "staat",
  "Erbschaftsteuer (effektiv)",
  "Anteil",
  0.02,
  [0, 0.3],
  0.01,
  "Destatis Erbschaftsteuerstatistik",
  "Effektiver Satz auf alle Erbschaften.",
  "Einnahmen und Ausweichverhalten",
);
stell(
  "rente.alter",
  "staat",
  "Rentenalter",
  "Jahre",
  67,
  [60, 75],
  0.5,
  "SGB VI",
  "Gesetzliches Renteneintrittsalter.",
  "mehr Erwerbstätige und weniger Rentenjahre",
  { haupt: true },
);
stell(
  "rente.niveau",
  "staat",
  "Rentenniveau",
  "% Lohn",
  48,
  [35, 70],
  1,
  "DRV Rentenversicherungsbericht",
  "Rente eines Durchschnittsverdieners in % des Durchschnittslohns.",
  "die Rentenausgaben",
);
stell(
  "sozial.lohnersatz",
  "staat",
  "Lohnersatz bei Arbeitslosigkeit",
  "Anteil",
  0.6,
  [0.3, 0.9],
  0.05,
  "SGB III",
  "Arbeitslosengeld und Grundsicherung in % des früheren Lohns.",
  "Arbeitsanreize, Armut und Ausgaben",
);
stell(
  "staat.gesundheit",
  "staat",
  "Gesundheitsausgaben",
  "% BIP",
  8.0,
  [5, 14],
  0.1,
  "Destatis Gesundheitsausgabenrechnung",
  "Öffentliche Gesundheitsausgaben.",
  "höhere Staatsausgaben",
);
stell(
  "staat.familie",
  "staat",
  "Familienausgaben",
  "% BIP",
  2.2,
  [1, 5],
  0.1,
  "OECD Family Database",
  "Kindergeld, Elterngeld, Betreuung.",
  "höhere Staatsausgaben",
);
stell(
  "staat.verteidigung",
  "staat",
  "Verteidigungsausgaben",
  "% BIP",
  2.1,
  [0.5, 8],
  0.1,
  "NATO Defence Expenditure 2025",
  "NATO-Ziel: 2 %, neues Ziel: 3,5 %.",
  "höhere Staatsausgaben ohne direkten Wachstumsbeitrag",
);
stell(
  "staat.uebrige",
  "staat",
  "Übrige Staatsausgaben",
  "% BIP",
  19,
  [10, 30],
  0.5,
  "Kalibriert aus IMF-Gesamtausgaben",
  "Verwaltung, Innere Sicherheit und alles Weitere. Enthält die öffentlichen Investitionen in heutiger Höhe; ihre Änderung hat einen eigenen Regler.",
  "den Primärsaldo, kurzfristig auch die Nachfrage",
  { haupt: true },
);
stell(
  "staat.schuldenreaktion",
  "staat",
  "Schuldenbremse (Gegensteuern)",
  "Pp. je Pp. über 60 %",
  0.03,
  [0, 0.1],
  0.01,
  "Bohn 1998",
  "Wie stark die Politik bei hoher Schuld spart.",
  "die Gegensteuerung bei steigender Schuld",
);
for (const [x, eps, quelle] of [
  ["einkommen", 0.25, "Saez/Slemrod/Giertz 2012"],
  ["sozialabgaben", 0.15, "Saez/Slemrod/Giertz 2012"],
  ["mwst", 0.1, "OECD Consumption Tax Trends"],
  ["unternehmen", 0.5, "Devereux/Griffith 2003"],
  ["kapitalertrag", 1.5, "Agersnap/Zidar 2021"],
  ["vermoegen", 10, "Jakobsen et al. 2020"],
  ["erbschaft", 2, "Kopczuk 2013"],
] as const) {
  wirk(
    `steuer.eps.${x}`,
    "staat",
    `Ausweichreaktion ${x}`,
    "Elastizität",
    eps,
    quelle,
    "studie",
    "Wie stark die Bemessungsgrundlage auf den Satz reagiert (Laffer-Effekt).",
    U(0),
  );
}
wirk("staat.marktdisziplin", "staat", "Sparen unter Marktdruck", "Pp. Primärsaldo je Pp. Aufschlag", 1, "Mauro et al. 2015 (IMF), Fiscal Reaction Functions", "studie", "Steigende Risikoaufschläge zwingen Regierungen zum Sparen.", U(0));
L.push({ id: "staat.finanztransaktionen", art: "stellschraube", baustein: "staat", name: "Finanztransaktionen des Staates", einheit: "% BIP pro Jahr",
  standard: 0, bereich: [-10, 20], schritt: 0.5, quelle: "Destatis/Bundesbank Maastricht-Schuldenstand, Überleitung",
  erklaerung: "Bankenrettung, Kredite und Beteiligungen: erhöhen die Schuld, zählen aber nicht zum Defizit im engeren Sinn.",
  kanal: "eine höhere Schuld ohne direkte Nachfragewirkung" });
L.push({ id: "rente.beitragsAutomatik", art: "stellschraube", baustein: "staat", name: "Automatische Beitragsanpassung", einheit: "",
  standard: 1, bereich: [0, 1], schritt: 1, quelle: "SGB VI § 158 (Beitragssatz folgt dem Finanzbedarf)",
  erklaerung: "Heutige Rechtslage: Steigen die Rentenausgaben, steigt der Beitragssatz mit. Aus: Der Anstieg landet im Staatsdefizit.",
  kanal: "höhere Beiträge statt höherer Schulden, dafür teurere Arbeit", optionen: ["Aus", "An"] });
wirk("rente.beitragsDeckung", "staat", "Anteil des Rentenanstiegs, den Beiträge decken", "Anteil", 0.75, "Deutsche Rentenversicherung: Bundeszuschuss trägt rund ein Viertel", "studie", "");
wirk("wachstum.abgabenElastizitaet", "wachstum", "Abgaben senken Erwerbsbeteiligung", "Anteil je Anteil", 0.2, "OECD Taxing Wages; Meghir/Phillips 2010", "studie", "", U(0));
wirk(
  "rente.beitragsanteil",
  "staat",
  "Rentenanteil der Sozialabgaben",
  "Anteil",
  0.45,
  "Deutsche Rentenversicherung",
  "studie",
  "",
);
wirk(
  "rente.umstiegJahre",
  "staat",
  "Dauer des Umstiegs auf Kapitaldeckung",
  "Jahre",
  35,
  "Spec 6.7",
  "lehrbuch",
  "",
);
wirk(
  "rente.fondsRendite",
  "staat",
  "Reale Fondsrendite",
  "% pro Jahr",
  3.5,
  "OECD Pension Markets in Focus",
  "studie",
  "",
);
wirk(
  "rente.deckungJahre",
  "staat",
  "Voller Rentenfonds in Jahresrenten",
  "Jahre",
  20,
  "Eurostat, Zusatztabelle Rentenansprüche (erworbene Ansprüche rund das 20-Fache der jährlichen Renten)",
  "studie",
  "Wie groß ein voll kapitalgedeckter Fonds wäre. Ein vorhandener Reservefonds bringt den Umstieg um seinen Anteil daran voran.",
);
wirk(
  "staat.armutAlq",
  "staat",
  "Arbeitslosigkeit → Armut (grob)",
  "Pp. je Pp.",
  0.5,
  "Destatis Mikrozensus",
  "studie",
  "",
  U(0),
);
wirk(
  "staat.armutLohnersatz",
  "staat",
  "Lohnersatz → Armut (grob)",
  "Pp. je Anteil",
  8,
  "Destatis Mikrozensus",
  "studie",
  "",
  U(0),
);
wirk(
  "staat.giniAlq",
  "staat",
  "Arbeitslosigkeit → Gini (grob)",
  "Punkte je Pp.",
  0.3,
  "OECD Income Distribution Database",
  "studie",
  "",
  U(0),
);
wirk(
  "staat.giniLohnersatz",
  "staat",
  "Lohnersatz → Gini (grob)",
  "Punkte je Anteil",
  10,
  "OECD Income Distribution Database",
  "studie",
  "",
  U(0),
);
// Spec 13.13: Steuern, Transfers und Rentenniveau. Werte aus docs/methodik/pruefung-gini.md.
wirk(
  "staat.giniEinkommensteuer",
  "staat",
  "Einkommensteuer → Gini",
  "Punkte je % BIP",
  0.3,
  "OECD Income Distribution Database, Revenue Statistics, Social Expenditure; Panel 1990–2023 (docs/methodik/pruefung-gini.md)",
  "kalibriert",
  "Mehr Aufkommen aus der Einkommensteuer gleicht die verfügbaren Einkommen an. Panel: 0,3 bis 0,4.",
  U(0),
);
wirk(
  "staat.giniKapital",
  "staat",
  "Steuern auf Kapitalertrag, Vermögen, Erbschaft → Gini",
  "Punkte je % BIP",
  0.3,
  "OECD Income Distribution Database, Revenue Statistics, Social Expenditure; Panel 1990–2023 (docs/methodik/pruefung-gini.md); dünn belegt",
  "kalibriert",
  "Im Panel nicht getrennt messbar; gleicher Wert wie bei der Einkommensteuer. Die Erbschaftsteuer wirkt in Wirklichkeit erst langfristig.",
  U(0),
);
wirk(
  "staat.giniMwst",
  "staat",
  "Mehrwertsteuer → Gini (erhöht)",
  "Punkte je % BIP",
  0.1,
  "OECD/KIPF 2014 (ungeprüft); OECD Income Distribution Database, Revenue Statistics, Social Expenditure; Panel 1990–2023 (docs/methodik/pruefung-gini.md); dünn belegt",
  "kalibriert",
  "Die Mehrwertsteuer belastet niedrige Einkommen etwas stärker. Der gemessene Gini enthält Verbrauchsteuern nicht; der Wert ist eine Belastungsrechnung.",
  U(0),
);
wirk(
  "staat.giniTransfers",
  "staat",
  "Familienleistungen → Gini",
  "Punkte je % BIP",
  0.5,
  "OECD Income Distribution Database, Revenue Statistics, Social Expenditure; Panel 1990–2023 (docs/methodik/pruefung-gini.md); dünn belegt",
  "kalibriert",
  "Familienleistungen gehen überwiegend an untere und mittlere Einkommen. Panel: 0,5 bis 0,6, knapp unter der Schwelle für statistisch gesichert.",
  U(0),
);
wirk(
  "staat.giniRente",
  "staat",
  "Rentenniveau → Gini",
  "Punkte je Pp.",
  0.04,
  "OECD Income Distribution Database, Revenue Statistics, Social Expenditure; Panel 1990–2023 (docs/methodik/pruefung-gini.md); dünn belegt",
  "kalibriert",
  "Ein höheres Rentenniveau hebt die Einkommen der Älteren, die unter dem Durchschnitt liegen. Panel: 0,04, statistisch nicht gesichert.",
  U(0),
);
wirk(
  "staat.armutTransfers",
  "staat",
  "Familienleistungen → Armut",
  "Pp. je % BIP",
  0.6,
  "OECD Income Distribution Database, Revenue Statistics, Social Expenditure; Panel 1990–2023 (docs/methodik/pruefung-gini.md)",
  "kalibriert",
  "Panel: 0,6 bei der Armutsgrenze von 60 % des mittleren Einkommens.",
  U(0),
);
wirk(
  "staat.armutRente",
  "staat",
  "Rentenniveau → Armut",
  "Pp. je Pp.",
  0.05,
  "OECD Income Distribution Database, Revenue Statistics, Social Expenditure; Panel 1990–2023 (docs/methodik/pruefung-gini.md); dünn belegt",
  "kalibriert",
  "Bei den über 65-Jährigen senkt ein Punkt Rentenniveau die Armutsquote um rund 0,27 Punkte; auf alle umgerechnet 0,05. Für die ganze Bevölkerung zeigt das Panel den Effekt nicht.",
  U(0),
);

// ---------- Anleihen ----------
stell(
  "anleihen.laufzeit",
  "anleihen",
  "Durchschnittliche Laufzeit",
  "Jahre",
  7,
  [2, 15],
  0.5,
  "Finanzagentur",
  "Kurze Laufzeit: Zinsänderungen kommen schnell im Haushalt an.",
  "die Geschwindigkeit, mit der Zinsen im Haushalt ankommen",
);
stell(
  "anleihen.auslandsanteil",
  "anleihen",
  "Anteil in Auslandshand",
  "Anteil",
  0.48,
  [0, 0.9],
  0.02,
  "Bundesbank",
  "Anteil der Staatsanleihen bei ausländischen Anlegern.",
  "die Nervosität der Märkte",
);
stell(
  "anleihen.laufzeitpraemie",
  "anleihen",
  "Laufzeitprämie",
  "Pp.",
  0.5,
  [-1, 3],
  0.1,
  "Kalibriert aus Rendite im Startjahr",
  "Aufschlag für lange Laufzeit.",
  "das Renditeniveau",
);
wirk("anleihen.ausfallSchwelle", "anleihen", "Aufschlag, ab dem das Ventil öffnet", "Pp.", 8, "Reinhart/Rogoff 2009 (This Time Is Different)", "studie", "Ab hier ist Austerität allein nicht mehr durchzuhalten.");
wirk("anleihen.schnitt", "anleihen", "Schuldenschnitt", "Anteil", 0.5, "Griechenland PSI 2012; Cruces/Trebesch 2013", "studie", "");
wirk("anleihen.ausfallKosten", "anleihen", "Einbruch nach Zahlungsausfall", "% BIP", 5, "Reinhart/Rogoff 2009; Borensztein/Panizza 2009", "studie", "");
wirk("anleihen.reputation", "anleihen", "Reputationsaufschlag nach Schnitt", "Pp.", 2, "Cruces/Trebesch 2013", "studie", "");
wirk("anleihen.sperrJahre", "anleihen", "Jahre bis zum nächsten möglichen Ventil", "Jahre", 10, "Cruces/Trebesch 2013", "studie", "");
wirk("geld.monetarisierung", "geld", "Inflation bei Monetarisierung", "Pp. für 3 Jahre", 8, "Reinhart/Sbrancia 2015", "studie", "");
wirk("geld.monetarisierungQe", "geld", "Notenbankkäufe bei Monetarisierung", "% BIP", 20, "Reinhart/Sbrancia 2015", "studie", "");
wirk(
  "anleihen.schwelle",
  "anleihen",
  "Schuldenquote, ab der Aufschläge steigen",
  "% BIP",
  60,
  "Maastricht-Vertrag",
  "lehrbuch",
  "",
);
wirk(
  "anleihen.kWelt",
  "anleihen",
  "Steilheit Risikoaufschlag Weltwährung",
  "Faktor",
  0.001,
  "De Grauwe/Ji 2013",
  "studie",
  "",
  U(0),
);
wirk(
  "anleihen.kEigen",
  "anleihen",
  "Steilheit Risikoaufschlag eigene Währung",
  "Faktor",
  0.003,
  "De Grauwe/Ji 2013",
  "studie",
  "",
  U(0),
);
wirk(
  "anleihen.kEuro",
  "anleihen",
  "Steilheit Risikoaufschlag Gemeinschaftswährung",
  "Faktor",
  0.012,
  "De Grauwe/Ji 2013",
  "studie",
  "",
  U(0),
);
wirk(
  "anleihen.kHart",
  "anleihen",
  "Steilheit Risikoaufschlag harte Währung",
  "Faktor",
  0.02,
  "Bordo/Rockoff 1996",
  "studie",
  "",
  U(0),
);
wirk(
  "anleihen.kGelenkt",
  "anleihen",
  "Steilheit Risikoaufschlag gelenkte Währung",
  "Faktor",
  0.001,
  "Reinhart/Sbrancia 2015",
  "studie",
  "",
  U(0),
);
wirk(
  "anleihen.tpiDaempfung",
  "anleihen",
  "Dämpfung durch TPI",
  "Faktor",
  0.35,
  "EZB 2022",
  "studie",
  "",
  U(1),
);
wirk(
  "anleihen.reserveRabatt",
  "anleihen",
  "Renditeabschlag Reservewährung",
  "Pp.",
  0.7,
  "Krishnamurthy/Vissing-Jorgensen 2012",
  "studie",
  "",
  U(0),
);
wirk(
  "anleihen.qeWirkung",
  "anleihen",
  "QE senkt Rendite",
  "Pp. je Pp. BIP",
  0.03,
  "Gagnon 2016",
  "studie",
  "",
  U(0),
);
wirk(
  "anleihen.inflationsRisiko",
  "anleihen",
  "Aufschlag bei Inflationsschock (eigene Währung)",
  "Pp. je Pp.",
  0.4,
  "UK Gilt-Krise 2022",
  "studie",
  "",
  U(0),
);

// ---------- Handel ----------
stell(
  "handel.zoelle",
  "handel",
  "Eigene Zölle",
  "%",
  1.5,
  [0, 30],
  0.5,
  "WTO Tariff Profiles",
  "Durchschnittlicher Zoll auf Importe.",
  "teurere Importe und Vergeltung",
);
stell(
  "handel.kapitalOffenheit",
  "handel",
  "Offenheit des Kapitalverkehrs",
  "0–1",
  0.8,
  [0, 1],
  0.05,
  "Chinn-Ito-Index",
  "1 = Kapital kann frei ein- und ausfließen.",
  "wie stark Kapital auf Steuern reagiert",
);
stell(
  "handel.abhaengigkeit",
  "handel",
  "Abhängigkeit von Hauptabnehmern",
  "0–1",
  0.5,
  [0, 1],
  0.05,
  "Destatis Außenhandel",
  "Wie konzentriert die Exporte auf wenige Länder sind.",
  "die Wucht von Handelskriegen",
);
wirk(
  "handel.exportElastizitaet",
  "handel",
  "Exporte je Wechselkurs",
  "Elastizität",
  0.7,
  "IMF WEO Oktober 2015",
  "studie",
  "",
);
wirk(
  "handel.importElastizitaet",
  "handel",
  "Importe je Wechselkurs",
  "Elastizität",
  0.5,
  "IMF WEO Oktober 2015",
  "studie",
  "",
);
wirk(
  "handel.importNachfrage",
  "handel",
  "Importe je Nachfrage",
  "Elastizität",
  1.2,
  "Bussière et al. 2013",
  "studie",
  "",
);
wirk(
  "handel.nachfrageElastizitaet",
  "handel",
  "Exporte je relative Weltnachfrage",
  "Elastizität",
  1,
  "Hooper, Johnson, Marquez 2000; Bussière et al. 2013",
  "studie",
  "",
);
wirk(
  "handel.importEinkommen",
  "handel",
  "Importe je eigenes Einkommen",
  "Elastizität",
  1.5,
  "Hooper, Johnson, Marquez 2000",
  "studie",
  "",
);
wirk(
  "handel.exportImportGehalt",
  "handel",
  "Importgehalt der Exporte",
  "Anteil",
  0.25,
  "OECD TiVA (ausländische Wertschöpfung in Exporten)",
  "studie",
  "",
);
wirk(
  "handel.vermoegensKonsum",
  "handel",
  "Mehrausgabe je Auslandsvermögen",
  "% pro Jahr",
  4,
  "Lettau & Ludvigson 2004; Carroll et al. 2011 (Konsum aus Vermögen 3–5 %)",
  "studie",
  "",
);
wirk(
  "handel.nfaWechselkurs",
  "handel",
  "Auslandsvermögen → Gleichgewichtskurs",
  "% je Pp.",
  1,
  "Lane & Milesi-Ferretti 2004 (Transferproblem); Stärke kalibriert auf Langlauf",
  "kalibriert",
  "",
);
wirk(
  "handel.lbPreisanpassung",
  "handel",
  "Leistungsbilanz → Löhne und Preise bei festem Kurs",
  "% je Pp.",
  0.1,
  "Lehrbuch (reale Anpassung in der Währungsunion)",
  "lehrbuch",
  "",
);
wirk(
  "handel.zinsWechselkurs",
  "handel",
  "Realzins → Wechselkurs",
  "% je Pp.",
  0.5,
  "Lehrbuch Zinsparität",
  "lehrbuch",
  "",
  U(0),
);
wirk(
  "handel.lbWechselkurs",
  "handel",
  "Leistungsbilanz → Wechselkurs",
  "% je Pp.",
  0.1,
  "Lehrbuch",
  "lehrbuch",
  "",
  U(0),
);
wirk(
  "handel.fluchtAufwertung",
  "handel",
  "Aufwertung der Weltwährung in Krisen",
  "% ",
  5,
  "Gourinchas/Rey 2007",
  "studie",
  "",
  U(0),
);
wirk("handel.kkpRueckkehr", "handel", "Rückkehr zur Kaufkraftparität", "Anteil pro Jahr", 0.1, "Rogoff 1996 (Halbwertszeit 3–5 Jahre)", "studie", "");
wirk(
  "handel.energieAbwanderung",
  "handel",
  "Abwanderung energieintensiver Industrie",
  "Anteil pro Jahr",
  0.1,
  "IW Köln 2023",
  "studie",
  "Schrumpfung pro Jahr, wenn der Energiepreis mehr als 30 % über Weltniveau liegt.",
  U(0),
);
wirk(
  "handel.energieImportAnteil",
  "handel",
  "Energieimporte",
  "% BIP",
  3,
  "Destatis Außenhandel",
  "studie",
  "",
);
wirk(
  "handel.nfaRendite",
  "handel",
  "Rendite auf Auslandsvermögen",
  "% pro Jahr",
  3,
  "Bundesbank Auslandsvermögensstatus",
  "studie",
  "",
);
wirk(
  "handel.reserveErosion",
  "handel",
  "Erosion des Reservewährungsstatus",
  "pro Jahr",
  0.002,
  "Dalio 2021",
  "studie",
  "",
  U(0),
);
wirk(
  "handel.zollInflation",
  "handel",
  "Zollerhöhung → Inflation (einmalig)",
  "Pp. je Pp.",
  0.2,
  "Amiti/Redding/Weinstein 2019",
  "studie",
  "",
);
wirk(
  "handel.zollImport",
  "handel",
  "Zoll → Importe",
  "Anteil je Pp.",
  0.02,
  "Amiti/Redding/Weinstein 2019",
  "studie",
  "",
);
wirk(
  "handel.vergeltung",
  "handel",
  "Vergeltung gegen eigene Zölle",
  "Anteil je Pp.",
  0.01,
  "Fajgelbaum et al. 2020",
  "studie",
  "",
  U(0),
);

// ---------- Schwellen für die Lage (Spec 10, Lage-Einstufung) ----------
schwelle(
  "schwelle.aufschlag",
  "anleihen",
  "Krise: Risikoaufschlag über",
  "Pp.",
  3,
  "Spec 10",
  "Ab hier zweifeln die Märkte an der Tragfähigkeit.",
);
schwelle(
  "schwelle.depressionJahre",
  "wachstum",
  "Depression: Jahre in Folge mit Minus pro Kopf",
  "Jahre",
  3,
  "Spec 10",
  "",
);
schwelle(
  "schwelle.depressionAbstand",
  "wachstum",
  "Depression: unter dem letzten Höchststand pro Kopf um mehr als",
  "%",
  10,
  "Spec 10",
  "",
);
schwelle(
  "schwelle.rezession",
  "wachstum",
  "Rezession: Wachstum pro Kopf unter",
  "%",
  -0.5,
  "Spec 10",
  "Jahreswert statt Quartals-Faustregel.",
);
schwelle(
  "schwelle.wachstum",
  "wachstum",
  "Wachstum: pro Kopf über",
  "%",
  0.5,
  "Spec 10, 13.9",
  "Grenze zwischen Stagnation und Wachstum, auch für Stagflation.",
);
schwelle(
  "schwelle.inflationHoch",
  "geld",
  "Inflation deutlich über Ziel: mehr als",
  "Pp.",
  2.2,
  "Spec 10",
  "Frühere Überhitzungs-Schwelle; gilt für Boom und Stagflation.",
);
schwelle(
  "schwelle.deflation",
  "geld",
  "Deflation: Inflation unter",
  "%",
  0,
  "Spec 10",
  "",
);
schwelle(
  "schwelle.boom",
  "wachstum",
  "Boom: Wachstum pro Kopf über",
  "%",
  2.5,
  "Spec 10",
  "Nur zusammen mit positiver Produktionslücke.",
);
schwelle(
  "schwelle.schuldAnstieg",
  "staat",
  "Schuldenfinanziert: Schuldenquote steigt um mehr als",
  "Pp. pro Jahr",
  0.5,
  "Spec 10",
  "",
);

// Spec 13.10: Politik reagiert. Die Schwellen und Wirkstärken gelten nur bei „Politik: Reagiert“;
// die ganze Reaktion ist über „Fest“ abschaltbar, einzeln umstritten ist nur das politische Risiko.
stell("politik.steueranteil", "staat", "Konsolidierung über Steuern", "Anteil", 0.4, [0, 1], 0.1,
  "Alesina/Favero/Giavazzi 2019, Austerity",
  "Muss die Regierung sparen, kommt dieser Anteil aus höherer Einkommen- und Mehrwertsteuer, der Rest aus Kürzungen.",
  "die Mischung der Konsolidierung aus Steuern und Kürzungen");
stell("politik.kuerzeAlles", "staat", "Sparen auch bei Verteidigung und Bildung", "", 0, [0, 1], 1, "Spec 13.10",
  "An: Reichen die übrigen Kürzungen nicht, kürzt die Regierung auch Verteidigung und Bildung.",
  "weitere Kürzungen bei engem Haushalt", { optionen: ["Aus", "An"] });
stell("politik.risiko", "staat", "Politisches Risiko nach Krisen", "", 0, [0, 1], 1, "Funke/Schularick/Trebesch 2016",
  "An: Nach einer Krise steigt der Risikoaufschlag für einige Jahre, weil Regierungen zersplittern und Reformen stocken.",
  "einen höheren Risikoaufschlag nach Krisen", { optionen: ["Aus", "An"] });
for (const [id, name, einheit, wert, erkl] of [
  ["politik.schwaecheJahre", "Schwäche: Wachstum pro Kopf unter der Schwelle, Jahre (von den letzten fünf)", "Jahre", 3, "Danach entsteht ein Entscheidungspunkt: Die Regierung wählt zwischen zusätzlichen Ausgaben, einem Programm nach der Struktur des Landes und einer unbequemen Entscheidung."],
  ["politik.alqAbstand", "Schwäche: Arbeitslosigkeit über der strukturellen um mehr als", "Pp.", 2, ""],
  ["politik.spielraumMin", "Enger Haushalt: Spielraum unter", "% der Einnahmen", 10, "Wie die Warnlampe Spielraum."],
  ["politik.zinsMax", "Enger Haushalt: Zinsen über", "% der Einnahmen", 15, ""],
  ["politik.engJahre", "Enger Haushalt: Jahre in Folge", "Jahre", 2, ""],
  ["politik.abklingJahre", "Reaktion endet nach Jahren ohne Auslöser", "Jahre", 2, ""],
  ["politik.reformJahre", "Unbequeme Entscheidung: Schwäche hält an seit", "Jahre", 5, "Frühestens dann beschließt die Regierung einen Teil des Pakets, das zum Auslöser passt. Schwächere Regierungen warten länger."],
  ["politik.gleitJahre", "Programme und Reformen: Umsetzung über", "Jahre", 3, ""],
  ["politik.konjunkturJahre", "Konjunkturpaket: Dauer", "Jahre", 2, ""],
] as const)
  L.push({ id, art: "schwelle", baustein: "staat", name, einheit, standard: wert, quelle: "Spec 13.10", beleg: "lehrbuch", erklaerung: erkl });
// Spec 13.13: Struktur des Landes. Das größte Signal über 1 bestimmt die Richtung der Großprogramme.
for (const [id, name, einheit, wert, erkl] of [
  ["politik.sozialSchwelle", "Struktur Sozialstaat: Rente, Gesundheit, Familie und Arbeitslosengeld ab", "% BIP", 20, "Ab hier gilt ein Land als ausgebauter Sozialstaat; seine Großprogramme erhöhen Renten und Familienleistungen."],
  ["politik.energieSchwelle", "Struktur Energieimporteur: Anteil importierter Energie ab", "Anteil", 0.75, "Ab hier fördert die Regierung Industriestrom."],
  ["politik.handelSchwelle", "Struktur Handelsdefizit: Leistungsbilanzdefizit ab", "% BIP", 2, "Ab hier schützt die Regierung die Industrie mit Zöllen."],
] as const)
  L.push({ id, art: "schwelle", baustein: "staat", name, einheit, standard: wert, quelle: "Spec 13.13", beleg: "lehrbuch", erklaerung: erkl });
for (const [id, name, einheit, wert, erkl] of [
  ["politik.punktAbstand", "Entscheidungspunkt ohne Wahltakt: höchstens einer je Auslöser in", "Jahre", 4, "Gilt nur für Länder ohne Wahltakt (China, Russland). Sonst liegt der nächste Punkt im Jahr nach der nächsten Wahl."],
  ["politik.druckSchwelle", "Unbequeme Entscheidung: Druck mal Wirksamkeit ab", "", 1, "Druck aus Dauer und Stärke des Auslösers, gewichtet mit der Wirksamkeit der Regierung (0,5 + Index)."],
  ["politik.umsetzungMin", "Unbequeme Entscheidung: umgesetzter Anteil mindestens", "Anteil", 0.3, "Beschlossen wird nur ein Teil dessen, was sachlich nötig wäre."],
  ["politik.umsetzungSpanne", "Unbequeme Entscheidung: zusätzlicher Anteil bei voller Wirksamkeit", "Anteil", 0.5, "Eine wirksame Regierung setzt mehr um."],
  ["politik.programmZoll", "Großprogramm Handel: Zölle", "Pp.", 10, ""],
  ["politik.programmAbstand", "Großprogramm: höchstens eins je", "Jahre", 10, "Ab und zu, nicht in jeder Legislatur. Dazwischen stützt die Regierung die Konjunktur mit Ausgaben."],
] as const)
  L.push({ id, art: "schwelle", baustein: "staat", name, einheit, standard: wert, quelle: "Spec 13.13, Setzung", beleg: "lehrbuch", erklaerung: erkl });
wirk("politik.verspaetung", "staat", "Zu spät: zusätzliche Jahre Schwäche vor einer unbequemen Entscheidung", "Jahre", 4, "Alesina/Drazen 1991 (ungeprüft); Größe: Spec 13.13, Setzung", "studie",
  "Reformen kommen erst unter hohem Druck, weil offen ist, wer die Kosten trägt. Je schwächer die Regierung, desto länger.", U(0));
wirk("politik.sperrklinke", "staat", "Sperrklinke: Anteil der Mehrausgaben, der bleibt", "Anteil", 0.3, "Peacock/Wiseman 1961 (ungeprüft); Größe: Spec 13.13, Setzung", "studie",
  "Ausgaben, die in Krisen oder durch Eingriffe steigen, fallen danach nicht ganz zurück.", U(0));
wirk("politik.kalteProgression", "staat", "Versteckte Einnahmen: Steuersatz steigt je Jahr um", "Anteil", 0.002, "Alesina/Tabellini 1990; Größenordnung kalte Progression Deutschland (BMF Steuerprogressionsbericht), ungeprüft", "studie",
  "Geben ist leichter als nehmen. Entlastungen holt die Regierung über einen wenig sichtbaren Hebel zurück.", U(0));
wirk("politik.programm", "staat", "Großprogramm: Umfang", "% BIP", 1, "Spec 13.13, Setzung", "studie",
  "Ab und zu legt jede Regierung ein großes Programm auf, das der Struktur des Landes folgt. Seine Kosten bleiben.", U(0));
wirk("politik.ruecknahme", "staat", "Rücknahme: Anteil einer Reform, der in der folgenden Legislatur zurückgedreht wird", "Anteil", 0.3, "Spec 13.13, Setzung (Beispiel Rente mit 63 nach der Agenda 2010)", "studie",
  "Stützt sich auf wenige Fälle.", U(0));
wirk("politik.wahljahr", "staat", "Wahljahr: zusätzliche Ausgaben", "% BIP", 0, "Efthyvoulou 2012; Brender/Drazen 2005; Alt/Lassen 2006 (ungeprüft); eigene Prüfung docs/methodik/pruefung-wahltakt.md", "studie",
  "In den Daten der App nicht sichtbar, deshalb 0. Der Wahltakt wirkt trotzdem: keine unbequeme Entscheidung im Wahljahr und im Jahr davor.", U(0));
wirk("politik.konjunktur", "staat", "Konjunkturpaket", "% BIP pro Jahr", 1, "Galí/Perotti 2003; Auerbach/Gorodnichenko 2012", "studie",
  "Zusätzliche Ausgaben in einer langen Schwäche, über den Fiskal-Multiplikator.");
wirk("politik.konsolTeil", "staat", "Konsolidierung: Anteil der Lücke pro Jahr", "Anteil", 0.33, "Spec 13.10", "studie",
  "Die Regierung schließt jedes Jahr diesen Teil des Abstands zu 10 % Spielraum.");
wirk("politik.konsolMax", "staat", "Konsolidierung: höchstens pro Jahr", "% BIP", 1, "Alesina/Favero/Giavazzi 2019", "studie",
  "Größere Sparschritte pro Jahr sind in der OECD selten.");
wirk("politik.kuerzGrenze", "staat", "Kürzung je Ausgabenbereich höchstens", "%", 20, "Spec 13.10", "studie",
  "Kein Bereich wird um mehr als diesen Anteil seines Werts beim Beginn des Sparens gekürzt.");
wirk("politik.risikoJahre", "staat", "Politisches Risiko: Dauer", "Jahre", 5, "Funke/Schularick/Trebesch 2016", "studie", "");
wirk("politik.risikoAufschlag", "staat", "Politisches Risiko: Aufschlag", "Pp.", 0.5, "Funke/Schularick/Trebesch 2016", "studie",
  "Nach Krisen gewinnen Randparteien, Regierungen werden schwerer gebildet; Anleger verlangen etwas mehr Zins.", U(0));

// Update 4a: Wirtschaftsordnung (Spec 6.10), Rohstoffe (6.11), gelenkte Währung (7).
// Alles wirkt über die Abweichung vom Landesstandard.
stell(
  "ordnung.rechtsstaat",
  "ordnung",
  "Rechtsstaat",
  "Index 0–100",
  85,
  [0, 100],
  1,
  "Weltbank WGI Rule of Law Score 2025",
  "Wie verlässlich Verträge, Eigentum und Gerichte sind. 100 = sehr verlässlich.",
  "Investitionen, Produktivität und Abwanderung",
);
stell(
  "ordnung.staatsanteil",
  "ordnung",
  "Staatsanteil an Unternehmen",
  "% der Wirtschaftsleistung",
  5,
  [0, 100],
  1,
  "OECD, Ownership and Governance of State-Owned Enterprises 2017",
  "Anteil der Wirtschaftsleistung aus Unternehmen im Staatsbesitz.",
  "Produktivität und Verluste der Staatsbetriebe im Haushalt",
);
stell(
  "ordnung.preiskontrollen",
  "ordnung",
  "Preiskontrollen",
  "% des Warenkorbs",
  0,
  [0, 100],
  5,
  "Spec 6.10",
  "Anteil der Waren, deren Preise der Staat festlegt.",
  "gemessene Inflation, Preisstau und Knappheit",
);
stell(
  "ordnung.notenbankfinanzierung",
  "ordnung",
  "Notenbankfinanzierung",
  "% des Defizits",
  0,
  [0, 100],
  5,
  "Cagan 1956",
  "Anteil des Staatsdefizits, den die Notenbank mit neuem Geld bezahlt.",
  "Inflation",
);
stell(
  "ordnung.kreditlenkung",
  "ordnung",
  "Kreditlenkung durch Staatsbanken",
  "% der Kredite",
  0,
  [0, 100],
  5,
  "Brandt/Zhu 2010",
  "Anteil der Kredite, die Staatsbanken nach politischen Vorgaben vergeben.",
  "Investitionen, Kapitaleffizienz und faule Kredite",
);
stell(
  "rohstoff.foerderung",
  "energie",
  "Rohstoff-Förderung",
  "Index",
  100,
  [0, 200],
  5,
  "Spec 6.11",
  "Fördermenge gegenüber heute. 100 = wie heute.",
  "Rohstoffexporte und Staatseinnahmen",
);
stell(
  "rohstoff.fondsAnteil",
  "energie",
  "Stabilisierungsfonds",
  "% der Mehreinnahmen",
  0,
  [0, 100],
  5,
  "IWF, Fiscal Rules and Sovereign Wealth Funds",
  "Anteil der Rohstoff-Mehreinnahmen, der in einen Fonds geht und in schlechten Jahren ausgezahlt wird.",
  "stabilere Staatseinnahmen",
);
stell(
  "rohstoff.diversifizierung",
  "energie",
  "Diversifizierung der Abnehmer",
  "0–1",
  0.5,
  [0, 1],
  0.05,
  "Spec 6.11",
  "1 = Rohstoffe gehen an viele Abnehmer, Sanktionen treffen weniger.",
  "Sanktionen gegen Rohstoffexporte",
);
stell(
  "handel.kursNachfuehrung",
  "handel",
  "Kursnachführung (gelenkte Währung)",
  "0–1",
  1,
  [0, 1],
  0.05,
  "Spec 7",
  "Nur bei gelenkter Währung: 1 = der offizielle Kurs folgt der Inflation, 0 = er bleibt stehen.",
  "Überbewertung und Schwarzmarkt",
);
wirk("ordnung.rechtsTfp", "ordnung", "Rechtsstaat → Produktivitätsniveau", "log je 100 Punkte", 0.5, "Acemoglu/Johnson/Robinson 2001", "studie", "Mehr Rechtsstaat hebt das Produktivitätsniveau langfristig.", U(0));
wirk("ordnung.staatTfp", "ordnung", "Staatsanteil → Produktivitätsniveau", "log je 100 Punkte", 0.3, "Hsieh/Klenow 2009; Brandt/Zhu 2010", "studie", "Staatsbetriebe arbeiten weniger produktiv.", U(0));
wirk("ordnung.niveauJahre", "ordnung", "Anpassung des Produktivitätsniveaus", "Jahre", 15, "Acemoglu/Johnson/Robinson 2001", "studie", "Das Niveau schließt jedes Jahr 1/15 des Abstands zum Ziel.");
wirk("ordnung.konvergenzRechtsstaat", "ordnung", "Rechtsstaat → Aufholgeschwindigkeit", "Faktor je 100 Punkte", 1, "Barro 1991", "studie", "Schwacher Rechtsstaat bremst das Aufholen.", U(0));
wirk("ordnung.rechtsAufschlag", "ordnung", "Rechtsstaat → Kapitalkosten", "Pp. je Punkt", 0.1, "Acemoglu/Johnson/Robinson 2001", "studie", "Jeder Punkt Rechtsstaat weniger verteuert Investitionen.", U(0));
wirk("ordnung.flucht", "ordnung", "Kapitalflucht", "Faktor", 1, "Schneider 2003; IWF", "studie", "Wie stark Kapital bei Willkür, Inflation und Schwarzmarkt abfließt.", U(0));
wirk("ordnung.fluchtInvest", "ordnung", "Kapitalflucht → Investitionen", "Pp. je % BIP", 0.5, "Spec 6.10", "kalibriert", "Die Hälfte der Kapitalflucht fehlt bei den Investitionen.", U(0));
wirk("ordnung.fluchtKurs", "ordnung", "Kapitalflucht → Wechselkurs", "% je % BIP", 1, "Spec 6.10", "kalibriert", "Kapitalflucht drückt den freien Kurs bzw. den Schattenkurs.", U(0));
wirk("ordnung.abwanderung", "ordnung", "Abwanderung bei schlechter Ordnung", "Faktor", 0.5, "Docquier/Rapoport 2012", "studie", "Wie stark Menschen bei Willkür, Hyperinflation und Einbruch auswandern.", U(0));
wirk("ordnung.staatsbetriebVerlust", "ordnung", "Verluste der Staatsbetriebe", "% BIP je Punkt", 0.03, "Kornai 1986 (weiche Budgetgrenze)", "studie", "Der Staat deckt die Verluste seiner Betriebe.", U(0));
wirk("ordnung.unterdrueckung", "ordnung", "Preiskontrollen: unterdrückte Inflation", "Anteil", 0.7, "Spec 6.10", "kalibriert", "Welcher Teil der Inflation im kontrollierten Warenkorb nicht sichtbar wird.", U(0));
wirk("ordnung.stauAbbau", "ordnung", "Abbau des Preisstaus", "Anteil pro Jahr", 0.5, "Spec 6.10", "kalibriert", "Fallen Kontrollen weg, holen die Preise jedes Jahr die Hälfte des Staus nach.");
wirk("ordnung.knappheitAngebot", "ordnung", "Knappheit → Angebot", "% je Punkt", 0.2, "Kornai 1980", "studie", "Leere Regale: das Angebot sinkt mit der Knappheit (höchstens 50 %).", U(0));
wirk("geld.basisgeld", "geld", "Geldnachfrage bei stabilen Preisen", "% BIP", 10, "Cagan 1956", "studie", "So viel Basisgeld halten die Leute bei null Inflation.");
wirk("geld.cagan", "geld", "Flucht aus dem Geld", "je 100 % Inflation", 1, "Cagan 1956", "studie", "Bei hoher erwarteter Inflation halten die Leute weniger Geld; dieselbe Notenbankfinanzierung treibt die Preise stärker.", U(0));
wirk("ordnung.lenkInvest", "ordnung", "Kreditlenkung → Investitionen", "Pp. je Punkt", 0.1, "Brandt/Zhu 2010", "studie", "Staatsbanken treiben die Investitionsquote.", U(0));
wirk("ordnung.lenkVerlust", "ordnung", "Kreditlenkung → Kapitaleffizienz", "Anteil je 100 Punkte", 0.5, "Brandt/Zhu 2010; Hsieh/Klenow 2009; kalibriert an der UdSSR (Easterly/Fischer 1995)", "kalibriert", "Gelenkte Kredite landen oft in schlechten Projekten.", U(0));
wirk("ordnung.lenkJahre", "ordnung", "Anpassung der Kapitaleffizienz", "Jahre", 15, "Spec 6.10", "kalibriert", "Die Effizienz schließt jedes Jahr 1/15 des Abstands.");
wirk("ordnung.faulQuote", "ordnung", "Faule Kredite aus Kreditlenkung", "Anteil", 0.1, "IWF Article IV China", "studie", "Welcher Teil der gelenkten Investitionen zu verdeckter Schuld wird.", U(0));
wirk("rohstoff.verfall", "energie", "Förderverfall", "Anteil pro Jahr", 0.15, "Wolf 2009; Stevens/Dietsche 2008", "studie", "Staatsförderer mit schwachem Rechtsstaat investieren zu wenig, die Förderung verfällt.", U(0));
wirk("rohstoff.hollaendisch", "handel", "Holländische Krankheit", "% je Pp.", 0.5, "Corden/Neary 1982", "studie", "Mehr Rohstoffexporte werten die Währung auf und verdrängen übrige Exporte.", U(0));
wirk("rohstoff.fondsRendite", "energie", "Rendite des Stabilisierungsfonds", "% real", 3, "Norges Bank Investment Management", "studie", "Der Fonds verzinst sich real.");
wirk("anleihen.nfaRisiko", "anleihen", "Aufschlag je Pp. Auslandsschuld über der Schwelle", "Pp. je Pp.", 0.03, "Lane/Milesi-Ferretti 2012; Catão/Milesi-Ferretti 2014; kalibriert an Griechenland 2008–2012", "kalibriert", "Wer netto viel im Ausland schuldet, zahlt mehr Zins; eine Reservewährung schützt.", U(0));
schwelle("anleihen.nfaSchwelle", "anleihen", "Auslandsschuld: Aufschlag ab Nettoauslandsschuld über", "% BIP", 60, "Catão/Milesi-Ferretti 2014 (Krisenrisiko steigt ab rund 50–60 % BIP)", "Darunter kein Zuschlag.");
wirk("anleihen.defizitRisiko", "anleihen", "Aufschlag je Pp. Primärdefizit über der Schwelle", "Pp. je Pp.", 0.25, "Laubach 2009 (rund 25 Basispunkte je Pp. Defizit)", "studie", "Große laufende Defizite verteuern die Refinanzierung.", U(0));
schwelle("anleihen.defizitSchwelle", "anleihen", "Defizit: Aufschlag ab Primärdefizit über", "% BIP", 3, "Maastricht-Kriterium als Marktanker", "Darunter kein Zuschlag.");
wirk("anleihen.panik", "anleihen", "Panik ohne eigene Notenbank", "Faktor", 0.5, "De Grauwe 2011; De Grauwe/Ji 2013; kalibriert an Griechenland 2008–2012", "kalibriert", "Gemeinsame Währung ohne Schutzprogramm oder harte Währung: Ein Aufschlag über der Schwelle verstärkt sich selbst.", U(0));
schwelle("anleihen.panikSchwelle", "anleihen", "Panik ab Risikoaufschlag über", "Pp.", 5, "De Grauwe/Ji 2013", "Darunter keine Selbstverstärkung.");
wirk("anleihen.abwertungsRisiko", "anleihen", "Abwertungsrisiko im Zins", "Pp. je % Überbewertung", 0.3, "Frankel/Rose 1996", "studie", "Überbewertete feste oder gelenkte Kurse verlangen einen Aufschlag, soweit Kapital frei fließt.", U(0));
wirk("geld.gelenktAngleichung", "geld", "Gelenkte Währung: Angleichung an den Weltrealzins", "Jahre", 10, "Update 4b; Holston/Laubach/Williams 2017 (langsame Anpassung des neutralen Zinses)", "kalibriert", "Der Realzins des Startjahres nähert sich jedes Jahr um 1/10 des Abstands dem Weltrealzins.");
wirk("geld.gelenktInflation", "geld", "Gelenkte Währung: Reaktion auf Inflation", "Faktor", 0.25, "Spec 7", "kalibriert", "Die Notenbank folgt der Inflation nur schwach; der Realzins sinkt.");
schwelle("schwelle.hyperinflation", "geld", "Hyperinflation: Inflation über", "%", 100, "Spec 6.10", "Ab hier gilt die Lage als Krise.");
schwelle("schwelle.verdeckteUebernahme", "staat", "Verdeckte Schuld: Staat übernimmt ab", "% BIP", 20, "Spec 6.10", "Faule Kredite der Staatsbanken wandern in die Staatsschuld.");
// Frühwarn-Lampen (Spec 13.2)
schwelle("schwelle.zinskurve", "anleihen", "Inverse Zinskurve: Rendite 10 Jahre minus Leitzins unter", "Pp.", 0, "Estrella/Mishkin 1998; Federal Reserve Bank of New York", "Liegt die lange Rendite unter dem Leitzins, folgte in den USA meist eine Rezession. Bei Gemeinschaftswährung zählt der Euroraum-Leitzins.");
schwelle("schwelle.kreditluecke", "privatschuld", "Kreditlücke über", "Pp.", 10, "BCBS 2010 (antizyklischer Kapitalpuffer, Basel III); Drehmann/Juselius 2014", "Abstand der Privatschuld zu ihrem einseitigen HP-Trend (λ = 1.562,5 für Jahre). Bester bekannter Vorbote von Bankenkrisen.");
schwelle("geld.ankerSchwelle", "geld", "Anker bröckelt ab Inflation über", "%", 25, "Spec 6.10", "Darüber verlieren die Erwartungen ihren Anker.");

// ---------- Vermögenspreise und Banken (Spec 13.6) ----------
L.push({ id: "grund.banken", art: "grundeinstellung", baustein: "banken", name: "Häuser und Banken", einheit: "", standard: 0,
  quelle: "Spec 13.6", optionen: ["Aus", "An"],
  erklaerung: "An: Hauspreise, faule Kredite und das Eigenkapital der Banken rechnen mit; der Staat rettet Banken auf Kosten der Staatsschuld. Aus: Das Modell rechnet ohne Banken." });
L.push({ id: "grund.rettung", art: "grundeinstellung", baustein: "banken", name: "Bankenrettung", einheit: "", standard: 0,
  quelle: "Spec 13.6; Laeven/Valencia 2018; Caballero/Hoshi/Kashyap 2008", optionen: ["Schnell", "Zögernd"],
  erklaerung: "Schnell: Der Staat füllt das Eigenkapital auf, sobald es unter die Hälfte des heutigen Werts fällt, und die Banken schreiben faule Kredite zügig ab. Zögernd: Er rettet erst, wenn das Eigenkapital aufgezehrt ist, und faule Kredite bleiben lange stehen (Japan in den 1990ern)." });
stell(
  "banken.eigenkapital",
  "banken",
  "Eigenkapital der Banken",
  "Pp. über heute",
  0,
  [-2, 10],
  0.5,
  "BIS 2010 (Macroeconomic Assessment Group); Admati/Hellwig 2013; Jordà/Richter/Schularick/Taylor 2021",
  "Vorgeschriebenes Eigenkapital gegenüber heute, in Prozentpunkten der Bilanz. Mehr Eigenkapital verhindert Krisen nicht, macht sie aber milder; Kredit wird etwas teurer.",
  "Kreditzins und Puffer für Verluste",
);
wirk("banken.hausMomentum", "banken", "Schwung der Hauspreise", "Anteil", 0.5, "Case/Shiller 1989; Glaeser u. a. 2014 (Spanne 0,3–0,7)", "studie", "Was im Vorjahr stieg, steigt noch etwas weiter.");
wirk("banken.hausAnpassung", "banken", "Hauspreis kehrt zum Grundwert zurück", "Anteil pro Jahr", 0.2, "Capozza/Hendershott/Mack 2004 (Spanne 0,05–0,2); kalibriert an USA 2000–2014 und Japan 1985–2005 (Gipfel im richtigen Jahr)", "kalibriert", "Jedes Jahr schließt sich dieser Teil des Abstands zum Grundwert aus Einkommen pro Kopf und Realzins.");
wirk("banken.hausZins", "banken", "Realzins → Grundwert der Häuser", "% je Pp.", 5, "Poterba 1984; Kuttner 2014 (Spanne 2–8)", "studie", "Ein Prozentpunkt mehr Realzins senkt den Grundwert um so viel Prozent.", U(0));
wirk("banken.hausKredit", "banken", "Kredit → Hauspreis", "% je Pp. BIP", 1, "Jordà/Schularick/Taylor 2015; kalibriert an den Krisenfällen (Spanne 0–2)", "kalibriert", "Neuer Kredit über der normalen Ausweitung treibt die Hauspreise.", U(0));
wirk("banken.sicherheiten", "banken", "Hauspreis → Kredit (Sicherheiten)", "% je %", 0.2, "Goodhart/Hofmann 2008; Mian/Sufi 2011 (Spanne 0–0,3); kalibriert an USA 2000–2014, begrenzt durch ruhige Basisläufe bei hoher Privatschuld", "kalibriert", "Steigt der Hauspreis ein Prozent schneller als das Einkommen, wächst der Kreditbestand um so viel Prozent zusätzlich.", U(0));
wirk("banken.nplAlq", "banken", "Arbeitslosigkeit → faule Kredite", "Pp. je Pp.", 1, "Nkusu 2011; Beck/Jakubik/Piloiu 2013 (Spanne 0,2–1); kalibriert an USA 2008–2011 (Höchststand 5 %, Laeven/Valencia 2018)", "kalibriert", "Je Prozentpunkt Arbeitslosigkeit über der strukturellen fallen mehr Kredite aus.");
wirk("banken.nplHaus", "banken", "Fallende Hauspreise → faule Kredite", "Pp. je %", 0.3, "Nkusu 2011; Beck/Jakubik/Piloiu 2013 (Spanne 0,05–0,3); kalibriert an USA 2008–2011", "kalibriert", "Fällt der Hauspreis, decken die Sicherheiten den Kredit nicht mehr.");
wirk("banken.nplDsr", "banken", "Schuldendienst → faule Kredite", "Pp. je Pp.", 0.3, "Nkusu 2011; Beck/Jakubik/Piloiu 2013 (Spanne 0–0,6)", "studie", "Zählt nur der Schuldendienst über der Schwelle des Landes.");
wirk("banken.lgd", "banken", "Verlust je ausgefallenem Kredit", "Anteil", 0.45, "Basel II, IRB-Basisansatz (Verlustquote 45 %)", "lehrbuch", "So viel eines faulen Kredits ist beim Abschreiben verloren.");
wirk("banken.abschreibung", "banken", "Abschreibung fauler Kredite, schnelle Rettung", "Anteil pro Jahr", 0.4, "kalibriert an den USA 2009–2013 (Spanne 0,15–0,4); der obere Rand steht auch für Wertpapierverluste, die das Modell nicht kennt", "kalibriert", "Dieser Teil der faulen Kredite wird jedes Jahr abgeschrieben und mindert das Eigenkapital.");
wirk("banken.abschreibungZoegernd", "banken", "Abschreibung fauler Kredite, zögernde Rettung", "Anteil pro Jahr", 0.08, "kalibriert an Japan 1992–2002; Caballero/Hoshi/Kashyap 2008 (Spanne 0,04–0,12)", "kalibriert", "Faule Kredite bleiben in den Büchern; die Verluste kommen später, und es gesunden im selben Maß weniger.");
wirk("banken.heilung", "banken", "Faule Kredite werden wieder bedient", "Anteil pro Jahr", 0.15, "EZB/EBA, Berichte zu notleidenden Krediten (Spanne 0,1–0,25)", "studie", "Dieser Teil der faulen Kredite gesundet jedes Jahr ohne Verlust.");
wirk("banken.rendite", "banken", "Eigenkapitalrendite der Banken", "% pro Jahr", 5, "Größenordnung nach EZB Financial Stability Review (Euroraum rund 5–8 %) und FDIC Quarterly Banking Profile (USA rund 10–12 %), im Original ungeprüft; Spanne 5–12; kalibriert am unteren Rand (USA 2008: Gewinne fingen die Verluste nicht ab)", "kalibriert", "Gewinn vor außergewöhnlichen Abschreibungen, beim Inflationsziel des Landes; mit höherer Inflation steigt er mit. Er fängt Verluste zuerst ab und baut das Eigenkapital nach einer Krise wieder auf; was über dem Ziel liegt, wird ausgeschüttet.");
wirk("banken.klemme", "banken", "Kreditklemme", "Faktor", 2.5, "Bernanke/Lown 1991; Peek/Rosengren 1995 (Spanne 1–4)", "studie", "Fällt das Eigenkapital mehr als ein Zehntel unter den heutigen Wert (oder unter eine gesenkte Vorgabe), kürzen die Banken Kredit: je Prozentpunkt darunter um so viel Prozent des Bestands, jedes Jahr den halben Weg dorthin, höchstens 10 % im Jahr.", U(0));
wirk("banken.kapitalkosten", "banken", "Mehr Eigenkapital → Kreditzins", "Pp. je Pp.", 0.13, "BIS 2010 (Macroeconomic Assessment Group); kleiner nach Admati/Hellwig 2013 (Spanne 0–0,2)", "studie", "Jeder Prozentpunkt mehr vorgeschriebenes Eigenkapital verteuert Kredit um so viel.", U(0));
wirk("banken.staatBank", "banken", "Staat-Bank-Kreislauf", "Faktor", 1, "Acharya/Drechsler/Schnabl 2014; Brunnermeier u. a. 2016", "studie", "Steigt die Rendite, verlieren Banken Kurswert auf ihren Staatsanleihen. 0 = aus.", U(0));
schwelle("schwelle.bankMindest", "banken", "Bankenrettung: Eigenkapital unter diesem Anteil des Startwerts", "Anteil", 0.5, "Spec 13.6 (Schwelle relativ zum Start, weil die Rechnungslegung je Land verschieden ist)", "Bei schneller Rettung füllt der Staat darunter auf das Ziel auf.");
schwelle("schwelle.hausluecke", "banken", "Hauspreislücke über", "%", 15, "Borio/Drehmann 2009", "Abstand des realen Hauspreises zu seinem einseitigen HP-Trend. Zusammen mit der Kreditlücke warnt sie besser als eine allein.");

// ---------- Öffentliche Investitionen (Spec 13.5 Teil B) ----------
stell(
  "staat.investitionen",
  "staat",
  "Öffentliche Investitionen",
  "% BIP",
  3,
  [0, 8],
  0.1,
  "Eurostat gov_10a_main (Bruttoanlageinvestitionen des Staates); OECD, IWF für Länder außerhalb der EU",
  "Straßen, Schienen, Netze, Schulen und andere Bauten des Staates, vor Abschreibungen. Der heutige Wert steckt in „Übrige Staatsausgaben“; hier zählt die Änderung.",
  "den öffentlichen Kapitalstock und damit die Produktivität, kurzfristig auch die Nachfrage",
);
wirk("staat.oeffKapital", "staat", "Öffentlicher Kapitalstock → Produktivität", "Elastizität", 0.1, "Bom/Ligthart 2014 (Meta-Analyse, 578 Schätzungen: 0,08 kurzfristig bis 0,12 langfristig; Spanne 0,05–0,17); Aschauer 1989 lag mit 0,39 weit darüber", "studie", "Ein Prozent mehr öffentlicher Kapitalstock hebt die Produktivität um so viel Prozent. Gerechnet wird nur die Abweichung vom Pfad mit heutiger Investition, bezogen auf den gemessenen Bestand des Landes (IWF): Wo er klein ist, bringt ein Euro mehr.", U(0));
wirk("staat.oeffAbschreibung", "staat", "Abschreibung des öffentlichen Kapitalstocks", "Anteil pro Jahr", 0.045, "Kamps 2006; IWF Investment and Capital Stock Dataset (2,5 bis 4,5 %); Eurostat: Abschreibungen des deutschen Staates rund 2,4 % BIP auf rund 50 % BIP Bestand", "studie", "Wer nicht investiert, verliert jedes Jahr diesen Teil des Bestands.");

// ---------- Zufallsschocks (Spec 13.4) ----------
// Nur die Zufallsläufe für das Unsicherheitsband lesen diese Werte; die Hauptlinie bleibt ohne Zufall.
wirk("zufall.kriseBasis", "zufall", "Finanzkrise: Wahrscheinlichkeit bei Kreditlücke null", "% pro Jahr", 2, "Eigene Schätzung auf der Macrohistory-Datenbank (Spec 13.4): 18 Länder 1970–2020, 25 Krisen in 918 Länderjahren (2,7 % im Mittel, 2,0 % bei Lücke null)", "kalibriert", "So oft beginnt in einem Zufallslauf eine Finanzkrise, wenn der Kredit auf seinem Trend liegt.", U(0));
wirk("zufall.kriseKredit", "zufall", "Finanzkrise: Kreditlücke → Wahrscheinlichkeit", "Logit je Pp.", 0.09, "Dieselbe Schätzung: 0,094 (t 4,8); Schularick/Taylor 2012 finden denselben Zusammenhang", "kalibriert", "Liegt der Kredit 10 Punkte über dem Trend, steigt die Wahrscheinlichkeit von 2 auf rund 5 % pro Jahr.", U(0));
wirk("zufall.kriseHaus", "zufall", "Finanzkrise: Hauspreislücke → Wahrscheinlichkeit", "Logit je %", 0.05, "Dieselbe Schätzung: 0,048 (t 2,8), zusammen mit der Kreditlücke; Jordà/Schularick/Taylor 2015", "kalibriert", "Zählt nur, wenn „Häuser und Banken“ an ist. 20 % Hauspreis über dem Trend heben die Wahrscheinlichkeit auf das 2,6-Fache.", U(0));
wirk("zufall.kriseMax", "zufall", "Finanzkrise: höchste Wahrscheinlichkeit", "% pro Jahr", 15, "Annahme; die Schätzung ist über 20 Punkte Kreditlücke kaum belegt", "kalibriert", "Deckel, damit extreme Lücken keine sichere Krise ergeben.");
wirk("zufall.kriseRuhe", "zufall", "Finanzkrise: Ruhezeit danach", "Jahre", 10, "Macrohistory-Datenbank: seit 1950 lagen im selben Land mindestens 16 Jahre zwischen zwei Krisen", "kalibriert", "So lange beginnt nach einer Finanzkrise keine neue Zufallskrise.");
wirk("zufall.oel", "zufall", "Ölpreisschock: Wahrscheinlichkeit", "% pro Jahr", 5, "Annahme nach Hamilton 2013 (große Ölpreisschocks 1973, 1979, 1990, 2008), im Original ungeprüft", "kalibriert", "Rund alle 20 Jahre.", U(0));
wirk("zufall.pandemie", "zufall", "Pandemie: Wahrscheinlichkeit", "% pro Jahr", 2, "Marani u. a. 2021 (PNAS): rund 2 % pro Jahr für eine Pandemie wie Covid-19", "studie", "Rund alle 50 Jahre.", U(0));
wirk("zufall.proxy", "zufall", "Krieg in der Nachbarschaft: Wahrscheinlichkeit", "% pro Jahr", 1.5, "Annahme: für Deutschland seit 1950 ein Fall mit Energieschock und Flüchtlingen (2022)", "kalibriert", "Rund alle 65 Jahre. Ein Krieg mit eigener Beteiligung wird nicht gewürfelt.", U(0));
wirk("zufall.staerke", "zufall", "Streuung der Schockstärke", "Log-Standardabweichung", 0.4, "Macrohistory-Datenbank: Einbußen in 25 Krisen seit 1950, 10. bis 90. Perzentil beim 0,6- bis 1,8-Fachen des Medians", "kalibriert", "Jeder Zufallsschock ist mal schwächer, mal stärker als der Standardschock (meist zwischen 0,6- und 1,7-fach).");
wirk("zufall.konjunktur", "zufall", "Gewöhnliche Konjunktur: Zufall in der Nachfrage", "% BIP, Standardabweichung", 1, "kalibriert am gemessenen Wachstum Deutschlands in ruhigen Jahren (Spec 13.4)", "kalibriert", "Kleine Zufallsstöße in jedem Jahr. Sie machen aus der glatten Linie eine wellige.", U(0));

export const VERZEICHNIS: readonly Eintrag[] = L;
const INDEX = new Map(L.map((e) => [e.id, e]));

export function eintrag(id: string): Eintrag {
  const e = INDEX.get(id);
  if (!e) throw new Error(`Unbekannter Eintrag: ${id}`);
  return e;
}

export function stellschrauben(): Eintrag[] {
  return L.filter((e) => e.art === "stellschraube");
}

// Anteile, die zusammen höchstens 100 % ergeben; der Rest ist eine eigene Gruppe.
export const ANTEILSGRUPPEN: readonly { ids: readonly string[]; rest: string }[] = [
  { ids: ["mig.anteilHoch", "mig.anteilMittel"], rest: "Niedrig qualifiziert" },
  { ids: ["mig.anteilArbeit", "mig.anteilStudium", "mig.anteilFamilie"], rest: "Asyl" },
];

export function anteilsgruppe(id: string) {
  return ANTEILSGRUPPEN.find((g) => g.ids.includes(id));
}

// Höchstwert eines Anteils, damit die Gruppe 100 % nicht übersteigt.
export function anteilsGrenze(id: string, wert: (id: string) => number): number {
  const g = anteilsgruppe(id);
  if (!g) return Infinity;
  const andere = g.ids.filter((x) => x !== id).reduce((s, x) => s + wert(x), 0);
  return Math.max(0, Math.round((1 - andere) * 1000) / 1000);
}

// Angezeigte Texte eines Eintrags in der gewählten Sprache (Spec 12c); deutsch aus dem Verzeichnis.
export const vName = (e: Eintrag) => tk(`v:${e.id}:name`, e.name);
export const vErklaerung = (e: Eintrag) => (e.erklaerung ? tk(`v:${e.id}:erklaerung`, e.erklaerung) : "");
export const vKanal = (e: Eintrag) => (e.kanal ? tk(`v:${e.id}:kanal`, e.kanal) : "");
export const vEinheit = (e: Eintrag) => (e.einheit ? t(e.einheit) : "");
export const vOption = (e: Eintrag, i: number) => tk(`v:${e.id}:option:${i}`, e.optionen?.[i] ?? String(i));

