import { readFileSync } from "node:fs";

// --line-strong ist im dunklen Modus fast schwarz (Schattenfarbe) und taugt nicht für Linien auf dunklem Grund.
describe("Wirkungsnetz: Linien und Rahmen in beiden Modi sichtbar", () => {
  it("die Komponente nutzt --line-strong nicht", () => {
    expect(readFileSync("app/komponenten/Wirkungsnetz.tsx", "utf8")).not.toMatch(/line-strong/);
  });
  it("die Netz-Regeln im Stil nutzen --line-strong nicht", () => {
    const css = readFileSync("app/stil.css", "utf8");
    const regeln = css.match(/\.netz-[^{]*\{[^}]*\}/g) ?? [];
    expect(regeln.length).toBeGreaterThan(5);
    for (const r of regeln) expect(r).not.toMatch(/line-strong/);
  });
});
