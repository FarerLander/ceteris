import {
  bewerte,
  pruefeTreffsicherheit,
  trendStd,
  vergleichsPfad,
} from "../rueckblick";
import type { Zustand } from "../typen";

const z = (jahr: number, felder: Partial<Zustand>) =>
  ({
    jahr,
    wachstum: 0,
    inflation: 0,
    alq: 0,
    schuldQuote: 0,
    bev: 80,
    erwerbspersonen: 40,
    rentenausgaben: 10,
    leistungsbilanz: 0,
    rendite: 0,
    ...felder,
  }) as unknown as Zustand;
const alq = (werte: number[]) => werte.map((w, i) => z(2000 + i, { alq: w }));
const finde = (
  id: string,
  v: Zustand[],
  ist: Record<string, Record<number, number>>,
) => pruefeTreffsicherheit(v, ist).find((t) => t.id === id)!;

describe("trendStd", () => {
  it("ist null für eine exakte Gerade und für weniger als drei Werte", () => {
    expect(
      trendStd([
        { jahr: 2000, wert: 1 },
        { jahr: 2001, wert: 2 },
        { jahr: 2002, wert: 3 },
      ]),
    ).toBeCloseTo(0, 12);
    expect(
      trendStd([
        { jahr: 2000, wert: 1 },
        { jahr: 2001, wert: 2 },
      ]),
    ).toBeNull();
  });
  it("zieht den Trend ab: Streuung um die Gerade, Divisor n − 2", () => {
    // Gerade 0, 1, 2, 3 plus Abweichungen +1, −1, −1, +1
    const s = trendStd(
      [0, 1, 2, 3].map((j, i) => ({
        jahr: 2000 + j,
        wert: j + [1, -1, -1, 1][i],
      })),
    );
    expect(s).toBeCloseTo(Math.sqrt(4 / 2), 9);
  });
});

describe("vergleichsPfad", () => {
  it("konstant hält den Startwert, wachstum schreibt die Startrate fort", () => {
    expect(
      vergleichsPfad({ 1999: 80, 2000: 81 }, [2000, 2001, 2002], "konstant"),
    ).toEqual([81, 81, 81]);
    const w = vergleichsPfad(
      { 1999: 80, 2000: 81 },
      [2000, 2001, 2002],
      "wachstum",
    );
    expect(w[2]).toBeCloseTo(81 * (81 / 80) ** 2, 9);
  });
  it("Grenzfall: ohne Vorjahr wächst der Vergleich mit 0 %", () => {
    expect(vergleichsPfad({ 2000: 81 }, [2000, 2001], "wachstum")).toEqual([
      81, 81,
    ]);
  });
});

describe("pruefeTreffsicherheit", () => {
  const ist = {
    alq: { 2000: 8, 2001: 9, 2002: 7, 2003: 8, 2004: 10, 2005: 6 },
  };
  it("Modell exakt: alle Jahre im Band, U = 0, Hürde und Ziel erreicht", () => {
    const t = finde("alq", alq([8, 9, 7, 8, 10, 6]), ist);
    expect(t.jahre).toBe(5);
    expect(t.imBand).toBe(1);
    expect(t.theilU).toBe(0);
    expect(bewerte(t)).toBe("Ziel erreicht");
  });
  it("Modell schlechter als Stillstand: Hürde verfehlt", () => {
    const t = finde("alq", alq([8, 14, 2, 14, 2, 14]), ist);
    expect(t.theilU!).toBeGreaterThan(1);
    expect(bewerte(t)).toBe("Hürde verfehlt");
  });
  it("Grenzfall: konstante Ist-Reihe ergibt U 0 oder unendlich, nie NaN", () => {
    const konst = { alq: { 2000: 5, 2001: 5, 2002: 5, 2003: 5 } };
    expect(finde("alq", alq([5, 5, 5, 5]), konst).theilU).toBe(0);
    expect(finde("alq", alq([5, 6, 5, 5]), konst).theilU).toBe(Infinity);
  });
  it("Grenzfall: Lücken zählen nicht, zu wenig Daten ergibt keine Bewertung", () => {
    const luecke = finde("alq", alq([8, 9, 7, 8]), {
      alq: { 2000: 8, 2002: 7, 2003: 8 },
    });
    expect(luecke.jahre).toBe(2);
    expect(luecke.punkte[1].ist).toBeNull();
    const wenig = finde("alq", alq([8, 9, 7]), { alq: { 2000: 8, 2001: 9 } });
    expect(bewerte(wenig)).toBe("keine Daten");
  });
  it("kennt genau die neun Größen der Spec", () => {
    expect(pruefeTreffsicherheit(alq([8]), {}).map((t) => t.id)).toEqual([
      "wachstum",
      "inflation",
      "alq",
      "schuldQuote",
      "bev",
      "erwerbspersonen",
      "rentenausgaben",
      "leistungsbilanz",
      "rendite",
    ]);
  });
});
