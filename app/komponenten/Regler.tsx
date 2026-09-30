import type { CSSProperties } from "react";
import { formatStell } from "../../modell/format";
import { standardWert } from "../../modell/kontext";
import { t } from "../../modell/sprache";
import { anteilsGrenze, anteilsgruppe, vErklaerung, vName, vOption, type Eintrag } from "../../modell/verzeichnis";
import type { Sim } from "../simulation";

export function Regler({ e, sim, zeigeWirkung }: { e: Eintrag; sim: Sim; zeigeWirkung?(id: string): void }) {
  const wert = sim.wert(e.id);
  const geaendert = Math.abs(wert - standardWert(e.id, sim.land)) > 1e-9;
  const id = `s-${e.id}`;
  if (e.optionen) {
    return (
      <div className="field">
        <label htmlFor={id}>{vName(e)}</label>
        <select
          id={id}
          value={Math.round(wert)}
          onChange={(ev) => sim.setzeStell(e.id, Number(ev.target.value))}
        >
          {e.optionen.map((o, i) => (
            <option key={o} value={i}>
              {vOption(e, i)}
            </option>
          ))}
        </select>
      {zeigeWirkung && (
        <button type="button" className="wirkung-link" aria-label={t("Wirkung von {name} zeigen", { name: vName(e) })} onClick={() => zeigeWirkung(e.id)}>
          {t("Wirkung zeigen")}
        </button>
      )}
      </div>
    );
  }
  const [lo, hi] = e.bereich!;
  const grenze = anteilsGrenze(e.id, sim.wert);
  const gruppe = anteilsgruppe(e.id);
  const rest = gruppe && gruppe.ids[gruppe.ids.length - 1] === e.id
    ? Math.max(0, 1 - gruppe.ids.reduce((s, x) => s + sim.wert(x), 0))
    : null;
  const fuellung = ((wert - lo) / (hi - lo)) * 100;
  return (
    <div className="slider">
      <label htmlFor={id}>{vName(e)}</label>
      <output htmlFor={id} className={geaendert ? "changed" : ""}>
        {formatStell(e, wert)}
      </output>
      <input
        type="range"
        id={id}
        min={lo}
        max={hi}
        step={e.schritt}
        value={wert}
        style={{ "--fill": `${fuellung}%` } as CSSProperties}
        onChange={(ev) => sim.setzeStell(e.id, Math.min(grenze, Number(ev.target.value)))}
      />
      {e.erklaerung && <span className="hint">{vErklaerung(e)}</span>}
      {zeigeWirkung && (
        <button type="button" className="wirkung-link" aria-label={t("Wirkung von {name} zeigen", { name: vName(e) })} onClick={() => zeigeWirkung(e.id)}>
          {t("Wirkung zeigen")}
        </button>
      )}
      {rest !== null && (
        <span className="rest">
          {t("{name} (Rest):", { name: t(gruppe!.rest) })} <strong>{formatStell(e, Math.round(rest * 1000) / 1000)}</strong>
        </span>
      )}
    </div>
  );
}
