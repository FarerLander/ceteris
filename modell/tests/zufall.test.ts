import { describe, expect, it } from "vitest";
import { anhaltend, NACHSICHT, neuerStand } from "../politik";
import { basisSzenario, rechne, rechneZufall } from "../rechne";
import type { Schock, Szenario } from "../typen";
import { LAENDER } from "../../app/land";
import { VERZEICHNIS, eintrag } from "../verzeichnis";
import { faecher, krisenRisiko, LAEUFE, naechsterLauf, neueSammlung, zieher, ziehungen, zufallsLauf } from "../zufall";
import { BANKWERTE, testland } from "./testland";

// Spec 13.4: Zufallsschocks und Unsicherheitsbänder. Die Hauptlinie bleibt ohne Zufall.
const land = testland();
const sz = (extra: Partial<Szenario> = {}, jahre = 51): Szenario => ({ ...basisSzenario(land, jahre), ...extra });
const zufaellig = (s: Schock[]) => s.filter((x) => x.id < 0);
// Alle Schocks, die in einem Zufallslauf begonnen haben (über einen mitschreibenden Zieher).
function schocksIm(s: Szenario, nr: number, saat = 1): Schock[] {
  const z = zieher(land, s, saat, nr);
  const alle: Schock[] = [];
  rechneZufall(land, s, (alt, jahr, schocks) => {
    const zug = z(alt, jahr, schocks);
    alle.push(...zug.schocks);
    return zug;
  });
  return alle;
}

describe("Zieher im Rechenkern", () => {
  it("ohne Zug rechnet rechneZufall bitgenau wie rechne", () => {
    const a = rechne(land, sz());
    const b = rechneZufall(land, sz(), () => ({ schocks: [], luecke: 0 }));
    expect(b).toEqual(a);
  });

  it("ein gezogener Schock wirkt wie ein gesetzter", () => {
    const gesetzt = rechne(land, sz({ schocks: [{ id: 1, art: "krise", jahr: 2030, staerke: 1, dauer: 1 }] }));
    const gezogen = rechneZufall(land, sz(), (_alt, jahr) => ({
      schocks: jahr === 2030 ? [{ id: -1, art: "krise", jahr, staerke: 1, dauer: 1 }] : [],
      luecke: 0,
    }));
    expect(gezogen.map((z) => z.Y)).toEqual(gesetzt.map((z) => z.Y));
    expect(gezogen[5].lage).toBe("krise");
  });

  it("der Nachfrage-Zufall verschiebt die Lücke im selben Jahr um seinen Wert", () => {
    const a = rechne(land, sz());
    const b = rechneZufall(land, sz(), (_alt, jahr) => ({ schocks: [], luecke: jahr === 2030 ? -2 : 0 }));
    expect((b[5].luecke - a[5].luecke) * 100).toBeCloseTo(-2, 6);
    expect(b[4].luecke).toBe(a[4].luecke);
  });
});

describe("Verzeichnis", () => {
  it("Häufigkeiten stehen im Verzeichnis, jede Art ist abschaltbar", () => {
    expect(eintrag("zufall.kriseBasis").standard).toBe(2);
    expect(eintrag("zufall.oel").standard).toBe(5);
    expect(eintrag("zufall.pandemie").standard).toBe(2);
    expect(eintrag("zufall.proxy").standard).toBe(1.5);
    const abschaltbar = VERZEICHNIS.filter((e) => e.baustein === "zufall" && e.umstritten).map((e) => e.id);
    expect(abschaltbar).toEqual(["zufall.kriseBasis", "zufall.kriseKredit", "zufall.kriseHaus", "zufall.oel", "zufall.pandemie", "zufall.proxy", "zufall.energieImport", "zufall.spannen", "zufall.konjunktur"]);
    expect(VERZEICHNIS.filter((e) => e.baustein === "zufall")).toHaveLength(12);
  });
});

