import { BAUSTEIN_NAME, GROESSEN } from "../../modell/netz/groessen";
import { stellschrauben } from "../../modell/verzeichnis";
import { KARTE_ZEICHEN, WEG_ZEICHEN, zeilen } from "../textumbruch";

describe("Umbruch der Namen im Wirkungsnetz", () => {
  it("bricht an Leerzeichen, jede Zeile höchstens so lang wie erlaubt", () => {
    expect(zeilen("Demografie und Migration", 18)).toEqual(["Demografie und", "Migration"]);
    expect(zeilen("Energie", 18)).toEqual(["Energie"]);
  });
  it("Bausteine passen in zwei Zeilen ihres Kastens", () => {
    for (const n of Object.values(BAUSTEIN_NAME)) {
      const z = zeilen(n, KARTE_ZEICHEN);
      expect([n, z.length <= 2 && z.every((x) => x.length <= KARTE_ZEICHEN)]).toEqual([n, true]);
    }
  });
  it("Zwischengrößen passen in eine Zeile, Stellschrauben in drei", () => {
    for (const g of Object.values(GROESSEN)) expect([g.name, g.name.length <= WEG_ZEICHEN]).toEqual([g.name, true]);
    for (const e of stellschrauben()) {
      const z = zeilen(e.name, WEG_ZEICHEN);
      expect([e.name, z.length <= 3 && z.every((x) => x.length <= WEG_ZEICHEN)]).toEqual([e.name, true]);
    }
  });
});
