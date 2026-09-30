import { fireEvent, render, screen } from "@testing-library/react";
import { App } from "../App";
import { DE } from "../land";

describe("App", () => {
  it("zeigt Titel, Dauerhinweis und Hauptregler", () => {
    render(<App />);
    expect(
      screen.getByRole("heading", { name: "Ceteris" }),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "Erkundungsmodell. Zusammenhänge aus Lehrbuch, Studien und historischen Daten. Keine Prognose.",
      ),
    ).toBeTruthy();
    for (const name of [
      "Nettozuwanderung",
      "CO₂-Preis",
      "Forschung und Entwicklung",
      "Kapitalertragsteuer",
      "Rentenalter",
      "Übrige Staatsausgaben",
    ]) {
      expect(screen.getAllByLabelText(name).length).toBeGreaterThan(0);
    }
  });
  it("ein Regler ändert Anzeige und Änderungszähler, Basislinie setzt zurück", () => {
    render(<App />);
    const regler = screen.getAllByLabelText("Rentenalter")[0];
    fireEvent.change(regler, { target: { value: "69" } });
    expect(screen.getByText("69 Jahre")).toBeTruthy();
    expect(screen.getByText("1 Änderung")).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: "Zurück zur Basislinie" }),
    );
    expect(screen.getByText("Basislinie", { selector: ".griff-stand" })).toBeTruthy();
  });
  it("Horizont 2050 verkürzt die Rechnung", () => {
    render(<App />);
    const ziel = String(DE.datenstand + 25);
    fireEvent.click(screen.getByLabelText(ziel));
    expect(screen.getByLabelText(ziel)).toHaveProperty("checked", true);
  });
  it("Update 4a: gelenkte Währung wählbar, Block Wirtschaftsordnung vorhanden", () => {
    render(<App />);
    expect(screen.getByLabelText("Gelenkte Währung")).toBeTruthy();
    expect(screen.getAllByText("Wirtschaftsordnung").length).toBeGreaterThan(0);
  });
});
