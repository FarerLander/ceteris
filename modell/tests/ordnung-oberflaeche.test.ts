import { describe, expect, it } from "vitest";
import { DE, LAENDER } from "../../app/land";
import { KRITIK } from "../kritik";
import { PAKETE, bewertePakete } from "../pakete";
import { basisSzenario, rechne } from "../rechne";
import { mehrFuer } from "../reihen";
import { kalibriereStandards } from "../start";
import type { Landesdaten } from "../typen";
import { eintrag } from "../verzeichnis";
import { warnlampen } from "../warnlampen";

const G: Landesdaten = {
  ...DE,
  grund: { ...DE.grund, regime: "gelenkt" },
  standards: { ...DE.standards, "handel.kapitalOffenheit": 0.2 },
};
G.standards = kalibriereStandards(G);

describe("Update 4a: Oberfläche und Auswertung", () => {
  it("Hyperinflation, Schwarzmarkt und verdeckte Schuld melden sich", () => {
    const sz = {
      ...basisSzenario(G, 11),
      stell: {
        "handel.kursNachfuehrung": 0,
        "ordnung.notenbankfinanzierung": 100,
        "staat.uebrige": G.standards["staat.uebrige"] + 10,
      },
    };
    const ids = warnlampen(G, sz, rechne(G, sz)).map((p) => p.id);
    expect(ids).toContain("hyper");
    expect(ids).toContain("schwarzmarkt");
    const kredit = { ...basisSzenario(DE, 31), stell: { "ordnung.kreditlenkung": 60 } };
    expect(warnlampen(DE, kredit, rechne(DE, kredit)).map((p) => p.id)).toContain("verdeckt");
  });
  it("Institutionen stärken erscheint nur, wo ein Hebel nicht neutral steht", () => {
    expect(PAKETE.find((p) => p.id === "institutionen")).toBeDefined();
    const basis = basisSzenario(DE, 31);
    const ids = (sz: typeof basis) => bewertePakete(DE, sz, rechne(DE, sz)).map((b) => b.paket.id);
    const alle = (sz: typeof basis) => {
      const p = PAKETE.find((x) => x.id === "institutionen")!;
      return p.setze((id) => (sz.stell[id] as number) ?? DE.standards[id] ?? 0, () => 0, sz.grund).stell;
    };
    expect(ids(basis)).not.toContain("institutionen");
    // Relativ zum Landesstandard: Italien (Rechtsstaat 68) bekommt es im Basislauf nicht angeboten.
    const IT = LAENDER.IT;
    const pIT = PAKETE.find((x) => x.id === "institutionen")!;
    const w = (id: string) => IT.standards[id] ?? eintrag(id).standard;
    const aIT = pIT.setze(w, w, IT.grund).stell;
    for (const [id, v] of Object.entries(aIT)) expect(v, id).toBe(w(id));
    // +15 Punkte, nicht auf 85 springen.
    const schwach = (id: string) => (id === "ordnung.rechtsstaat" ? 20 : w(id));
    expect(pIT.setze(schwach, w, IT.grund).stell["ordnung.rechtsstaat"]).toBe(35);
    // Die Auswahl zeigt die drei besten Pakete; eine deutliche Verzerrung bringt es nach vorn.
    const kontrolliert = { ...basis, stell: { "ordnung.preiskontrollen": 30, "ordnung.rechtsstaat": 40 } };
    expect(alle(kontrolliert)["ordnung.preiskontrollen"]).toBe(0);
    expect(ids(kontrolliert)).toContain("institutionen");
  });
  it("Ordnungsdiagramme nur, wenn etwas passiert", () => {
    const b = rechne(DE, basisSzenario(DE, 11));
    expect(mehrFuer(b, b)).not.toContain("knappheit");
    const r = rechne(DE, { ...basisSzenario(DE, 11), stell: { "ordnung.preiskontrollen": 30 } });
    expect(mehrFuer(r, b)).toContain("knappheit");
  });
  it("Kritikpunkte: M13 erledigt, M25 neu", () => {
    expect(KRITIK.find((k) => k.id === "M13")?.erledigt).toMatch(/Update 4a/);
    expect(KRITIK.find((k) => k.id === "M25")?.text).toMatch(/Update 4c/);
  });
});
