import { clamp } from "../mathe";
import type { Baustein } from "../typen";

// Wirtschaftsordnung (Spec 6.10, Update 4a). Wirkt über die Abweichung vom Landesstandard,
// damit die Startdaten die heutige Ordnung nicht doppelt zählen. Schreibt Zwischengrößen,
// die Wachstum, Demografie, Staat und Handel lesen. Preiskontrollen und Notenbankfinanzierung
// sitzen in geld.ts, Kreditlenkung in wachstum.ts und staat.ts.
export const ordnung: Baustein = (alt, neu, k) => {
  const dR = k.w("ordnung.rechtsstaat") - k.basis("ordnung.rechtsstaat");
  const dS = k.w("ordnung.staatsanteil") - k.basis("ordnung.staatsanteil");
  const ziel =
    (k.p("ordnung.rechtsTfp") * dR - k.p("ordnung.staatTfp") * dS) / 100;
  neu.ordnungNiveau =
    alt.ordnungNiveau + (ziel - alt.ordnungNiveau) / k.p("ordnung.niveauJahre");
  neu.investAufschlag = 0 - k.p("ordnung.rechtsAufschlag") * dR; // 0 − …: kein −0 bei dR = 0
  neu.kapitalflucht = clamp(
    k.p("ordnung.flucht") *
      (Math.max(0, -dR) / 10 +
        Math.max(0, alt.inflation - 20) / 20 +
        alt.schwarzmarkt / 50),
    0,
    10,
  );
  // Abwanderung in % der Bevölkerung pro Jahr; die Demografie entzieht sie im Folgejahr.
  // Ohne Einbruchs-Term: tiefe Einbrüche gibt es auch in G7-Basisläufen (Schuldenschnitt),
  // mit neutraler Ordnung muss aber alles exakt wie vorher rechnen (Spec 6.10).
  const rate = clamp(
    k.p("ordnung.abwanderung") *
      (Math.max(0, -dR) / 10 + Math.max(0, alt.inflation - 50) / 100),
    0,
    4,
  );
  neu.abwanderungOrdnung = (alt.bev * rate) / 100;
  neu.staatsbetriebVerlust = k.p("ordnung.staatsbetriebVerlust") * dS;
  neu.knappheit = alt.knappheit; // wird in geld.ts neu gesetzt
};
