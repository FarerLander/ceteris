import { basisSzenario, rechne } from "../rechne";
import type {
  Grundeinstellungen,
  Landesdaten,
  Schock,
  Startwerte,
  Szenario,
  Zustand,
} from "../typen";
import { stellschrauben } from "../verzeichnis";
import { testland } from "./testland";

const land = testland();
const lauf = (
  l: Landesdaten,
  stell: Szenario["stell"] = {},
  jahre = 51,
  extra: Partial<Szenario> = {},
) => rechne(l, { ...basisSzenario(l, jahre), stell, ...extra });
const variante = (
  start: Partial<Startwerte>,
  grund: Partial<Grundeinstellungen>,
) => testland(start, grund);

function endlich(z: Zustand): string[] {
  const fehler: string[] = [];
  for (const [feld, wert] of Object.entries(z)) {
    if (typeof wert === "number" && !Number.isFinite(wert)) fehler.push(feld);
    if (
      Array.isArray(wert) &&
      feld === "alter" &&
      wert.some((x) => !Number.isFinite(x) || x < 0)
    )
      fehler.push(feld);
  }
  for (const [q, wert] of Object.entries(z.mix))
    if (!Number.isFinite(wert) || wert < 0) fehler.push(`mix.${q}`);
  return fehler;
}

describe("Buchhaltung (alle Jahre)", () => {
  const v = lauf(land);
  it("Bevölkerung, Schuld und Kapital gehen exakt auf", () => {
    for (let t = 1; t < v.length; t++) {
      const a = v[t - 1],
        n = v[t];
      expect(n.bev).toBeCloseTo(
        a.bev + n.geburten - n.sterbefaelle + n.zuwanderung - n.abwanderung,
        9,
      );
      expect(n.schuldNom).toBeCloseTo(a.schuldNom + n.defizitNom - n.schnittNom, 6);
      expect(n.K).toBeCloseTo(
        (1 - 0.06) * a.K + (n.investQuote / 100) * a.Y,
        6,
      );
      const m = n.mix;
      expect(m.kohle + m.gas + m.oel + m.atom + m.ern).toBeCloseTo(1, 9);
    }
  });
});

describe("Stabilität", () => {
  it("ohne Eingriff bleiben 100 Jahre in plausiblen Grenzen", () => {
    // Spec 11: „Ein Land im Gleichgewicht“ — ausgeglichener Haushalt, stabile Geburtenrate, keine steigende Lebenserwartung.
    const gleich = testland({ einnahmen: 49.5 });
    const v = lauf(gleich, { "demo.lebenserwartungTrend": 0, "demo.geburtenrate": 2.1 }, 101);
    for (let t = 1; t < v.length; t++) {
      expect(endlich(v[t])).toEqual([]);
      expect(v[t].Y).toBeGreaterThan(0);
      // Ausnahme: das Jahr eines Schuldenschnitts (Ventil) ist ein gewollter Sprung.
      if (v[t].ventilSeit !== 0) expect(Math.abs(v[t].schuldQuote - v[t - 1].schuldQuote)).toBeLessThan(15);
      expect(v[t].schuldQuote).toBeLessThan(400);
      expect(v[t].inflation).toBeGreaterThan(-5);
      expect(v[t].inflation).toBeLessThan(15);
      expect(v[t].alq).toBeLessThan(30);
    }
  });
});

describe("Regime-Verhalten", () => {
  const schuldenschub = {
    "staat.uebrige": [
      { ab: 2025, wert: land.standards["staat.uebrige"] + 8 },
      { ab: 2036, wert: land.standards["staat.uebrige"] },
    ],
  };
  const maxAufschlag = (l: Landesdaten) =>
    Math.max(...lauf(l, schuldenschub, 26).map((z) => z.aufschlag));
  it("Schuldenschub: Gemeinschaftswährung reagiert deutlich stärker als eigene Währung", () => {
    expect(maxAufschlag(variante({}, { regime: "euro" }))).toBeGreaterThan(
      maxAufschlag(variante({}, { regime: "eigen" })) + 1,
    );
  });
  it("TPI dämpft den Aufschlag bei gemeinsamer Währung", () => {
    expect(
      maxAufschlag(variante({}, { regime: "euro", tpi: true })),
    ).toBeLessThan(maxAufschlag(variante({}, { regime: "euro" })));
  });
  it("Finanzkrise: Rendite der Weltwährung sinkt, die eines Randstaats steigt", () => {
    const krise: Schock[] = [
      { id: 1, art: "krise", jahr: 2030, staerke: 1, dauer: 1 },
    ];
    const welt = lauf(
      variante({ fluchtReaktion: -1, reserve: 1 }, { regime: "welt" }),
      {},
      8,
      { schocks: krise },
    );
    const rand = lauf(
      variante({ fluchtReaktion: 1.5 }, { regime: "euro" }),
      {},
      8,
      { schocks: krise },
    );
    expect(welt[5].rendite).toBeLessThan(welt[4].rendite);
    expect(rand[5].rendite).toBeGreaterThan(rand[4].rendite);
  });
  it("Harte Währung: kein QE, Deflation bei stehendem Währungsbestand", () => {
    const v = lauf(
      variante({}, { regime: "hart" }),
      { "geld.qeTempo": 2 },
      21,
      { welt: { bestandWachstum: 0 } },
    );
    expect(v.slice(1).every((z) => z.qe === 0)).toBe(true);
    expect(v.slice(5).reduce((s, z) => s + z.inflation, 0) / 16).toBeLessThan(
      0,
    );
  });
});

