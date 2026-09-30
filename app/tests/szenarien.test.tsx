import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { App } from "../App";

const rentenalter = () => screen.getAllByLabelText("Rentenalter")[0];

describe("Szenarien", () => {
  it("Änderungen stehen im Link und überleben ein Neuladen", async () => {
    render(<App />);
    fireEvent.change(rentenalter(), { target: { value: "69" } });
    await waitFor(() => expect(window.location.search).toMatch(/^\?s=/));
    cleanup();
    render(<App />);
    expect(screen.getByText("69 Jahre")).toBeTruthy();
  });
  it("Basislinie hat keinen Link-Parameter", async () => {
    render(<App />);
    fireEvent.change(rentenalter(), { target: { value: "69" } });
    fireEvent.click(
      screen.getByRole("button", { name: "Zurück zur Basislinie" }),
    );
    await new Promise((r) => setTimeout(r, 350));
    expect(window.location.search).toBe("");
  });
  it("Speichern und Laden", () => {
    render(<App />);
    fireEvent.change(rentenalter(), { target: { value: "69" } });
    fireEvent.change(screen.getByLabelText("Name des Szenarios"), {
      target: { value: "Rente 69" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Speichern" }));
    expect(screen.getByText("„Rente 69“ gespeichert.")).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: "Zurück zur Basislinie" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Rente 69" }));
    expect(screen.getByText("69 Jahre")).toBeTruthy();
  });
  it("Grenzfall: kaputter Link lädt die Basislinie", () => {
    window.history.replaceState(null, "", "/?s=kaputt");
    render(<App />);
    expect(screen.getByText("Basislinie", { selector: ".griff-stand" })).toBeTruthy();
  });
});