describe("Wahrscheinlichkeit einer Finanzkrise", () => {
  it("2 % bei Kreditlücke null, rund 5 % bei +10 Punkten, gedeckelt bei 15 %", () => {
    expect(krisenRisiko(land, sz(), 0, 0)).toBeCloseTo(2, 6);
    expect(krisenRisiko(land, sz(), 10, 0)).toBeGreaterThan(4.5);
    expect(krisenRisiko(land, sz(), 10, 0)).toBeLessThan(5.2);
    expect(krisenRisiko(land, sz(), -10, 0)).toBeLessThan(1);
    expect(krisenRisiko(land, sz(), 60, 0)).toBe(15);
  });

  it("die Hauspreislücke zählt nur mit Banken „an“", () => {
    const mitBanken = { ...land, start: { ...land.start, ...BANKWERTE } };
    const an = sz({ grund: { ...land.grund, banken: "an" } });
    expect(krisenRisiko(mitBanken, sz(), 0, 20)).toBeCloseTo(2, 6);
    expect(krisenRisiko(mitBanken, an, 0, 20)).toBeGreaterThan(4.5);
    expect(krisenRisiko(mitBanken, an, 0, 20)).toBeLessThan(6);
  });

  it("abgeschaltet: keine Zufallskrise", () => {
    expect(krisenRisiko(land, sz({ aus: ["zufall.kriseBasis"] }), 30, 0)).toBe(0);
  });
});

