// Spec 13.6, Task 6: Kalibrierfälle mit Bankenkrise. Druckt je Fall den Verlauf und je Kriterium
// „erfüllt/verfehlt“ mit den Werten. Aufruf: npx tsx scripts/banken-kalibrierung.ts [--verlauf]
import { readFileSync } from "node:fs";
import { baueFall, type Fall } from "../daten/kalibrierung/lade";
import { rechne } from "../modell/rechne";
import type { Grundeinstellungen, Zustand } from "../modell/typen";
import { eintrag } from "../modell/verzeichnis";

export const lies = (n: string) => JSON.parse(readFileSync(`daten/kalibrierung/${n}.json`, "utf-8")) as Fall;
// Probe-Wirkstärken für die Kalibrierung: --std '{"banken.hausKredit":0.5}' (gilt für alle Fälle).
const iStd = process.argv.indexOf("--std");
const PROBE: Record<string, number> = iStd > 0 ? JSON.parse(process.argv[iStd + 1]) : {};
export function laufFall(n: string, grund: Partial<Grundeinstellungen> = {}): Zustand[] {
  const f = lies(n);
  const { land, sz } = baueFall({ ...f, grund: { ...f.grund, ...grund }, standards: { ...f.standards, ...PROBE } });
  return rechne(land, sz);
}
export const im = (r: Zustand[], j: number) => r.find((z) => z.jahr === j)!;
export const zwischen = (r: Zustand[], a: number, b: number) => r.filter((z) => z.jahr >= a && z.jahr <= b);
// Gipfel des realen Hauspreises und tiefster Stand danach (bis `bis`).
export function gipfel(r: Zustand[], bis = Infinity) {
  const max = Math.max(...r.map((z) => z.hauspreis));
  const jahr = r.find((z) => z.hauspreis === max)!.jahr;
  const tief = Math.min(...r.filter((z) => z.jahr >= jahr && z.jahr <= bis).map((z) => z.hauspreis));
  return { jahr, max, rueckgang: (1 - tief / max) * 100 };
}
export const rettungen = (r: Zustand[]) => r.filter((z) => z.rettung > 0);
export const rettungSumme = (r: Zustand[], a = -Infinity, b = Infinity) => zwischen(r, a, b).reduce((s, z) => s + z.rettung, 0);
// Eigenkapital unter der Mindestschwelle (Anteil des Startwerts) vor der Rettung ist nicht sichtbar; die Rettung zeigt es.
export const lampeVor = (r: Zustand[], jahr: number) =>
  r.some((z) => z.jahr < jahr && (z.kreditluecke > eintrag("schwelle.kreditluecke").standard || z.hausluecke > eintrag("schwelle.hausluecke").standard));
export const wachstumMittel = (r: Zustand[], a: number, b: number) => {
  const x = zwischen(r, a, b).map((z) => z.wachstum * 100);
  return x.reduce((s, v) => s + v, 0) / x.length;
};

