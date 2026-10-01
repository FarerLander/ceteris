import { LAENDER } from "../../app/land";
import { MASSE, masse, type MassId } from "../auswertung";
import { standardWert } from "../kontext";
import { anwenden, bewertePakete, PAKETE } from "../pakete";
import { basisSzenario, rechne } from "../rechne";
import { testland } from "./testland";

// Spec 13.13: Jedes Paket zeigt dieselben fünf Maße; die Reihung ist wählbar.
const land = testland();
const sz = basisSzenario(land, 51);
const basis = rechne(land, sz);

describe("masse", () => {
  const v = rechne(land, { ...sz, stell: { "rente.alter": 70 } });
  it("fünf endliche Werte; Wohlstand und CO₂ in Prozent, die übrigen als Differenz", () => {
    const m = masse(v, basis, 50);
    expect(Object.keys(m).sort()).toEqual(["armut", "co2", "gini", "schuld", "wohlstand"]);
    for (const x of Object.values(m)) expect(Number.isFinite(x)).toBe(true);
    expect(m.wohlstand).toBe((v[50].bipProKopf / basis[50].bipProKopf - 1) * 100);
    expect(m.wohlstand).toBeGreaterThan(0);
    expect(m.co2).toBe((v[50].co2Mt / basis[50].co2Mt - 1) * 100);
    expect(m.gini).toBe(v[50].gini - basis[50].gini);
    expect(m.armut).toBe(v[50].armut - basis[50].armut);
    expect(m.schuld).toBe(v[50].schuldQuote - basis[50].schuldQuote);
  });
  it("ein Verlauf gegen sich selbst ergibt überall 0", () => {
    expect(masse(v, v, 50)).toEqual({ wohlstand: 0, gini: 0, armut: 0, schuld: 0, co2: 0 });
  });
  it("MASSE nennt die fünf in fester Reihenfolge; nur beim Wohlstand steht mehr vorn", () => {
    expect(MASSE.map((m) => m.id)).toEqual(["wohlstand", "gini", "armut", "schuld", "co2"]);
    expect(MASSE.map((m) => m.name)).toEqual(["Ökonomischer Wohlstand pro Kopf", "Ungleichheit (Gini)", "Armut", "Staatsschuld", "CO₂-Ausstoß"]);
    expect(MASSE.filter((m) => m.mehrIstVorn).map((m) => m.id)).toEqual(["wohlstand"]);
  });
});

describe("bewertePakete: Reihung", () => {
  // Nur Pakete mit Zuwachs über 0,05 %, nach Zuwachs gereiht. Stand nach 13.13 Phase 2: Die Basisläufe
  // rechnen mit den neuen Eingriffen der Regierung, dadurch ändert sich, was ein Paket noch bringt.
  // Vor 13.13 (main, 30.09.2026): DE gruendungen, fachkraefte, energie; IT gruendungen, energie, familie.
  // Nach der Prüfung (K1: neuer Punkt je Legislatur bei anhaltender Enge) tauschen in Italien die ersten zwei.
  // M29 (Haushaltsplan bis 2031): vorher US gruendungen, arbeit, energie; IT fachkraefte, gruendungen, energie.
  // Gleitender Investitionsanker: vorher DE gruendungen, arbeit, fachkraefte; US gruendungen, energie, fachkraefte.
  it.each([
    ["DE", ["gruendungen", "fachkraefte", "arbeit"]],
    ["US", ["gruendungen", "arbeit", "energie"]],
    ["IT", ["gruendungen", "fachkraefte", "arbeit"]],
  ])("ohne Maß wie bisher: %s", (code, ids) => {
    const l = LAENDER[code];
    const s = basisSzenario(l);
    const liste = bewertePakete(l, s, rechne(l, s));
    expect(liste.map((b) => b.paket.id)).toEqual(ids);
    for (const b of liste) {
      expect(b.masse.wohlstand).toBe(b.zuwachs);
      expect(b.masse.schuld).toBe(b.schuld);
    }
  });
  it.each(["gini", "armut", "schuld", "co2"] as MassId[])("nach %s: aufsteigend, die drei kleinsten aller Pakete, die etwas ändern", (nach) => {
    const liste = bewertePakete(land, sz, basis, nach);
    expect(liste).toHaveLength(3);
    const werte = liste.map((b) => b.masse[nach]);
    expect(werte).toEqual([...werte].sort((a, b) => a - b));
    // Von Hand: jedes Paket einzeln rechnen.
    const w = (id: string) => standardWert(id, land);
    const alle = PAKETE.map((p) => masse(rechne(land, anwenden(sz, p.setze(w, w, sz.grund))), basis, 50)[nach]).sort((a, b) => a - b);
    expect(werte[0]).toBe(alle[0]);
  });
  it("nach wohlstand: absteigend, auch Pakete ohne spürbaren Zuwachs", () => {
    const liste = bewertePakete(land, sz, basis, "wohlstand");
    const werte = liste.map((b) => b.masse.wohlstand);
    expect(werte).toEqual([...werte].sort((a, b) => b - a));
    // Alle Hebel schon gedreht: ohne Maß bleibt die Liste leer, mit Maß nicht zwingend.
    const alleIds = bewertePakete(land, sz, basis).map((b) => b.paket.id);
    expect(liste.slice(0, alleIds.length).map((b) => b.paket.id)).toEqual(alleIds);
  });
});
