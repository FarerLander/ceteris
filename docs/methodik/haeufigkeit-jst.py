# Spec 13.4: Häufigkeit und Schwere von Finanzkrisen, und wie die Wahrscheinlichkeit mit Kredit- und
# Hauspreislücke steigt. Daten: Macrohistory-Datenbank R6 (Jordà/Schularick/Taylor), 18 Länder.
# Aufruf: python haeufigkeit-jst.py <Pfad zu JSTdatasetR6.dta>
import sys
import numpy as np
import pandas as pd

np.seterr(all="ignore")

d = pd.read_stata(sys.argv[1])
d = d.sort_values(["iso", "year"]).reset_index(drop=True)

def gewichte(lam):  # wie modell/fruehwarnung.ts: stationäre Verstärkung des einseitigen HP-Filters
    q = 1 / lam
    p00, p01, p11 = 1e4, 0.0, 1e4
    g = (0.0, 0.0)
    for _ in range(2000):
        a00, a01, a11 = p00 + 2 * p01 + p11, p01 + p11, p11 + q
        f = a00 + 1
        g = (a00 / f, a01 / f)
        p00, p01, p11 = a00 - g[0] * a00, a01 - g[0] * a01, a11 - g[1] * a01
    return g

G0, G1 = gewichte(1562.5)

def luecke(x):
    out = np.full(len(x), np.nan)
    trend = steig = None
    for i, v in enumerate(x):
        if np.isnan(v):
            trend = steig = None
            continue
        if trend is None:
            trend, steig = v, 0.0
        else:
            vor = trend + steig
            f = v - vor
            trend, steig = vor + G0 * f, steig + G1 * f
        out[i] = v - trend
    return out

d["kredit"] = d["tloans"] / d["gdp"] * 100
d["haus"] = 100 * np.log(d["hpnom"] / d["cpi"])
d["kl"] = d.groupby("iso")["kredit"].transform(lambda s: luecke(s.to_numpy()))
d["hl"] = d.groupby("iso")["haus"].transform(lambda s: luecke(s.to_numpy()))
d["kl1"] = d.groupby("iso")["kl"].shift(1)
d["hl1"] = d.groupby("iso")["hl"].shift(1)
d["y"] = np.log(d["rgdpbarro"] if "rgdpbarro" in d else d["rgdpmad"])
d["g"] = d.groupby("iso")["y"].diff() * 100

def logit(X, y, it=50):
    X = np.column_stack([np.ones(len(X)), X])
    b = np.zeros(X.shape[1])
    for _ in range(it):
        p = 1 / (1 + np.exp(-np.clip(X @ b, -30, 30)))
        W = p * (1 - p)
        H = X.T @ (X * W[:, None])
        b = b + np.linalg.solve(H, X.T @ (y - p))
    se = np.sqrt(np.diag(np.linalg.inv(H)))
    return b, se

for name, von in [("1950–2020", 1950), ("1970–2020", 1970), ("1870–2020 ohne Kriegsjahre", 1870)]:
    s = d[(d.year >= von) & ~d.year.between(1914, 1919) & ~d.year.between(1939, 1947)]
    print(f"\n== {name}: {int(s.crisisJST.sum())} Krisen in {len(s)} Länderjahren = {s.crisisJST.mean() * 100:.2f} % pro Jahr")
    a = s.dropna(subset=["kl1"])
    b, se = logit(a[["kl1"]].to_numpy(), a.crisisJST.to_numpy())
    print(f"Logit nur Kreditlücke (n={len(a)}): a={b[0]:.3f} b={b[1]:.4f} (t {b[1] / se[1]:.1f}); SD Lücke {a.kl1.std():.1f} Pp.")
    for x in [-5, 0, 5, 10, 20]:
        print(f"   Lücke {x:+d} Pp.: {100 / (1 + np.exp(-(b[0] + b[1] * x))):.1f} % pro Jahr")
    a = s.dropna(subset=["kl1", "hl1"])
    b, se = logit(a[["kl1", "hl1"]].to_numpy(), a.crisisJST.to_numpy())
    print(f"Logit Kredit- und Hauspreislücke (n={len(a)}): a={b[0]:.3f} Kredit={b[1]:.4f} (t {b[1] / se[1]:.1f}) Haus={b[2]:.4f} (t {b[2] / se[2]:.1f}); SD Hauslücke {a.hl1.std():.1f}")
    for kx, hx in [(0, 0), (10, 0), (0, 20), (10, 20), (20, 30)]:
        print(f"   Kredit {kx:+d} Pp., Haus {hx:+d} %: {100 / (1 + np.exp(-(b[0] + b[1] * kx + b[2] * hx))):.1f} % pro Jahr")

# Schwere: Wachstum pro Kopf im Krisenjahr und im Jahr danach gegen das Mittel der zehn Jahre davor.
print("\n== Schwere ab 1950: Einbuße über zwei Jahre (Pp. Wachstum pro Kopf, Krisenjahr + Folgejahr, gegen die 10 Jahre davor)")
zeilen = []
for iso, g in d.groupby("iso"):
    g = g.set_index("year")
    for j in g.index[(g.crisisJST == 1) & (g.index >= 1950)]:
        davor = g.loc[j - 10 : j - 1, "g"].mean()
        if j + 1 in g.index and not np.isnan(davor):
            zeilen.append((iso, j, (g.loc[j, "g"] - davor) + (g.loc[j + 1, "g"] - davor)))
v = pd.DataFrame(zeilen, columns=["iso", "jahr", "einbusse"])
print(v.sort_values("einbusse").to_string(index=False))
q = v.einbusse.quantile([0.1, 0.25, 0.5, 0.75, 0.9])
print("Quantile 10/25/50/75/90:", [round(x, 1) for x in q])
print("2007/2008:", round(v[v.jahr.isin([2007, 2008])].einbusse.mean(), 1), "| übrige:", round(v[~v.jahr.isin([2007, 2008])].einbusse.mean(), 1))
# Abstand zwischen zwei Krisen im selben Land
ab = []
for iso, g in d[d.year >= 1950].groupby("iso"):
    j = g.year[g.crisisJST == 1].to_numpy()
    ab += list(np.diff(j))
print("Abstände zwischen Krisen im selben Land (Jahre):", sorted(int(x) for x in ab))
