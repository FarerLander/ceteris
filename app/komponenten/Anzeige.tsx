import { geaendert } from "../../modell/auswertung";
import { useState } from "react";
import { ladeFarbmodus, NAECHSTER, NAME, speichereFarbmodus, wendeFarbmodusAn, type Farbmodus } from "../farbmodus";
import { SPRACH_NAME, SPRACHEN, sprache, t, type Sprache } from "../../modell/sprache";
import type { Sim } from "../simulation";

export function FarbmodusKnopf() {
  const [modus, setModus] = useState<Farbmodus>(ladeFarbmodus);
  const weiter = NAECHSTER[modus];
  return (
    <button
      type="button"
      className="chip farbmodus"
      aria-label={t("Farbmodus: {jetzt}. Wechseln zu {weiter}", { jetzt: t(NAME[modus]), weiter: t(NAME[weiter]) })}
      title={t("Farbmodus: {jetzt}", { jetzt: t(NAME[modus]) })}
      onClick={() => {
        setModus(weiter);
        wendeFarbmodusAn(weiter);
        speichereFarbmodus(weiter);
      }}
    >
      {modus === "hell" ? "☀" : modus === "dunkel" ? "☾" : "◐"} {t(NAME[modus])}
    </button>
  );
}

export function SprachKnopf({ setzeSprache }: { setzeSprache(s: Sprache): void }) {
  const jetzt = sprache();
  const weiter = SPRACHEN[(SPRACHEN.indexOf(jetzt) + 1) % SPRACHEN.length];
  return (
    <button
      type="button"
      className="chip sprache"
      lang={weiter}
      aria-label={`${t("Sprache")}: ${SPRACH_NAME[jetzt]}. ${SPRACH_NAME[weiter]}`}
      onClick={() => setzeSprache(weiter)}
    >
      {jetzt.toUpperCase()} → {weiter.toUpperCase()}
    </button>
  );
}

// „Basislinie“ oder „n Änderungen“; auf dem Smartphone steht das im Griff des Blatts.
export function stand(sim: Sim): { text: string; n: number } {
  const n = geaendert(sim.land, sim.sz).length;
  return { n, text: n === 0 ? t("Basislinie") : n === 1 ? t("1 Änderung") : t("{n} Änderungen", { n }) };
}

export const HINWEIS = "Erkundungsmodell. Zusammenhänge aus Lehrbuch, Studien und historischen Daten. Keine Prognose.";
