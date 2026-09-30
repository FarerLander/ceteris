import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { App } from "../App";

const reglerInLeiste = () => document.querySelectorAll("aside input[type=range]").length;

// Bedienung auf iPad und Smartphone: Seitenleiste einklappbar, auf dem Smartphone ein Blatt von unten.
describe("Mobile Bedienung", () => {
  const original = window.matchMedia;
  afterEach(() => {
    cleanup();
    window.matchMedia = original;
  });

  it("Seitenleiste lässt sich einklappen, bleibt über das Neuladen eingeklappt und klappt wieder auf", () => {
    const { unmount } = render(<App />);
    expect(reglerInLeiste()).toBeGreaterThan(0);
    fireEvent.click(
      screen.getByRole("button", { name: "Stellschrauben einklappen" }),
    );
    expect(reglerInLeiste()).toBe(0);
    unmount();
    render(<App />);
    fireEvent.click(
      screen.getByRole("button", { name: "Stellschrauben zeigen" }),
    );
    expect(reglerInLeiste()).toBeGreaterThan(0);
  });

  it("Smartphone: Blatt mit vier Seiten, Wischen wechselt den Reiter", () => {
    window.matchMedia = ((q: string) => ({
      ...original(q),
      matches: true,
    })) as typeof window.matchMedia;
    render(<App />);
    const seiten = screen.getByRole("tablist", { name: "Stellschrauben" });
    expect(
      [...seiten.querySelectorAll("button")].map((b) => b.textContent),
    ).toEqual([
      "Grundlagen",
      "Hauptregler",
      "Alle Stellschrauben",
      "Szenarien",
    ]);
    // Kein Einklapp-Knopf der großen Ansicht, stattdessen der Griff.
    expect(
      screen
        .getByRole("button", { name: "Stellschrauben zeigen" })
        .getAttribute("aria-expanded"),
    ).toBe("false");

    const main = document.querySelector("main")!;
    act(() => {
      fireEvent.touchStart(main, { touches: [{ clientX: 300, clientY: 200 }] });
      fireEvent.touchEnd(main, {
        changedTouches: [{ clientX: 100, clientY: 210 }],
      });
    });
    expect((screen.getByRole("combobox", { name: "Ansichten" }) as HTMLSelectElement).value).toBe("vergleich");
  });

  it("Smartphone: eine Leiste statt Pillen, Abschnitt-Chips, Hinweis einmal, Zeitraum bis 2050", () => {
    window.matchMedia = ((q: string) => ({ ...original(q), matches: true })) as typeof window.matchMedia;
    const { unmount } = render(<App />);
    // Keine Pillen und keine Reiter oben; Farbmodus und Sprache stehen im Blatt.
    expect(document.querySelector(".topline")).toBeNull();
    expect(document.querySelector(".reiter")).toBeNull();
    expect(document.querySelector(".side .farbmodus")).not.toBeNull();
    expect(document.querySelector(".side .sprache")).not.toBeNull();
    expect(document.querySelector(".griff-stand")?.textContent).toBe("Basislinie");
    const chips = screen.getByRole("navigation", { name: "Abschnitte" });
    expect([...chips.querySelectorAll("button")].map((b) => b.textContent)).toEqual(["Lage", "Kennzahlen", "Diagramm", "Warnlampen", "Erzählung", "Wege"]);
    for (const id of ["lage", "zahlen", "diagramm", "warnlampen", "erzaehlung", "wege"]) expect(document.getElementById(`abschnitt-${id}`), id).not.toBeNull();
    expect((document.getElementById("horizont-26") as HTMLInputElement).checked).toBe(true);
    // Hinweis beim ersten Besuch, nach dem Schließen nicht mehr.
    expect(screen.getByText(/Erkundungsmodell/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Schließen" }));
    unmount();
    render(<App />);
    expect(screen.queryByText(/Erkundungsmodell/)).toBeNull();
  });

  it("Großer Bildschirm: Zeitraum bleibt bis 2075", () => {
    render(<App />);
    expect((document.getElementById("horizont-51") as HTMLInputElement).checked).toBe(true);
  });
});
