"""Spec 13.13 Task 2: Prüfung der Gini- und Armuts-Treiber (Entscheidungsvorlage, Rechenkern unverändert).

Aufruf (im Projektordner, Python mit pandas und numpy):
    python docs/methodik/pruefung-gini.py [Datenordner] > docs/methodik/ergebnis-gini.txt

Die Rohdaten werden in den Datenordner geladen (Vorgabe: Systemordner für temporäre Dateien) und
gehören nicht ins Repo. Genutzte Adressen (Stand 30.09.2026):

- OECD Income Distribution Database:
  https://sdmx.oecd.org/public/rest/data/OECD.WISE.INE,DSD_WISE_IDD@DF_IDD/all
- OECD Revenue Statistics (Gesamtstaat, % BIP):
  https://sdmx.oecd.org/public/rest/data/OECD.CTP.TPS,DSD_REV_COMP_OECD@DF_RSOECD/
- OECD Social Expenditure (öffentlich, % BIP):
  https://sdmx.oecd.org/public/rest/data/OECD.ELS.SPD,DSD_SOCX_AGG@DF_SOCX_AGG/
- Weltbank Arbeitslosenquote (Kontrollgröße): SL.UEM.TOTL.ZS

Einheiten: Gini in Punkten (0–100), Armut in % der Bevölkerung, Instrumente in % BIP.
"""

import json
import os
import subprocess
import sys
import tempfile
import time
import urllib.request

import numpy as np
import pandas as pd

ORDNER = (
    sys.argv[1]
    if len(sys.argv) > 1
    else os.path.join(tempfile.gettempdir(), "pruefung-gini")
)
os.makedirs(ORDNER, exist_ok=True)

OECD = "https://sdmx.oecd.org/public/rest/data/"
QUELLEN = {
    "idd.csv": OECD
    + "OECD.WISE.INE,DSD_WISE_IDD@DF_IDD/all?startPeriod=1990&format=csvfilewithlabels",
    "rev.csv": OECD
    + "OECD.CTP.TPS,DSD_REV_COMP_OECD@DF_RSOECD/.TAX_REV.S13.T_1100+T_1200+T_2000+T_4000+T_4300+T_5111+T_5000+_T._T.PT_B1GQ.A?startPeriod=1990&format=csvfilewithlabels",
    "socx.csv": OECD
    + "OECD.ELS.SPD,DSD_SOCX_AGG@DF_SOCX_AGG/.A.SOCX.PT_B1GQ.ES10.C+K+_T.TP11+TP01+TP21+TP51+TP71+TP31+TP82+TP91+_T.?startPeriod=1990&format=csvfilewithlabels",
    "alq.json": "https://api.worldbank.org/v2/country/all/indicator/SL.UEM.TOTL.ZS?format=json&per_page=20000&date=1990:2024",
}


def lade(name):
    pfad = os.path.join(ORDNER, name)
    if os.path.exists(pfad) and os.path.getsize(pfad) > 1000:
        return pfad
    for versuch in range(5):
        try:
            with urllib.request.urlopen(
                urllib.request.Request(
                    QUELLEN[name], headers={"User-Agent": "pruefung-gini"}
                ),
                timeout=300,
            ) as r:
                open(pfad, "wb").write(r.read())
            return pfad
        except urllib.error.HTTPError as e:
            if e.code != 429 or versuch == 4:
                raise
            time.sleep(60)
    return pfad


