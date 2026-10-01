import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { App } from "../App";
import { startTour, TOUR_EINSTELLUNG } from "../tour/Tour";
import type { Kapitel } from "../tour/typen";

// Hilfe-Modus: geführte Tour mit Mitmach-Schritten.
const blase = () => screen.queryByRole("dialog", { name: /Tour/ });
const starte = (k: Parameters<typeof startTour>[0]) => act(() => startTour(k));
const weiter = () => fireEvent.click(within(blase()!).getByRole("button", { name: "Weiter" }));

beforeEach(() => {
  TOUR_EINSTELLUNG.pause = 0;
});

describe("Tour: Erste Erkundung", () => {
  it("beginnt mit der Begrüßung und zählt die Schritte", async () => {
    render(<App />);
    starte("erkundung");
    await waitFor(() => expect(blase()).not.toBeNull());
    expect(within(blase()!).getByText(/Willkommen bei Ceteris/)).toBeTruthy();
    expect(within(blase()!).getByText("1 von 10")).toBeTruthy();
  });

  it("Mitmach-Schritt: Ein anderes Jahr im Wetterband schaltet weiter", async () => {
    render(<App />);
    starte("erkundung");
    await waitFor(() => expect(blase()).not.toBeNull());
    weiter();
    weiter();
    await waitFor(() => expect(within(blase()!).getByText("3 von 10")).toBeTruthy());
    expect(within(blase()!).getByRole("button", { name: "Zeig’s mir" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /^2050:/ }));
    await waitFor(() => expect(within(blase()!).getByText("4 von 10")).toBeTruthy());
  }, 15000);

  it("„Zeig’s mir“ setzt die Finanzkrise und geht weiter", async () => {
    render(<App />);
    starte("erkundung");
    await waitFor(() => expect(blase()).not.toBeNull());
    for (let i = 0; i < 5; i++) {
      const b = within(blase()!);
      fireEvent.click(b.queryByRole("button", { name: "Weiter" }) ?? b.getByRole("button", { name: "Zeig’s mir" }));
      await waitFor(() => expect(within(blase()!).getByText(`${i + 2} von 10`)).toBeTruthy());
    }
    const liste = screen.getByLabelText("Gesetzte Schocks");
    const vorher = liste.querySelectorAll("button").length;
    fireEvent.click(within(blase()!).getByRole("button", { name: "Zeig’s mir" }));
    await waitFor(() => expect(within(blase()!).getByText("7 von 10")).toBeTruthy());
    expect(liste.querySelectorAll("button").length).toBeGreaterThan(vorher);
  }, 15000);

  it("läuft mit Weiter und „Zeig’s mir“ bis zum Ende", async () => {
    render(<App />);
    starte("erkundung");
    await waitFor(() => expect(blase()).not.toBeNull());
    for (let i = 0; i < 12 && blase(); i++) {
      const b = within(blase()!);
      const knopf = b.queryByRole("button", { name: "Fertig" }) ?? b.queryByRole("button", { name: "Weiter" }) ?? b.getByRole("button", { name: "Zeig’s mir" });
      fireEvent.click(knopf);
      await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
    }
    await waitFor(() => expect(blase()).toBeNull());
  }, 15000);

  it("Esc beendet die Tour", async () => {
    render(<App />);
    starte("erkundung");
    await waitFor(() => expect(blase()).not.toBeNull());
    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() => expect(blase()).toBeNull());
  });

  it("ein Schritt ohne Ziel auf der Seite wird übersprungen", async () => {
    const k: Kapitel = { id: "erkundung", titel: "Test", schritte: [
      { id: "a", ziel: null, text: "Erster Schritt" },
      { id: "b", ziel: "gibt-es-nicht", text: "Unsichtbar" },
      { id: "c", ziel: "lage", text: "Dritter Schritt" },
    ] };
    render(<App />);
    starte(k);
    await waitFor(() => expect(blase()).not.toBeNull());
    weiter();
    await waitFor(() => expect(within(blase()!).getByText("Dritter Schritt")).toBeTruthy());
    expect(screen.queryByText("Unsichtbar")).toBeNull();
  });
});
