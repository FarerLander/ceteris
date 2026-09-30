import autoDE from "../laender/DE.json";
import handDE from "../laender/DE-hand.json";
import { baueLand } from "../land";
import { baueKonsens } from "../konsens";
import { IMF_KONSENS, imfKonsens } from "../parser";
import type { AutoDatei, HandDatei } from "../typen";
import { basisSzenario, rechne } from "../../modell/rechne";

describe("Konsens-Import", () => {
  it("fünf IWF-Codes laut Spec", () => {
    expect(IMF_KONSENS).toEqual({
      wachstum: "NGDP_RPCH",
      inflation: "PCPIPCH",
      alq: "LUR",
      defizit: "GGXCNL_NGDP",
      schuldQuote: "GGXWDG_NGDP",
    });
  });

  it("nimmt nur Prognosejahre nach dem letzten Messjahr", () => {
    const q = imfKonsens(
      {
        wachstum: { 2024: 0.2, 2025: 0.3, 2026: 1.1, 2027: 1.4 },
        alq: { 2025: 3.5 },
      },
      2025,
      "2026-09-27",
    );
    expect(q?.werte).toEqual({ wachstum: { 2026: 1.1, 2027: 1.4 } });
    expect(q?.kurz).toBe("IWF");
    expect(q?.stand).toBe("2026-09-27");
  });

  it("ohne Prognosen keine Quelle, kein Fehler", () => {
    expect(imfKonsens({}, 2025, "2026-09-27")).toBeNull();
    expect(imfKonsens({ alq: { 2024: 3 } }, 2025, "2026-09-27")).toBeNull();
  });

  it("führt IWF und Handwerte zusammen, leere Quellen fallen weg", () => {
    const iwf = imfKonsens({ inflation: { 2026: 2 } }, 2025, "2026-09-27")!;
    const leer = { kurz: "SVR", name: "SVR", stand: "2026-05-01", werte: {} };
    const cbo = {
      kurz: "CBO",
      name: "CBO",
      stand: "2026-02-11",
      werte: { wachstum: { 2026: 2.1 } },
    };
    const k = baueKonsens(iwf, {
      quellen: [leer, cbo],
      gruende: { wachstum: { tiefer: "x" } },
    });
    expect(k?.quellen.map((q) => q.kurz)).toEqual(["IWF", "CBO"]);
    expect(k?.gruende.wachstum?.tiefer).toBe("x");
    expect(baueKonsens(undefined, { quellen: [leer] })).toBeUndefined();
    expect(baueKonsens(undefined, undefined)).toBeUndefined();
  });

  it("Konsenswerte verändern die Modellrechnung nicht", () => {
    const land = baueLand(
      autoDE as unknown as AutoDatei,
      handDE as unknown as HandDatei,
      new Date("2026-09-27"),
    );
    const konsens = baueKonsens(
      imfKonsens(
        { wachstum: { [land.datenstand + 1]: 9 } },
        land.datenstand,
        "2026-09-27",
      )!,
    );
    const ohne = rechne(land, basisSzenario(land));
    const mit = rechne(
      { ...land, konsens },
      basisSzenario({ ...land, konsens }),
    );
    expect(mit).toEqual(ohne);
  });
});
