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
    // Die Tour wartet bis zu einer Sekunde auf ein verzögert gezeichnetes Ziel, dann überspringt sie.
    // Während sie sucht, steht der Text des unsichtbaren Schritts nicht da.
    await new Promise((r) => setTimeout(r, 300));
    expect(screen.queryByText("Unsichtbar")).toBeNull();
    await waitFor(() => expect(within(blase()!).getByText("Dritter Schritt")).toBeTruthy(), { timeout: 3000 });
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

describe("Tour: weitere Kapitel", () => {
  // Läuft ein Kapitel mit Weiter und „Zeig’s mir“ durch; gibt die gezeigten Schrittzahlen zurück.
  async function durch(): Promise<string[]> {
    await waitFor(() => expect(blase()).not.toBeNull());
    const gesehen: string[] = [];
    for (let i = 0; i < 12 && blase(); i++) {
      const b = within(blase()!);
      gesehen.push(b.getByText(/^\d+ von \d+$/).textContent!);
      fireEvent.click(b.queryByRole("button", { name: "Fertig" }) ?? b.queryByRole("button", { name: "Weiter" }) ?? b.getByRole("button", { name: "Zeig’s mir" }));
      await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
    }
    await waitFor(() => expect(blase()).toBeNull());
    return gesehen;
  }

  it.each(["DE", "US"])("%s: Wirkungsnetz läuft durch; „Zeig’s mir“ wählt das Rentenalter", async (land) => {
    window.history.replaceState(null, "", land === "DE" ? "/" : `/?l=${land}`);
    render(<App />);
    starte("wirkungsnetz");
    await waitFor(() => expect(screen.getByRole("region", { name: "Landkarte der Bausteine" })).toBeTruthy());
    await durch();
    expect(window.location.hash).toContain(":rente.alter");
  }, 15000);

  it.each(["DE", "US"])("%s: Selbst einstellen läuft durch und erhöht das Rentenalter", async (land) => {
    window.history.replaceState(null, "", land === "DE" ? "/" : `/?l=${land}`);
    render(<App />);
    starte("einstellen");
    const gesehen = await durch();
    expect(screen.getByRole("dialog", { name: "Tour beendet" })).toBeTruthy();
    // Mit reagierender Politik hat Deutschland Entscheidungspunkte: Der §-Schritt kommt vor.
    if (land === "DE") expect(gesehen).toContain("4 von 6");
  }, 15000);

  it("Selbst einstellen: Ohne Entscheidungen der Regierung (Politik fest) entfällt der §-Schritt", async () => {
    render(<App />);
    fireEvent.click(screen.getByLabelText("Fest"));
    starte("einstellen");
    const gesehen = await durch();
    expect(gesehen).not.toContain("4 von 6");
  }, 15000);

  it("Erste Erkundung nach dem Wirkungsnetz: holt die Übersicht zurück und zeigt alle zehn Schritte", async () => {
    render(<App />);
    starte("wirkungsnetz");
    await durch();
    // Die Ansicht steht jetzt noch im Wirkungsnetz.
    expect(document.querySelector('[data-tour="lage"]')).toBeNull();
    starte("erkundung");
    // Nach dem Reiterwechsel fehlt die Sprechblase kurz, bis das Ziel gezeichnet ist: auf jede warten.
    const gesehen: string[] = [];
    while (!gesehen.includes("10 von 10")) {
      await waitFor(() => expect(blase()).not.toBeNull());
      const b = within(blase()!);
      gesehen.push(b.getByText(/^\d+ von \d+$/).textContent!);
      fireEvent.click(b.queryByRole("button", { name: "Fertig" }) ?? b.queryByRole("button", { name: "Weiter" }) ?? b.getByRole("button", { name: "Zeig’s mir" }));
      await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
    }
    expect(gesehen).toEqual(Array.from({ length: 10 }, (_, i) => `${i + 1} von 10`));
  }, 30000);

  it("Vergleichen und prüfen öffnet Vergleich, Rückblick und Annahmen", async () => {
    render(<App />);
    starte("pruefen");
    await waitFor(() => expect(blase()).not.toBeNull());
    expect(document.querySelector('[data-tour="vergleich"]')).not.toBeNull();
    weiter();
    await waitFor(() => expect(within(blase()!).getByText("2 von 3")).toBeTruthy());
    expect(document.querySelector('[data-tour="rueckblick"]')).not.toBeNull();
    weiter();
    await waitFor(() => expect(within(blase()!).getByText("3 von 3")).toBeTruthy());
    expect(document.querySelector('[data-tour="annahmen"]')).not.toBeNull();
  }, 15000);

  it("Menü zeigt alle vier Kapitel", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Tour und Hilfe" }));
    expect(within(screen.getByRole("menu", { name: "Tour und Hilfe" })).getAllByRole("menuitem").map((m) => m.textContent?.trim().slice(2))).toEqual([
      "Erste Erkundung", "Wirkungsnetz: Warum passiert das?", "Selbst einstellen", "Vergleichen und prüfen",
    ]);
  });
});

