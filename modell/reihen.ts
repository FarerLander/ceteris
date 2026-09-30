import { t, tk } from "./sprache";
import type { Landesdaten, Lage, Zustand } from "./typen";

export type ReihenId =
  | "bipProKopf"
  | "schuldQuote"
  | "alq"
  | "inflation"
  | "aufschlag"
  | "energiepreis"
  | "beschaeftigte"
  | "rentenausgaben"
  | "primaer"
  | "spielraum"
  | "leistungsbilanz"
  | "co2Mt"
  | "gini"
  | "vcQuote"
  | "knappheit"
  | "schwarzmarkt"
  | "verdeckteSchuld"
  | "rohstoffExporte"
  | "zinskurve"
  | "kreditluecke"
  | "hauspreis"
  | "hausluecke"
  | "bankKapital"
  | "npl";

export interface Reihe {
  name: string;
  einheit: string;
  dez: number;
  gut: 1 | -1 | 0; // Richtung, in der eine Änderung gut ist
  warn?: number;
  nullbasis?: boolean;
  bezug?: "bev";
  beschreibung: string;
  info: [string, string, string, string];
}

export const INFO_TITEL = [
  "Was es ist",
  "Warum es zählt",
  "Gut oder kritisch",
  "So rechnet das Modell",
];
export const LAGE_NAME: Record<Lage, string> = {
  krise: "Krise",
  depression: "Depression",
  rezession: "Rezession",
  stagflation: "Stagflation",
  deflation: "Deflation",
  boom: "Boom",
  schuldenwachstum: "Schuldenfinanziertes Wachstum",
  wachstum: "Wachstum",
  stagnation: "Stagnation",
};

