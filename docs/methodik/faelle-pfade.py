"""Spec 13.6, Task 6: Weltpfade der Kalibrierfälle aus dem Macrohistory-Auszug.

Aufruf (im Projektordner): python3 docs/methodik/faelle-pfade.py
Schreibt `welt` in daten/kalibrierung/{usa-2000,spanien-1998,irland-2002,japan-1985,kanada-2000}.json.

Tatsächliche Geldpolitik als Pfad, wie im Rückblick Deutschland:
- Der Leitzins ist in allen fünf Fällen der gemessene Kurzfristzins des Landes (JST stir). Das Modell
  kann einen Leitzins nur im Regime „Gemeinsame Währung“ vorgeben; deshalb laufen auch USA, Japan und
  Kanada dort, mit Gewicht 0 an der eigenen Zinsregel und mit Schutzprogramm (eigene Notenbank: kein
  Panik-Aufschlag). Mit der Zinsregel des Modells träfe der Leitzins den gemessenen nicht, weil das
  Modell ohne die Krise eine andere Konjunktur rechnet.
- Laufzeitprämie der Welt: so, dass die Rendite des Modells der gemessenen folgt, in Spanien und Irland
  der deutschen (der Aufschlag des Landes soll aus dem Modell kommen):
  Δ Rendite − 0,5 × Δ Kurzfristzins.
- Weltnachfrage: Standard 2,5 %, Welthandel 2009 −3 %, 2010 +4 %.
"""

import csv
import json

ZEILEN = [z for z in csv.DictReader(l for l in open("daten/kalibrierung/jst-auszug.csv") if not l.startswith("#"))]
JST = {(z["iso"], int(z["year"])): z for z in ZEILEN}


def wert(iso, jahr, spalte):
    return float(JST[(iso, jahr)][spalte])


def inflation(iso, jahr):
    return 100 * (wert(iso, jahr, "cpi") / wert(iso, jahr - 1, "cpi") - 1)


def r1(x):
    return round(x, 1) + 0.0


def pfad(jahre, f):
    return [{"ab": j, "wert": r1(f(j))} for j in jahre]


NACHFRAGE = [{"ab": 1980, "wert": 2.5}, {"ab": 2009, "wert": -3}, {"ab": 2010, "wert": 4}, {"ab": 2011, "wert": 2.5}]

for datei, iso, eigen in [("usa-2000", "USA", True), ("spanien-1998", "ESP", False), ("irland-2002", "IRL", False),
                          ("japan-1985", "JPN", True), ("kanada-2000", "CAN", True)]:
    p = f"daten/kalibrierung/{datei}.json"
    d = json.load(open(p))
    s = d["start"]
    jahre = range(s, s + d["jahre"])
    # Im Startjahr gilt der Leitzins des Falls (werte.leitzins), danach der gemessene Kurzfristzins.
    stir = lambda j: d["werte"]["leitzins"] if j == s else wert(iso, j, "stir")
    lang = iso if eigen else "DEU"
    d["welt"] = {
        "euroLeitzins": pfad(jahre, stir),
        "praemieWelt": pfad(jahre, lambda j: (wert(lang, j, "ltrate") - wert(lang, s, "ltrate")) - 0.5 * (stir(j) - stir(s))),
        **({} if datei.startswith("japan") else {"nachfrage": NACHFRAGE}),
    }
    if eigen:
        d["grund"] = {**d["grund"], "regime": "euro", "tpi": True}
        d["werte"]["eurogewicht"] = 0
    json.dump(d, open(p, "w"), ensure_ascii=False, indent=2)
    open(p, "a").write("\n")
    print(datei, {k: [x["wert"] for x in v][:10] for k, v in d["welt"].items() if k != "nachfrage"})
