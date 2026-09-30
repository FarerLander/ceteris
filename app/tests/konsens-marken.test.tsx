import { render } from "@testing-library/react";
import { cloneElement, type ReactElement } from "react";
import { LAENDER } from "../land";
import { Detaildiagramm } from "../komponenten/Detaildiagramm";
import { useSimulation } from "../simulation";
import { basisSzenario, rechne } from "../../modell/rechne";
import type { Landesdaten } from "../../modell/typen";

// jsdom misst keine Größe; das Diagramm bekommt feste Maße, damit Recharts zeichnet.
vi.mock("recharts", async (orig) => {
  const echt = await orig<typeof import("recharts")>();
  return { ...echt, ResponsiveContainer: ({ children }: { children: ReactElement }) => cloneElement(children, { width: 800, height: 280 }) };
});

const basis = LAENDER.DE;
const verlauf = rechne(basis, basisSzenario(basis));
const jahre = (d: number) => Object.fromEntries(verlauf.slice(1, 4).map((z) => [z.jahr, z.schuldQuote + d]));
const land: Landesdaten = {
  ...basis,
  konsens: {
    quellen: [
      { kurz: "EINS", name: "Eins", stand: "2026-05", werte: { schuldQuote: jahre(1) } },
      { kurz: "ZWEI", name: "Zwei", stand: "2026-05", abgrenzung: { schuldQuote: "nur Bund" }, werte: { schuldQuote: jahre(-1) } },
    ],
    gruende: {},
  },
};

function Probe() {
  return <Detaildiagramm sim={useSimulation(land)} />;
}

describe("Prognose-Marken", () => {
  it("jede Quelle eigene Form, hohle Marken bleiben sichtbar", () => {
    const { container } = render(<Probe />);
    const eins = container.querySelectorAll('.recharts-surface [data-quelle="EINS"]');
    const zwei = container.querySelectorAll('.recharts-surface [data-quelle="ZWEI"]');
    expect(eins.length).toBe(3);
    expect(zwei.length).toBe(3);
    expect(eins[0].getAttribute("data-form")).not.toBe(zwei[0].getAttribute("data-form"));
    for (const m of [...eins, ...zwei]) {
      expect(m.getAttribute("stroke-opacity")).not.toBe("0");
      expect(m.closest("[stroke-opacity='0']")).toBeNull();
    }
  });

  it("Legende nennt Quelle und Stand je Quelle", () => {
    const { getByText } = render(<Probe />);
    expect(getByText("EINS, Mai 2026")).toBeTruthy();
    expect(getByText("ZWEI, Mai 2026")).toBeTruthy();
  });
});
