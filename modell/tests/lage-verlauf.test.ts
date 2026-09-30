import { readFileSync } from "node:fs";
import { baueLand } from "../../daten/land";
import { erzaehlung } from "../auswertung";
import { LAGEN } from "../lage";
import { basisSzenario, rechne } from "../rechne";
import { LAGE_NAME } from "../reihen";

const HEUTE = new Date("2026-09-27");
const lies = (p: string) => JSON.parse(readFileSync(p, "utf-8"));
const basis = (code: string, politik?: "fest") => {
  const land = baueLand(
    lies(`daten/laender/${code}.json`),
    lies(`daten/laender/${code}-hand.json`),
    HEUTE,
  );
  const sz = { ...basisSzenario(land, 51), ...(politik ? { grund: { ...land.grund, politik } } : {}) };
  return { land, sz, v: rechne(land, sz) };
};

describe("Lagen im Verlauf", () => {
  const selten = new Set(["boom", "rezession", "stagflation", "deflation"]);
  it.each(["DE", "US", "JP"])(
    "Grenzfall: %s ohne Schocks und ohne Eingriffe der Regierung — Boom, Rezession, Stagflation, Deflation höchstens ein Jahr",
    (code) => {
      // „Selten“, nicht „nie“: Japan hat 2028 ein Rezessionsjahr aus dem
      // Leitzins-Sprung zum Start (Kritikpunkt M22).
      expect(
        basis(code, "fest").v.filter((z) => selten.has(z.lage)).length,
      ).toBeLessThanOrEqual(1);
    },
  );
  // Seit Spec 13.13 bewegt die Regierung die Wirtschaft selbst: Sparen kostet ein Rezessionsjahr, ein
  // Zuschuss für Industriestrom drückt die Preise (Japan 2029–2031). Wenige Jahre, kein Dauerzustand.
  it.each(["DE", "US", "JP"])("%s mit Eingriffen der Regierung: solche Lagen bleiben die Ausnahme (höchstens fünf von 51 Jahren)", (code) => {
    expect(basis(code).v.filter((z) => selten.has(z.lage)).length).toBeLessThanOrEqual(5);
  });
  it("USA: schuldenfinanziertes Wachstum kommt vor (Begründung in Spec 10)", () => {
    expect(basis("US").v.some((z) => z.lage === "schuldenwachstum")).toBe(true);
  });
  it("jede Lage hat einen Namen, die Verteilung zählt alle Jahre", () => {
    for (const l of LAGEN) expect(LAGE_NAME[l]).toBeTruthy();
    const { land, sz, v } = basis("DE");
    const e = erzaehlung(land, sz, v);
    expect(Object.keys(e.verteilung).sort()).toEqual([...LAGEN].sort());
    expect(Object.values(e.verteilung).reduce((a, b) => a + b, 0)).toBe(
      v.length,
    );
  });
  it("Erzählung nennt die erste Krise außerhalb eines Schocks", () => {
    const { land } = basis("DE");
    const sz = {
      ...basisSzenario(land, 51),
      stell: { "staat.uebrige": land.standards["staat.uebrige"] + 10 },
    };
    const v = rechne(land, sz);
    const erste = v.find((z) => z.lage === "krise")!;
    expect(erste).toBeDefined();
    const e = erzaehlung(land, sz, v);
    expect(e.titel).toBe(`Ab ${erste.jahr} droht die Krise`);
    expect(e.symbol).toBe("krise");
  });
});

describe("Erzählung: Krisengrund stimmt", () => {
  it("langer Kriegsschock: Krisenjahre im Schock zählen nicht als eigene Krise", () => {
    const { land } = basis("US");
    const sz = {
      ...basisSzenario(land, 51),
      schocks: [
        { id: 1, art: "krieg" as const, jahr: 2035, staerke: 1, dauer: 2 },
      ],
    };
    const v = rechne(land, sz);
    const e = erzaehlung(land, sz, v);
    expect(e.titel).not.toMatch(/droht die Krise/);
    expect(e.unter).not.toMatch(/privaten Schulden/);
  });
  it("Krise ohne hohen Schuldendienst nennt keine privaten Schulden", () => {
    const { land, sz, v } = basis("US");
    const t = 10;
    const kaputt = v.map((z, i) =>
      i === t
        ? { ...z, lage: "krise" as const, dsr: 0, aufschlag: 0, ventilSeit: 99 }
        : z,
    );
    const e = erzaehlung(land, sz, kaputt);
    expect(e.titel).toBe(`Ab ${v[t].jahr} droht die Krise`);
    expect(e.unter).not.toMatch(/privaten Schulden/);
  });
});
