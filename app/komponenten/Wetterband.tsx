import { motion } from "motion/react";
import { useEffect, useState, type CSSProperties } from "react";
import { LAGEN } from "../../modell/lage";
import { ereignisText, schluessel } from "../../modell/politik";
import type { PolitikEreignis } from "../../modell/politik-modus";
import { lageName } from "../../modell/reihen";
import { t } from "../../modell/sprache";
import { SCHOCKS, sName, sText } from "../../modell/schocks";
import type { SchockArt } from "../../modell/typen";
import { fmt } from "../../modell/format";
import { useBewegung } from "../bewegung";
import { LAGE_SYMBOL, lageFarbe } from "../lage-darstellung";
import type { Sim } from "../simulation";
import { Entscheidung } from "./Entscheidung";

// Eingabe mit Entwurf: Tippen ist frei, übernommen wird beim Verlassen oder mit Enter.
function JahrFeld(props: { wert: number; min: number; max: number; label: string; setze(j: number): void }) {
  const [entwurf, setEntwurf] = useState<string | null>(null);
  const uebernehmen = () => {
    if (entwurf === null) return;
    const j = Math.round(Number(entwurf));
    if (Number.isFinite(j) && j >= props.min && j <= props.max) props.setze(j);
    setEntwurf(null);
  };
  return (
    <input
      type="number"
      min={props.min}
      max={props.max}
      value={entwurf ?? props.wert}
      aria-label={props.label}
      onChange={(ev) => setEntwurf(ev.target.value)}
      onBlur={uebernehmen}
      onKeyDown={(ev) => {
        if (ev.key === "Enter") uebernehmen();
      }}
    />
  );
}

