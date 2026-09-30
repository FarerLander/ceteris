import { fireEvent, render, screen } from "@testing-library/react";
import { App } from "../App";
import { oeffne } from "./ansicht";

describe("Rückblick-Ansicht", () => {
  it("zeigt neun Größen mit Band-Treffern, Theil's U und Urteil", () => {
    render(<App />);
    oeffne("Rückblick");
    expect(
      screen.getByRole("heading", { name: /Rückblick-Test: 2000 bis \d{4}/ }),
    ).toBeTruthy();
    expect(
      screen.getByRole("columnheader", { name: "Theil's U" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("rowheader", { name: "Erwerbsbevölkerung" }),
    ).toBeTruthy();
    expect(document.querySelectorAll(".bewertung").length).toBe(9);
    expect(
      screen.getByText(/Das Treffen des echten Verlaufs zeigt nicht/),
    ).toBeTruthy();
  });
});
