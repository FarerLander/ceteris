import { render, screen } from "@testing-library/react";
import { App } from "../App";
import { LAND_EINSTELLUNG, landAusLink, landImLink } from "../land";

describe("Startland", () => {
  let vorher: string;
  beforeEach(() => {
    vorher = LAND_EINSTELLUNG.standard;
    LAND_EINSTELLUNG.standard = "US"; // wie in der veröffentlichten App
  });
  afterEach(() => {
    LAND_EINSTELLUNG.standard = vorher;
  });

  it("ohne Link starten die USA", () => {
    window.history.replaceState(null, "", "/");
    expect(landAusLink()).toBe("US");
    render(<App />);
    expect((document.getElementById("land") as HTMLSelectElement).value).toBe("US");
  });
  it("ein Land im Link gewinnt", () => {
    window.history.replaceState(null, "", "/?l=FR");
    expect(landAusLink()).toBe("FR");
  });
  it("alte Links mit Szenario und ohne Land öffnen Deutschland", () => {
    window.history.replaceState(null, "", "/?s=abc");
    expect(landAusLink()).toBe("DE");
  });
  it("Links: Startland ohne Szenario ohne Land, sonst immer mit Land", () => {
    expect(landImLink("US", false)).toBe("");
    expect(landImLink("US", true)).toBe("l=US");
    expect(landImLink("DE", false)).toBe("l=DE");
    expect(landImLink("DE", true)).toBe("l=DE");
  });
});