export const REIHEN: Record<ReihenId, Reihe> = {
  bipProKopf: {
    name: "Ökonomischer Wohlstand pro Kopf",
    einheit: "Tsd. {W}",
    dez: 1,
    gut: 1,
    beschreibung: "Reales BIP je Einwohner in Preisen des Startjahres. Der Durchschnitt, nicht was beim Einzelnen ankommt.",
    info: [
      "Wirtschaftsleistung (BIP) geteilt durch die Zahl der Einwohner, in Preisen des Startjahres. Inflation ist also herausgerechnet.",
      "Der einfachste Maßstab für ökonomischen Wohlstand: Wie viel wird pro Kopf erwirtschaftet? Es ist ein Durchschnitt. Wie das Einkommen verteilt ist, zeigt das Diagramm zur Ungleichheit (Gini). Zufriedenheit, Lebensqualität und den Zustand der Umwelt misst der Wert nicht.",
      "Die G7 wachsen langfristig um etwa 1 % pro Jahr, mit der Alterung eher 0,5 bis 1 %. Unter 0,5 % zählt als Stagnation. Schrumpft der Wert um mehr als 0,5 %, ist das eine Rezession; drei Minusjahre in Folge oder mehr als 10 % unter dem Höchststand sind eine Depression.",
      "Produktivität mal Erwerbstätige, geteilt durch Einwohner. Produktivität wächst mit Forschung, Gründungen und günstiger Energie.",
    ],
  },
  schuldQuote: {
    name: "Staatsschuld",
    einheit: "% BIP",
    dez: 0,
    gut: -1,
    warn: 90,
    nullbasis: true,
    beschreibung:
      "Schuldenquote. Die rote Linie markiert 90 %, ab der Märkte nervös werden. Negativ heißt: Der Staat hat mehr Vermögen als Schulden.",
    info: [
      "Die Staatsschulden im Verhältnis zur Wirtschaftsleistung eines Jahres.",
      "Zeigt, wie schwer die Last im Verhältnis zur Kraft ist, sie zu tragen. Hohe Schulden machen anfällig für Zinsanstiege.",
      "Maastricht-Grenze 60 %. Ab etwa 90 % werden Märkte bei Ländern ohne eigene Notenbank nervös. Japan trägt über 250 %, weil es seine eigene Währung druckt.",
      "Die Schuld wächst mit Zinsen und Defizit und schrumpft relativ durch Wachstum. Entscheidend ist, ob der Zins über dem Wachstum liegt (r − g).",
    ],
  },
  alq: {
    name: "Arbeitslosigkeit",
    einheit: "%",
    dez: 1,
    gut: -1,
    nullbasis: true,
    beschreibung: "Anteil der Erwerbspersonen ohne Arbeit.",
    info: [
      "Anteil der Erwerbspersonen, die Arbeit suchen und keine haben.",
      "Arbeitslosigkeit kostet Einkommen, Steuern und Beiträge und belastet die Sozialkassen doppelt.",
      "Unter 4 % gilt als Vollbeschäftigung, über 10 % als Krise.",
      "Steigt, wenn das Wachstum unter den Trend fällt (Okunsches Gesetz). Dazu kommen Schocks und kurzfristig harte Sparpolitik.",
    ],
  },
  inflation: {
    name: "Inflation",
    einheit: "%",
    dez: 1,
    gut: 0,
    beschreibung: "Preisanstieg pro Jahr. Ziel der Notenbank: 2 %.",
    info: [
      "Wie stark die Verbraucherpreise pro Jahr steigen.",
      "Zu viel Inflation frisst Löhne und Ersparnisse. Fallende Preise (Deflation) lähmen Investitionen und machen Schulden schwerer.",
      "Das Ziel der Notenbanken liegt bei 2 %. Über 4 % gilt die Wirtschaft als überhitzt, unter 0 % droht Deflation.",
      "Erwartete Inflation plus Auslastung plus Energiepreise. Bei harter Währung gibt es kein Inflationsziel, Wachstum drückt dann die Preise.",
    ],
  },
  aufschlag: {
    name: "Risikoaufschlag",
    einheit: "Pp.",
    dez: 1,
    gut: -1,
    warn: 3,
    nullbasis: true,
    beschreibung:
      "Aufschlag auf die Staatsanleihe gegenüber einem sicheren Schuldner. Über 3 Prozentpunkte droht die Krise.",
    info: [
      "Der Mehrzins, den ein Staat gegenüber einem sicheren Schuldner zahlen muss, in Prozentpunkten.",
      "So misst der Markt das Ausfallrisiko. Steigt der Aufschlag, wird jede neue Schuld teurer, und eine Spirale kann beginnen.",
      "Unter 1 Prozentpunkt ist entspannt. Über 3 Prozentpunkte droht die Krise. Italien lag 2011 bei rund 5,5.",
      "Eine Kurve über die Schuldenquote, dazu Auslandsschuld, Primärdefizit und ohne Schutzprogramm Panik. Wie steil sie ist, hängt am Währungsregime. Das EZB-Schutzprogramm (TPI) dämpft sie.",
    ],
  },
  energiepreis: {
    name: "Energiepreis",
    einheit: "Index",
    dez: 0,
    gut: -1,
    beschreibung: "Industrie-Energiepreis, Startjahr = 100.",
    info: [
      "Index des Energiepreises für die Industrie, Startjahr = 100.",
      "Energie steckt in fast allem. Teure Energie treibt die Inflation und vertreibt energieintensive Industrie wie Chemie, Stahl und Glas.",
      "Liegt der Wert dauerhaft über 150, ist energieintensive Industrie gefährdet.",
      "Kosten des Energiemix plus CO₂-Preis plus Weltpreise für Öl und Gas. Schneller Ausbau der Erneuerbaren senkt den Preis auf lange Sicht.",
    ],
  },
  beschaeftigte: {
    name: "Erwerbstätige",
    einheit: "Mio.",
    dez: 1,
    gut: 1,
    bezug: "bev",
    beschreibung:
      "Erwerbstätige als Teil der Gesamtbevölkerung. Der helle Block sind alle Einwohner.",
    info: [
      "Alle Menschen mit bezahlter Arbeit, verglichen mit der Einwohnerzahl.",
      "Die Erwerbstätigen tragen Kinder, Rentner und Arbeitslose mit. Sinkt ihr Anteil, wird die Last pro Kopf schwerer.",
      "Deutschland liegt heute bei etwa 55 %. Unter 48 % wird die Last deutlich spürbar.",
      "Bevölkerung nach Alter, dazu Rentenalter und Zuwanderung. Bei Zuwanderung zählen Qualifikation und Integrationstempo.",
    ],
  },
  rentenausgaben: {
    name: "Rentenausgaben",
    einheit: "% BIP",
    dez: 1,
    gut: -1,
    nullbasis: true,
    beschreibung: "Öffentliche Rentenausgaben.",
    info: [
      "Öffentliche Ausgaben für Renten in Prozent der Wirtschaftsleistung.",
      "Das ist der größte Einzelposten im Sozialstaat, und er wächst mit der Alterung automatisch.",
      "Deutschland liegt heute bei etwa 10 %, Italien bei etwa 16 %.",
      "Rentner mal Rentenniveau mal Durchschnittslohn. Kapitaldeckung belastet anfangs doppelt und entlastet später.",
    ],
  },
  primaer: {
    name: "Primärsaldo",
    einheit: "% BIP",
    dez: 1,
    gut: 1,
    beschreibung: "Haushaltssaldo ohne Zinsen. Positiv heißt Überschuss.",
    info: [
      "Einnahmen minus Ausgaben des Staates, ohne Zinszahlungen.",
      "Zeigt, ob der Staat seine laufenden Aufgaben aus eigener Kraft deckt.",
      "Liegt der Zins über dem Wachstum, braucht es einen Überschuss, damit die Schuldenquote nicht steigt.",
      "Steuern (mit Laffer-Effekt) minus Staatsausgaben, Rente, Verteidigung und Kosten von Schocks. Eine Schuldenbremse steuert gegen.",
    ],
  },
  spielraum: {
    name: "Spielraum im Haushalt",
    einheit: "% der Einnahmen",
    dez: 0,
    gut: 1,
    warn: 10,
    nullbasis: true,
    beschreibung: "Was von den Staatseinnahmen bleibt, nachdem Zinsen, Renten und Sozialausgaben bezahlt sind.",
    info: [
      "Von 100 Einheiten Staatseinnahmen gehen Zinsen, Renten sowie Gesundheit, Familie und Arbeitslose ab. Der Rest bleibt für alles andere: Verteidigung, Bildung, Forschung, Infrastruktur, Polizei, Verwaltung.",
      "Wachsen Zinsen und Rentenlast, verdrängen sie die übrigen Aufgaben. Dann muss der Staat Steuern erhöhen, Leistungen kürzen oder alles andere auf Pump bezahlen.",
      "Deutschland lag 2025 bei rund 50, die USA bei knapp 40. Unter 10 wird es kritisch: Fast jede andere Aufgabe hängt dann an neuen Schulden. Negativ heißt: Zinsen und Sozialausgaben allein kosten mehr, als der Staat einnimmt.",
      "Einnahmen minus Zinsausgaben, Rentenausgaben und Sozialausgaben, geteilt durch die Einnahmen. Das Modell kürzt dabei nichts von selbst; es zeigt nur, wie eng es wird. Wie ein Staat reagieren würde, ist geplant (Spec 13.10).",
    ],
  },
  leistungsbilanz: {
    name: "Leistungsbilanz",
    einheit: "% BIP",
    dez: 1,
    gut: 0,
    beschreibung: "Exporte minus Importe plus Erträge aus dem Ausland.",
    info: [
      "Exporte minus Importe plus Erträge aus dem Auslandsvermögen, in % des BIP.",
      "Ein Überschuss heißt: Das Land verleiht Ersparnisse ans Ausland. Ein Defizit muss vom Ausland finanziert werden.",
      "Dauerhafte Defizite über 4 % machen verwundbar, wenn Kapital abfließt. Deutschland hat seit Jahren Überschüsse um 5 bis 7 %.",
      "Exporte folgen Weltnachfrage, Wechselkurs und Energiepreis; Importe folgen der Inlandsnachfrage und der Energierechnung.",
    ],
  },
  co2Mt: {
    name: "CO₂-Ausstoß",
    einheit: "Mio. t",
    dez: 0,
    gut: -1,
    nullbasis: true,
    beschreibung: "Kohlendioxid pro Jahr.",
    info: [
      "Kohlendioxid-Ausstoß des Landes in Millionen Tonnen pro Jahr.",
      "Zeigt, wie weit der Umbau der Energieversorgung ist.",
      "Deutschland lag 2024 bei rund 650 Mio. t; Ziel ist Klimaneutralität 2045.",
      "Der Strom-Anteil folgt dem Energiemix, der Rest sinkt mit dem CO₂-Preis. Beides wächst mit der Wirtschaftsleistung.",
    ],
  },
  gini: {
    name: "Ungleichheit der Einkommen (Gini)",
    einheit: "Index 0–100",
    dez: 1,
    gut: 0,
    beschreibung: "Wie ungleich die Einkommen verteilt sind. Im Modell nur grob.",
    info: [
      "Der Gini-Koeffizient misst, wie ungleich die Einkommen verteilt sind: 0 heißt, alle haben gleich viel, 100 heißt, einer hat alles. Statistikämter befragen dafür Haushalte nach ihrem Einkommen nach Steuern und Sozialleistungen und ordnen sie von arm nach reich.",
      "Er zeigt, ob Wachstum breit ankommt. Er misst Einkommen, nicht Vermögen: Vermögen ist viel ungleicher verteilt (Deutschland 2023: 72, Bundesbank). Sehr hohe Einkommen fehlen in Befragungen oft, die wahre Ungleichheit liegt deshalb eher höher.",
      "Eine Schwelle für gut oder kritisch gibt es nicht; wie viel Ungleichheit richtig ist, ist eine Wertfrage. Zur Einordnung: Deutschland liegt bei gut 30, die USA bei knapp 40. Vor Steuern und Sozialleistungen läge Deutschland bei rund 50 (OECD). Die Startwerte stammen für sieben Länder aus derselben Quelle (OECD, verfügbares Einkommen, nach Haushaltsgröße gewichtet) und sind vergleichbar. China und Russland misst die Weltbank anders (pro Kopf, je nach Land Einkommen oder Konsum); ihre Werte sind nicht direkt mit den übrigen vergleichbar.",
      "Grob: Startwert aus den Daten des Landes. Danach bewegen ihn die Arbeitslosigkeit, die Höhe des Lohnersatzes, die Steuern auf Einkommen, Kapitalertrag, Vermögen und Erbschaft, die Mehrwertsteuer, die Familienleistungen und das Rentenniveau. Die Wirkstärken stammen aus einem Ländervergleich der OECD-Daten und stehen in den Annahmen; einige sind dünn belegt und abschaltbar. Löhne, Teilzeit, Haushaltsgrößen und Vermögenspreise wirken nicht auf ihn; die Linie zeigt deshalb eher zu wenig Bewegung.",
    ],
  },
  vcQuote: {
    name: "Wagniskapital",
    einheit: "% BIP",
    dez: 2,
    gut: 1,
    nullbasis: true,
    beschreibung: "Kapital für junge Firmen.",
    info: [
      "Wagniskapital für junge Firmen in % des BIP.",
      "Aus Wagniskapital entstehen neue Firmen und Produkte. Pro Euro wirkt es stärker auf die Produktivität als klassische Forschung.",
      "Deutschland liegt bei etwa 0,07 %, die USA bei etwa 0,6 %.",
      "Grundniveau plus Anteil der Rentenfonds, gedämpft durch Steuer auf Firmenverkäufe und Gründungshürden. Wirkt mit rund 7 Jahren Verzug.",
    ],
  },
  knappheit: {
    name: "Knappheit",
    einheit: "Index",
    dez: 1,
    gut: -1,
    nullbasis: true,
    beschreibung: "Leere Regale durch Preiskontrollen. 0 heißt keine Knappheit.",
    info: [
      "Ein Maß für Warenmangel: kontrollierter Anteil des Warenkorbs mal aufgestauter Preisdruck. 0 heißt keine Knappheit.",
      "Preiskontrollen senken die gemessene Inflation, aber Anbieter liefern weniger. Es entstehen Schlangen, Schwarzmärkte und weniger Produktion.",
      "Einen festen Maßstab gibt es nicht. Jeder Wert über 0 heißt: Ein Teil der Inflation ist nur versteckt und kommt zurück, wenn die Kontrollen fallen.",
      "Der unterdrückte Teil der Inflation staut sich auf; fallen die Kontrollen, holen die Preise jedes Jahr die Hälfte nach. Das Angebot sinkt um 0,2 % je Punkt Knappheit.",
    ],
  },
  zinskurve: {
    name: "Zinskurve (10 Jahre minus Leitzins)",
    einheit: "Pp.",
    dez: 1,
    gut: 0,
    warn: 0,
    beschreibung: "Abstand der Rendite 10 Jahre zum Leitzins. Unter null ist die Zinskurve invers.",
    info: [
      "Die Rendite zehnjähriger Staatsanleihen minus Leitzins, in Prozentpunkten. Bei Gemeinschaftswährung zählt der Euroraum-Leitzins.",
      "Normal ist die lange Rendite höher. Liegt sie darunter, erwarten die Märkte sinkende Zinsen, meist wegen einer kommenden Abkühlung.",
      "In den USA ging einer inversen Zinskurve seit 1970 fast jede Rezession voraus (Estrella/Mishkin 1998), zuletzt 2006/07 und 2019.",
      "Rendite und Leitzins rechnet das Modell ohnehin; die Kurve ist nur ihre Differenz und wirkt auf nichts zurück. Bei gelenkter Währung setzt der Staat den Leitzins; dort gibt es keine Warnlampe.",
    ],
  },
  kreditluecke: {
    name: "Kreditlücke",
    einheit: "Pp.",
    dez: 1,
    gut: -1,
    warn: 10,
    beschreibung: "Abstand der Privatschuld zu ihrem langfristigen Trend. Über 10 Pp. droht eine Bankenkrise.",
    info: [
      "Privatschuld (% BIP) minus ihr langfristiger Trend, in Prozentpunkten (Credit-to-GDP Gap der BIS).",
      "Wächst der Kredit viel schneller als die Wirtschaft, entstehen Blasen. Die Lücke ist der beste bekannte Vorbote von Bankenkrisen.",
      "Vor der Finanzkrise 2008 lag sie in den USA, Spanien und Irland weit über 10 Pp. Basel III koppelt den antizyklischen Kapitalpuffer daran.",
      "Trend wie bei der BIS: einseitiger HP-Filter (nur Vergangenheit) mit λ = 1.562,5 für Jahresdaten, gestartet mit der IWF-Privatschuld seit 1950. Wirkt auf nichts zurück.",
    ],
  },
  hauspreis: {
    name: "Hauspreise (real)",
    einheit: "Index",
    dez: 0,
    gut: 0,
    beschreibung: "Preis von Wohnimmobilien ohne Inflation, Startjahr = 100.",
    info: [
      "Der Preis von Häusern und Wohnungen, bereinigt um die Inflation. Das Startjahr ist 100.",
      "Das Haus ist der größte Vermögenswert der meisten Haushalte und die wichtigste Sicherheit für Kredite. Steigen die Preise, gibt es mehr Kredit; mehr Kredit treibt die Preise weiter.",
      "In den USA stieg der reale Hauspreis 2000–2006 um 55 % und fiel dann um ein Drittel. In Spanien verdoppelte er sich bis 2007, in Japan fiel er nach 1991 um über 40 %. Ein Anstieg mit dem Einkommen ist unbedenklich.",
      "Ein Grundwert folgt dem Einkommen pro Kopf und dem Realzins. Der Preis kehrt langsam dorthin zurück, hat Schwung und steigt mit Kredit über dem Normalen. Aktienpreise fehlen bewusst: Blasen ohne Kredit kosten wenig. Das Platzen einer Blase entsteht im Modell nicht von selbst (Kritikpunkt M31).",
    ],
  },
  hausluecke: {
    name: "Hauspreis-Lücke",
    einheit: "%",
    dez: 1,
    gut: -1,
    warn: 15,
    beschreibung: "Abstand des realen Hauspreises zu seinem langfristigen Trend. Über 15 % droht eine Blase.",
    info: [
      "Realer Hauspreis minus sein langfristiger Trend, in Prozent.",
      "Kreditfinanzierte Immobilienblasen enden oft in Bankenkrisen. Zusammen mit der Kreditlücke warnt die Hauspreis-Lücke besser als jede allein (Borio/Drehmann 2009).",
      "Über 15 % gilt als Warnsignal. Nach einem Absturz kann die Lücke auch hoch sein, weil der Trend dem Absturz gefolgt ist: dann ist es eine Erholung, keine Blase.",
      "Trend wie bei der Kreditlücke: einseitiger HP-Filter (nur Vergangenheit), gestartet mit den realen Hauspreisen der BIS. Wirkt auf nichts zurück.",
    ],
  },
  bankKapital: {
    name: "Eigenkapital der Banken",
    einheit: "% der Bilanz",
    dez: 1,
    gut: 1,
    beschreibung: "Eigenes Geld der Banken je 100 verliehene. Der Puffer für Verluste.",
    info: [
      "Eigenkapital der Banken in Prozent ihrer Bilanz, ungewichtet. Das ganze Land ist im Modell eine einzige Bank.",
      "Verluste aus faulen Krediten gehen zuerst zulasten des Eigenkapitals. Ist es aufgezehrt, rettet der Staat oder die Bank kürzt Kredit. Mehr Eigenkapital verhindert Krisen nicht, macht sie aber milder (Jordà/Richter/Schularick/Taylor 2021). Dafür wird Kredit etwas teurer.",
      "Fällt die Quote mehr als ein Zehntel unter den heutigen Wert, kürzen die Banken Kredit. Unter der Hälfte füllt der Staat bei schneller Rettung auf.",
      "Vorjahr plus Gewinn minus Abschreibungen auf faule Kredite minus Kursverluste auf Staatsanleihen. Über dem Ziel wird ausgeschüttet. Verluste an Wertpapieren und im Ausland fehlen; Rettungen fallen deshalb zu klein aus (Kritikpunkt M32).",
    ],
  },
  npl: {
    name: "Faule Kredite",
    einheit: "% der Kredite",
    dez: 1,
    gut: -1,
    beschreibung: "Anteil der Bankkredite, die nicht mehr bedient werden.",
    info: [
      "Kredite, bei denen Zins oder Tilgung seit mehr als 90 Tagen ausbleiben, in Prozent aller Bankkredite.",
      "Faule Kredite werden abgeschrieben und zehren das Eigenkapital der Banken auf. Bleiben sie lange in den Büchern, vergeben die Banken jahrelang wenig neuen Kredit (Japan in den 1990ern).",
      "Normal sind 1 bis 3 %. In den USA waren es 2010 rund 5 %, in Spanien 2013 rund 9 %, in Irland 26 %.",
      "Der Zufluss steigt mit Arbeitslosigkeit über der strukturellen, mit fallenden Hauspreisen und mit Schuldendienst über der Schwelle. Ein Teil gesundet, ein Teil wird abgeschrieben; bei zögernder Rettung langsamer.",
    ],
  },
  schwarzmarkt: {
    name: "Schwarzmarkt-Aufschlag",
    einheit: "%",
    dez: 0,
    gut: -1,
    warn: 20,
    nullbasis: true,
    beschreibung: "So viel teurer sind Devisen auf dem Schwarzmarkt als zum offiziellen Kurs.",
    info: [
      "Der Abstand zwischen offiziellem Wechselkurs und dem Kurs auf dem Schwarzmarkt, in Prozent. Nur bei gelenkter Währung.",
      "Ein hoher Aufschlag heißt: Der offizielle Kurs ist zu teuer. Exporteure verlieren, Devisen werden knapp, Kapital flieht.",
      "Venezuela lag 2015 bei über 1.000 %, Argentinien 2023 bei rund 150 %. Über 20 % gilt als Warnsignal.",
      "Überbewertung des offiziellen Kurses gegenüber einem freien Schattenkurs, mal den Teil des Kapitalverkehrs, der gesperrt ist. Der Schattenkurs folgt Zins, Leistungsbilanz und Kapitalflucht.",
    ],
  },
  verdeckteSchuld: {
    name: "Verdeckte Schuld",
    einheit: "% BIP",
    dez: 1,
    gut: -1,
    warn: 15,
    nullbasis: true,
    beschreibung: "Faule Kredite der Staatsbanken, die noch nicht in der Staatsschuld stehen.",
    info: [
      "Kredite, die Staatsbanken auf politische Weisung vergeben haben und die nicht zurückgezahlt werden. Sie stehen noch nicht in der offiziellen Staatsschuld.",
      "Irgendwann muss der Staat sie übernehmen. Dann springt die Staatsschuld, ohne dass ein Defizit sichtbar war.",
      "Für China schätzt der IWF die Schulden der kommunalen Finanzierungsvehikel auf rund 50 % des BIP. Über 15 % gilt als Warnsignal.",
      "Ein Teil der gelenkten Investitionen wird jedes Jahr faul. Über der Schwelle des Landes (meist 20 % BIP) übernimmt der Staat die Summe in die Staatsschuld.",
    ],
  },
  rohstoffExporte: {
    name: "Rohstoffexporte",
    einheit: "% BIP",
    dez: 1,
    gut: 0,
    nullbasis: true,
    beschreibung: "Ausfuhr von Öl, Gas und Metallen.",
    info: [
      "Wert der Ausfuhr von Öl, Gas und Metallen in % des BIP.",
      "Rohstoffe bringen Staatseinnahmen, machen aber abhängig von Weltpreisen und Abnehmern. Ein Boom kann die übrigen Exporte verdrängen (holländische Krankheit).",
      "Russland liegt bei rund 15 %, Norwegen bei rund 20 %. Die G7 exportieren kaum Rohstoffe; Kanadas Energieexport läuft über die Energiebilanz.",
      "Fördermenge mal Weltpreis-Index gegenüber dem Start, bezogen auf die übrige Wirtschaft und zum realen Wechselkurs umgerechnet. Schwacher Rechtsstaat und hoher Staatsanteil lassen die Förderung verfallen; Sanktionen treffen weniger, je breiter die Abnehmer.",
    ],
  },
};

