import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
} from "@testing-library/react";
import { App } from "../App";
import { useZaehler } from "../bewegung";
import { DE } from "../land";

function ruhig(an: boolean) {
  window.matchMedia = ((q: string) => ({
    matches: an && q.includes("reduce"),
    media: q,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

describe("Bewegung", () => {
  afterEach(() => ruhig(false));
  it("bei reduzierter Bewegung springt der Zähler sofort", () => {
    ruhig(true);
    const { result, rerender } = renderHook(({ z }) => useZaehler(z), {
      initialProps: { z: 10 },
    });
    rerender({ z: 20 });
    expect(result.current).toBe(20);
  });
  it("Zeitraffer fährt durch die Jahre und hält am Ende", () => {
    vi.useFakeTimers();
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Zeitraffer starten" }));
    act(() => {
      vi.advanceTimersByTime(200 * 60);
    });
    expect(screen.getByLabelText("Gewähltes Jahr").textContent).toBe(
      String(DE.datenstand + 50),
    );
    expect(
      screen.getByRole("button", { name: "Zeitraffer starten" }),
    ).toBeTruthy();
    vi.useRealTimers();
  });
});
