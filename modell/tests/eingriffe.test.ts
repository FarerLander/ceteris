import { LAENDER, RUECKBLICK } from "../../app/land";
import {
  druck,
  engSchritt,
  istVorwahljahr,
  istWahljahr,
  jahreSeitWahl,
  naechstesWahljahr,
  schwaecheOption,
  struktur,
  vorwahl,
  wirksamkeit,
  wirkungIm,
  type Lagebild,
  type Wirkung,
} from "../eingriffe";
import { baueKontext, standardWert } from "../kontext";
import { PAKETE } from "../pakete";
import { konsolidiere, neuerStand } from "../politik";
import { basisSzenario, rechne } from "../rechne";
import { startzustand } from "../start";
import type { Landesdaten, Pfad, Startwerte, Zustand } from "../typen";
import { eintrag } from "../verzeichnis";
import { testland } from "./testland";
import { probe } from "../../docs/methodik/probe-deutschland";

// Spec 13.13: Eingriffe der Regierung als Optionen. Hier die Bausteine, ohne Jahreslauf.
const mitTakt = (politik: Landesdaten["politik"], start: Partial<Startwerte> = {}): Landesdaten => ({ ...testland(start), politik });
const TAKT = { legislatur: 4, letzteWahl: 2025, takt: 1, wirksamkeit: 85 };

describe("Wirksamkeit und Wahltakt (Task 6)", () => {
  it("Land ohne Block: Wirksamkeit 0,7, kein Takt", () => {
    const l = testland();
    expect(wirksamkeit(l)).toBe(0.7);
    expect(jahreSeitWahl(l, 2027)).toBeNull();
    expect(naechstesWahljahr(l, 2030)).toBeNull();
    for (let j = 2020; j < 2040; j++) expect(istWahljahr(l, j) || istVorwahljahr(l, j)).toBe(false);
  });
  it("Legislatur 4 ab 2025: Wahljahre 2025, 2029, 2033; Vorwahljahre 2028, 2032", () => {
    const l = mitTakt(TAKT);
    expect(wirksamkeit(l)).toBe(0.85);
    const jahre = Array.from({ length: 12 }, (_, i) => 2023 + i);
    expect(jahre.filter((j) => istWahljahr(l, j))).toEqual([2025, 2029, 2033]);
    expect(jahre.filter((j) => istVorwahljahr(l, j))).toEqual([2024, 2028, 2032]);
    expect(jahreSeitWahl(l, 2027)).toBe(2);
    expect(jahreSeitWahl(l, 2023)).toBe(2); // vor der letzten Wahl: 2021 war Wahljahr
    expect(naechstesWahljahr(l, 2030)).toBe(2033);
    expect(naechstesWahljahr(l, 2029)).toBe(2029);
  });
  it("Gewicht 0: Takt vorhanden, aber kein Wahljahr", () => {
    const l = mitTakt({ ...TAKT, takt: 0 });
    expect(jahreSeitWahl(l, 2025)).toBeNull();
    expect(istWahljahr(l, 2025)).toBe(false);
    expect(istVorwahljahr(l, 2028)).toBe(false);
    expect(naechstesWahljahr(l, 2026)).toBeNull();
  });
});

describe("Struktur des Landes (Task 6)", () => {
  // Sozialquote des Modells: Rente + Gesundheit + Familie + Arbeitslosengeld.
  const rest = (l: Landesdaten) => standardWert("staat.gesundheit", l) + standardWert("staat.familie", l) + l.start.alg;
  const mitSozial = (quote: number, start: Partial<Startwerte> = {}) => testland({ rentenausgaben: quote - rest(testland()), importquote: 0.2, exporte: 42, importe: 42, lbRest: 0, ...start });
  const s = (l: Landesdaten, aus: string[] = []) => struktur(l, { ...basisSzenario(l), aus });
  it("ausgebauter Sozialstaat → sozial", () => expect(s(mitSozial(30))).toBe("sozial"));
  it("Energieimporteur → energie", () => expect(s(mitSozial(15, { importquote: 0.9 }))).toBe("energie"));
  it("Leistungsbilanzdefizit → handel", () => expect(s(mitSozial(15, { exporte: 38, importe: 42 }))).toBe("handel"));
  it("kein Signal über der Schwelle → markt", () => expect(s(mitSozial(15))).toBe("markt"));
  it("zwei Signale: das größere gewinnt", () => {
    expect(s(mitSozial(30, { importquote: 0.8 }))).toBe("sozial"); // 1,5 gegen 1,07
    expect(s(mitSozial(22, { importquote: 1.2 }))).toBe("energie"); // 1,1 gegen 1,6
  });
  it("abgeschaltete Schwelle: das Signal zählt nicht", () => {
    expect(s(mitSozial(30), ["politik.sozialSchwelle"])).toBe("markt");
  });
  it("Nettoexporteur von Energie (negative Importquote) ist kein Energieimporteur", () => {
    expect(s(mitSozial(15, { importquote: -0.9 }))).toBe("markt");
  });
});

