import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { App } from "../App";

const HINWEIS = /erst an wenigen historischen Fällen geprüft/;

describe("Update 2 in der Oberfläche", () => {
  it("neun Länder wählbar, keines mehr gesperrt (Update 4b)", () => {
    render(<App />);
    const auswahl = screen.getByLabelText(/^Land/) as HTMLSelectElement;
    expect([...auswahl.options].map((o) => o.value)).toEqual(["DE", "US", "JP", "GB", "FR", "IT", "CA", "CN", "RU"]);
    expect([...auswahl.options].some((o) => o.disabled)).toBe(false);
  });

  it("Update 4b: China per Link, gelenkte Währung, Hinweis; Wechsel weg lässt ihn verschwinden", () => {
    window.history.replaceState(null, "", "/?l=CN");
    render(<App />);
    expect(screen.getByText("China", { selector: "#land option:checked" })).toBeTruthy();
    expect(screen.getByText("Gelenkte Währung", { selector: "input[name=regime]:checked + label" })).toBeTruthy();
    expect(screen.getByText(/Finanzierungsvehikel/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/^Land/), { target: { value: "RU" } });
    expect(screen.getByText("Russland", { selector: "#land option:checked" })).toBeTruthy();
    expect(screen.queryByText(/Finanzierungsvehikel/)).toBeNull();
    fireEvent.change(screen.getByLabelText(/^Land/), { target: { value: "DE" } });
    expect(screen.queryByText(/Kriegswirtschaft/)).toBeNull();
    window.history.replaceState(null, "", "/");
  });

  it("Italien zeigt den Hinweis, der Wechsel weg lässt ihn verschwinden", () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText(/^Land/), {
      target: { value: "IT" },
    });
    expect(screen.getByText("Italien", { selector: "#land option:checked" })).toBeTruthy();
    expect(
      screen.getByText("Gemeinsame Währung", { selector: "input[name=regime]:checked + label" }),
    ).toBeTruthy();
    expect(screen.getByText(HINWEIS)).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/^Land/), {
      target: { value: "GB" },
    });
    expect(screen.getByText("Vereinigtes Königreich", { selector: "#land option:checked" })).toBeTruthy();
    expect(screen.queryByText(HINWEIS)).toBeNull();
  });

  it("Link mit neuem Land lädt es, unbekannter Code fällt auf Deutschland", () => {
    window.history.replaceState(null, "", "/?l=GB");
    render(<App />);
    expect(
      screen.getByText("Vereinigtes Königreich", { selector: "#land option:checked" }),
    ).toBeTruthy();
    expect(
      screen.getByText("Eigene Währung", { selector: "input[name=regime]:checked + label" }),
    ).toBeTruthy();
    cleanup();
    window.history.replaceState(null, "", "/?l=XX");
    render(<App />);
    expect(screen.getByText("Deutschland", { selector: "#land option:checked" })).toBeTruthy();
  });

  it("Annahmen nennen den Hinweis bei Italien", () => {
    window.history.replaceState(null, "", "/?l=IT#annahmen");
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Datenlage" }));
    expect(screen.getAllByText(HINWEIS).length).toBeGreaterThanOrEqual(2);
  });
});

describe("Reservefonds in den Annahmen", () => {
  it("Kanada nennt seinen Rentenreservefonds, Deutschland keinen", () => {
    window.history.replaceState(null, "", "/?l=CA#annahmen");
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Datenlage" }));
    expect(screen.getByText(/Rentenreservefonds im Startjahr: 23 % BIP/)).toBeTruthy();
    cleanup();
    window.history.replaceState(null, "", "/#annahmen");
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Datenlage" }));
    expect(screen.queryByText(/Rentenreservefonds/)).toBeNull();
  });
});
