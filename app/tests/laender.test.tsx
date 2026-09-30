import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { App } from "../App";
import { oeffne } from "./ansicht";

describe("Länderwahl", () => {
  it("Grenzfall: Land wechseln startet dessen Basislinie, Link trägt das Land", async () => {
    render(<App />);
    fireEvent.change(screen.getAllByLabelText("Rentenalter")[0], {
      target: { value: "69" },
    });
    fireEvent.change(screen.getByLabelText(/^Land/), {
      target: { value: "JP" },
    });
    expect(screen.getByText("Japan", { selector: "#land option:checked" })).toBeTruthy();
    expect(screen.getByText("Basislinie", { selector: ".griff-stand" })).toBeTruthy();
    expect(
      screen.getByText("Eigene Währung", { selector: "input[name=regime]:checked + label" }),
    ).toBeTruthy();
    await waitFor(() => expect(window.location.search).toContain("l=JP"));
    cleanup();
    render(<App />);
    expect(screen.getByText("Japan", { selector: "#land option:checked" })).toBeTruthy();
  });
  it("Grenzfall: US-Link mit großer Zuwanderung lädt korrekt", async () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText(/^Land/), {
      target: { value: "US" },
    });
    fireEvent.change(screen.getAllByLabelText("Nettozuwanderung")[0], {
      target: { value: "2500" },
    });
    await waitFor(() => expect(window.location.search).toMatch(/s=/));
    cleanup();
    render(<App />);
    expect(screen.getByText("2.500 Tsd. pro Jahr")).toBeTruthy();
  });
  it("Grenzfall: Rückblick zeigt bei USA einen Hinweis", () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText(/^Land/), {
      target: { value: "US" },
    });
    oeffne("Rückblick");
    expect(
      screen.getByText(/Den Rückblick-Test gibt es bisher nur für Deutschland/),
    ).toBeTruthy();
  });
});
