import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { App } from "../App";
import { oeffne } from "./ansicht";
import { EINSTELLUNG } from "../faecher";

// Spec 13.4: Unsicherheitsband aus Zufallsläufen im Diagramm.
describe("13.4 Unsicherheitsband", () => {
  const vorher = { ...EINSTELLUNG };
  beforeEach(() => Object.assign(EINSTELLUNG, { laeufe: 12, ruhe: 0 }));
  afterEach(() => {
    cleanup();
    Object.assign(EINSTELLUNG, vorher);
  });

  it("im Standard an: Legende nennt das Band, darunter steht der Satz zu den Zufallsläufen", async () => {
    render(<App />);
    expect((screen.getByLabelText("Unsicherheit zeigen") as HTMLInputElement).checked).toBe(true);
    await waitFor(() => expect(screen.getByText(/12 Zufallsläufe: In 8 von 10 liegt der Wert 20\d\d zwischen .* und .*\./)).toBeTruthy(), { timeout: 8000 });
    expect(screen.getByText("8 von 10 Zufallsläufen")).toBeTruthy();
    expect(screen.getByText("ein möglicher Verlauf")).toBeTruthy();
    expect(screen.getByText(/Schuldenkrise bis 20\d\d: in \d+ % der Läufe/)).toBeTruthy();
  }, 15000);

  it("abgeschaltet: kein Satz, keine Legende", async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByText(/12 Zufallsläufe/)).toBeTruthy(), { timeout: 8000 });
    fireEvent.click(screen.getByLabelText("Unsicherheit zeigen"));
    expect(screen.queryByText(/Zufallsläufe: In 8 von 10/)).toBeNull();
    expect(screen.queryByText("8 von 10 Zufallsläufen")).toBeNull();
  }, 15000);

  it("solange gerechnet wird, steht dort der Fortschritt", () => {
    render(<App />);
    expect(screen.getByText(/Zufallsläufe rechnen/)).toBeTruthy();
  });

  it("geändertes Szenario: Der Vergleich mit der Basislinie nennt beide Anteile", async () => {
    render(<App />);
    fireEvent.change(screen.getAllByLabelText("Rentenniveau")[0], { target: { value: "60" } });
    await waitFor(() => expect(screen.getByText(/Schuldenkrise bis 20\d\d: in \d+ % der Läufe \(Basislinie: \d+ %\)/)).toBeTruthy(), { timeout: 8000 });
  }, 15000);

  it("nach einer Änderung beginnt der Fortschritt bei 0, nicht beim Endstand des alten Durchgangs", async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByText(/12 Zufallsläufe/)).toBeTruthy(), { timeout: 8000 });
    fireEvent.change(screen.getAllByLabelText("Rentenniveau")[0], { target: { value: "60" } });
    expect(screen.getByText("Zufallsläufe rechnen … 0 von 12")).toBeTruthy();
  }, 15000);

  it("aus und wieder an: Der fertige Fächer ist sofort wieder da, ohne neu zu rechnen", async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByText(/12 Zufallsläufe/)).toBeTruthy(), { timeout: 8000 });
    fireEvent.click(screen.getByLabelText("Unsicherheit zeigen"));
    fireEvent.click(screen.getByLabelText("Unsicherheit zeigen"));
    expect(screen.getByText(/12 Zufallsläufe: In 8 von 10/)).toBeTruthy();
  }, 15000);

  it("Info erklärt das Band", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Was bedeutet Staatsschuld?" }));
    expect(screen.getByText("Das Band")).toBeTruthy();
    expect(screen.getByText(/Die Linie rechnet ohne unvorhergesehene Schocks/)).toBeTruthy();
    expect(screen.getByText(/Das Verfahren heißt Monte-Carlo-Simulation\./)).toBeTruthy();
  });

  it("Annahmen: Block Zufallsschocks mit Häufigkeiten und Schalter", () => {
    render(<App />);
    oeffne("Annahmen");
    fireEvent.click(screen.getByRole("button", { name: "Wirkstärken" }));
    expect(screen.getByText("Zufallsschocks", { selector: "summary" })).toBeTruthy();
    expect(screen.getByText("Pandemie: Wahrscheinlichkeit")).toBeTruthy();
    expect(screen.getByText("Finanzkrise: Kreditlücke → Wahrscheinlichkeit")).toBeTruthy();
  });

  it("Warnlampen verweisen auf das Band", () => {
    render(<App />);
    expect(screen.getByText(/Das Band im Diagramm zeigt, wie weit Zufallsschocks die Linie verschieben können\./)).toBeTruthy();
  });
});
