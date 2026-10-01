import { useState } from "react";
import { struktur } from "../../modell/eingriffe";
import { fmt } from "../../modell/format";
import { standardWert } from "../../modell/kontext";
import { KRITIK, kBehebung, kText, kTitel, kWirkung, type Bereich } from "../../modell/kritik";
import { t, tk } from "../../modell/sprache";
import type { BausteinId, Landesdaten, SchaetzGroesse, Schaetzwert } from "../../modell/typen";
import { eintrag, VERZEICHNIS, vEinheit, vErklaerung, vName } from "../../modell/verzeichnis";
import type { Sim } from "../simulation";

const BLOECKE: [BausteinId, string][] = [
  ["demografie", "Demografie und Migration"],
  ["ordnung", "Wirtschaftsordnung"],
  ["energie", "Energie und Rohstoffe"],
  ["innovation", "Innovation"],
  ["wachstum", "Wachstum"],
  ["privatschuld", "Privatschuld"],
  ["geld", "Geld und Zins"],
  ["staat", "Staat, Steuern, Rente"],
  ["anleihen", "Anleihen"],
  ["handel", "Handel und Währung"],
  ["banken", "Häuser und Banken"],
  ["zufall", "Zufallsschocks"],
];
const STRUKTUR_WORT = {
  sozial: "ausgebauter Sozialstaat",
  energie: "Energieimporteur",
  handel: "Handelsdefizit",
  markt: "keine ausgeprägte Struktur",
};

