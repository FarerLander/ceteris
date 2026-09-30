import { teileAuf } from "../alter";
import type { Baustein, Kontext, MigJahrgang } from "../typen";

// Geburten nach Alter der Mutter (15–49), Glockenkurve um 31 Jahre.
const GEBURT = (() => {
  const g = Array.from({ length: 35 }, (_, i) =>
    Math.exp(-(((15 + i - 31) / 5.5) ** 2) / 2),
  );
  const s = g.reduce((a, b) => a + b, 0);
  return g.map((x) => x / s);
})();

export function lebenserwartungAus(m: number[]): number {
  let ueberleben = 1,
    summe = 0;
  for (let a = 0; a < m.length; a++) {
    summe += ueberleben * (1 - m[a] / 2);
    ueberleben *= 1 - m[a];
  }
  return summe;
}

const CACHE = new Map<string, number[]>();

// Gompertz-Sterblichkeit m(a) = a0·e^(b·a), a0 so gewählt, dass die Lebenserwartung e0 ergibt.
export function sterberaten(e0: number, b: number): number[] {
  const schluessel = `${e0.toFixed(3)}|${b}`;
  const vorhanden = CACHE.get(schluessel);
  if (vorhanden) return vorhanden;
  const raten = (a0: number) =>
    Array.from({ length: 101 }, (_, a) =>
      a === 100 ? 1 : Math.min(1, a0 * Math.exp(b * a)),
    );
  let lo = 1e-8,
    hi = 0.5;
  for (let i = 0; i < 80; i++) {
    const mitte = Math.sqrt(lo * hi);
    if (lebenserwartungAus(raten(mitte)) > e0) lo = mitte;
    else hi = mitte;
  }
  const m = raten(Math.sqrt(lo * hi));
  CACHE.set(schluessel, m);
  return m;
}

function verteile(n: number[], anzahl: number, mittel: number) {
  if (anzahl <= 0) return;
  const g = n.map((_, a) => Math.exp(-(((a - mittel) / 8) ** 2) / 2));
  const s = g.reduce((x, y) => x + y, 0);
  for (let a = 0; a < n.length; a++) n[a] += (anzahl * g[a]) / s;
}

// Entfernt anteilig aus den Jahrgängen 18–65, höchstens die Hälfte pro Jahr. Gibt die entfernte Zahl zurück.
function entferne(n: number[], anzahl: number): number {
  let s = 0;
  for (let a = 18; a <= 65; a++) s += n[a];
  if (s <= 0 || anzahl <= 0) return 0;
  const f = Math.min(0.5, anzahl / s);
  for (let a = 18; a <= 65; a++) n[a] -= n[a] * f;
  return f * s;
}

// Qualifizierte gehen vor allem zwischen 25 und 40: Gewichte um 32 Jahre, höchstens die Hälfte je Jahrgang.
const ALTER_ABWANDERUNG = 32;
function entferneJung(n: number[], anzahl: number, bis: number): number {
  if (anzahl <= 0) return 0;
  let weg = 0;
  const g = n.map((_, a) =>
    a >= 18 && a < bis ? Math.exp(-(((a - ALTER_ABWANDERUNG) / 7) ** 2) / 2) : 0,
  );
  const s = g.reduce((x, y) => x + y, 0);
  if (s <= 0) return 0;
  for (let a = 0; a < n.length; a++) {
    const d = Math.min(n[a] / 2, (anzahl * g[a]) / s);
    n[a] -= d;
    weg += d;
  }
  return weg;
}

interface Anteile {
  hoch: number;
  mittel: number;
  arbeit: number;
  studium: number;
  familie: number;
}

function jahrgang(
  k: Kontext,
  anzahl: number,
  a: Anteile,
  alterAnkunft: number,
): MigJahrgang {
  const q = Math.max(1, a.hoch + a.mittel);
  const hoch = a.hoch / q,
    mittel = a.mittel / q,
    niedrig = 1 - hoch - mittel;
  const w = Math.max(1, a.arbeit + a.studium + a.familie);
  const arbeit = a.arbeit / w,
    studium = a.studium / w,
    familie = a.familie / w,
    asyl = 1 - arbeit - studium - familie;
  return {
    ankunft: k.jahr,
    anzahl,
    alterAnkunft,
    ziel:
      hoch * k.p("mig.quoteHoch") +
      mittel * k.p("mig.quoteMittel") +
      niedrig * k.p("mig.quoteNiedrig"),
    warte:
      arbeit * k.p("mig.warteArbeit") +
      studium * k.p("mig.warteStudium") +
      familie * k.p("mig.warteFamilie") +
      asyl * k.p("mig.warteAsyl"),
    halbwert: Math.max(
      0.5,
      k.w("mig.halbwert") * (1.5 - k.w("mig.integrationspolitik")),
    ),
    kosten:
      arbeit * k.p("mig.kostenArbeit") +
      studium * k.p("mig.kostenStudium") +
      familie * k.p("mig.kostenFamilie") +
      asyl * k.p("mig.kostenAsyl"),
  };
}

