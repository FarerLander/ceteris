import { fireEvent, render, screen } from "@testing-library/react";
import { App } from "../App";
import { oeffne, ansicht } from "./ansicht";
import { basisSzenario } from "../../modell/rechne";
import { kodiere } from "../../modell/szenario-code";
import { DE } from "../land";

describe("Vergleich", () => {
  it("Reiter wechselt die Ansicht, Tabelle zeigt Jahre und Reihen", () => {
    render(<App />);
    oeffne("Vergleich");
    expect(ansicht()).toBe("Vergleich");
    expect(
      screen.getByRole("columnheader", { name: String(DE.datenstand + 10) }),
    ).toBeTruthy();
    expect(
      screen.getByRole("rowheader", { name: /Wohlstand pro Kopf/ }),
    ).toBeTruthy();
  });
  it("zeigt Unterschiede, sobald sich das Szenario ändert", () => {
    render(<App />);
    fireEvent.change(screen.getAllByLabelText("Rentenalter")[0], {
      target: { value: "69" },
    });
    oeffne("Vergleich");
    expect(
      document.querySelectorAll(".vergleich .delta.good, .vergleich .delta.bad")
        .length,
    ).toBeGreaterThan(0);
  });
  it("Update 4a: Zeilen der Ordnung erscheinen, wenn nur der Vergleichspartner sie braucht", () => {
    const code = kodiere({ ...basisSzenario(DE, 51), stell: { "ordnung.preiskontrollen": 30 } });
    window.localStorage.setItem(
      "wirtschaftssimulator.szenarien",
      JSON.stringify([{ name: "Kontrollen", code, zeit: "2026-09-29", land: "DE" }]),
    );
    render(<App />);
    oeffne("Vergleich");
    expect(screen.queryByRole("rowheader", { name: /Knappheit/ })).toBeNull();
    fireEvent.change(screen.getByLabelText("Vergleichen mit"), { target: { value: "Kontrollen" } });
    expect(screen.getByRole("rowheader", { name: /Knappheit/ })).toBeTruthy();
    window.localStorage.clear();
  });
});
