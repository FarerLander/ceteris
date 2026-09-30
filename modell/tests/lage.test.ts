import { baueKontext } from "../kontext";
import { LAGEN, lage } from "../lage";
import { basisSzenario, rechne } from "../rechne";
import { startzustand } from "../start";
import type { Zustand } from "../typen";
import { testland } from "./testland";

const land = testland();
const sz = basisSzenario(land, 51);
const { z, c } = startzustand(land, sz);
const k = baueKontext(land, sz, c, 5);
const ziel = k.w("geld.inflationsziel");

// Ruhiges Jahr: 1,5 % pro Kopf, Inflation am Ziel, Schuld stabil, kein Höchststand-Abstand.
const ruhig = (x: Partial<Zustand> = {}): Zustand => ({
  ...z,
  wachstumProKopf: 0.015,
  inflation: ziel,
  luecke: 0,
  aufschlag: 0,
  dsr: 0,
  ventilSeit: 99,
  minusJahre: 0,
  hoechstProKopf: z.bipProKopf,
  bipProKopf: z.bipProKopf,
  schuldQuote: 60,
  ...x,
});
const vorjahr = ruhig();

describe("Lage: je Regel ein Fall", () => {
  it.each([
    ["krise", { aufschlag: 3.5 }],
    ["krise", { ventilSeit: 0 }],
    ["krise", { dsr: land.start.dsrSchwelle + 1 }],
    ["depression", { wachstumProKopf: -0.002, minusJahre: 3 }],
    ["depression", { bipProKopf: z.bipProKopf * 0.89 }],
    ["rezession", { wachstumProKopf: -0.006, minusJahre: 1 }],
    ["stagflation", { wachstumProKopf: 0.003, inflation: ziel + 2.5 }],
    ["deflation", { inflation: -0.2 }],
    ["boom", { luecke: 0.01, wachstumProKopf: 0.03 }],
    ["boom", { luecke: 0.01, inflation: ziel + 2.5 }],
    ["schuldenwachstum", { schuldQuote: 61 }],
    ["wachstum", {}],
    ["stagnation", { wachstumProKopf: 0.003 }],
  ] as const)("%s bei %o", (erwartet, x) => {
    expect(lage(vorjahr, ruhig(x as Partial<Zustand>), k)).toBe(erwartet);
  });
});

describe("Lage: Reihenfolge und Grenzen", () => {
  it("LAGEN hat genau neun Einträge in Spec-Reihenfolge", () => {
    expect(LAGEN).toEqual([
      "krise",
      "depression",
      "rezession",
      "stagflation",
      "deflation",
      "boom",
      "schuldenwachstum",
      "wachstum",
      "stagnation",
    ]);
  });
  it("Krise geht vor Depression", () => {
    expect(lage(vorjahr, ruhig({ aufschlag: 4, minusJahre: 5 }), k)).toBe(
      "krise",
    );
  });
  it("Rezession mit Inflation über Ziel bleibt Rezession (vor Stagflation)", () => {
    expect(
      lage(vorjahr, ruhig({ wachstumProKopf: -0.01, inflation: ziel + 3 }), k),
    ).toBe("rezession");
  });
  it("Grenzfall: genau 0,5 % ist Stagnation, genau −0,5 % keine Rezession, genau 0 % Inflation keine Deflation", () => {
    expect(lage(vorjahr, ruhig({ wachstumProKopf: 0.005 }), k)).toBe(
      "stagnation",
    );
    expect(lage(vorjahr, ruhig({ wachstumProKopf: -0.005 }), k)).toBe(
      "stagnation",
    );
    expect(lage(vorjahr, ruhig({ inflation: 0 }), k)).toBe("wachstum");
  });
  it("Spec 13.9: 0,8 % pro Kopf ist Wachstum, keine Stagnation", () => {
    expect(lage(vorjahr, ruhig({ wachstumProKopf: 0.008 }), k)).toBe("wachstum");
  });
  it("zwei Minusjahre sind noch keine Depression", () => {
    expect(
      lage(vorjahr, ruhig({ wachstumProKopf: -0.002, minusJahre: 2 }), k),
    ).toBe("stagnation");
  });
  it("Krisen-Schock setzt Krise", () => {
    const schock = baueKontext(
      land,
      {
        ...sz,
        schocks: [
          {
            id: 1,
            art: "krise",
            jahr: land.datenstand + 5,
            staerke: 1,
            dauer: 1,
          },
        ],
      },
      c,
      5,
    );
    expect(lage(vorjahr, ruhig(), schock)).toBe("krise");
  });
});

describe("Lage: Höchststand und Minusjahre im Verlauf", () => {
  it("Grenzfall: erstes Jahr ohne Depression, Höchststand = Startwert", () => {
    const v = rechne(land, basisSzenario(land, 3));
    expect(v[0].hoechstProKopf).toBe(v[0].bipProKopf);
    expect(v[0].minusJahre).toBe(0);
    expect(v[1].lage).not.toBe("depression");
  });
  it("Höchststand steigt nie, Minusjahre zählen und setzen zurück", () => {
    const v = rechne(land, {
      ...basisSzenario(land, 26),
      schocks: [
        {
          id: 1,
          art: "pandemie",
          jahr: land.datenstand + 5,
          staerke: 3,
          dauer: 2,
        },
      ],
    });
    for (let t = 1; t < v.length; t++) {
      expect(v[t].hoechstProKopf).toBe(
        Math.max(v[t - 1].hoechstProKopf, v[t].bipProKopf),
      );
      expect(v[t].minusJahre).toBe(
        v[t].wachstumProKopf < 0 ? v[t - 1].minusJahre + 1 : 0,
      );
    }
  });
  it("Grenzfall: Erholung unter 90 % des Höchststands bleibt Depression", () => {
    const hoch = z.bipProKopf;
    expect(
      lage(
        vorjahr,
        ruhig({
          wachstumProKopf: 0.03,
          bipProKopf: hoch * 0.85,
          hoechstProKopf: hoch,
        }),
        k,
      ),
    ).toBe("depression");
    expect(
      lage(
        vorjahr,
        ruhig({
          wachstumProKopf: 0.03,
          bipProKopf: hoch * 0.91,
          hoechstProKopf: hoch,
        }),
        k,
      ),
    ).toBe("wachstum");
  });
});