describe("Tour: Ziel erscheint verzögert", () => {
  it("wartet kurz auf ein Ziel, das erst nach dem Reiterwechsel gezeichnet wird, statt den Schritt zu überspringen", async () => {
    let spaet: HTMLElement | null = null;
    const k: Kapitel = { id: "erkundung", titel: "Test", schritte: [
      { id: "a", ziel: null, text: "Erster Schritt" },
      {
        id: "b",
        ziel: "kommt-spaeter",
        text: "Verzögertes Ziel",
        vorbereiten: () => {
          window.setTimeout(() => {
            spaet = document.createElement("div");
            spaet.setAttribute("data-tour", "kommt-spaeter");
            document.body.appendChild(spaet);
          }, 150);
        },
      },
      { id: "c", ziel: null, text: "Dritter Schritt" },
    ] };
    render(<App />);
    starte(k);
    await waitFor(() => expect(blase()).not.toBeNull());
    weiter();
    await new Promise((r) => setTimeout(r, 400));
    expect(within(blase()!).getByText("Verzögertes Ziel")).toBeTruthy();
    spaet!.remove();
  });
});

describe("Tour: Befunde der Prüfung", () => {
  const handy = () => {
    const original = window.matchMedia;
    window.matchMedia = ((q: string) => ({ ...original(q), matches: true })) as typeof window.matchMedia;
    return () => { window.matchMedia = original; };
  };
  const bis = async (n: number, von = 10) => {
    for (let i = 1; i < n; i++) {
      const b = within(blase()!);
      fireEvent.click(b.queryByRole("button", { name: "Weiter" }) ?? b.getByRole("button", { name: "Zeig’s mir" }));
      await waitFor(() => expect(within(blase()!).getByText(`${i + 1} von ${von}`)).toBeTruthy());
    }
  };

  it("M1: Ein anderes Kapitel mitten in der Tour beginnt bei seinem ersten Schritt", async () => {
    render(<App />);
    starte("erkundung");
    await waitFor(() => expect(blase()).not.toBeNull());
    await bis(3);
    starte("pruefen");
    await waitFor(() => expect(within(blase()!).getByText("1 von 3")).toBeTruthy());
    expect(document.querySelector('[data-tour="vergleich"]')).not.toBeNull();
  }, 15000);

  it("M1: Ein Kapitel starten schließt eine offene Rückfrage; es steht nur ein Dialog da", async () => {
    render(<App />);
    starte("erkundung");
    await waitFor(() => expect(blase()).not.toBeNull());
    await bis(6);
    fireEvent.click(within(blase()!).getByRole("button", { name: "Zeig’s mir" }));
    await waitFor(() => expect(within(blase()!).getByText("7 von 10")).toBeTruthy());
    fireEvent.keyDown(window, { key: "Escape" });
    await screen.findByRole("dialog", { name: "Tour beendet" });
    starte("pruefen");
    await waitFor(() => expect(blase()).not.toBeNull());
    expect(screen.queryByRole("dialog", { name: "Tour beendet" })).toBeNull();
  }, 15000);

  it("M2: Smartphone: Ziel in der Seitenleiste öffnet das Blatt ganz, die Karte steht dem Ziel gegenüber", async () => {
    const zurueck = handy();
    try {
      render(<App />);
      starte("erkundung");
      await waitFor(() => expect(blase()).not.toBeNull());
      await bis(2);
      await waitFor(() => expect(document.querySelector("aside.blatt")!.className).toContain("voll"));
      const r = document.querySelector('[data-tour="land"]')!.getBoundingClientRect();
      expect(blase()!.className.includes("oben")).toBe(r.top + r.height / 2 > window.innerHeight / 2);
    } finally {
      zurueck();
    }
  }, 15000);

  it("M3: Pfeiltasten und Esc in einem Eingabefeld gehören dem Feld, nicht der Tour", async () => {
    render(<App />);
    starte("erkundung");
    await waitFor(() => expect(blase()).not.toBeNull());
    await bis(2);
    const feld = screen.getByLabelText(/^Land/);
    fireEvent.keyDown(feld, { key: "ArrowLeft" });
    fireEvent.keyDown(feld, { key: "Escape" });
    expect(within(blase()!).getByText("2 von 10")).toBeTruthy();
  }, 15000);

  it("M4: Sprachwechsel im letzten Schritt: Kapitel erledigt, Rückfrage erscheint nach dem Neuaufbau", async () => {
    render(<App />);
    starte("erkundung");
    await waitFor(() => expect(blase()).not.toBeNull());
    await bis(10);
    // Die Adresse übernimmt das Szenario 250 ms verzögert; wer liest, wartet länger.
    await act(async () => { await new Promise((r) => setTimeout(r, 400)); });
    fireEvent.click(screen.getByRole("button", { name: /^Sprache:/ }));
    await screen.findByRole("dialog", { name: "Tour finished" });
    fireEvent.click(screen.getByRole("button", { name: "Keep it" }));
    fireEvent.click(screen.getByRole("button", { name: "Tour and help" }));
    expect(within(screen.getByRole("menu", { name: "Tour and help" })).getByRole("menuitem", { name: /First exploration.*done/ })).toBeTruthy();
  }, 15000);

  it("M5: Bei einem Mitmach-Schritt liegt der Fokus in der Sprechblase", async () => {
    render(<App />);
    starte("erkundung");
    await waitFor(() => expect(blase()).not.toBeNull());
    await bis(3);
    await waitFor(() => expect(blase()!.contains(document.activeElement)).toBe(true));
  }, 15000);

  it("H1: Hat die Tour nur das Jahr geändert, setzt Beenden es ohne Rückfrage zurück", async () => {
    render(<App />);
    const jahr = screen.getByLabelText("Gewähltes Jahr").textContent;
    starte("erkundung");
    await waitFor(() => expect(blase()).not.toBeNull());
    await bis(3);
    fireEvent.click(within(blase()!).getByRole("button", { name: "Zeig’s mir" }));
    await waitFor(() => expect(within(blase()!).getByText("4 von 10")).toBeTruthy());
    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() => expect(blase()).toBeNull());
    expect(screen.queryByRole("dialog", { name: "Tour beendet" })).toBeNull();
    expect(screen.getByLabelText("Gewähltes Jahr").textContent).toBe(jahr);
  }, 15000);

  it("H8: Smartphone: Ein Blatt, das schon offen war, bleibt nach der Tour offen", async () => {
    const zurueck = handy();
    try {
      render(<App />);
      fireEvent.click(screen.getByRole("button", { name: "Stellschrauben zeigen" }));
      starte("erkundung");
      await waitFor(() => expect(blase()).not.toBeNull());
      await bis(2);
      weiter();
      await waitFor(() => expect(within(blase()!).getByText("3 von 10")).toBeTruthy());
      fireEvent.keyDown(window, { key: "Escape" });
      await waitFor(() => expect(blase()).toBeNull());
      expect(document.querySelector("aside.blatt")!.className).not.toMatch(/\bzu\b/);
    } finally {
      zurueck();
    }
  }, 15000);
});