describe("Landesdaten (Task 6)", () => {
  it("alle neun Länder haben den Block, Wirksamkeit 20–100, letzte Wahl nicht nach dem Datenstand", () => {
    expect(Object.keys(LAENDER)).toHaveLength(9);
    for (const [c, l] of Object.entries(LAENDER)) {
      const p = l.politik!;
      expect([c, p !== undefined && p.wirksamkeit >= 20 && p.wirksamkeit <= 100]).toEqual([c, true]);
      expect([c, p.letzteWahl <= l.datenstand, p.legislatur >= 4 && p.legislatur <= 6]).toEqual([c, true, true]);
    }
    expect(Object.entries(LAENDER).filter(([, l]) => l.politik!.takt === 0).map(([c]) => c)).toEqual(["CN", "RU"]);
  });
  it("Rückblick Deutschland: Takt ab 1998, Wirksamkeit des Jahres 2000", () => {
    expect(RUECKBLICK.land.politik).toEqual({ legislatur: 4, letzteWahl: 1998, takt: 1, wirksamkeit: 89 });
  });
  // Ist-Stand (Kritikpunkt M29).
  it("Struktur der neun Länder", () => {
    const ist = Object.fromEntries(Object.entries(LAENDER).map(([c, l]) => [c, struktur(l, basisSzenario(l))]));
    expect(ist).toEqual({ DE: "sozial", US: "markt", JP: "energie", GB: "markt", FR: "sozial", IT: "sozial", CA: "handel", CN: "markt", RU: "markt" });
    expect(struktur(RUECKBLICK.land, RUECKBLICK.sz)).toBe("sozial");
  });
});

// ---------- Task 8: Druck, Vorwahl, Optionen ----------
const p = (id: string, land: Landesdaten = testland()) => standardWert(id, land);
// Lage im Jahr datenstand + t, aus einem festen Lauf; `alt` lässt sich überschreiben.
function lage(land: Landesdaten, t: number, alt: Partial<Zustand> = {}, schwachJahre: boolean[] = [], stell: Record<string, Pfad> = {}, aus: string[] = []) {
  // Die Lagen sind vor M29 gemessen: ohne Haushaltsplan, damit sie dieselben bleiben.
  const sz = { ...basisSzenario(land, t + 1), stell, aus, grund: { ...land.grund, politik: "fest" as const, haushaltsplan: "aus" as const } };
  const v = rechne(land, sz);
  const { c } = startzustand(land, sz);
  const k = baueKontext(land, sz, c, t);
  const l: Lagebild = { jahr: land.datenstand + t, alt: { ...v[t - 1], ...alt }, schwachJahre, k, sz };
  return { l, w: k.w, land };
}
const RUHIG = { schuldenregel: 0, aufschlag: 0, lage: "wachstum" as const };
const wahr = (n: number) => Array.from({ length: n }, () => true);

describe("wirkungIm", () => {
  const w: Wirkung = { id: "x", delta: 3, ab: 2030, gleit: 3, bis: 2035 };
  it("vor dem Beginn 0, Rampe über die Gleitjahre, nach dem Ende 0", () => {
    expect([2029, 2030, 2031, 2032, 2033, 2035, 2036].map((j) => wirkungIm(w, j))).toEqual([0, 1, 2, 3, 3, 3, 0]);
  });
  it("Gleitjahre 1: sofort voll; ohne Ende dauerhaft", () => {
    expect(wirkungIm({ id: "x", delta: 2, ab: 2030, gleit: 1 }, 2030)).toBe(2);
    expect(wirkungIm({ id: "x", delta: 2, ab: 2030, gleit: 1 }, 2130)).toBe(2);
  });
});

describe("druck", () => {
  const land = testland();
  it("Schwäche: Anteil schwacher Jahre der letzten sieben plus Abstand der Arbeitslosigkeit", () => {
    const { l } = lage(land, 3);
    const hoch = { ...l, alt: { ...l.alt, alq: l.alt.nairuEff + 5 }, schwachJahre: wahr(7) };
    expect(druck("schwaeche", hoch)).toBeCloseTo(1 + 3 / 5, 12);
    expect(druck("schwaeche", { ...l, alt: { ...l.alt, alq: l.alt.nairuEff }, schwachJahre: [] })).toBe(0);
    expect(druck("schwaeche", { ...l, alt: { ...l.alt, alq: l.alt.nairuEff }, schwachJahre: [true, ...wahr(3).map(() => false), ...wahr(3)] })).toBeCloseTo(4 / 7, 12);
  });
  it("enger Haushalt: Spielraum, Zinslast, Aufschlag", () => {
    const { l } = lage(land, 3, { spielraum: 5, topfZins: 20, aufschlag: 1.5 });
    expect(druck("eng", l)).toBeCloseTo(0.5 + 0.5 + 0.5, 12);
    expect(druck("eng", lage(land, 3, { spielraum: 30, topfZins: 5, aufschlag: -0.2 }).l)).toBe(0);
  });
});

