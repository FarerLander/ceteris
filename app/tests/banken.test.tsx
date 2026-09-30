import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { App } from "../App";
import { LAENDER } from "../land";
import { basisSzenario, rechne } from "../../modell/rechne";

// Spec 13.6: Häuser und Banken in der Oberfläche. Standard aus; zuschaltbar.
describe("13.6 Häuser und Banken in der Oberfläche", () => {
  afterEach(() => {
    cleanup();
    window.history.replaceState(null, "", "/");
  });

  it("Gruppe sichtbar, Standard aus: keine Bank-Diagramme, keine Marke", () => {
    render(<App />);
    expect(screen.getByText("Häuser und Banken", { selector: "summary" })).toBeTruthy();
    expect((screen.getByLabelText("Aus") as HTMLInputElement).checked).toBe(true);
    expect(screen.queryByRole("button", { name: /Banken brauchen Hilfe/ })).toBeNull();
    expect(screen.queryByText("Hauspreise (real)")).toBeNull();
    expect(screen.getByText(/Im Standard aus/)).toBeTruthy();
  });

  it("an: Diagramme für Hauspreis, Lücke, Eigenkapital und faule Kredite erscheinen", () => {
    render(<App />);
    fireEvent.click(screen.getByLabelText("An"));
    for (const name of ["Hauspreise (real)", "Hauspreis-Lücke", "Eigenkapital der Banken", "Faule Kredite"])
      expect(screen.getAllByText(name).length, name).toBeGreaterThan(0);
    // Stellschraube und Rettungsart gehören zur Gruppe.
    expect(screen.getAllByLabelText("Eigenkapital der Banken").length).toBeGreaterThan(0);
    expect(screen.getByLabelText("Zögernd")).toBeTruthy();
  });

  it("Rettung im Verlauf: Marke im Wetterband und Satz in der Erzählung", () => {
    // Kanada: Der Hauspreis liegt im Startjahr weit über dem langjährigen Verhältnis zum Einkommen.
    const ca = LAENDER.CA;
    const v = rechne(ca, { ...basisSzenario(ca), grund: { ...ca.grund, banken: "an" } });
    const erste = v.find((z) => z.rettung > 0)!;
    expect(erste).toBeDefined();
    window.history.replaceState(null, "", "/?l=CA");
    render(<App />);
    fireEvent.click(screen.getByLabelText("An"));
    const marken = screen.getAllByRole("button", { name: /Banken brauchen Hilfe, der Staat zahlt/ });
    expect(marken[0].getAttribute("aria-label")).toContain(String(erste.jahr));
    fireEvent.click(marken[0]);
    expect(screen.getByLabelText("Gewähltes Jahr").textContent).toBe(String(erste.jahr));
    expect(screen.getByText(/Bankenrettung:/)).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Aus"));
    expect(screen.queryAllByRole("button", { name: /Banken brauchen Hilfe/ })).toHaveLength(0);
  });
});
