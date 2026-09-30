import { useMemo, useState } from "react";
import { fmt } from "../../modell/format";
import { rechne } from "../../modell/rechne";
import { KACHELN, REIHEN, mehrFuer, wertVon, einheitFuer, rName } from "../../modell/reihen";
import { t } from "../../modell/sprache";
import { dekodiere } from "../../modell/szenario-code";
import type { Sim } from "../simulation";
import { ladeListe } from "../speicher";
import { Detaildiagramm } from "./Detaildiagramm";

export function Vergleich({ sim }: { sim: Sim }) {
  const [partner, setPartner] = useState("basis");
  const liste = ladeListe().filter((x) => (x.land ?? "DE") === sim.land.code);
  // Szenario des Partners (für die Zufallsläufe, Spec 13.4); undefined = Basislinie.
  const partnerSz = useMemo(() => {
    if (partner === "basis") return undefined;
    const e = liste.find((x) => x.name === partner);
    const s = e && dekodiere(e.code, sim.land);
    return s ? { ...s, jahre: sim.sz.jahre } : undefined;
  }, [partner, sim.land, sim.sz.jahre]);
  const b = useMemo(() => (partnerSz ? rechne(sim.land, partnerSz) : sim.basis), [partnerSz, sim.basis, sim.land]);
  const name = partner === "basis" ? t("Basislinie") : partner;
  const n = sim.verlauf.length;
  const spalten = [
    ...new Set([5, 10, 25, 50, 100, n - 1].filter((j) => j > 0 && j < n)),
  ];

  return (
    <>
      <section className="card vergleich" aria-label={t("Vergleichstabelle")}>
        <div className="wege-head">
          <div>
            <h2>{t("Dein Szenario gegen {name}", { name })}</h2>
            <p>
              {t("Oben dein Szenario, klein darunter der Vergleich, farbig der Unterschied.")}
            </p>
          </div>
          <div className="field">
            <label htmlFor="partner">{t("Vergleichen mit")}</label>
            <select
              id="partner"
              value={partner}
              onChange={(ev) => setPartner(ev.target.value)}
            >
              <option value="basis">{t("Basislinie")}</option>
              {liste.map((x) => (
                <option key={x.name} value={x.name}>
                  {x.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="chart-box">
          <table className="vtab">
            <thead>
              <tr>
                <th scope="col">{t("Größe")}</th>
                {spalten.map((j) => (
                  <th scope="col" key={j}>
                    {sim.verlauf[j].jahr}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...KACHELN, ...mehrFuer(sim.verlauf, b)].map((id) => {
                const r = REIHEN[id];
                return (
                  <tr key={id}>
                    <th scope="row">
                      {rName(id)} <small>({einheitFuer(r, sim.land)})</small>
                    </th>
                    {spalten.map((j) => {
                      const a = wertVon(sim.verlauf[j], id),
                        v = wertVon(b[j], id),
                        d = a - v;
                      const klein = Math.abs(d) < Math.pow(10, -r.dez) / 2;
                      const klasse =
                        klein || r.gut === 0
                          ? "neutral"
                          : d * r.gut > 0
                            ? "good"
                            : "bad";
                      return (
                        <td key={j}>
                          <b>{fmt(a, r.dez)}</b>
                          <br />
                          <small>{fmt(v, r.dez)}</small>
                          <br />
                          <span className={`delta ${klasse}`}>
                            {klein
                              ? "±0"
                              : `${d > 0 ? "+" : "−"}${fmt(Math.abs(d), r.dez)}`}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      <Detaildiagramm sim={sim} vergleich={{ verlauf: b, name, sz: partnerSz }} />
    </>
  );
}