describe("Zufallsläufe", () => {
  it("gleiche Saat und Nummer: gleicher Lauf; andere Nummer: anderer Lauf", () => {
    const a = zufallsLauf(land, sz(), 1, 7);
    expect(zufallsLauf(land, sz(), 1, 7)).toEqual(a);
    expect(zufallsLauf(land, sz(), 1, 8).map((z) => z.Y)).not.toEqual(a.map((z) => z.Y));
    expect(zufallsLauf(land, sz(), 2, 7).map((z) => z.Y)).not.toEqual(a.map((z) => z.Y));
  });

  it("Häufigkeiten: Pandemie rund 2 %, Ölpreisschock rund 5 %, Krieg in der Nachbarschaft rund 1,5 % der Jahre", () => {
    const zahl: Record<string, number> = {};
    const laeufe = 300;
    for (let nr = 0; nr < laeufe; nr++)
      for (const s of schocksIm(sz(), nr)) zahl[s.art] = (zahl[s.art] ?? 0) + 1;
    const jahre = laeufe * 50;
    // Die Sperre nach einem Schock derselben Art (3 Jahre) drückt die Rate leicht unter den Nennwert.
    expect((zahl.pandemie / jahre) * 100).toBeGreaterThan(1.5);
    expect((zahl.pandemie / jahre) * 100).toBeLessThan(2.4);
    expect((zahl.oel / jahre) * 100).toBeGreaterThan(3.8);
    expect((zahl.oel / jahre) * 100).toBeLessThan(5.6);
    expect((zahl.proxy / jahre) * 100).toBeGreaterThan(1.0);
    expect((zahl.proxy / jahre) * 100).toBeLessThan(1.9);
    expect((zahl.krise / jahre) * 100).toBeGreaterThan(0.5);
    expect((zahl.krise / jahre) * 100).toBeLessThan(3);
    expect(Object.keys(zahl).sort()).toEqual(["krise", "oel", "pandemie", "proxy"]);
  });

  it("Stärke streut um 1 und bleibt zwischen 0,4 und 2,5", () => {
    const st: number[] = [];
    for (let nr = 0; nr < 200; nr++) st.push(...schocksIm(sz(), nr).map((s) => s.staerke));
    st.sort((a, b) => a - b);
    expect(st[0]).toBeGreaterThanOrEqual(0.4);
    expect(st[st.length - 1]).toBeLessThanOrEqual(2.5);
    expect(st[Math.floor(st.length / 2)]).toBeGreaterThan(0.9);
    expect(st[Math.floor(st.length / 2)]).toBeLessThan(1.1);
    expect(st[Math.floor(st.length * 0.9)]).toBeGreaterThan(1.4);
  });

  it("nach einer Finanzkrise zehn Jahre Ruhe", () => {
    for (let nr = 0; nr < 300; nr++) {
      const j = schocksIm(sz(), nr).filter((s) => s.art === "krise").map((s) => s.jahr);
      for (let i = 1; i < j.length; i++) expect(j[i] - j[i - 1]).toBeGreaterThanOrEqual(10);
    }
  });

  it("keine Zufallskrise im Fenster einer gesetzten Krise (2 Jahre davor bis 10 danach)", () => {
    const mit = sz({ schocks: [{ id: 1, art: "krise", jahr: 2040, staerke: 1, dauer: 1 }] });
    let davor = 0;
    for (let nr = 0; nr < 300; nr++)
      for (const s of schocksIm(mit, nr).filter((x) => x.art === "krise")) {
        expect(s.jahr < 2038 || s.jahr >= 2050, `Lauf ${nr}: ${s.jahr}`).toBe(true);
        if (s.jahr < 2038) davor++;
      }
    expect(davor).toBeGreaterThan(0);
  });

  it("ein gesetzter Schock mit doppelter Dauer sperrt, solange er wirkt", () => {
    // Ölpreisschock wirkt 2 Jahre, mit Dauer 3 also 6 Jahre: 2035 bis 2040.
    const mit = sz({ schocks: [{ id: 1, art: "oel", jahr: 2035, staerke: 1, dauer: 3 }] });
    for (let nr = 0; nr < 300; nr++)
      for (const s of schocksIm(mit, nr).filter((x) => x.art === "oel")) expect(s.jahr < 2033 || s.jahr > 2040, `Lauf ${nr}: ${s.jahr}`).toBe(true);
  });

  it("ein gesetzter Schock vor dem Startjahr zählt nicht (das Modell ignoriert ihn auch)", () => {
    const start = land.datenstand;
    const mit = sz({ schocks: [{ id: 1, art: "krise", jahr: start - 1, staerke: 1, dauer: 1 }] });
    for (let nr = 0; nr < 60; nr++)
      expect(schocksIm(mit, nr).map((x) => `${x.art}${x.jahr}`)).toEqual(schocksIm(sz(), nr).map((x) => `${x.art}${x.jahr}`));
  });

  it("abgeschaltete Art kommt nicht vor; alles aus: der Lauf ist die Hauptlinie", () => {
    const ohne = sz({ aus: ["zufall.pandemie"] });
    for (let nr = 0; nr < 100; nr++) expect(schocksIm(ohne, nr).some((s) => s.art === "pandemie")).toBe(false);
    const aus = ["zufall.kriseBasis", "zufall.oel", "zufall.pandemie", "zufall.proxy", "zufall.konjunktur", "zufall.spannen"];
    expect(zufallsLauf(land, sz({ aus }), 1, 3)).toEqual(rechne(land, sz({ aus })));
  });

  it("gleiche Zufallsfolge für zwei Szenarien: Pandemien und Ölschocks fallen in dieselben Jahre", () => {
    const anders = sz({ stell: { "staat.investitionen": 5 } });
    for (let nr = 0; nr < 40; nr++) {
      const f = (s: Szenario) => schocksIm(s, nr).filter((x) => x.art !== "krise").map((x) => `${x.art}${x.jahr}:${x.staerke}`);
      expect(f(anders)).toEqual(f(sz()));
    }
  });

  it("kürzerer Zeitraum: derselbe Lauf, nur früher zu Ende", () => {
    const lang = zufallsLauf(land, sz({}, 51), 1, 5);
    const kurz = zufallsLauf(land, sz({}, 26), 1, 5);
    expect(kurz.map((z) => z.Y)).toEqual(lang.slice(0, 26).map((z) => z.Y));
  });

  it("die gewöhnliche Konjunktur macht die Linie wellig: Wachstum streut um gut 1 Punkt", () => {
    const nur = sz({ aus: ["zufall.kriseBasis", "zufall.oel", "zufall.pandemie", "zufall.proxy"] });
    const glatt = rechne(land, nur);
    const abw: number[] = [];
    for (let nr = 0; nr < 60; nr++)
      zufallsLauf(land, nur, 1, nr).forEach((z, t) => t > 0 && abw.push((z.wachstum - glatt[t].wachstum) * 100));
    const sd = Math.sqrt(abw.reduce((a, b) => a + b * b, 0) / abw.length);
    expect(sd).toBeGreaterThan(0.9);
    expect(sd).toBeLessThan(1.7);
  });
});

