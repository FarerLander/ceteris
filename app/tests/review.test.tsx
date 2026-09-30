import { fireEvent, render, screen, within } from "@testing-library/react";
import { App } from "../App";
import { DE } from "../land";

describe("Schlussprüfung Oberfläche", () => {
  it("I2: ein Schock im Startjahr landet im ersten gerechneten Jahr", () => {
    render(<App />);
    fireEvent.click(within(screen.getByLabelText("Lage je Jahr")).getAllByRole("button")[0]);
    expect(screen.getByRole("button", { name: `Finanzkrise in ${DE.datenstand + 1}` })).toBeTruthy();
  });
  it("M4: Schockjahr lässt sich eintippen, übernommen wird beim Verlassen", () => {
    render(<App />);
    const jahr = DE.datenstand + 15;
    fireEvent.click(screen.getByRole("button", { name: `Ölpreisschock in ${jahr}` }));
    const feld = within(screen.getByLabelText("Gesetzte Schocks")).getByLabelText("Jahr Ölpreisschock") as HTMLInputElement;
    fireEvent.change(feld, { target: { value: "20" } });
    expect(feld.value).toBe("20");
    fireEvent.change(feld, { target: { value: String(jahr + 4) } });
    fireEvent.blur(feld);
    expect((within(screen.getByLabelText("Gesetzte Schocks")).getByLabelText("Jahr Ölpreisschock") as HTMLInputElement).value).toBe(String(jahr + 4));
    expect(screen.getByRole("button", { name: `Zu Ölpreisschock ${jahr + 4} springen` })).toBeTruthy();
  });
});
