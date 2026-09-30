import { useMemo } from "react";
import { schockAbstand, warnlampen } from "../../modell/warnlampen";
import { RUECKBLICK } from "../land";
import { t } from "../../modell/sprache";
import type { Sim } from "../simulation";

export function Warnlampen({ sim }: { sim: Sim }) {
  const phasen = useMemo(
    () => warnlampen(sim.land, sim.sz, sim.verlauf),
    [sim.land, sim.sz, sim.verlauf],
  );
  return (
    <section className="card" aria-label={t("Warnlampen")}>
      <h2 className="sub-h">{t("Warnlampen")}</h2>
      {phasen.length === 0 ? (
        <p className="wege-empty">{t("Keine Warnlampe an.")}</p>
      ) : (
        <ul className="warnliste">
          {phasen.map((p) => (
            <li key={`${p.id}-${p.von}`}>
              <button
                type="button"
                onClick={() => {
                  sim.setIdx(p.von - sim.land.datenstand);
                  sim.setDetail(p.reihe);
                }}
              >
                <span className="warnjahr">
                  {p.von === p.bis ? p.von : `${p.von}–${p.bis}`}
                </span>{" "}
                {p.text}
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="wege-empty">
        {t("Diese Prognose enthält keinen unvorhergesehenen Schock. Im Rückblick {von}–{bis} traf Deutschland etwa alle {x} Jahre ein großer.", {
          von: RUECKBLICK.land.datenstand,
          bis: RUECKBLICK.land.datenstand + RUECKBLICK.sz.jahre - 1,
          x: schockAbstand(RUECKBLICK.sz),
        })}{" "}
        {t("Das Band im Diagramm zeigt, wie weit Zufallsschocks die Linie verschieben können.")}
      </p>
    </section>
  );
}
