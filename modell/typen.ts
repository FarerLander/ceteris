// Alle gemeinsamen Typen des Rechenkerns. Einheiten stehen am Feld.
import type { BankenModus, RettungModus } from "./banken-modus";
import type { Motiv, PolitikEreignis } from "./politik-modus";

export type Regime = "welt" | "eigen" | "euro" | "hart" | "gelenkt";
export type Rentensystem = "umlage" | "mischung" | "kapital";
export type Lage =
  | "krise"
  | "depression"
  | "rezession"
  | "stagflation"
  | "deflation"
  | "boom"
  | "schuldenwachstum"
  | "wachstum"
  | "stagnation";
export type Beleg = "lehrbuch" | "studie" | "kalibriert";
export type BausteinId =
  | "demografie"
  | "ordnung"
  | "energie"
  | "innovation"
  | "wachstum"
  | "privatschuld"
  | "geld"
  | "staat"
  | "anleihen"
  | "handel"
  | "banken"
  | "zufall"; // Spec 13.4: kein Rechenbaustein, nur Gruppe im Verzeichnis

export type Stufe = { ab: number; wert: number };
export type Pfad = number | Stufe[];

export interface Grundeinstellungen {
  regime: Regime;
  rentensystem: Rentensystem;
  tpi: boolean;
  politik?: "fest" | "reagiert"; // Spec 13.10; fehlt: POLITIK_STANDARD
  banken?: BankenModus; // Spec 13.6; fehlt: BANKEN_STANDARD
  rettung?: RettungModus; // Spec 13.6; fehlt: RETTUNG_STANDARD
  haushaltsplan?: "an" | "aus"; // M29; fehlt: HAUSHALTSPLAN_STANDARD
}

export type SchockArt =
  | "oel"
  | "krise"
  | "pandemie"
  | "proxy"
  | "krieg"
  | "handel"
  | "sanktionen"
  | "rohstoffsanktion";
export interface Schock {
  id: number;
  art: SchockArt;
  jahr: number;
  staerke: number; // 1 = Standard
  dauer: number; // 1 = Standard, 2 = doppelt so lang
}

export type WeltId =
  | "realzins"
  | "nachfrage"
  | "oel"
  | "gas"
  | "kohle"
  | "euroLeitzins"
  | "euroInflation"
  | "weltInflation"
  | "grenzeWachstum"
  | "bestandWachstum"
  | "weltEnergiepreis"
  | "praemieWelt"
  | "metalle";

export interface Szenario {
  jahre: number; // Anzahl Jahre inkl. Startjahr: 26, 51 oder 101
  grund: Grundeinstellungen;
  stell: Record<string, Pfad>; // nur Abweichungen vom Standard des Landes
  schocks: Schock[];
  aus: string[]; // abgeschaltete umstrittene Wirkstärken
  welt: Partial<Record<WeltId, Pfad>>;
  // Spec 13.13: Wahl der Nutzerin an einem Entscheidungspunkt, Schlüssel "<Jahr>-<Auslöser>".
  // Gibt es den Punkt nicht (mehr), wirkt der Eintrag nicht.
  wahl?: Record<string, Motiv>;
}

export type Mix = {
  kohle: number;
  gas: number;
  oel: number;
  atom: number;
  ern: number;
}; // Anteile Strom, Summe 1
export type SteuerId =
  | "einkommen"
  | "sozialabgaben"
  | "mwst"
  | "unternehmen"
  | "kapitalertrag"
  | "vermoegen"
  | "erbschaft";
export const STEUERN: SteuerId[] = [
  "einkommen",
  "sozialabgaben",
  "mwst",
  "unternehmen",
  "kapitalertrag",
  "vermoegen",
  "erbschaft",
];

