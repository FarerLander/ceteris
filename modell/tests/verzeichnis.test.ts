import { VERZEICHNIS, eintrag, stellschrauben } from "../verzeichnis";
import { WELT_STANDARD } from "../welt";

describe("Verzeichnis", () => {
  it("hat eindeutige ids", () => {
    const ids = VERZEICHNIS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it("jede Wirkstärke hat Quelle und Belegstärke", () => {
    for (const e of VERZEICHNIS.filter((e) => e.art === "wirkstaerke")) {
      expect(e.quelle.length, e.id).toBeGreaterThan(3);
      expect(["lehrbuch", "studie", "kalibriert"], e.id).toContain(e.beleg);
    }
  });
  it("umstrittene Wirkstärken haben einen neutralen Wert", () => {
    for (const e of VERZEICHNIS.filter((e) => e.umstritten))
      expect(e.neutral, e.id).toBeDefined();
  });
  it("jede Stellschraube hat Bereich, Schritt, Kanal und liegt im Bereich", () => {
    for (const e of stellschrauben()) {
      expect(e.bereich, e.id).toBeDefined();
      expect(e.schritt, e.id).toBeGreaterThan(0);
      expect(e.kanal, e.id).toBeTruthy();
      expect(e.standard).toBeGreaterThanOrEqual(e.bereich![0]);
      expect(e.standard).toBeLessThanOrEqual(e.bereich![1]);
    }
  });
  it("hat genau sechs Hauptregler", () => {
    expect(
      stellschrauben()
        .filter((e) => e.haupt)
        .map((e) => e.id),
    ).toEqual([
      "mig.netto",
      "energie.co2Preis",
      "innov.fue",
      "steuer.kapitalertrag",
      "rente.alter",
      "staat.uebrige",
    ]);
  });
  it("wirft bei unbekannter id", () => {
    expect(() => eintrag("gibt.esNicht")).toThrow(
      "Unbekannter Eintrag: gibt.esNicht",
    );
  });
  it("Weltpfade haben Standardwerte", () => {
    expect(WELT_STANDARD.realzins).toBe(0.8);
    expect(Object.keys(WELT_STANDARD)).toHaveLength(13);
  });
  it("Update 4a: Ordnung, Rohstoffe und Kursnachführung stehen im Verzeichnis", () => {
    for (const id of [
      "ordnung.rechtsstaat",
      "ordnung.staatsanteil",
      "ordnung.preiskontrollen",
      "ordnung.notenbankfinanzierung",
      "ordnung.kreditlenkung",
      "rohstoff.foerderung",
      "rohstoff.fondsAnteil",
      "rohstoff.diversifizierung",
      "handel.kursNachfuehrung",
    ])
      expect(eintrag(id).art).toBe("stellschraube");
    expect(stellschrauben().filter((e) => e.baustein === "ordnung")).toHaveLength(5);
    for (const e of VERZEICHNIS.filter((x) => x.id.startsWith("ordnung.") && x.umstritten))
      expect(e.neutral, e.id).toBeDefined();
  });
});
