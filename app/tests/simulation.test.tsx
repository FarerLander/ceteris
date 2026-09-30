import { act, renderHook } from "@testing-library/react";
import { DE } from "../land";
import { useSimulation } from "../simulation";

const A = { stell: { "rente.alter": 69, "rente.niveau": 47 } };
const B = { stell: { "energie.ausbauTempo": 4.2 } };
const warte = (ms: number) => act(() => new Promise((r) => setTimeout(r, ms)));

describe("Simulation: Schlussprüfung Phase 2", () => {
  afterEach(() => vi.restoreAllMocks());
  it("C2: Adresszeile wird gedrosselt geschrieben, ein Browser-Fehler bricht nichts", async () => {
    const { result } = renderHook(() => useSimulation(DE));
    act(() => result.current.setzeStell("rente.alter", 69));
    expect(window.location.search).toBe("");
    await warte(350);
    expect(window.location.search).toMatch(/^\?s=/);
    vi.spyOn(window.history, "replaceState").mockImplementation(() => { throw new DOMException("zu oft", "SecurityError"); });
    act(() => result.current.setzeStell("rente.alter", 70));
    await warte(350);
    expect(result.current.wert("rente.alter")).toBe(70);
  });
  it("I1: zweites Paket während des Gleitens lässt das erste vollständig stehen", async () => {
    const { result } = renderHook(() => useSimulation(DE));
    act(() => result.current.uebernehme(A, "A"));
    act(() => result.current.uebernehme(B, "B"));
    await warte(600);
    expect(result.current.wert("rente.alter")).toBe(69);
    expect(result.current.wert("rente.niveau")).toBe(47);
    expect(result.current.wert("energie.ausbauTempo")).toBe(4.2);
    act(() => result.current.nimmZurueck(result.current.uebernommen[1].nr));
    expect(result.current.wert("rente.alter")).toBe(69);
    expect(result.current.wert("energie.ausbauTempo")).not.toBe(4.2);
  });
  it("erstes von zwei Paketen einzeln zurücknehmen, auch während das zweite gleitet", async () => {
    const { result } = renderHook(() => useSimulation(DE));
    act(() => result.current.uebernehme(A, "A"));
    await warte(600);
    act(() => result.current.uebernehme(B, "B"));
    act(() => result.current.nimmZurueck(result.current.uebernommen[0].nr));
    await warte(600);
    expect(result.current.wert("rente.alter")).not.toBe(69);
    expect(result.current.wert("energie.ausbauTempo")).toBe(4.2);
    expect(result.current.uebernommen.map((u) => u.titel)).toEqual(["B"]);
  });
  it("I3 / Grenzfall: Annahme abschalten während des Gleitens — beides bleibt", async () => {
    const { result } = renderHook(() => useSimulation(DE));
    act(() => result.current.uebernehme(A, "A"));
    act(() => result.current.setzeAus("wachstum.multiplikator", true));
    await warte(600);
    expect(result.current.sz.aus).toContain("wachstum.multiplikator");
    expect(result.current.wert("rente.alter")).toBe(69);
  });
});
