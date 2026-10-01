import { tk } from "./sprache";
export type Bereich =
  | "Daten"
  | "Mechanik und Wirkstärken"
  | "Demografie"
  | "Oberfläche und Darstellung"
  | "Tests";

export interface Kritikpunkt {
  id: string;
  bereich: Bereich;
  titel: string;
  text: string;
  wirkung: string; // „hoch“, „mittel“, „gering“, ggf. mit Zusatz
  behebung: string;
  erledigt?: string; // z. B. „Phase 2“
  laender?: string[]; // nur für diese Länder (Code), ohne Angabe für alle
}

export const KRITIK: Kritikpunkt[] = [
  {
    "id": "D1", "laender": ["DE"],
    "bereich": "Daten",
    "titel": "Handwerte ungeprüft",
    "text": "Etwa 25 Startwerte für Deutschland sind aus Fachwissen gesetzt und nicht im Original nachgeschlagen, zum Beispiel Kapitalkoeffizient, Lohnquote, NAIRU, Nettoauslandsvermögen, Steuerbasen und Strommix. Abweichungen über 10 % sind möglich. Liste in [quellen.md](quellen.md). Seit Spec 13.1 schätzt ein Kalman-Filter NAIRU und Produktivitätstrend aus den Daten 2000–2025 mit Fehlerband (Annahmen, Datenlage). Für Deutschland liegen beide Handwerte im Band der Schätzung und bleiben (NAIRU 3,5 gegen geschätzt 3,2 ± 0,9; Produktivitätstrend 0,4 gegen 0,22 ± 0,24).",
    "wirkung": "mittel",
    "behebung": "Jeden Wert gegen die genannte Quelle prüfen, in `DE-hand.json` korrigieren und in `quellen.md` als „geprüft“ markieren."
  },
  {
    "id": "D2", "laender": ["DE"],
    "bereich": "Daten",
    "titel": "Steuerbasen kalibriert, nicht gemessen",
    "text": "Satz × Basis trifft das Aufkommen, die Basis selbst ist geschätzt. Das verzerrt die Laffer-Kurven.",
    "wirkung": "mittel",
    "behebung": "Bemessungsgrundlagen aus der BMF-Steuerschätzung und der Destatis-Statistik übernehmen."
  },
  {
    "id": "D3",
    "bereich": "Daten",
    "titel": "Ersatzwerte und ältere Reihen",
    "text": "Für acht Reihen liegt kein Wert im Datenstand-Jahr vor (u. a. Gini, Einnahmen, Ausgaben, Privatschuld). Das Modell nimmt ältere Werte oder Ersatzwerte. Die Oberfläche zeigt das noch nicht an.",
    "wirkung": "gering",
    "behebung": "Markierung in der Oberfläche anzeigen (Phase 2); Reihen bei jedem Datenlauf erneut prüfen.",
    "erledigt": "Phase 2"
  },
  {
    "id": "D4",
    "bereich": "Daten",
    "titel": "IMF-Projektionen in der Datei",
    "text": "`DE.json` enthält IMF-Werte bis 2031. Genutzt wird nur bis zum Vorjahr des Gerätedatums. Stimmt die Geräteuhr nicht, können Projektionen als Messwerte gelten.",
    "wirkung": "gering",
    "behebung": "Projektionen beim Holen abschneiden (nur Jahre ≤ letztes World-Bank-Jahr).",
    "erledigt": "Phase 2"
  },
  {
    "id": "D5", "laender": ["DE"],
    "bereich": "Daten",
    "titel": "Privatschuld: zwei Messkonzepte",
    "text": "Der IMF weist 139 % BIP aus, BIS-nahe Werte liegen bei rund 110 %. Die Schwelle für den Schuldendienst ist deshalb an die Modellrechnung angepasst (21 statt 17).",
    "wirkung": "mittel",
    "behebung": "Einheitlich BIS-Daten (Credit to private non-financial sector, Debt Service Ratio) verwenden."
  },
  {
    "id": "D6", "laender": ["CN", "RU"],
    "bereich": "Daten",
    "titel": "Datenqualität China/Russland",
    "text": "(ab Update 4): Zweifel an offiziellen BIP-Zahlen und zurückgehaltene Statistiken.",
    "wirkung": "hoch (für diese Länder)",
    "behebung": "Ampel ist vorgesehen; zusätzlich alternative Schätzungen einbinden, z. B. Nachtlicht-Studien."
  },
  {
    "id": "D7", "laender": ["DE"],
    "bereich": "Daten",
    "titel": "Historische Daten für den Rückblick ungeprüft",
    "text": "Weltpfade 2000–2025 (Öl, Gas, Kohle, EZB-Zins, Inflation, Weltwachstum, r*), Politikpfade (Steuersätze, Rentenalter, Rentenniveau, Zuwanderung, CO₂-Preis, EZB-Käufe) und Startwerte 2000 (inklusive Staatsausgaben ohne UMTS-Erlöse) sind aus Fachwissen gesetzt. Die Leistungsbilanz startet im Rückblick nicht auf dem Ist-Wert 2000 (Modell 0,3 statt −1,8 % BIP), weil Nettoauslandsvermögen und Energie-Exportanteil 2000 geschätzt sind. Seit Phase 2b auch Pfade für NAIRU, Erwerbsquote und Laufzeitprämie; der Produktivitätstrend 2000–2025 (0,3 %) ist an den Rückblick kalibriert. Seit Phase 3a zusätzlich: Rentenalter im Rückblick = tatsächliches Zugangsalter (DRV), Zensus-Korrektur 2011 als eigene Bereinigung der Bevölkerung (demo.zensusKorrektur) und Erwerbsquote, Fiskalpfade (Konjunkturpakete, Preisbremsen, Steuerreform 2000–2005, Finanztransaktionen). Diese Pfade sind Kalibrierentscheidungen: Sie verbessern den Rückblick, sind aber nicht einzeln gegen Quellen geprüft.",
    "wirkung": "hoch (für den Rückblick)",
    "behebung": "Jahreswerte aus Weltbank Pink Sheet, EZB Data Portal, Destatis und BMF nachtragen; Datei daten/laender/DE-historie.json."
  },
  {
    "id": "M1", "laender": ["DE"],
    "bereich": "Mechanik und Wirkstärken",
    "titel": "Rentenausgaben steigen steil",
    "text": ", von 10,3 auf etwa 15 % BIP bis 2050. Das Modell kennt keinen Nachhaltigkeitsfaktor und keine Kopplung des Rentenalters an die Lebenserwartung. Der Beitragssatz steigt deshalb um etwa 8 Pp. Offizielle Projektionen liegen niedriger. Im Rückblick steigen die Renten von 11 auf 15 % BIP statt real um 10 %.",
    "wirkung": "hoch",
    "behebung": "Nachhaltigkeitsfaktor als Schalter ergänzen; gegen den Ageing Report der EU und den Rentenversicherungsbericht kalibrieren."
  },
  {
    "id": "M2",
    "bereich": "Mechanik und Wirkstärken",
    "titel": "Beitragsanstieg wirkt nur über die Erwerbsbeteiligung",
    "text": "Lohnnebenkosten, Schwarzarbeit und Abwanderung reagieren nicht.",
    "wirkung": "mittel",
    "behebung": "Kanal über Arbeitskosten und Wettbewerbsfähigkeit ergänzen."
  },
  {
    "id": "M3",
    "bereich": "Mechanik und Wirkstärken",
    "titel": "Ventile bei Überschuldung: Argentinien 2001 fehlt noch",
    "text": "Seit dem Mechanismus vom 29.09.2026 hängt der Risikoaufschlag nicht mehr nur am Schuldenstand: Auslandsschuld über 60 % BIP (0,03 Pp. je Pp.), Primärdefizit über 3 % BIP (0,25 Pp. je Pp., Laubach 2009) und bei gemeinsamer Währung ohne Schutzprogramm oder harter Währung eine Panik-Verstärkung über 5 Pp. (De Grauwe 2011); eine Reservewährung schützt, gelenkte Währungen nutzen ihren eigenen Kanal. Griechenland öffnet das Ventil jetzt 2012 wie beim realen Schuldenschnitt. Offen: Argentinien 2001 unter harter Währung kippt nicht (Aufschlag 2,8 statt über 40 Pp.), weil die Überbewertung von außen kam (Abwertung Brasiliens 1999, starker Dollar) und das Modell keine Wechselkurse von Handelspartnern kennt; der Einbruch Griechenlands bleibt mit −14 % kleiner als die beobachteten −25 %. Schnitt 50 % und Monetarisierung +8 Pp. für 3 Jahre bleiben Einzelfall-Werte. Basisläufe: USA Schuld 2075 358 statt 336 % (bröckelnder Reservestatus), Frankreich 314 statt 321 %, Italien 440 statt 426 %, Ventiljahre unverändert; die übrigen Länder unverändert. Der Einbruch Griechenlands liegt mit −14 % knapp am Kriterium −15 %. Seit Spec 13.5 Teil A erreicht Argentinien 2002 die Lage „Krise“, aber über den Kredit-Sägezahn (M30), nicht über die Überbewertung; die Lücke bleibt.",
    "wirkung": "mittel (harte Währung, große Einbrüche)",
    "behebung": "Weltpfad für den Wechselkurs der Handelspartner (Partnerabwertung als Schock); Einbruchstiefe nach Schuldenschnitt an Griechenland und Argentinien prüfen."
  },
  {
    "id": "M4",
    "bereich": "Mechanik und Wirkstärken",
    "titel": "Marktdisziplin",
    "text": "(1 Pp. Sparen je Pp. Aufschlag) ist eine Annahme mit einer Quelle. Das kann den Sparzwang überzeichnen.",
    "wirkung": "mittel",
    "behebung": "Wert an Fiskalreaktions-Studien für mehrere Länder schätzen; ist als umstritten abschaltbar."
  },
  {
    "id": "M5",
    "bereich": "Mechanik und Wirkstärken",
    "titel": "Risikoaufschlag-Kurven je Regime",
    "text": "sind aus der Literatur übernommen, nicht für jedes Land geschätzt.",
    "wirkung": "hoch",
    "behebung": "Mit Renditedaten 2000–heute je Land kalibrieren (Rückblick-Test, Phase 2)."
  },
  {
    "id": "M6",
    "bereich": "Mechanik und Wirkstärken",
    "titel": "Vermögensteuer hat kaum Nachteile",
    "text": "Sie hat eine hohe Basis, wirkt schwach auf das Ausweichen und fehlt im Kapitalkostenkeil der Investitionen.",
    "wirkung": "mittel",
    "behebung": "In den Kapitalkostenkeil aufnehmen; Elastizität je Vermögensart."
  },
  {
    "id": "M7",
    "bereich": "Mechanik und Wirkstärken",
    "titel": "Energie nur über Strom",
    "text": "Mix und Preis beschreiben Strom; Wärme und Verkehr stecken grob im „Rest-CO₂“. Die Importquote skaliert mit dem fossilen Stromanteil.",
    "wirkung": "mittel",
    "behebung": "Sektoren Wärme und Verkehr ergänzen; Primärenergie-Bilanz (AG Energiebilanzen)."
  },
  {
    "id": "M8",
    "bereich": "Mechanik und Wirkstärken",
    "titel": "Stromkosten-Formel vereinfacht:",
    "text": "feste Brennstoff-Umrechnungen, Integrationskosten quadratisch im Erneuerbaren-Anteil.",
    "wirkung": "mittel",
    "behebung": "Gegen Strommarkt-Studien (Agora, EWI) kalibrieren."
  },
  {
    "id": "M9",
    "bereich": "Mechanik und Wirkstärken",
    "titel": "Exporte:",
    "text": "Die Elastizität auf die Weltnachfrage (0,3) ist so gesetzt, dass die Exportquote plausibel bleibt, nicht geschätzt.",
    "wirkung": "mittel",
    "behebung": "Aus Handelsdaten schätzen."
  },
  {
    "id": "M10",
    "bereich": "Mechanik und Wirkstärken",
    "titel": "Innovation:",
    "text": "F&E-Rendite 0,2 und Wagniskapital-Faktor 3,5 stammen aus je einer Studie; die Spanne in der Literatur ist groß.",
    "wirkung": "hoch (für die Wachstumspakete)",
    "behebung": "Spanne zeigen (Band statt Linie) oder Meta-Studien nutzen."
  },
  {
    "id": "M11",
    "bereich": "Mechanik und Wirkstärken",
    "titel": "Fiskalmultiplikator fest",
    "text": "(0,8), unabhängig von Zinsniveau, Konjunktur und Regime.",
    "wirkung": "mittel",
    "behebung": "Zustandsabhängiger Multiplikator (höher an der Zinsuntergrenze)."
  },
  {
    "id": "M12",
    "bereich": "Mechanik und Wirkstärken",
    "titel": "Kreditzyklen gedämpft",
    "text": "Die normale Kreditausweitung folgt dem Trendwachstum, das verhindert eine künstliche Schwingung, glättet aber echte Booms. Geprüft in Spec 13.5 Teil A (Macrohistory-Datenbank, 18 Länder): Kredit folgt der Produktionslücke (+0,45 Pp. BIP je % Lücke), eingebaut entstünde daraus aber kein Boom, weil die Schleife abklingt, und der Rückblick Deutschland würde schlechter. Deshalb nicht übernommen. Übernommen ist die zweite Hälfte: Ein Kreditrückgang wirkt stärker auf die Nachfrage als ein Zuwachs (Faktor 1,2 statt gemessen 1,42). Seit Spec 13.6 entsteht ein Kreditboom über die Hauspreise, wenn die Grundeinstellung „Häuser und Banken“ an ist: Billiges Geld hebt Preise und Kredit gemeinsam (USA 2000–2006 fast wie gemessen). Im Standard ist sie aus, dann gilt dieser Punkt unverändert.",
    "wirkung": "mittel (im Standard fehlen Kreditbooms und Bankenkrisen)",
    "behebung": "Teilweise behoben mit Spec 13.6 (zuschaltbar). Für den Standard müssen erst die Lücken M31–M33 geschlossen werden."
  },
  {
    "id": "M13",
    "bereich": "Mechanik und Wirkstärken",
    "titel": "„Gelenkte Währung“",
    "text": "rechnet wie eine eigene Währung. Deshalb ist sie in der Oberfläche ausgeblendet; ein geteilter Link mit dieser Einstellung rechnet weiter wie eine eigene Währung.",
    "wirkung": "gering (ausgeblendet)",
    "behebung": "Update 4 (Wirtschaftsordnung, China, Russland).",
    "erledigt": "Update 4a: eigene Mechanik (politischer Leitzins, Schattenkurs, Schwarzmarkt, Abwertungsrisiko)"
  },
  {
    "id": "M14",
    "bereich": "Mechanik und Wirkstärken",
    "titel": "Armut und Gini",
    "text": "bleiben grobe Näherungen. Seit Spec 13.13 wirken neben Arbeitslosigkeit und Lohnersatz auch Steuern, Familienleistungen und Rentenniveau, mit Wirkstärken aus einem Ländervergleich der OECD-Daten. Fünf der sieben sind dünn belegt (Familienleistungen beim Gini, Kapital und Vermögen, Mehrwertsteuer, Rentenniveau). Sozialabgaben wirken nicht auf den Gini. Löhne, Teilzeit, Haushaltsgrößen und Vermögenspreise fehlen: Den Anstieg des deutschen Gini 2000–2005 trifft der Rückblick nicht.",
    "wirkung": "mittel",
    "behebung": "Verteilungsmodell (Einkommensdezile) oder Kalibrierung an EU-SILC."
  },
  {
    "id": "M15",
    "bereich": "Mechanik und Wirkstärken",
    "titel": "Erwerbsbeteiligung und NAIRU ohne Trend",
    "text": "Erwerbsquote und strukturelle Arbeitslosigkeit sind fest. Arbeitsmarktreformen (Hartz 2003–2005), steigende Frauen- und Älterenbeschäftigung fehlen. Im Rückblick bleibt die Arbeitslosigkeit bei etwa 7 %, real fiel sie von 11 auf 3 %. Die Rentenlast pro Beschäftigtem steigt dadurch zu stark.",
    "wirkung": "hoch",
    "behebung": "NAIRU und Erwerbsquote als Stellschrauben mit Zeitpfad; Reformwirkung an Hartz-Evaluationen (IAB) kalibrieren.",
    "erledigt": "Phase 2b: NAIRU und Erwerbsquote als Stellschrauben mit Zeitpfad"
  },
  {
    "id": "M16",
    "bereich": "Mechanik und Wirkstärken",
    "titel": "Laufzeitprämie fest",
    "text": "Die Laufzeitprämie wird im Startjahr kalibriert und bleibt dann gleich. Im Rückblick liegen die Renditen 2012–2021 deshalb 2–3 Pp. über der Wirklichkeit.",
    "wirkung": "mittel",
    "behebung": "Laufzeitprämie abhängig von Notenbankkäufen und globalem Sparüberhang (ACM-Schätzungen).",
    "erledigt": "Phase 2b: Weltpfad für die Laufzeitprämie"
  },
  {
    "id": "B1",
    "bereich": "Demografie",
    "titel": "Zuwanderungsjahrgänge schrumpfen nicht",
    "text": "(keine Sterblichkeit, keine Rückwanderung). Alle Zugewanderten zählen als erwerbsfähig, auch Kinder bei Ankunft. Bei sehr hoher Zuwanderung wird die einheimische Erwerbsbevölkerung unterschätzt.",
    "wirkung": "mittel (bei hoher Zuwanderung)",
    "behebung": "Jahrgänge nach Alter führen, Rückwanderungsquote (Destatis) ergänzen."
  },
  {
    "id": "B2",
    "bereich": "Demografie",
    "titel": "Abwanderung Qualifizierter ist eine feste Zahl",
    "text": ", keine Quote. Über 100 Jahre bei schrumpfender Bevölkerung wird das extrem.",
    "wirkung": "gering",
    "behebung": "Als Quote der Erwerbsfähigen modellieren."
  },
  {
    "id": "B3",
    "bereich": "Demografie",
    "titel": "Sterblichkeit nach Gompertz",
    "text": ", ohne Säuglingssterblichkeit. Lebenserwartungen über etwa 99 Jahre sind nicht darstellbar (der Wert wird still gedeckelt).",
    "wirkung": "gering",
    "behebung": "Sterbetafel des Destatis als Basis, Gompertz nur für den Trend."
  },
  {
    "id": "B4",
    "bereich": "Demografie",
    "titel": "Geburten nach fester Glockenkurve",
    "text": "um 31 Jahre, Frauenanteil 50 %.",
    "wirkung": "gering",
    "behebung": "Altersspezifische Geburtenziffern aus der Statistik."
  },
  {
    "id": "B5",
    "bereich": "Demografie",
    "titel": "Auswandernde Rentner fehlen",
    "text": "Wer im Ruhestand ins Ausland zieht (Wetter, Lebenshaltungskosten), bezieht weiter Rente, konsumiert aber nicht mehr im Inland. Das Modell kennt diesen Abfluss nicht: Die Nachfrage hängt an Staatsausgaben, Zins und Kredit, nicht am Konsum der Bevölkerung. Rentner einfach aus der Bevölkerung zu nehmen wäre falsch, weil dann auch die Rentenausgaben sinken.",
    "wirkung": "gering",
    "behebung": "Renten ins Ausland als Abfluss in der Leistungsbilanz (Sekundäreinkommen) führen, Rentner bleiben in der Rentenrechnung; Zahlen aus der DRV-Statistik der Auslandsrenten."
  },
  {
    "id": "B6", "laender": ["US", "JP", "GB", "FR", "IT", "CA"],
    "bereich": "Demografie",
    "titel": "Migrationswerte außer der Nettozuwanderung sind deutsche",
    "text": "Jedes Land hat eine eigene Nettozuwanderung. Alles Übrige ist aus Deutschland übernommen: Qualifikationsmix, Zuwanderungswege, Ziel-Beschäftigungsquoten (82/70/55 %), Wartezeiten, Integrationstempo und -kosten, Alter bei Ankunft. Für Einwanderungsländer mit Punktesystem wie Kanada unterschätzt das die Beschäftigung Zugewanderter, für Länder mit langen Arbeitsverboten kann es sie überschätzen.",
    "wirkung": "mittel",
    "behebung": "Landeswerte aus OECD International Migration Outlook und OECD/EU Indicators of Immigrant Integration in die jeweilige *-hand.json unter standards eintragen."
  },
  {
    "id": "U1",
    "bereich": "Oberfläche und Darstellung",
    "titel": "Lage-Einstufung",
    "text": "(blüht, stagniert, überhitzt, kippt) nutzt feste Schwellen. Deutschland „blüht“ bei 1 % Wachstum pro Kopf fast nie.",
    "wirkung": "mittel (Wahrnehmung)",
    "behebung": "Schwellen je Land oder relativ zum Trend.",
    "erledigt": "Phase 3b: neun Lagen mit Fachbegriffen, Wachstum pro Kopf, Schwellen im Verzeichnis"
  },
  {
    "id": "U2",
    "bereich": "Oberfläche und Darstellung",
    "titel": "Unsicherheitsband: Wirkstärken streuen, verbreitern es aber kaum",
    "text": "Seit Oktober 2026 zieht jeder Zufallslauf 19 Wirkstärken mit belegter Spanne (im Verzeichnis neben dem Wert) und, wo es eine Schätzung gibt, den Produktivitätstrend aus ihrem Band. Breiter wird das Band fast nur durch den Trend: BIP pro Kopf 2050 in Deutschland 55 bis 66 statt 58 bis 61 Tsd. €, in Großbritannien 46 bis 60 statt 50 bis 52, in China und Russland (keine gültige Schätzung) unverändert. Die Wirkstärken allein ändern das Band der Basisläufe kaum, weil sie vor allem die Antwort auf Schocks, Hebel und Banken betreffen. Im Rückblick Deutschland 2000–2025 ohne die gesetzten Schocks liegt das gemessene Wachstum weiter in 68 % der Jahre im Band (Soll 80 %), die Arbeitslosigkeit in 72 %, die Staatsschuld in 48 %, die Leistungsbilanz nie, weil dort die Linie selbst danebenliegt (M17, M20). Ohne Spanne bleiben die Lehrbuchwerte (Okun, Phillips-Kurve, Zinswirkung, Beharrung der Lücke).",
    "wirkung": "mittel (Wahrnehmung: Das Band wirkt genauer, als das Modell ist)",
    "behebung": "Spannen für die Lehrbuchwerte aus Länderschätzungen belegen (etwa Okun-Koeffizienten je Land); den Trend auch im Rückblick aus einer Schätzung bis zum Startjahr ziehen."
  },
  {
    "id": "U3",
    "bereich": "Oberfläche und Darstellung",
    "titel": "Paket-Gleiten",
    "text": "überschreibt Eingaben, die in denselben 400 ms gemacht werden. Ein kürzerer Horizont löscht spätere Schocks.",
    "wirkung": "gering",
    "behebung": "Beim nächsten Umbau der Simulation beheben.",
    "erledigt": "Phase 2"
  },
  {
    "id": "U4",
    "bereich": "Oberfläche und Darstellung",
    "titel": "Barrierefreiheit:",
    "text": "Sanftes Scrollen trotz reduzierter Bewegung; Diagramm-Animation 1,5 s statt 0,35 s; beim Zeitraffer bekommen Screenreader zu viele Ansagen.",
    "wirkung": "gering",
    "behebung": "Kleine Korrekturen in Phase 2.",
    "erledigt": "Phase 2"
  },
  {
    "id": "T1", "laender": ["DE"],
    "bereich": "Tests",
    "titel": "Rückblick-Test: zwei Größen schwach, vier verfehlen das Band-Ziel",
    "text": "Ergebnis 2000 → 2025 für Deutschland nach Phase 3a (Anteil Jahre im Band · Theil's U gegen „alles bleibt“ · Urteil): BIP-Wachstum 68 % · 0,70 · Ziel erreicht; Inflation 80 % · 0,80 · Ziel erreicht; Arbeitslosenquote 64 % · 0,53 · Ziel knapp verfehlt; Staatsschuldenquote 44 % · 1,25 · Hürde verfehlt (bekannte Schwäche, Spec 11); Bevölkerung 84 % · 0,53 · Ziel erreicht; Erwerbsbevölkerung 28 % · 0,15 · Ziel verfehlt (Band sehr schmal, Fehler klein); Rentenausgaben 36 % · 0,99 · Ziel verfehlt, Hürde knapp; Leistungsbilanz 8 % · 0,94 · Ziel verfehlt, Richtung stimmt, Niveau 2015–2025 zu niedrig; Rendite 68 % · 0,43 · Ziel erreicht.",
    "wirkung": "hoch",
    "behebung": "Schuld: Sondermaßnahmen (Bankenrettung, Nullzins, Hilfen) sind keine Standardmechanik, siehe M17. Leistungsbilanz: M20. Rentenausgaben: D10. Modell-Inflation liegt 2004–2018 rund 1 Pp. über dem Ist (M21)."
  },
  {
    "id": "T2",
    "bereich": "Tests",
    "titel": "Einige Tests können kaum scheitern",
    "text": "Die Prüfung „gestapelte Schocks kippen“ ist durch die Schock-Tabelle garantiert, und es fehlt eine exakte Geldfluss-Prüfung des Rentenfonds.",
    "wirkung": "gering",
    "behebung": "Tests nachschärfen."
  },
  {
    "id": "T3",
    "bereich": "Tests",
    "titel": "Historische Kalibrierfälle",
    "text": "(Venezuela, UdSSR, DDR …) fehlen noch; die Ordnungs-Mechanik ist neutral.",
    "wirkung": "hoch (für Update 4)",
    "behebung": "Update 4c.",
    "erledigt": "Update 4c: acht Fälle als Tests (modell/tests/kalibrierung.test.ts); verfehlte Kriterien als bekannte Lücken M3, M26, M27"
  },
  {
    "id": "U5",
    "bereich": "Oberfläche und Darstellung",
    "titel": "Vergleich liest gespeicherte Szenarien nicht live",
    "text": "Wird ein gespeichertes Szenario überschrieben oder gelöscht, während es im Vergleich gewählt ist, zeigt der Vergleich bis zum nächsten Wechsel alte Zahlen. Neu gespeicherte erscheinen erst nach einem Neuzeichnen. Ist der Browser-Speicher gesperrt, fehlen sie im Vergleich ganz.",
    "wirkung": "gering",
    "behebung": "Gespeicherte Szenarien als gemeinsamen Zustand führen (useSyncExternalStore)."
  },
  {
    "id": "U6",
    "bereich": "Oberfläche und Darstellung",
    "titel": "Warnlampen-Schattierung ungenau",
    "text": "Einjährige Warnungen erscheinen im Diagramm ohne Fläche, mehrjährige verlieren je ein halbes Jahr an den Rändern. Die Warnlampen werden zweimal je Bild gerechnet.",
    "wirkung": "gering",
    "behebung": "Numerische Jahresachse mit ±0,5 Jahre Rand; Warnlampen einmal berechnen und weitergeben."
  },
  {
    "id": "U7",
    "bereich": "Oberfläche und Darstellung",
    "titel": "Barrierefreiheit: Reiter, Auswahl, Meldungen",
    "text": "Die Reiter haben keine Tastatur-Pfeilsteuerung und keine verknüpften Panels. Die gewählte Zeile im Rückblick wird Screenreadern nicht mitgeteilt. Speichermeldungen werden beim ersten Mal eventuell nicht angesagt. Speichern unter vorhandenem Namen überschreibt ohne Hinweis.",
    "wirkung": "gering",
    "behebung": "WAI-ARIA-Tabs-Muster; aria-pressed; Live-Region dauerhaft einhängen; Überschreiben bestätigen lassen."
  },
  {
    "id": "U8",
    "bereich": "Oberfläche und Darstellung",
    "titel": "Annahmen-Ansicht zeigt keine Schwellen",
    "text": "Die Ansicht listet Wirkstärken, aber nicht die Schwellen der Lage-Einstufung (z. B. Kipp-Schwelle Risikoaufschlag 3 Pp.), obwohl die Spec alle Einträge des Verzeichnisses verlangt.",
    "wirkung": "gering",
    "behebung": "Schwellen als eigenen Abschnitt aufnehmen."
  },
  {
    "id": "M17", "laender": ["DE"],
    "bereich": "Mechanik und Wirkstärken",
    "titel": "Einmalige Staatslasten fehlen",
    "text": "Bankenrettung 2008–2010, Konjunkturpakete und die Corona-Hilfen über die Schock-Tabelle hinaus erhöhen die echte Schuld stark. Im Modell fehlen sie, deshalb liegt die Schuldenquote im Rückblick um etwa 20 Pp. zu niedrig.",
    "wirkung": "hoch (für die Schuld)",
    "behebung": "Teilweise behoben (Phase 3a): Finanztransaktionen als Stellschraube, Historie DE gesetzt. Die Schuld bleibt im Rückblick trotzdem zu niedrig (U 1,25); die übrigen Sondermaßnahmen gelten als Antwort auf seltene Großereignisse und gehören nicht ins Standardmodell. Seit Spec 13.6 kann das Modell eine Bankenrettung selbst rechnen (Grundeinstellung „Häuser und Banken“, im Standard aus); im Rückblick bleibt die Rettung 2008–2010 ein gesetzter Pfad, weil die deutschen Verluste aus US-Papieren kamen."
  },
  { id: "D8", laender: ["US", "JP"], bereich: "Daten", titel: "Handwerte USA und Japan ungeprüft",
    text: "Steuersätze und -basen, Rentenparameter, Energiemix, Nettoauslandsvermögen, Notenbankbestände und Zinsen für die USA und Japan sind aus Fachwissen gesetzt. Seit Spec 13.1 bestätigt der Kalman-Filter NAIRU und Produktivitätstrend der USA sowie die NAIRU Japans (Handwert im Band). Japans Produktivitätstrend (geschätzt −0,08) bleibt nach Urteil Handwert (Abstand zum IWF).",
    wirkung: "mittel", behebung: "Gegen BEA, SSA, Fed, Cabinet Office, BoJ, MHLW prüfen; Muster wie D1." },
  { id: "M18", laender: ["US", "JP"], bereich: "Mechanik und Wirkstärken", titel: "Rentenanpassung nach Landesrecht fehlt",
    text: "Die USA kürzen Leistungen automatisch, wenn der Social-Security-Fonds erschöpft ist (absehbar um 2033); Japan senkt Leistungen über den Makro-Slide. Das Modell kennt nur die deutsche Beitragsanpassung; für USA und Japan ist sie aus, der Anstieg landet im Defizit.",
    wirkung: "hoch (USA, Japan)", behebung: "Leistungsanpassung als zweite Automatik (Rentenniveau statt Beitrag), je Land Standard nach Recht." },
  { id: "M19", bereich: "Mechanik und Wirkstärken", titel: "Wechselkurs zum Euro fest",
    text: "Euro-Beträge (CO₂-Preis, Integrationskosten, Zuschüsse) werden mit einem festen Kurs umgerechnet; Weltpreise für Energie gelten für alle Länder in Euro.",
    wirkung: "gering", behebung: "Kurs an den realen Wechselkurs des Modells koppeln." },
  { id: "T4", bereich: "Tests", titel: "Rückblick-Test nur für Deutschland",
    text: "Für die USA und Japan gibt es noch keine historischen Politik- und Weltpfade.",
    wirkung: "hoch (USA, Japan)", behebung: "Historie-Dateien US/JP nach dem Muster von DE-historie.json." },
  {
    "id": "U9",
    "bereich": "Oberfläche und Darstellung",
    "titel": "Länderwechsel ohne Browser-Verlauf",
    "text": "Der Wechsel des Landes ersetzt die Adresse, statt einen Verlaufseintrag anzulegen. „Zurück“ im Browser führt deshalb nicht zum vorherigen Land.",
    "wirkung": "gering",
    "behebung": "pushState beim Wechsel und popstate-Listener."
  },
  {
    "id": "U10",
    "bereich": "Oberfläche und Darstellung",
    "titel": "Zuwanderungs-Regler für alle Länder bis 3.000 Tsd.",
    "text": "Der Bereich wurde für die USA erweitert und gilt nun auch für Deutschland und Japan.",
    "wirkung": "gering",
    "behebung": "Bereiche je Land in der Handdatei überschreibbar machen."
  },
  {
    "id": "D9", "laender": ["JP"],
    "bereich": "Daten",
    "titel": "Staatsschuld Japan niedriger als erwartet",
    "text": "Die geholte IMF-Reihe zeigt für Japan 2025 rund 207 % BIP; der World Economic Outlook nennt eher 230–240 %. Möglicherweise unterschiedliche Abgrenzung oder Stand.",
    "wirkung": "mittel (Japan)",
    "behebung": "Reihe und Abgrenzung (brutto, Zentralstaat/Gesamtstaat) prüfen; notfalls Handwert mit Quelle."
  },
  { id: "D10", laender: ["DE"], bereich: "Daten", titel: "Rentenausgaben-Ist aus Handwerten",
    text: "Die Ist-Reihe der Rentenausgaben 2000–2025 (% BIP) im Rückblick stammt aus Handwerten nach OECD SOCX und DRV, nicht aus einer geholten Reihe.",
    wirkung: "mittel (für den Rückblick)", behebung: "Reihe aus OECD SOCX oder DRV-Rentenversicherungsbericht holen und ersetzen." },
  { id: "M20", bereich: "Mechanik und Wirkstärken", titel: "Außenhandel driftet langfristig",
    text: "Seit Phase 3a folgen Exporte der Weltnachfrage (Elastizität 1) und Importe dem eigenen Einkommen (1,5), Exporte ziehen Vorleistungsimporte nach (25 %), Auslandsvermögen erhöht die Ausgaben (4 % pro Jahr) und hebt den Gleichgewichtskurs (1 % je 1 Pp. BIP, kalibriert). Weil die Weltnachfrage nach vorn dauerhaft 2,5 % wächst, Deutschland und Japan aber deutlich langsamer, wachsen trotzdem Exportquote (DE 2075 rund 68 % BIP), Auslandsvermögen (DE 216 %, JP 253 % BIP) und vor allem der reale Kurs (DE 2050 +55 %, 2075 gut das Doppelte; JP 2,6-fach). Die Leistungsbilanz bleibt plausibel (DE und JP 4–8 % BIP, USA um −2 %). Die starke Aufwertung senkt die Inflation um 0,1–0,3 Pp. und hebt die Schuldenquote 2075 um bis zu 12 Pp. Ein Wächtertest über 100 Jahre verhindert, dass es schlimmer wird.",
    wirkung: "mittel (Zukunft ab ca. 2050)", behebung: "Aufholen der Konkurrenz als eigene Mechanik (Marktanteile, Krugmans 45-Grad-Regel) oder handelsgewichtete statt weltweite Nachfrage je Land; danach Gleichgewichtskurs wieder schwächer." },
  { id: "T5", bereich: "Tests", titel: "Kleinere Befunde aus der Prüfung von Phase 3a",
    text: "(1) Lebenserwartung im Rückblick behält nach dem letzten Datenjahr die letzte Jahresänderung bei. (2) Fehlt das Startjahr einer Ist-Reihe, gibt es kein Vergleichsmodell und das Urteil ist „keine Daten“. (3) Eine exakt gerade Ist-Reihe hat ein Band der Breite null; der Testname „ist null“ prüft 0. (4) Liefert das Modell NaN, zeigt die Ansicht „∞“ statt eines Fehlers. (5) Ist der Import kleiner als ein Viertel des Exports, trifft das erste Jahr den Startwert nicht (heute nicht erreichbar). (6) Fehlt die Leistungsbilanz im Datenjahr, wird der Rest stumm 0. (7) Der Test „ohne Historie kein Hürdentest“ kann für USA und Japan nicht scheitern; die Rentenausgaben bestehen die Hürde nur knapp (U 0,99). (8) Das Feld defizitNom enthält die Finanztransaktionen.",
    wirkung: "gering", behebung: "Einzeln beheben, wenn die Stelle angefasst wird; Vorschläge im Prüfbericht Phase 3a." },
  { id: "M21", laender: ["DE"], bereich: "Mechanik und Wirkstärken", titel: "Modell-Inflation im Rückblick zu hoch",
    text: "Von 2004 bis 2018 liegt die Modell-Inflation rund 1 Pp. über dem Ist. Das hebt das nominale BIP, drückt die Schuldenquote und verteuert Deutschland real im Euroraum. Eine Anbindung der Erwartungen an den Euroraum-Pfad half der Schuld, verschlechterte aber das Wachstum (U 0,69 → 0,96) und wurde verworfen.",
    wirkung: "mittel", behebung: "Lohn- und Preisbildung (Lohnzurückhaltung 2003–2008) als eigene Mechanik prüfen." },
  { id: "M22", laender: ["JP"], bereich: "Mechanik und Wirkstärken", titel: "Leitzins springt zum Start",
    text: "Japan startet mit 3,2 % Inflation. Die Notenbank-Regel hebt den Leitzins 2026 in einem Schritt von 0,4 auf 3,5 %. Darauf folgen 2027 ein Kreditimpuls von −5 % BIP und 2028 eine Produktionslücke von −3,2 %: Japan zeigt ohne Schocks ein Rezessionsjahr (pro Kopf −1,2 %). Seit Phase 3b ist das als Lage sichtbar; vorher ergab ein einzelnes Minusjahr nur „stagniert“. Der Test „ohne Schocks selten“ erlaubt deshalb höchstens ein solches Jahr je Land.",
    wirkung: "gering (ein Jahr, Japan)", behebung: "Zinsglättung in der Notenbank-Regel (Leitzins folgt der Regel nur teilweise pro Jahr), danach den Test wieder auf „nie“ stellen." },
  { id: "M23", laender: ["US"], bereich: "Mechanik und Wirkstärken", titel: "USA: Wachstum und Staatsschuld gegen CBO, Fed und IWF",
    text: "Sanity-Check 28.09.2026. Vorher rechnete das Modell für die USA mit rund 1,0 % realem Wachstum (2026–2035); CBO sieht 2,1 % (2026–2030) und 1,8 % (2031–2036), die Fed langfristig 2,0 %. Ursache war die Produktivität, nicht das Arbeitsangebot (Modell −0,1 % pro Jahr, CBO nahe null). Behoben über zwei Handwerte: Kapitalkoeffizient 3,2 → 2,75 (sonst Abschreibungen 19,2 statt 16,3 % BIP laut BEA) und TFP-Trend 0,8 → 1,0 (= Produktivitätsgrenze). Seitdem 1,6 % (2026–2035). Offen bleiben: (0) Startdefizit geprüft: Einnahmen und Ausgaben (IMF Public Finances in Modern History, 2024) ergeben 8,0 % Defizit, der aktuelle WEO nennt 7,9 % (Deutschland 2,6 gegen 2,7 %, Japan 1,5 gegen 1,7 %). Ein früherer Vergleich mit 7,3 % beruhte auf einem veralteten WEO-Stand. Offen bleibt: Der IWF erwartet für die USA 2025 eine Besserung auf 6,8 % und 2026 7,5 %, das Modell bleibt bei rund 8 %; die Politik ab 2025 (vor allem Zolleinnahmen) kennt es nicht. Ein niedrigerer effektiver Zins (2,7 statt 3,0 %) wurde getestet und verworfen: Er verschiebt nur Ausgaben von den Zinsen ins Primärdefizit und erhöht die Schuld 2055. (1) Die Schuld wird als Bruttoschuld Gesamtstaat (IMF, 124 %) gerechnet, CBO rechnet mit der Bundesschuld in Händen der Öffentlichkeit (101 %); das Primärdefizit liegt beim Gesamtstaat rund 1,5 Pp. tiefer als bei CBO (Bund 2,6 %). Beide Schuldenpfade sind deshalb nicht direkt vergleichbar. (2) Die Ausgabenstruktur weicht ab, gleicht sich aber grob aus: Gesundheit bleibt fest (CBO: Medicare steigt auf 5,5 % BIP), Renten steigen bis 2055 auf 7,0 statt 6,0 %, Einnahmen bleiben fest (CBO: +1,3 Pp.). (3) Die Schuldenbremse (Bohn 1998) spart bis 2055 rund 4 % BIP ein; CBO rechnet nach geltendem Recht ohne Gegensteuern. (4) Zuwanderer finden nach einer Kurve aus der deutschen Flüchtlingsforschung Arbeit (Halbwertszeit 5 Jahre), für die USA wohl zu langsam; zugleich liegt die Nettozuwanderung (1,1 Mio.) wohl über der CBO-Annahme. Beide Fehler heben sich beim Arbeitsangebot ungefähr auf.",
    wirkung: "mittel (USA: Schuld)", behebung: "Zolleinnahmen im Haushalt abbilden; Gesundheitsausgaben an die Alterung koppeln; Einnahmen mit Progression (Bracket Creep); Integrationstempo und Nettozuwanderung für die USA gemeinsam gegen BLS und CBO Demographic Outlook setzen; Abschreibungsrate je Land statt global." },
  { id: "M24", laender: ["DE", "JP"], bereich: "Mechanik und Wirkstärken", titel: "Deutschland und Japan: Arbeitsangebot",
    text: "Sanity-Check 28.09.2026. Ohne Schocks wuchsen Deutschland (0,0 % 2026–2035) und Japan (0,1 %) deutlich langsamer als die Schätzungen (Deutschland rund 0,4 %, Bank of Japan 0,5–1,0 %), weil das Arbeitsangebot um rund 1 % pro Jahr sank. Teilweise behoben: Ein Erwerbsquoten-Trend je Land (Deutschland +0,3 Pp. pro Jahr für 12 Jahre, Japan +0,4 Pp. für 10 Jahre) bildet die steigende Beteiligung von Älteren und Frauen ab und wirkt nur nach vorn. Seitdem 0,24 % (Deutschland) und 0,35 % (Japan), weiter unter den Schätzungen. Offen: (1) Zuwanderer arbeiten zu selten, nach Jahren erst ein Viertel bis ein Drittel der Zugewanderten im Erwerbsalter. Eine schnellere Kurve für Arbeitsmigration brachte nur +0,05 Pp. Wachstum und verschlechterte den Rückblick (Schuld U 1,31, Handel); verworfen. Der Engpass liegt eher in Ziel-Beschäftigungsquote, Zugangsweg-Mischung und Zählung (B1). (2) Arbeit über das Rentenalter hinaus fehlt als eigene Größe; in Japan steckt sie grob im Trend.",
    wirkung: "mittel (Deutschland, Japan: Wachstum)", behebung: "Zuwanderer-Beschäftigung gegen Mikrozensus und OECD-Integrationsindikatoren prüfen (Ziel, Mischung der Zugangswege, Kinderanteil); Erwerbstätigkeit über dem Rentenalter als Quote. Jede Änderung muss den Rückblick Deutschland bestehen." },
  { id: "M25", bereich: "Mechanik und Wirkstärken", titel: "Wirkstärken der Ordnung und Rohstoffe nur teilweise geprüft",
    text: "Update 4a rechnet Rechtsstaat, Staatsanteil, Preiskontrollen, Notenbankfinanzierung, Kreditlenkung, Rohstoffe und gelenkte Währung mit Literaturwerten. Update 4c prüft sie an neun Falldateien (acht Fällen): Richtung stimmt überall; Hyperinflation und Abwanderung (Venezuela), Produktivitätslücke der DDR (56 % der BRD 1989) und Schwarzmarkt Argentiniens treffen auch die Größenordnung. Kalibriert: Kreditlenkung → Kapitaleffizienz 0,3 → 0,5 (UdSSR; der Test prüft damit das Kalibrierziel, keinen unabhängigen Beleg). Dazu vier Korrekturen aus den Fällen: Rohstofferlöse zum realen Wechselkurs (Teiler höchstens bis 0,8), Rohstoffmenge in der Wirtschaftsleistung (wirkt auch nach oben: Förderung 200 hebt Russlands BIP sofort um rund 11 %, ohne Kapitalbedarf), Preiskontrollen brechen bei hoher Inflation zusammen, negativer Realzins wirkt über 25 % Inflation höchstens bis −5 %. Die G7 und China rechnen dadurch unverändert, Russland minimal anders (Wachstum 2026–2031 weiter 1,03 %). Die übrigen Wirkstärken bleiben Literaturwerte; Abwanderung wegen eines reinen Wirtschaftseinbruchs fehlt bewusst. Die Fälle sind mit grob gesetzten Pfaden aufgesetzt (Quellen je Falldatei).",
    wirkung: "mittel", behebung: "Pfade der Fälle gegen Jahresdaten prüfen; Lücken M3, M26, M27 schließen." },
  { id: "M26", bereich: "Mechanik und Wirkstärken", titel: "Devisenmangel und Importkompression fehlen",
    text: "Fällt eine Devisenquelle weg (Ölpreis und Förderung in Venezuela ab 2014, Sowjet-Hilfe für Kuba 1991), fehlen in Wirklichkeit Importe von Vorprodukten, und die Produktion bricht ein. Das Modell kennt diesen Kanal nicht: Venezuela verliert 2013–2020 pro Kopf −11 % (beobachtet rund −70 %), Kuba 1990–1993 −4 % (beobachtet −35 %). Richtung stimmt, Größenordnung nicht.",
    wirkung: "hoch (bei Devisenkrisen)", behebung: "Vorleistungsimporte in der Produktion; knappe Devisen (Leistungsbilanz, Schwarzmarkt) begrenzen sie. Danach die Tests „bekannte Lücke (M26)“ zu normalen Tests machen." },
  { id: "M27", bereich: "Mechanik und Wirkstärken", titel: "Stagnation aus gleichbleibender Ordnung fehlt",
    text: "Die Ordnung wirkt nur über die Abweichung vom Landesstandard, damit die Basisläufe exakt gleich bleiben. Eine Planwirtschaft, deren Ordnung sich nicht ändert, verliert im Modell deshalb nicht mit der Zeit an Schwung: Die UdSSR wächst in den 1980ern mit 2,4 % pro Kopf weiter (beobachtet unter 1 %, Easterly/Fischer 1995). Der langsame Niedergang aus der Ordnung selbst (sinkende Innovationskraft, Fehlanreize) fehlt.",
    wirkung: "mittel (lange Läufe mit Planwirtschaft)", behebung: "Produktivitätstrend abhängig vom Niveau der Ordnung, dabei für die Basisläufe durch den Landesstandard neutralisieren; Test „bekannte Lücke (M27)“." },
  { id: "D11", laender: ["CN", "RU"], bereich: "Daten", titel: "China und Russland: Handwerte ungeprüft, amtliche Zahlen mit Vorbehalt",
    text: "Handwerte (Ordnung, Steuersätze, Renten, Rohstoffe, Kapitalstock) sind aus Fachwissen gesetzt. Einige Ausgaben liegen unter der Verzeichnis-Untergrenze und stehen auf der Grenze (China: Gesundheit, Familie, Nettozuwanderung; Russland: Rentenniveau, Lohnersatz, Gesundheit). Chinas Wachstum gilt als geglättet, die verdeckte Schuld (35 % BIP) ist eine IWF-Schätzung. Russland veröffentlicht seit 2022 Teile der Daten nicht; die OECD-Rendite fehlt, Ersatz 12 % (siehe unten). Beide rechnen mit gelenkter Währung; der Leitzins startet beim Realzins des Startjahres (Russland 8 %) und nähert sich über rund zehn Jahre dem Weltrealzins. Nachfrage, Kredit und Schattenkurs messen am selben Pfad. Die russische Ersatzrendite (12 % statt rund 15 % im Krieg 2025) hält die Laufzeitprämie bei rund 1 Pp. Das Wachstum ist gegen den IWF 2026–2031 kalibriert (TFP-Trend China 2,3, Russland 0,55 %). Gegen Ende des Jahrhunderts treiben Schuldenkrisen den Schwarzmarkt-Aufschlag über 5 %.",
    wirkung: "mittel (China, Russland)", behebung: "Handwerte gegen IWF Article IV, OECD und Weltbank prüfen; Verzeichnisgrenzen für Schwellenländer öffnen. (Die Fälle aus Update 4c prüfen die Mechanik, nicht diese Handwerte.)" },
  { id: "M28", bereich: "Mechanik und Wirkstärken", titel: "Stabilisierung über einen Wechselkursanker fehlt",
    text: "Bei sehr hoher Inflation ist der Anker der Erwartungen im Modell fast weg; ein sinkendes Inflationsziel kommt dann nicht an. Russland stabilisierte 1995–1997 über einen Wechselkurskorridor (Inflation 197 → 15 %); im Modell bleibt sie bei 150 %. Dasselbe betrifft jede Stabilisierung nach einer Hyperinflation (Currency Board Argentinien 1991, Bulgarien 1997).",
    wirkung: "mittel (Szenarien mit Hyperinflation)", behebung: "Glaubwürdiger Wechselkursanker als Stellschraube, der die Erwartungen neu verankert; Test „bekannte Lücke (M28)“." },
  { id: "M31", bereich: "Mechanik und Wirkstärken", titel: "Eine Blase platzt nicht von selbst",
    text: "Seit Spec 13.6 entsteht ein Hausboom aus billigem Geld im Modell selbst: In den Fällen USA 2000–2014 und Japan 1985–2005 steigen Hauspreis und Kredit mit der gemessenen Geldpolitik fast wie gemessen (USA 2006 +49 % statt +55 %, Japan 1990 +33 % statt +34 %). Der Wendepunkt fehlt. Ohne gesetzten Auslöser fällt der Hauspreis in den USA nach 2008 kaum, und die Nullzinsen nach der Krise lösen im Modell einen neuen Boom aus (Japan nach 1995: Hauspreis vervierfacht statt −40 %). Es fehlen die Bilanzrezession (Haushalte und Firmen tilgen trotz Nullzins), die Deflation und der Vertrauensbruch an den Finanzmärkten. In den Fällen USA, Spanien und Irland ist die Finanzkrise deshalb als Schock gesetzt. Die Warnlampen zeigen die Gefahr, den Zeitpunkt des Platzens bestimmt ein Schock.",
    wirkung: "hoch (Banken an: Krisen brauchen einen Auslöser; nach einer Krise erholt sich der Hausmarkt zu schnell)", behebung: "Bilanzrezession einbauen: Nach einem Preisrückgang tilgen die Schuldner über Jahre, unabhängig vom Zins (Koo 2008). Der Auslöser ist seit Spec 13.4 für die Zufallsläufe da (Wahrscheinlichkeit steigt mit Kredit- und Hauspreislücke); auf der Hauptlinie fehlt er weiter. Dann an USA, Spanien, Irland und Japan neu prüfen." },
  { id: "M32", bereich: "Mechanik und Wirkstärken", titel: "Banken vereinfacht, Rettungen zu klein",
    text: "Eine Bank je Land, keine Ansteckung zwischen Ländern, Eigenkapital ungewichtet und relativ zum Startwert. Die Bank verliert nur an heimischen Krediten und Staatsanleihen; Verluste an Wertpapieren (USA 2008) und an Auslandsgeschäft fehlen. Der Staat rettet erst, wenn die Hälfte des Eigenkapitals des ganzen Bankensektors fehlt. In Wirklichkeit fallen die schwächsten Banken früher. Folge in den Kalibrierfällen: USA 2008 keine Rettung (gemessen 4,5 % BIP, Laeven/Valencia 2018), Spanien keine (5,4 %), Irland 7 % BIP (37,6 %). Der Staat-Bank-Kreislauf in Spanien 2012 entsteht deshalb nicht. Umgekehrt in Japan: Dort halten die Banken viele Staatsanleihen, steigende Renditen zehren ihr Eigenkapital auf, und im Basislauf mit Banken „an“ kürzen sie in 46 von 50 Jahren Kredit. Der Bankanteil der Staatsschuld und das Hausvermögen je Land sind ungeprüfte Handwerte. Die Grundeinstellung „Häuser und Banken“ steht deshalb im Standard auf „aus“.",
    wirkung: "hoch bei Banken „an“ (Kosten einer Bankenkrise für den Staat zu klein); keine bei „aus“", behebung: "Bankensektor in zwei Teile trennen (solide und schwache Banken) oder die Rettungsschwelle an den Fällen kalibrieren; Wertpapierverluste über den Hauspreisrückgang abbilden; Handwerte im Original nachschlagen (IWF, Arslanalp/Tsuda)." },
  { id: "M33", bereich: "Mechanik und Wirkstärken", titel: "Hausboom falsch verteilt: Spanien und Irland zu klein, Deutschland zu groß",
    text: "Im Fall Spanien 1998–2016 steigt die Privatschuld im Modell bis 2007 von 92 auf 99 % BIP, gemessen auf 213 %; der Hauspreis steigt um 16 % statt 120 %. Im Fall Irland 2002–2015 fällt der Hauspreis ab 2003, weil er im Startjahr schon 30 % über dem langjährigen Verhältnis zum Einkommen lag; gemessen stieg er bis 2007 um weitere 46 %. Es fehlen der Kapitalzufluss aus dem Euroraum (Banken finanzierten sich im Ausland), die Zuwanderung in den Bau und die Inflation über dem Euro-Durchschnitt, die den Realzins drückte. Umgekehrt im Rückblick Deutschland 2000–2025 mit Banken „an“: Das Modell rechnet aus den niedrigen Euro-Zinsen einen Hausboom (+63 % bis 2008), gemessen fielen die Preise um 14 % (Überhang aus dem Bauboom nach der Einheit, schwache Einkommen). Die Hauspreis-Lampe leuchtet 2005–2008, die Banken kürzen ab 2011 Kredit, und der Zinsanstieg 2022 löst über die Staatsanleihen eine Rettung von 4,5 % BIP aus. Wachstum, Inflation und Arbeitslosigkeit treffen schlechter (Theil's U 0,69 → 0,81, 0,79 → 0,84, 0,53 → 0,59).",
    wirkung: "mittel (nur Banken „an“; Länder in einer Währungsunion mit Kapitalzufluss)", behebung: "Kapitalzufluss in der Währungsunion als Kreditquelle (Leistungsbilanzdefizit finanziert Kredit); Inflation des Landes über dem Euro-Durchschnitt im Aufschwung prüfen; dann Spanien und Irland neu rechnen." },
  { id: "M34", laender: ["DE"], bereich: "Mechanik und Wirkstärken", titel: "Investitionsquote im Rückblick noch 3 bis 5 Punkte zu hoch",
    text: "Seit Spec 13.5 Teil B folgen die Investitionen der Auslastung, und der Zins wirkt schwächer (0,15 statt 0,6). Im Rückblick Deutschland 2000–2025 rechnete das Modell damit eine Investitionsquote von 23 bis 27 %, gemessen waren es 18 bis 23 %. Ursache: Die Quote hing für immer an der Quote des Startjahres, im Rückblick 24,0 % im letzten Jahr des Baubooms nach der Einheit; gehalten hätte den Kapitalstock eine Quote von rund 19 % bei Trendwachstum (rund 21 % beim gemessenen Wachstum von 1 %). Der Kapitalkoeffizient stieg deshalb von 3,0 auf 3,6, das Wachstum lag mit 1,17 % über dem gemessenen (1,01 %).",
    wirkung: "mittel (Rückblick Deutschland: Kapitalstock und Wachstum zu hoch)", behebung: "Anker der Investitionsquote gleitet zur Quote, die den Kapitalstock hält.",
    erledigt: "Oktober 2026: Der Anker gleitet jedes Jahr um 10 % des Abstands (geschätzt auf der Macrohistory-Datenbank) zu Abschreibung plus Trendwachstum mal Kapitalkoeffizient. Rückblick: Fehler der Investitionsquote 4,7 → 2,2 Pp., Kapitalkoeffizient 2025 3,21, Staatsschuld Theil's U 1,22 → 1,06, Leistungsbilanz 0,88 → 0,79. Offen: Abschreibung 6 % für alle Länder; das Trendwachstum zählt die Arbeitskräfte nicht. China, Russland, Japan und Kanada investieren heute weit über diesem Wert und wachsen deshalb langsamer als vorher; China und Russland sind am IWF neu geeicht." },
  { id: "M35", bereich: "Mechanik und Wirkstärken", titel: "Öffentlicher Kapitalstock: nur als Abweichung",
    text: "Der Regler „Öffentliche Investitionen“ (Spec 13.5 Teil B) rechnet nur die Abweichung vom Pfad mit heutiger Investition. Ein Land, das schon heute zu wenig investiert, verliert im Basislauf nichts: Deutschlands Nettoinvestition lag 2000–2023 bei 0,1 % BIP, Frankreichs bei 0,6 %, und beide laufen im Modell gleich weiter. Seit Oktober 2026 bezieht sich die Abweichung auf den gemessenen Bestand (IWF Investment and Capital Stock Dataset, 2019: Deutschland 44 % BIP, Japan 121 %); bei fester Wirkstärke 0,1 (Bom/Ligthart 2014) bringt ein Euro dort mehr, wo der Bestand klein ist. Den Bestand mit der heutigen Investition fortzuschreiben, hinge an der Abschreibungsrate (2,5 bis 4,5 %), die die Basisläufe stärker bewegen würde als alles andere; das bleibt offen. Das Modell unterscheidet nicht zwischen Straßen, Schulen und Verwaltungsbauten. Eine schuldenfinanzierte Investition trägt sich nicht selbst: +1 % BIP dauerhaft hebt in Deutschland das BIP pro Kopf bis 2050 um 2,5 % (vorher 1,6), die Schuld um 17 Pp. Für China zählt der IWF Staatsbetriebe mit; der Bestand ist auf die Investition des Gesamtstaats umgerechnet. Im Rückblick Deutschland verschlechtert der gemessene Investitionspfad die Staatsschuld, weil die Kürzungen 2004–2007 die im Modell zu niedrige Schuld weiter senken.",
    wirkung: "mittel (Basisläufe unterschätzen die Kosten eines Sanierungsstaus)", behebung: "Bestand fortschreiben, sobald die Abschreibung je Land belegt ist (Eurostat, BEA, Kabinettsamt); Wirkstärke nach Art der Investition prüfen." },
  { id: "M36", bereich: "Mechanik und Wirkstärken", titel: "Zufallsschocks: wenige Fälle, gleiche Häufigkeit für alle Länder",
    text: "Die Zufallsläufe (Spec 13.4) würfeln vier Arten: Finanzkrise, Ölpreisschock, Pandemie, Krieg in der Nachbarschaft. Geschätzt sind die Finanzkrise (25 Krisen in 18 Ländern 1970–2020; das Risiko steigt mit der Kreditlücke) und der Ölpreisschock (an der Ölpreisreihe seit 1946 gezählt: 3,9 bis 5,8 % pro Jahr, eingestellt 5 %). Krieg in der Nachbarschaft (1,5 %) ist eine Annahme aus einer Handvoll Fällen, die Pandemie (2 %) stammt aus einer Studie. Alle Länder haben dieselben Häufigkeiten und dieselben Schockverläufe; nur der Nachfrageschaden der Energieschocks folgt seit Oktober 2026 dem Nettoimport von Energie (Förderländer verlieren keine Nachfrage, beim Krieg in der Nachbarschaft auch nicht über Unsicherheit und Flüchtlinge; Kanada und die USA bekommen aber auch keinen Erlös, den kennt nur Russland über den Rohstoffsektor). Schocks treten unabhängig voneinander ein. Handelskrieg, Krieg mit eigener Beteiligung, Lieferstopp und unbekannte Arten werden nicht gewürfelt. Mit „Häuser und Banken“ an lässt die Zufallskrise eine Blase platzen, was das Modell von selbst nicht tut (M31); der Preisrückgang bleibt kleiner als gemessen (USA: Median 13 % über fünf Jahre, gemessen 37 %).",
    wirkung: "mittel (Breite des Bandes, Anteil der Läufe mit Schuldenkrise)", behebung: "Häufigkeit von Kriegen in der Nachbarschaft je Land, sobald es eine Fallzählung gibt; Rohstoffsektor für Kanada und die USA." },
  { id: "M37", bereich: "Mechanik und Wirkstärken", titel: "Politik reagiert: Hauptlinie und Zufallsläufe lesen „Jahre in Folge“ verschieden",
    text: "Die Regierung reagiert nach mehreren schwachen Jahren in Folge (Spec 13.10). Auf der glatten Hauptlinie gilt das wörtlich. In den Zufallsläufen (Spec 13.4) reichen für die Schwäche drei der letzten fünf Jahre (Konjunkturpaket) und fünf der letzten sieben (Reform), weil das Wachstum dort von Jahr zu Jahr springt; das Sparen bleibt wörtlich; sonst käme in Deutschland nur in 23 % der Läufe eine Reform, auf der Hauptlinie kommt sie 2032. Folge: In Ländern nahe an der Schwelle reformiert die Regierung in den meisten Zufallsläufen, auf der Hauptlinie aber nie (Japan 90 %, Großbritannien 85 %, Kanada 97 % der Läufe). Dort liegt die Linie am Rand des Bandes (Japan: Schuld 2050 auf der Linie 261 %, Median der Läufe 214 %). Die wörtliche Regel ist auch auf der Hauptlinie empfindlich: Mit der Regel der Zufallsläufe käme in Kanada 2031 eine Reform, und die Schuld läge 2050 bei 100 statt 125 % BIP.",
    wirkung: "mittel (Lage der Linie im Band; Kanada, Japan, Großbritannien)", behebung: "Eine Regel für beide: Schwäche am Mittel mehrerer Jahre messen; dann Basisläufe und Vorher/Nachher von 13.10 neu rechnen.", erledigt: "13.13: eine Regel für Hauptlinie und Zufallsläufe (n der letzten n + 2 Jahre)" },
  { id: "M30", bereich: "Mechanik und Wirkstärken", titel: "Kreditimpuls schwingt bei Deflation im Sägezahn",
    text: "Im Kalibrierfall Argentinien 1992–2002 springt der Kreditimpuls Jahr für Jahr zwischen etwa −28 und +16 Pp. BIP, das Wachstum entsprechend zwischen −13 und +10 %. Vermutete Ursache, nicht geprüft: Bei Deflation und starkem Nenner-Effekt überschießt die Entschuldung, im Jahr darauf holt der Kredit nach. Die Asymmetrie aus Spec 13.5 Teil A verstärkt die Abwärtsjahre etwas, deshalb erreicht Argentinien seitdem 2002 die Lage „Krise“. Die Basisläufe der neun Länder zeigen den Sägezahn nicht.",
    wirkung: "gering (nur Kalibrierfälle mit Deflation)", behebung: "Entschuldung glätten (über mehrere Jahre verteilen) und an Argentinien und Japan 1990er prüfen; zusammen mit Spec 13.6." },
  { id: "M29", bereich: "Mechanik und Wirkstärken", titel: "Politik reagiert nach stilisierten Regeln, mit Hang zu hoher Schuld",
    text: "Seit Spec 13.13 wählt die Regierung an jedem Auslöser (anhaltende Schwäche, enger Haushalt) zwischen drei Optionen: Machterhalt (Ausgaben, Schuldenregel halbiert, versteckte Einnahmen), Richtung (Großprogramm oder Lastenverteilung nach der Struktur des Landes) und eine unbequeme Entscheidung (ein Teil des passenden Pakets, verwässert, zum Teil später zurückgenommen). Eine Regel ohne Zufall sagt vorher, welche sie wahrscheinlich wählt; die Nutzerin kann umschalten. Stilisiert bleibt: (1) Die Regeln sind Setzungen; das Muster der deutschen Geschichte trifft sie zum Teil (2010 Konjunkturhilfe nach der Krise, 2014 Rente mit 63 und 2025 Sondervermögen ja; 2003 Agenda 2010 nein, weil die Schwäche erst zwei Jahre anhielt). (2) Die Richtung folgt der Struktur des Landes aus den Startwerten (Sozialquote, Energieimport, Leistungsbilanz): eine Näherung, die für Kanada, China und Russland schwach passt. (3) Die Rücknahmequote (30 %) stützt sich auf wenige Fälle; der Wahljahr-Effekt ist in den Daten der App nicht sichtbar und steht auf 0. (4) Der Wahltakt ist fest; vorgezogene Wahlen kennt das Modell nicht. (5) Die Regierung sieht nur Wachstum, Arbeitslosigkeit und Haushalt, keine Mehrheiten und Koalitionen. (6) Seit der Nachbesserung M29 kennt das Grundmodell die Haushaltspläne bis 2031: Der Finanzierungssaldo folgt 2026–2031 dem IWF, danach bleiben die Maßnahmen (Schalter „Haushaltspläne bis 2031“). Der Plan ist geeicht, nicht aus einzelnen Maßnahmen gebaut; er fängt auch auf, was das Modell sonst falsch rechnet (vor allem den zu steilen Rentenanstieg bis 2031). Auf die Nachfrage wirkt nur der Teil, der darüber hinausgeht. Schuld 2050 (Politik reagiert): Frankreich 150, Italien 258, Deutschland 138, Großbritannien 91. Der Abstand zum IWF 2031 sinkt im Mittel der neun Länder von 10,5 auf 5,0 Punkte; was bleibt, ist vor allem das zu schwache Wachstum (Deutschland +4, Japan +12, Kanada +4, Italien +2,5) und in China die Stock-Flow-Anpassung des IWF (−13,5). Nach 2031 treiben die Renten die Schuld: Sie steigen mit dem Verhältnis Rentner zu Beschäftigten bei festem Niveau (Italien 2050 rund 25 % BIP, der Ageing Report sieht rund 16). Schuldenkrise bis 2050 in den Zufallsläufen: Frankreich 7 %, Italien 34 %, Deutschland 54 % (200 Läufe; der Anteil schwankt mit der Ziehung um einige Punkte). (7) In Großbritannien und Frankreich liegt die Hauptlinie am unteren Rand des Bandes der Läufe: Schocks lösen in den Läufen mehr Entscheidungen aus als auf der glatten Linie, und jede kostet (2050: Großbritannien Linie 91, Band 90 bis 144; Frankreich 150, Band 146 bis 216). Im Band liegen beide nur, weil der Produktivitätstrend streut. Deutschland liegt seit dem gleitenden Investitionsanker im Band. Ob das zu pessimistisch ist, zeigt erst ein Vergleich mit Fällen.",
    wirkung: "hoch (Schuld, Krisenanteile und Wachstum der Basisläufe)", behebung: "Regeln an Fällen prüfen (Italien 2011/12, Japan 2013, Deutschland 2003–2005); Rentenausgaben aller Länder gegen den Ageing Report und nationale Projektionen stellen (M1), dann das Wachstum gegen den IWF (Japan: Zinssprung im ersten Jahr, T8 und D12); die Zuordnung der Struktur für Kanada, China und Russland überdenken." },
  { id: "D12", bereich: "Daten", titel: "Geschätzte Startwerte: Randwerte unsicher, neutraler Zins nicht verdrahtet",
    text: "Seit Spec 13.1 schätzt ein Kalman-Filter je Land Produktivitätstrend, NAIRU, Produktionslücke und neutralen Realzins. (1) Der neutrale Realzins wird nur angezeigt. Im Modell steckt er als Weltrealzins in der Taylor-Regel und als Realzins des Startjahres im Nachfrage-Bezug; ihn einzusetzen wäre eine Mechanik-Änderung. (2) Eine Schätzung ersetzt den Handwert nur, wenn er außerhalb ihres Bands liegt; 11 von 18 Handwerten sind so bestätigt, ersetzt ist nur Kanadas Produktivitätstrend (0,38 statt 0,7). (3) Am Reihenende ist die Schätzung am unsichersten, und die Inflations-Messwerte 2021–2023 fehlen (Angebotsschock). Wo eine Schätzung das Wachstum 2026–2030 um mehr als 0,3 Pp. weiter vom IWF wegführt, bleibt der Handwert nach Urteil: NAIRU in Kanada und China, Produktivitätstrend in Japan. Das Urteil trägt kein Datum und muss nach neuen Daten von Hand geprüft werden. (4) Russland: Der Filter passt nicht zu den Daten (κ 3,1), alle Handwerte bleiben.",
    wirkung: "mittel (Startwerte, Wachstum der ersten Jahre)", behebung: "Taylor-Anker und Nachfrage-Bezug auf einen gemeinsamen, landesspezifischen neutralen Zins stellen (Entscheidung in 13.5); Energiepreis als Größe in der Inflationsgleichung statt Auslassen der Schockjahre; Quartalsdaten." },
  { id: "T7", bereich: "Tests", titel: "Kleinere Befunde aus der Prüfung von Update 4a",
    text: "(1) Der Inflationsdeckel (1.000.000 %) wird vor dem Abbau des Preisstaus angewendet; wird ein riesiger Stau frei, kann die gemessene Inflation darüber liegen. (2) Ein Land mit Rohstoffexporten, dessen Gewichte für Öl, Gas und Metalle alle 0 sind, ergäbe keine Zahl (Division durch 0); solche Daten gibt es heute nicht. (3) Szenarien, die schon vor Update 4a über 20 % Inflation erreichten, rechnen seither leicht anders, weil Kapitalflucht und Abwanderung einsetzen; die Basisläufe sind unverändert.",
    wirkung: "gering", behebung: "Patch als erster Task von Update 4b: (1) Deckel nach dem Preisstau erneut anwenden; (2) Gewichte beim Laden prüfen oder Preisindex absichern; (3) bleibt so, ist gewollt — nur in den Annahmen sichtbar." , erledigt: "Update 4b: (1) und (2) behoben; (3) bleibt gewollt" },
  { id: "T8", bereich: "Tests", titel: "Kleinere Befunde aus der Prüfung von 13.1 und 13.2",
    text: "13.1 Kalman: (1) Der Filter zählt am Anfang fest 3 Jahre als Anlauf; κ fällt dadurch etwas zu klein aus (Deutschland 1,61 statt 1,74). (2) Das Urteil gegen eine Schätzung (schaetzungAus) trägt kein Datum und gilt nach neuen Daten ungeprüft weiter. (3) Das Band des Produktivitätstrends enthält die Unsicherheit des Arbeitswachstums nicht. (4) Endet das reale Wachstum vor dem Datenstand, trägt die Schätzung trotzdem das Datenstand-Jahr (heute nicht der Fall). (5) Ungültiger neutraler Zins ohne Wert erscheint als „0,00 %“ (heute nicht der Fall). (6) Die Handfassung der Länder wird im Browser unnötig mitgebaut; die Schätzreihen liegen im Bundle (etwa 7,5 KB je Land). 13.2 Frühwarnung: (7) Japan zeigt 2026 eine inverse Zinskurve, weil der Leitzins im ersten Modelljahr von 0,4 auf 3,5 % springt; ein Startsprung, kein Signal. (8) Der Infotext der Kreditlücke sagt „seit 1950“; einige Reihen beginnen später (Japan 1964, China 1985). (9) Im Rückblick startet die Kreditlücke 2000 bei 0; möglich wäre ein Start aus den Daten bis 2000 (Lücke +15, dann Lampe 2001 statt 2010). (10) Bei Hyperinflation wird das Zinskurven-Diagramm unlesbar groß. (11) Die Zinskurve ist im Vergleich farblich neutral; eine nicht mehr inverse Kurve gilt nicht als gut.",
    wirkung: "gering", behebung: "(1) nur Schritte ohne diffusen Anteil zählen; (2) Urteil mit Jahr speichern und bei neuem Datenjahr verwerfen; (7) Zinskurven-Lampe im ersten Modelljahr unterdrücken; (8) „seit Beginn der IWF-Reihe“; (9) Kreditstart im Rückblick aus den Daten bis zum Startjahr; (10) Anzeige begrenzen; übrige nach Bedarf." },
  { id: "U11", bereich: "Oberfläche und Darstellung", titel: "Kleinere Befunde aus der Prüfung der englischen Fassung",
    text: "(1) Ein Sprachwechsel baut die Ansicht neu auf: gewähltes Jahr, offenes Diagramm, Vergleichspartner, Auswahl im Wirkungsnetz und die Liste übernommener Pakete (Zurücknehmen) gehen verloren; das Szenario bleibt. (2) Im Englischen steht vor dem Prozentzeichen teils ein Leerzeichen („3.2 %“), teils nicht. (3) Größennamen stehen im Englischen mitten im Satz groß („after 10 years Economic prosperity per capita …“). (4) Quellen-Kürzel wie „IWF“ bleiben deutsch. (5) „1 Kinder je Frau“ bzw. „1 children per woman“: Einzahl fehlt bei Einheiten.",
    wirkung: "gering", behebung: "(1) Jahr, Diagramm und übernommene Pakete oberhalb des Neuaufbaus halten; (2) Prozentformat über Intl je Sprache; (3) Kleinschreibung im Satz oder Satzvorlagen je Größe; (4) Quellen-Kürzel je Sprache; (5) Einheiten mit Einzahl." },
  { id: "T6", bereich: "Tests", titel: "Kleinere Befunde aus der Prüfung von Phase 3b",
    text: "(1) Grenzfälle genau auf der Schwelle sind für 2,5 % (Boom), 0,5 Pp. Schuldanstieg, genau 90 % des Höchststands und genau Ziel + 2,2 Pp. Inflation nicht getestet. (2) Die Krisen-Begründung in der Erzählung liest die Aufschlag-Schwelle aus dem Verzeichnis-Standard, die Einstufung den Landeswert; heute gleich, weil kein Land die Schwelle überschreibt. (3) Drei Jahre mit winzigem Minus pro Kopf (je −0,01 %) ergeben eine Depression, obwohl jedes Jahr für sich Stagnation wäre; so steht es in der Spec („negativ“). (4) Die Info-Texte zum Risikoaufschlag nennen „3 Prozentpunkte“ fest statt aus dem Verzeichnis.",
    wirkung: "gering", behebung: "(1) vier Grenzfall-Tests ergänzen; (2) standardWert(\"schwelle.aufschlag\", land) nutzen; (3) prüfen, ob Minusjahre erst unter einer kleinen Schwelle zählen sollen; (4) Text aus dem Verzeichnis erzeugen." }
];