describe("vorwahl", () => {
  const stark = mitTakt(TAKT); // q 0,85; Wahljahre 2025, 2029
  const hoch = (land: Landesdaten, t: number, n = 8, alt: Partial<Zustand> = {}) => {
    const x = lage(land, t, RUHIG, wahr(n));
    return { ...x, l: { ...x.l, alt: { ...x.l.alt, alq: x.l.alt.nairuEff + 5, ...alt } } };
  };
  const niedrig = (land: Landesdaten, t: number, alt: Partial<Zustand> = {}) => {
    const x = lage(land, t, RUHIG, [false, false, true, true, true]);
    return { ...x, l: { ...x.l, alt: { ...x.l.alt, alq: x.l.alt.nairuEff, ...alt } } };
  };
  it("hoher Druck, zwei Jahre nach der Wahl: Unbequem", () => {
    const x = hoch(stark, 2);
    expect(x.l.jahr).toBe(2027);
    expect(vorwahl("schwaeche", x.l, x.w)).toBe("unbequem");
  });
  it("derselbe Druck im Vorwahljahr und im Wahljahr: Machterhalt", () => {
    expect(vorwahl("schwaeche", hoch(stark, 3).l, hoch(stark, 3).w)).toBe("macht");
    expect(vorwahl("schwaeche", hoch(stark, 4).l, hoch(stark, 4).w)).toBe("macht");
  });
  it("niedriger Druck: Richtung; nach einem Krisenjahr: Machterhalt", () => {
    expect(vorwahl("schwaeche", niedrig(stark, 2).l, niedrig(stark, 2).w)).toBe("richtung");
    const k = niedrig(stark, 2, { lage: "krise" });
    expect(vorwahl("schwaeche", k.l, k.w)).toBe("macht");
  });
  it("Machterhalt trotz greifender Schuldenregel (sie wird umgangen); nicht möglich nur bei Aufschlag über der Schwelle", () => {
    const a = hoch(stark, 3, 8, { schuldenregel: 0.5 });
    expect(vorwahl("schwaeche", a.l, a.w)).toBe("macht");
    const b = hoch(stark, 3, 8, { aufschlag: p("schwelle.aufschlag") + 1 });
    expect(vorwahl("schwaeche", b.l, b.w)).toBe("richtung");
  });
  it("Großprogramm nur ab und zu: liegt das letzte weniger als zehn Jahre zurück, stützt die Regierung mit Ausgaben", () => {
    const x = niedrig(stark, 2);
    expect(vorwahl("schwaeche", x.l, x.w)).toBe("richtung");
    expect(vorwahl("schwaeche", { ...x.l, letztesProgramm: 2020 }, x.w)).toBe("macht");
    expect(vorwahl("schwaeche", { ...x.l, letztesProgramm: 2017 }, x.w)).toBe("richtung");
    // Geht Machterhalt nicht (Märkte), zwingen sie zur unbequemen Entscheidung.
    const y = niedrig(stark, 2, { aufschlag: p("schwelle.aufschlag") + 1 });
    expect(vorwahl("schwaeche", { ...y.l, letztesProgramm: 2020 }, y.w)).toBe("unbequem");
    // Beim engen Haushalt ist „Richtung“ kein Programm, sondern Lastenverteilung: keine Sperre.
    const e = lage(stark, 2, { ...RUHIG, spielraum: 8, topfZins: 10 });
    expect(vorwahl("eng", { ...e.l, letztesProgramm: 2020 }, e.w)).toBe("richtung");
  });
  it("schwache Regierung (q 0,4): derselbe Druck reicht nicht; die Schwäche muss sieben Jahre anhalten", () => {
    const schwachReg = mitTakt({ ...TAKT, wirksamkeit: 40 });
    // Druck 1 (sieben schwache Jahre, keine Lücke am Arbeitsmarkt): bei q 0,85 Unbequem, bei 0,4 Richtung.
    const ohneLuecke = (land: Landesdaten) => {
      const x = lage(land, 2, RUHIG, wahr(9));
      return { ...x, l: { ...x.l, alt: { ...x.l.alt, alq: x.l.alt.nairuEff } } };
    };
    expect(druck("schwaeche", ohneLuecke(stark).l)).toBe(1);
    // Ohne Lücke am Arbeitsmarkt passt das Paket „Gründungen“.
    expect(vorwahl("schwaeche", ohneLuecke(stark).l, ohneLuecke(stark).w)).toBe("unbequem");
    expect(vorwahl("schwaeche", ohneLuecke(schwachReg).l, ohneLuecke(schwachReg).w)).toBe("richtung");
    // Hoher Druck: 6 der letzten 8 Jahre reichen bei q 0,4 nicht (5 + round(4 · 0,6) = 7 nötig).
    const sechs = hoch(schwachReg, 2, 0);
    const mit = (jahre: boolean[]) => vorwahl("schwaeche", { ...sechs.l, schwachJahre: jahre }, sechs.w);
    expect(mit([false, false, false, ...wahr(6)])).toBe("richtung");
    expect(mit([false, false, ...wahr(7)])).toBe("unbequem");
    // Bei q 0,85 reichen sechs (5 + round(4 · 0,15) = 6).
    const s6 = hoch(stark, 2, 0);
    expect(vorwahl("schwaeche", { ...s6.l, schwachJahre: [false, false, ...wahr(6)] }, s6.w)).toBe("unbequem");
    expect(vorwahl("schwaeche", { ...s6.l, schwachJahre: [false, false, false, ...wahr(5)] }, s6.w)).toBe("richtung");
  });
  it("enger Haushalt: Unbequem nur bei hohem Druck und nicht vor der Wahl", () => {
    const eng = (t: number, alt: Partial<Zustand>) => lage(stark, t, { ...RUHIG, ...alt });
    expect(vorwahl("eng", eng(2, { spielraum: 2, topfZins: 22 }).l, eng(2, {}).w)).toBe("unbequem"); // Druck 1,5
    expect(vorwahl("eng", eng(3, { spielraum: 2, topfZins: 22 }).l, eng(3, {}).w)).toBe("macht");
    expect(vorwahl("eng", eng(2, { spielraum: 8, topfZins: 10 }).l, eng(2, {}).w)).toBe("richtung"); // Druck 0,2
  });
  it("ohne Wahltakt: nie Machterhalt wegen einer Wahl", () => {
    const x = lage(testland(), 4, RUHIG, [false, false, true, true, true]);
    expect(vorwahl("schwaeche", { ...x.l, alt: { ...x.l.alt, alq: x.l.alt.nairuEff } }, x.w)).toBe("richtung");
  });
});