export interface Startwerte {
  bev: number; // Mio.
  altersanteile: number[]; // 17 Gruppen: 0–4, 5–9, … 75–79, 80+; Summe 1
  tfr: number; // Kinder je Frau
  lebenserwartung: number; // Jahre bei Geburt
  bip: number; // Mrd €, laufende Preise des Startjahres
  kapitalkoeffizient: number; // Kapitalstock / BIP
  tfpTrend: number; // % pro Jahr
  lohnquote: number; // Anteil Arbeitnehmerentgelt am BIP
  nairu: number; // %
  alq: number; // %
  erwerbsquote: number; // Anteil Erwerbspersonen an Erwerbsfähigen
  erwerbsquoteTrend?: number; // Anstieg der Erwerbsquote pro Jahr (Anteil), wirkt nur nach vorn
  erwerbsquoteTrendJahre?: number; // so viele Jahre ab Start
  fondsQuote0?: number; // % BIP, staatlicher Rentenreservefonds im Startjahr (Erträge stecken schon in den Einnahmen)
  investQuote: number; // % BIP
  produktivitaetsLuecke: number; // eigene Produktivität / Grenze (USA), 0–1
  kreditTrend0?: number; // % BIP, Kredittrend im Startjahr (Spec 13.2, aus XX-schaetzung.json)
  kreditSteigung0?: number; // Pp. pro Jahr
  inflation: number; // %
  leitzins: number; // %
  rendite: number; // % Staatsanleihe 10 Jahre
  effZins: number; // % Zinsausgaben / Schuld
  qe: number; // % BIP Staatsanleihen bei der Notenbank
  schuldQuote: number; // % BIP
  einnahmen: number; // % BIP
  ausgaben: number; // % BIP inkl. Zinsen
  rentenausgaben: number; // % BIP
  alg: number; // % BIP Arbeitslosengeld und Grundsicherung
  steuerBasen: Record<SteuerId, number>; // Bemessungsgrundlage % BIP
  mix: Mix;
  co2Mt: number; // Mt CO₂ gesamt
  importquote: number; // Anteil Energieimporte am Verbrauch
  industrieTWh: number; // Stromverbrauch Industrie
  netzkosten: number; // €/MWh Industrie
  energieExportAnteil: number; // Anteil energieintensiver Güter an Exporten
  exporte: number; // % BIP
  importe: number; // % BIP
  nfa: number; // % BIP Nettoauslandsvermögen
  lbRest: number; // % BIP Primär- und Sekundäreinkommen (Rest der Leistungsbilanz)
  privatschuld: number; // % BIP
  dsrSchwelle: number; // % Schuldendienstquote, ab der Entschuldung einsetzt
  vcBasis: number; // % BIP Wagniskapital
  eurogewicht: number; // Anteil am Euroraum-BIP (nur Regime euro)
  fluchtReaktion: number; // Pp. Renditeänderung bei globaler Flucht in sichere Häfen
  reserve: number; // Reservewährungsstatus 0–1
  armut: number; // % Armutsgefährdungsquote
  gini: number; // 0–100
  // Update 4a, alle optional (G7: fehlen = 0)
  staatsanteil?: number; // % der Wirtschaftsleistung aus Staatsbetrieben
  rohstoffExporte?: number; // % BIP
  energieNettoImport?: number; // % des Energieverbrauchs, negativ: Exporteur (fehlt: wie Deutschland)
  oeffKapitalQuote?: number; // % BIP, gemessener öffentlicher Kapitalstock (fehlt: aus der Investition)
  rohstoffStaat?: number; // Anteil des Staates an den Rohstofferlösen, 0–1
  rohstoffFonds0?: number; // % BIP Stabilisierungsfonds im Startjahr
  rohstoffGewichte?: { oel: number; gas: number; metalle: number };
  rohstoffBezug?: { oel: number; gas: number; metalle: number }; // Weltpreise, auf die sich rohstoffExporte beziehen (fehlt: Standard)
  preisstau0?: number; // % des Preisniveaus
  verdeckteSchuld0?: number; // % BIP
  // Spec 13.6, alle optional. Die ersten sieben sind Handwerte: alle oder keiner (bankenDaten).
  bankKapital0?: number; // % der Bilanz, ungewichtet
  npl0?: number; // % der Bankkredite, faule Kredite
  bankBilanz0?: number; // % BIP
  bankKreditAnteil?: number; // Anteil der Privatschuld bei Banken, 0–1
  bankStaatsAnteil?: number; // Anteil der Staatsschuld bei heimischen Banken, 0–1
  hausVermoegen0?: number; // % BIP, Wohnimmobilien der Haushalte
  hausBewertung0?: number; // % über dem langjährigen Preis-Einkommen-Verhältnis
  hausTrend0?: number; // Trend von 100·ln(Hauspreis) relativ zum Startjahr (aus XX-schaetzung.json)
  hausSteigung0?: number; // je Jahr
  hausWachstum0?: number; // % realer Hauspreisanstieg im Startjahr
}

export interface Waehrung {
  symbol: string;
  kurs: number; // Landeswährung je Euro
}

// Offizielle Prognosen zum Vergleich (Spec 12a). Reine Anzeige, die Rechnung liest sie nie.
export type KonsensGroesse = "wachstum" | "inflation" | "alq" | "defizit" | "schuldQuote";

