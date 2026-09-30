import { fireEvent, render, screen, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { App } from "../App";
import { DE } from "../land";
import { LAGEN } from "../../modell/lage";
import { LAGE_NAME } from "../../modell/reihen";
import type { Lage } from "../../modell/typen";
import { LAGE_SYMBOL } from "../lage-darstellung";
import { SYMBOLE } from "../symbol-daten";

describe("Wetterband", () => {
  const jahr = DE.datenstand + 15;
  it("Schock setzen, Jahr ändern, entfernen", () => {
    render(<App />);
    fireEvent.click(
      screen.getByRole("button", { name: `Ölpreisschock in ${jahr}` }),
    );
    const liste = screen.getByLabelText("Gesetzte Schocks");
    const feld = within(liste).getByLabelText(
      "Jahr Ölpreisschock",
    ) as HTMLInputElement;
    expect(feld.value).toBe(String(jahr));
    fireEvent.change(feld, { target: { value: String(jahr + 3) } });
    fireEvent.blur(feld);
    expect(
      (within(liste).getByLabelText("Jahr Ölpreisschock") as HTMLInputElement)
        .value,
    ).toBe(String(jahr + 3));
    fireEvent.click(
      within(liste).getByRole("button", {
        name: `Ölpreisschock ${jahr + 3} entfernen`,
      }),
    );
    expect(
      within(screen.getByLabelText("Gesetzte Schocks")).queryByLabelText(
        "Jahr Ölpreisschock",
      ),
    ).toBeNull();
  });
  it("Band hat ein Feld pro Jahr und springt beim Klick", () => {
    render(<App />);
    const band = screen.getByLabelText("Lage je Jahr");
    expect(within(band).getAllByRole("button")).toHaveLength(51);
    fireEvent.click(within(band).getAllByRole("button")[3]);
    expect(screen.getByLabelText("Gewähltes Jahr").textContent).toBe(
      String(DE.datenstand + 3),
    );
  });
});

describe("Schock-Stärke und -Dauer", () => {
  it("Stärke 3 einer Finanzkrise schaltet die Arbeitslosen-Warnlampe ein", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: `Finanzkrise in ${DE.datenstand + 15}` }));
    const liste = screen.getByLabelText("Gesetzte Schocks");
    fireEvent.change(within(liste).getByLabelText("Stärke Finanzkrise"), { target: { value: "3" } });
    expect((within(liste).getByLabelText("Stärke Finanzkrise") as HTMLSelectElement).value).toBe("3");
    fireEvent.change(within(liste).getByLabelText("Dauer Finanzkrise"), { target: { value: "2" } });
    expect(screen.getAllByRole("button", { name: /Arbeitslosigkeit über 10 %/ }).length).toBeGreaterThan(0);
  });
});

describe("Wetterband mit neun Lagen", () => {
  it("Legende in LAGEN-Reihenfolge, Felder mit Lage-Namen, Symbol aus LAGE_SYMBOL", () => {
    const { container } = render(<App />);
    const karte = screen.getByLabelText("Wetterlage");
    const legende = [...karte.querySelectorAll(".legend > span")].map(
      (s) => s.textContent,
    );
    expect(legende).toEqual(LAGEN.map((l) => LAGE_NAME[l]));
    const namen = new Set(Object.values(LAGE_NAME));
    for (const b of within(screen.getByLabelText("Lage je Jahr")).getAllByRole(
      "button",
    )) {
      const name = b.getAttribute("aria-label")!.split(": ")[1];
      expect(namen.has(name)).toBe(true);
    }
    const jahr = Number(screen.getByLabelText("Gewähltes Jahr").textContent);
    const lage = (Object.keys(LAGE_NAME) as Lage[]).find(
      (l) => LAGE_NAME[l] === karte.querySelector(".state span")!.textContent,
    )!;
    expect(jahr).toBeGreaterThan(0);
    expect(
      karte.querySelector(".now use")!.getAttribute("href"),
    ).toBe(`#${LAGE_SYMBOL[lage]}`);
    expect(container).toBeTruthy();
  });
  it("Hinweis: seltene Lagen entstehen durch Schocks", () => {
    render(<App />);
    expect(
      screen.getByText(
        "Boom, Rezession, Stagflation und Deflation entstehen vor allem durch Schocks und starke Eingriffe.",
      ),
    ).toBeTruthy();
  });
  it("Grenzfall: Verteilungsbalken nur mit vorhandenen Lagen, Legende in LAGEN-Reihenfolge ohne 0 Jahre", () => {
    const { container } = render(<App />);
    const segmente = [...container.querySelectorAll(".dist > span")];
    expect(segmente.length).toBeGreaterThan(0);
    for (const s of segmente)
      expect(s.getAttribute("title")).not.toMatch(/: 0 Jahre$/);
    const legende = [...container.querySelectorAll(".dist-legend > span")].map(
      (s) => s.textContent!,
    );
    expect(legende.some((t) => / 0 Jahre$/.test(t))).toBe(false);
    const reihenfolge = legende.map((t) =>
      LAGEN.findIndex((l) => t.startsWith(LAGE_NAME[l] + " ")),
    );
    expect(reihenfolge.every((i) => i >= 0)).toBe(true);
    expect([...reihenfolge].sort((a, b) => a - b)).toEqual(reihenfolge);
    expect(segmente).toHaveLength(legende.length);
  });
  it("keine alten Lage-Wörter mehr", () => {
    render(<App />);
    const text = document.body.textContent!;
    for (const w of ["kippt", "blüht", "überhitzt"]) expect(text).not.toContain(w);
  });
});

describe("Symbole und Farben der neun Lagen", () => {
  const css = readFileSync("app/stil.css", "utf-8");
  // Themen-Blöcke: hell, dunkel per Systemeinstellung, dunkel per Schalter.
  const bloecke = [
    /^:root \{([^}]*)\}/m,
    /:root:not\(\[data-theme="light"\]\) \{([^}]*)\}/,
    /:root\[data-theme="dark"\] \{([^}]*)\}/,
  ].map((re) => css.match(re)![1]);
  it.each(LAGEN)("%s: eigenes Symbol und Farbe in allen drei Themen", (l) => {
    expect(LAGE_SYMBOL[l]).toBe(`i-lage-${l}`);
    expect(SYMBOLE).toContain(`<symbol id="i-lage-${l}"`);
    for (const b of bloecke) expect(b).toMatch(new RegExp(`--lage-${l}: #[0-9a-f]{6};`));
  });
  it("neun verschiedene Farben je Thema", () => {
    for (const b of bloecke) {
      const farben = LAGEN.map((l) => b.match(new RegExp(`--lage-${l}: (#[0-9a-f]{6});`))![1]);
      expect(new Set(farben).size).toBe(9);
    }
  });
  it("alte Lage-Symbole sind weg", () => {
    for (const alt of ["i-blueht", "i-stagniert", "i-ueberhitzt", "i-kippt"])
      expect(SYMBOLE).not.toContain(`id="${alt}"`);
  });
});
