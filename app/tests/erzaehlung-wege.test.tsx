import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { App } from "../App";
import * as pakete from "../../modell/pakete";

vi.mock("../../modell/pakete", async (orig) => {
  const echt = await orig<typeof import("../../modell/pakete")>();
  return { ...echt, bewertePakete: vi.fn(echt.bewertePakete) };
});

describe("Erzählung und Wege", () => {
  it("Basislinie erklärt sich selbst", () => {
    render(<App />);
    expect(screen.getByText("Was passiert hier?")).toBeTruthy();
    expect(screen.getByText(/heutige Politik, unverändert weitergeführt/)).toBeTruthy();
  });
  it("Paket übernehmen und rückgängig machen", async () => {
    render(<App />);
    const knoepfe = screen.getAllByRole("button", {
      name: "Übernehmen und ansehen",
    });
    expect(knoepfe.length).toBeGreaterThan(0);
    fireEvent.click(knoepfe[0]);
    expect(screen.getByLabelText("Übernommene Pakete")).toBeTruthy();
    await waitFor(() => expect(screen.queryByText("Basislinie", { selector: ".griff-stand" })).toBeNull());
    fireEvent.click(screen.getByRole("button", { name: /zurücknehmen$/ }));
    expect(screen.getByText("Basislinie", { selector: ".griff-stand" })).toBeTruthy();
  });
});

describe("Wege: Krisenjahre", () => {
  const mitKrise = (krise: number) => {
    const bp = vi.mocked(pakete.bewertePakete);
    const echt = bp.getMockImplementation()!;
    bp.mockImplementation((...a) => echt(...a).map((b) => ({ ...b, krise })));
    return () => bp.mockImplementation(echt);
  };
  it.each([
    [-3, "−3 Krisenjahre"],
    [2, "+2 Krisenjahre"],
  ])("krise %d zeigt %s", (krise, text) => {
    const zurueck = mitKrise(krise);
    try {
      render(<App />);
      const wege = screen.getByLabelText("Wege zu mehr Wohlstand");
      expect(wege.textContent).toContain(text);
      expect(wege.textContent).not.toContain("gekippt");
    } finally {
      zurueck();
    }
  });
});
