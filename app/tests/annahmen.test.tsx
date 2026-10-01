import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { App } from "../App";
import { oeffne } from "./ansicht";
import { GeschaetzteStartwerte } from "../komponenten/Annahmen";

describe("Annahmen-Ansicht", () => {
  it("zeigt Kritikpunkte, Wirkstärken mit Quelle und die Datenlage", () => {
    render(<App />);
    oeffne("Annahmen");
    expect(
      screen.getByRole("heading", { name: "Annahmen und Kritikpunkte" }),
    ).toBeTruthy();
    expect(screen.getByText(/Handwerte ungeprüft/)).toBeTruthy();
    expect(screen.getAllByText(/^Ramey 2019/).length).toBeGreaterThan(0);
    // U2: belegte Spanne neben dem Wert
    expect(screen.getAllByText("Spanne 0,6–1").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Spanne 0–2").length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "Datenlage" })).toBeTruthy();
  });
  it("umstrittene Annahme abschalten zählt als Änderung", async () => {
    render(<App />);
    oeffne("Annahmen");
    fireEvent.click(
      screen.getByRole("checkbox", { name: "Fiskalmultiplikator" }),
    );
    expect(screen.getByText("1 Änderung")).toBeTruthy();
    await waitFor(() => expect(window.location.search).toMatch(/^\?s=/));
  });
  it("13.1: geschätzte Startwerte Deutschlands mit Band und Quelle", () => {
    render(<App />);
    oeffne("Annahmen");
    expect(screen.getByRole("heading", { name: "Geschätzte Startwerte" })).toBeTruthy();
    expect(screen.getByText("Produktivitätstrend")).toBeTruthy();
    expect(screen.getAllByText(/geschätzt, Kalman, ±/).length).toBeGreaterThan(1);
    expect(screen.getAllByText(/zur Information, das Modell nutzt hier eigene Werte \(siehe D12\)/).length).toBeGreaterThan(0);
  });
  it("13.1: verworfene Schätzung zeigt Handwert und Grund", () => {
    render(
      <GeschaetzteStartwerte
        schaetzung={{
          jahr: 2025,
          kappa: 3.1,
          werte: [
            { groesse: "tfpTrend", wert: 0.55, band: 0.31, gueltig: true, genutzt: true, handwert: 0.4, hp: 0.6 },
            { groesse: "nairu", wert: 9, band: 3, gueltig: false, genutzt: false, handwert: 3.5, grund: "Band ±3,0 breiter als 2,5" },
          ],
          hinweis: "Schätzung für 2024, Datenstand 2025: Handwerte",
        }}
      />,
    );
    expect(screen.getByText("geschätzt, Kalman, ±0,3 · HP-Gegenprobe 0,6")).toBeTruthy();
    expect(screen.getByText("Handwert 3,5 · Schätzung verworfen: Band ±3,0 breiter als 2,5")).toBeTruthy();
    expect(screen.getByText(/Datenstand 2025: Handwerte/)).toBeTruthy();
  });
  it("13.1: Handwert im Band heißt bestätigt, nicht verworfen", () => {
    render(
      <GeschaetzteStartwerte
        schaetzung={{
          jahr: 2025,
          kappa: 1.6,
          werte: [{ groesse: "tfpTrend", wert: 0.22, band: 0.24, gueltig: true, genutzt: false, handwert: 0.4, grund: "Handwert liegt im Band, bestätigt", bestaetigt: true }],
        }}
      />,
    );
    expect(screen.getByText("Handwert 0,4 · im Band der Schätzung (0,2 ±0,2), bestätigt")).toBeTruthy();
    expect(screen.getByText("0,40 % pro Jahr")).toBeTruthy();
  });
});

describe("13.2 Vorab-Hinweis", () => {
  it("Karte Warnlampen nennt den fehlenden Zufallsschock", () => {
    render(<App />);
    expect(screen.getByText(/Diese Prognose enthält keinen unvorhergesehenen Schock\. Im Rückblick 2000–2025 traf Deutschland etwa alle 9 Jahre ein großer\./)).toBeTruthy();
  });
  it("13.13: „So entscheidet die Regierung im Modell“ mit sechs Verzerrungen, Werten, Quellen und den Landesdaten", () => {
    render(<App />);
    oeffne("Annahmen");
    const abschnitt = screen.getByRole("region", { name: "So entscheidet die Regierung im Modell" });
    expect(within(abschnitt).getByRole("heading", { name: "So entscheidet die Regierung im Modell" })).toBeTruthy();
    expect(abschnitt.textContent).toContain("Die Regierung im Modell wählt nicht die beste Lösung.");
    const zeilen = within(abschnitt).getAllByRole("row").slice(1);
    expect(zeilen.map((z) => z.querySelector("th")!.textContent)).toEqual(["Zu spät", "Verwässert", "Sperrklinke", "Defizit-Neigung", "Wahltakt", "Großprogramme"]);
    for (const z of zeilen) expect(z.querySelectorAll("td")).toHaveLength(3);
    expect(zeilen[0].textContent).toContain("Alesina/Drazen 1991");
    expect(zeilen[2].textContent).toContain("Peacock/Wiseman 1961");
    // Deutschland.
    expect(abschnitt.textContent).toContain("Legislatur 4 Jahre, letzte Wahl 2025");
    expect(abschnitt.textContent).toContain("Wirksamkeit der Regierung: 83 von 100");
    expect(abschnitt.textContent).toContain("ausgebauter Sozialstaat");
    expect(abschnitt.textContent).toMatch(/Keine Parteien/);
  });
  it("13.13: Land ohne Wahltakt-Wirkung (China) sagt das", () => {
    window.history.replaceState(null, "", "/?l=CN");
    render(<App />);
    oeffne("Annahmen");
    const abschnitt = screen.getByRole("region", { name: "So entscheidet die Regierung im Modell" });
    expect(abschnitt.textContent).toContain("Der Wahltakt wirkt in diesem Land nicht.");
    expect(abschnitt.textContent).toContain("keine ausgeprägte Struktur");
  });
});
