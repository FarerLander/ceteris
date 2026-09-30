import { useMemo } from "react";
import { erzaehlung, optionName, politikWirkung } from "../../modell/auswertung";
import { ereignisText } from "../../modell/politik";
import { fmt } from "../../modell/format";
import { LAGEN } from "../../modell/lage";
import { lageName } from "../../modell/reihen";
import { t } from "../../modell/sprache";
import { SCHOCKS, sName, sText } from "../../modell/schocks";
import { LAGE_SYMBOL, lageFarbe } from "../lage-darstellung";
import type { Sim } from "../simulation";

export function ErzaehlungKarte({ sim }: { sim: Sim }) {
  const e = useMemo(
    () => erzaehlung(sim.land, sim.sz, sim.verlauf),
    [sim.land, sim.sz, sim.verlauf],
  );
  const reg = useMemo(
    () => politikWirkung(sim.land, sim.sz, sim.verlauf),
    [sim.land, sim.sz, sim.verlauf],
  );
  const ereignisse = sim.verlauf.flatMap((z) => z.politik);
  const rettungen = sim.verlauf.filter((z) => z.rettung > 0);
  const cur = sim.verlauf[sim.idx];
  const max = Math.max(0.1, ...e.treiber.map((x) => Math.abs(x.pc)));
  const fakten: [string, string, string, boolean?][] = [
    [t("Schuldenquote {jahr}", { jahr: cur.jahr }), fmt(cur.schuldQuote, 0), t("% BIP")],
    [t("Risikoaufschlag"), fmt(cur.aufschlag, 1), t("Pp.")],
    [
      t("Erwerbstätige"),
      fmt((cur.beschaeftigte / cur.bev) * 100, 0),
      t("% der Einwohner"),
    ],
    [t("Rentenausgaben"), fmt(cur.rentenausgaben, 1), t("% BIP")],
  ];
  return (
    <section className="card story">
      <div className="story-head">
        <svg
          viewBox="0 0 100 100"
          aria-hidden="true"
          className={`wetter wetter-${e.symbol}`}
        >
          <use href={`#${LAGE_SYMBOL[e.symbol]}`} />
        </svg>
        <div>
          <span className="eyebrow">{t("Was passiert hier?")}</span>
          <h2 aria-live="polite">{e.titel}</h2>
          <p>{e.unter}</p>
        </div>
      </div>
      <div>
        <div className="dist">
          {LAGEN.filter((l) => e.verteilung[l]).map((l) => (
            <span
              key={l}
              style={{ flexGrow: e.verteilung[l], background: lageFarbe(l) }}
              title={e.verteilung[l] === 1 ? t("{lage}: 1 Jahr", { lage: lageName(l) }) : t("{lage}: {n} Jahre", { lage: lageName(l), n: e.verteilung[l] })}
            />
          ))}
        </div>
        <div className="dist-legend">
          {LAGEN.filter((l) => e.verteilung[l]).map((l) => (
            <span key={l}>
              <i style={{ background: lageFarbe(l) }} />
              {lageName(l)} <b>{e.verteilung[l]}</b> {e.verteilung[l] === 1 ? t("Jahr") : t("Jahre")}
            </span>
          ))}
        </div>
      </div>
      <div className="facts">
        {fakten.map(([l, v, u, grob]) => (
          <div className="fact" key={l}>
            <span>
              {l}
              {grob && <span className="grob">{t("grob")}</span>}
            </span>
            <b>{v}</b>
            <small>{u}</small>
          </div>
        ))}
      </div>
      <h3 className="sub-h">
        {e.treiber.length
          ? e.treiber.length > 1
            ? t("Was es antreibt, jeweils einzeln gerechnet")
            : t("Was es antreibt")
          : t("Was hier fortgeschrieben wird")}
      </h3>
      {e.treiber.length === 0 ? (
        <p className="basis-note">
          {t("Das ist die")} <b>{t("Basislinie")}</b>
          {t(": heutige Politik, unverändert weitergeführt. Dreh an einem Regler oder übernimm unten einen der Wege zu mehr Wohlstand.")}
        </p>
      ) : (
        <div className="drivers">
          {e.treiber.map((x) => (
            <div className="driver" key={x.id}>
              <div className="top">
                <b>{x.name}</b>
                <span className="val-chip">{x.wert}</span>
              </div>
              <p>{t("Wirkt über {kanal}.", { kanal: x.kanal })}</p>
              <div className="pills">
                <span className={`pill ${x.pc >= 0 ? "good" : "bad"}`}>
                  {t("Ökonomischer Wohlstand {vz}{wert} %", { vz: x.pc >= 0 ? "+" : "−", wert: fmt(Math.abs(x.pc), 1) })}
                </span>
                <span className={`pill ${x.d <= 0 ? "good" : "bad"}`}>
                  {t("Schuld {vz}{wert} Pkt.", { vz: x.d >= 0 ? "+" : "−", wert: fmt(Math.abs(x.d), 0) })}
                </span>
                <span className="pill">{t("bis {jahr}", { jahr: x.jahr })}</span>
              </div>
              <div className="meter" aria-hidden="true">
                <i style={{ width: `${(Math.abs(x.pc) / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
      {reg && (
        <>
          <h3 className="sub-h">{t("Was die Regierung von selbst getan hat")}</h3>
          <div className="drivers">
            <div className="driver politik-karte">
              <div className="top">
                <b>{reg.name}</b>
                <span className="val-chip">{reg.wert}</span>
              </div>
              <p>{t("Wirkt über {kanal}.", { kanal: reg.kanal })}</p>
              <div className="pills">
                <span className={`pill ${reg.pc >= 0 ? "good" : "bad"}`}>
                  {t("Ökonomischer Wohlstand {vz}{wert} %", { vz: reg.pc >= 0 ? "+" : "−", wert: fmt(Math.abs(reg.pc), 1) })}
                </span>
                <span className={`pill ${reg.d <= 0 ? "good" : "bad"}`}>
                  {t("Schuld {vz}{wert} Pkt.", { vz: reg.d >= 0 ? "+" : "−", wert: fmt(Math.abs(reg.d), 0) })}
                </span>
                <span className="pill">{t("bis {jahr}", { jahr: reg.jahr })}</span>
              </div>
              <ul className="politik-liste">
                {ereignisse.slice(0, 8).map((e) => (
                  <li key={`${e.jahr}-${e.art}-${e.ausloeser ?? ""}`}>
                    {ereignisText(e)}
                    {/* Spec 13.13: umgeschaltete Punkte sagen, was die Regel gewählt hätte. */}
                    {e.art === "entscheidung" && e.vorwahl && e.motiv !== e.vorwahl && (
                      <em> {t("(von dir gewählt statt der wahrscheinlichen Entscheidung („{name}“))", { name: optionName(e.ausloeser ?? "schwaeche", e.vorwahl) })}</em>
                    )}
                  </li>
                ))}
                {ereignisse.length > 8 && <li>{t("und {n} weitere", { n: ereignisse.length - 8 })}</li>}
              </ul>
            </div>
          </div>
        </>
      )}
      {rettungen.length > 0 && (
        <p className="basis-note">
          {t("Bankenrettung: {liste}. Der Staat übernimmt zusammen {summe} % BIP als neue Schuld.", {
            liste: rettungen.slice(0, 6).map((z) => `${z.jahr} (${fmt(z.rettung, 1)} %)`).join(", ") + (rettungen.length > 6 ? " …" : ""),
            summe: fmt(rettungen.reduce((a, z) => a + z.rettung, 0), 1),
          })}
        </p>
      )}
      {sim.sz.schocks.length > 0 && (
        <div className="shock-chips">
          {[...sim.sz.schocks]
            .sort((a, b) => a.jahr - b.jahr)
            .map((s) => (
              <span className="pill bad" key={s.id}>
                {sName(s.art)} {s.jahr}
              </span>
            ))}
        </div>
      )}
    </section>
  );
}