export interface KonsensQuelle {
  kurz: string; // erscheint in Legende und Satz, z. B. „IWF“, „CBO“
  name: string;
  stand: string; // ISO-Datum der Veröffentlichung bzw. des Abrufs
  url?: string;
  abgrenzung?: Partial<Record<KonsensGroesse, string>>; // gesetzt = kein direkter Vergleich
  werte: Partial<Record<KonsensGroesse, Record<number, number>>>;
}

export interface KonsensGrund {
  tiefer?: string; // Nebensatz nach „weil“, wenn das Modell unter der Quelle liegt
  hoeher?: string;
}

export interface Konsens {
  quellen: KonsensQuelle[];
  gruende: Partial<Record<KonsensGroesse, KonsensGrund>>;
}

// Spec 13.1: geschätzte Startwerte (Kalman-Filter im Datenskript).
export type SchaetzGroesse = "tfpTrend" | "nairu" | "rStern" | "luecke";
export interface Schaetzwert {
  groesse: SchaetzGroesse;
  wert: number;
  band: number; // ±1 Standardabweichung
  gueltig: boolean;
  grund?: string; // warum ungültig oder nicht genutzt
  hp?: number; // Gegenprobe Hodrick-Prescott (nur tfpTrend)
  genutzt?: boolean; // von baueLand gesetzt: ersetzt den Handwert
  handwert?: number; // von baueLand gesetzt
  bestaetigt?: boolean; // von baueLand gesetzt: Handwert liegt im Band, bleibt
}

export interface Landesdaten {
  code: string;
  name: string;
  datenstand: number; // Startjahr
  qualitaet: "gruen" | "gelb" | "rot";
  grund: Grundeinstellungen;
  standards: Record<string, number>; // Abweichungen vom Verzeichnis
  start: Startwerte;
  waehrung: Waehrung;
  markiert: string[];
  quellen?: Record<string, string>; // Herkunft der automatischen Reihen // Reihen, deren Wert älter als der Datenstand ist
  konsens?: Konsens;
  hinweis?: string; // Vorbehalt zum Land, sichtbar in Seitenleiste und Annahmen
  // Spec 13.13: Wirksamkeit der Regierung (WGI, 0–100) und fester Wahltakt; takt = Gewicht (1 voll, 0 ohne).
  politik?: { wirksamkeit: number; legislatur: number; letzteWahl: number; takt: number };
  schaetzung?: { jahr: number; kappa: number; werte: Schaetzwert[]; hinweis?: string };
  plan?: Haushaltsplan; // M29: nur Länder der Gegenwart, nie der Rückblick
}

// M29: geeichter Haushaltsplan je Kalenderjahr, Pp. BIP. werte: Senkung der Primärausgaben (mit Ausgleich der
// Renten- und Zinsdrift des Modells); impuls: davon die bewusste Politik, die auf die Nachfrage wirkt.
export interface Haushaltsplan {
  datenstand: number;
  quelle: string;
  stand: string;
  werte: Record<number, number>;
  impuls: Record<number, number>;
}

export interface MigJahrgang {
  ankunft: number; // Jahr
  anzahl: number; // Mio.
  ziel: number; // Ziel-Beschäftigungsquote
  warte: number; // Jahre bis Arbeitsmarktzugang
  alterAnkunft: number;
  halbwert: number; // Jahre
  kosten: number; // Tsd. € pro Kopf und Jahr in den ersten 3 Jahren
  weg?: boolean; // abgewanderte Qualifizierte statt Zugewanderte
}

