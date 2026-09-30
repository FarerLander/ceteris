import { fireEvent, render, screen } from "@testing-library/react";
import { App } from "../App";

describe("Warnlampen-Karte", () => {
  it("zeigt Warnungen und springt beim Klick ins Jahr", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "Warnlampen" })).toBeTruthy();
    fireEvent.change(screen.getAllByLabelText("Übrige Staatsausgaben")[0], {
      target: { value: "30" },
    });
    const eintrag = screen.getAllByRole("button", {
      name: /Risikoaufschlag über der Kipp-Schwelle/,
    })[0];
    fireEvent.click(eintrag);
    expect(
      screen.getByRole("heading", { name: "Risikoaufschlag (Pp.)" }),
    ).toBeTruthy();
  });
});
