import { useMemo, useState } from "react";
import { fmt, formatStell } from "../../modell/format";
import { MASSE, type MassId } from "../../modell/masse";
import { aktuell, bewertePakete, pText } from "../../modell/pakete";
import { t } from "../../modell/sprache";
import { eintrag, vName } from "../../modell/verzeichnis";
import type { Sim } from "../simulation";
import { MassListe } from "./MassListe";

export function Wege({ sim }: { sim: Sim }) {
  // Spec 13.13: Wonach gereiht wird, wählt die Nutzerin. Vorgabe bleibt der ökonomische Wohlstand, dort
  // wie bisher nur Pakete mit spürbarem Zuwachs.
  const [nach, setNach] = useState<MassId>("wohlstand");
  const liste = useMemo(
    () => bewertePakete(sim.land, sim.sz, sim.verlauf, nach === "wohlstand" ? undefined : nach),
    [sim.land, sim.sz, sim.verlauf, nach],
  );
  return (
    <section className="card" aria-label={t("Wege zu mehr Wohlstand")}>
      <div className="wege-head">
        <div>
          <h2>{t("Wege zu mehr Wohlstand")}</h2>
          <p>
            {nach === "wohlstand"
              ? t("Politikpakete, jeweils auf dein aktuelles Szenario gerechnet. Hier stehen die drei, die den ökonomischen Wohlstand pro Kopf am stärksten heben, jeweils mit ihrem Preis.")
              : t("Politikpakete, jeweils auf dein aktuelles Szenario gerechnet. Hier stehen die drei mit dem niedrigsten Wert bei „{mass}“, jeweils mit ihrem Preis. Welcher Maßstab zählt, entscheidest du.", { mass: t(MASSE.find((m) => m.id === nach)!.name) })}
          </p>
        </div>
        <div className="field wege-wahl">
          <label htmlFor="wege-nach">{t("Reihen nach")}</label>
          <select id="wege-nach" value={nach} onChange={(ev) => setNach(ev.target.value as MassId)}>
            {MASSE.map((m) => (
              <option key={m.id} value={m.id}>
                {t(m.name)}
              </option>
            ))}
          </select>
        </div>
      </div>
      {sim.uebernommen.length > 0 && (
        <div className="undo" aria-label={t("Übernommene Pakete")}>
          <p>
            {t("Übernommen. Die Regler links zeigen die neuen Werte; jedes Paket lässt sich einzeln zurücknehmen.")}
          </p>
          <ul>
            {sim.uebernommen.map((u) => (
              <li key={u.nr}>
                <span>{t("„{titel}“", { titel: u.titel })}</span>
                <button
                  type="button"
                  aria-label={t("„{titel}“ zurücknehmen", { titel: u.titel })}
                  onClick={() => sim.nimmZurueck(u.nr)}
                >
                  {t("Zurücknehmen")}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="wege">
        {liste.length === 0 && (
          <p className="wege-empty">
            {nach === "wohlstand"
              ? t("Keines der Pakete hebt den ökonomischen Wohlstand pro Kopf in deinem Szenario noch spürbar. Die Hebel sind schon weit gedreht.")
              : t("Keines der Pakete ändert in deinem Szenario noch etwas. Die Hebel sind schon weit gedreht.")}
          </p>
        )}
        {liste.map((b) => (
          <article className="wege-card" key={b.paket.id}>
            <span className="badge">{pText(b.paket, "baustein")}</span>
            <h3>{pText(b.paket, "titel")}</h3>
            <p className="masse-titel">{t("Wirkung bis {jahr}, gegen dein aktuelles Szenario", { jahr: b.jahr })}</p>
            <MassListe masse={b.masse} aktiv={nach} />
            {b.krise !== 0 && (
              <div className="pills">
                <span className={`pill ${b.krise < 0 ? "good" : "bad"}`}>
                  {t("{vz}{n} Krisenjahre", { vz: b.krise < 0 ? "−" : "+", n: Math.abs(b.krise) })}
                </span>
              </div>
            )}
            <dl>
              <div>
                <dt>{t("Warum es wirkt")}</dt>
                <dd>{pText(b.paket, "warum")}</dd>
              </div>
              <div>
                <dt>{t("Der Preis")}</dt>
                <dd>{pText(b.paket, "preis")}</dd>
              </div>
            </dl>
            <div className="changes">
              {b.geaendert.map((id) => {
                const e = eintrag(id);
                return (
                  <span key={id}>
                    {vName(e)}: {formatStell(e, aktuell(sim.land, sim.sz, id))} →{" "}
                    {formatStell(e, b.aenderung.stell[id])}
                  </span>
                );
              })}
              {b.aenderung.grund?.rentensystem && (
                <span>
                  {t("Rentensystem")} →{" "}
                  {b.aenderung.grund.rentensystem === "mischung"
                    ? t("Mischung")
                    : t("Kapitaldeckung")}
                </span>
              )}
            </div>
            <span className="src">{t("Quelle: {quelle}", { quelle: b.paket.quelle })}</span>
            <button
              type="button"
              onClick={() => {
                sim.uebernehme(b.aenderung, pText(b.paket, "titel"));
                document
                  .querySelector(".weather")
                  ?.scrollIntoView({ behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
              }}
            >
              {t("Übernehmen und ansehen")}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