# ---------- 1. Daten ----------
idd = pd.read_csv(lade("idd.csv"), low_memory=False)
alle = idd[idd.DEFINITION == "D_CUR"]
idd = alle[alle.AGE == "_T"]
mass = {
    # Anteil der über 65-Jährigen und ihre Armutsquote: für die Prüfung des Rentenniveaus.
    "anteil65": alle[(alle.MEASURE == "AG_S") & alle.AGE.isin(["Y66T75", "Y_GE76"])].groupby(["REF_AREA", "METHODOLOGY", "TIME_PERIOD"], as_index=False).OBS_VALUE.sum(),
    "armut60Alte": alle[(alle.MEASURE == "PR_INC_DISP") & (alle.POVERTY_LINE == "PL_60") & (alle.AGE == "Y_GT65")],
    "armut50Alte": alle[(alle.MEASURE == "PR_INC_DISP") & (alle.POVERTY_LINE == "PL_50") & (alle.AGE == "Y_GT65")],
    "giniVerf": idd[idd.MEASURE == "INC_DISP_GINI"],
    "giniMarkt": idd[idd.MEASURE == "INC_MRKT_GINI"],
    "armut50": idd[(idd.MEASURE == "PR_INC_DISP") & (idd.POVERTY_LINE == "PL_50")],
    "armut60": idd[(idd.MEASURE == "PR_INC_DISP") & (idd.POVERTY_LINE == "PL_60")],
}
schl = ["REF_AREA", "METHODOLOGY", "TIME_PERIOD"]
panel = None
for name, d in mass.items():
    s = d.groupby(schl).OBS_VALUE.mean().rename(name)
    panel = s.to_frame() if panel is None else panel.join(s, how="outer")
panel = panel.reset_index()
panel[["giniVerf", "giniMarkt"]] *= 100  # OECD liefert 0–1
panel["umverteilung"] = panel.giniMarkt - panel.giniVerf

rev = pd.read_csv(lade("rev.csv"), low_memory=False)
rev = rev.pivot_table(
    index=["REF_AREA", "TIME_PERIOD"], columns="STANDARD_REVENUE", values="OBS_VALUE"
)
rev = rev.rename(
    columns={
        "T_1100": "est",
        "T_1200": "kst",
        "T_2000": "sv",
        "T_4000": "vermoegen",
        "T_4300": "erbschaft",
        "T_5111": "mwst",
        "T_5000": "gueter",
        "_T": "steuern",
    }
)

socx = pd.read_csv(lade("socx.csv"), low_memory=False)
socx["k"] = socx.PROGRAMME_TYPE + "_" + socx.SPENDING_TYPE
socx = socx.pivot_table(
    index=["REF_AREA", "TIME_PERIOD"], columns="k", values="OBS_VALUE"
)
socx = socx.rename(
    columns={
        "TP51__T": "familie",
        "TP51_C": "familieGeld",
        "TP01_C": "alter",
        "TP71_C": "alg",
        "TP31_C": "invaliditaet",
        "TP82__T": "wohnen",
        "TP91__T": "sonstige",
        "_T__T": "sozial",
        "_T_C": "sozialGeld",
    }
)

wb = json.load(open(lade("alq.json")))[1]
alq = pd.DataFrame(
    [
        (x["countryiso3code"], int(x["date"]), x["value"])
        for x in wb
        if x["value"] is not None
    ],
    columns=["REF_AREA", "TIME_PERIOD", "alq"],
).set_index(["REF_AREA", "TIME_PERIOD"])

panel = (
    panel.join(rev, on=["REF_AREA", "TIME_PERIOD"])
    .join(socx, on=["REF_AREA", "TIME_PERIOD"])
    .join(alq, on=["REF_AREA", "TIME_PERIOD"])
)
# Rentenniveau als Näherung: Altersausgaben je Kopf der über 65-Jährigen in % des BIP pro Kopf
# (Deutschland 2021: 10,8 / 20,5 % = 53). Trennt das Niveau von der Alterung, die die Ausgaben ohnehin treibt.
panel["niveau"] = panel.alter / panel.anteil65 * 100
panel["einheit"] = (
    panel.REF_AREA + "/" + panel.METHODOLOGY
)  # Bruch der Einkommensdefinition 2011/2012 = eigene Einheit


