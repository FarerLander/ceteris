import { basisSzenario, rechne } from "../../modell/rechne";
import autoDE from "../laender/DE.json";
import handDE from "../laender/DE-hand.json";
import { baueLand } from "../land";
import { bankenDaten } from "../../modell/banken-modus";
import schDE from "../laender/DE-schaetzung.json";
import type { SchaetzDatei } from "../typen";
import { GRUPPEN } from "../parser";
import type { AutoDatei, HandDatei, Reihe } from "../typen";
import autoUS from "../laender/US.json";
import handUS from "../laender/US-hand.json";
import autoJP from "../laender/JP.json";
import handJP from "../laender/JP-hand.json";
import autoGB from "../laender/GB.json";
import handGB from "../laender/GB-hand.json";
import autoFR from "../laender/FR.json";
import handFR from "../laender/FR-hand.json";
import autoIT from "../laender/IT.json";
import handIT from "../laender/IT-hand.json";
import autoCA from "../laender/CA.json";
import handCA from "../laender/CA-hand.json";

const hand = handDE as unknown as HandDatei;
const HEUTE = new Date("2026-09-27");

function kuenstlich(
  jahre: number[],
  ausnahmen: Record<string, number[]> = {},
): AutoDatei {
  const reihe = (wert: number, schluessel: string): Reihe =>
    Object.fromEntries((ausnahmen[schluessel] ?? jahre).map((j) => [j, wert]));
  const reihen: Record<string, Reihe> = {
    bev: reihe(83.5, "bev"),
    bevM: reihe(41.2, "bevM"),
    bevF: reihe(42.3, "bevF"),
    tfr: reihe(1.35, "tfr"),
    lebenserwartung: reihe(81, "lebenserwartung"),
    bip: reihe(4300, "bip"),
    alq: reihe(3.5, "alq"),
    investQuote: reihe(21, "investQuote"),
    exporte: reihe(47, "exporte"),
    importe: reihe(42, "importe"),
    schuldQuote: reihe(63, "schuldQuote"),
    inflation: reihe(2.2, "inflation"),
    // Deutschland hat für den Gini keinen Ersatzwert mehr (Spec 13.13): die OECD-Reihe muss da sein.
    giniOecd: reihe(30, "giniOecd"),
  };
  for (const g of GRUPPEN) {
    reihen[`alterM_${g}`] = reihe(100 / 17, `alterM_${g}`);
    reihen[`alterF_${g}`] = reihe(100 / 17, `alterF_${g}`);
  }
  return {
    code: "DE",
    iso3: "DEU",
    abgerufen: "",
    reihen,
    quellen: {},
    fehlend: [],
  };
}

describe("baueLand", () => {
  it("Datenstand ist das letzte Jahr, in dem alle Kernreihen vorliegen, höchstens Vorjahr", () => {
    expect(
      baueLand(kuenstlich([2023, 2024, 2025, 2026]), hand, HEUTE).datenstand,
    ).toBe(2025);
  });
  it("Grenzfall: fehlt einer Kernreihe das neueste Jahr, fällt der Datenstand zurück", () => {
    const auto = kuenstlich([2023, 2024, 2025], { bev: [2023, 2024] });
    expect(baueLand(auto, hand, HEUTE).datenstand).toBe(2024);
  });
  it("Nebenreihe bis 2 Jahre älter wird genutzt und markiert, älter fällt auf Ersatz", () => {
    const auto = kuenstlich([2023, 2024, 2025], {
      exporte: [2023],
      importe: [2020],
    });
    const land = baueLand(auto, hand, HEUTE);
    expect(land.start.exporte).toBe(47);
    expect(land.markiert).toContain("exporte");
    expect(land.markiert).toContain("importe (fehlt)");
  });
  it("Altersanteile summieren sich zu 1", () => {
    const land = baueLand(kuenstlich([2024, 2025]), hand, HEUTE);
    expect(land.start.altersanteile.reduce((a, b) => a + b, 0)).toBeCloseTo(
      1,
      9,
    );
  });
  it("mit echten Daten rechnet Deutschland 51 Jahre ohne kaputte Zahlen", () => {
    const land = baueLand(autoDE as unknown as AutoDatei, hand, HEUTE);
    expect(land.datenstand).toBeGreaterThanOrEqual(2023);
    const v = rechne(land, basisSzenario(land, 51));
    expect(v[0].Y).toBe(land.start.bip);
    for (const z of v) {
      expect(Number.isFinite(z.Y)).toBe(true);
      expect(Number.isFinite(z.schuldQuote)).toBe(true);
    }
  });
});

