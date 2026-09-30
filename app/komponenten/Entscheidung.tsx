import { useMemo } from "react";
import { bewerteOptionen } from "../../modell/auswertung";
import { bewertePaket, bewertePakete, PAKETE, pText } from "../../modell/pakete";
import type { PolitikEreignis } from "../../modell/politik-modus";
import { t } from "../../modell/sprache";
import type { Sim } from "../simulation";
import { MassListe } from "./MassListe";

// Spec 13.13: Ein Entscheidungspunkt der Regierung mit drei Optionen. Die Regel wählt vor; hier lässt
// sich umschalten. Keine Parteien, keine Richtungsnamen: Die Karten heißen nach dem, was sie tun.
export function Entscheidung({ sim, e }: { sim: Sim; e: PolitikEreignis }) {
  const { land, sz, verlauf } = sim;
  const a = e.ausloeser ?? "schwaeche";
  // Drei Läufe, erst beim Öffnen der Karte.
  const optionen = useMemo(() => bewerteOptionen(land, sz, e), [land, sz, e.jahr, a]);
  // Die sachliche Lösung daneben: bei Schwäche das Paket mit dem größten Zuwachs, bei engem Haushalt
  // das Paket „Staatshaushalt entlasten“. Gerechnet gegen das aktuelle Szenario.
  const paket = useMemo(
    () => (a === "schwaeche" ? (bewertePakete(land, sz, verlauf)[0] ?? null) : bewertePaket(land, sz, verlauf, PAKETE.find((p) => p.id === "haushalt")!)),
    [land, sz, verlauf, a],
  );
  const titel = t("{jahr}: Die Regierung muss entscheiden", { jahr: e.jahr });
  const umgeschaltet = e.motiv !== e.vorwahl;
  return (
    <section className="entscheidung" id="entscheidung-karte" role="region" aria-label={titel}>
      <div className="entscheidung-kopf">
        <h3>{titel}</h3>
        <p>
          {a === "schwaeche" ? t("Die Wirtschaft ist seit Jahren schwach.") : t("Der Haushalt ist eng.")}{" "}
          {t("Drei Möglichkeiten. Die Zahlen zeigen den Unterschied bis {jahr} gegen die wahrscheinliche Entscheidung.", { jahr: land.datenstand + sz.jahre - 1 })}
        </p>
      </div>
      <div className="optionen">
        {optionen.map((o) => {
          const gewaehlt = o.motiv === e.motiv;
          return (
            <article key={o.motiv} className={`option${gewaehlt ? " gewaehlt" : ""}${o.moeglich ? "" : " gesperrt"}`}>
              {o.motiv === e.vorwahl && <span className="badge">{t("So entscheidet Politik wahrscheinlich")}</span>}
              <h4>{o.name}</h4>
              <p className="was">{o.moeglich ? o.beschreibung.replace(/^\d{4}: /, "") : o.grund}</p>
              {o.moeglich && <MassListe masse={o.masse} />}
              <dl className="folgen">
                <div>
                  <dt>{t("Wer zahlt")}</dt>
                  <dd>{o.zahlt}</dd>
                </div>
                <div>
                  <dt>{t("Was es später kostet")}</dt>
                  <dd>{o.spaeter}</dd>
                </div>
              </dl>
              {/* Die gewählte Karte bleibt fokussierbar (aria-disabled statt disabled), damit der Fokus nach der
                  Wahl nicht verloren geht. */}
              <button
                type="button"
                disabled={!o.moeglich}
                aria-disabled={gewaehlt || undefined}
                aria-pressed={gewaehlt}
                onClick={() => {
                  if (!gewaehlt) sim.setzeWahl(e.jahr, a, o.motiv === e.vorwahl ? null : o.motiv);
                }}
              >
                {gewaehlt ? t("Gewählt") : t("Diese Option wählen")}
              </button>
            </article>
          );
        })}
      </div>
      {umgeschaltet && (
        <button type="button" className="zurueck" onClick={() => sim.setzeWahl(e.jahr, a, null)}>
          {t("Zurück zur wahrscheinlichen Entscheidung")}
        </button>
      )}
      {paket && (
        <div className="sachlich">
          <p>
            {t("Sachlich brächte das Paket „{titel}“ bis {jahr}, gegen dein aktuelles Szenario:", { titel: pText(paket.paket, "titel"), jahr: paket.jahr })}
          </p>
          <MassListe masse={paket.masse} />
          <p className="hinweis">{t("Die Pakete stehen unten bei „Wege zu mehr Wohlstand“. Nur du kannst sie übernehmen; die Regierung wählt sie nicht.")}</p>
        </div>
      )}
    </section>
  );
}