describe("schwaecheOption", () => {
  const land = mitTakt(TAKT);
  const dauerhaft = (ws: Wirkung[], id: string) => ws.filter((w) => w.id === id && w.bis === undefined).reduce((a, w) => a + w.delta, 0);
  it("Machterhalt: Ausgaben +1 % BIP für zwei Jahre, 0,3 bleiben; die Einkommensteuer holt sie schleichend zurück", () => {
    const { l, w } = lage(land, 2, RUHIG);
    const o = schwaecheOption("macht", l, w)!;
    const j = l.jahr;
    const summe = (id: string, jahr: number) => o.wirkungen.filter((x) => x.id === id).reduce((a, x) => a + wirkungIm(x, jahr), 0);
    expect([j, j + 1, j + 2, j + 30].map((y) => summe("staat.uebrige", y))).toEqual([1, 1, 0.3, 0.3]);
    const basis = land.start.steuerBasen.einkommen;
    expect(summe("steuer.einkommen", j + 30) * basis).toBeCloseTo(0.3, 6);
    expect(dauerhaft(o.wirkungen, "staat.uebrige")).toBeCloseTo(dauerhaft(o.wirkungen, "steuer.einkommen") * basis, 6);
    // Je Jahr höchstens die kalte Progression.
    for (let y = j; y < j + 10; y++) expect(summe("steuer.einkommen", y + 1) - summe("steuer.einkommen", y)).toBeLessThanOrEqual(p("politik.kalteProgression") + 1e-12);
    expect(summe("steuer.einkommen", j)).toBe(0);
    expect(o.struktur).toBeUndefined();
    expect(o.paket).toBeUndefined();
  });
  it("Machterhalt ohne Sperrklinke: nichts bleibt, keine Gegenfinanzierung", () => {
    const { l, w } = lage(land, 2, RUHIG, [], {}, ["politik.sperrklinke"]);
    const o = schwaecheOption("macht", l, w)!;
    expect(o.wirkungen).toEqual([{ id: "staat.uebrige", delta: 1, ab: l.jahr, gleit: 1, bis: l.jahr + 1 }]);
  });
  it("Machterhalt unmöglich nur, wenn der Aufschlag hoch ist; die Schuldenregel hält nicht ab", () => {
    expect(schwaecheOption("macht", lage(land, 2, { ...RUHIG, schuldenregel: 0.4 }).l, lage(land, 2).w)).not.toBeNull();
    expect(schwaecheOption("macht", lage(land, 2, { ...RUHIG, aufschlag: 3.5 }).l, lage(land, 2).w)).toBeNull();
  });
  // Land, dessen Struktur gezielt gesetzt ist.
  const mitStruktur = (start: Partial<Startwerte>) => mitTakt(TAKT, { importquote: 0.2, exporte: 42, importe: 42, lbRest: 0, rentenausgaben: 6, ...start });
  it("Richtung sozial: Rentenniveau und Familienleistungen, zusammen 1 % BIP, gleitend über drei Jahre", () => {
    const { l, w } = lage(mitStruktur({ rentenausgaben: 14 }), 2, RUHIG);
    const o = schwaecheOption("richtung", l, w)!;
    expect(o.struktur).toBe("sozial");
    expect(o.wirkungen.map((x) => x.id).sort()).toEqual(["rente.niveau", "staat.familie"]);
    const d = Object.fromEntries(o.wirkungen.map((x) => [x.id, x.delta]));
    expect(d["staat.familie"]).toBeCloseTo(0.4, 12);
    expect((d["rente.niveau"] * l.alt.rentenausgaben) / w("rente.niveau")).toBeCloseTo(0.6, 9);
    for (const x of o.wirkungen) expect([x.ab, x.gleit, x.bis]).toEqual([l.jahr, 3, undefined]);
  });
  it("Richtung energie: Zuschuss für Industriestrom, 1 % BIP oder bis zum Rand des Bereichs", () => {
    const x = lage(mitStruktur({ importquote: 0.95, industrieTWh: 2000 }), 2, RUHIG);
    const o = schwaecheOption("richtung", x.l, x.w)!;
    expect(o.struktur).toBe("energie");
    expect(o.wirkungen).toHaveLength(1);
    const jeEuro = ((2000 * x.land.waehrung.kurs) / 1000 / x.l.alt.Y) * 100;
    expect(o.wirkungen[0].id).toBe("energie.industrieSubvention");
    expect(o.wirkungen[0].delta * jeEuro).toBeCloseTo(1, 9);
    // Kleiner Industriestromverbrauch: Der Zuschuss stößt an die Bereichsgrenze.
    const y = lage(mitStruktur({ importquote: 0.95, industrieTWh: 230 }), 2, RUHIG);
    expect(schwaecheOption("richtung", y.l, y.w)!.wirkungen[0].delta).toBe(eintrag("energie.industrieSubvention").bereich![1]);
  });
  it("Richtung handel: Zölle +10 Punkte; am oberen Rand bleibt nichts zu tun", () => {
    const land2 = mitStruktur({ exporte: 37, importe: 42 });
    const x = lage(land2, 2, RUHIG);
    const o = schwaecheOption("richtung", x.l, x.w)!;
    expect(o.struktur).toBe("handel");
    expect(o.wirkungen).toEqual([{ id: "handel.zoelle", delta: 10, ab: x.l.jahr, gleit: 3 }]);
    // G2: Am oberen Rand gibt es kein Programm mehr: Die Option ist nicht möglich.
    const rand = lage(land2, 2, RUHIG, [], { "handel.zoelle": 30 });
    expect(schwaecheOption("richtung", rand.l, rand.w)).toBeNull();
    const fast = lage(land2, 2, RUHIG, [], { "handel.zoelle": 26 });
    expect(schwaecheOption("richtung", fast.l, fast.w)!.wirkungen[0].delta).toBe(4);
  });
  it("Richtung markt: Unternehmen- und Einkommensteuer sinken, zusammen 1 % BIP", () => {
    const x = lage(mitStruktur({}), 2, RUHIG);
    const o = schwaecheOption("richtung", x.l, x.w)!;
    expect(o.struktur).toBe("markt");
    const b = x.land.start.steuerBasen;
    const d = Object.fromEntries(o.wirkungen.map((w) => [w.id, w.delta]));
    expect(d["steuer.unternehmen"] * b.unternehmen).toBeCloseTo(-0.5, 9);
    expect(d["steuer.einkommen"] * b.einkommen).toBeCloseTo(-0.5, 9);
  });
  it("Unbequem bei hoher Arbeitslosigkeit: ein Teil von „Länger arbeiten“, nach einer Legislatur teils zurück", () => {
    const x = lage(land, 2, RUHIG);
    const l = { ...x.l, alt: { ...x.l.alt, alq: x.l.alt.nairuEff + 3 } };
    const o = schwaecheOption("unbequem", l, x.w)!;
    expect(o.paket).toBe("arbeit");
    const umsetzung = 0.3 + 0.5 * 0.85;
    const vor = o.wirkungen.filter((w) => !w.ruecknahme);
    expect(vor.find((w) => w.id === "rente.alter")!.delta).toBeCloseTo(umsetzung * (69 - x.w("rente.alter")), 12);
    expect(vor.find((w) => w.id === "rente.niveau")!.delta).toBeCloseTo(umsetzung * (47 - x.w("rente.niveau")), 12);
    for (const w of vor) expect([w.ab, w.gleit, w.bis]).toEqual([2027, 3, undefined]);
    // Rücknahme im ersten Wahljahr, das mindestens eine Legislatur später liegt: 2027 + 4 = 2031 → 2033.
    const zurueck = o.wirkungen.filter((w) => w.ruecknahme);
    expect(zurueck).toHaveLength(vor.length);
    for (const w of zurueck) {
      expect([w.ab, w.gleit, w.bis]).toEqual([2033, 1, undefined]);
      expect(w.delta).toBeCloseTo(-0.3 * vor.find((v) => v.id === w.id)!.delta, 12);
    }
  });
  it("Unbequem ohne Lücke am Arbeitsmarkt: ein Teil von „Gründungen finanzieren“, ohne Schalter und ohne Rentensystem", () => {
    const x = lage(land, 2, RUHIG);
    const l = { ...x.l, alt: { ...x.l.alt, alq: x.l.alt.nairuEff } };
    const o = schwaecheOption("unbequem", l, x.w)!;
    expect(o.paket).toBe("gruendungen");
    expect(o.wirkungen.filter((w) => !w.ruecknahme).map((w) => w.id).sort()).toEqual(["innov.fue", "steuer.kapitalertrag"]);
  });
  it("Unbequem ohne Wahltakt: keine Rücknahme; mit abgeschalteter Rücknahme auch nicht", () => {
    const ohne = lage(testland(), 2, RUHIG);
    expect(schwaecheOption("unbequem", ohne.l, ohne.w)!.wirkungen.some((w) => w.ruecknahme)).toBe(false);
    const aus = lage(land, 2, RUHIG, [], {}, ["politik.ruecknahme"]);
    expect(schwaecheOption("unbequem", aus.l, aus.w)!.wirkungen.some((w) => w.ruecknahme)).toBe(false);
  });
  it("Unbequem: Paket schon ausgeschöpft → nicht möglich", () => {
    const paket = PAKETE.find((x) => x.id === "gruendungen")!;
    const voll = lage(land, 2, RUHIG, [], { "innov.fue": 4.5, "steuer.kapitalertrag": 0.22 });
    expect(Object.keys(paket.setze(voll.w, voll.w, voll.l.sz.grund).stell)).toContain("innov.fue");
    const l = { ...voll.l, alt: { ...voll.l.alt, alq: voll.l.alt.nairuEff } };
    expect(schwaecheOption("unbequem", l, voll.w)).toBeNull();
    // Die Vorwahl weicht dann auf die nächste Stufe aus.
    expect(vorwahl("schwaeche", { ...l, schwachJahre: wahr(9) }, voll.w)).toBe("richtung");
  });
});