export function beschaeftigtAus(
  j: MigJahrgang,
  jahr: number,
  rentenalter: number,
): number {
  const jahre = jahr - j.ankunft;
  if (jahre <= j.warte || j.alterAnkunft + jahre >= rentenalter) return 0;
  return (
    j.anzahl * j.ziel * (1 - Math.pow(0.5, (jahre - j.warte) / j.halbwert))
  );
}

export const demografie: Baustein = (alt, neu, k) => {
  // Der Trend summiert sich auf; ein Zeitpfad wirkt ab seinem Jahr, nicht rückwirkend.
  neu.lebenserwartung = alt.lebenserwartung + k.w("demo.lebenserwartungTrend");
  const e0 = neu.lebenserwartung;
  const m = sterberaten(e0, k.p("demo.gompertzB"));
  const a = alt.alter;
  const n = new Array(101).fill(0);
  let tote = 0;
  for (let i = 0; i <= 100; i++) {
    tote += a[i] * m[i];
    n[Math.min(100, i + 1)] += a[i] * (1 - m[i]);
  }
  let geburten = 0;
  const tfr = k.w("demo.geburtenrate");
  for (let i = 15; i <= 49; i++) geburten += a[i] * 0.5 * tfr * GEBURT[i - 15];
  n[0] = geburten;

  const anreiz =
    1 +
    k.p("mig.sozialAnreiz") *
      (k.w("sozial.lohnersatz") - k.basis("sozial.lohnersatz"));
  const zuzug = Math.max(0, (k.w("mig.netto") / 1000) * anreiz);
  const flucht = Math.max(0, k.schock.zuwanderung);
  const alterAnkunft = k.w("mig.alterAnkunft");
  verteile(n, zuzug, alterAnkunft);
  verteile(n, flucht, 30);
  const rente = k.w("rente.alter");
  const wegQual = entferneJung(n, k.w("mig.abwanderungQual") / 1000, rente);
  // Die Zensus-Korrektur (Rückblick 2011) ist keine Abwanderung, sondern eine gleichmäßige Bereinigung.
  // Abwanderung wegen der Ordnung (Update 4a) trifft die Jahrgänge 18–65 gleichmäßig, im Folgejahr.
  const weg =
    wegQual + entferne(n, k.w("demo.zensusKorrektur") / 1000 + alt.abwanderungOrdnung);

  const jahrgaenge = alt.migJahrgaenge.filter(
    (j) => j.alterAnkunft + (k.jahr - j.ankunft) < rente,
  );
  if (zuzug > 0) {
    jahrgaenge.push(
      jahrgang(
        k,
        zuzug,
        {
          hoch: k.w("mig.anteilHoch"),
          mittel: k.w("mig.anteilMittel"),
          arbeit: k.w("mig.anteilArbeit"),
          studium: k.w("mig.anteilStudium"),
          familie: k.w("mig.anteilFamilie"),
        },
        alterAnkunft,
      ),
    );
  }
  if (wegQual > 0) {
    jahrgaenge.push({
      ankunft: k.jahr,
      anzahl: wegQual,
      alterAnkunft: ALTER_ABWANDERUNG,
      ziel: k.p("mig.quoteHoch"),
      warte: -1,
      halbwert: 1e-3,
      kosten: 0,
      weg: true,
    });
  }
  if (flucht > 0) {
    jahrgaenge.push(
      jahrgang(
        k,
        flucht,
        {
          hoch: k.p("mig.fluchtAnteilHoch"),
          mittel: k.p("mig.fluchtAnteilMittel"),
          arbeit: 0,
          studium: 0,
          familie: 0,
        },
        30,
      ),
    );
  }

  const teile = teileAuf(n, rente);
  neu.alter = n;
  neu.migJahrgaenge = jahrgaenge;
  neu.bev = n.reduce((x, y) => x + y, 0);
  neu.erwerbsfaehige = teile.erwerbsfaehige;
  neu.rentner = teile.rentner;
  neu.geburten = geburten;
  neu.sterbefaelle = tote;
  neu.zuwanderung = zuzug + flucht;
  neu.abwanderung = weg;
  const imLand = jahrgaenge.filter((j) => !j.weg);
  const fort = jahrgaenge.filter((j) => j.weg);
  const erwerbsalter = (liste: MigJahrgang[]) =>
    liste.reduce(
      (s, j) =>
        s + (j.alterAnkunft + (k.jahr - j.ankunft) < rente ? j.anzahl : 0),
      0,
    );
  neu.migBeschaeftigte = imLand.reduce(
    (s, j) => s + beschaeftigtAus(j, k.jahr, rente),
    0,
  );
  neu.migErwerbsalter = erwerbsalter(imLand);
  neu.abwBeschaeftigte = fort.reduce(
    (s, j) => s + beschaeftigtAus(j, k.jahr, rente),
    0,
  );
  neu.abwErwerbsalter = erwerbsalter(fort);
  neu.integrationskosten = imLand.reduce(
    (s, j) => s + (k.jahr - j.ankunft < 3 ? j.anzahl * j.kosten : 0),
    0,
  );
};
