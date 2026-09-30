import type { Regime } from "./typen";

const STEIL: Record<Regime, string> = {
  welt: "anleihen.kWelt",
  eigen: "anleihen.kEigen",
  euro: "anleihen.kEuro",
  hart: "anleihen.kHart",
  gelenkt: "anleihen.kGelenkt",
};

// Verwundbarkeit über den Schuldenstand hinaus (M3): Auslandsschuld, Primärdefizit, Reservestatus.
export interface Verwundbarkeit {
  nfa: number; // % BIP Nettoauslandsvermögen
  primaer: number; // % BIP Primärsaldo
  reserve: number; // Reservewährungsstatus 0–1
}

// Risikoaufschlag in Pp. als Kurve über die Schuldenquote.
export function aufschlagFormel(
  regime: Regime,
  tpi: boolean,
  schuldQuote: number,
  auslandsanteil: number,
  inflation: number,
  ziel: number,
  p: (id: string) => number,
  v?: Verwundbarkeit,
): number {
  let steil = p(STEIL[regime]) * (0.5 + auslandsanteil);
  if (regime === "euro" && tpi) steil *= p("anleihen.tpiDaempfung");
  let a =
    steil * Math.pow(Math.max(0, schuldQuote - p("anleihen.schwelle")), 1.25);
  if (regime === "eigen")
    a += p("anleihen.inflationsRisiko") * Math.max(0, inflation - ziel - 3);
  // Gelenkte Währung: eigener Risikokanal über das Abwertungsrisiko (handel/anleihen), der heimische
  // Anleihemarkt ist bei Kapitalkontrollen gedeckelt (Finanzrepression).
  if (v && regime !== "gelenkt") {
    // Märkte strafen hohe Auslandsschuld und große Primärdefizite; eine Reservewährung schützt.
    const schutz = 1 - Math.min(1, Math.max(0, v.reserve));
    const zusatz =
      p("anleihen.nfaRisiko") * Math.max(0, -v.nfa - p("anleihen.nfaSchwelle")) +
      p("anleihen.defizitRisiko") * Math.max(0, -v.primaer - p("anleihen.defizitSchwelle"));
    if (zusatz > 0) a += schutz * zusatz;
    // Ohne Notenbank als letzten Käufer verstärkt sich ein hoher Aufschlag selbst (De Grauwe 2011).
    if ((regime === "euro" && !tpi) || regime === "hart") {
      const panik = p("anleihen.panik") * Math.max(0, a - p("anleihen.panikSchwelle"));
      if (panik > 0) a += schutz * panik;
    }
  }
  return a;
}
