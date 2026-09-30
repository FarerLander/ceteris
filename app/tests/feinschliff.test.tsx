import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { App } from "../App";
import { DE } from "../land";

describe("Feinschliff", () => {
  it("Grenzfall: Eingabe während des Gleitens gewinnt, das Paket bleibt übernommen", async () => {
    render(<App />);
    fireEvent.click(
      screen.getAllByRole("button", { name: "Übernehmen und ansehen" })[0],
    );
    fireEvent.change(screen.getAllByLabelText("Nettozuwanderung")[0], {
      target: { value: "800" },
    });
    await new Promise((r) => setTimeout(r, 600));
    expect(screen.getByText("800 Tsd. pro Jahr")).toBeTruthy();
    expect(screen.getByRole("button", { name: /zurücknehmen$/ })).toBeTruthy();
  });
  it("Grenzfall: Horizont kürzen und verlängern behält Schocks", () => {
    render(<App />);
    fireEvent.click(
      within(screen.getByLabelText("Lage je Jahr")).getAllByRole("button")[40],
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: `Krieg mit Beteiligung in ${DE.datenstand + 40}`,
      }),
    );
    fireEvent.click(screen.getByLabelText(String(DE.datenstand + 25)));
    fireEvent.click(screen.getByLabelText(String(DE.datenstand + 50)));
    expect(
      within(screen.getByLabelText("Gesetzte Schocks")).getByLabelText(
        "Jahr Krieg mit Beteiligung",
      ),
    ).toBeTruthy();
  });
  it("Erzählung kündigt nur die Überschrift an, nicht die ganze Karte", () => {
    render(<App />);
    const karte = document.querySelector(".story")!;
    expect(karte.getAttribute("aria-live")).toBeNull();
    expect(karte.querySelector("h2")!.getAttribute("aria-live")).toBe("polite");
  });
});
