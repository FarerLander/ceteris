import { t } from "../../modell/sprache";

// Hilfe-Modus: Einladung beim ersten Besuch, oben im Hauptbereich.
export function Einladung({ los, spaeter }: { los(): void; spaeter(): void }) {
  return (
    <section className="tour-einladung" aria-label={t("Einladung zur Tour")}>
      <p>
        <strong>{t("Neu hier?")}</strong>{" "}
        {t("Eine kurze Tour zeigt in etwa zwei Minuten, was du hier siehst und wie du eingreifst.")}
      </p>
      <div className="tour-knoepfe">
        <button type="button" onClick={spaeter}>
          {t("Später")}
        </button>
        <button type="button" className="haupt" onClick={los}>
          {t("Los")}
        </button>
      </div>
    </section>
  );
}

// Nach der Tour, wenn sie das Szenario verändert hat.
export function Rueckfrage({ zurueck, lassen }: { zurueck(): void; lassen(): void }) {
  return (
    <div className="tour-blase mitte" role="dialog" aria-label={t("Tour beendet")}>
      <p>{t("Die Tour hat dein Szenario verändert.")}</p>
      <div className="tour-knoepfe">
        <button type="button" onClick={lassen}>
          {t("So lassen")}
        </button>
        <button type="button" className="haupt" onClick={zurueck} autoFocus>
          {t("Zurück zu deinem Stand vorher")}
        </button>
      </div>
    </div>
  );
}
