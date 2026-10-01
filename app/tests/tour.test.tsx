import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { App } from "../App";
import { startTour, TOUR_EINSTELLUNG } from "../tour/Tour";
import type { Kapitel } from "../tour/typen";

// Hilfe-Modus: geführte Tour mit Mitmach-Schritten.
const blase = () => screen.queryByRole("dialog", { name: /^Tour: / });
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
    // Die Tour hat einen Schock und einen Weg gesetzt: Sie fragt, ob der alte Stand zurück soll.
    expect(screen.getByRole("dialog", { name: "Tour beendet" })).toBeTruthy();
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

describe("Tour: Einladung, Menü, eigener Stand", () => {
  const einladung = () => screen.queryByRole("region", { name: "Einladung zur Tour" });

  it("Einladung beim ersten Besuch; „Später“ blendet sie dauerhaft aus", () => {
    const { unmount } = render(<App />);
    expect(einladung()).not.toBeNull();
    fireEvent.click(within(einladung()!).getByRole("button", { name: "Später" }));
    expect(einladung()).toBeNull();
    unmount();
    render(<App />);
    expect(einladung()).toBeNull();
  });

  it("„Los“ startet die Tour und blendet die Einladung aus", async () => {
    render(<App />);
    fireEvent.click(within(einladung()!).getByRole("button", { name: "Los" }));
    await waitFor(() => expect(blase()).not.toBeNull());
    expect(einladung()).toBeNull();
  });

  it("keine Einladung, wenn der Link ein Szenario trägt", () => {
    window.history.replaceState(null, "", "/?s=geteilt");
    render(<App />);
    expect(einladung()).toBeNull();
  });

  it("„?“ öffnet das Kapitelmenü; ein beendetes Kapitel bekommt ein Häkchen", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Tour und Hilfe" }));
    const menue = screen.getByRole("menu", { name: "Tour und Hilfe" });
    fireEvent.click(within(menue).getByRole("menuitem", { name: /Erste Erkundung/ }));
    await waitFor(() => expect(blase()).not.toBeNull());
    for (let i = 0; i < 12 && blase(); i++) {
      const b = within(blase()!);
      fireEvent.click(b.queryByRole("button", { name: "Fertig" }) ?? b.queryByRole("button", { name: "Weiter" }) ?? b.getByRole("button", { name: "Zeig’s mir" }));
      await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
    }
    const zurueck = screen.queryByRole("button", { name: "So lassen" });
    if (zurueck) fireEvent.click(zurueck);
    fireEvent.click(screen.getByRole("button", { name: "Tour und Hilfe" }));
    expect(within(screen.getByRole("menu", { name: "Tour und Hilfe" })).getByRole("menuitem", { name: /Erste Erkundung.*erledigt/ })).toBeTruthy();
  }, 15000);

  it("Beenden nach einer Änderung: „Zurück zu deinem Stand vorher“ stellt Szenario und Jahr wieder her", async () => {
    render(<App />);
    const jahrVorher = screen.getByLabelText("Gewähltes Jahr").textContent;
    starte("erkundung");
    await waitFor(() => expect(blase()).not.toBeNull());
    for (let i = 0; i < 5; i++) {
      const b = within(blase()!);
      fireEvent.click(b.queryByRole("button", { name: "Weiter" }) ?? b.getByRole("button", { name: "Zeig’s mir" }));
      await waitFor(() => expect(within(blase()!).getByText(`${i + 2} von 10`)).toBeTruthy());
    }
    fireEvent.click(within(blase()!).getByRole("button", { name: "Zeig’s mir" }));
    await waitFor(() => expect(within(blase()!).getByText("7 von 10")).toBeTruthy());
    expect(screen.getByLabelText("Gesetzte Schocks").querySelectorAll("button").length).toBeGreaterThan(0);
    fireEvent.keyDown(window, { key: "Escape" });
    fireEvent.click(await screen.findByRole("button", { name: "Zurück zu deinem Stand vorher" }));
    await waitFor(() => expect(screen.getByLabelText("Gesetzte Schocks").querySelectorAll("button").length).toBe(0));
    expect(screen.getByLabelText("Gewähltes Jahr").textContent).toBe(jahrVorher);
  }, 15000);

  it("Beenden ohne Änderung fragt nicht", async () => {
    render(<App />);
    starte("erkundung");
    await waitFor(() => expect(blase()).not.toBeNull());
    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() => expect(blase()).toBeNull());
    expect(screen.queryByRole("button", { name: "Zurück zu deinem Stand vorher" })).toBeNull();
  });

  it("Landwechsel während der Tour beendet sie ohne Fehler", async () => {
    render(<App />);
    starte("erkundung");
    await waitFor(() => expect(blase()).not.toBeNull());
    fireEvent.change(screen.getByLabelText(/^Land/), { target: { value: "US" } });
    await waitFor(() => expect(blase()).toBeNull());
  });

  it("Smartphone: Ein Schritt in der Seitenleiste öffnet das Blatt, danach schließt es wieder", async () => {
    const original = window.matchMedia;
    window.matchMedia = ((q: string) => ({ ...original(q), matches: true })) as typeof window.matchMedia;
    try {
      render(<App />);
      starte("erkundung");
      await waitFor(() => expect(blase()).not.toBeNull());
      weiter();
      await waitFor(() => expect(within(blase()!).getByText("2 von 10")).toBeTruthy());
      await waitFor(() => expect(screen.getByRole("button", { name: "Stellschrauben einklappen" }).getAttribute("aria-expanded")).toBe("true"));
      weiter();
      await waitFor(() => expect(screen.getByRole("button", { name: "Stellschrauben zeigen" }).getAttribute("aria-expanded")).toBe("false"));
    } finally {
      window.matchMedia = original;
    }
  }, 15000);
});