// Spec 13.13: Wie die Regierung im Modell entscheidet. Werte und Quellen aus dem Verzeichnis.
function PolitikRegeln({ sim }: { sim: Sim }) {
  const land = sim.land;
  const p = (id: string) => standardWert(id, land);
  const q = (id: string) => eintrag(id).quelle;
  const pol = land.politik;
  const titel = t("So entscheidet die Regierung im Modell");
  const zeilen: [string, string, string, string][] = [
    [t("Zu spät"), t("Eine unbequeme Entscheidung fällt erst, wenn die Schwäche lange anhält. Schwächere Regierungen warten länger."), t("bis zu {n} Jahre zusätzlich", { n: fmt(p("politik.verspaetung"), 0) }), q("politik.verspaetung")],
    [t("Verwässert"), t("Beschlossen wird nur ein Teil des Pakets. Eine wirksame Regierung setzt mehr um."), t("{von} bis {bis} % des Pakets", { von: fmt(p("politik.umsetzungMin") * 100, 0), bis: fmt((p("politik.umsetzungMin") + p("politik.umsetzungSpanne")) * 100, 0) }), q("politik.umsetzungMin")],
    [t("Sperrklinke"), t("Ausgaben, die in Krisen oder durch Eingriffe steigen, fallen nicht ganz zurück. Kürzungen an Rente und Lohnersatz gehen halb so schnell."), t("{x} % der Mehrausgaben bleiben", { x: fmt(p("politik.sperrklinke") * 100, 0) }), q("politik.sperrklinke")],
    [t("Defizit-Neigung"), t("Geben ist leichter als nehmen. Das Geld kommt über einen wenig sichtbaren Hebel zurück: schleichend höhere Steuern und Abgaben, aufgeschobene Investitionen."), t("Steuersatz +{x} Punkte je Jahr", { x: fmt(p("politik.kalteProgression") * 100, 1) }), q("politik.kalteProgression")],
    [t("Wahltakt"), t("Im Wahljahr und im Jahr davor fällt keine unbequeme Entscheidung. Der nächste Entscheidungspunkt liegt im Jahr nach der Wahl."), t("zusätzliche Ausgaben im Wahljahr: {x} % BIP", { x: fmt(p("politik.wahljahr"), 1) }), q("politik.wahljahr")],
    [t("Großprogramme"), t("Ab und zu legt die Regierung ein großes Programm auf, das zur Struktur des Landes passt. Seine Kosten bleiben."), t("{x} % BIP, dauerhaft", { x: fmt(p("politik.programm"), 0) }), q("politik.programm")],
  ];
  return (
    <section className="card politik-regeln" role="region" aria-label={titel}>
      <h2>{titel}</h2>
      <p className="lead">
        {t("Die Regierung im Modell wählt nicht die beste Lösung. An jedem Punkt hat sie drei Möglichkeiten: die bequeme, die zur Struktur des Landes passende und die unbequeme.")}
      </p>
      <p>
        {t("Ein Entscheidungspunkt entsteht, wenn die Wirtschaft in drei der letzten fünf Jahre schwach war oder der Haushalt zwei Jahre eng ist. Der Druck wächst mit Dauer und Stärke: schwache Jahre, Arbeitslosigkeit, fehlender Spielraum, Zinslast. Die unbequeme Entscheidung fällt erst, wenn Druck mal Wirksamkeit der Regierung die Schwelle erreicht; im Wahljahr und im Jahr davor nie. Dann oder nach einer Krise wählt die Regierung die bequeme Möglichkeit, sonst die, die zur Struktur des Landes passt.")}
      </p>
      <div className="chart-box">
        <table className="vtab links">
          <thead>
            <tr>
              <th scope="col">{t("Verzerrung")}</th>
              <th scope="col">{t("Im Modell")}</th>
              <th scope="col">{t("Wert")}</th>
              <th scope="col">{t("Quelle")}</th>
            </tr>
          </thead>
          <tbody>
            {zeilen.map(([name, text, wert, quelle]) => (
              <tr key={name}>
                <th scope="row">{name}</th>
                <td>{text}</td>
                <td>{wert}</td>
                <td>{quelle}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h3>{t("{land}: Daten für die Regel", { land: t(land.name) })}</h3>
      <ul>
        <li>
          {t("Wirksamkeit der Regierung: {x} von 100 (Weltbank, Government Effectiveness).", { x: fmt(pol?.wirksamkeit ?? 70, 0) })}{" "}
          {pol ? "" : t("Für dieses Land liegt kein Wert vor; das Modell rechnet mit 70.")}
        </li>
        <li>
          {pol
            ? t("Legislatur {n} Jahre, letzte Wahl {jahr}.", { n: pol.legislatur, jahr: pol.letzteWahl })
            : t("Kein Wahltakt hinterlegt.")}{" "}
          {pol && pol.takt <= 0 ? t("Der Wahltakt wirkt in diesem Land nicht.") : ""}
        </li>
        <li>{t("Struktur: {wort}. Danach richten sich die großen Programme und die Lastenverteilung.", { wort: t(STRUKTUR_WORT[struktur(land, sim.sz)]) })}</li>
      </ul>
      <h3>{t("Grenzen")}</h3>
      <p>
        {t("Keine Parteien und keine Wahlausgänge: Die Verzerrungen gelten für jede Regierung. Der Wahltakt ist fest, vorgezogene Wahlen gibt es nicht. Die Regeln kennen keinen Zufall: Dasselbe Land in derselben Lage entscheidet immer gleich. Die Wahltermine und die Größen der Verzerrungen sind Setzungen; die Quellen nennen die Richtung, nicht den Wert.")}
      </p>
    </section>
  );
}

// Wirkstärke ohne überflüssige Nachkommanullen (0,800 → 0,8; 0,000 → 0).
const zahl = (x: number) => fmt(x, 3).replace(/0+$/, "").replace(/[,.]$/, "");

const BELEG = {
  lehrbuch: "Lehrbuch",
  studie: "Studie",
  kalibriert: "an Daten kalibriert",
};
const QUALITAET = { gruen: "gut", gelb: "eingeschränkt", rot: "schwach" };
const BEREICHE: Bereich[] = [
  "Daten",
  "Mechanik und Wirkstärken",
  "Demografie",
  "Oberfläche und Darstellung",
  "Tests",
];

// Spec 13.1: Startwerte aus dem Kalman-Filter mit Band, Rückfall auf Handwerte.
const SCHAETZ_NAMEN: Record<SchaetzGroesse, [string, string]> = {
  tfpTrend: ["Produktivitätstrend", "% pro Jahr"],
  nairu: ["Strukturelle Arbeitslosigkeit (NAIRU)", "%"],
  rStern: ["Neutraler Realzins", "%"],
  luecke: ["Produktionslücke im Startjahr", "% des Potenzials"],
};

function schaetzQuelle(w: Schaetzwert): string {
  const band = t("geschätzt, Kalman, ±{band}", { band: fmt(w.band, 1) });
  if (w.genutzt)
    return w.hp === undefined ? band : `${band} · ${t("HP-Gegenprobe {hp}", { hp: fmt(w.hp, 1) })}`;
  if (w.gueltig && (w.groesse === "rStern" || w.groesse === "luecke"))
    return `${band} · ${t("zur Information, das Modell nutzt hier eigene Werte (siehe D12)")}`;
  if (w.bestaetigt && w.handwert !== undefined)
    return t("Handwert {wert} · im Band der Schätzung ({schaetzung} ±{band}), bestätigt", {
      wert: fmt(w.handwert, 1),
      schaetzung: fmt(w.wert, 1),
      band: fmt(w.band, 1),
    });
  const hand = w.handwert === undefined ? "" : `${t("Handwert {wert}", { wert: fmt(w.handwert, 1) })} · `;
  return `${hand}${t("Schätzung verworfen: {grund}", { grund: w.grund ?? "" })}`;
}

export function GeschaetzteStartwerte({ schaetzung }: { schaetzung: NonNullable<Landesdaten["schaetzung"]> }) {
  return (
    <>
      <h3>{t("Geschätzte Startwerte")}</h3>
      <p>
        {schaetzung.hinweis && <>{schaetzung.hinweis}. </>}
        {t("Die Bänder sind eine Standardabweichung. 25 Jahreswerte sind wenig; die Varianzen sind Annahmen (Quellen).")}
      </p>
      {schaetzung.werte.length > 0 && (
        <div className="chart-box">
          <table className="vtab links">
            <thead>
              <tr>
                <th scope="col">{t("Größe")}</th>
                <th scope="col">{t("Wert")}</th>
                <th scope="col">{t("Quelle")}</th>
              </tr>
            </thead>
            <tbody>
              {schaetzung.werte.map((w) => {
                const [name, einheit] = SCHAETZ_NAMEN[w.groesse];
                const nurAnzeige = w.gueltig && (w.groesse === "rStern" || w.groesse === "luecke");
                const wert = w.genutzt || nurAnzeige ? w.wert : (w.handwert ?? w.wert);
                return (
                  <tr key={w.groesse}>
                    <td>{t(name)}</td>
                    <td>
                      {fmt(wert, 2)} {t(einheit)}
                    </td>
                    <td>{schaetzQuelle(w)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export function Annahmen({ sim }: { sim: Sim }) {
  const [bereich, setBereich] = useState<Bereich | "alle">("alle");
  const punkte = KRITIK.filter(
    (k) =>
      !k.erledigt &&
      (bereich === "alle" || k.bereich === bereich) &&
      (!k.laender || k.laender.includes(sim.land.code)),
  );
  const wert = (id: string) =>
    sim.land.standards[id] ?? VERZEICHNIS.find((e) => e.id === id)!.standard;
  return (
    <>
      <PolitikRegeln sim={sim} />

      <section className="card" aria-label={t("Kritikpunkte")}>
        <h2>{t("Annahmen und Kritikpunkte")}</h2>
        <p className="lead">
          {t("Das Modell benennt seine Schwächen offen. Jeder Punkt sagt, wie stark er die Ergebnisse verzerrt und wie er behoben wird. Gezeigt werden die allgemeinen Punkte und die für {land}.", { land: t(sim.land.name) })}
        </p>
        <h3>{t("Was nicht gemessen wird")}</h3>
        <p className="lead">
          {t("Ökonomischer Wohlstand heißt hier reales BIP pro Kopf: der Durchschnitt, nicht was beim Einzelnen ankommt. Zufriedenheit, Lebensqualität und der Zustand der Umwelt misst die App nicht. Wer Pakete danach reiht, wählt selbst einen Maßstab.")}
        </p>
        <div className="more-charts">
          <span>{t("Bereich:")}</span>
          {(["alle", ...BEREICHE] as const).map((b) => (
            <button
              key={b}
              type="button"
              aria-pressed={bereich === b}
              onClick={() => setBereich(b)}
            >
              {b === "alle" ? t("Alle") : t(b)}
            </button>
          ))}
        </div>
        <div className="chart-box">
          <table className="vtab links">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">{t("Unschärfe")}</th>
                <th scope="col">{t("Wirkung")}</th>
                <th scope="col">{t("Behebung")}</th>
              </tr>
            </thead>
            <tbody>
              {punkte.map((k) => (
                <tr key={k.id}>
                  <td>
                    {k.id}
                    {k.laender && ` (${k.laender.join(", ")})`}
                  </td>
                  <td>
                    <b>{kTitel(k)}.</b> {kText(k)}
                  </td>
                  <td>
                    <span
                      className={`bewertung ${k.wirkung.startsWith("hoch") ? "schwach" : k.wirkung.startsWith("mittel") ? "mittel" : "gut"}`}
                    >
                      {kWirkung(k)}
                    </span>
                  </td>
                  <td>{kBehebung(k)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card" aria-label={t("Wirkstärken")}>
        <h2>{t("Wirkstärken und ihre Quellen")}</h2>
        <p className="lead">
          {t("Umstrittene Annahmen lassen sich abschalten. Das zählt als Änderung und erscheint in „Was passiert hier?“ als Treiber.")}
        </p>
        {BLOECKE.map(([b, titel]) => (
          <details className="block" key={b}>
            <summary>{t(titel)}</summary>
            <div className="chart-box">
              <table className="vtab links">
                <thead>
                  <tr>
                    <th scope="col">{t("Annahme")}</th>
                    <th scope="col">{t("Wert")}</th>
                    <th scope="col">{t("Quelle")}</th>
                    <th scope="col">{t("Beleg")}</th>
                    <th scope="col">{t("Ein")}</th>
                  </tr>
                </thead>
                <tbody>
                  {VERZEICHNIS.filter(
                    (e) => e.baustein === b && e.art === "wirkstaerke",
                  ).map((e) => (
                    <tr key={e.id}>
                      <td>
                        {vName(e)}
                        {e.erklaerung && (
                          <>
                            <br />
                            <small>{vErklaerung(e)}</small>
                          </>
                        )}
                      </td>
                      <td>
                        {zahl(wert(e.id))} {vEinheit(e)}
                        {e.spanne && (
                          <>
                            <br />
                            <small>
                              {t("Spanne")} {zahl(e.spanne[0])}–{zahl(e.spanne[1])}
                            </small>
                          </>
                        )}
                      </td>
                      <td>{e.quelle}</td>
                      <td>{e.beleg ? t(BELEG[e.beleg]) : ""}</td>
                      <td>
                        {e.umstritten ? (
                          <input
                            type="checkbox"
                            aria-label={vName(e)}
                            checked={!sim.sz.aus.includes(e.id)}
                            onChange={(ev) =>
                              sim.setzeAus(e.id, !ev.target.checked)
                            }
                          />
                        ) : (
                          <small>{t("fest")}</small>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        ))}
      </section>

      <section className="card" aria-label={t("Datenlage")}>
        <h2>{t("Datenlage")}</h2>
        <p className="lead">
          {t("{land}, Datenstand {jahr}, Datenqualität {q}.", { land: t(sim.land.name), jahr: sim.land.datenstand, q: t(QUALITAET[sim.land.qualitaet]) })}
          {sim.land.markiert.length > 0 && (
            <> {t("Nicht aus dem Datenstand-Jahr: {liste}.", { liste: sim.land.markiert.join(", ") })}</>
          )}
          {(sim.land.start.fondsQuote0 ?? 0) > 0 && (
            <> {t("Rentenreservefonds im Startjahr: {wert} % BIP.", { wert: fmt(sim.land.start.fondsQuote0 ?? 0, 0) })}</>
          )}
          {sim.land.hinweis && <> {tk(`land:${sim.land.code}:hinweis`, sim.land.hinweis)}</>}
        </p>
        <div className="chart-box">
          <table className="vtab links">
            <thead>
              <tr>
                <th scope="col">{t("Reihe")}</th>
                <th scope="col">{t("Quelle")}</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(sim.land.quellen ?? {})
                .filter(([k]) => !k.startsWith("alter"))
                .sort()
                .map(([k, q]) => (
                  <tr key={k}>
                    <td>{k}</td>
                    <td>{q}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {sim.land.schaetzung && <GeschaetzteStartwerte schaetzung={sim.land.schaetzung} />}
      </section>
    </>
  );
}
