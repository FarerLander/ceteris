import { fireEvent, render, screen } from "@testing-library/react";
import { LAENDER } from "../land";
import { Detaildiagramm } from "../komponenten/Detaildiagramm";
import { useSimulation } from "../simulation";
import { basisSzenario, rechne } from "../../modell/rechne";
import type { Landesdaten } from "../../modell/typen";

const basis = LAENDER.DE;
const verlauf = rechne(basis, basisSzenario(basis));
const land: Landesdaten = {
  ...basis,
  konsens: {
    quellen: [
      {
        kurz: "TEST",
        name: "Testquelle",
        stand: new Date().toISOString().slice(0, 10),
        werte: {
          schuldQuote: Object.fromEntries(
            verlauf.slice(1, 6).map((z) => [z.jahr, z.schuldQuote]),
          ),
        },
      },
    ],
    gruende: {},
  },
};

function Probe({ l }: { l: Landesdaten }) {
  const sim = useSimulation(l);
  return (
    <>
      <button
        type="button"
        onClick={() =>
          sim.setzeStell(
            "staat.verteidigung",
            sim.wert("staat.verteidigung") + 0.5,
          )
        }
      >
        Regler bewegen
      </button>
      <Detaildiagramm sim={sim} />
    </>
  );
}

describe("Konsens im Diagramm", () => {
  it("Legende nennt die Quelle, (i) den Vergleich", () => {
    render(<Probe l={land} />);
    expect(screen.getByText(/^TEST, \S+ \d{4}$/)).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: "Was bedeutet Staatsschuld?" }),
    );
    expect(screen.getByText("Vergleich mit Prognosen")).toBeTruthy();
    expect(
      screen.getByText(/^Staatsschuld \d{4}: Modell .* Deckt sich mit TEST\.$/),
    ).toBeTruthy();
  });

  it("nach bewegtem Regler: blass und Hinweis statt Urteil", () => {
    render(<Probe l={land} />);
    fireEvent.click(screen.getByRole("button", { name: "Regler bewegen" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Was bedeutet Staatsschuld?" }),
    );
    expect(screen.getByText(/Gilt nur für das Basisszenario/)).toBeTruthy();
    expect(screen.queryByText(/Deckt sich mit TEST/)).toBeNull();
    expect(
      screen.getByText(/^TEST, /).closest(".prognosen")?.className,
    ).toContain("blass");
  });

  it("ohne Konsens keine Legende und kein Abschnitt", () => {
    render(<Probe l={{ ...basis, konsens: undefined }} />);
    expect(document.querySelector(".prognosen")).toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: "Was bedeutet Staatsschuld?" }),
    );
    expect(screen.queryByText("Vergleich mit Prognosen")).toBeNull();
  });
});
