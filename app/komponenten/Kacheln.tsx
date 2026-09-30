import { fmt } from "../../modell/format";
import { KACHELN, REIHEN, wertVon, type ReihenId, einheitFuer, rName } from "../../modell/reihen";
import { t } from "../../modell/sprache";
import type { Sim } from "../simulation";
import { Zahl } from "./Zahl";

export function Sparkline({
  werte,
  basis,
  idx,
}: {
  werte: number[];
  basis: number[];
  idx: number;
}) {
  const W = 200,
    H = 44;
  const lo = Math.min(...werte, ...basis),
    hi = Math.max(...werte, ...basis);
  const x = (i: number) => 2 + (i / Math.max(1, werte.length - 1)) * (W - 4);
  const y = (v: number) => H - 3 - ((v - lo) / (hi - lo || 1)) * (H - 6);
  const pfad = (r: number[]) =>
    r
      .map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`)
      .join(" ");
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        className="path-ghost"
        style={{ strokeWidth: 2 }}
        vectorEffect="non-scaling-stroke"
        d={pfad(basis)}
      />
      <path
        className="path-main"
        style={{ strokeWidth: 2.5 }}
        vectorEffect="non-scaling-stroke"
        d={pfad(werte)}
      />
      <line
        className="cursor"
        vectorEffect="non-scaling-stroke"
        x1={x(idx)}
        x2={x(idx)}
        y1={0}
        y2={H}
      />
    </svg>
  );
}

export function Delta({ id, v, b }: { id: ReihenId; v: number; b: number }) {
  const r = REIHEN[id];
  const diff = v - b;
  if (Math.abs(diff) < Math.pow(10, -r.dez) / 2)
    return <span className="delta neutral">{t("wie Basislinie")}</span>;
  const klasse = r.gut === 0 ? "neutral" : diff * r.gut > 0 ? "good" : "bad";
  const text =
    id === "bipProKopf"
      ? `${diff > 0 ? "+" : "−"}${fmt(Math.abs((diff / b) * 100), 1)} %`
      : `${diff > 0 ? "+" : "−"}${fmt(Math.abs(diff), r.dez)}${r.einheit.startsWith("%") ? ` ${t("Pp.")}` : ` ${t(r.einheit)}`}`;
  return <span className={`delta ${klasse}`}>{t("{wert} gegen Basislinie", { wert: text })}</span>;
}

export function Kacheln({ sim }: { sim: Sim }) {
  const cur = sim.verlauf[sim.idx],
    b = sim.basis[sim.idx];
  return (
    <section className="tiles" aria-label={t("Kennzahlen")}>
      {KACHELN.map((id) => {
        const r = REIHEN[id];
        const wert = wertVon(cur, id);
        // Über der Warnschwelle in der schlechten Richtung (z. B. Spielraum unter 10 %).
        const warn = r.warn !== undefined && r.gut !== 0 && (wert - r.warn) * r.gut < 0;
        return (
          <button
            key={id}
            type="button"
            className={warn ? "tile warn" : "tile"}
            aria-pressed={sim.detail === id}
            onClick={() => sim.setDetail(id)}
          >
            <span className="name">
              {rName(id)} · {cur.jahr}
            </span>
            <span className="val">
              <Zahl wert={wert} dez={r.dez} />
              <small>{einheitFuer(r, sim.land)}</small>
            </span>
            <Delta id={id} v={wert} b={wertVon(b, id)} />
            {id === "bipProKopf" && (
              <span className="hinweis">{t("Reales BIP pro Kopf. Sagt nichts über die Verteilung.")}</span>
            )}
            <Sparkline
              werte={sim.verlauf.map((z) => wertVon(z, id))}
              basis={sim.basis.map((z) => wertVon(z, id))}
              idx={sim.idx}
            />
            <span className="oeffnen" aria-hidden="true">
              {sim.detail === id ? t("Wird unten gezeigt") : t("Diagramm öffnen ↓")}
            </span>
          </button>
        );
      })}
    </section>
  );
}
