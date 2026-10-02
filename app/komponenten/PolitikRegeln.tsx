import { struktur } from "../../modell/eingriffe";
import { fmt } from "../../modell/format";
import { standardWert } from "../../modell/kontext";
import { t } from "../../modell/sprache";
import { eintrag } from "../../modell/verzeichnis";
import type { Sim } from "../simulation";

const STRUKTUR_WORT = {
  sozial: "ausgebauter Sozialstaat",
  energie: "Energieimporteur",
  handel: "Handelsdefizit",
  markt: "keine ausgeprägte Struktur",
};

// Spec 13.13: Wie die Regierung im Modell entscheidet. Werte und Quellen aus dem Verzeichnis.
export function PolitikRegeln({ sim }: { sim: Sim }) {
  const land = sim.land;
  const p = (id: string) => standardWert(id, land);
  const q = (id: string) => eintrag(id).quelle;
  const pol = land.politik;
  const titel = t("Wer dreht an den Stellschrauben?");
  const zeilen: [string, string, string, string][] = [
    [t("Zu spät"), t("Eine unbequeme Entscheidung fällt erst, wenn die Schwäche lange anhält. Schwächere Regierungen warten länger."), t("bis zu {n} Jahre zusätzlich", { n: fmt(p("politik.verspaetung"), 0) }), q("politik.verspaetung")],
    [t("Verwässert"), t("Beschlossen wird nur ein Teil des Pakets. Eine wirksame Regierung setzt mehr um."), t("{von} bis {bis} % des Pakets", { von: fmt(p("politik.umsetzungMin") * 100, 0), bis: fmt((p("politik.umsetzungMin") + p("politik.umsetzungSpanne")) * 100, 0) }), q("politik.umsetzungMin")],
    [t("Sperrklinke"), t("Ausgaben, die in Krisen oder durch Eingriffe steigen, fallen nicht ganz zurück. Kürzungen an Rente und Lohnersatz gehen halb so schnell."), t("{x} % der Mehrausgaben bleiben", { x: fmt(p("politik.sperrklinke") * 100, 0) }), q("politik.sperrklinke")],
    [t("Defizit-Neigung"), t("Geben ist leichter als nehmen. Das Geld kommt über einen wenig sichtbaren Hebel zurück: schleichend höhere Steuern und Abgaben, aufgeschobene Investitionen."), t("Steuersatz +{x} Punkte je Jahr", { x: fmt(p("politik.kalteProgression") * 100, 1) }), q("politik.kalteProgression")],
    [t("Wahltakt"), t("Im Wahljahr und im Jahr davor fällt keine unbequeme Entscheidung. Der nächste Entscheidungspunkt liegt im Jahr nach der Wahl."), t("zusätzliche Ausgaben im Wahljahr: {x} % BIP", { x: fmt(p("politik.wahljahr"), 1) }), q("politik.wahljahr")],
    [t("Großprogramme"), t("Ab und zu legt die Regierung ein großes Programm auf, das zur Struktur des Landes passt. Seine Kosten bleiben."), t("{x} % BIP, dauerhaft", { x: fmt(p("politik.programm"), 0) }), q("politik.programm")],
  ];
  return (
    <section className="card politik-regeln" role="region" aria-label={titel} data-tour="netz-regierung">
      <h2>{titel}</h2>
      <p className="lead">
        {t("Die Regler stellst du selbst. Steht die Grundeinstellung „Politik“ auf „Reagiert“, dreht auch die Regierung an Stellschrauben. Ihre Eingriffe laufen dieselben Wege wie deine.")}
      </p>
      <h3>{t("So entscheidet die Regierung im Modell")}</h3>
      <p>
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
