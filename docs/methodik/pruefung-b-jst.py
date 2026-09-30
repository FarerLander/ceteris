"""Spec 13.5 Teil B, Hypothese 2: Folgen die Investitionen der Produktionslücke (Akzelerator)?

Aufruf: python pruefung-b-jst.py JSTdatasetR6.dta
Macrohistory-Datenbank (Jordà/Schularick/Taylor, R6), 18 Länder, 1955–2019. Nur numpy und pandas.
Länder-Fixeffekte, Standardfehler nach Ländern geclustert.
"""

import sys
import numpy as np
import pandas as pd

d = pd.read_stata(sys.argv[1] if len(sys.argv) > 1 else "jst.dta")
d = d.sort_values(["iso", "year"]).reset_index(drop=True)


def hp(x, lam=100.0):
    x = np.asarray(x, float)
    n = len(x)
    D = np.zeros((n - 2, n))
    for i in range(n - 2):
        D[i, i : i + 3] = [1, -2, 1]
    return np.linalg.solve(np.eye(n) + lam * D.T @ D, x)


teile = []
for iso, g in d.groupby("iso"):
    g = g.copy()
    g["ly"] = np.log(g["rgdpbarro"])
    ok = g["ly"].notna() & (g["year"] >= 1948)
    g["luecke"] = np.nan
    if ok.sum() > 10:
        idx = g.index[ok]
        y = g.loc[idx, "ly"].interpolate().values
        g.loc[idx, "luecke"] = (y - hp(y)) * 100
    g["infl"] = g["cpi"].pct_change() * 100
    g["greal"] = g["rgdpbarro"].pct_change() * 100
    g["inv"] = g["iy"] * 100  # Investitionsquote, % BIP
    # Abweichung vom eigenen Trend (nur Vergangenheit: 10-Jahres-Schnitt der Vorjahre), wie das Modell
    # die Quote um den Startwert führt.
    g["invTrend"] = g["inv"].shift().rolling(10, min_periods=5).mean()
    g["invAbw"] = g["inv"] - g["invTrend"]
    g["dInv"] = g["inv"] - g["inv"].shift()
    g["kosten"] = g["ltrate"] - g["infl"]  # realer Langfristzins, der Modellkanal
    for c in ["luecke", "kosten", "greal", "invAbw"]:
        g[c + "_1"] = g[c].shift()
    g["dLuecke"] = g["luecke"] - g["luecke_1"]
    teile.append(g)
p = pd.concat(teile)
p = p[(p["year"] >= 1955) & (p["year"] <= 2019)]
p = p[(p["infl"].abs() < 30)]


def ols(df, y, xs, name, cluster="iso"):
    df = df.dropna(subset=[y] + xs).copy()
    for c in [y] + xs:
        df[c + "_d"] = df[c] - df.groupby("iso")[c].transform("mean")
    X = df[[c + "_d" for c in xs]].values
    Y = df[y + "_d"].values
    XtX = np.linalg.inv(X.T @ X)
    b = XtX @ X.T @ Y
    e = Y - X @ b
    meat = np.zeros((len(xs), len(xs)))
    for _, gi in df.groupby(cluster).indices.items():
        s = X[gi].T @ e[gi]
        meat += np.outer(s, s)
    G = df[cluster].nunique()
    se = np.sqrt(np.diag(XtX @ meat @ XtX) * G / max(1, G - 1))
    r2 = 1 - (e @ e) / (Y @ Y)
    print(f"\n{name}  (n={len(df)}, Länder={G}, R²={r2:.2f})")
    for x, bi, si in zip(xs, b, se):
        print(f"  {x:12s} {bi:7.3f}  (t {bi / si:5.1f})")
    return dict(zip(xs, b))


print("=== H2: Folgt die Investitionsquote der Produktionslücke? ===")
print("Abhängig: Investitionsquote minus ihr Trend (Pp. BIP). Modellkanal heute: realer Langfristzins des Vorjahres.")
ols(p, "invAbw", ["kosten_1"], "Nur Modellkanal (heute)")
ols(p, "invAbw", ["kosten_1", "luecke"], "Mit Lücke des Jahres")
ols(p, "invAbw", ["kosten_1", "luecke_1"], "Mit Lücke des Vorjahres")
ols(p, "invAbw", ["kosten_1", "luecke", "luecke_1"], "Mit beiden")
ols(p[p.year >= 1985], "invAbw", ["kosten_1", "luecke"], "Mit Lücke des Jahres, ab 1985")
print("\nÄnderung der Quote gegen Änderung der Lücke (Akzelerator im engen Sinn):")
ols(p, "dInv", ["dLuecke"], "Δ Quote auf Δ Lücke")
ols(p, "dInv", ["greal"], "Δ Quote auf Wachstum")

print("\n--- Je Land: Quote minus Trend auf Lücke des Jahres (mit Zins) ---")
for iso in ["DEU", "USA", "GBR", "FRA", "ITA", "JPN", "CAN", "ESP"]:
    q = p[p.iso == iso].dropna(subset=["invAbw", "kosten_1", "luecke"])
    X = np.column_stack([np.ones(len(q)), q[["kosten_1", "luecke"]].values])
    Y = q["invAbw"].values
    b = np.linalg.lstsq(X, Y, rcond=None)[0]
    e = Y - X @ b
    n, k = X.shape
    # Newey-West mit 2 Verzögerungen
    S = (X * e[:, None]).T @ (X * e[:, None])
    for L in (1, 2):
        w = 1 - L / 3
        G = (X[L:] * e[L:, None]).T @ (X[:-L] * e[:-L, None])
        S += w * (G + G.T)
    V = np.linalg.inv(X.T @ X) @ S @ np.linalg.inv(X.T @ X)
    print(f"  {iso}: Lücke {b[2]:6.3f} (t {b[2] / np.sqrt(V[2, 2]):5.1f}), Zins {b[1]:6.3f}, n={n}")

print("\n--- Rezessionen: Wie stark fällt die Quote? ---")
r = p[(p["greal"] < -1)].dropna(subset=["dInv"])
print(f"  Jahre mit BIP pro Kopf unter −1 %: n={len(r)}, mittlere Änderung der Quote {r['dInv'].mean():.2f} Pp., im Folgejahr dazu: siehe Panel")
print(f"  alle übrigen Jahre: mittlere Änderung {p[p['greal'] >= -1]['dInv'].mean():.2f} Pp.")