describe("Politik reagiert in Zufallsläufen", () => {
  const w = true, g = false;

  it("eine Regel für Hauptlinie und Zufallsläufe: n der letzten n + 2 Jahre (13.13, behebt M37)", () => {
    expect(NACHSICHT).toBe(2);
    expect(anhaltend([w, w, g, w, w, w, w], 5, NACHSICHT)).toBe(true);
    expect(anhaltend([w, g, g, w, w, w, w], 5, NACHSICHT)).toBe(true);
    expect(anhaltend([g, g, g, w, w, w, w], 5, NACHSICHT)).toBe(false);
    expect(anhaltend([w, w, w, w, w, g, g, g], 5, NACHSICHT)).toBe(false);
    // Nicht ganzzahlige Schwelle: aufrunden.
    expect(anhaltend([w, w], 2.5, 0)).toBe(false);
    expect(anhaltend([w, w, w], 2.5, 0)).toBe(true);
    expect(Object.keys(neuerStand())).not.toContain("nachsicht");
  });

  it("enger Haushalt auch im Zufallslauf: ein Punkt je Legislatur, kein sofortiger Neustart", () => {
    const us = LAENDER.US;
    const s0 = basisSzenario(us);
    let laeufeMitPunkt = 0;
    for (let nr = 0; nr < 25; nr++) {
      const j = zufallsLauf(us, s0, 1, nr).flatMap((z) => z.politik.filter((e) => e.art === "entscheidung" && e.ausloeser === "eng").map((e) => e.jahr));
      if (j.length) laeufeMitPunkt++;
      for (let i = 1; i < j.length; i++) expect(j[i] - j[i - 1], `Lauf ${nr}: ${j.join(", ")}`).toBeGreaterThanOrEqual(2);
    }
    expect(laeufeMitPunkt).toBeGreaterThan(20);
  });

  it("in Zufallsläufen entstehen Entscheidungspunkte: im Testland in den meisten Läufen", () => {
    const reagiert = sz({ grund: { ...land.grund, politik: "reagiert" } });
    let mit = 0;
    for (let nr = 0; nr < 40; nr++) if (zufallsLauf(land, reagiert, 1, nr).some((z) => z.politik.some((e) => e.art === "entscheidung"))) mit++;
    expect(mit).toBeGreaterThan(20);
  });
});

describe("Politik reagiert in Zufallsläufen: Entscheidungspunkte (Spec 13.13)", () => {
  const lahm = testland({ tfpTrend: 0 });
  const basis: Szenario = { ...basisSzenario(lahm, 41), stell: { "staat.schuldenreaktion": 0 }, grund: { ...lahm.grund, politik: "reagiert" } };
  const erster = (v: { politik: { art: string; ausloeser?: string; jahr: number; motiv?: string; vorwahl?: string }[] }[]) =>
    v.flatMap((z) => z.politik).find((e) => e.art === "entscheidung" && e.ausloeser === "schwaeche");
  it("ohne Wahl der Nutzerin gilt in jedem Lauf die Vorwahl", () => {
    let n = 0;
    for (let nr = 0; nr < 12; nr++)
      for (const e of zufallsLauf(lahm, basis, 1, nr).flatMap((z) => z.politik).filter((x) => x.art === "entscheidung")) {
        expect(e.motiv, `Lauf ${nr} ${e.jahr}`).toBe(e.vorwahl);
        n++;
      }
    expect(n).toBeGreaterThan(12);
  });
  it("eine Wahl wirkt nur, wenn der Lauf im selben Jahr denselben Auslöser hat", () => {
    let mit = 0, ohne = 0;
    for (let nr = 0; nr < 12; nr++) {
      const lauf = zufallsLauf(lahm, basis, 1, nr);
      const e = erster(lauf);
      if (e) {
        // Der Lauf hat im Jahr e.jahr einen Punkt: Die Wahl gilt dort.
        const anders = e.vorwahl === "unbequem" ? "richtung" : "unbequem";
        const v = zufallsLauf(lahm, { ...basis, wahl: { [`${e.jahr}-schwaeche`]: anders as "unbequem" } }, 1, nr);
        expect(erster(v), `Lauf ${nr}`).toMatchObject({ jahr: e.jahr, vorwahl: e.vorwahl });
        if (erster(v)!.motiv === anders) mit++;
      }
      // Ein Jahr, in dem dieser Lauf keinen Punkt hat: Die Wahl verfällt, der Lauf bleibt gleich.
      const frei = 2050;
      if (!lauf.some((z) => z.politik.some((x) => x.art === "entscheidung" && x.ausloeser === "schwaeche" && x.jahr === frei))) {
        expect(zufallsLauf(lahm, { ...basis, wahl: { [`${frei}-schwaeche`]: "macht" } }, 1, nr)).toEqual(lauf);
        ohne++;
      }
    }
    expect(mit).toBeGreaterThan(3);
    expect(ohne).toBeGreaterThan(3);
  });
  it("Laufzeit: 50 Zufallsläufe Deutschland in unter einer Sekunde (keine verschachtelten Läufe mehr)", () => {
    const de = LAENDER.DE;
    const t0 = performance.now();
    for (let nr = 0; nr < 50; nr++) zufallsLauf(de, basisSzenario(de), 1, nr);
    expect(performance.now() - t0).toBeLessThan(1000);
  });
});

