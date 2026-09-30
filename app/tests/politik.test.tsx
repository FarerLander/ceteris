import { fireEvent, render, screen } from "@testing-library/react";
import { App } from "../App";
import { DE } from "../land";
import { ereignisText, type PolitikEreignis } from "../../modell/politik";
import { optionName, politikWirkung } from "../../modell/auswertung";
import { basisSzenario, rechne } from "../../modell/rechne";
import { kodiere } from "../../modell/szenario-code";

describe("13.10 Politik in der Oberfläche", () => {
  it("Ereignistexte sagen, was die Regierung tut: keine Parteien, keine Richtungsnamen", () => {
    const e = (x: Partial<PolitikEreignis>) => ereignisText({ jahr: 2034, art: "entscheidung", ...x } as PolitikEreignis);
    expect(e({ ausloeser: "schwaeche", motiv: "macht" })).toBe("2034: Regierung stützt die Konjunktur mit Ausgaben");
    expect(e({ ausloeser: "schwaeche", motiv: "richtung", struktur: "sozial" })).toBe("2034: Regierung legt ein großes Programm auf: höhere Renten und Familienleistungen");
    expect(e({ ausloeser: "schwaeche", motiv: "richtung", struktur: "energie" })).toBe("2034: Regierung legt ein großes Programm auf: Zuschuss für Industriestrom");
    expect(e({ ausloeser: "schwaeche", motiv: "richtung", struktur: "handel" })).toBe("2034: Regierung legt ein großes Programm auf: höhere Zölle");
    expect(e({ ausloeser: "schwaeche", motiv: "richtung", struktur: "markt" })).toBe("2034: Regierung legt ein großes Programm auf: Steuersenkung");
    expect(e({ ausloeser: "schwaeche", motiv: "unbequem", paket: "arbeit" })).toBe("2034: Regierung beschließt einen Teil von „Länger arbeiten“");
    expect(e({ ausloeser: "eng", motiv: "macht" })).toBe("2034: Regierung umgeht die Schuldenregel und schiebt Investitionen auf");
    expect(e({ ausloeser: "eng", motiv: "richtung", struktur: "sozial" })).toBe("2034: Regierung erhöht Steuern auf Kapital und Unternehmen");
    expect(e({ ausloeser: "eng", motiv: "richtung", struktur: "markt" })).toBe("2034: Regierung kürzt Sozialleistungen");
    expect(e({ ausloeser: "eng", motiv: "unbequem" })).toBe("2034: Regierung beginnt zu sparen");
    expect(ereignisText({ jahr: 2041, art: "ruecknahme" })).toBe("2041: Ein Teil der Reform wird zurückgenommen");
    const alle = [e({ ausloeser: "schwaeche", motiv: "macht" }), e({ ausloeser: "eng", motiv: "richtung", struktur: "sozial" }), e({ ausloeser: "schwaeche", motiv: "richtung", struktur: "markt" })].join(" ");
    expect(alle).not.toMatch(/Machterhalt|links|rechts|sozialdemokrat|konservativ|liberal|Partei|Wahl/i);
  });
  it("Politik-Wirkung nur bei reagiert und mit Ereignissen", () => {
    const fest = { ...basisSzenario(DE, 51), grund: { ...DE.grund, politik: "fest" as const } };
    expect(politikWirkung(DE, fest, rechne(DE, fest))).toBeNull();
    const re = { ...basisSzenario(DE, 51), grund: { ...DE.grund, politik: "reagiert" as const } };
    const w = politikWirkung(DE, re, rechne(DE, re))!;
    expect(w.id).toBe("politik");
    expect(Number.isFinite(w.pc) && Number.isFinite(w.d)).toBe(true);
  });
  it("Politik wählbar, Ereignisse im Wetterband und in der Erzählung", () => {
    render(<App />);
    fireEvent.click(screen.getByLabelText("Reagiert"));
    const marke = screen.getAllByRole("button", { name: /Regierung legt ein großes Programm auf/ })[0];
    expect(marke).toBeTruthy();
    expect(screen.getByText("Was die Regierung von selbst getan hat")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Fest"));
    expect(screen.queryAllByRole("button", { name: /^\d{4}: Regierung/ })).toHaveLength(0);
  });
  it("13.13: Die Erzählung nennt je Entscheidung Jahr und Text; umgeschaltete Punkte sagen es", () => {
    const punkt = rechne(DE, basisSzenario(DE)).flatMap((z) => z.politik).find((e) => e.art === "entscheidung")!;
    const sz = { ...basisSzenario(DE), wahl: { [`${punkt.jahr}-${punkt.ausloeser}`]: "unbequem" as const } };
    window.history.replaceState(null, "", `/?s=${kodiere(sz)}`);
    render(<App />);
    const liste = document.querySelector(".politik-liste")!;
    expect(liste.textContent).toContain(`${punkt.jahr}: Regierung beschließt einen Teil von „Gründungen finanzieren“`);
    expect(liste.textContent).toContain(`von dir gewählt statt der wahrscheinlichen Entscheidung („${optionName(punkt.ausloeser!, punkt.vorwahl!)}“)`);
    // Nicht umgeschaltete Punkte tragen den Zusatz nicht.
    const andere = [...liste.querySelectorAll("li")].filter((li) => !li.textContent!.startsWith(String(punkt.jahr)));
    expect(andere.length).toBeGreaterThan(0);
    for (const li of andere) expect(li.textContent).not.toContain("statt der wahrscheinlichen");
  });
  it("13.13: Hinweis unter „Politik“ erklärt „Reagiert“ und verschwindet bei „Fest“", () => {
    render(<App />);
    expect(screen.getByText(/An jedem Entscheidungspunkt wählt die Regierung zwischen drei Möglichkeiten/)).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Fest"));
    expect(screen.queryByText(/An jedem Entscheidungspunkt wählt die Regierung/)).toBeNull();
  });
});
