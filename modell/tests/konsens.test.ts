import {
  KONSENS_REIHE,
  istVeraltet,
  konsensPunkte,
  konsensSaetze,
  modellWert,
} from "../konsens";
import { basisSzenario, rechne } from "../rechne";
import type { Konsens, KonsensQuelle, Zustand } from "../typen";
import { testland } from "./testland";

const HEUTE = new Date("2026-09-28");
const verlauf = rechne(testland(), basisSzenario(testland(), 11));
const start = verlauf[0].jahr;
const vorn = verlauf.slice(1, 6);

// Quelle, deren Werte das Modell um `abstand` verfehlen.
function quelle(
  kurz: string,
  werte: KonsensQuelle["werte"],
  extra: Partial<KonsensQuelle> = {},
): KonsensQuelle {
  return { kurz, name: kurz, stand: "2026-04-15", werte, ...extra };
}
const wie = (g: Parameters<typeof modellWert>[1], abstand = 0) =>
  Object.fromEntries(vorn.map((z) => [z.jahr, modellWert(z, g) + abstand]));
const k = (...quellen: KonsensQuelle[]): Konsens => ({ quellen, gruende: {} });

describe("Konsens-Vergleich", () => {
  it("ordnet Diagramme den Größen zu", () => {
    expect(KONSENS_REIHE.bipProKopf).toBe("wachstum");
    expect(KONSENS_REIHE.primaer).toBe("defizit");
    expect(KONSENS_REIHE.co2Mt).toBeUndefined();
  });

  it("Saldo mit Zinsen, Wachstum in Prozent", () => {
    const z = verlauf[3] as Zustand;
    expect(modellWert(z, "defizit")).toBeCloseTo(
      z.primaer - z.zinsausgaben,
      10,
    );
    expect(modellWert(z, "wachstum")).toBeCloseTo(z.wachstum * 100, 10);
  });

  it("veraltet nach 12 Monaten, unlesbares Datum gilt als veraltet", () => {
    expect(istVeraltet("2025-10-01", HEUTE)).toBe(false);
    expect(istVeraltet("2025-09-01", HEUTE)).toBe(true);
    expect(istVeraltet("irgendwann", HEUTE)).toBe(true);
  });

  it("Punkte nur für Jahre nach dem Startjahr im Rechenzeitraum", () => {
    const werte = {
      ...wie("inflation"),
      [start]: 9,
      [start - 1]: 9,
      [start + 40]: 9,
    };
    const [p] = konsensPunkte(
      k(quelle("IWF", { inflation: werte })),
      verlauf,
      "inflation",
      HEUTE,
    );
    expect(Object.keys(p.werte).map(Number)).toEqual(vorn.map((z) => z.jahr));
  });

  it("Wachstum wird zum BIP pro Kopf verkettet und trifft das Modell bei gleichen Raten", () => {
    const [p] = konsensPunkte(
      k(quelle("IWF", { wachstum: wie("wachstum") })),
      verlauf,
      "bipProKopf",
      HEUTE,
    );
    for (const z of vorn) expect(p.werte[z.jahr]).toBeCloseTo(z.bipProKopf, 6);
  });

  it("Kette endet an einer Lücke", () => {
    const werte = wie("wachstum");
    delete werte[vorn[2].jahr];
    const [p] = konsensPunkte(
      k(quelle("IWF", { wachstum: werte })),
      verlauf,
      "bipProKopf",
      HEUTE,
    );
    expect(Object.keys(p.werte).map(Number)).toEqual([
      vorn[0].jahr,
      vorn[1].jahr,
    ]);
  });

  it("Saldo hat keine Punkte, fehlender Konsens gibt nichts", () => {
    expect(
      konsensPunkte(
        k(quelle("IWF", { defizit: wie("defizit") })),
        verlauf,
        "primaer",
        HEUTE,
      ),
    ).toEqual([]);
    expect(konsensPunkte(undefined, verlauf, "inflation", HEUTE)).toEqual([]);
    expect(konsensSaetze(undefined, verlauf, "inflation", HEUTE)).toEqual([]);
    expect(
      konsensSaetze(k(quelle("IWF", {})), verlauf, "inflation", HEUTE),
    ).toEqual([]);
  });

  it("im Band: deckt sich", () => {
    const [s] = konsensSaetze(
      k(quelle("IWF", { inflation: wie("inflation", 0.2) })),
      verlauf,
      "inflation",
      HEUTE,
    );
    expect(s).toMatch(
      /^Inflation im Schnitt \d{4}–\d{4}: Modell .* %, IWF \(.*2026\) .* %\. Deckt sich mit IWF\.$/,
    );
  });

  it("außerhalb des Bands: Richtung und Grund", () => {
    const konsens: Konsens = {
      quellen: [quelle("CBO", { wachstum: wie("wachstum", 0.5) })],
      gruende: { wachstum: { tiefer: "das Arbeitsangebot schwächer wächst" } },
    };
    const [s] = konsensSaetze(konsens, verlauf, "bipProKopf", HEUTE);
    expect(s).toMatch(
      /Das Modell ist vorsichtiger, weil das Arbeitsangebot schwächer wächst\.$/,
    );
    const [t] = konsensSaetze(
      k(quelle("CBO", { wachstum: wie("wachstum", -0.5) })),
      verlauf,
      "bipProKopf",
      HEUTE,
    );
    expect(t).toMatch(/Das Modell ist optimistischer\.$/);
  });

  it("Staatsschuld als Stand im letzten gemeinsamen Jahr", () => {
    const [s] = konsensSaetze(
      k(quelle("IWF", { schuldQuote: wie("schuldQuote", 10) })),
      verlauf,
      "schuldQuote",
      HEUTE,
    );
    expect(s).toMatch(new RegExp(`^Staatsschuld ${vorn[4].jahr}: Modell`));
    expect(s).toMatch(/Das Modell liegt darunter\.$/);
  });

  it("andere Abgrenzung: kein Urteil", () => {
    const q = quelle(
      "CBO",
      { schuldQuote: wie("schuldQuote", 30) },
      { abgrenzung: { schuldQuote: "nur Bund" } },
    );
    const [s] = konsensSaetze(k(q), verlauf, "schuldQuote", HEUTE);
    expect(s).toMatch(
      /Andere Abgrenzung \(nur Bund\), kein direkter Vergleich\.$/,
    );
    expect(
      konsensPunkte(k(q), verlauf, "schuldQuote", HEUTE)[0].abgrenzung,
    ).toBe("nur Bund");
  });

  it("veraltete Quelle wird genannt, unlesbares Datum ohne Kaputt-Text", () => {
    const [s] = konsensSaetze(
      k(quelle("IWF", { alq: wie("alq") }, { stand: "2024-01-10" })),
      verlauf,
      "alq",
      HEUTE,
    );
    expect(s).toMatch(/IWF \(.*2024, veraltet\)/);
    const [t] = konsensSaetze(
      k(quelle("IWF", { alq: wie("alq") }, { stand: "irgendwann" })),
      verlauf,
      "alq",
      HEUTE,
    );
    expect(t).not.toMatch(/Invalid|NaN/);
    expect(t).toMatch(/IWF \(Stand unbekannt, veraltet\)/);
  });
});

describe("Stand als Monat", () => {
  it("unabhängig von der Zeitzone", async () => {
    const { standText } = await import("../konsens");
    const tz = process.env.TZ;
    process.env.TZ = "America/New_York";
    try {
      expect(standText("2026-05")).toBe("Mai 2026");
      expect(standText("irgendwann")).toBe("Stand unbekannt");
    } finally {
      process.env.TZ = tz;
    }
  });
});
