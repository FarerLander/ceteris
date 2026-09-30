import { useEffect, useState } from "react";
import type { Landesdaten, Szenario } from "../modell/typen";
import { LAEUFE, faecher, naechsterLauf, neueSammlung, type Faecher } from "../modell/zufall";

// Zufallsläufe für das Unsicherheitsband (Spec 13.4). Rund 200 Läufe brauchen ein bis zwei Sekunden;
// sie rechnen deshalb erst, wenn das Szenario kurz ruht, und in Häppchen, damit die Seite bedienbar bleibt.
export const EINSTELLUNG = { laeufe: LAEUFE, ruhe: 300, haeppchen: 12 };

export interface FaecherStand {
  faecher: Faecher | null; // letzter fertiger Fächer; kann zum vorigen Szenario gehören
  aktuell: boolean; // gehört der Fächer zum jetzigen Szenario?
  fertig: number; // gerechnete Läufe des laufenden Durchgangs
  laeufe: number;
}

export function useFaecher(land: Landesdaten, sz: Szenario, an: boolean): FaecherStand {
  // fuer: Szenario des fertigen Fächers; laeuft: Szenario, zu dem der Fortschritt gehört.
  const [stand, setStand] = useState<{ faecher: Faecher | null; fuer: Szenario | null; laeuft: Szenario | null; fertig: number }>({
    faecher: null,
    fuer: null,
    laeuft: null,
    fertig: 0,
  });
  useEffect(() => {
    if (!an) return;
    let id = 0;
    let gemeldet = 0;
    const s = neueSammlung(land, sz, EINSTELLUNG.laeufe);
    const schritt = () => {
      const t0 = performance.now();
      let weiter = true;
      do weiter = naechsterLauf(s);
      while (weiter && performance.now() - t0 < EINSTELLUNG.haeppchen);
      if (!weiter) {
        setStand({ faecher: faecher(s), fuer: sz, laeuft: sz, fertig: s.fertig });
        return;
      }
      // Fortschritt nur gelegentlich melden: Jede Meldung zeichnet das Diagramm neu.
      if (s.fertig - gemeldet >= EINSTELLUNG.laeufe / 4) {
        gemeldet = s.fertig;
        setStand((alt) => ({ ...alt, laeuft: sz, fertig: s.fertig }));
      }
      id = window.setTimeout(schritt, 0);
    };
    id = window.setTimeout(schritt, EINSTELLUNG.ruhe);
    return () => window.clearTimeout(id);
  }, [land, sz, an]);
  return { faecher: an ? stand.faecher : null, aktuell: an && stand.fuer === sz, fertig: stand.laeuft === sz ? stand.fertig : 0, laeufe: EINSTELLUNG.laeufe };
}
