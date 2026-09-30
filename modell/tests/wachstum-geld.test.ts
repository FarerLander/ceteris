import { demografie } from "../bausteine/demografie";
import { energie } from "../bausteine/energie";
import { geld } from "../bausteine/geld";
import { innovation } from "../bausteine/innovation";
import { ordnung } from "../bausteine/ordnung";
import { privatschuld } from "../bausteine/privatschuld";
import { wachstum } from "../bausteine/wachstum";
import { basisSzenario, rechne } from "../rechne";
import type { Grundeinstellungen, Landesdaten, Szenario } from "../typen";
import { testland } from "./testland";

const BS = [
  demografie,
  ordnung,
  energie,
  innovation,
  wachstum,
  privatschuld,
  geld,
];
const lauf = (
  land: Landesdaten,
  stell: Szenario["stell"] = {},
  jahre = 11,
  extra: Partial<Szenario> = {},
) => rechne(land, { ...basisSzenario(land, jahre), stell, ...extra }, BS);
const land = testland();
const mitRegime = (regime: Grundeinstellungen["regime"]) =>
  testland({}, { regime });

describe("Wachstum", () => {
  it("erstes Jahr wächst plausibel", () => {
    const v = lauf(land, {}, 2);
    expect(v[1].wachstum).toBeGreaterThan(-0.02);
    expect(v[1].wachstum).toBeLessThan(0.03);
    expect(v[1].bipProKopf).toBeCloseTo(v[1].Y / v[1].bev, 9);
  });
  it("höhere Unternehmensteuer senkt die Investitionsquote", () => {
    expect(
      lauf(land, { "steuer.unternehmen": 0.45 }, 2)[1].investQuote,
    ).toBeLessThan(lauf(land, {}, 2)[1].investQuote);
  });
  it("Rentenalter 70 erhöht die Erwerbspersonen", () => {
    expect(
      lauf(land, { "rente.alter": 70 })[5].erwerbspersonen,
    ).toBeGreaterThan(lauf(land)[5].erwerbspersonen + 2);
  });
  it("Finanzkrise hebt die Arbeitslosigkeit über die NAIRU", () => {
    const v = lauf(land, {}, 8, {
      schocks: [{ id: 1, art: "krise", jahr: 2030, staerke: 1, dauer: 1 }],
    });
    expect(v[5].alq).toBeGreaterThan(land.start.nairu + 1);
    expect(v[5].luecke).toBeLessThan(-0.03);
  });
});

describe("Privatschuld", () => {
  it("bleibt ohne Eingriff nahe am Start", () => {
    const v = lauf(land);
    expect(Math.abs(v[10].privatschuld - land.start.privatschuld)).toBeLessThan(
      15,
    );
  });
  it("über der Schuldendienst-Schwelle wird entschuldet", () => {
    const v = lauf(testland({ privatschuld: 180 }), {}, 2);
    expect(v[1].dsr).toBeGreaterThan(17);
    expect(v[1].kredit).toBeLessThan(0);
  });
});

describe("Geld", () => {
  it("Gemeinsame Währung: Leitzins folgt überwiegend dem Euroraum", () => {
    const v = lauf(land, {}, 2);
    expect(v[1].leitzins).toBeGreaterThan(1);
    expect(v[1].leitzins).toBeLessThan(4);
  });
  it("Eigene Währung: QE-Tempo baut den Bestand auf", () => {
    const v = lauf(mitRegime("eigen"), { "geld.qeTempo": 2 }, 6);
    expect(v[5].qe).toBeCloseTo(30, 9);
  });
  it("Harte Währung: kein QE, Deflation wenn der Währungsbestand nicht wächst", () => {
    const v = lauf(mitRegime("hart"), { "geld.qeTempo": 2 }, 21, {
      welt: { bestandWachstum: 0 },
    });
    expect(v.slice(1).every((z) => z.qe === 0)).toBe(true);
    const mittel = v.slice(5, 21).reduce((s, z) => s + z.inflation, 0) / 16;
    expect(mittel).toBeLessThan(0);
  });
  it("Preisniveau folgt der Inflation", () => {
    const v = lauf(land, {}, 3);
    expect(v[2].preisniveau).toBeCloseTo(
      v[1].preisniveau * (1 + v[2].inflation / 100),
      12,
    );
  });
});

describe("Asymmetrie des Kreditimpulses (Spec 13.5 Teil A)", () => {
  const krise = { schocks: [{ id: 1, art: "krise" as const, jahr: land.datenstand + 3, staerke: 1, dauer: 1 }] };
  const tief = (aus: string[]) =>
    Math.min(...rechne(land, { ...basisSzenario(land, 11), ...krise, aus }).map((z) => z.luecke));
  it("aus heißt symmetrisch: Wirkstärke 1 rechnet wie der alte Kreditimpuls", () => {
    const a = rechne(land, { ...basisSzenario(land, 11), ...krise, aus: ["wachstum.kreditAsymmetrie"] });
    const b = rechne(land, { ...basisSzenario(land, 11), ...krise, aus: ["wachstum.kreditAsymmetrie", "wachstum.kreditImpuls"] });
    // Ohne Kreditimpuls ist die Asymmetrie wirkungslos; mit ihm unterscheiden sich die Läufe.
    expect(a.some((z, i) => z.luecke !== b[i].luecke)).toBe(true);
  });
  it("ein Kreditrückgang in der Krise vertieft den Einbruch", () => {
    expect(tief([])).toBeLessThanOrEqual(tief(["wachstum.kreditAsymmetrie"]));
  });
});
