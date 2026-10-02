import { altersverteilung, teileAuf } from "./alter";
import { aufschlagFormel } from "./anleihenformel";
import { bankenDaten } from "./banken-modus";
import { stromkosten } from "./energiepreis";
import { baueKontext, standardWert, wirkstaerke } from "./kontext";
import { leitzinsBezug } from "./fruehwarnung";
import { clamp } from "./mathe";
import {
  STEUERN,
  type Konstanten,
  type Landesdaten,
  type Szenario,
  type Zustand,
} from "./typen";
import { topf } from "./topf";
import { WELT_STANDARD } from "./welt";

// Werte, die aus den Startdaten folgen und als Landesstandard gespeichert werden.
export function kalibriereStandards(land: Landesdaten): Record<string, number> {
  const s = land.start;
  const w = (id: string) => standardWert(id, land);
  const p = (id: string) => wirkstaerke(id, land);
  const zins0 = (s.effZins / 100) * s.schuldQuote;
  const uebrige =
    s.ausgaben -
    zins0 -
    s.rentenausgaben -
    s.alg -
    w("staat.gesundheit") -
    w("staat.familie") -
    w("staat.verteidigung") -
    w("innov.bildung") -
    w("innov.fue") / 3;
  const r = land.grund.regime;
  const neutral =
    WELT_STANDARD.realzins +
    (r === "euro" ? WELT_STANDARD.euroInflation : r === "hart" ? 0 : w("geld.inflationsziel"));
  const erwartet = 0.5 * s.leitzins + 0.5 * neutral;
  const aufschlag0 = aufschlagFormel(
    land.grund.regime,
    land.grund.tpi,
    s.schuldQuote,
    w("anleihen.auslandsanteil"),
    s.inflation,
    w("geld.inflationsziel"),
    p,
    { nfa: s.nfa, primaer: s.einnahmen - (s.ausgaben - zins0), reserve: s.reserve },
  );
  const rabatt0 = p("anleihen.reserveRabatt") * s.reserve;
  return {
    ...land.standards,
    "staat.uebrige": uebrige,
    "anleihen.laufzeitpraemie": s.rendite - erwartet - aufschlag0 + rabatt0,
    "arbeit.nairu": s.nairu,
    "arbeit.erwerbsquote": s.erwerbsquote,
  };
}