// [Kriterium, erfüllt, Werte, Kritikpunkt bei bekannter Lücke]. Prüfmaßstab wie Spec 9a: Richtung und
// Größenordnung. Wird eine bekannte Lücke geschlossen, schlägt der Test an und die Marke fällt weg.
// „Z“ als fünftes Feld: Zusatzkriterium, beim Bau ergänzt; ohne Z steht es so im Bauplan.
export type Kriterium = [name: string, erfuellt: boolean, wert: string, luecke?: string, zusatz?: "Z"];
const f1 = (x: number) => x.toFixed(1);
const max = (r: Zustand[], f: (z: Zustand) => number) => Math.max(...r.map(f));
export function kriterien(): Record<string, Kriterium[]> {
  const usa = laufFall("usa-2000"), es = laufFall("spanien-1998"), ie = laufFall("irland-2002"), jp = laufFall("japan-1985"), ca = laufFall("kanada-2000");
  const jpSchnell = laufFall("japan-1985", { rettung: "schnell" });
  const usaOhne = (() => {
    const f = lies("usa-2000");
    const { land, sz } = baueFall({ ...f, schocks: [], standards: { ...f.standards, ...PROBE } });
    return rechne(land, sz);
  })();
  // Japan: Gipfel der Blase bis 1995; danach rechnet das Modell mit den Nullzinsen einen zweiten Boom (M31).
  const g = { usa: gipfel(usa), usaOhne: gipfel(usaOhne), es: gipfel(es), ie: gipfel(ie), jp: gipfel(zwischen(jp, 1985, 1995)), jpGanz: gipfel(jp, 2005) };
  const jahre = (r: Zustand[]) => rettungen(r).map((z) => `${z.jahr}: ${f1(z.rettung)}`).join(", ") || "keine";
  const lampe = (r: Zustand[], a: number, b: number) => `Kreditlücke max ${f1(max(zwischen(r, a, b), (z) => z.kreditluecke))}, Hauslücke max ${f1(max(zwischen(r, a, b), (z) => z.hausluecke))}`;
  return {
    "USA 2000–2014": [
      ["Boom aus der Geldpolitik: Hauspreis 2006 real mindestens +30 % (gemessen +55 %)", im(usa, 2006).hauspreis >= 130, `+${f1(im(usa, 2006).hauspreis - 100)} %`, undefined, "Z"],
      ["Privatschuld 2007 mindestens 15 Pp. über 2000 (gemessen +31 Pp.)", im(usa, 2007).privatschuld - usa[0].privatschuld >= 15, `+${f1(im(usa, 2007).privatschuld - usa[0].privatschuld)} Pp.`, undefined, "Z"],
      ["Kredit- oder Hauspreis-Lampe vor 2008", lampeVor(usa, 2008), lampe(usa, 2000, 2007)],
      ["Hauspreis-Gipfel 2005–2007", g.usa.jahr >= 2005 && g.usa.jahr <= 2007, `${g.usa.jahr}, +${f1(g.usa.max - 100)} %`, "M31"],
      ["Rückgang real ≥ 20 % nach dem Auslöser 2008 (gemessen 37 %)", g.usa.rueckgang >= 20, `${f1(g.usa.rueckgang)} %`, "M31"],
      ["ohne gesetzten Auslöser: Rückgang real ≥ 20 %", g.usaOhne.rueckgang >= 20, `${f1(g.usaOhne.rueckgang)} %`, "M31", "Z"],
      ["faule Kredite steigen auf mindestens 4 % (gemessen 5 %)", max(usa, (z) => z.npl) >= 4, `max ${f1(max(usa, (z) => z.npl))} %`, undefined, "Z"],
      ["Rettung 2008 ± 1", zwischen(usa, 2007, 2009).some((z) => z.rettung > 0), jahre(usa), "M32"],
      ["Rettung gesamt 2–8 % BIP (gemessen 4,5 %)", rettungSumme(usa) >= 2 && rettungSumme(usa) <= 8, `${f1(rettungSumme(usa))} % BIP`, "M32"],
    ],
    "Spanien 1998–2016": [
      ["Hauspreis-Gipfel 2006–2008", g.es.jahr >= 2006 && g.es.jahr <= 2008, `${g.es.jahr}, +${f1(g.es.max - 100)} %`, "M33"],
      ["Boom: Hauspreis 2007 real mindestens +50 % (gemessen +120 %)", im(es, 2007).hauspreis >= 150, `+${f1(im(es, 2007).hauspreis - 100)} %`, "M33", "Z"],
      ["Rückgang real ≥ 30 %", g.es.rueckgang >= 30, `${f1(g.es.rueckgang)} %`, "M33"],
      ["Rettung 2011–2013", zwischen(es, 2011, 2013).some((z) => z.rettung > 0), jahre(es), "M32"],
      ["Rettung gesamt 2–8 % BIP (gemessen 5,4 %)", rettungSumme(es) >= 2 && rettungSumme(es) <= 8, `${f1(rettungSumme(es))} % BIP`, "M32"],
      ["Aufschlag 2012 höher als 2010", im(es, 2012).aufschlag > im(es, 2010).aufschlag, `${f1(im(es, 2010).aufschlag)} → ${f1(im(es, 2012).aufschlag)}`, "M32"],
      ["Arbeitslosigkeit über 18 % (gemessen 26 %; im Fall liegt schon die strukturelle bei 15 %)", max(zwischen(es, 2009, 2016), (z) => z.alq) > 18, `max ${f1(max(zwischen(es, 2009, 2016), (z) => z.alq))} %`, "M33"],
      ["Schuld 2014 über 80 % (gemessen 101 %)", im(es, 2014).schuldQuote > 80, `${f1(im(es, 2014).schuldQuote)} %`, "M33"],
    ],
    "Irland 2002–2015": [
      ["Hauspreis-Gipfel 2006–2008", g.ie.jahr >= 2006 && g.ie.jahr <= 2008, `${g.ie.jahr}, +${f1(g.ie.max - 100)} %`, "M33", "Z"],
      // Nur nach einem Gipfel 2006–2008 ist es ein geplatzter Boom; im Modell fällt der Preis schon ab 2003.
      ["Rückgang real ≥ 40 % nach einem Gipfel 2006–2008", g.ie.rueckgang >= 40 && g.ie.jahr >= 2006, `Gipfel ${g.ie.jahr}, Rückgang ${f1(g.ie.rueckgang)} %`, "M33"],
      ["Rettung im Krisenjahr oder danach", rettungen(ie).some((z) => z.jahr >= 2008), jahre(ie), undefined, "Z"],
      ["Rettung 2009–2011 über 20 % BIP (gemessen 37,6 %)", rettungSumme(ie, 2009, 2011) > 20, jahre(ie), "M32"],
      ["Schuld 2012 über 90 % (gemessen 120 %)", im(ie, 2012).schuldQuote > 90, `${f1(im(ie, 2012).schuldQuote)} %`],
    ],
    "Japan 1985–2005": [
      ["Boom aus der Geldpolitik: Hauspreis 1990 real +25 bis +45 % (gemessen +34 %)", im(jp, 1990).hauspreis >= 125 && im(jp, 1990).hauspreis <= 145, `+${f1(im(jp, 1990).hauspreis - 100)} %`, undefined, "Z"],
      ["Hauspreis-Gipfel 1990–1992", g.jp.jahr >= 1990 && g.jp.jahr <= 1992, `${g.jp.jahr}, +${f1(g.jp.max - 100)} %`],
      ["Kreditklemme und Rezession 1991–1993 ohne gesetzten Schock", zwischen(jp, 1991, 1993).some((z) => z.klemme > 0) && zwischen(jp, 1991, 1993).some((z) => z.wachstum < 0), `Klemme ${f1(max(zwischen(jp, 1991, 1993), (z) => z.klemme))} % BIP, Wachstum min ${f1(Math.min(...zwischen(jp, 1991, 1993).map((z) => z.wachstum * 100)))} %`, undefined, "Z"],
      ["Rückgang bis 2005 ≥ 30 % (gemessen 42 %)", g.jpGanz.rueckgang >= 30 && g.jpGanz.jahr <= 1992, `Gipfel ${g.jpGanz.jahr} +${f1(g.jpGanz.max - 100)} %, Rückgang ${f1(g.jpGanz.rueckgang)} %`, "M31"],
      ["faule Kredite ≥ 5 Jahre über 5 %", jp.filter((z) => z.npl > 5).length >= 5, `${jp.filter((z) => z.npl > 5).length} Jahre, max ${f1(max(jp, (z) => z.npl))} %`],
      ["zögernd: Wachstum 1992–2002 unter 1,5 % (gemessen 0,9 %)", wachstumMittel(jp, 1992, 2002) < 1.5, `${f1(wachstumMittel(jp, 1992, 2002))} %`, "M31"],
      ["schnell: Wachstum 1992–2002 höher als zögernd", wachstumMittel(jpSchnell, 1992, 2002) > wachstumMittel(jp, 1992, 2002) + 0.1, `${f1(wachstumMittel(jpSchnell, 1992, 2002))} % gegen ${f1(wachstumMittel(jp, 1992, 2002))} %`, "M31"],
    ],
    "Kanada 2000–2015 (Fehlalarm-Probe)": [
      ["Hauspreis 2015 real mindestens +50 % (gemessen +96 %)", im(ca, 2015).hauspreis >= 150, `+${f1(im(ca, 2015).hauspreis - 100)} %`, undefined, "Z"],
      ["keine Rettung", rettungen(ca).length === 0, jahre(ca)],
      // „Eigenkapital nie unter der Mindestschwelle“ aus dem Bauplan entfällt: Bei schneller Rettung füllt
      // der Staat im selben Jahr auf, das Kriterium folgt aus „keine Rettung“.
    ],
  };
}