describe("USA und Japan", () => {
  const us = baueLand(
    autoUS as unknown as AutoDatei,
    handUS as unknown as HandDatei,
    HEUTE,
  );
  const jp = baueLand(
    autoJP as unknown as AutoDatei,
    handJP as unknown as HandDatei,
    HEUTE,
  );
  it("haben ihr Regime, ihre Währung und einen Datenstand", () => {
    expect(us.grund.regime).toBe("welt");
    expect(jp.grund.regime).toBe("eigen");
    expect(us.waehrung).toEqual({ symbol: "$", kurs: 1.08 });
    expect(jp.waehrung.symbol).toBe("¥");
    expect(us.datenstand).toBeGreaterThanOrEqual(2023);
    expect(jp.start.schuldQuote).toBeGreaterThan(200);
  });
  it("Schuldendienst-Schwelle liegt 4 Pp. über dem Startwert", () => {
    const s = us.start;
    expect(s.dsrSchwelle).toBeCloseTo(
      s.privatschuld * ((s.leitzins + 2) / 100 + 0.08) + 4,
      6,
    );
  });
  it("Deutschland rechnet in Euro", () => {
    expect(
      baueLand(autoDE as unknown as AutoDatei, hand, HEUTE).waehrung,
    ).toEqual({ symbol: "€", kurs: 1 });
  });
});

describe("Update 2: UK, Frankreich, Italien, Kanada", () => {
  const bau = (auto: unknown, h: unknown) =>
    baueLand(auto as AutoDatei, h as HandDatei, HEUTE);
  const gb = bau(autoGB, handGB);
  const fr = bau(autoFR, handFR);
  const it_ = bau(autoIT, handIT);
  const ca = bau(autoCA, handCA);

  it("Regime und Währung", () => {
    expect([gb, fr, it_, ca].map((l) => l.grund.regime)).toEqual([
      "eigen",
      "euro",
      "euro",
      "eigen",
    ]);
    expect(gb.waehrung).toEqual({ symbol: "£", kurs: 0.85 });
    expect(ca.waehrung).toEqual({ symbol: "C$", kurs: 1.5 });
    expect(fr.waehrung).toEqual({ symbol: "€", kurs: 1 });
    expect(it_.waehrung).toEqual({ symbol: "€", kurs: 1 });
  });

  it("Datenstand und Größenordnungen", () => {
    for (const l of [gb, fr, it_, ca])
      expect(l.datenstand).toBeGreaterThanOrEqual(2023);
    expect(it_.start.schuldQuote).toBeGreaterThan(120);
    expect(ca.start.importquote).toBeLessThan(0);
    expect(fr.start.mix.atom).toBeGreaterThan(0.5);
  });

  it("Italien und Frankreich tragen den Hinweis zu den Ventilen (M3)", () => {
    expect(it_.qualitaet).toBe("gelb");
    expect(it_.hinweis).toMatch(/M3/);
    expect(fr.hinweis).toMatch(/M3/);
    for (const l of [gb, ca]) expect(l.hinweis).toBeUndefined();
  });

  it("Grenzfall: fehlende Reihe greift auf den Ersatzwert", () => {
    const ohne = {
      ...(autoIT as unknown as AutoDatei),
      reihen: { ...(autoIT as unknown as AutoDatei).reihen },
    };
    delete ohne.reihen.rendite;
    const l = baueLand(ohne, handIT as unknown as HandDatei, HEUTE);
    expect(l.start.rendite).toBe(
      (handIT as unknown as HandDatei).ersatz.rendite,
    );
    expect(l.markiert).toContain("rendite (Ersatz)");
  });
});

import autoCN from "../laender/CN.json";
import handCN from "../laender/CN-hand.json";
import autoRU from "../laender/RU.json";
import handRU from "../laender/RU-hand.json";

describe("Update 4b: China und Russland", () => {
  const cn = baueLand(autoCN as unknown as AutoDatei, handCN as unknown as HandDatei, HEUTE);
  const ru = baueLand(autoRU as unknown as AutoDatei, handRU as unknown as HandDatei, HEUTE);
  it("gelenkte Währung, Landeswährung, Hinweis", () => {
    expect([cn.grund.regime, ru.grund.regime]).toEqual(["gelenkt", "gelenkt"]);
    expect(cn.waehrung).toEqual({ symbol: "¥", kurs: 8.1 });
    expect(ru.waehrung).toEqual({ symbol: "₽", kurs: 95 });
    for (const l of [cn, ru]) {
      expect(l.qualitaet).toBe("gelb");
      expect(l.hinweis).toMatch(/Vorbehalt/);
      expect(l.datenstand).toBeGreaterThanOrEqual(2023);
    }
  });
  it("Ordnung als Landesstandard, verdeckte Schuld China, Rohstoffe Russland", () => {
    expect(cn.standards["ordnung.rechtsstaat"]).toBe(52);
    expect(ru.standards["ordnung.rechtsstaat"]).toBe(38);
    expect(cn.start.verdeckteSchuld0).toBe(35);
    expect(cn.standards["schwelle.verdeckteUebernahme"]).toBeGreaterThan(35);
    expect(ru.start.rohstoffExporte).toBe(11);
    expect(cn.start.rohstoffExporte ?? 0).toBe(0);
  });
});

