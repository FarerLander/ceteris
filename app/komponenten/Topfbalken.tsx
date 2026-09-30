import { fmt } from "../../modell/format";
import { t } from "../../modell/sprache";
import type { Zustand } from "../../modell/typen";

// Aufteilung der Staatseinnahmen im gewählten Jahr (Diagramm „Spielraum im Haushalt“).
// Reichen die Einnahmen nicht, wird der Balken länger als die Einnahmen-Marke.
const TEILE = [
  { key: "topfZins", name: "Zinsen", farbe: "var(--bad)" },
  { key: "topfRente", name: "Renten", farbe: "var(--accent)" },
  { key: "topfSozial", name: "Gesundheit, Familie, Arbeitslose", farbe: "var(--ghost)" },
] as const;

export function Topfbalken({ z }: { z: Zustand }) {
  const kosten = z.topfZins + z.topfRente + z.topfSozial;
  const skala = Math.max(100, kosten);
  const breite = (x: number) => `${(Math.max(0, x) / skala) * 100}%`;
  return (
    <div className="topf" aria-label={t("Aufteilung der Staatseinnahmen {jahr}", { jahr: z.jahr })}>
      <p className="anteil">
        {t("{jahr}: Von 100 Einnahmen gehen {zins} an Zinsen, {rente} an Renten und {sozial} an Gesundheit, Familie und Arbeitslose.", { jahr: z.jahr, zins: fmt(z.topfZins, 0), rente: fmt(z.topfRente, 0), sozial: fmt(z.topfSozial, 0) })}{" "}
        {z.spielraum >= 0
          ? t("Für alles andere bleiben {rest}.", { rest: fmt(z.spielraum, 0) })
          : t("Das sind {mehr} mehr, als der Staat einnimmt; alles andere läuft auf Pump.", { mehr: fmt(-z.spielraum, 0) })}
      </p>
      <div className="topf-balken">
        {TEILE.map((x) => (
          <span key={x.key} title={t(x.name)} style={{ width: breite(z[x.key]), background: x.farbe }} />
        ))}
        {z.spielraum > 0 && <span title={t("Rest")} style={{ width: breite(z.spielraum), background: "var(--good)" }} />}
        {kosten > 100 && <i className="topf-marke" style={{ left: `${(100 / skala) * 100}%` }} title={t("Einnahmen")} />}
      </div>
      <div className="topf-legende">
        {TEILE.map((x) => (
          <span key={x.key}>
            <i style={{ background: x.farbe }} />
            {t(x.name)}
          </span>
        ))}
        <span>
          <i style={{ background: "var(--good)" }} />
          {t("Rest für Verteidigung, Bildung, Infrastruktur …")}
        </span>
      </div>
    </div>
  );
}