describe("W1: Änderungen kehren ihr Vorzeichen nie um", () => {
  it("Großprogramm sozial, wenn das Rentenniveau schon über dem Bereich liegt: keine Kürzung der Rente", () => {
    const land = mitTakt(TAKT, { rentenausgaben: 14, importquote: 0.2, exporte: 42, importe: 42, lbRest: 0 });
    const x = lage(land, 2, RUHIG);
    // wirksam über dem oberen Rand (70), etwa nach einem Pfad, der später springt.
    const w = (id: string) => (id === "rente.niveau" ? 74.55 : x.w(id));
    const o = schwaecheOption("richtung", x.l, w)!;
    expect(o.wirkungen.every((v) => v.delta >= 0)).toBe(true);
    expect(o.wirkungen.map((v) => v.id)).toEqual(["staat.familie"]);
  });
});

describe("konsolidiere: Faktor und Sperrklinke", () => {
  const BEREICHE = ["staat.uebrige", "energie.industrieSubvention", "rente.niveau", "staat.gesundheit", "staat.familie", "staat.verteidigung", "innov.bildung"];
  function fall(code: string, t: number, stell: Record<string, Pfad> = {}) {
    // Gemessen vor dem gleitenden Investitionsanker und der Rentenanpassung nach Landesrecht.
    const x = lage(LAENDER[code], t, {}, [], stell, ["wachstum.investAnpassung", "rente.anpassung", "rente.indexierung"]);
    const stand = neuerStand();
    for (const id of BEREICHE) stand.kuerzBasis[id] = x.w(id);
    return { ...x, stand };
  }
  // Gemessen vor der Änderung (Stand vor der Änderung), Lauf mit Politik fest.
  it.each([
    ["US", 20, {}, { "steuer.einkommen": 0.0035714285714285718, "steuer.mwst": 0.006666666666666667, "staat.uebrige": -0.03420936355433746, "rente.niveau": -3.522473468425588 }],
    ["US", 40, { "politik.steueranteil": 0 }, { "staat.uebrige": -0.03420936355433746, "rente.niveau": -4.875817717478125 }],
    ["IT", 30, { "politik.kuerzeAlles": 1 }, { "steuer.einkommen": 0.0036363636363636364, "steuer.mwst": 0.006666666666666667, "staat.uebrige": -0.6 }],
  ] as const)("ohne neue Argumente wie vorher: %s, Jahr %d", (code, t, stell, soll) => {
    const f = fall(code, t, stell);
    expect(konsolidiere(f.stand, f.l.alt, f.l.k, f.w)).toBe(1);
    expect(f.stand.kuerzung).toEqual(soll);
  });
  it("Faktor 0,5: halber Betrag", () => {
    const f = fall("IT", 30, { "politik.kuerzeAlles": 1 });
    expect(konsolidiere(f.stand, f.l.alt, f.l.k, f.w, 0.5)).toBeCloseTo(0.5, 12);
    expect(f.stand.kuerzung["staat.uebrige"]).toBeCloseTo(-0.3, 12);
    expect(f.stand.kuerzung["steuer.mwst"]).toBeCloseTo(0.006666666666666667 / 2, 12);
  });
  it("Sperrklinke: Rentenniveau halb so schnell, der Rest wandert zur nächsten Position", () => {
    const ohne = fall("US", 40, { "politik.steueranteil": 0 });
    konsolidiere(ohne.stand, ohne.l.alt, ohne.l.k, ohne.w);
    const mit = fall("US", 40, { "politik.steueranteil": 0 });
    const umgesetzt = konsolidiere(mit.stand, mit.l.alt, mit.l.k, mit.w, 1, true);
    const moeglich = Math.min((p("politik.kuerzGrenze") / 100) * mit.stand.kuerzBasis["rente.niveau"], mit.w("rente.niveau") - eintrag("rente.niveau").bereich![0]);
    expect(mit.stand.kuerzung["rente.niveau"]).toBeCloseTo(-Math.min(moeglich / 2, -ohne.stand.kuerzung["rente.niveau"]), 9);
    expect(Math.abs(mit.stand.kuerzung["rente.niveau"])).toBeLessThan(Math.abs(ohne.stand.kuerzung["rente.niveau"]));
    expect(mit.stand.kuerzung["staat.gesundheit"]).toBeLessThan(0);
    expect(ohne.stand.kuerzung["staat.gesundheit"]).toBeUndefined();
    expect(umgesetzt).toBeCloseTo(1, 9);
  });
});

