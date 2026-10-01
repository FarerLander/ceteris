import { describe, expect, it } from "vitest";
import { LAENDER, RUECKBLICK } from "../../app/land";
import { basisSzenario, rechne } from "../rechne";
import { eintrag } from "../verzeichnis";

// M1, M18: Rentenanpassung nach heutigem Recht. Steigt die Zahl der Rentner je Beschäftigten, sinkt das
// Rentenniveau; je Land geeicht an den amtlichen Projektionen der Rentenausgaben.
const fest = (code: string, aus: string[] = []) => {
  const l = LAENDER[code];
  return rechne(l, { ...basisSzenario(l), aus, grund: { ...l.grund, politik: "fest" } });
};
const am = (r: ReturnType<typeof fest>, j: number) => r.find((z) => z.jahr === j)!.rentenausgaben;

describe("Rentenanpassung nach Landesrecht (M1)", () => {
  it("Verzeichnis: abschaltbar, neutral 0", () => {
    const e = eintrag("rente.anpassung");
    expect(e.art).toBe("wirkstaerke");
    expect(e.umstritten).toBe(true);
    expect(e.neutral).toBe(0);
  });

  // Ziele: Rentenausgaben 2050 relativ zu 2025 (EU Ageing Report 2024; OECD Pensions at a Glance 2023, Tabelle 8.4).
  // Deutschland liegt darüber, weil die Haltelinie bis 2031 im Bericht noch fehlt.
  it.each([
    ["FR", 13.7 / 14.2, 0.03],
    ["US", 6.1 / 5.5, 0.03],
    ["JP", 9.1 / 8.7, 0.03],
    ["CA", 8.1 / 7.2, 0.03],
    ["GB", 8.1 / 7.3, 0.04],
    ["IT", 15.5 / 16.1, 0.06],
  ] as const)("%s: Anstieg bis 2050 wie die amtliche Projektion", (code, ziel, tol) => {
    const r = fest(code);
    expect(am(r, 2050) / am(r, 2025)).toBeGreaterThan(ziel - tol);
    expect(am(r, 2050) / am(r, 2025)).toBeLessThan(ziel + tol);
  });

  it("Deutschland: bis 2031 Haltelinie (Niveau bleibt), danach dämpft die Anpassung", () => {
    const an = fest("DE"), aus = fest("DE", ["rente.anpassung"]);
    expect(am(an, 2031)).toBe(am(aus, 2031));
    expect(am(an, 2050)).toBeLessThan(am(aus, 2050) - 1.5);
    expect(am(an, 2050)).toBeGreaterThan(am(an, 2031) - 1);
  });

  it("aus: Das Niveau bleibt, die Ausgaben steigen mit der Demografie", () => {
    const r = fest("IT", ["rente.anpassung"]);
    expect(am(r, 2050) / am(r, 2025)).toBeGreaterThan(1.4);
  });

  it("China und Russland ohne Anpassung (keine amtliche Projektion)", () => {
    expect(fest("CN")).toEqual(fest("CN", ["rente.anpassung"]));
    expect(fest("RU")).toEqual(fest("RU", ["rente.anpassung"]));
  });

  it("Rückblick ohne Anpassung: Der Pfad des Rentenniveaus enthält den Nachhaltigkeitsfaktor schon", () => {
    const sz = RUECKBLICK.sz;
    expect(rechne(RUECKBLICK.land, sz)).toEqual(rechne(RUECKBLICK.land, { ...sz, aus: [...(sz.aus ?? []), "rente.anpassung"] }));
  });
});