export function startzustand(
  land: Landesdaten,
  sz: Szenario,
): { z: Zustand; c: Konstanten } {
  const s = land.start;
  const k = baueKontext(land, sz, {} as Konstanten, 0);
  const alpha = k.p("wachstum.alpha");
  const delta = k.p("wachstum.abschreibung");
  const okun = k.p("wachstum.okun");

  const alter = altersverteilung(s.bev, s.altersanteile);
  const teile = teileAuf(alter, k.basis("rente.alter"));
  const erwerbspersonen = teile.erwerbsfaehige * s.erwerbsquote;
  const beschaeftigte = erwerbspersonen * (1 - s.alq / 100);
  const luecke = (s.nairu - s.alq) / (okun * 100);
  const lPot = erwerbspersonen * (1 - s.nairu / 100);
  const K = s.kapitalkoeffizient * s.bip;
  const A = s.bip / (1 + luecke) / (K ** alpha * lPot ** (1 - alpha));
  const grenze = A / s.produktivitaetsLuecke;

  const co2Preis = k.basis("energie.co2Preis");
  const strom = stromkosten(
    s.mix,
    { oel: k.welt("oel"), gas: k.welt("gas"), kohle: k.welt("kohle") },
    co2Preis,
    0,
    0,
    k.p,
  );
  const co2Einnahmen = (co2Preis * s.co2Mt) / 1000;
  const verwendung = Math.round(k.basis("energie.co2Verwendung"));
  const entlastung =
    verwendung === 2 ? (co2Einnahmen * 1000) / s.industrieTWh : 0;
  const energieBasis = Math.max(
    5,
    strom + s.netzkosten - k.basis("energie.industrieSubvention") - entlastung,
  );
  const umbau0 =
    k.basis("energie.ausbauTempo") * k.p("energie.umbauKosten") +
    k.basis("energie.netzInvest");

  const rentenBasis =
    ((teile.rentner * (k.basis("rente.niveau") / 100) * s.lohnquote) /
      beschaeftigte) *
    100;
  const algBasis =
    ((erwerbspersonen *
      (s.alq / 100) *
      k.basis("sozial.lohnersatz") *
      s.lohnquote) /
      beschaeftigte) *
    100;
  const steuern0 = STEUERN.reduce(
    (summe, x) => summe + k.basis(`steuer.${x}`) * s.steuerBasen[x],
    0,
  );
  const co2Haushalt = verwendung === 0 ? ((co2Einnahmen * land.waehrung.kurs) / s.bip) * 100 : 0;
  const zins0 = (s.effZins / 100) * s.schuldQuote;
  const primaerausgaben = s.ausgaben - zins0;
  const dsr0 =
    s.privatschuld *
    ((s.leitzins + k.p("privat.zinsaufschlag")) / 100 + k.p("privat.tilgung"));
  const wachstum0 = s.tfpTrend / 100;
  const lb0 = s.exporte - s.importe + (k.p("handel.nfaRendite") / 100) * s.nfa + s.lbRest;
  const ziel = k.basis("geld.inflationsziel");
  const verwundbar0 = { nfa: s.nfa, primaer: s.einnahmen - primaerausgaben, reserve: s.reserve };
  const aufschlag0 = aufschlagFormel(land.grund.regime, sz.grund.tpi, s.schuldQuote, k.basis("anleihen.auslandsanteil"), s.inflation, ziel, k.p, verwundbar0);
  // Die Laufzeitprämie ist mit allen Wirkstärken kalibriert. Sind Teile abgeschaltet, steckte ihr
  // Startwert sonst dauerhaft in der Rendite; die Korrektur gleicht das aus (0 ohne Abschaltung).
  const praemieKorrektur =
    sz.aus.length === 0
      ? 0
      : aufschlagFormel(land.grund.regime, sz.grund.tpi, s.schuldQuote, k.basis("anleihen.auslandsanteil"), s.inflation, ziel, (id) => wirkstaerke(id, land), verwundbar0) - aufschlag0;

  // Banken (Spec 13.6): ohne die sieben Handwerte bleibt alles 0 und der Baustein rechnet nicht.
  const bank = bankenDaten(s);
  const privatZins0 = s.leitzins + k.p("privat.zinsaufschlag");
  const bankKapital0 = bank ? s.bankKapital0! : 0;
  const bilanz0 = bank ? s.bankBilanz0! : 0;
  // Abschreibungen des ruhigen Startjahres je Bilanz. Der Gewinn der Bank deckt sie und bringt dazu die
  // Eigenkapitalrendite (banken.ts, M4).
  const verlust0 = bank
    ? k.p("banken.abschreibung") * (s.npl0! / 100) * k.p("banken.lgd") * s.privatschuld * s.bankKreditAnteil!
    : 0;

  const c: Konstanten = {
    sq0: s.schuldQuote,
    auf0: aufschlag0,
    praemieKorrektur,
    energieBasis,
    userCost0: s.rendite - s.inflation + delta * 100,
    umbau0,
    rentenFaktor: s.rentenausgaben / rentenBasis,
    altenquote0: teile.rentner / Math.max(0.1, erwerbspersonen * (1 - s.nairu / 100)),
    algFaktor: s.alg / algBasis,
    lnLuecke0: Math.log(grenze / A),
    dsr0,
    realzins0: s.leitzins - s.inflation,
    sonstigeEinnahmen: s.einnahmen - steuern0 - co2Haushalt,
    nairu: s.nairu,
    eq0: s.erwerbsquote,
    y0: s.bip,
    lb0,
    // Quote, die den Kapitalkoeffizienten des Startjahres hält, wenn die Produktivität im Trend wächst (M34).
    investAnker: (delta + s.tfpTrend / 100 / (1 - alpha)) * s.kapitalkoeffizient * 100,
    // Gemessener Bestand (M35); fehlt er, der Bestand, den die heutige Investition bei Trendwachstum hält.
    // Bei fester Elastizität bringt ein Euro dort mehr, wo der Bestand klein ist.
    oeffKapital0: Math.max(
      1,
      s.oeffKapitalQuote ?? k.basis("staat.investitionen") / Math.max(0.01, k.p("staat.oeffAbschreibung") + s.tfpTrend / 100),
    ),
    bankVerlust0: bank && bilanz0 > 0 ? verlust0 / bilanz0 : 0,
    bankZiel0: bankKapital0,
    bankMindest: bank ? k.p("schwelle.bankMindest") * bankKapital0 : 0,
    bilanzFaktor: bank && s.privatschuld > 0 ? bilanz0 / s.privatschuld : 0,
  };
  const anteilStrom = k.p("energie.stromAnteilCo2");
  const z: Zustand = {
    jahr: land.datenstand,
    alter,
    migJahrgaenge: [],
    bev: alter.reduce((a, b) => a + b, 0),
    erwerbsfaehige: teile.erwerbsfaehige,
    lebenserwartung: s.lebenserwartung,
    rentner: teile.rentner,
    geburten: 0,
    sterbefaelle: 0,
    zuwanderung: 0,
    abwanderung: 0,
    migErwerbsalter: 0,
    migBeschaeftigte: 0,
    abwErwerbsalter: 0,
    abwBeschaeftigte: 0,
    integrationskosten: 0,
    investAufschlag: 0,
    nairuEff: s.nairu,
    eqEff: s.erwerbsquote,
    knappheit: 0,
    ordnungNiveau: 0,
    kapitalflucht: 0,
    abwanderungOrdnung: 0,
    staatsbetriebVerlust: 0,
    preisstau: s.preisstau0 ?? 0,
    inflationWahr: s.inflation,
    kapitalEffizienz: 1,
    verdeckteSchuld: s.verdeckteSchuld0 ?? 0,
    uebernahme: 0,
    foerderZustand: 1,
    rohstoffExporte: s.rohstoffExporte ?? 0,
    rohstoffMenge: 1,
    rohstoffHaushalt: 0,
    rohstoffFonds: s.rohstoffFonds0 ?? 0,
    exporteOhneRohstoffe: 100,
    schattenkurs: 1,
    ueberbewertung: 0,
    schwarzmarkt: 0,
    mix: { ...s.mix },
    energiepreis: 100,
    importquote: s.importquote,
    co2Strom: anteilStrom * s.co2Mt,
    co2Rest: (1 - anteilStrom) * s.co2Mt,
    co2Mt: s.co2Mt,
    co2Einnahmen,
    umbauInvest: umbau0,
    steuerbar: s.mix.kohle + s.mix.gas + s.mix.oel + s.mix.atom,
    atomZubau: [],
    vcQuote: s.vcBasis,
    fueWirk: 0,
    vcWirk: 0,
    innovBeitrag: 0,
    A,
    grenze,
    K,
    h: 1,
    bildWirk: 0,
    Y: s.bip,
    luecke,
    wachstum: wachstum0,
    wachstumProKopf: wachstum0,
    bipProKopf: s.bip / s.bev,
    hoechstProKopf: s.bip / s.bev,
    minusJahre: 0,
    erwerbspersonen,
    beschaeftigte,
    alq: s.alq,
    investQuote: s.investQuote,
    oeffKapital: 0,
    oeffWirk: 0,
    privatschuld: s.privatschuld,
    dsr: dsr0,
    privatZins: privatZins0,
    kredit: s.privatschuld * (wachstum0 + s.inflation / 100),
    kreditimpuls: 0,
    // Frühwarnung (Spec 13.2): ohne Startwert aus den Daten beginnt die Kreditlücke bei 0.
    kreditTrend: s.kreditTrend0 ?? s.privatschuld,
    kreditSteigung: s.kreditSteigung0 ?? 0,
    kreditluecke: s.privatschuld - (s.kreditTrend0 ?? s.privatschuld),
    zinskurve: s.rendite - leitzinsBezug(k, s.leitzins),
    inflation: s.inflation,
    inflErw: s.inflation,
    leitzins: s.leitzins,
    qe: s.qe,
    preisniveau: 1,
    einnahmen: s.einnahmen,
    primaerausgaben,
    rentenausgaben: s.rentenausgaben,
    algAusgaben: s.alg,
    zinsausgaben: zins0,
    primaer: s.einnahmen - primaerausgaben,
    primaerVorjahr: s.einnahmen - primaerausgaben,
    defizitNom: 0,
    schuldNom: (s.schuldQuote / 100) * s.bip,
    schuldQuote: s.schuldQuote,
    fondsQuote: s.fondsQuote0 ?? 0,
    beitragsAufschlag: 0,
    konsolidierung: 0,
    diskret: 0,
    schuldenregel: 0,
    pauschal: 0,
    politik: [],
    politikKonsol: 0,
    plan: 0,
    politikAufschlag: 0,
    armut: s.armut,
    gini: s.gini,
    ...(() => {
      const t = topf(s.einnahmen, zins0, s.rentenausgaben, k.basis("staat.gesundheit") + k.basis("staat.familie") + s.alg);
      return { topfZins: t.zins, topfRente: t.rente, topfSozial: t.sozial, spielraum: t.rest };
    })(),
    rendite: s.rendite,
    aufschlag: aufschlagFormel(
      land.grund.regime,
      sz.grund.tpi,
      s.schuldQuote,
      k.basis("anleihen.auslandsanteil"),
      s.inflation,
      ziel,
      k.p,
      verwundbar0,
    ),
    effZins: s.effZins,
    schnittNom: 0,
    ventilSeit: 99,
    ventilArt: 0,
    rMinusG: s.effZins - (wachstum0 * 100 + s.inflation),
    weltnachfrage: 1,
    exporte: s.exporte,
    importe: s.importe,
    leistungsbilanz: lb0,
    wechselkurs: 1,
    abwertung: 0,
    nfa: s.nfa,
    reserve: s.reserve,
    energieExportAnteil: s.energieExportAnteil,
    hauspreis: 100,
    hp: 0,
    hausGrund: bank ? -s.hausBewertung0! : 0,
    hausWachstum: bank ? (s.hausWachstum0 ?? 0) : 0,
    hausWert: bank ? s.hausVermoegen0! : 0,
    hausUeber: 0,
    hausTrend: bank ? (s.hausTrend0 ?? 0) : 0,
    hausSteigung: bank ? (s.hausSteigung0 ?? 0) : 0,
    hausluecke: bank ? 0 - (s.hausTrend0 ?? 0) : 0, // hp − Trend, hp startet bei 0
    npl: bank ? s.npl0! : 0,
    bilanz: bilanz0,
    bankKapitalBetrag: (bankKapital0 / 100) * bilanz0,
    bankKapital: bankKapital0,
    rettung: 0,
    klemme: 0,
    kreditUeber: 0,
    rReal: clamp(s.rendite - s.inflation, -5, 15),
    lage: "stagnation",
  };
  return { z, c };
}
