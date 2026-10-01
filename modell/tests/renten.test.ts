import { describe, expect, it } from "vitest";
import { LAENDER, RUECKBLICK } from "../../app/land";
import { readdirSync, readFileSync } from "node:fs";
import { baueFall, type Fall } from "../../daten/kalibrierung/lade";
import { standardWert } from "../kontext";
import { basisSzenario, rechne } from "../rechne";
import type { Szenario } from "../typen";
import { eintrag } from "../verzeichnis";

// M1, M18: Rentenanpassung nach heutigem Recht, zwei Kanäle: Das Niveau folgt dem Altenquotienten (gesetzliches
// Rentenalter, ohne Konjunktur) und bleibt um einen Teil des Lohntrends zurück. Je Land geeicht an den amtlichen
// Projektionen der Rentenausgaben.
const AUS = ["rente.anpassung", "rente.indexierung"];
const fest = (code: string, extra: Partial<Szenario> = {}) => {
  const l = LAENDER[code];
  return rechne(l, { ...basisSzenario(l), grund: { ...l.grund, politik: "fest" }, ...extra });
};
const am = (r: ReturnType<typeof fest>, j: number) => r.find((z) => z.jahr === j)!.rentenausgaben;
const MIT = ["DE", "US", "JP", "GB", "FR", "IT", "CA"];

describe("Rentenanpassung nach Landesrecht (M1)", () => {
  it("Verzeichnis: beide Kanäle abschaltbar, neutral 0", () => {
    for (const id of AUS) {
      expect(eintrag(id).art).toBe("wirkstaerke");
      expect(eintrag(id).umstritten).toBe(true);
      expect(eintrag(id).neutral).toBe(0);
    }
  });

  it.each(Object.keys(LAENDER))("%s: Werte im erlaubten Bereich (Anpassung 0 bis 0,9, Indexierung −1 bis 1)", (code) => {
    const l = LAENDER[code];
    expect(standardWert("rente.anpassung", l)).toBeGreaterThanOrEqual(0);
    expect(standardWert("rente.anpassung", l)).toBeLessThanOrEqual(0.9);
    expect(Math.abs(standardWert("rente.indexierung", l))).toBeLessThanOrEqual(1);
  });

  // Ziele: Rentenausgaben 2050 relativ zu 2025 (EU Ageing Report 2024; OECD Pensions at a Glance 2023, Tabelle 8.4).
  it.each([
    ["DE", 11.0 / 10.5, 0.03],
    ["FR", 13.7 / 14.2, 0.03],
    ["US", 6.1 / 5.5, 0.03],
    ["JP", 9.1 / 8.7, 0.03],
    ["CA", 8.1 / 7.2, 0.03],
    ["GB", 8.1 / 7.3, 0.05],
    ["IT", 15.5 / 16.1, 0.04],
  ] as const)("%s: Anstieg bis 2050 wie die amtliche Projektion", (code, ziel, tol) => {
    const r = fest(code);
    expect(am(r, 2050) / am(r, 2025)).toBeGreaterThan(ziel - tol);
    expect(am(r, 2050) / am(r, 2025)).toBeLessThan(ziel + tol);
  });

  it.each(MIT)("%s: Rentenalter +2 senkt die Rentenausgaben 2050", (code) => {
    const l = LAENDER[code];
    const plus = fest(code, { stell: { "rente.alter": standardWert("rente.alter", l) + 2 } });
    expect(am(plus, 2050)).toBeLessThan(am(fest(code), 2050) - 0.3);
  });

  it.each(MIT)("%s: mehr Zuwanderung erhöht die Rentenausgaben 2050 nicht", (code) => {
    const l = LAENDER[code];
    const mehr = fest(code, { stell: { "mig.netto": standardWert("mig.netto", l) * 2 } });
    expect(am(mehr, 2050)).toBeLessThanOrEqual(am(fest(code), 2050) + 1e-9);
  });

  it.each(["DE", "FR", "IT"])("%s: In einer Krise steigt die Rentenquote, wie ohne Anpassung", (code) => {
    const krise = { schocks: [{ id: 1, art: "krise" as const, jahr: 2034, staerke: 2, dauer: 1 }] };
    const an = fest(code, krise), ohne = fest(code);
    expect(am(an, 2034)).toBeGreaterThan(am(ohne, 2034));
  });

  it("aus: Das Niveau bleibt, die Ausgaben steigen mit der Demografie", () => {
    const r = fest("IT", { aus: AUS });
    expect(am(r, 2050) / am(r, 2025)).toBeGreaterThan(1.4);
  });

  it("China und Russland ohne Anpassung (keine amtliche Projektion)", () => {
    expect(fest("CN")).toEqual(fest("CN", { aus: AUS }));
    expect(fest("RU")).toEqual(fest("RU", { aus: AUS }));
  });

  it("Rückblick ohne Anpassung: Der Pfad des Rentenniveaus enthält den Nachhaltigkeitsfaktor schon", () => {
    const sz = RUECKBLICK.sz;
    expect(rechne(RUECKBLICK.land, sz)).toEqual(rechne(RUECKBLICK.land, { ...sz, aus: [...(sz.aus ?? []), ...AUS] }));
  });

  it("Kalibrierfälle ohne Anpassung: Sie erben nicht das heutige Recht ihrer Vorlage", () => {
    for (const datei of readdirSync("daten/kalibrierung").filter((d) => d.endsWith(".json"))) {
      const { land, sz } = baueFall(JSON.parse(readFileSync(`daten/kalibrierung/${datei}`, "utf-8")) as Fall);
      expect(rechne(land, sz), datei).toEqual(rechne(land, { ...sz, aus: [...sz.aus, ...AUS] }));
    }
  });
});
