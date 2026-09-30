import { DE } from "../../app/land";
import { anwenden, merke, nimmZurueck } from "../pakete";
import { basisSzenario } from "../rechne";

const leer = basisSzenario(DE, 11);
const A = { stell: { "rente.alter": 69, "mig.netto": 450 } };
const B = { stell: { "innov.fue": 4.5, "rente.alter": 70 }, grund: { rentensystem: "mischung" as const } };

function beide() {
  const u1 = merke(1, "A", leer, A);
  const s1 = anwenden(leer, A);
  const u2 = merke(2, "B", s1, B);
  const s2 = anwenden(s1, B);
  return { sz: s2, liste: [u1, u2] };
}

describe("Pakete einzeln zurücknehmen", () => {
  it("das erste von zwei Paketen zurücknehmen: nur seine Hebel springen zurück", () => {
    const { sz, liste } = beide();
    const r = nimmZurueck(sz, liste, 1);
    expect(r.sz.stell["mig.netto"]).toBeUndefined();
    expect(r.sz.stell["innov.fue"]).toBe(4.5);
    expect(r.sz.grund.rentensystem).toBe("mischung");
    expect(r.liste.map((u) => u.nr)).toEqual([2]);
  });
  it("gemeinsamer Hebel: der Wert des späteren Pakets bleibt, und es erbt den Ausgangswert", () => {
    const { sz, liste } = beide();
    const r = nimmZurueck(sz, liste, 1);
    expect(r.sz.stell["rente.alter"]).toBe(70);
    const r2 = nimmZurueck(r.sz, r.liste, 2);
    expect(r2.sz.stell["rente.alter"]).toBeUndefined();
    expect(r2.sz.grund.rentensystem).toBe(leer.grund.rentensystem);
    expect(r2.sz).toEqual(leer);
  });
  it("beide in beliebiger Reihenfolge zurück ergibt die Basislinie", () => {
    const { sz, liste } = beide();
    const r = nimmZurueck(sz, liste, 2);
    expect(r.sz.stell["rente.alter"]).toBe(69);
    expect(nimmZurueck(r.sz, r.liste, 1).sz).toEqual(leer);
  });
  it("von Hand verstellter Hebel bleibt beim Zurücknehmen stehen", () => {
    const { sz, liste } = beide();
    const hand = { ...sz, stell: { ...sz.stell, "mig.netto": 800 } };
    const r = nimmZurueck(hand, liste, 1);
    expect(r.sz.stell["mig.netto"]).toBe(800);
  });
  it("unbekannte Nummer ändert nichts", () => {
    const { sz, liste } = beide();
    expect(nimmZurueck(sz, liste, 99)).toEqual({ sz, liste });
  });
});
