import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { App } from "../App";
import { oeffne } from "./ansicht";
import en from "../sprachen/en.json";
import { fmt } from "../../modell/format";
import { sammleFehlende, setzeSprache, t } from "../../modell/sprache";
import { ANTEILSGRUPPEN, VERZEICHNIS } from "../../modell/verzeichnis";
import { INFO_TITEL, LAGE_NAME, REIHEN } from "../../modell/reihen";
import { BAUSTEIN_NAME, GROESSEN } from "../../modell/netz/groessen";
import { PAKETE } from "../../modell/pakete";
import { SCHOCKS } from "../../modell/schocks";
import { KRITIK } from "../../modell/kritik";
import { LAENDER } from "../land";

// Alle Texte, die im Code über t("…") laufen.
function tTexte(): string[] {
  const dateien: string[] = [];
  const gehe = (d: string) => {
    for (const n of readdirSync(d)) {
      const p = join(d, n);
      if (statSync(p).isDirectory()) { if (n !== "tests" && n !== "node_modules") gehe(p); }
      else if (/\.(ts|tsx)$/.test(n)) dateien.push(p);
    }
  };
  gehe("app"); gehe("modell");
  const texte = new Set<string>();
  for (const f of dateien)
    for (const m of readFileSync(f, "utf-8").matchAll(/\bt\(\s*"((?:[^"\\]|\\.)*)"/g)) texte.add(JSON.parse(`"${m[1]}"`));
  return [...texte];
}