export interface Zustand {
  jahr: number;
  // Demografie
  alter: number[]; // Mio. je Einzeljahr 0–100
  migJahrgaenge: MigJahrgang[];
  bev: number;
  erwerbsfaehige: number;
  rentner: number;
  lebenserwartung: number; // Jahre bei Geburt
  geburten: number;
  sterbefaelle: number;
  zuwanderung: number;
  abwanderung: number;
  migErwerbsalter: number;
  migBeschaeftigte: number;
  abwErwerbsalter: number; // abgewanderte Qualifizierte, die noch im Erwerbsalter wären
  abwBeschaeftigte: number; // davon wären beschäftigt
  integrationskosten: number; // Mrd €
  // Ordnung (Update 4a)
  investAufschlag: number;
  knappheit: number; // Index, 0 = keine Knappheit
  ordnungNiveau: number; // log Abweichung des Produktivitätsniveaus durch die Ordnung
  kapitalflucht: number; // % BIP pro Jahr
  abwanderungOrdnung: number; // Mio. pro Jahr
  staatsbetriebVerlust: number; // % BIP
  preisstau: number; // % des Preisniveaus
  inflationWahr: number; // % Inflation ohne Preiskontrollen
  kapitalEffizienz: number; // Anteil
  verdeckteSchuld: number; // % BIP
  uebernahme: number; // % BIP, im Jahr vom Staat übernommene verdeckte Schuld
  // Rohstoffe (Update 4a)
  foerderZustand: number; // 1 = wie am Start
  rohstoffExporte: number; // % BIP
  rohstoffMenge: number; // Fördermenge, Start = 1
  rohstoffHaushalt: number; // % BIP, Abweichung der Rohstoffeinnahmen vom Start
  rohstoffFonds: number; // % BIP
  exporteOhneRohstoffe: number; // Index, Start = 100
  // Gelenkte Währung (Update 4a)
  schattenkurs: number;
  ueberbewertung: number; // %
  schwarzmarkt: number; // % Aufschlag
  nairuEff: number; // % wirksame strukturelle Arbeitslosigkeit
  eqEff: number; // wirksame Erwerbsquote
  // Energie
  mix: Mix;
  energiepreis: number;
  importquote: number;
  co2Strom: number;
  co2Rest: number;
  co2Mt: number;
  co2Einnahmen: number; // Mrd €
  umbauInvest: number;
  steuerbar: number;
  // Innovation
  vcQuote: number;
  fueWirk: number;
  vcWirk: number;
  innovBeitrag: number;
  // Wachstum
  A: number;
  grenze: number;
  K: number;
  h: number;
  bildWirk: number;
  Y: number;
  luecke: number;
  wachstum: number;
  wachstumProKopf: number;
  bipProKopf: number; // Tsd. €
  hoechstProKopf: number; // Tsd. €, höchstes bisheriges BIP pro Kopf (Depression)
  minusJahre: number; // Jahre in Folge mit schrumpfendem BIP pro Kopf
  erwerbspersonen: number;
  beschaeftigte: number;
  alq: number;
  investQuote: number;
  // Öffentlicher Kapitalstock (Spec 13.5 Teil B)
  oeffKapital: number; // % BIP, Abweichung vom Pfad mit heutiger Investition
  oeffWirk: number; // log, Beitrag zum Produktivitätsniveau
  // Privatschuld
  privatschuld: number;
  dsr: number;
  privatZins: number; // % durchschnittlicher Zins auf Privatschulden (Zinsbindung)
  kredit: number;
  kreditimpuls: number;
  kreditTrend: number; // % BIP, einseitiger HP-Trend der Privatschuld (Spec 13.2)
  kreditSteigung: number; // Pp. pro Jahr
  kreditluecke: number; // Pp., Privatschuld − Trend
  zinskurve: number; // Pp., Rendite 10 Jahre − Bezugs-Leitzins
  // Geld
  inflation: number;
  inflErw: number;
  leitzins: number;
  qe: number;
  preisniveau: number;
  // Staat (% BIP, außer Nom-Felder in Mrd € laufender Preise)
  einnahmen: number;
  primaerausgaben: number;
  rentenausgaben: number;
  algAusgaben: number;
  zinsausgaben: number;
  primaer: number;
  primaerVorjahr: number;
  defizitNom: number;
  schuldNom: number;
  schuldQuote: number;
  fondsQuote: number;
  armut: number;
  gini: number;
  topfZins: number; // % der Einnahmen für Zinsen
  topfRente: number; // % der Einnahmen für Renten
  topfSozial: number; // % der Einnahmen für Gesundheit, Familie, Arbeitslose
  spielraum: number; // % der Einnahmen, die für alles andere bleiben (negativ: reicht nicht)
  beitragsAufschlag: number; // Anteil, um den der Sozialabgabensatz automatisch gestiegen ist
  konsolidierung: number; // % BIP Gegensteuern (Schuldenregel + Marktdisziplin)
  diskret: number; // % BIP diskretionäre Fiskalpolitik gegenüber dem Standard
  schuldenregel: number; // % BIP Schuldenregel-Teil des Gegensteuerns (vor Abzug der Politik-Konsolidierung)
  pauschal: number; // % BIP davon wirksam (Politik fest: = schuldenregel)
  // Politik reagiert (Spec 13.10)
  politik: PolitikEreignis[]; // Ereignisse dieses Jahres
  politikKonsol: number; // % BIP kumulierte Konsolidierung der Regierung (Kürzungen + Steuern)
  plan: number; // % BIP Haushaltsplan im Jahr (M29)
  politikAufschlag: number; // Pp. politisches Risiko
  // Anleihen
  rendite: number;
  aufschlag: number;
  effZins: number;
  rMinusG: number;
  schnittNom: number; // Mrd €, Schuldenschnitt im Jahr
  ventilSeit: number; // Jahre seit dem letzten Ventil
  ventilArt: number; // 0 kein, 1 Schuldenschnitt, 2 Inflationsventil
  // Handel
  weltnachfrage: number;
  exporte: number;
  importe: number;
  leistungsbilanz: number;
  wechselkurs: number;
  abwertung: number;
  nfa: number;
  reserve: number;
  energieExportAnteil: number;
  // Vermögenspreise und Banken (Spec 13.6)
  hauspreis: number; // real, Index Start = 100
  hp: number; // 100·ln(hauspreis/100)
  hausGrund: number; // Grundwert aus Einkommen und Realzins, Einheit wie hp
  hausWachstum: number; // % realer Anstieg im Jahr
  hausWert: number; // % BIP, Wohnimmobilien der Haushalte
  hausUeber: number; // %, realer Preisanstieg über dem Potenzialwachstum (Sicherheiten, M2)
  hausTrend: number; // einseitiger HP-Trend von hp
  hausSteigung: number; // je Jahr
  hausluecke: number; // %, hp − Trend
  npl: number; // % der Bankkredite
  bilanz: number; // % BIP
  bankKapitalBetrag: number; // % BIP
  bankKapital: number; // % der Bilanz
  rettung: number; // % BIP im Jahr
  klemme: number; // % BIP, Abschlag auf den neuen Kredit
  kreditUeber: number; // % BIP, neuer Kredit über der normalen Ausweitung (Bestand × nominales Potenzialwachstum)
  rReal: number; // % reale Rendite 10 Jahre (Rendite − erwartete Inflation), begrenzt auf −5 bis 15
  lage: Lage;
}

