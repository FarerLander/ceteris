import { GROESSEN, KENNZAHLEN, stoss } from "../netz/groessen";
import { schreibeMit } from "../netz/mitschrift";
import { berechneWeg } from "../netz/weg";
import { basisSzenario, rechne } from "../rechne";
import { testland } from "./testland";

const land = testland();
const sz = basisSzenario(land, 31);
const m = schreibeMit(land, sz);

describe("Stoß", () => {
  it("10 % der Spanne, auf den Schritt gerundet, am Rand nach unten", () => {
    expect(stoss("rente.alter", 67)).toBe(68.5); // Spanne 15, Schritt 0,5
    expect(stoss("rente.alter", 75)).toBe(73.5);
  });
  it("Auswahlregler springt zur nächsten Option", () => {
    expect(stoss("innov.pensionsfondsVC", 0)).toBe(1);
    expect(stoss("innov.pensionsfondsVC", 1)).toBe(0);
  });
});

describe("Zwischengrößen", () => {
  it("jede Größe existiert im Zustand als Zahl", () => {
    const z = rechne(land, basisSzenario(land, 2))[1] as unknown as Record<
      string,
      unknown
    >;
    for (const f of Object.keys(GROESSEN))
      expect([f, typeof z[f]]).toEqual([f, "number"]);
    for (const k of KENNZAHLEN) expect(GROESSEN[k]).toBeDefined();
  });
});

describe("Weg", () => {
  it("Rentenalter höher: mehr Erwerbstätige, weniger Staatsschuld", () => {
    const w = berechneWeg(land, sz, "rente.alter", m);
    const k = (f: string) => w.knoten.find((x) => x.feld === f);
    expect(k("beschaeftigte")?.wert).toBeGreaterThan(0);
    expect(k("schuldQuote")?.wert).toBeLessThan(0);
    expect(k("schuldQuote")?.gut).toBe(1);
    expect(
      w.knoten
        .filter((x) => x.kennzahl)
        .map((x) => x.feld)
        .sort(),
    ).toEqual([...KENNZAHLEN].sort());
    expect(w.knoten.filter((x) => !x.kennzahl).length).toBeLessThanOrEqual(10);
    expect(w.kanten.some(([von]) => von === "stell")).toBe(true);
    expect(w.satz).toMatch(
      /^Rentenalter 67 Jahre → 68,5 Jahre: nach 10 Jahren /,
    );
    expect(w.jahr).toBe(10);
  });

  it("Grenzfall: am oberen Rand kehrt sich das Vorzeichen um", () => {
    const oben = { ...sz, stell: { "rente.alter": 75 } };
    const w = berechneWeg(land, oben, "rente.alter", schreibeMit(land, oben));
    expect(w.nach).toBe(73.5);
    expect(w.knoten.find((x) => x.feld === "beschaeftigte")?.wert).toBeLessThan(
      0,
    );
  });

  it("Grenzfall: Auswahlregler nennt die Option als Text", () => {
    const w = berechneWeg(land, sz, "innov.pensionsfondsVC", m);
    expect(w.satz).not.toMatch(/NaN|undefined/);
    expect(w.nach).toBe(1);
  });

  it("Grenzfall: ohne merkliche Wirkung sagt der Satz das", () => {
    // Wirkstärke-ähnliche Stellschraube ohne Einfluss bei Umlage: Pensionsfonds in Wagniskapital ohne Fonds.
    const w = berechneWeg(land, sz, "innov.pensionsfondsVC", m);
    expect(w.knoten.filter((x) => !x.kennzahl)).toEqual([]);
    expect(w.satz).toMatch(/kaum Wirkung/);
  });

  it("Grenzfall: kurzer Rechenzeitraum", () => {
    const kurz = basisSzenario(land, 6);
    const w = berechneWeg(land, kurz, "rente.alter", schreibeMit(land, kurz));
    expect(w.jahr).toBe(5);
    expect(w.satz).toMatch(/nach 5 Jahren/);
  });

  it("verändert das Szenario nicht und ist deterministisch", () => {
    const vorher = JSON.stringify(sz);
    const a = berechneWeg(land, sz, "steuer.mwst", m);
    const b = berechneWeg(land, sz, "steuer.mwst", m);
    expect(JSON.stringify(sz)).toBe(vorher);
    expect(a).toEqual(b);
  });
});

describe("Weg lesbar", () => {
  const w = berechneWeg(land, sz, "rente.alter", m);
  const spalte = (f: string) => (f === "stell" ? 0 : w.knoten.find((k) => k.feld === f)!.spalte);
  it("Satz ohne doppelten Punkt", () => {
    expect(w.satz).not.toMatch(/\.\./);
  });
  it("höchstens zwei Vorgänger je Knoten, Linien nur vorwärts", () => {
    for (const k of w.knoten) expect(w.kanten.filter(([, b]) => b === k.feld).length).toBeLessThanOrEqual(2);
    for (const [a, b] of w.kanten) expect(spalte(a)).toBeLessThan(spalte(b));
  });
  it("„führt über“ nennt die frühesten Stationen", () => {
    const frueh = w.knoten.filter((k) => k.spalte === 1).map((k) => k.name);
    const ueber = /führt über (.+) und (.+)\.$/.exec(w.satz)!;
    expect(frueh).toContain(ueber[1]);
  });
});

describe("Weg nach der Überarbeitung", () => {
  const ids = ["rente.alter", "steuer.mwst", "mig.netto", "energie.co2Preis", "innov.fue", "mig.alterAnkunft", "energie.ausbauTempo", "staat.gesundheit"];
  it.each(ids)("%s: Linien strikt vorwärts, jede Zwischengröße merklich im Messjahr", (id) => {
    const w = berechneWeg(land, sz, id, m);
    const spalte = (f: string) => (f === "stell" ? 0 : w.knoten.find((k) => k.feld === f)!.spalte);
    for (const [a, b] of w.kanten) expect([a, b, spalte(a) < spalte(b)]).toEqual([a, b, true]);
    for (const k of w.knoten.filter((x) => !x.kennzahl))
      expect([k.feld, Math.abs(k.wert) >= (GROESSEN[k.feld].art === "quote" ? 0.05 : 0.1)]).toEqual([k.feld, true]);
    expect(w.satz).not.toMatch(/Jahren die fünf Kennzahlen/);
  });
  it("ruhige Kennzahlen: richtige Wortstellung", () => {
    const quiet = ids.map((id) => berechneWeg(land, sz, id, m).satz).find((t) => /Kennzahlen/.test(t));
    if (quiet) expect(quiet).toMatch(/nach \d+ Jahren bewegen sich die fünf Kennzahlen kaum\./);
  });
});
