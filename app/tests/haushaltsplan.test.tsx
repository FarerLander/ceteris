import { fireEvent, render, screen } from "@testing-library/react";
import { App } from "../App";

// M29: Schalter „Haushaltspläne bis 2031“ in der Seitenleiste.
describe("M29 Haushaltspläne in der Oberfläche", () => {
  it("Frankreich: Hinweis nennt den Plan 2031; Ohne ist eine Änderung mit Wirkung", () => {
    window.history.replaceState(null, "", "/?l=FR");
    render(<App />);
    // Prüfung M29, Befund 2: genannt werden die Maßnahmen (Impuls), nicht der Ausgleich der Renten- und Zinsdrift.
    expect(screen.getByText(/Bis 2031 folgt der Haushalt den Plänen, die der IWF einrechnet: Die Regierung spart 3,0 Pp\. BIP\./)).toBeTruthy();
    const an = screen.getByLabelText("Einhalten") as HTMLInputElement;
    expect(an.checked).toBe(true);
    const vorher = screen.getAllByText(/Haushaltspläne bis 2031/).length;
    fireEvent.click(screen.getByLabelText("Ohne"));
    expect((screen.getByLabelText("Ohne") as HTMLInputElement).checked).toBe(true);
    // Die Änderung erscheint als Treiber (Name der Grundeinstellung).
    expect(screen.getAllByText(/Haushaltspläne bis 2031/).length).toBeGreaterThan(vorher);
  });
});