export function Wetterband({ sim }: { sim: Sim }) {
  const { verlauf, idx, land, sz } = sim;
  const cur = verlauf[idx];
  // Das Startjahr ist gemessen, nicht gerechnet: Schocks wirken frühestens im Folgejahr.
  const schockJahr = land.datenstand + Math.max(1, idx);
  const bewegt = useBewegung();
  const [laeuft, setLaeuft] = useState(false);
  useEffect(() => {
    if (!laeuft) return;
    const letzte = sim.verlauf.length - 1;
    const id = setInterval(() => sim.setIdx((i) => Math.min(letzte, i + 1)), 200);
    return () => clearInterval(id);
  }, [laeuft, sim.verlauf.length]);
  const n = verlauf.length;
  useEffect(() => {
    if (laeuft && idx >= n - 1) setLaeuft(false);
  }, [laeuft, idx, n]);
  const heute = new Date().getFullYear() - land.datenstand;
  const schritt = n > 60 ? 20 : n > 30 ? 10 : 5;
  const achse = verlauf
    .filter((_, i) => i % schritt === 0)
    .map((z) => <span key={z.jahr}>{z.jahr}</span>);
  // Eingriffe der Regierung (Spec 13.10), eine Marke je Ereignis.
  const politik = verlauf.flatMap((z) => z.politik);
  // Spec 13.13: Ein Entscheidungspunkt zur Zeit ist geöffnet. Gibt es ihn nach einer Änderung nicht
  // mehr, schließt die Karte von selbst.
  const [offen, setOffen] = useState<string | null>(null);
  const punktKey = (e: PolitikEreignis) => (e.art === "entscheidung" ? schluessel(e.jahr, e.ausloeser ?? "schwaeche") : null);
  const offenerPunkt = offen === null ? undefined : politik.find((e) => punktKey(e) === offen);
  // Verschwindet der Punkt, vergisst die Karte ihn (sonst öffnete sie sich später ungefragt wieder).
  useEffect(() => {
    if (offen !== null && !offenerPunkt) setOffen(null);
  }, [offen, offenerPunkt]);
  const ZEICHEN = { schwaeche: "↘", eng: "§", ruecknahme: "↺", risiko: "!" } as const;
  const links = (i: number) => `${((i + 0.5) / n) * 100}%`;
  // Bankenrettungen (Spec 13.6), eine Marke je Jahr.
  const rettungen = verlauf.filter((z) => z.rettung > 0);
  const rettungText = (jahr: number, x: number) => t("{jahr}: Banken brauchen Hilfe, der Staat zahlt {x} % BIP.", { jahr, x: fmt(x, 1) });

  return (
    <section className="card" aria-label={t("Wetterlage")}>
      <div className="weather">
        <div className="now">
          <svg
            viewBox="0 0 100 100"
            aria-hidden="true"
            className={`wetter wetter-${cur.lage}`}
          >
            <use href={`#${LAGE_SYMBOL[cur.lage]}`} />
          </svg>
          <div>
            <div className="yr" aria-label={t("Gewähltes Jahr")}>
              {cur.jahr}
            </div>
            <div className={`state${lageName(cur.lage).length > 12 ? " lang" : ""}`}>
              <span
                style={{
                  background: `color-mix(in srgb, ${lageFarbe(cur.lage)} 30%, transparent)`,
                }}
              >
                {lageName(cur.lage)}
              </span>
            </div>
          </div>
        </div>
        <div className="band-wrap">
          {heute >= 0 && heute < n && (
            <span className="today" style={{ left: links(heute) }}>
              {t("heute")}
            </span>
          )}
          <div className="shock-row">
            {sz.schocks.filter((s) => s.jahr < land.datenstand + n).map((s) => (
              <motion.button
                key={s.id}
                type="button"
                initial={bewegt ? { y: -18, opacity: 0 } : false}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 420, damping: 22 }}
                style={{ left: links(s.jahr - land.datenstand) }}
                aria-label={t("Zu {name} {jahr} springen", { name: sName(s.art), jahr: s.jahr })}
                title={`${sName(s.art)} ${s.jahr}`}
                onClick={() => sim.setIdx(s.jahr - land.datenstand)}
              >
                <svg viewBox="0 0 24 24">
                  <use href={`#i-${s.art}`} />
                </svg>
              </motion.button>
            ))}
          </div>
          {politik.length > 0 && (
            <div className="politik-row" aria-label={t("Eingriffe der Regierung")}>
              {politik.map((e) => {
                const key = punktKey(e);
                const umgeschaltet = e.art === "entscheidung" && e.motiv !== e.vorwahl;
                const text = ereignisText(e) + (umgeschaltet ? t(", von dir gewählt") : "");
                return (
                  <button
                    key={`${e.jahr}-${e.art}-${e.ausloeser ?? ""}`}
                    type="button"
                    className={`politik-${e.art}${e.motiv ? ` politik-${e.motiv}` : ""}${umgeschaltet ? " umgeschaltet" : ""}`}
                    style={{ left: links(e.jahr - land.datenstand) }}
                    aria-label={text}
                    aria-expanded={key ? offen === key : undefined}
                    aria-controls={key && offen === key ? "entscheidung-karte" : undefined}
                    title={text}
                    onClick={() => {
                      sim.setIdx(e.jahr - land.datenstand);
                      if (key) setOffen(offen === key ? null : key);
                    }}
                  >
                    {e.art === "entscheidung" ? ZEICHEN[e.ausloeser ?? "schwaeche"] : ZEICHEN[e.art]}
                  </button>
                );
              })}
            </div>
          )}
          {rettungen.length > 0 && (
            <div className="politik-row rettung-row" aria-label={t("Bankenrettungen")}>
              {rettungen.map((z) => (
                <button
                  key={z.jahr}
                  type="button"
                  style={{ left: links(z.jahr - land.datenstand) }}
                  aria-label={rettungText(z.jahr, z.rettung)}
                  title={rettungText(z.jahr, z.rettung)}
                  onClick={() => sim.setIdx(z.jahr - land.datenstand)}
                >
                  {land.waehrung.symbol.slice(-1)}
                </button>
              ))}
            </div>
          )}
          <div
            className="band"
            aria-label={t("Lage je Jahr")}
            style={{ "--n": n, gap: n > 60 ? "1px" : "2px" } as CSSProperties}
          >
            {verlauf.map((z, i) => (
              <button
                key={z.jahr}
                type="button"
                aria-label={`${z.jahr}: ${lageName(z.lage)}`}
                aria-current={i === idx}
                style={{ background: lageFarbe(z.lage), transitionDelay: bewegt ? `${i * 8}ms` : "0ms" }}
                onClick={() => sim.setIdx(i)}
              />
            ))}
          </div>
          <div className="band-axis">{achse}</div>
          <div className="zeit-zeile">
            <button
              type="button"
              className="play"
              aria-pressed={laeuft}
              aria-label={laeuft ? t("Zeitraffer anhalten") : t("Zeitraffer starten")}
              onClick={() => {
                if (!laeuft && idx >= n - 1) sim.setIdx(0);
                setLaeuft(!laeuft);
              }}
            >
              {laeuft ? "❚❚" : "▶"}
            </button>
            <input
              type="range"
              id="jahr"
              min={0}
              max={n - 1}
              step={1}
              value={idx}
              aria-label={t("Jahr wählen")}
              style={{ "--fill": `${(idx / (n - 1)) * 100}%` } as CSSProperties}
              onChange={(ev) => sim.setIdx(Number(ev.target.value))}
            />
          </div>
        </div>
      </div>
      {offenerPunkt && <Entscheidung sim={sim} e={offenerPunkt} />}
      <div className="legend">
        {LAGEN.map((l) => (
          <span key={l}>
            <i style={{ background: lageFarbe(l) }} />
            {lageName(l)}
          </span>
        ))}
      </div>
      <p className="hinweis">
        {t("Boom, Rezession, Stagflation und Deflation entstehen vor allem durch Schocks und starke Eingriffe.")}
      </p>
      <div className="shock-actions">
        {(Object.keys(SCHOCKS) as SchockArt[]).map((art) => (
          <button
            key={art}
            type="button"
            title={sText(art)}
            onClick={() => sim.schockHinzu(art)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <use href={`#i-${art}`} />
            </svg>
            {t("{name} in {jahr}", { name: sName(art), jahr: schockJahr })}
          </button>
        ))}
      </div>
      <div className="shock-list" aria-label={t("Gesetzte Schocks")}>
        {[...sz.schocks]
          .sort((a, b) => a.jahr - b.jahr)
          .map((s) => (
            <span className="shock-item" key={s.id}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <use href={`#i-${s.art}`} />
              </svg>
              {sName(s.art)}
              {s.jahr >= land.datenstand + n && <small> {t("(außerhalb des Zeitraums)")}</small>}
              <JahrFeld
                wert={s.jahr}
                min={land.datenstand + 1}
                max={land.datenstand + n - 1}
                label={t("Jahr {name}", { name: sName(s.art) })}
                setze={(j) => sim.schockJahr(s.id, j)}
              />
              <select aria-label={t("Stärke {name}", { name: sName(s.art) })} value={s.staerke}
                onChange={(ev) => sim.schockSetze(s.id, { staerke: Number(ev.target.value) })}>
                {[0.5, 1, 1.5, 2, 3].map((v) => <option key={v} value={v}>×{fmt(v, v % 1 ? 1 : 0)}</option>)}
              </select>
              <select aria-label={t("Dauer {name}", { name: sName(s.art) })} value={s.dauer}
                onChange={(ev) => sim.schockSetze(s.id, { dauer: Number(ev.target.value) })}>
                {[1, 1.5, 2, 3].map((v) => <option key={v} value={v}>{t("{n}× so lang", { n: fmt(v, v % 1 ? 1 : 0) })}</option>)}
              </select>
              <button
                type="button"
                className="x"
                aria-label={t("{name} {jahr} entfernen", { name: sName(s.art), jahr: s.jahr })}
                onClick={() => sim.schockWeg(s.id)}
              >
                ×
              </button>
            </span>
          ))}
      </div>
      <p className="shock-hint">
        {t("Neue Schocks landen im gewählten Jahr. Das Jahr lässt sich in der Liste ändern, × entfernt den Schock. Mit der Maus auf einen Knopf zeigen, um zu sehen, was er auslöst.")}
      </p>
    </section>
  );
}