export interface Konstanten {
  sq0: number; // Schuldenquote im Startjahr
  auf0: number; // Risikoaufschlag im Startjahr
  praemieKorrektur: number; // Pp.: Startaufschlag mit allen Wirkstärken minus mit den abgeschalteten (sonst 0)
  energieBasis: number; // €/MWh Industriepreis im Startjahr = Index 100
  userCost0: number;
  umbau0: number;
  rentenFaktor: number;
  algFaktor: number;
  lnLuecke0: number;
  dsr0: number;
  realzins0: number;
  sonstigeEinnahmen: number;
  nairu: number;
  eq0: number;
  y0: number;
  lb0: number;
  investAnker: number; // % BIP, Investitionsquote, die den Kapitalkoeffizienten des Startjahres bei Trendwachstum hält
  oeffKapital0: number; // % BIP, öffentlicher Kapitalstock im Startjahr (gemessen, sonst Investition ÷ (Abschreibung + Trendwachstum))
  // Spec 13.6 (ohne Bankdaten 0)
  bankVerlust0: number; // Abschreibung je Bilanz im ruhigen Startjahr; der Gewinn deckt sie
  bankZiel0: number; // % der Bilanz, Eigenkapital im Startjahr
  bankMindest: number; // % der Bilanz, darunter rettet der Staat
  bilanzFaktor: number; // Bilanz / Privatschuld
}

export type SchockKanal =
  | "energie"
  | "inflation"
  | "luecke"
  | "gA"
  | "alq"
  | "ausgaben"
  | "beschaeftigte"
  | "flucht"
  | "aufschlag"
  | "krise"
  | "zuwanderung"
  | "export"
  | "rohstoff";
export type SchockWirkung = Record<SchockKanal, number>;

export interface Kontext {
  t: number; // Jahre seit Start
  jahr: number;
  start: number;
  land: Landesdaten;
  grund: Grundeinstellungen;
  c: Konstanten;
  w(id: string): number; // Stellwert im laufenden Jahr
  wBei(id: string, jahr: number): number;
  basis(id: string): number; // Standardwert des Landes (ohne Szenario)
  aenderung(id: string): number; // Änderung gegenüber dem Vorjahr (im ersten Jahr gegenüber der Basis)
  verzoegert(id: string, lag: number): number; // mittlere Abweichung von der Basis über die letzten lag Jahre
  p(id: string): number; // Wirkstärke oder Schwelle (neutral, wenn abgeschaltet)
  welt(id: WeltId): number;
  schock: SchockWirkung;
}

export type Baustein = (alt: Zustand, neu: Zustand, k: Kontext) => void;
