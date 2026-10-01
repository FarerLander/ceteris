import { useState } from "react";
import { t } from "../../modell/sprache";
import { KAPITEL } from "./kapitel";
import { ladeTour } from "./speicher";
import { startTour } from "./Tour";

// Hilfe-Modus: „?“ in der Kopfleiste mit den Kapiteln der Tour; erledigte tragen ein Häkchen.
export function TourMenue() {
  const [offen, setOffen] = useState(false);
  const erledigt = offen ? ladeTour().erledigt : [];
  return (
    <div className="tour-menue-rahmen">
      <button
        type="button"
        className="info-knopf tour-menue-knopf"
        aria-label={t("Tour und Hilfe")}
        aria-expanded={offen}
        aria-haspopup="menu"
        onClick={() => setOffen(!offen)}
      >
        ?
      </button>
      {offen && (
        <div className="tour-menue" role="menu" aria-label={t("Tour und Hilfe")}>
          {KAPITEL.map((k) => {
            const fertig = erledigt.includes(k.id);
            return (
              <button
                key={k.id}
                type="button"
                role="menuitem"
                aria-label={fertig ? `${t(k.titel)} · ${t("erledigt")}` : t(k.titel)}
                onClick={() => {
                  setOffen(false);
                  startTour(k.id);
                }}
              >
                <span aria-hidden="true">{fertig ? "✓" : "○"}</span> {t(k.titel)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