export const KACHELN: ReihenId[] = [
  "bipProKopf",
  "schuldQuote",
  "alq",
  "inflation",
  "spielraum",
];
export const MEHR: ReihenId[] = [
  "aufschlag",
  "energiepreis",
  "beschaeftigte",
  "rentenausgaben",
  "primaer",
  "leistungsbilanz",
  "co2Mt",
  "gini",
  "vcQuote",
  "knappheit",
  "schwarzmarkt",
  "verdeckteSchuld",
  "rohstoffExporte",
  "zinskurve",
  "kreditluecke",
  "hauspreis",
  "hausluecke",
  "bankKapital",
  "npl",
];

// Diagramme der Ordnung und Rohstoffe nur, wenn in einem der beiden Läufe etwas passiert.
const NUR_WENN_ETWAS: ReihenId[] = ["knappheit", "schwarzmarkt", "verdeckteSchuld", "rohstoffExporte"];
// Häuser und Banken (Spec 13.6) nur, wenn der Baustein in einem der beiden Läufe rechnet: Dann bewegt
// sich der Hauspreis. Bei „aus“ bleibt er auf 100, und es gibt kein leeres Diagramm.
const NUR_MIT_BANKEN: ReihenId[] = ["hauspreis", "hausluecke", "bankKapital", "npl"];
export function mehrFuer(verlauf: Zustand[], basis: Zustand[]): ReihenId[] {
  const banken = [...verlauf, ...basis].some((z) => z.hauspreis !== 100);
  return MEHR.filter((id) =>
    NUR_MIT_BANKEN.includes(id)
      ? banken
      : !NUR_WENN_ETWAS.includes(id) || [...verlauf, ...basis].some((z) => wertVon(z, id) !== 0),
  );
}

export function wertVon(z: Zustand, id: ReihenId): number {
  return z[id];
}

// Setzt das Währungssymbol des Landes in Einheiten wie „Tsd. {W}“ ein.
export function einheitFuer(r: Reihe, land: Landesdaten): string {
  return t(r.einheit).replace("{W}", land.waehrung.symbol);
}

// Angezeigte Texte einer Reihe in der gewählten Sprache (Spec 12c).
export const rName = (id: ReihenId) => tk(`r:${id}:name`, REIHEN[id].name);
export const rBeschreibung = (id: ReihenId) => tk(`r:${id}:beschreibung`, REIHEN[id].beschreibung);
export const rInfo = (id: ReihenId, i: number) => tk(`r:${id}:info:${i}`, REIHEN[id].info[i]);
export const lageName = (l: Lage) => t(LAGE_NAME[l]);
