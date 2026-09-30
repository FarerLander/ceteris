import { describe, expect, it } from "vitest";
import { vergleicheLand } from "../bericht";
import type { AutoDatei } from "../typen";

// 12b: Bericht für den Pull Request des Daten-Knopfs.
const datei = (
  reihen: AutoDatei["reihen"],
  konsens?: AutoDatei["konsens"],
  abgerufen = "2026-09-28T10:00:00Z",
): AutoDatei => ({
  code: "DE",
  iso3: "DEU",
  abgerufen,
  reihen,
  quellen: {},
  fehlend: [],
  konsens,
});
const iwf = (schuld: number) => ({
  kurz: "IWF",
  name: "IWF WEO",
  stand: "2026-09-28",
  werte: { schuldQuote: { 2031: schuld } },
});

describe("Bericht der Datenänderungen", () => {
  it("nur ein neues Abrufdatum ist keine Änderung", () => {
    const alt = datei({ schuldQuote: { 2024: 62.5, 2025: 62.9 } }, iwf(73.7));
    const neu = datei(
      { schuldQuote: { 2024: 62.5, 2025: 62.9 } },
      iwf(73.7),
      "2026-10-01T06:00:00Z",
    );
    expect(vergleicheLand(alt, neu)).toEqual([]);
  });
  it("nennt neue Werte, Revisionen und neue Prognosen in Alltagssprache", () => {
    const alt = datei(
      { schuldQuote: { 2024: 62.5, 2025: 62.9 }, alq: { 2025: 3.7 } },
      iwf(73.7),
    );
    const neu = datei(
      {
        schuldQuote: { 2024: 62.7, 2025: 63.4, 2026: 64.1 },
        alq: { 2025: 3.7 },
      },
      iwf(74.2),
    );
    const z = vergleicheLand(alt, neu);
    expect(z).toContain("Staatsschuld 2025: 62,9 → 63,4 % BIP");
    expect(z).toContain("Staatsschuld 2026: neu 64,1 % BIP");
    expect(z).toContain("Staatsschuld: 1 ältere Werte revidiert");
    expect(z).toContain("IWF-Prognose Staatsschuld 2031: 73,7 → 74,2 % BIP");
    expect(z.some((x) => x.startsWith("Arbeitslosenquote"))).toBe(false);
  });
  it("meldet verschwundene Reihen", () => {
    const z = vergleicheLand(datei({ rendite: { 2025: 2.6 } }), datei({}));
    expect(z).toContain("Reihe rendite fehlt jetzt");
  });
});
