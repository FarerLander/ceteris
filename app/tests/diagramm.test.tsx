import { fireEvent, render, screen } from "@testing-library/react";
import { App } from "../App";

describe("Kennzahlen und Diagramm", () => {
  it("fünf Kacheln, Spielraum im Haushalt ist eine davon", () => {
    render(<App />);
    const kacheln = screen.getByRole("region", { name: "Kennzahlen" }).querySelectorAll("button.tile");
    expect(kacheln).toHaveLength(5);
    fireEvent.click(screen.getByRole("button", { name: /Spielraum im Haushalt ·/ }));
    expect(screen.getByRole("heading", { name: "Spielraum im Haushalt (% der Einnahmen)" })).toBeTruthy();
  });
  it("jede Kachel zeigt, dass sie das große Diagramm öffnet", () => {
    render(<App />);
    expect(screen.getAllByText("Diagramm öffnen ↓")).toHaveLength(4);
    expect(screen.getAllByText("Wird unten gezeigt")).toHaveLength(1);
  });
  it("Klick auf eine Kachel wechselt das Diagramm", () => {
    render(<App />);
    const kachel = screen.getByRole("button", { name: /Arbeitslosigkeit ·/ });
    fireEvent.click(kachel);
    expect(
      screen.getByRole("heading", { name: "Arbeitslosigkeit (%)" }),
    ).toBeTruthy();
    expect(kachel.getAttribute("aria-pressed")).toBe("true");
  });
  it("Info-Knopf klappt die vierteilige Erklärung auf", () => {
    render(<App />);
    fireEvent.click(
      screen.getByRole("button", { name: "Was bedeutet Staatsschuld?" }),
    );
    for (const t of [
      "Was es ist",
      "Warum es zählt",
      "Gut oder kritisch",
      "So rechnet das Modell",
    ])
      expect(screen.getByText(t)).toBeTruthy();
  });
  it("Spielraum im Haushalt zeigt, wofür die Einnahmen reichen", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /Spielraum im Haushalt ·/ }));
    expect(
      screen.getByRole("heading", { name: "Spielraum im Haushalt (% der Einnahmen)" }),
    ).toBeTruthy();
    expect(screen.getByText(/Von 100 Einnahmen gehen .* an Zinsen/)).toBeTruthy();
    expect(screen.getByLabelText(/Aufteilung der Staatseinnahmen/)).toBeTruthy();
  });
  it("Erwerbstätige zeigen den Anteil an der Bevölkerung", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Erwerbstätige" }));
    expect(
      screen.getByText(/Mio\. Erwerbstätige von .* Mio\. Einwohnern = \d+ %/),
    ).toBeTruthy();
  });
});
