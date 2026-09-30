# Ceteris – Wirtschaftssimulator / Economy Simulator

**[Ceteris öffnen / open Ceteris](https://farerlander.github.io/ceteris/)**

_Deutsch unten, English below._

## Deutsch

Ceteris ist eine Lern-App: Du drehst an den Stellschrauben eines Landes und siehst, was über 25, 50 oder 100 Jahre daraus folgt. Das betrifft Steuern, Rente, Zuwanderung, Energie, Geldpolitik und mehr.

- **Neun Länder:** Deutschland, USA, Japan, Großbritannien, Frankreich, Italien, Kanada, China, Russland. Die Startwerte kommen aus amtlichen Daten.
- **Die Regierung reagiert** auf Schwäche und enge Haushalte. Sie wählt nicht immer die beste Lösung, und du kannst jede Entscheidung umschalten.
- **Zufallsschocks** zeigen ein Band möglicher Zukünfte statt einer einzigen Linie.
- **Rückblick:** Deutschland 2000–2025 zeigt, wie gut das Modell die Vergangenheit trifft.
- **Konsens-Vergleich:** Die ersten Jahre stehen neben den Prognosen von IWF und nationalen Stellen.

**Was Ceteris nicht ist:** keine Prognose und keine absolute Wahrheit. Der Name kommt von _ceteris paribus_, „alles andere bleibt gleich“. So arbeitet jedes Modell, und das ist zugleich seine Grenze. Die App nennt ihre Schwächen offen im Reiter „Annahmen“ ([Kritikpunkte](docs/kritikpunkte.md)).

**Datenschutz:** Die App läuft nur in deinem Browser. Es gibt keinen Server, kein Konto und kein Tracking. Gespeicherte Szenarien liegen im Browser-Speicher und im Link.

## English

Ceteris is a learning app: turn a country's levers and see what follows over 25, 50 or 100 years. The levers cover taxes, pensions, migration, energy, monetary policy and more.

- **Nine countries:** Germany, USA, Japan, United Kingdom, France, Italy, Canada, China, Russia. Starting values come from official data.
- **The government reacts** to weakness and tight budgets. It does not always choose the best option, and you can switch every decision.
- **Random shocks** show a band of possible futures instead of a single line.
- **Look back:** Germany 2000–2025 shows how well the model matches the past.
- **Consensus comparison:** the first years are shown next to IMF and national forecasts.

**What Ceteris is not:** not a forecast and not the absolute truth. The name comes from _ceteris paribus_, "all else being equal". That is how every model works, and it is also its limit. The app states its weaknesses openly under "Assumptions" ([critique points](docs/kritikpunkte.md), German).

**Privacy:** the app runs only in your browser. There is no server, no account and no tracking.

## Daten und Belege / Data and evidence

- Daten / data: World Bank, IMF (World Economic Outlook), OECD, BIS, dazu Handwerte mit Quelle / plus hand-set values with sources.
- [docs/quellen.md](docs/quellen.md): Herkunft jedes Handwerts und jeder Wirkstärke / origin of every hand-set value and effect size.
- [docs/methodik/](docs/methodik/): Prüfungen und Eichungen / checks and calibrations.

## Lokal starten / run locally

```bash
npm ci
npm run dev      # App auf http://localhost:5173
npm test         # Tests
npm run daten    # Daten neu holen / refresh data
```

## Lizenz / License

Code: [MIT](LICENSE). Ausnahme / exception: `daten/kalibrierung/jst-auszug.csv` unter CC BY-NC-SA 4.0 ([Hinweis / notice](daten/kalibrierung/JST-LIZENZ.md)).