describe("Sprachen (Spec 12c)", () => {
  afterEach(() => { setzeSprache("de"); window.localStorage.clear(); });
  it("jeder t()-Text hat eine englische Fassung", () => {
    const fehlt = tTexte().filter((x) => !(x in en));
    expect(fehlt).toEqual([]);
  });
  it("auch die Texte, die als Variable durch t() laufen, haben eine englische Fassung", () => {
    const rb = readFileSync("modell/rueckblick.ts", "utf-8");
    const dyn = new Set<string>([
      ...VERZEICHNIS.map((e) => e.einheit).filter(Boolean),
      ...Object.values(REIHEN).map((r) => r.einheit),
      ...Object.values(LAGE_NAME), ...INFO_TITEL, ...Object.values(BAUSTEIN_NAME), ...ANTEILSGRUPPEN.map((g) => g.rest),
      ...[...rb.matchAll(/(?:name|einheit): "([^"]+)"/g)].map((m) => m[1]),
      "Hürde verfehlt", "Ziel erreicht", "Ziel verfehlt", "keine Daten",
    ]);
    // Wörterlisten in Komponenten: jeder String-Wert einer Konstante, die durch t() läuft.
    for (const f of ["app/komponenten/Seitenleiste.tsx", "app/komponenten/Anzeige.tsx", "app/komponenten/Kopfleiste.tsx", "app/komponenten/Annahmen.tsx", "app/komponenten/ansichten.ts", "app/komponenten/Topfbalken.tsx", "app/farbmodus.ts", "modell/auswertung.ts"]) {
      const q = readFileSync(f, "utf-8");
      for (const m of q.matchAll(/(?:\[\s*"[a-z]+",\s*|[a-z]+: |name: )"([^"]+)"/g))
        if (/^[A-ZÄÖÜ]| /.test(m[1]) && !m[1].includes("var(")) dyn.add(m[1]);
    }
    const fehlt = [...dyn].filter((x) => !(x in en));
    expect(fehlt).toEqual([]);
  });
  it("Verzeichnis, Reihen, Pakete, Schocks, Netzgrößen und Länderhinweise sind vollständig englisch", () => {
    const k: string[] = [];
    for (const e of VERZEICHNIS) {
      k.push(`v:${e.id}:name`);
      if (e.erklaerung) k.push(`v:${e.id}:erklaerung`);
      if (e.kanal) k.push(`v:${e.id}:kanal`);
      e.optionen?.forEach((_, i) => k.push(`v:${e.id}:option:${i}`));
    }
    for (const [id, r] of Object.entries(REIHEN)) k.push(`r:${id}:name`, `r:${id}:beschreibung`, ...r.info.map((_, i) => `r:${id}:info:${i}`));
    for (const p of PAKETE) k.push(...["titel", "baustein", "warum", "preis"].map((f) => `p:${p.id}:${f}`));
    for (const a of Object.keys(SCHOCKS)) k.push(`s:${a}:name`, `s:${a}:txt`);
    for (const g of Object.keys(GROESSEN)) k.push(`g:${g}:name`);
    for (const [c, l] of Object.entries(LAENDER)) if (l.hinweis) k.push(`land:${c}:hinweis`);
    // Begründungen und Abgrenzungen der Prognosen laufen als Text durch t().
    for (const l of Object.values(LAENDER)) {
      for (const g of Object.values(l.konsens?.gruende ?? {})) for (const x of Object.values(g ?? {})) if (x) k.push(x);
      for (const q of l.konsens?.quellen ?? []) for (const x of Object.values(q.abgrenzung ?? {})) if (x) k.push(x);
    }
    // Offene Kritikpunkte erscheinen im Reiter „Annahmen“.
    for (const p of KRITIK.filter((x) => !x.erledigt)) k.push(...["titel", "text", "wirkung", "behebung"].map((f) => `k:${p.id}:${f}`));
    expect(k.filter((x) => !(x in en))).toEqual([]);
  });
  it("Platzhalter und Rückfall auf Deutsch", () => {
    setzeSprache("en");
    expect(t("{n} Änderungen", { n: 3 })).toBe("3 changes");
    expect(t("gibt es nicht")).toBe("gibt es nicht");
  });
  it("Zahlen im Format der Sprache", () => {
    expect(fmt(1234.5, 1)).toBe("1.234,5");
    setzeSprache("en");
    expect(fmt(1234.5, 1)).toBe("1,234.5");
  });
  it("Schalter in der Seitenleiste wechselt auf Englisch und merkt es sich", () => {
    render(<App />);
    expect(screen.getByText("Basislinie", { selector: ".griff-stand" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Sprache: Deutsch/ }));
    expect(screen.getByText("Baseline", { selector: ".griff-stand" })).toBeTruthy();
    expect(window.localStorage.getItem("wirtschaftssimulator.sprache")).toBe("en");
  });
  it("App auf Englisch: in keinem Reiter fehlt eine Übersetzung (DE, IT, CN, RU)", () => {
    const fehlt = new Set<string>();
    sammleFehlende(fehlt);
    try {
      for (const land of ["DE", "IT", "CN", "RU"]) {
        window.localStorage.setItem("wirtschaftssimulator.sprache", "en");
        window.history.replaceState(null, "", `/?l=${land}`);
        render(<App />);
        // Schocks setzen, damit Warnlampen, Ventile und Schock-Liste erscheinen.
        for (const b of screen.getAllByRole("button").filter((x) => / in \d{4}$/.test(x.textContent ?? "")).slice(0, 3)) fireEvent.click(b);
        for (const name of ["Comparison", "Effect network", "Backtest", "Assumptions", "Overview"]) {
          oeffne(name);
          if (name === "Effect network") {
            const wahl = document.querySelector("#netz-fokus") as HTMLSelectElement;
            fireEvent.change(wahl, { target: { value: "ordnung.rechtsstaat" } });
          }
        }
        for (const b of screen.getAllByRole("button").filter((x) => x.closest(".more-charts"))) fireEvent.click(b);
        cleanup();
      }
    } finally {
      sammleFehlende(null);
      window.history.replaceState(null, "", "/");
    }
    expect([...fehlt]).toEqual([]);
  });
  it("?sprache=en bleibt in der Adresse, auch nach einer Änderung und einem Länderwechsel", () => {
    vi.useFakeTimers();
    try {
      window.history.replaceState(null, "", "/?sprache=en");
      render(<App />);
      fireEvent.change(screen.getAllByLabelText("Retirement age")[0], { target: { value: "69" } });
      act(() => { vi.advanceTimersByTime(400); });
      expect(window.location.search).toContain("sprache=en");
      expect(window.location.search).toContain("s=");
      fireEvent.change(screen.getByLabelText(/^Country/), { target: { value: "IT" } });
      act(() => { vi.advanceTimersByTime(400); });
      expect(window.location.search).toContain("sprache=en");
      expect(document.documentElement.lang).toBe("en");
    } finally {
      vi.useRealTimers();
      window.history.replaceState(null, "", "/");
    }
  });
});