describe("engSchritt", () => {
  // Gemessen vor der Rentenanpassung nach Landesrecht: Mit ihr ist der Haushalt der USA 2065 nicht eng.
  const eng = (land: Landesdaten, stell: Record<string, Pfad> = {}) => {
    const x = lage(land, 40, {}, [], stell, ["rente.anpassung", "rente.indexierung"]);
    return { ...x, stand: neuerStand() };
  };
  const US = LAENDER.US;
  it("Machterhalt: versteckte Einnahmen und aufgeschobene Investitionen", () => {
    const f = eng(US);
    const umgesetzt = engSchritt("macht", f.stand, f.l, f.w);
    const k = f.stand.kuerzung;
    expect(k["steuer.sozialabgaben"]).toBe(0.002);
    expect(k["steuer.einkommen"]).toBe(0.002);
    // Sparschritt 1 % BIP: Investitionen −0,3, Bildung −0,1, Netze −0,1.
    expect(k["staat.investitionen"]).toBeCloseTo(-0.3, 12);
    expect(k["innov.bildung"]).toBeCloseTo(-0.1, 12);
    // Netze: höchstens 20 % des Werts zu Beginn (USA 0,3 % BIP → 0,06).
    const netz = Math.min(0.1, 0.2 * f.w("energie.netzInvest"));
    expect(netz).toBeLessThan(0.1);
    expect(k["energie.netzInvest"]).toBeCloseTo(-netz, 12);
    expect(Object.keys(k).sort()).toEqual(["energie.netzInvest", "innov.bildung", "staat.investitionen", "steuer.einkommen", "steuer.sozialabgaben"]);
    const b = US.start.steuerBasen;
    expect(umgesetzt).toBeCloseTo(0.4 + netz + 0.002 * (b.sozialabgaben + b.einkommen), 9);
  });
  it("Machterhalt über Jahre: kein Bereich sinkt um mehr als 20 % seines Werts zu Beginn", () => {
    const f = eng(US);
    const start = f.w("energie.netzInvest");
    for (let i = 0; i < 30; i++) engSchritt("macht", f.stand, f.l, (id) => f.w(id) + (f.stand.kuerzung[id] ?? 0));
    expect(f.stand.kuerzung["energie.netzInvest"]).toBeCloseTo(-0.2 * start, 9);
    expect(f.stand.kuerzung["staat.investitionen"]).toBeCloseTo(-0.2 * f.w("staat.investitionen"), 9);
  });
  it("Richtung im Sozialstaat: nur Steuern auf Kapitalertrag, Vermögen und Unternehmen, je ein Drittel", () => {
    const FR = LAENDER.FR;
    const f = eng(FR);
    expect(struktur(FR, f.l.sz)).toBe("sozial");
    const umgesetzt = engSchritt("richtung", f.stand, f.l, f.w);
    const b = FR.start.steuerBasen;
    const k = f.stand.kuerzung;
    expect(Object.keys(k).sort()).toEqual(["steuer.kapitalertrag", "steuer.unternehmen", "steuer.vermoegen"]);
    for (const x of ["kapitalertrag", "vermoegen", "unternehmen"] as const) expect(k[`steuer.${x}`] * b[x]).toBeCloseTo(umgesetzt / 3, 9);
    expect(umgesetzt).toBeGreaterThan(0);
  });
  it("Richtung sonst: Lohnersatz, Familie, Rentenniveau in dieser Reihenfolge", () => {
    const f = eng(US, { "politik.steueranteil": 0 });
    expect(struktur(US, f.l.sz)).toBe("markt");
    const umgesetzt = engSchritt("richtung", f.stand, f.l, f.w);
    const k = f.stand.kuerzung;
    expect(Object.keys(k).every((id) => ["sozial.lohnersatz", "staat.familie", "rente.niveau"].includes(id))).toBe(true);
    expect(k["sozial.lohnersatz"]).toBeLessThan(0);
    expect(umgesetzt).toBeCloseTo(1, 9);
    // Lohnersatz höchstens 20 % seines Werts.
    expect(k["sozial.lohnersatz"]).toBeGreaterThanOrEqual(-0.2 * f.w("sozial.lohnersatz") - 1e-12);
  });
  it("Unbequem: die Konsolidierung mal Umsetzungsgrad, mit Sperrklinke", () => {
    const f = eng(US);
    const umgesetzt = engSchritt("unbequem", f.stand, f.l, f.w);
    const g = eng(US);
    for (const id of ["staat.uebrige", "energie.industrieSubvention", "rente.niveau", "staat.gesundheit", "staat.familie", "staat.verteidigung", "innov.bildung"]) g.stand.kuerzBasis[id] = g.w(id);
    const soll = konsolidiere(g.stand, g.l.alt, g.l.k, g.w, 0.3 + 0.5 * 0.77, true);
    expect(umgesetzt).toBe(soll);
    expect(f.stand.kuerzung).toEqual(g.stand.kuerzung);
    expect(umgesetzt).toBeCloseTo(0.3 + 0.5 * 0.77, 9);
  });
});

