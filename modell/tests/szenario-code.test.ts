import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";
import { BANKEN_STANDARD, bankenAn, zoegernd } from "../banken-modus";
import { POLITIK_STANDARD } from "../politik";
import { basisSzenario, rechne } from "../rechne";
import { dekodiere, istBasis, kodiere } from "../szenario-code";
import type { Szenario } from "../typen";
import { BANKWERTE, testland } from "./testland";

const land = testland();
const beispiel: Szenario = {
  ...basisSzenario(land, 101),
  grund: { regime: "eigen", rentensystem: "mischung", tpi: false },
  stell: {
    "rente.alter": 69,
    "staat.uebrige": [
      { ab: 2025, wert: 20 },
      { ab: 2030, wert: 18 },
    ],
  },
  schocks: [{ id: 7, art: "krieg", jahr: 2031, staerke: 2, dauer: 1.5 }],
  aus: ["wachstum.multiplikator"],
};

describe("Szenario-Code", () => {
  it("übersteht den Hin- und Rückweg", () => {
    const zurueck = dekodiere(kodiere(beispiel), land)!;
    expect(zurueck.jahre).toBe(101);
    expect(zurueck.grund).toEqual(beispiel.grund);
    expect(zurueck.stell).toEqual(beispiel.stell);
    expect(zurueck.aus).toEqual(beispiel.aus);
    expect(zurueck.schocks).toEqual([
      { id: 1, art: "krieg", jahr: 2031, staerke: 2, dauer: 1.5 },
    ]);
  });
  it("Grenzfall: Unsinn ergibt null", () => {
    expect(dekodiere("kaputt", land)).toBeNull();
    expect(dekodiere("", land)).toBeNull();
    expect(
      dekodiere(compressToEncodedURIComponent('{"v":9}'), land),
    ).toBeNull();
  });
  it("Grenzfall: Unbekanntes wird verworfen, Bekanntes bleibt", () => {
    const roh = {
      v: 1,
      j: 77,
      g: { regime: "mond", rentensystem: "kapital", tpi: "ja" },
      s: { "rente.alter": 68, "gibt.esNicht": 3, "mig.netto": "viel" },
      k: [
        ["meteor", 2030, 1, 1],
        ["oel", 2030, 1, 1],
      ],
      a: ["rente.alter", "wachstum.okun", "innov.fueRendite"],
    };
    const sz = dekodiere(
      compressToEncodedURIComponent(JSON.stringify(roh)),
      land,
    )!;
    expect(sz.jahre).toBe(51);
    expect(sz.grund).toEqual({
      regime: land.grund.regime,
      rentensystem: "kapital",
      tpi: land.grund.tpi,
    });
    expect(sz.stell).toEqual({ "rente.alter": 68 });
    expect(sz.schocks.map((s) => s.art)).toEqual(["oel"]);
    expect(sz.aus).toEqual(["innov.fueRendite"]);
  });
  it("erkennt die Basislinie", () => {
    expect(istBasis(basisSzenario(land, 51), land)).toBe(true);
    expect(istBasis(beispiel, land)).toBe(false);
  });
});

describe("Schlussprüfung Phase 2", () => {
  const kodiereRoh = (roh: unknown) => compressToEncodedURIComponent(JSON.stringify(roh));
  it("C1: geerbte Schlüssel wie toString sind keine Schock-Art", () => {
    const sz = dekodiere(kodiereRoh({ v: 1, j: 51, g: {}, s: {}, k: [["toString", 2030, 1, 1], ["constructor", 2030, 1, 1], ["oel", 2030, 1, 1]], a: [] }), land)!;
    expect(sz.schocks.map((s) => s.art)).toEqual(["oel"]);
  });
  it("I2: Werte werden auf den erlaubten Bereich begrenzt, Schocks bereinigt", () => {
    const sz = dekodiere(kodiereRoh({ v: 1, j: 51, g: {}, a: [],
      s: { "rente.alter": 1e300, "staat.uebrige": [{ ab: 2025, wert: -5 }, { ab: 2030, wert: 18 }] },
      k: [["oel", 2030, 1e308, -5], ["oel", 2030, 1, 1], ["krise", 2030.5, 1, 1], ["krise", 2025, 1, 1], ["krieg", 2031, 1.2, 2.4]] }), land)!;
    expect(sz.stell["rente.alter"]).toBe(75);
    expect(sz.stell["staat.uebrige"]).toEqual([{ ab: 2025, wert: 10 }, { ab: 2030, wert: 18 }]);
    expect(sz.schocks.map((s) => [s.art, s.jahr, s.staerke, s.dauer])).toEqual([["oel", 2030, 3, 1], ["krieg", 2031, 1, 2]]);
  });
});

