import { fireEvent, render, screen, within } from "@testing-library/react";
import { App } from "../App";
import { oeffne, ansicht } from "./ansicht";

describe("Wirkungsnetz", () => {
  it("Reiter zeigt die Landkarte, Klick auf einen Baustein seine Stellschrauben", () => {
    render(<App />);
    const reiter = [...(screen.getByRole("combobox", { name: "Ansichten" }) as HTMLSelectElement).options].map((o) => o.text);
    expect(reiter).toEqual([
      "Übersicht",
      "Vergleich",
      "Wirkungsnetz",
      "Rückblick",
      "Annahmen",
    ]);
    oeffne("Wirkungsnetz");
    expect(
      screen.getByRole("heading", { name: "Landkarte der Bausteine" }),
    ).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: "Baustein Staat, Steuern, Rente" }),
    );
    const detail = screen.getByLabelText("Baustein im Detail");
    expect(
      within(detail).getByRole("button", { name: "Rentenalter" }),
    ).toBeTruthy();
    fireEvent.click(
      within(detail).getByRole("button", { name: "Rentenalter" }),
    );
    expect(
      screen.getByText(/^Rentenalter .* → .*: nach 10 Jahren/),
    ).toBeTruthy();
    expect(window.location.hash).toBe("#wirkungsnetz:rente.alter");
  });

  it("Link am Regler öffnet den Weg dieser Stellschraube", () => {
    render(<App />);
    fireEvent.click(
      screen.getByRole("button", { name: "Wirkung von Rentenalter zeigen" }),
    );
    expect(ansicht()).toBe("Wirkungsnetz");
    expect(
      (screen.getByLabelText("Stellschraube") as HTMLSelectElement).value,
    ).toBe("rente.alter");
    expect(screen.getByText(/^Rentenalter .* → /)).toBeTruthy();
  });

  it("Fokus aus dem Anker; unbekannter Fokus öffnet ohne Weg", () => {
    window.history.replaceState(null, "", "/#wirkungsnetz:rente.alter");
    const { unmount } = render(<App />);
    expect(
      (screen.getByLabelText("Stellschraube") as HTMLSelectElement).value,
    ).toBe("rente.alter");
    unmount();
    window.history.replaceState(null, "", "/#wirkungsnetz:gibtsnicht");
    render(<App />);
    expect(
      screen.getByRole("heading", { name: "Landkarte der Bausteine" }),
    ).toBeTruthy();
    expect(
      (screen.getByLabelText("Stellschraube") as HTMLSelectElement).value,
    ).toBe("");
  });
});

describe("Wirkungsnetz: lange Namen", () => {
  it("Bausteinnamen stehen zweizeilig im Kasten, Stellschrauben im Weg ebenso", () => {
    window.history.replaceState(null, "", "/#wirkungsnetz:innov.exitSteuer");
    render(<App />);
    const demo = screen.getByRole("button", { name: "Baustein Demografie und Migration" });
    expect([...demo.querySelectorAll("tspan")].map((t) => t.textContent)).toEqual(["Demografie und", "Migration"]);
    const stell = document.querySelector(".netz-knoten.stell")!;
    expect(stell.querySelectorAll("tspan").length).toBeGreaterThan(1);
  });
});