# ---------- 2. Panel mit Länder- und Jahreseffekten, Standardfehler nach Ländern geclustert ----------
def schaetze(y, xs, d=panel):
    d = d.dropna(subset=[y] + xs)
    d = d[d.groupby("einheit")[y].transform("size") >= 3]
    X = np.column_stack(
        [d[xs].to_numpy(float)]
        + [pd.get_dummies(d.einheit).to_numpy(float)]
        + [pd.get_dummies(d.TIME_PERIOD).to_numpy(float)[:, 1:]]
    )
    Y = d[y].to_numpy(float)
    beta, *_ = np.linalg.lstsq(X, Y, rcond=None)
    res = Y - X @ beta
    XtXi = np.linalg.pinv(X.T @ X)
    fleisch = np.zeros((X.shape[1], X.shape[1]))
    laender = d.REF_AREA.to_numpy()
    for c in np.unique(laender):
        g = X[laender == c].T @ res[laender == c]
        fleisch += np.outer(g, g)
    G = len(np.unique(laender))
    V = XtXi @ fleisch @ XtXi * G / (G - 1)
    se = np.sqrt(np.diag(V))[: len(xs)]
    return {x: (beta[i], se[i], beta[i] / se[i]) for i, x in enumerate(xs)}, len(d), G


def zeige(titel, y, xs, d=panel):
    erg, n, G = schaetze(y, xs, d)
    print(f"\n{titel}\n  abhängig: {y}; n = {n}, Länder = {G}")
    for x, (b, se, t) in erg.items():
        print(f"  {x:12s} {b:7.3f}  (SE {se:5.3f}, t {t:5.1f})")
    return erg


print("=" * 100)
print("1. PANEL: OECD IDD gegen Revenue Statistics und SOCX, Länder- und Jahreseffekte")
print("=" * 100)
print(
    f"Beobachtungen mit Gini verfügbar: {panel.giniVerf.notna().sum()}, mit Gini Markt: {panel.giniMarkt.notna().sum()}, Länder: {panel.REF_AREA.nunique()}"
)
INSTR = ["est", "sv", "mwst", "vermoegen", "familie", "alter", "alg", "alq"]
A = zeige(
    "A. Umverteilung (Gini Markt − Gini verfügbar), positiv = gleicht aus",
    "umverteilung",
    INSTR,
)
B = zeige(
    "B. Gegenprobe: Gini verfügbar direkt, negativ = gleicht aus", "giniVerf", INSTR
)
C = zeige(
    "C. Gini verfügbar, ohne Kontrolle für Arbeitslosigkeit",
    "giniVerf",
    [x for x in INSTR if x != "alq"],
)
D = zeige("D. Armutsquote (60 % des Medians)", "armut60", INSTR)
E = zeige("E. Armutsquote (50 % des Medians)", "armut50", INSTR)
NIV = ["est", "sv", "mwst", "familie", "niveau", "anteil65", "alq"]
H = zeige("G. Rentenniveau (Altersausgaben je Kopf 65+ in % des BIP pro Kopf) statt Altersausgaben: Gini verfügbar", "giniVerf", NIV)
I = zeige("H. Rentenniveau: Armutsquote (60 %), alle", "armut60", NIV)
J = zeige("I. Rentenniveau: Armutsquote (60 %) der über 65-Jährigen", "armut60Alte", NIV)
K = zeige("J. Rentenniveau: Armutsquote (50 %) der über 65-Jährigen", "armut50Alte", NIV)
G7 = panel[panel.REF_AREA.isin(["DEU", "USA", "JPN", "GBR", "FRA", "ITA", "CAN"])]
F = zeige(
    "F. Nur die sieben OECD-Länder der App: Gini verfügbar", "giniVerf", INSTR, G7
)

