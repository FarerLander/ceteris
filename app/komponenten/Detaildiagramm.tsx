import { useMemo, useState } from "react";
import { Area, CartesianGrid, ComposedChart, Line, ReferenceArea, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { fmt } from "../../modell/format";
import { konsensPunkte, konsensSaetze, standText } from "../../modell/konsens";
import { istBasis } from "../../modell/szenario-code";
import { INFO_TITEL, REIHEN, mehrFuer, rBeschreibung, rInfo, rName, wertVon, einheitFuer } from "../../modell/reihen";
import { t } from "../../modell/sprache";
import { useBewegung } from "../bewegung";
import { useFaecher } from "../faecher";
import { basisSzenario } from "../../modell/rechne";
import type { Szenario, Zustand } from "../../modell/typen";
import { warnlampen } from "../../modell/warnlampen";
import type { Sim } from "../simulation";
import { Topfbalken } from "./Topfbalken";


// Jede Prognose-Quelle hat ihre eigene Form; hohl heißt: andere Abgrenzung, kein direkter Vergleich.
const FORMEN = ["kreis", "quadrat", "raute", "dreieck"] as const;
type Form = (typeof FORMEN)[number];

function Marke({ cx, cy, form, hohl, blass, quelle }: { cx: number; cy: number; form: Form; hohl: boolean; blass?: boolean; quelle?: string }) {
  const r = 4;
  const stil = {
    stroke: "var(--ink)",
    strokeWidth: 1.5,
    fill: hohl ? "var(--paper)" : "var(--ink)",
    opacity: blass ? 0.3 : 1,
    "data-form": form,
    "data-quelle": quelle,
  };
  if (form === "quadrat") return <rect x={cx - r} y={cy - r} width={2 * r} height={2 * r} {...stil} />;
  if (form === "raute") return <polygon points={`${cx},${cy - r - 1} ${cx + r + 1},${cy} ${cx},${cy + r + 1} ${cx - r - 1},${cy}`} {...stil} />;
  if (form === "dreieck") return <polygon points={`${cx},${cy - r - 1} ${cx + r + 1},${cy + r} ${cx - r - 1},${cy + r}`} {...stil} />;
  return <circle cx={cx} cy={cy} r={r} {...stil} />;
}

export function Detaildiagramm({ sim, vergleich }: { sim: Sim; vergleich?: { verlauf: Zustand[]; name: string; sz?: Szenario } }) {
  const bewegt = useBewegung();
  const phasen = useMemo(
    () => warnlampen(sim.land, sim.sz, sim.verlauf).filter((p) => p.reihe === sim.detail),
    [sim.land, sim.sz, sim.verlauf, sim.detail],
  );
  const [infoOffen, setInfoOffen] = useState(false);
  // Unsicherheitsband (Spec 13.4): Zufallsläufe für das Szenario und, zum Vergleich, für den Partner.
  const [bandAn, setBandAn] = useState(true);
  const partnerSz = useMemo(() => vergleich?.sz ?? basisSzenario(sim.land, sim.sz.jahre), [vergleich?.sz, sim.land, sim.sz.jahre]);
  const fach = useFaecher(sim.land, sim.sz, bandAn);
  const r = REIHEN[sim.detail];
  const basisAktiv = istBasis(sim.szWirksam, sim.land);
  const partnerNoetig = bandAn && (vergleich?.sz ? true : !basisAktiv);
  const fachPartner = useFaecher(sim.land, partnerSz, partnerNoetig);
  const f = fach.faecher;
  const band = f && f.band[sim.detail].p10.length === sim.verlauf.length ? f.band[sim.detail] : null;
  const punkte = useMemo(() => konsensPunkte(sim.land.konsens, sim.verlauf, sim.detail), [sim.land.konsens, sim.verlauf, sim.detail]);
  const saetze = useMemo(() => konsensSaetze(sim.land.konsens, sim.verlauf, sim.detail), [sim.land.konsens, sim.verlauf, sim.detail]);
  const cur = sim.verlauf[sim.idx];
  const mitBev = r.bezug === "bev";
  const daten = sim.verlauf.map((z, i) => ({
    jahr: z.jahr,
    wert: wertVon(z, sim.detail),
    basis: wertVon((vergleich?.verlauf ?? sim.basis)[i], sim.detail),
    bev: z.bev,
    b80: band ? [band.p10[i], band.p90[i]] : null,
    b50: band ? [band.p25[i], band.p75[i]] : null,
    bsp: band && f ? f.beispiel[sim.detail][i] : null,
    ...Object.fromEntries(punkte.map((p, k) => [`k${k}`, p.werte[z.jahr] ?? null])),
  }));
  const achse = { fill: "var(--muted)", fontSize: 12, fontWeight: 700 };

  return (
    <section className="card" aria-label={t("Diagramm")}>
      <div className="detail-head">
        <div>
          <div className="title-row">
            <h2 id="d-title">
              {rName(sim.detail)} ({einheitFuer(r, sim.land)})
            </h2>
            <button
              type="button"
              className="info-btn"
              aria-expanded={infoOffen}
              aria-controls="info-panel"
              aria-label={t("Was bedeutet {name}?", { name: rName(sim.detail) })}
              onClick={() => setInfoOffen((o) => !o)}
            >
              i
            </button>
          </div>
          <p>{rBeschreibung(sim.detail)}</p>
        </div>
        <div className="key">
          <span>
            <i style={{ background: "var(--accent)" }} />
            {t("Dein Szenario")}
          </span>
          <span>
            <i style={{ background: "var(--ghost)" }} />
            {vergleich?.name ?? t("Basislinie")}
          </span>
          {band && (
            <>
              <span>
                <i className="band-muster" />
                {t("8 von 10 Zufallsläufen")}
              </span>
              <span>
                <i className="bsp-muster" />
                {t("ein möglicher Verlauf")}
              </span>
            </>
          )}
          {punkte.length > 0 && (
            <span className={basisAktiv ? "prognosen" : "prognosen blass"}>
              {t("Prognosen:")}
              {punkte.map((p, k) => (
                <span key={k} className="quelle">
                  <svg width="12" height="12" aria-hidden="true">
                    <Marke cx={6} cy={6} form={FORMEN[k % FORMEN.length]} hohl={Boolean(p.abgrenzung)} />
                  </svg>
                  {`${p.kurz}, ${standText(p.stand)}${p.veraltet ? ` ${t("(veraltet)")}` : ""}`}
                </span>
              ))}
            </span>
          )}
        </div>
      </div>
      {infoOffen && (
        <div className="info-panel" id="info-panel">
          {r.info.map((_, i) => (
            <div key={INFO_TITEL[i]}>
              <h4>{t(INFO_TITEL[i])}</h4>
              <p>{rInfo(sim.detail, i)}</p>
            </div>
          ))}
          <div>
            <h4>{t("Das Band")}</h4>
            <p>
              {t("Die Linie rechnet ohne unvorhergesehene Schocks. Das Band zeigt {n} Läufe, in denen Finanzkrisen, Ölpreisschocks, Pandemien, ein Krieg in der Nachbarschaft und die gewöhnliche Konjunktur zufällig eintreten. Helles Band: 8 von 10 Läufen. Dunkles Band: die mittlere Hälfte. Die dünne Linie ist ein einzelner Lauf. Das Verfahren heißt Monte-Carlo-Simulation. Das Band ist eine Untergrenze: Unbekannte Schockarten und Fehler des Modells selbst enthält es nicht. „Schuldenkrise“ heißt: Der Risikoaufschlag steigt über die Krisenschwelle, oder es kommt zu Schuldenschnitt oder Inflation als Ventil. Häufigkeiten und Quellen stehen im Reiter „Annahmen“.", { n: fach.laeufe })}
            </p>
          </div>
          {saetze.length > 0 && (
            <div>
              <h4>{t("Vergleich mit Prognosen")}</h4>
              {basisAktiv ? (
                saetze.map((s) => <p key={s}>{s}</p>)
              ) : (
                <p>{t("Gilt nur für das Basisszenario. Du hast etwas verstellt; die Prognose-Punkte sind deshalb blass.")}</p>
              )}
            </div>
          )}
        </div>
      )}
      {mitBev && (
        <p className="anteil">
          {t("{jahr}: {erw} Mio. Erwerbstätige von {bev} Mio. Einwohnern = {quote} %", { jahr: cur.jahr, erw: fmt(cur.beschaeftigte, 1), bev: fmt(cur.bev, 1), quote: fmt((cur.beschaeftigte / cur.bev) * 100, 0) })}
        </p>
      )}
      {sim.detail === "spielraum" && <Topfbalken z={cur} />}
      <div className="chart-box" style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={daten}
            margin={{ top: 10, right: 16, bottom: 0, left: 0 }}
          >
            <CartesianGrid stroke="var(--line)" vertical={false} />
            {phasen.map((p) => (
              <ReferenceArea key={`${p.id}-${p.von}`} x1={p.von} x2={p.bis} fill="var(--bad)" fillOpacity={0.08} stroke="none" />
            ))}
            <XAxis dataKey="jahr" tick={achse} stroke="var(--line)" />
            <YAxis
              width={52}
              tick={achse}
              stroke="var(--line)"
              domain={r.nullbasis || mitBev ? [(min: number) => Math.min(0, min), "auto"] : ["auto", "auto"]}
              tickFormatter={(v: number) => fmt(v, r.dez)}
            />
            {mitBev && (
              <Area
                dataKey="bev"
                fill="var(--ghost)"
                fillOpacity={0.28}
                stroke="var(--muted)"
                strokeWidth={2}
                isAnimationActive={bewegt} animationDuration={350}
              />
            )}
            {band ? (
              <>
                <Area dataKey="b80" fill="var(--accent)" fillOpacity={fach.aktuell ? 0.12 : 0.05} stroke="none" isAnimationActive={false} />
                <Area dataKey="b50" fill="var(--accent)" fillOpacity={fach.aktuell ? 0.16 : 0.06} stroke="none" isAnimationActive={false} />
                <Line dataKey="bsp" stroke="var(--accent)" strokeWidth={1} strokeOpacity={fach.aktuell ? 0.7 : 0.25} dot={false} isAnimationActive={false} />
              </>
            ) : (
              <Area
                dataKey="wert"
                fill="var(--accent)"
                fillOpacity={0.1}
                stroke="none"
                isAnimationActive={bewegt} animationDuration={350}
              />
            )}
            <Line
              dataKey="basis"
              stroke="var(--ghost)"
              strokeDasharray="5 5"
              strokeWidth={2.5}
              dot={false}
              isAnimationActive={bewegt} animationDuration={350}
            />
            <Line
              dataKey="wert"
              stroke="var(--accent)"
              strokeWidth={3}
              dot={false}
              isAnimationActive={bewegt} animationDuration={350}
            />
            {punkte.map((p, k) => (
              <Line
                key={k}
                dataKey={`k${k}`}
                stroke="none"
                connectNulls={false}
                isAnimationActive={false}
                dot={(d: { cx?: number | null; cy?: number | null; index: number }) =>
                  d.cx == null || d.cy == null ? (
                    <g key={d.index} />
                  ) : (
                    <Marke
                      key={d.index}
                      cx={d.cx}
                      cy={d.cy}
                      form={FORMEN[k % FORMEN.length]}
                      hohl={Boolean(p.abgrenzung)}
                      blass={!basisAktiv}
                      quelle={p.kurz}
                    />
                  )
                }
                activeDot={false}
              />
            ))}
            {r.warn !== undefined && (
              <ReferenceLine
                y={r.warn}
                stroke="var(--bad)"
                strokeDasharray="2 4"
              />
            )}
            <ReferenceLine
              x={cur.jahr}
              stroke="var(--ink)"
              strokeDasharray="3 4"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="band-zeile">
        <label>
          <input type="checkbox" checked={bandAn} onChange={(ev) => setBandAn(ev.target.checked)} /> {t("Unsicherheit zeigen")}
        </label>
        {bandAn && (!f || !fach.aktuell || !band) && (
          <span className="band-text">{t("Zufallsläufe rechnen … {n} von {alle}", { n: fach.aktuell ? fach.laeufe : fach.fertig, alle: fach.laeufe })}</span>
        )}
        {bandAn && f && band && fach.aktuell && (
          <span className="band-text">
            {t("{n} Zufallsläufe: In 8 von 10 liegt der Wert {jahr} zwischen {von} und {bis}.", {
              n: f.laeufe,
              jahr: cur.jahr,
              von: fmt(band.p10[sim.idx], r.dez),
              bis: fmt(band.p90[sim.idx], r.dez),
            })}{" "}
            {partnerNoetig && fachPartner.faecher && fachPartner.aktuell && fachPartner.faecher.schuldenkrise.length > sim.idx
              ? t("Schuldenkrise bis {jahr}: in {p} % der Läufe ({name}: {q} %).", {
                  jahr: cur.jahr,
                  p: fmt(f.schuldenkrise[sim.idx] * 100, 0),
                  name: vergleich?.name ?? t("Basislinie"),
                  q: fmt(fachPartner.faecher.schuldenkrise[sim.idx] * 100, 0),
                })
              : t("Schuldenkrise bis {jahr}: in {p} % der Läufe.", { jahr: cur.jahr, p: fmt(f.schuldenkrise[sim.idx] * 100, 0) })}
          </span>
        )}
      </div>
      <div className="more-charts">
        <span>Mehr Diagramme:</span>
        {mehrFuer(sim.verlauf, sim.basis).map((id) => (
          <button
            key={id}
            type="button"
            aria-pressed={sim.detail === id}
            onClick={() => sim.setDetail(id)}
          >
            {rName(id)}
          </button>
        ))}
      </div>
    </section>
  );
}