describe("13.10 Politik im Link", () => {
  it("Grenzfall: fest bleibt fest, alter Link ohne Feld lädt mit Standard", () => {
    const fest: Szenario = { ...basisSzenario(land, 26), grund: { ...land.grund, politik: "fest" } };
    expect(dekodiere(kodiere(fest), land)?.grund.politik).toBe("fest");
    const re: Szenario = { ...basisSzenario(land, 26), grund: { ...land.grund, politik: "reagiert" } };
    expect(dekodiere(kodiere(re), land)?.grund.politik).toBe("reagiert");
    const altLink = compressToEncodedURIComponent(JSON.stringify({ v: 1, j: 26, g: { regime: "eigen", rentensystem: "umlage", tpi: false }, s: {}, k: [], a: [] }));
    const alt = dekodiere(altLink, land)!;
    expect(alt.grund.politik).toBeUndefined();
    expect(rechne(land, alt).every((z) => Number.isFinite(z.schuldQuote))).toBe(true);
    const unsinn = compressToEncodedURIComponent(JSON.stringify({ v: 1, j: 26, g: { politik: "chaos" }, s: {}, k: [], a: [] }));
    expect(dekodiere(unsinn, land)!.grund.politik).toBeUndefined();
  });
  it("istBasis: Politik wie beim Land zählt als Basis, abweichend nicht", () => {
    const wieLand = land.grund.politik ?? POLITIK_STANDARD;
    const anders = wieLand === "fest" ? "reagiert" : "fest";
    expect(istBasis({ ...basisSzenario(land, 51), grund: { ...land.grund, politik: wieLand } }, land)).toBe(true);
    expect(istBasis({ ...basisSzenario(land, 51), grund: { ...land.grund, politik: anders } }, land)).toBe(false);
  });
});

describe("13.6 Banken im Link", () => {
  const bank = testland(BANKWERTE);
  it("Banken an und Rettung zögernd überstehen den Hin- und Rückweg", () => {
    const sz: Szenario = { ...basisSzenario(bank, 26), grund: { ...bank.grund, banken: "an", rettung: "zoegernd" } };
    const zurueck = dekodiere(kodiere(sz), bank)!;
    expect(zurueck.grund.banken).toBe("an");
    expect(zurueck.grund.rettung).toBe("zoegernd");
    expect(bankenAn(bank, zurueck.grund)).toBe(true);
    expect(zoegernd(zurueck.grund)).toBe(true);
  });
  it("Grenzfall: alter Link ohne die Felder lädt und rechnet mit den Standards", () => {
    const altLink = compressToEncodedURIComponent(JSON.stringify({ v: 1, j: 26, g: { regime: "eigen", rentensystem: "umlage", tpi: false, politik: "fest" }, s: {}, k: [], a: [] }));
    const alt = dekodiere(altLink, bank)!;
    expect(alt.grund.banken).toBeUndefined();
    expect(alt.grund.rettung).toBeUndefined();
    expect(bankenAn(bank, alt.grund)).toBe(BANKEN_STANDARD === "an");
    expect(zoegernd(alt.grund)).toBe(false);
    expect(rechne(bank, alt).every((z) => Number.isFinite(z.schuldQuote) && z.rettung === 0)).toBe(true);
    const unsinn = compressToEncodedURIComponent(JSON.stringify({ v: 1, j: 26, g: { banken: "vielleicht", rettung: 3 }, s: {}, k: [], a: [] }));
    expect(dekodiere(unsinn, bank)!.grund.banken).toBeUndefined();
    expect(dekodiere(unsinn, bank)!.grund.rettung).toBeUndefined();
  });
  it("istBasis: Banken an oder Rettung zögernd ist keine Basislinie", () => {
    expect(istBasis(basisSzenario(bank, 51), bank)).toBe(true);
    expect(istBasis({ ...basisSzenario(bank, 51), grund: { ...bank.grund, banken: BANKEN_STANDARD } }, bank)).toBe(true);
    expect(istBasis({ ...basisSzenario(bank, 51), grund: { ...bank.grund, banken: "an" } }, bank)).toBe(false);
    expect(istBasis({ ...basisSzenario(bank, 51), grund: { ...bank.grund, rettung: "zoegernd" } }, bank)).toBe(false);
  });
});