if (process.argv[1]?.endsWith("banken-kalibrierung.ts")) {
  const f = (x: number, n = 1) => x.toFixed(n).padStart(7);
  if (process.argv.includes("--verlauf"))
    for (const n of ["usa-2000", "spanien-1998", "irland-2002", "japan-1985", "kanada-2000"]) {
      const beob = (lies(n).beobachtet?.hauspreisReal ?? {}) as Record<string, number>;
      console.log(`\n${n}\n jahr   haus   (ist)  hlücke    npl    ekq   rett klemme schuld privat klücke   alq  wachs  infl  leitz lage`);
      for (const z of laufFall(n))
        console.log(z.jahr, f(z.hauspreis), f(beob[z.jahr] ?? NaN), f(z.hausluecke), f(z.npl, 2), f(z.bankKapital, 2), f(z.rettung, 2), f(z.klemme, 2), f(z.schuldQuote), f(z.privatschuld), f(z.kreditluecke), f(z.alq), f(z.wachstum * 100), f(z.inflation), f(z.leitzins), z.lage);
    }
  // Kurzfassung je Fall für die Kalibrierung.
  if (process.argv.includes("--kurz"))
    for (const n of ["usa-2000", "spanien-1998", "irland-2002", "japan-1985", "kanada-2000"]) {
      const r = laufFall(n), g = gipfel(r);
      console.log(n.padEnd(13), `Gipfel ${g.jahr} ${f(g.max, 0)}, Rückgang ${f(g.rueckgang, 0)} % | Privat ${f(r[0].privatschuld, 0)} → max ${f(Math.max(...r.map((z) => z.privatschuld)), 0)} | Klücke max ${f(Math.max(...r.map((z) => z.kreditluecke)))} Hlücke max ${f(Math.max(...r.map((z) => z.hausluecke)))} | npl max ${f(Math.max(...r.map((z) => z.npl)))} | ekq min ${f(Math.min(...r.map((z) => z.bankKapital)), 2)} | Rettung ${rettungen(r).map((z) => `${z.jahr}:${z.rettung.toFixed(1)}`).join(" ") || "–"} | alq max ${f(Math.max(...r.map((z) => z.alq)))} | Schuld Ende ${f(r[r.length - 1].schuldQuote, 0)} | Wachstum min ${f(Math.min(...r.slice(1).map((z) => z.wachstum * 100)))}`);
    }
  let erfuellt = 0, alle = 0, planErfuellt = 0, plan = 0, ueberraschung = 0;
  for (const [fall, liste] of Object.entries(kriterien())) {
    console.log(`\n${fall}`);
    for (const [name, ok, wert, luecke, zusatz] of liste) {
      const marke = ok ? (luecke ? "ERFÜLLT trotz Marke" : "erfüllt ") : luecke ? `Lücke ${luecke}` : "VERFEHLT";
      console.log(`  ${marke.padEnd(10)} ${zusatz ? "+" : " "} ${name.padEnd(84)} ${wert}`);
      alle++;
      if (ok) erfuellt++;
      if (!zusatz) plan++;
      if (!zusatz && ok) planErfuellt++;
      if (ok === Boolean(luecke)) ueberraschung++;
    }
  }
  console.log(`\n${planErfuellt} von ${plan} Kriterien des Bauplans erfüllt; mit den Zusatzkriterien (+) ${erfuellt} von ${alle}; ${ueberraschung} weichen von der Erwartung ab`);
}