const REIHENFOLGE: Bereich[] = [
  "Daten",
  "Mechanik und Wirkstärken",
  "Demografie",
  "Oberfläche und Darstellung",
  "Tests",
];

export function kritikMarkdown(): string {
  const kopf = [
    "# Kritikpunkte und Unschärfen des Modells",
    "",
    "Diese Datei wird aus `modell/kritik.ts` erzeugt (`npm run kritik`). Änderungen dort vornehmen.",
    "",
    "Die Liste sammelt alles, was das Modell ungenau macht. Die Punkte werden nicht versteckt, sondern benannt und nach und nach durch bessere Quelldaten oder Mechanik behoben. Die App zeigt sie im Reiter „Annahmen“.",
    "",
    "**Länder:** Ein Kürzel hinter der Nummer heißt, der Punkt betrifft nur diese Länder; die App zeigt ihn nur dort. Ohne Kürzel gilt er für alle.",
    "",
    "**Wirkung:** hoch = verschiebt die Kernaussagen (Kipp-Jahr, Wohlstand, Schuld) sichtbar · mittel = verschiebt Zahlen, nicht die Richtung · gering = Randeffekt.",
    "",
  ];
  const teile = REIHENFOLGE.map((b, i) => {
    const zeilen = KRITIK.filter((k) => k.bereich === b && !k.erledigt).map(
      (k) =>
        `| ${k.id}${k.laender ? ` (${k.laender.join(", ")})` : ""} | **${k.titel}.** ${k.text} | ${k.wirkung} | ${k.behebung} |`,
    );
    return [
      `## ${i + 1}. ${b}`,
      "",
      "| # | Unschärfe | Wirkung | Behebung |",
      "|---|---|---|---|",
      ...zeilen,
      "",
    ].join("\n");
  });
  const erledigt = KRITIK.filter((k) => k.erledigt).map(
    (k) => `| ${k.id} | ${k.titel} | ${k.erledigt} |`,
  );
  const schluss = erledigt.length
    ? [
        "## Behoben",
        "",
        "| # | Punkt | Behoben in |",
        "|---|---|---|",
        ...erledigt,
        "",
      ].join("\n")
    : "";
  return [...kopf, ...teile, schluss].join("\n").trimEnd() + "\n";
}

// Angezeigte Texte eines Kritikpunkts in der gewählten Sprache (Spec 12c); docs/kritikpunkte.md bleibt deutsch.
export const kTitel = (k: Kritikpunkt) => tk(`k:${k.id}:titel`, k.titel);
export const kText = (k: Kritikpunkt) => tk(`k:${k.id}:text`, k.text);
export const kWirkung = (k: Kritikpunkt) => tk(`k:${k.id}:wirkung`, k.wirkung);
export const kBehebung = (k: Kritikpunkt) => tk(`k:${k.id}:behebung`, k.behebung);

