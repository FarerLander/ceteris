import { fireEvent, render, screen } from "@testing-library/react";
import { App } from "../App";

describe("Gekoppelte Anteilsregler", () => {
  it("Qualifikationsanteile ergeben höchstens 100 %, der Rest steht darunter", () => {
    render(<App />);
    const hoch = screen.getByLabelText("Anteil hoch Qualifizierter") as HTMLInputElement;
    const mittel = screen.getByLabelText("Anteil mittel Qualifizierter") as HTMLInputElement;
    expect(screen.getByText(/Niedrig qualifiziert \(Rest\)/).textContent).toContain("30 %");
    fireEvent.change(hoch, { target: { value: "0.9" } });
    expect(Number(hoch.value) + Number(mittel.value)).toBeCloseTo(1, 9);
    expect(screen.getByText(/Niedrig qualifiziert \(Rest\)/).textContent).toContain("0 %");
  });
  it("Zuwanderungswege ergeben höchstens 100 %, Asyl ist der Rest", () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText("Zuwanderungsweg Arbeit"), { target: { value: "1" } });
    const summe = ["Zuwanderungsweg Arbeit", "Zuwanderungsweg Studium", "Zuwanderungsweg Familie"]
      .reduce((s, n) => s + Number((screen.getByLabelText(n) as HTMLInputElement).value), 0);
    expect(summe).toBeCloseTo(1, 9);
    expect(screen.getByText(/Asyl \(Rest\)/).textContent).toContain("0 %");
  });
});