# ---------- 3. Querschnitt (Ländermittel seit 2012): Niveau der Umverteilung je % BIP ----------
print("\n" + "=" * 100)
print("2. QUERSCHNITT: Ländermittel 2012–2023 (neue Einkommensdefinition)")
print("=" * 100)
q = (
    panel[(panel.METHODOLOGY == "METH2012")]
    .groupby("REF_AREA")[
        [
            "umverteilung",
            "giniVerf",
            "giniMarkt",
            "armut50",
            "armut60",
            "est",
            "sv",
            "mwst",
            "vermoegen",
            "familie",
            "alter",
            "alg",
            "sozialGeld",
        ]
    ]
    .mean()
    .dropna()
)


def ols(y, xs, d):
    X = np.column_stack([np.ones(len(d)), d[xs].to_numpy(float)])
    Y = d[y].to_numpy(float)
    b, *_ = np.linalg.lstsq(X, Y, rcond=None)
    r = Y - X @ b
    V = np.linalg.inv(X.T @ X) * (r @ r) / (len(d) - X.shape[1])
    se = np.sqrt(np.diag(V))
    print(
        f"  abhängig: {y}; n = {len(d)}; R² = {1 - (r @ r) / ((Y - Y.mean()) @ (Y - Y.mean())):.2f}"
    )
    for i, x in enumerate(xs):
        print(
            f"  {x:12s} {b[i + 1]:7.3f}  (SE {se[i + 1]:5.3f}, t {b[i + 1] / se[i + 1]:5.1f})"
        )


print(
    f"Mittel über {len(q)} Länder: Gini Markt {q.giniMarkt.mean():.1f}, verfügbar {q.giniVerf.mean():.1f}, Umverteilung {q.umverteilung.mean():.1f} Punkte;"
)
print(
    f"Geldleistungen {q.sozialGeld.mean():.1f} % BIP, Einkommensteuer {q.est.mean():.1f} % BIP, Sozialabgaben {q.sv.mean():.1f} % BIP."
)
print("\nUmverteilung auf Einkommensteuer und Geldleistungen:")
ols("umverteilung", ["est", "sozialGeld"], q)
print("\nUmverteilung auf alle Instrumente:")
ols("umverteilung", ["est", "mwst", "vermoegen", "familie", "alter", "alg"], q)
print("\nGini verfügbar auf alle Instrumente:")
ols("giniVerf", ["est", "mwst", "vermoegen", "familie", "alter", "alg"], q)
print("\nArmut (60 %) auf alle Instrumente:")
ols("armut60", ["est", "mwst", "vermoegen", "familie", "alter", "alg"], q)

de = panel[(panel.REF_AREA == "DEU") & (panel.METHODOLOGY == "METH2012")].set_index(
    "TIME_PERIOD"
)
print("\nDeutschland, letztes Jahr mit allen Werten:")
print(
    de[
        [
            "giniMarkt",
            "giniVerf",
            "umverteilung",
            "armut50",
            "armut60",
            "est",
            "sv",
            "mwst",
            "vermoegen",
            "familie",
            "alter",
        ]
    ]
    .dropna()
    .tail(1)
    .round(1)
    .to_string()
)

# ---------- 4. Vorschlag und Probe an Deutschland ----------
# Die Werte sind die Entscheidung aus pruefung-gini.md (Abschnitt „Urteil“). 0 = nicht aufnehmen.
VORSCHLAG = json.loads(os.environ.get("GINI_VORSCHLAG", "null")) or {
    "staat.giniEinkommensteuer": 0.3,
    "staat.giniKapital": 0.3,
    "staat.giniMwst": 0.1,
    "staat.giniTransfers": 0.5,
    "staat.giniRente": 0.04,
    "staat.armutTransfers": 0.6,
    "staat.armutRente": 0.05,
}
GINI_ALQ, GINI_LOHNERSATZ = 0.3, 10  # heutige Wirkstärken im Verzeichnis