// Die Hauptlinie (ohne Zufall) soll 2050 im Band (10–90) der Zufallsläufe liegen, sonst ist sie keine
// typische Zukunft. Seit 13.13 tragen die Zufallsläufe in DE und US mehr Schuld als die Linie: Schocks lösen
// in den Läufen mehr Entscheidungen der Regierung aus als auf der glatten Linie (DE bis 2050 im Mittel 4,4
// statt 1), und jede kostet. Mit Politik fest liegen Läufe und Linie beieinander. Bekannte Lücke (M29).
// Seit dem Haushaltsplan (M29) liegen die USA im Band (Linie 185, Band 157–208) und Frankreich darunter
// (Linie 149, Band 156–204): Auf Frankreichs Linie entsteht bis 2050 kein Entscheidungspunkt mehr.
describe("Hauptlinie im Band der Zufallsläufe (Staatsschuld 2050)", () => {
  const lage = (code: string) => {
    const l = LAENDER[code];
    const sz0 = basisSzenario(l);
    const sm = neueSammlung(l, sz0, LAEUFE);
    while (naechsterLauf(sm));
    const t = rechne(l, sz0).findIndex((z) => z.jahr === 2050);
    const fa = faecher(sm);
    return { linie: rechne(l, sz0)[t].schuldQuote, p10: fa.band.schuldQuote.p10[t], p90: fa.band.schuldQuote.p90[t] };
  };
  for (const code of ["DE", "US", "JP", "FR", "IT", "CA", "CN", "RU"])
    it(`${code}: im Band`, () => {
      const x = lage(code);
      expect(x.linie).toBeGreaterThanOrEqual(x.p10);
      expect(x.linie).toBeLessThanOrEqual(x.p90);
    });
  // Großbritannien: Die Linie liegt am unteren Rand des Bandes (M29, Punkt 7). Grenzfall: höchstens 3 Pp. unter
  // dem Band, aber nicht in seiner Mitte. Frankreich liegt seit der Rentenanpassung (M1) im Band.
  for (const code of ["GB"])
    it(`${code}: Linie am unteren Rand des Bandes (Grenzfall, M29)`, () => {
      const x = lage(code);
      expect(x.linie).toBeGreaterThanOrEqual(x.p10 - 3);
      expect(x.linie).toBeLessThan(x.p10 + 8);
    });
});