describe("Spec 13.6: Bank- und Hauspreisdaten", () => {
  const sch = schDE as unknown as SchaetzDatei;
  const de = baueLand(autoDE as unknown as AutoDatei, hand, HEUTE, undefined, sch);
  it("Deutschland, USA, Japan haben alle sieben Bankwerte", () => {
    expect(bankenDaten(de.start)).toBe(true);
    expect(bankenDaten(baueLand(autoUS as unknown as AutoDatei, handUS as unknown as HandDatei, HEUTE).start)).toBe(true);
    expect(bankenDaten(baueLand(autoJP as unknown as AutoDatei, handJP as unknown as HandDatei, HEUTE).start)).toBe(true);
  });
  it("Werte aus den Reihen: Eigenkapital, faule Kredite, Bankanteil am Kredit, Bewertung gegen das langjährige Mittel", () => {
    const r = (autoDE as unknown as AutoDatei).reihen;
    const j = de.datenstand;
    expect(de.start.bankKapital0).toBe(r.bankKapital[j]);
    expect(de.start.npl0).toBe(r.npl[j]);
    expect(de.start.bankKreditAnteil).toBeCloseTo(r.bankKredit[j] / r.kreditGesamt[j], 12);
    expect(de.start.bankKreditAnteil!).toBeGreaterThan(0.3);
    expect(de.start.bankKreditAnteil!).toBeLessThanOrEqual(1);
    // Preis-Einkommen-Verhältnis gegen sein Mittel bis zum Startjahr; heute nahe am OECD-Wert (Mittel = 100).
    const pe = Object.entries(r.hausEinkommen).filter(([jahr]) => Number(jahr) <= j).map(([, w]) => w);
    expect(de.start.hausBewertung0).toBeCloseTo(100 * (r.hausEinkommen[j] / (pe.reduce((a, b) => a + b, 0) / pe.length) - 1), 9);
    expect(Math.abs(de.start.hausBewertung0! - (r.hausEinkommen[j] - 100))).toBeLessThan(3);
    // Ein früheres Startjahr kennt die Zukunft nicht: 2000 lag Deutschland unter dem Mittel 1980–2000.
    expect(baueLand(autoDE as unknown as AutoDatei, hand, HEUTE, 2000).start.hausBewertung0!).toBeLessThan(-10);
    // Die Bilanzreihe (GFDD) endet früher; es gilt ihr letzter Wert.
    const letztes = Math.max(...Object.keys(r.bankBilanz).map(Number));
    expect(de.start.bankBilanz0).toBe(r.bankBilanz[letztes]);
    expect(de.start.bankStaatsAnteil).toBe(hand.werte.bankStaatsAnteil);
    expect(de.start.hausVermoegen0).toBe(hand.werte.hausVermoegen0);
  });
  it("fehlen die Reihen, gelten die Ersatzwerte; fehlt auch der Ersatz, hat das Land keine Bankdaten", () => {
    const { npl: _a, bankKapital: _b, bankBilanz: _c, bankKredit: _d, hausEinkommen: _e, ...rest } = (autoDE as unknown as AutoDatei).reihen;
    const ohne = { ...(autoDE as unknown as AutoDatei), reihen: rest };
    const l = baueLand(ohne, hand, HEUTE);
    expect(bankenDaten(l.start)).toBe(true);
    expect(l.start.npl0).toBe(hand.ersatz.npl0);
    expect(l.start.bankKreditAnteil).toBe(hand.ersatz.bankKreditAnteil);
    const { npl0: _f, ...ersatz } = hand.ersatz;
    expect(bankenDaten(baueLand(ohne, { ...hand, ersatz }, HEUTE).start)).toBe(false);
  });
  it("Hauspreis-Trend nur, wenn die Schätzung für das Startjahr gilt", () => {
    expect(sch.haus?.jahr).toBe(de.datenstand);
    expect(de.start.hausTrend0).toBe(sch.haus!.trend);
    expect(de.start.hausSteigung0).toBe(sch.haus!.steigung);
    expect(de.start.hausWachstum0).toBe(sch.haus!.wachstum);
    const frueher = baueLand(autoDE as unknown as AutoDatei, hand, HEUTE, 2019, sch);
    expect(frueher.start.hausTrend0).toBeUndefined();
    expect(frueher.start.hausWachstum0).toBeUndefined();
  });
  it("Standard „aus“: Bankdaten ändern den Basislauf nicht", () => {
    const { bankStaatsAnteil: _a, hausVermoegen0: _b, ...werte } = hand.werte;
    const ohne = baueLand(autoDE as unknown as AutoDatei, { ...hand, werte }, HEUTE, undefined, sch);
    expect(bankenDaten(ohne.start)).toBe(false);
    const a = rechne(de, basisSzenario(de, 31));
    const b = rechne(ohne, basisSzenario(ohne, 31));
    for (const f of ["Y", "schuldQuote", "privatschuld", "alq", "inflation", "rendite"] as const)
      a.forEach((z, i) => expect(z[f], `${z.jahr} ${f}`).toBe(b[i][f]));
  });
});
