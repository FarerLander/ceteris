import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { App } from "../App";
import { DE } from "../land";
import { basisSzenario, rechne } from "../../modell/rechne";
import { dekodiere, kodiere } from "../../modell/szenario-code";

// Spec 13.13: Entscheidungspunkte der Regierung zum Umschalten.
const erster = rechne(DE, basisSzenario(DE)).flatMap((z) => z.politik).find((e) => e.art === "entscheidung")!;
const marke = () => screen.getAllByRole("button", { name: new RegExp(`^${erster.jahr}: Regierung`) })[0];
const karte = () => screen.getByRole("region", { name: `${erster.jahr}: Die Regierung muss entscheiden` });
// Der Verlauf, ablesbar an den Eingriffen im Wetterband (die Kacheln zählen animiert hoch).
const eingriffe = () => within(screen.getByLabelText("Eingriffe der Regierung")).getAllByRole("button").map((b) => b.getAttribute("aria-label"));
const wahlImLink = () => {
  const code = new URLSearchParams(window.location.search).get("s");
  return code ? dekodiere(code, DE)?.wahl : undefined;
};

describe("13.13 Entscheidungspunkte zum Umschalten", () => {
  it("der Knopf im Wetterband öffnet drei Karten; genau eine trägt „So entscheidet Politik wahrscheinlich“", () => {
    render(<App />);
    expect(screen.queryByRole("region", { name: /Die Regierung muss entscheiden/ })).toBeNull();
    fireEvent.click(marke());
    const k = karte();
    expect(within(k).getAllByRole("article")).toHaveLength(3);
    expect(within(k).getAllByText("So entscheidet Politik wahrscheinlich")).toHaveLength(1);
    expect(within(k).getByText(/Die Wirtschaft ist seit Jahren schwach\./)).toBeTruthy();
    // Jede Karte: fünf Maße, wer zahlt, was es später kostet.
    for (const a of within(k).getAllByRole("article")) {
      // Eine nicht mögliche Option zeigt statt der Maße den Grund.
      expect(a.querySelectorAll("dl.masse dt")).toHaveLength(a.classList.contains("gesperrt") ? 0 : 5);
      expect(within(a).getByText("Wer zahlt")).toBeTruthy();
      expect(within(a).getByText("Was es später kostet")).toBeTruthy();
    }
    // Die gewählte Option ist die Vorwahl: ein Knopf „Gewählt“, kein „Zurück“.
    expect(within(k).getAllByRole("button", { name: /^Gewählt/ })).toHaveLength(1);
    expect(within(k).queryByRole("button", { name: "Zurück zur wahrscheinlichen Entscheidung" })).toBeNull();
    // Daneben die sachliche Lösung aus den Wegen.
    expect(within(k).getByText(/^Sachlich brächte das Paket/)).toBeTruthy();
    // Erneuter Klick schließt.
    fireEvent.click(marke());
    expect(screen.queryByRole("region", { name: /Die Regierung muss entscheiden/ })).toBeNull();
  });
  it("eine andere Option wählen ändert den Verlauf, steht im Link und lässt sich zurücknehmen", async () => {
    render(<App />);
    const vorher = eingriffe();
    fireEvent.click(marke());
    const andere = within(karte()).getAllByRole("button", { name: "Diese Option wählen" }).find((b) => !(b as HTMLButtonElement).disabled)!;
    fireEvent.click(andere);
    expect(eingriffe()).not.toEqual(vorher);
    await waitFor(() => expect(Object.keys(wahlImLink() ?? {})).toEqual([`${erster.jahr}-${erster.ausloeser}`]));
    // Die Staatsschuld im Endjahr ist mit dieser Wahl eine andere.
    const sz = basisSzenario(DE);
    expect(rechne(DE, { ...sz, wahl: wahlImLink() })[50].schuldQuote).not.toBe(rechne(DE, sz)[50].schuldQuote);
    // Die Karte bleibt offen und bietet den Rückweg; die Marke „wahrscheinlich“ bleibt an der Vorwahl.
    const zurueck = within(karte()).getByRole("button", { name: "Zurück zur wahrscheinlichen Entscheidung" });
    expect(within(karte()).getAllByText("So entscheidet Politik wahrscheinlich")).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: new RegExp(`^${erster.jahr}: Regierung.*von dir gewählt`) }).length).toBeGreaterThan(0);
    fireEvent.click(zurueck);
    expect(eingriffe()).toEqual(vorher);
    await waitFor(() => expect(wahlImLink()).toBeUndefined());
  });
  it("im Link steht nach dem Umschalten kein Eintrag für einen Punkt, den es nicht mehr gibt", async () => {
    render(<App />);
    fireEvent.click(marke());
    fireEvent.click(within(karte()).getAllByRole("button", { name: "Diese Option wählen" }).find((b) => !(b as HTMLButtonElement).disabled)!);
    await waitFor(() => expect(wahlImLink()).toBeDefined());
    const wahl = wahlImLink()!;
    const punkte = rechne(DE, { ...basisSzenario(DE), wahl }).flatMap((z) => z.politik).filter((e) => e.art === "entscheidung").map((e) => `${e.jahr}-${e.ausloeser}`);
    for (const k of Object.keys(wahl)) expect(punkte).toContain(k);
  });
  it("nicht mögliche Option ist ausgegraut und nennt den Grund", () => {
    // Deutschland mit schon umgesetztem Paket „Gründungen finanzieren“: Die unbequeme Option geht nicht.
    window.history.replaceState(null, "", `/?s=${kodiere({ ...basisSzenario(DE), stell: { "innov.fue": 4.5, "steuer.kapitalertrag": 0.22 } })}`);
    render(<App />);
    fireEvent.click(screen.getAllByRole("button", { name: /^\d{4}: Regierung/ })[0]);
    const k = screen.getByRole("region", { name: /Die Regierung muss entscheiden/ });
    const gesperrt = within(k).getAllByRole("article").filter((a) => a.classList.contains("gesperrt"));
    expect(gesperrt).toHaveLength(1);
    expect(gesperrt[0].textContent).toMatch(/Nicht möglich/);
    expect((within(gesperrt[0]).getByRole("button") as HTMLButtonElement).disabled).toBe(true);
  });
  it("keine Partei- oder Lagerwörter in der Karte", () => {
    render(<App />);
    fireEvent.click(marke());
    expect(karte().textContent).not.toMatch(/\b(links|rechts|konservativ\w*|progressiv\w*|sozialdemokrat\w*|liberal\w*|grüne[nrs]?|populis\w*|Machterhalt|Partei\w*)\b/i);
  });
  it("G3: verschwindet der Punkt, schließt die Karte und öffnet sich später nicht ungefragt wieder", () => {
    render(<App />);
    fireEvent.click(marke());
    fireEvent.click(screen.getByLabelText("Fest"));
    fireEvent.click(screen.getByLabelText("Reagiert"));
    expect(screen.queryByRole("region", { name: /Die Regierung muss entscheiden/ })).toBeNull();
  });
  it("G4: der Knopf im Wetterband verweist auf die Karte; nach der Wahl bleibt der Fokus auf der gewählten Karte", () => {
    render(<App />);
    fireEvent.click(marke());
    expect(marke().getAttribute("aria-controls")).toBe(karte().id);
    const knopf = within(karte()).getAllByRole("button", { name: "Diese Option wählen" }).find((b) => !(b as HTMLButtonElement).disabled)!;
    knopf.focus();
    fireEvent.click(knopf);
    const gewaehlt = within(karte()).getAllByRole("button", { name: /^Gewählt/ });
    expect(gewaehlt).toHaveLength(1);
    expect(gewaehlt[0].getAttribute("aria-disabled")).toBe("true");
    expect((gewaehlt[0] as HTMLButtonElement).disabled).toBe(false);
  });
  it("G6: veraltete Einträge aus einem Link verschwinden aus der Adresse; der wirksame bleibt", async () => {
    const k = `${erster.jahr}-${erster.ausloeser}`;
    const anders = erster.vorwahl === "unbequem" ? "richtung" : "unbequem";
    window.history.replaceState(null, "", `/?s=${kodiere({ ...basisSzenario(DE), wahl: { [k]: anders, "2031-eng": "macht" } })}`);
    render(<App />);
    await waitFor(() => expect(wahlImLink()).toEqual({ [k]: anders }));
  });
  it("Befund 1 und 2 der zweiten Prüfung: Die Wahl überlebt einen kürzeren Zeitraum und das Zurückschalten", async () => {
    // Ein Punkt nach 2050: Beim Zeitraum bis 2050 gibt es ihn nicht.
    const spaet = rechne(DE, basisSzenario(DE)).flatMap((z) => z.politik).find((e) => e.art === "entscheidung" && e.jahr > 2050)!;
    render(<App />);
    fireEvent.click(screen.getAllByRole("button", { name: new RegExp(`^${spaet.jahr}: Regierung`) })[0]);
    const k = screen.getByRole("region", { name: `${spaet.jahr}: Die Regierung muss entscheiden` });
    fireEvent.click(within(k).getAllByRole("button", { name: "Diese Option wählen" }).find((b) => !(b as HTMLButtonElement).disabled)!);
    await waitFor(() => expect(wahlImLink()).toBeDefined());
    const gewaehlt = wahlImLink()!;
    fireEvent.click(screen.getByLabelText("2050"));
    await new Promise((r) => setTimeout(r, 600));
    fireEvent.click(screen.getByLabelText("2075"));
    await waitFor(() => expect(wahlImLink()).toEqual(gewaehlt));
  });
  it("Politik „Fest“: keine Knöpfe, keine Karte", () => {
    render(<App />);
    fireEvent.click(marke());
    fireEvent.click(screen.getByLabelText("Fest"));
    expect(screen.queryAllByRole("button", { name: /^\d{4}: Regierung/ })).toHaveLength(0);
    expect(screen.queryByRole("region", { name: /Die Regierung muss entscheiden/ })).toBeNull();
  });
});
