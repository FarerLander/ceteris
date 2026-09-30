import { fireEvent, render, screen } from "@testing-library/react";
import { App } from "../App";
import { ladeFarbmodus, wendeFarbmodusAn } from "../farbmodus";

afterEach(() => document.documentElement.removeAttribute("data-theme"));

describe("Farbmodus", () => {
  it("Knopf schaltet System → Hell → Dunkel → System und merkt sich die Wahl", () => {
    render(<App />);
    const knopf = () => screen.getByRole("button", { name: /^Farbmodus:/ });
    expect(knopf().getAttribute("aria-label")).toBe("Farbmodus: wie System. Wechseln zu Hell");
    fireEvent.click(knopf());
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(window.localStorage.getItem("wirtschaftssimulator.farbmodus")).toBe("hell");
    fireEvent.click(knopf());
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    fireEvent.click(knopf());
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
    expect(window.localStorage.getItem("wirtschaftssimulator.farbmodus")).toBe("system");
  });

  it("gespeicherte Wahl gilt beim Start; Unsinn im Speicher heißt System", () => {
    window.localStorage.setItem("wirtschaftssimulator.farbmodus", "dunkel");
    wendeFarbmodusAn(ladeFarbmodus());
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    window.localStorage.setItem("wirtschaftssimulator.farbmodus", "lila");
    expect(ladeFarbmodus()).toBe("system");
  });
});
