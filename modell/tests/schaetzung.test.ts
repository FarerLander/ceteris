import { describe, expect, it } from "vitest";
import DE from "../../daten/laender/DE.json";
import DEhand from "../../daten/laender/DE-hand.json";
import DEsch from "../../daten/laender/DE-schaetzung.json";
import { baueLand } from "../../daten/land";
import type { AutoDatei, HandDatei, SchaetzDatei } from "../../daten/typen";
import { LAENDER, LAENDER_HAND, RUECKBLICK } from "../../app/land";
import { basisSzenario, rechne } from "../rechne";

const a = DE as unknown as AutoDatei,
  h = DEhand as unknown as HandDatei,
  s = DEsch as unknown as SchaetzDatei;
const heute = new Date("2026-09-29");

describe("13.1 Schätzung in den Landesdaten", () => {
  it("gültige Werte ersetzen tfpTrend und NAIRU, arbeit.nairu folgt", () => {
    const tfp = {
      groesse: "tfpTrend" as const,
      wert: 0.61,
      band: 0.1,
      gueltig: true,
    };
    const nairu = {
      groesse: "nairu" as const,
      wert: 3.9,
      band: 0.3,
      gueltig: true,
    };
    const land = baueLand(a, h, heute, undefined, {
      ...s,
      werte: [tfp, nairu],
    });
    expect(land.start.tfpTrend).toBe(0.61);
    expect(land.start.nairu).toBe(3.9);
    expect(land.standards["arbeit.nairu"]).toBe(3.9);
    expect(land.schaetzung!.werte[0]).toMatchObject({
      genutzt: true,
      handwert: h.werte.tfpTrend,
    });
  });
  it("Handwert im Band der Schätzung: bleibt, gilt als bestätigt", () => {
    const land = baueLand(a, h, heute, undefined, { ...s, werte: [{ groesse: "tfpTrend", wert: 0.21, band: 0.25, gueltig: true }] });
    expect(land.start.tfpTrend).toBe(h.werte.tfpTrend);
    expect(land.schaetzung!.werte[0]).toMatchObject({ genutzt: false, gueltig: true, grund: "Handwert liegt im Band, bestätigt", bestaetigt: true });
  });
  it("ungültiger Wert: Handwert bleibt", () => {
    const land = baueLand(a, h, heute, undefined, {
      ...s,
      werte: [
        {
          groesse: "nairu",
          wert: 30,
          band: 9,
          gueltig: false,
          grund: "außerhalb 1 bis 15",
        },
      ],
    });
    expect(land.start.nairu).toBe(h.werte.nairu);
    expect(land.schaetzung!.werte[0].genutzt).toBe(false);
  });
  it("rStern und luecke ersetzen nichts", () => {
    const land = baueLand(a, h, heute, undefined, {
      ...s,
      werte: [{ groesse: "rStern", wert: 3, band: 1, gueltig: true }],
    });
    expect(land.start.leitzins).toBe(h.werte.leitzins);
    expect(land.schaetzung!.werte[0].genutzt).toBe(false);
  });
  it("Urteil in der Handdatei hält den Handwert", () => {
    const hU = { ...h, schaetzungAus: { tfpTrend: "Konsens" } };
    const land = baueLand(a, hU, heute, undefined, {
      ...s,
      werte: [{ groesse: "tfpTrend", wert: 0.9, band: 0.3, gueltig: true }],
    });
    expect(land.start.tfpTrend).toBe(h.werte.tfpTrend);
    expect(land.schaetzung!.werte[0]).toMatchObject({
      genutzt: false,
      grund: "Konsens",
    });
  });
  it("anderes Jahr als der Datenstand: Handwerte mit Hinweis", () => {
    const land = baueLand(a, h, heute, undefined, { ...s, jahr: s.jahr - 1 });
    expect(land.start.tfpTrend).toBe(h.werte.tfpTrend);
    expect(land.schaetzung!.hinweis).toMatch(/Handwerte/);
  });
  it("Schätzung mit Fehler oder fehlend: wie ohne", () => {
    const ohne = baueLand(a, h, heute);
    const mitFehler = baueLand(a, h, heute, undefined, {
      ...s,
      werte: [],
      fehler: "Reales Wachstum fehlt: 2001",
      kredit: undefined, // 13.2: Kreditstart gilt unabhängig vom Kalman-Fehler, hier nicht Gegenstand
      haus: undefined, // 13.6: ebenso der Hauspreis-Trend
    });
    expect(mitFehler.start).toEqual(ohne.start);
    expect(ohne.schaetzung).toBeUndefined();
    expect(mitFehler.schaetzung!.hinweis).toMatch(/nicht möglich/);
  });
  it("Rückblick nutzt keine Schätzung", () =>
    expect(RUECKBLICK.land.schaetzung).toBeUndefined());
  it("alle Länder: Handfassung ohne Schätzung, Schätzfassung rechnet 101 Jahre endlich", () => {
    for (const code of Object.keys(LAENDER)) {
      expect(LAENDER_HAND[code].schaetzung).toBeUndefined();
      const r = rechne(LAENDER[code], basisSzenario(LAENDER[code], 101));
      r.forEach((z) =>
        expect(Number.isFinite(z.Y), `${code} ${z.jahr}`).toBe(true),
      );
    }
  });
  it("13.2: Kredittrend aus der Schätzdatei nur im Datenstand-Jahr", () => {
    const k = { jahr: s.jahr, trend: 100, steigung: 1 };
    const mit = baueLand(a, h, heute, undefined, { ...s, kredit: k });
    expect(mit.start.kreditTrend0).toBe(100);
    expect(mit.start.kreditSteigung0).toBe(1);
    const anders = baueLand(a, h, heute, undefined, { ...s, kredit: { ...k, jahr: s.jahr - 1 } });
    expect(anders.start.kreditTrend0).toBeUndefined();
    const mitFehler = baueLand(a, h, heute, undefined, { ...s, werte: [], fehler: "x", kredit: k });
    expect(mitFehler.start.kreditTrend0).toBe(100);
  });
});
