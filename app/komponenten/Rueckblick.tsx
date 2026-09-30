import { useMemo, useState } from "react";
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { fmt } from "../../modell/format";
import { rechne } from "../../modell/rechne";
import { bewerte, pruefeTreffsicherheit } from "../../modell/rueckblick";
import { t } from "../../modell/sprache";
import { useBewegung } from "../bewegung";
import { IST, RUECKBLICK } from "../land";

export function Rueckblick({ landCode }: { landCode: string }) {
  if (landCode !== "DE") {
    return (
      <section className="card" aria-label={t("Rückblick-Test")}>
        <h2>{t("Rückblick-Test")}</h2>
        <p className="lead">{t("Den Rückblick-Test gibt es bisher nur für Deutschland. Für dieses Land fehlen noch die historischen Politik- und Weltpfade (siehe Kritikpunkt T4).")}</p>
      </section>
    );
  }
  return <RueckblickDE />;
}

function RueckblickDE() {
  const bewegt = useBewegung();
  const liste = useMemo(
    () => pruefeTreffsicherheit(rechne(RUECKBLICK.land, RUECKBLICK.sz), IST),
    [],
  );
  const [wahl, setWahl] = useState("wachstum");
  const gew = liste.find((x) => x.id === wahl)!;
  const achse = { fill: "var(--muted)", fontSize: 12, fontWeight: 700 };
  const band = gew.punkte.map((p) => ({
    ...p,
    band: p.unten !== null && p.oben !== null ? [p.unten, p.oben] : null,
  }));
  const u = (x: number | null) =>
    x === null ? "—" : Number.isFinite(x) ? fmt(x, 2) : "∞";
  return (
    <>
      <section className="card" aria-label={t("Rückblick-Test")}>
        <h2>{t("Rückblick-Test: 2000 bis {bis}", { bis: RUECKBLICK.bis })}</h2>
        <p className="lead">
          {t("Das Modell startet 2000 mit echten Startwerten, bekommt die tatsächliche Politik, die Weltpreise und die großen Schocks und rechnet dann selbst. Band: eine Standardabweichung der Ist-Werte um ihren Trend. Vergleich: „alles bleibt, wie es ist“. Hürde: Das Modell muss den Vergleich schlagen (Theil's U unter 1). Ziel: zwei Drittel der Jahre im Band.")}
        </p>
        <div className="chart-box">
          <table className="vtab">
            <thead>
              <tr>
                <th scope="col">{t("Größe")}</th>
                <th scope="col">{t("Jahre im Band")}</th>
                <th scope="col">Theil's U</th>
                <th scope="col">{t("Urteil")}</th>
              </tr>
            </thead>
            <tbody>
              {liste.map((x) => (
                <tr key={x.id} className={x.id === wahl ? "gewaehlt" : ""}>
                  <th scope="row">
                    <button
                      type="button"
                      className="link"
                      aria-pressed={x.id === wahl}
                      onClick={() => setWahl(x.id)}
                    >
                      {t(x.name)}
                    </button>
                  </th>
                  <td>
                    {x.imBand === null
                      ? "—"
                      : t("{anteil} % von {jahre}", { anteil: fmt(x.imBand * 100, 0), jahre: x.jahre })}
                  </td>
                  <td>{u(x.theilU)}</td>
                  <td>
                    <span
                      className={`bewertung ${bewerte(x) === "Ziel erreicht" ? "gut" : bewerte(x) === "Ziel verfehlt" ? "mittel" : bewerte(x) === "Hürde verfehlt" ? "schwach" : "keine-Daten"}`}
                    >
                      {t(bewerte(x))}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="lead">
          {t("Das Treffen des echten Verlaufs zeigt nicht, dass die Wirkung anderer Politik stimmt (Lucas-Kritik). Dafür sind die historischen Kalibrierfälle da.")}
        </p>
      </section>
      <section className="card" aria-label={t("Rückblick-Diagramm")}>
        <div className="detail-head">
          <div>
            <h2>
              {t(gew.name)} ({t(gew.einheit)})
            </h2>
            <p>
              {t("Modell, tatsächlicher Verlauf mit Band, Vergleich „alles bleibt“.")}
            </p>
          </div>
          <div className="key">
            <span>
              <i style={{ background: "var(--accent)" }} />
              {t("Modell")}
            </span>
            <span>
              <i style={{ background: "var(--ink)" }} />
              {t("Tatsächlich")}
            </span>
            <span>
              <i style={{ background: "var(--ghost)" }} />
              {t("Vergleich")}
            </span>
          </div>
        </div>
        <div className="chart-box" style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={band}
              margin={{ top: 10, right: 16, bottom: 0, left: 0 }}
            >
              <CartesianGrid stroke="var(--line)" vertical={false} />
              <XAxis dataKey="jahr" tick={achse} stroke="var(--line)" />
              <YAxis
                width={52}
                tick={achse}
                stroke="var(--line)"
                domain={["auto", "auto"]}
                tickFormatter={(v: number) => fmt(v, gew.dez)}
              />
              <Area
                dataKey="band"
                fill="var(--ink)"
                fillOpacity={0.08}
                stroke="none"
                isAnimationActive={bewegt}
                animationDuration={350}
                connectNulls={false}
              />
              <Line
                dataKey="vergleich"
                stroke="var(--ghost)"
                strokeDasharray="5 5"
                strokeWidth={2}
                dot={false}
                isAnimationActive={bewegt}
                animationDuration={350}
              />
              <Line
                dataKey="ist"
                stroke="var(--ink)"
                strokeWidth={2}
                dot={{ r: 2.5 }}
                connectNulls={false}
                isAnimationActive={bewegt}
                animationDuration={350}
              />
              <Line
                dataKey="modell"
                stroke="var(--accent)"
                strokeWidth={3}
                dot={false}
                isAnimationActive={bewegt}
                animationDuration={350}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>
    </>
  );
}
