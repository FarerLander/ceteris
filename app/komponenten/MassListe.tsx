import { fmt } from "../../modell/format";
import { MASSE, type MassId, type Masse } from "../../modell/masse";
import { t } from "../../modell/sprache";

// Rundet die Änderung in der Anzeige auf null? Dann steht sie ohne Vorzeichen und ohne Farbe.
const istNull = (wert: number, dez: number) => Math.abs(wert) < Math.pow(10, -dez) / 2;
function massText(wert: number, dez: number, einheit: string): string {
  return `${istNull(wert, dez) ? "" : wert > 0 ? "+" : "−"}${fmt(Math.abs(wert), dez)} ${t(einheit)}`;
}

// Spec 13.13: dieselben fünf Maße an jedem Paket und jeder Option der Regierung, gleichrangig.
export function MassListe({ masse, aktiv }: { masse: Masse; aktiv?: MassId }) {
  return (
    <dl className="masse">
      {MASSE.map((m) => {
        const wert = masse[m.id];
        // Keine Wertung beim Gini (wie im Diagramm): nur die übrigen Maße sind gefärbt.
        const klasse = m.gut === 0 || istNull(wert, m.dez) ? "" : wert * m.gut > 0 ? "good" : "bad";
        return (
          <div key={m.id} className={m.id === aktiv ? "aktiv" : undefined}>
            <dt>{t(m.name)}</dt>
            <dd className={klasse}>{massText(wert, m.dez, m.einheit)}</dd>
          </div>
        );
      })}
    </dl>
  );
}