describe("13.13 Wahl der Nutzerin im Link", () => {
  const mitWahl: Szenario = { ...basisSzenario(land, 51), wahl: { "2028-schwaeche": "unbequem", "2041-eng": "macht" } };
  const mitW = (w: unknown) => compressToEncodedURIComponent(JSON.stringify({ v: 1, j: 51, g: {}, s: {}, k: [], a: [], w }));
  it("übersteht den Hin- und Rückweg", () => {
    expect(dekodiere(kodiere(mitWahl), land)!.wahl).toEqual(mitWahl.wahl);
  });
  it("ohne Wahl steht kein Feld w im Link, und ein Link ohne w lädt mit leerer Wahl (alte Links)", () => {
    const roh = (sz: Szenario) => JSON.parse(decompressFromEncodedURIComponent(kodiere(sz))!);
    expect(roh(basisSzenario(land, 51))).not.toHaveProperty("w");
    expect(roh(mitWahl).w).toEqual(mitWahl.wahl);
    const alt = dekodiere(compressToEncodedURIComponent(JSON.stringify({ v: 1, j: 51, g: {}, s: {}, k: [], a: [] })), land)!;
    expect(alt.wahl).toBeUndefined();
  });
  it("Grenzfall: unbekanntes Motiv, kaputter Schlüssel, null, Liste, Zahl fallen weg; kein Fehler", () => {
    const ok = dekodiere(mitW({ "2028-schwaeche": "macht", "2030-eng": "irgendwas", abc: "macht", "2030-xyz": "macht", "99-eng": "macht", "2031-eng": null, "2032-eng": 3 }), land)!;
    expect(ok.wahl).toEqual({ "2028-schwaeche": "macht" });
    // Geerbte Schlüssel als echte JSON-Schlüssel (ein Objektliteral mit __proto__ setzte nur den Prototyp).
    const roh = '{"v":1,"j":51,"g":{},"s":{},"k":[],"a":[],"w":{"__proto__":"macht","constructor":"macht","2028-eng":"macht"}}';
    const z = dekodiere(compressToEncodedURIComponent(roh), land)!;
    expect(z.wahl).toEqual({ "2028-eng": "macht" });
    expect(Object.getPrototypeOf(z.wahl)).toBe(Object.prototype);
    for (const w of [null, [], "macht", 5, true, [["2028-eng", "macht"]]]) {
      const z = dekodiere(mitW(w), land)!;
      expect(z, JSON.stringify(w)).not.toBeNull();
      expect(z.wahl).toBeUndefined();
    }
  });
  it("istBasis ist falsch, sobald es einen Eintrag gibt", () => {
    expect(istBasis(basisSzenario(land, 51), land)).toBe(true);
    expect(istBasis(mitWahl, land)).toBe(false);
    expect(istBasis({ ...basisSzenario(land, 51), wahl: {} }, land)).toBe(true);
  });
});


describe("M29: Haushaltsplan im Link", () => {
  it("wird mitgenommen; alte Links ohne Feld rechnen mit dem Standard und gelten als Basis", () => {
    const sz: Szenario = { ...basisSzenario(land), grund: { ...land.grund, haushaltsplan: "aus" } };
    expect(dekodiere(kodiere(sz), land)!.grund.haushaltsplan).toBe("aus");
    expect(istBasis(sz, land)).toBe(false);
    expect(istBasis({ ...sz, grund: { ...land.grund, haushaltsplan: "an" } }, land)).toBe(true);
    const alt = dekodiere(kodiere(basisSzenario(land)), land)!;
    expect(alt.grund.haushaltsplan).toBeUndefined();
    expect(istBasis(alt, land)).toBe(true);
  });
  it("unbekannter Wert wird verworfen", () => {
    const unsinn = { ...basisSzenario(land), grund: { ...land.grund, haushaltsplan: "ja" as never } };
    expect(dekodiere(kodiere(unsinn), land)!.grund.haushaltsplan).toBeUndefined();
  });
});