describe("Fächer", () => {
  const s = neueSammlung(land, sz(), 60);
  while (naechsterLauf(s));
  const f = faecher(s);

  it("zählt die Läufe; der Standard sind 200", () => {
    expect(LAEUFE).toBe(200);
    expect(f.laeufe).toBe(60);
    expect(s.fertig).toBe(60);
  });

  it("Quantile sind geordnet, im Startjahr fällt das Band auf den Startwert", () => {
    for (const id of ["schuldQuote", "bipProKopf", "alq"] as const) {
      const b = f.band[id];
      expect(b.p10).toHaveLength(51);
      for (let t = 0; t < 51; t++) {
        expect(b.p10[t]).toBeLessThanOrEqual(b.p25[t]);
        expect(b.p25[t]).toBeLessThanOrEqual(b.p50[t]);
        expect(b.p50[t]).toBeLessThanOrEqual(b.p75[t]);
        expect(b.p75[t]).toBeLessThanOrEqual(b.p90[t]);
      }
      expect(b.p90[0]).toBe(b.p10[0]);
      expect(b.p90[30] - b.p10[30]).toBeGreaterThan(0);
    }
  });

  it("das Band der Schuld wird mit den Jahren breiter", () => {
    const b = f.band.schuldQuote;
    expect(b.p90[40] - b.p10[40]).toBeGreaterThan(b.p90[10] - b.p10[10]);
  });

  it("ein Beispiel-Lauf liegt bei, so lang wie der Zeitraum", () => {
    expect(f.beispiel.schuldQuote).toHaveLength(51);
    expect(f.beispiel.schuldQuote).toEqual(zufallsLauf(land, sz(), 1, 0).map((z) => z.schuldQuote));
  });

  it("Anteil der Läufe mit Schuldenkrise bis zum Jahr: zwischen 0 und 1, fällt nie", () => {
    expect(f.schuldenkrise).toHaveLength(51);
    expect(f.schuldenkrise[0]).toBe(0);
    for (let t = 1; t < 51; t++) {
      expect(f.schuldenkrise[t]).toBeGreaterThanOrEqual(f.schuldenkrise[t - 1]);
      expect(f.schuldenkrise[t]).toBeLessThanOrEqual(1);
    }
  });

  it("mittlere Zahl großer Zufallsschocks: rund einer je zehn Jahre", () => {
    expect(f.schocksJeLauf).toBeGreaterThan(3);
    expect(f.schocksJeLauf).toBeLessThan(7);
  });
});

describe("Wirkstärken streuen in den Zufallsläufen (U2)", () => {
  const mitSpanne = VERZEICHNIS.filter((e) => e.spanne);
  it("Spannen stehen im Verzeichnis und enthalten den Standard", () => {
    expect(mitSpanne.length).toBeGreaterThanOrEqual(10);
    expect(eintrag("wachstum.multiplikator").spanne).toEqual([0.6, 1]);
    for (const e of mitSpanne) {
      expect(e.spanne![0], e.id).toBeLessThanOrEqual(e.standard);
      expect(e.spanne![1], e.id).toBeGreaterThanOrEqual(e.standard);
    }
  });
  it("gezogene Werte liegen in der Spanne, gleiche Saat und Nummer ziehen gleich, auch in einem anderen Szenario", () => {
    const a = ziehungen(land, sz(), 1, 7);
    const b = ziehungen(land, sz({ stell: { "steuer.mwst": 0.25 } }), 1, 7);
    expect(a).toEqual(b);
    expect(ziehungen(land, sz(), 1, 8)).not.toEqual(a);
    for (const e of mitSpanne) {
      expect(a[e.id], e.id).toBeGreaterThanOrEqual(e.spanne![0]);
      expect(a[e.id], e.id).toBeLessThanOrEqual(e.spanne![1]);
    }
  });
  it("vom Nutzer abgeschaltete Wirkstärke wird nicht gezogen, die übrigen ziehen dasselbe", () => {
    const a = ziehungen(land, sz(), 1, 3);
    const b = ziehungen(land, sz({ aus: ["wachstum.multiplikator"] }), 1, 3);
    expect(b["wachstum.multiplikator"]).toBeUndefined();
    expect({ ...b, "wachstum.multiplikator": a["wachstum.multiplikator"] }).toEqual(a);
  });
  it("Spannen aus: keine Ziehung, der Lauf rechnet wie ohne Streuung", () => {
    expect(ziehungen(land, sz({ aus: ["zufall.spannen"] }), 1, 3)).toEqual({});
    const ohne = zufallsLauf(land, sz({ aus: ["zufall.spannen"] }), 1, 3);
    expect(rechneZufall(land, sz({ aus: ["zufall.spannen"] }), zieher(land, sz({ aus: ["zufall.spannen"] }), 1, 3))).toEqual(ohne);
    expect(zufallsLauf(land, sz(), 1, 3)).not.toEqual(ohne);
  });
  it("die Hauptlinie zieht nichts", () => {
    expect(rechne(land, sz())).toEqual(rechne(land, sz({ aus: ["zufall.spannen"] })));
  });
});
