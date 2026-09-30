import { fireEvent, render, screen } from "@testing-library/react";
import { App } from "../App";
import { oeffne } from "./ansicht";
import { DE } from "../land";
import { bewertePakete, pText } from "../../modell/pakete";
import { basisSzenario, rechne } from "../../modell/rechne";

describe("13.13 Bewertung offenlegen", () => {
  it("Kachel heißt „Ökonomischer Wohlstand pro Kopf“ und sagt, was sie nicht misst", () => {
    render(<App />);
    expect(
      screen.getByRole("button", { name: /^Ökonomischer Wohlstand pro Kopf/ }),
    ).toBeTruthy();
    expect(
      screen.getAllByText(
        "Reales BIP pro Kopf. Sagt nichts über die Verteilung.",
      ),
    ).toHaveLength(1);
  });
  it("„Wohlstand pro Kopf“ steht in der Übersicht nie ohne „ökonomisch“ davor", () => {
    render(<App />);
    const text = document.body.textContent ?? "";
    expect(text).toMatch(/Wohlstand pro Kopf/);
    expect(text).not.toMatch(
      /(?<!Ökonomischer |ökonomischen )Wohlstand pro Kopf/,
    );
  });
  it("Annahmen nennen, was nicht gemessen wird", () => {
    render(<App />);
    oeffne("Annahmen");
    expect(
      screen.getByRole("heading", { name: "Was nicht gemessen wird" }),
    ).toBeTruthy();
    expect(
      screen.getByText(
        /Zufriedenheit, Lebensqualität und der Zustand der Umwelt misst die App nicht/,
      ),
    ).toBeTruthy();
  });
  it("Wege: jede Karte zeigt die fünf Maße", () => {
    render(<App />);
    const karten = [...document.querySelectorAll(".wege-card")];
    expect(karten.length).toBeGreaterThan(0);
    for (const k of karten) {
      const m = k.querySelector("dl.masse")!;
      expect([...m.querySelectorAll("dt")].map((x) => x.textContent)).toEqual(["Ökonomischer Wohlstand pro Kopf", "Ungleichheit (Gini)", "Armut", "Staatsschuld", "CO₂-Ausstoß"]);
      expect(m.querySelectorAll("dd")).toHaveLength(5);
      // Keine Wertung beim Gini: weder gut noch schlecht gefärbt.
      expect(m.querySelectorAll("dd")[1].className).not.toMatch(/good|bad/);
    }
  });
  it("Wege: Reihung wählbar, Vorgabe ökonomischer Wohlstand", () => {
    render(<App />);
    const wahl = screen.getByLabelText("Reihen nach") as HTMLSelectElement;
    expect([...wahl.options].map((o) => o.textContent)).toEqual(["Ökonomischer Wohlstand pro Kopf", "Ungleichheit (Gini)", "Armut", "Staatsschuld", "CO₂-Ausstoß"]);
    expect(wahl.value).toBe("wohlstand");
    const titel = () => [...document.querySelectorAll(".wege-card h3")].map((x) => x.textContent);
    const sz = basisSzenario(DE);
    const verlauf = rechne(DE, sz);
    expect(titel()).toEqual(bewertePakete(DE, sz, verlauf).map((b) => pText(b.paket, "titel")));
    fireEvent.change(wahl, { target: { value: "schuld" } });
    const nachSchuld = bewertePakete(DE, sz, verlauf, "schuld");
    expect(titel()).toEqual(nachSchuld.map((b) => pText(b.paket, "titel")));
    expect(nachSchuld[0].masse.schuld).toBeLessThanOrEqual(nachSchuld[1].masse.schuld);
    expect(titel()).not.toEqual(bewertePakete(DE, sz, verlauf).map((b) => pText(b.paket, "titel")));
  });
});