// ---------- Task 10: Deutsche Probe ----------
// Der Rückblick rechnet fest; die Probe fragt an jedem Jahr, was die Regel gewählt hätte (Auslöser aus den
// gemessenen Reihen, tatsächliche Wahljahre). Ergebnis: docs/methodik/ergebnis-probe.txt, Einordnung in Kritikpunkt M29.
describe("Deutsche Probe (Spec 13.13, Erwartungen aus der Spec)", () => {
  const zeile = (jahr: number) => probe({}, true).find((z) => z.jahr === jahr)!;
  it("2025: Machterhalt (Wahljahr, anhaltende Schwäche); Sondervermögen außerhalb der Schuldenbremse", () => {
    expect(zeile(2025).falls).toBe("macht");
    expect(zeile(2025).ereignisse[0]).toMatchObject({ ausloeser: "schwaeche", motiv: "macht" });
  });
  it("2014: Großprogramm für Renten und Familien (Rente mit 63)", () => {
    expect(zeile(2014).ereignisse[0]).toMatchObject({ ausloeser: "schwaeche", motiv: "richtung", struktur: "sozial" });
  });
  it("2010, nach der Krise: Konjunktur mit Ausgaben (die Pakete von 2009 kommen ein Jahr später)", () => {
    expect(zeile(2010).ereignisse[0]).toMatchObject({ ausloeser: "schwaeche", motiv: "macht" });
  });
  it("Die Regel greift nur, wenn es einen Punkt gibt: 2009 (Krise, Wahljahr) und 2003 lösen keinen aus", () => {
    expect(zeile(2009).ereignisse).toEqual([]);
    expect(zeile(2003).ereignisse).toEqual([]);
  });
  // Bekannte Lücke (M29): Das Modell startet Deutschland 2000 mit einer strukturellen Arbeitslosigkeit von 7,5 %;
  // die gemessene Quote (9,8 % im Jahr 2003) liegt nur knapp darüber. Bis drei von fünf Jahren schwach sind,
  // ist 2005 erreicht, und dann trägt der Druck keine unbequeme Entscheidung (Schwäche hielt nur drei Jahre an).
  it.fails("2003: Unbequem (Agenda 2010, hohe Arbeitslosigkeit, erstes Jahr nach der Wahl)", () => {
    expect(zeile(2003).falls).toBe("unbequem");
  });
  // Seit der Nachbesserung (Machterhalt trotz greifender Schuldenregel) wählte die Regel 2009 Machterhalt,
  // wenn dort ein Punkt entstünde; es entsteht aber keiner (siehe oben). Der Punkt kommt 2010.
  it("2009: Die Regel sagt Machterhalt (Krise, Wahljahr), falls ein Punkt entstünde", () => {
    expect(zeile(2009).falls).toBe("macht");
  });
});