describe("Ventile bei Überschuldung", () => {
  const dauerDefizit = { "staat.uebrige": land.standards["staat.uebrige"] + 10 };
  it("Gemeinsame Währung: Schuldenschnitt senkt die Schuld deutlich, Lage Krise, danach Einbruch", () => {
    const v = lauf(land, dauerDefizit, 51);
    const t = v.findIndex((z) => z.ventilArt === 1 && z.ventilSeit === 0);
    expect(t).toBeGreaterThan(0);
    expect(v[t].schnittNom).toBeGreaterThan(0);
    expect(v[t].schuldQuote).toBeLessThan(v[t - 1].schuldQuote * 0.7);
    expect(v[t].lage).toBe("krise");
    expect(v[t + 1].luecke).toBeLessThan(v[t].luecke);
  });
  it("Eigene Währung: kein Schnitt, stattdessen entwertet Inflation die Schuld", () => {
    const l = variante({}, { regime: "eigen" });
    const v = lauf(l, { "staat.uebrige": l.standards["staat.uebrige"] + 10, "anleihen.auslandsanteil": 0.9 }, 101);
    expect(v.some((z) => z.ventilArt === 1)).toBe(false);
    const t = v.findIndex((z) => z.ventilArt === 2 && z.ventilSeit === 0);
    expect(t).toBeGreaterThan(0);
    expect(v[t + 1].inflation).toBeGreaterThan(5);
  });
});

describe("Mechanismen", () => {
  const basis = lauf(land);
  it("Kapitaldeckung mit Wagniskapital-Erlaubnis hebt die Produktivität mit Verzug", () => {
    const l = variante({}, { rentensystem: "kapital" });
    const v = lauf(l, { "innov.pensionsfondsVC": 1 });
    expect(v[30].vcQuote).toBeGreaterThan(basis[30].vcQuote);
    expect(v[30].A).toBeGreaterThan(basis[30].A);
  });
  it("Rentenalter +2: mehr Erwerbspersonen, weniger Rentenausgaben", () => {
    const v = lauf(land, { "rente.alter": 69 });
    expect(v[15].erwerbspersonen).toBeGreaterThan(basis[15].erwerbspersonen);
    expect(v[15].rentenausgaben).toBeLessThan(basis[15].rentenausgaben);
  });
  it("schnellere Integration verbessert den Primärsaldo", () => {
    const schnell = lauf(land, { "mig.netto": 500, "mig.halbwert": 3 });
    const langsam = lauf(land, { "mig.netto": 500, "mig.halbwert": 8 });
    expect(schnell[10].primaer).toBeGreaterThan(langsam[10].primaer);
  });
  it("umstrittener Mechanismus aus: Einnahmen ändern sich, Demografie nicht", () => {
    const an = lauf(land, { "steuer.kapitalertrag": 0.5 }, 11);
    const aus = rechne(land, {
      ...basisSzenario(land, 11),
      stell: { "steuer.kapitalertrag": 0.5 },
      aus: ["steuer.eps.kapitalertrag"],
    });
    expect(aus[1].einnahmen).not.toBeCloseTo(an[1].einnahmen, 3);
    expect(aus[10].alter).toEqual(an[10].alter);
  });
});

describe("Grenzfälle", () => {
  it("1: jede Stellschraube auf Minimum und Maximum bleibt endlich", () => {
    for (const e of stellschrauben()) {
      for (const wert of e.bereich!) {
        const v = lauf(land, { [e.id]: wert }, 51);
        const kaputt = v.flatMap((z) => endlich(z));
        expect(kaputt, `${e.id} = ${wert}`).toEqual([]);
        expect(v[50].bev, e.id).toBeGreaterThan(0);
      }
    }
  });
  it("1: alle Stellschrauben gleichzeitig auf Minimum bzw. Maximum bleiben endlich", () => {
    for (const seite of [0, 1]) {
      const stell = Object.fromEntries(
        stellschrauben().map((e) => [e.id, e.bereich![seite]]),
      );
      expect(lauf(land, stell, 51).flatMap((z) => endlich(z))).toEqual([]);
    }
  });
  it("2: gestapelte Schocks im selben Jahr: endlich und Lage Krise", () => {
    const schocks: Schock[] = (["krieg", "pandemie", "krise"] as const).map(
      (art, i) => ({ id: i, art, jahr: 2030, staerke: 3, dauer: 1 }),
    );
    const v = lauf(land, {}, 26, { schocks });
    expect(v.flatMap((z) => endlich(z))).toEqual([]);
    expect(v[5].lage).toBe("krise");
  });
  it("4: Schock nach Horizontende oder vor Start ändert nichts", () => {
    const ohne = lauf(land, {}, 26);
    const spaet = lauf(land, {}, 26, {
      schocks: [{ id: 1, art: "krieg", jahr: 2080, staerke: 1, dauer: 1 }],
    });
    const frueh = lauf(land, {}, 26, {
      schocks: [{ id: 2, art: "krieg", jahr: 2024, staerke: 1, dauer: 1 }],
    });
    expect(spaet).toEqual(ohne);
    expect(frueh).toEqual(ohne);
  });
});
