"""Spec 13.6, Task 6: Auszug aus der Macrohistory-Datenbank für die Kalibrierfälle mit Bankenkrise.

Aufruf: python jst-auszug.py JSTdatasetR6.dta > daten/kalibrierung/jst-auszug.csv
Quelle: Jordà/Schularick/Taylor, Macrohistory Database R6, macrohistory.net (frei nutzbar mit
Namensnennung). Nur die benötigten Spalten und Länder, 1980–2020. Braucht pandas.
"""

import sys
import pandas as pd

SPALTEN = ["iso", "year", "rgdpbarro", "gdp", "cpi", "stir", "ltrate", "hpnom", "unemp", "debtgdp",
           "tloans", "lev", "crisisJST", "revenue", "expenditure"]
LAENDER = ["USA", "ESP", "IRL", "JPN", "CAN", "DEU"]

d = pd.read_stata(sys.argv[1])
d = d[d.iso.isin(LAENDER) & (d.year >= 1980) & (d.year <= 2020)][SPALTEN]
d["iso"] = pd.Categorical(d.iso, LAENDER)
d = d.sort_values(["iso", "year"])
d["year"] = d.year.astype(int)
d["crisisJST"] = d.crisisJST.astype(int)
print("# Jordà/Schularick/Taylor, Macrohistory Database R6, macrohistory.net")
print("# Lizenz: CC BY-NC-SA 4.0 (nicht kommerziell), abgerufen 30.09.2026; siehe JST-LIZENZ.md")
sys.stdout.write(d.to_csv(index=False, float_format="%.6g"))
