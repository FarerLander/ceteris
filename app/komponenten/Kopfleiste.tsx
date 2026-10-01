import { TourMenue } from "../tour/Menue";
import { useEffect, useRef, useState } from "react";
import { t } from "../../modell/sprache";
import { HINWEIS } from "./Anzeige";
import { NAMEN, type Ansicht } from "./ansichten";

// Eine Leiste oben statt Pillen, Hinweis und Reitern, auf allen Bildschirmen. Links die Ansicht, daneben die
// Abschnitte der Übersicht als Chips; sie zeigen, was weiter unten kommt, und springen dorthin.
export const ABSCHNITTE: [string, string][] = [
  ["lage", "Lage"],
  ["zahlen", "Kennzahlen"],
  ["diagramm", "Diagramm"],
  ["warnlampen", "Warnlampen"],
  ["erzaehlung", "Erzählung"],
  ["wege", "Wege"],
];
const SCHLUESSEL = "wirtschaftssimulator.hinweis";
const LEISTE = 64; // Höhe der Leiste samt Luft; ab hier gilt ein Abschnitt als erreicht

function hinweisGesehen(): boolean {
  try {
    return window.localStorage.getItem(SCHLUESSEL) === "gesehen";
  } catch {
    return false;
  }
}

export function Kopfleiste({
  ansicht,
  setze,
  verfuegbar,
}: {
  ansicht: Ansicht;
  setze(a: Ansicht): void;
  verfuegbar: Ansicht[];
}) {
  const [hinweis, setHinweis] = useState(() => !hinweisGesehen());
  const [aktiv, setAktiv] = useState("lage");
  const reihe = useRef<HTMLDivElement>(null);
  const mitChips = ansicht === "uebersicht";

  useEffect(() => {
    if (!mitChips) return;
    let rahmen = 0;
    const pruefe = () => {
      cancelAnimationFrame(rahmen);
      rahmen = requestAnimationFrame(() => {
        let jetzt = ABSCHNITTE[0][0];
        for (const [id] of ABSCHNITTE) {
          const el = document.getElementById(`abschnitt-${id}`);
          if (
            el &&
            el.offsetHeight > 0 &&
            el.getBoundingClientRect().top <= LEISTE + 20
          )
            jetzt = id;
        }
        // Ganz unten angekommen: der letzte Abschnitt, auch wenn er kurz ist.
        if (
          window.innerHeight + window.scrollY >=
          document.documentElement.scrollHeight - 4
        )
          jetzt = ABSCHNITTE[ABSCHNITTE.length - 1][0];
        setAktiv(jetzt);
      });
    };
    pruefe();
    window.addEventListener("scroll", pruefe, { passive: true });
    return () => {
      cancelAnimationFrame(rahmen);
      window.removeEventListener("scroll", pruefe);
    };
  }, [mitChips]);

  // Den leuchtenden Chip in der Reihe sichtbar halten.
  useEffect(() => {
    const r = reihe.current,
      chip = r?.querySelector<HTMLElement>(`[data-abschnitt="${aktiv}"]`);
    if (r && chip)
      r.scrollTo?.({
        left:
          chip.offsetLeft -
          r.offsetLeft -
          r.clientWidth / 2 +
          chip.offsetWidth / 2,
        behavior: "smooth",
      });
  }, [aktiv]);

  const schliesse = () => {
    setHinweis(false);
    try {
      window.localStorage.setItem(SCHLUESSEL, "gesehen");
    } catch {
      // Ohne Speicher erscheint der Hinweis beim nächsten Besuch wieder.
    }
  };

  return (
    <>
      <div className="kopfleiste">
        <div className="kopfleiste-zeile">
          <select
            className="ansicht-wahl"
            aria-label={t("Ansichten")}
            value={ansicht}
            onChange={(ev) => setze(ev.target.value as Ansicht)}
          >
            {verfuegbar.map((a) => (
              <option key={a} value={a}>
                {t(NAMEN[a])}
              </option>
            ))}
          </select>
          {mitChips && (
            <div
              className="abschnitt-chips"
              ref={reihe}
              role="navigation"
              aria-label={t("Abschnitte")}
            >
              {ABSCHNITTE.map(([id, name]) => (
                <button
                  key={id}
                  type="button"
                  data-abschnitt={id}
                  aria-current={aktiv === id ? "true" : undefined}
                  onClick={() =>
                    document
                      .getElementById(`abschnitt-${id}`)
                      ?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }
                >
                  {t(name)}
                </button>
              ))}
            </div>
          )}
          <TourMenue />
          <button
            type="button"
            className="info-knopf"
            aria-label={t("Über dieses Modell")}
            aria-expanded={hinweis}
            onClick={() => {
              if (hinweis) return schliesse();
              // Der Hinweis steht oben auf der Seite, nicht in der Leiste.
              setHinweis(true);
              window.scrollTo?.({ top: 0, behavior: "smooth" });
            }}
          >
            i
          </button>
        </div>
      </div>
      {hinweis && (
        <p className="handy-hinweis">
          {t(HINWEIS)}
          <button type="button" onClick={schliesse} aria-label={t("Schließen")}>
            ✕
          </button>
        </p>
      )}
    </>
  );
}
