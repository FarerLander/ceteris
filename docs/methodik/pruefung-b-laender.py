"""Spec 13.5 Teil B, Gegenprobe auf den Daten der App: Investitionsquote (Weltbank) gegen Kalman-Lücke (13.1).

Aufruf (im Projektordner): python3 docs/methodik/pruefung-b-laender.py
Je Land 2001–2024, einfache Regression mit Konstante. Kurze Reihen, deshalb nur Gegenprobe.
"""

import json
import math

print("Land  Steigung (Pp. Quote je % Lücke)  t     n   | Rezessionsjahre: mittlere Änderung der Quote")
for c in ["DE", "US", "JP", "GB", "FR", "IT", "CA", "CN", "RU"]:
    a = json.load(open(f"daten/laender/{c}.json"))["reihen"]
    s = json.load(open(f"daten/laender/{c}-schaetzung.json"))
    luecke = {p["jahr"]: p["wert"] for p in s["reihen"]["luecke"]}
    inv = {int(j): w for j, w in a.get("investQuote", {}).items()}
    wachstum = {int(j): w for j, w in a.get("wachstumReal", {}).items()}
    paare = []
    for j in sorted(inv):
        vor = [inv[y] for y in range(j - 10, j) if y in inv]
        if len(vor) >= 5 and j in luecke:
            paare.append((luecke[j], inv[j] - sum(vor) / len(vor)))
    n = len(paare)
    if n < 8:
        print(f"{c}    zu wenige Jahre ({n})")
        continue
    mx = sum(x for x, _ in paare) / n
    my = sum(y for _, y in paare) / n
    sxx = sum((x - mx) ** 2 for x, _ in paare)
    b = sum((x - mx) * (y - my) for x, y in paare) / sxx
    res = [y - my - b * (x - mx) for x, y in paare]
    se = math.sqrt(sum(e * e for e in res) / (n - 2) / sxx)
    rez = [inv[j] - inv[j - 1] for j in inv if j - 1 in inv and wachstum.get(j, 1) < -1]
    print(f"{c}    {b:6.2f}                           {b / se:5.1f} {n:3d}   | {sum(rez) / len(rez) if rez else float('nan'):5.2f} Pp. in {len(rez)} Jahren")
