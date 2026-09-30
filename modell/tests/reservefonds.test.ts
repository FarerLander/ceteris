import autoCA from "../../daten/laender/CA.json";
import handCA from "../../daten/laender/CA-hand.json";
import autoJP from "../../daten/laender/JP.json";
import handJP from "../../daten/laender/JP-hand.json";
import { baueLand } from "../../daten/land";
import type { AutoDatei, HandDatei } from "../../daten/typen";
import { basisSzenario, rechne } from "../rechne";
import type { Landesdaten, Szenario } from "../typen";
import { testland } from "./testland";

const HEUTE = new Date("2026-09-27");
const ca = baueLand(autoCA as unknown as AutoDatei, handCA as unknown as HandDatei, HEUTE);
const jp = baueLand(autoJP as unknown as AutoDatei, handJP as unknown as HandDatei, HEUTE);
const ohneFonds = (l: Landesdaten): Landesdaten => ({ ...l, start: { ...l.start, fondsQuote0: 0 } });
const mit = (l: Landesdaten, rentensystem: "umlage" | "mischung", jahre = 21): Szenario => {
  const sz = basisSzenario(l, jahre);
  return { ...sz, grund: { ...sz.grund, rentensystem } };
};

describe("Reservefonds im Startjahr", () => {
  it("Kanada und Japan starten mit ihrem Fonds", () => {
    expect(ca.start.fondsQuote0).toBeGreaterThan(15);
    expect(jp.start.fondsQuote0).toBeGreaterThan(30);
    expect(rechne(ca, mit(ca, "umlage"))[0].fondsQuote).toBe(ca.start.fondsQuote0);
  });

  it("bei Umlage bleibt der Fonds als Anteil am BIP stehen und ändert den Haushalt nicht", () => {
    const v = rechne(ca, mit(ca, "umlage"));
    const w = rechne(ohneFonds(ca), mit(ohneFonds(ca), "umlage"));
    expect(v[20].fondsQuote).toBe(ca.start.fondsQuote0);
    expect(v.map((z) => z.schuldQuote)).toEqual(w.map((z) => z.schuldQuote));
  });

  it("beim Umstieg auf Mischung trägt der vorhandene Fonds mit: weniger Doppelbelastung", () => {
    const v = rechne(ca, mit(ca, "mischung"));
    const w = rechne(ohneFonds(ca), mit(ohneFonds(ca), "mischung"));
    expect(v[10].rentenausgaben).toBeLessThan(w[10].rentenausgaben);
    expect(v[20].schuldQuote).toBeLessThan(w[20].schuldQuote);
  });

  it("die Erträge des Startfonds werden beim Umstieg nicht doppelt gezählt", () => {
    const l = testland({ fondsQuote0: 20 });
    const v = rechne(l, mit(l, "mischung", 3));
    // Ohne Einzahlung und Auszahlung bliebe der Startfonds real stehen; sein Ertrag steckt schon in den Einnahmen.
    const ohneStrom = rechne({ ...l, start: { ...l.start, fondsQuote0: 20 } }, mit(l, "umlage", 3));
    expect(ohneStrom[2].fondsQuote).toBe(20);
    expect(v[1].fondsQuote).toBeLessThan(20 * 1.001 + 5);
  });

  it("Länder ohne Fonds rechnen wie vorher", () => {
    const l = testland();
    expect(l.start.fondsQuote0 ?? 0).toBe(0);
    expect(rechne(l, mit(l, "mischung", 5))[0].fondsQuote).toBe(0);
  });
});
