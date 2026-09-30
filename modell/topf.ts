// Wofür die Einnahmen reichen (Spec 10, Diagramm „Spielraum im Haushalt“): Anteile in % der Staatseinnahmen.
// Sozial = Gesundheit, Familie und Arbeitslose. Der Rest bleibt für alles andere
// (Verteidigung, Bildung, Forschung, Infrastruktur, Verwaltung). Negativ heißt: Zinsen und
// Sozialausgaben allein kosten mehr, als der Staat einnimmt.
export interface Topf {
  zins: number;
  rente: number;
  sozial: number;
  rest: number;
}

export function topf(einnahmen: number, zins: number, rente: number, sozial: number): Topf {
  const e = Math.max(0.1, einnahmen);
  const t = { zins: (zins / e) * 100, rente: (rente / e) * 100, sozial: (sozial / e) * 100 };
  return { ...t, rest: 100 - t.zins - t.rente - t.sozial };
}