print("\n" + "=" * 100)
print("3. PROBE DEUTSCHLAND: Rückblick 2000–2025 mit den vorgeschlagenen Werten")
print("=" * 100)
print("Vorschlag:", json.dumps(VORSCHLAG))
rb = json.loads(
    subprocess.run(
        ["npx", "tsx", "docs/methodik/gini-rueckblick.ts"],
        capture_output=True,
        text=True,
        check=True,
    ).stdout
)
s, basis = rb["start"], rb["basis"]
oecd = (
    panel[panel.REF_AREA == "DEU"]
    .sort_values("METHODOLOGY")
    .groupby("TIME_PERIOD")
    .giniVerf.last()
)  # neue Definition geht vor
wbGini = {int(j): w for j, w in (rb["istGini"] or {}).items()}
print(
    f"\nStartwert des Modells 2000: {s['gini']} (Startwert der App). OECD 2000: {oecd.get(2000):.1f}. Verglichen wird die Änderung seit 2000."
)
print(
    "\nJahr  Modell alt  Modell neu   OECD  Ist-App | davon: ESt   MwSt  Familie  Rente"
)
zeilen = []
for z in rb["jahre"]:
    h = z["hebel"]
    mehr = lambda x: (h[f"steuer.{x}"] - basis[f"steuer.{x}"]) * s["steuerBasen"][x]
    d = lambda i: h[i] - basis[i]
    teile = {
        "est": -VORSCHLAG["staat.giniEinkommensteuer"] * mehr("einkommen"),
        "kap": -VORSCHLAG["staat.giniKapital"]
        * (mehr("kapitalertrag") + mehr("vermoegen") + mehr("erbschaft")),
        "mwst": VORSCHLAG["staat.giniMwst"] * mehr("mwst"),
        "fam": -VORSCHLAG["staat.giniTransfers"] * d("staat.familie"),
        "rente": -VORSCHLAG["staat.giniRente"] * d("rente.niveau"),
    }
    # Vor dem Einbau von Hand (Satz × Bemessungsgrundlage); danach der Lauf des Modells, das mit dem
    # tatsächlichen Aufkommen rechnet. Die Spalten „davon“ bleiben die Handrechnung.
    neu = z["gini"] + sum(teile.values()) if z.get("giniNeu") is None else z["giniNeu"]
    zeilen.append(
        (
            z["jahr"],
            z["gini"],
            neu,
            oecd.get(z["jahr"], np.nan),
            wbGini.get(z["jahr"], np.nan),
        )
    )
    print(
        f"{z['jahr']}  {z['gini']:9.2f}  {neu:10.2f}  {oecd.get(z['jahr'], np.nan):5.1f}  {wbGini.get(z['jahr'], np.nan):8.1f} | {teile['est']:9.2f} {teile['mwst']:6.2f} {teile['fam']:8.2f} {teile['rente']:6.2f}"
    )
t = pd.DataFrame(zeilen, columns=["jahr", "alt", "neu", "oecd", "wb"]).set_index("jahr")
rmse = lambda a, b: float(np.sqrt(((a - b) ** 2).dropna().mean()))
print("\nRMSE des Niveaus („Ist-App“ = Ist-Reihe des Rückblicks in der App: bis Task 3 Weltbank, seit Task 4 OECD):")
print(f"  gegen Ist-App:  alt {rmse(t.alt, t.wb):.2f}, neu {rmse(t.neu, t.wb):.2f}")
print(f"  gegen OECD:     alt {rmse(t.alt, t.oecd):.2f}, neu {rmse(t.neu, t.oecd):.2f}")
print("RMSE der Änderung seit 2000 (jede Reihe auf ihren eigenen Wert 2000 bezogen):")
print(
    f"  gegen Ist-App:  alt {rmse(t.alt - t.alt[2000], t.wb - t.wb[2000]):.2f}, neu {rmse(t.neu - t.neu[2000], t.wb - t.wb[2000]):.2f}"
)
print(
    f"  gegen OECD:     alt {rmse(t.alt - t.alt[2000], t.oecd - t.oecd[2000]):.2f}, neu {rmse(t.neu - t.neu[2000], t.oecd - t.oecd[2000]):.2f}"
)
