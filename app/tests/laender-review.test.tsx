import { fireEvent, render, screen } from "@testing-library/react";
import { App } from "../App";

describe("Schlussprüfung Phase 3: Länder", () => {
  it("I2: gespeicherte Szenarien gehören zu ihrem Land", () => {
    render(<App />);
    fireEvent.change(screen.getAllByLabelText("Rentenalter")[0], { target: { value: "69" } });
    fireEvent.change(screen.getByLabelText("Name des Szenarios"), { target: { value: "Rente DE" } });
    fireEvent.click(screen.getByRole("button", { name: "Speichern" }));
    fireEvent.change(screen.getByLabelText(/^Land/), { target: { value: "US" } });
    expect(screen.queryByRole("button", { name: "Rente DE" })).toBeNull();
    fireEvent.change(screen.getByLabelText(/^Land/), { target: { value: "DE" } });
    expect(screen.getByRole("button", { name: "Rente DE" })).toBeTruthy();
  });
  it("Link mit geerbtem Schlüssel als Land lädt Deutschland", () => {
    window.history.replaceState(null, "", "/?l=toString");
    render(<App />);
    expect(screen.getByText("Deutschland", { selector: "#land option:checked" })).toBeTruthy();
  });
});
