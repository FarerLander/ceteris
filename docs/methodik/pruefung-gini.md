# 13.13 Task 2 — Prüfung der Gini- und Armuts-Treiber

Stand 30.09.2026. Entscheidungsvorlage für Task 3; der Rechenkern ist hier unverändert.
Skript: [pruefung-gini.py](pruefung-gini.py), Ausgabe: [ergebnis-gini.txt](ergebnis-gini.txt), Hilfsskript für den Rückblick: [gini-rueckblick.ts](gini-rueckblick.ts).

> **Stand der Zahlen:** Task 2, vor dem Einbau. Die Ergebnisdatei zeigt den Rückblick mit dem damaligen Startwert (Weltbank 28,7) und der Weltbank-Reihe als „Ist“. Seit Task 4 startet der Rückblick auf dem OECD-Wert (26,4); ein neuer Lauf des Skripts rechnet damit.

## Befund

**Alle sieben Wirkstärken werden aufgenommen, jede als umstritten (abschaltbar).** Zwei sind gut belegt, fünf dünn:

- **Gut belegt:** Einkommensteuer → Gini (|t| 2,5 bis 3,7, Zerlegung ergibt dieselbe Größe) und Familienleistungen → Armut (t −2,3).
- **Dünn belegt:** Familienleistungen → Gini (Vorzeichen stimmt, aber t nur −1,5 bis −2,0, und die Schätzung der Umverteilung zeigt nichts), Steuern auf Kapital, Vermögen und Erbschaft (im Panel nicht getrennt messbar), Mehrwertsteuer (im Panel deutlich, aber der gemessene Gini enthält Verbrauchsteuern gar nicht), Rentenniveau → Gini (Vorzeichen stimmt, t = −1,5) und Rentenniveau → Armut (nur bei den über 65-Jährigen belegt).
- **Probe Deutschland:** Der neue Pfad trifft die Änderung des Gini seit 2000 besser als der alte (RMSE gegen OECD 2,63 statt 2,84; gegen Weltbank 2,47 statt 2,66). Er bleibt trotzdem zu flach: Den Anstieg 2000–2005 und 2019–2021 erklären Steuern und Transfers nur zu einem kleinen Teil.

## Werte für Task 3

| Eintrag                     | Wert | Einheit                                 | Panel (Länder- und Jahreseffekte)                                                                             | Zerlegung                     | Urteil                                         |
| --------------------------- | ---- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------- | ---------------------------------------------- |
| `staat.giniEinkommensteuer` | 0,3  | Gini-Punkte je % BIP Aufkommen          | −0,29 (t −2,5); ohne Arbeitslosigkeit −0,33 (t −3,0); Umverteilung +0,39 (t 3,7)                              | 0,39                          | aufnehmen                                      |
| `staat.giniKapital`         | 0,3  | Gini-Punkte je % BIP Aufkommen          | nicht getrennt messbar; Steuern auf Vermögen insgesamt +0,11 (t 1,8, falsches Vorzeichen)                     | 0,6 bis 0,7, gemessen weniger | aufnehmen, dünn belegt                         |
| `staat.giniMwst`            | 0,1  | Gini-Punkte je % BIP Aufkommen (erhöht) | +0,39 (t 2,0) bis +0,45 (t 2,5)                                                                               | 0,05 bis 0,1                  | aufnehmen, dünn belegt, Wert aus der Zerlegung |
| `staat.giniTransfers`       | 0,5  | Gini-Punkte je % BIP                    | −0,51 (t −1,8); ohne Arbeitslosigkeit −0,59 (t −1,96); Umverteilung +0,15 (t 0,8)                                                          | 0,5                           | aufnehmen, dünn belegt |
| `staat.giniRente`           | 0,04 | Gini-Punkte je Pp. Rentenniveau         | −0,038 (t −1,5)                                                                                               | 0,045                         | aufnehmen, dünn belegt                         |
| `staat.armutTransfers`      | 0,6  | Pp. Armutsquote je % BIP                | −0,57 (t −2,3) bei 60 % des Medians; −0,40 (t −1,9) bei 50 %                                                  | —                             | aufnehmen                                      |
| `staat.armutRente`          | 0,05 | Pp. Armutsquote je Pp. Rentenniveau     | über 65-Jährige −0,27 (t −2,8), mal Bevölkerungsanteil 20 % = −0,05; alle: +0,02 (t 1,7, falsches Vorzeichen) | —                             | aufnehmen, dünn belegt                         |

## Vorgehen

**Daten.** OECD Income Distribution Database (Gini des Markteinkommens, Gini des verfügbaren Einkommens, Armutsquote bei 50 % und 60 % des Medians, Altersanteile), OECD Revenue Statistics (Gesamtstaat, % BIP: 1100 Einkommensteuer natürlicher Personen, 2000 Sozialabgaben, 5111 Mehrwertsteuer, 4000 Steuern auf Vermögen), OECD Social Expenditure (öffentlich, % BIP: Familie, Alter und Hinterbliebene, Arbeitslosigkeit), Weltbank Arbeitslosenquote als Kontrollgröße. 36 bis 37 Länder, 1990–2023, 747 bis 848 Beobachtungen je Schätzung (sieben Länder der App: 206). Die Adressen stehen im Skript; die Rohdaten liegen nicht im Repo.

**Panel.** Länder- und Jahreseffekte, Standardfehler nach Ländern geclustert. Der Wechsel der Einkommensdefinition 2011/2012 zählt als eigene Einheit je Land, damit der Bruch nicht als Wirkung erscheint. Drei Fassungen: Umverteilung (Gini Markt minus Gini verfügbar), Gini verfügbar direkt, Armutsquote.

**Rentenniveau.** Die Altersausgaben in % BIP taugen nicht als Maß: Sie steigen mit der Alterung, auch wenn das Niveau gleich bleibt. Als Näherung dient „Altersausgaben je Kopf der über 65-Jährigen in % des BIP pro Kopf“ (Deutschland 2021: 10,8 % BIP ÷ 20,5 % Bevölkerungsanteil = 53; das Rentenniveau des Modells liegt bei 48). Eine Einheit dieser Größe entspricht einem Prozentpunkt Rentenniveau.

**Zerlegung als Gegenrechnung** (Kakwani 1977, **ungeprüft**). Eine Steuer mit Anteil `t` am Einkommen ändert den Gini um rund `t · (K − G)`, wobei `K` sagt, wie stark die Steuer bei hohen Einkommen anfällt (Konzentration), und `G` der Gini vor der Steuer ist. 1 % BIP sind rund 1,4 % der Haushaltseinkommen.

- Einkommensteuer: `K` rund 0,65, `G` rund 0,38 → 0,014 · 0,27 = 0,39 Punkte je % BIP. Das Panel liefert 0,29 bis 0,39.
- Familienleistungen: gehen überwiegend an untere und mittlere Einkommen (`K` rund −0,05) → 0,014 · 0,35 = 0,5 Punkte je % BIP. Das Panel liefert 0,5 bis 0,6.
- Renten: in Deutschland beitragsbezogen (`K` rund +0,15) → 0,2 Punkte je % BIP; ein Punkt Rentenniveau kostet rund 0,21 % BIP → 0,045 Punkte je Pp. Das Panel liefert 0,038.
- Kapitalertrag und Vermögen: `K` rund 0,85 → 0,6 bis 0,7 Punkte je % BIP. Befragungen erfassen sehr hohe Einkommen schlecht; im gemessenen Gini kommt davon weniger an.
- Mehrwertsteuer: belastet niedrige Einkommen etwas stärker (`K` rund 0,25 gegen `G` 0,30) → 0,05 bis 0,1 Punkte je % BIP.

**Querschnitt** (Mittel 2012–2023 je Land, 36 Länder): Markt-Gini 47,2, verfügbar 31,7, Umverteilung 15,6 Punkte bei Geldleistungen von 12,1 % BIP. Ein Prozent BIP Geldleistungen geht mit 1,0 Punkten mehr Umverteilung einher (t 7,3), ein Prozent BIP Einkommensteuer mit 0,15 (t 1,1). Der Querschnitt misst Ländertypen, nicht die Wirkung einer Änderung; er dient nur als Größenordnung.

**Literatur** (alles **ungeprüft**, nicht im Original nachgelesen):

- Joumard/Pisu/Bloch 2012 (OECD, „Tackling income inequality: the role of taxes and transfers“): Steuern und Transfers senken den Gini im OECD-Mittel um rund ein Viertel; etwa drei Viertel davon über Transfers, ein Viertel über Steuern. Familien- und Wohnleistungen sind je Euro am stärksten umverteilend, beitragsbezogene Renten am wenigsten.
- Causa/Hermansen 2017 (OECD): Die Umverteilung ist seit Mitte der 1990er-Jahre gesunken, vor allem über Transfers.
- Immervoll/Richardson 2011: Leistungen wirken stärker als Steuern; die Einkommensteuer ist progressiv, ihr Gewicht aber kleiner.
- OECD/KIPF 2014 („The Distributional Effects of Consumption Taxes in OECD Countries“): Die Mehrwertsteuer ist gemessen am Einkommen regressiv, gemessen am Verbrauch etwa proportional.

Die Richtung und die Rangfolge passen zum Panel (Familienleistungen > Einkommensteuer > Renten). Einen Wert „je % BIP“ nennt keine der Quellen so, dass er sich ungeprüft übernehmen ließe; die Werte oben stammen aus Panel und Zerlegung.

## Urteil je Instrument

Regel aus dem Plan: aufnehmen, wenn das Vorzeichen stimmt und |t| ≥ 2 oder die Literatur denselben Wert nennt.

1. **Einkommensteuer: aufnehmen, 0,3.** Drei Schätzungen mit richtigem Vorzeichen und |t| zwischen 2,5 und 3,7, Zerlegung 0,39. Gewählt ist der untere Rand, weil die Steuerbasis im Modell breiter ist als die Kategorie 1100.
2. **Kapitalertrag, Vermögen, Erbschaft: aufnehmen, 0,3, dünn belegt.** Das Panel kann diese Steuern nicht trennen. Die Kategorie „Steuern auf Vermögen“ besteht überwiegend aus Grundsteuer und Grunderwerbsteuer und zeigt das falsche Vorzeichen (nicht signifikant). Begründung für die Aufnahme: Die Kapitalertragsteuer ist Teil der Kategorie 1100, für die das Panel 0,3 liefert; die Zerlegung ergibt mehr. Die Spec nennt diese Steuern ausdrücklich als Treiber. Gewählt ist derselbe Wert wie bei der Einkommensteuer, nicht der höhere aus der Zerlegung. **Einschränkung:** Die Erbschaftsteuer wird im verfügbaren Einkommen nicht abgezogen; sie wirkt nur langfristig über die Vermögensverteilung. Der Wert überzeichnet ihre kurzfristige Wirkung. Bei den üblichen Größen (0,2 % BIP) sind das 0,06 Gini-Punkte.
3. **Mehrwertsteuer: aufnehmen, 0,1, dünn belegt.** Das Panel erfüllt die Regel (+0,39 bis +0,45, t 2,0 bis 2,5). Der Wert wird trotzdem nicht übernommen: Der Gini des verfügbaren Einkommens enthält Verbrauchsteuern nicht, eine Mehrwertsteuer kann ihn also nicht unmittelbar bewegen. Das Panel misst vermutlich Sparprogramme, in denen die Mehrwertsteuer zusammen mit anderem stieg (in den sieben Ländern der App kehrt sich das Vorzeichen um). Gewählt ist der obere Rand der Zerlegung. Die Spec nennt die Mehrwertsteuer nicht als Treiber; der Plan hat sie ergänzt.
4. **Familienleistungen → Gini: aufnehmen, 0,5, dünn belegt.** Gini direkt: −0,51 (t −1,8), ohne Arbeitslosigkeit −0,59 (t −1,96), mit Rentenniveau −0,47 (t −1,5). Die Schwelle |t| ≥ 2 wird nur in den sieben Ländern der App erreicht (−0,67, t −2,1, sieben Gruppen, also wenig belastbar). Die Schätzung der Umverteilung, die bei der Einkommensteuer stützt, zeigt hier nichts (+0,15, t 0,8). Für die Aufnahme sprechen das durchgehend richtige Vorzeichen, die Zerlegung (0,5) und die Literatur zur Rangfolge; gesichert ist der Wert nicht.
5. **Rentenniveau → Gini: aufnehmen, 0,04, dünn belegt.** Vorzeichen stimmt, t −1,5 verfehlt die Schwelle; die Zerlegung ergibt denselben Wert (0,045). Mit den Altersausgaben in % BIP statt des Niveaus gibt es keinen Befund (−0,08, t −0,5).
6. **Familienleistungen → Armut: aufnehmen, 0,6.** −0,57, t −2,3 bei der Schwelle von 60 % des Medians. Das Modell führt die Armutsgefährdungsquote (60 %), deshalb dieser Wert und nicht der bei 50 % (−0,40).
7. **Rentenniveau → Armut: aufnehmen, 0,05, dünn belegt.** Bei den über 65-Jährigen senkt ein Punkt Rentenniveau die Armutsquote um 0,27 Pp. (t −2,8; bei 50 % des Medians −0,19, t −2,1). Auf die ganze Bevölkerung umgerechnet (Anteil 20 %) sind das 0,05 Pp. Die Schätzung für die ganze Bevölkerung zeigt das nicht (+0,02, t 1,7): Die Armutsgrenze hängt am Median und verschiebt sich mit.

## Nicht aufgenommen: Sozialabgaben

Der stärkste Steuerkoeffizient des Panels gehört den Sozialabgaben: −0,50 Gini-Punkte je % BIP (t −3,5), in der Umverteilung +0,43 (t 3,1). Der Plan sieht dafür keine Wirkstärke vor, und die Spec nennt sie nicht als Treiber. Das Vorzeichen überrascht (Sozialabgaben gelten wegen der Beitragsbemessungsgrenze als wenig progressiv); vermutlich misst das Panel die Leistungen mit, die aus den Abgaben bezahlt werden. **Offen für Phase 2:** Die Option „Machterhalt“ bewegt `steuer.sozialabgaben`; der Gini sieht das nicht.

## Gezählt wird das Aufkommen des Modells (Nachtrag aus der Prüfung des Branches)

Die Wirkstärken gelten je % BIP Aufkommen. Im Rechenkern zählt deshalb das Aufkommen, das das Modell einnimmt (`aufkommen` in `staat.ts`: Die Bemessungsgrundlage weicht dem Satz aus), nicht Satz mal Start-Grundlage wie in der Formel des Plans. Eine Kapitalertragsteuer von 90 % bringt im Modell weniger ein als heute und gleicht deshalb nicht aus. Die Handrechnung der Probe unten (Spalten „davon“) rechnet noch statisch; bei den kleinen Änderungen des Rückblicks ist der Unterschied höchstens 0,02 Punkte.

## Probe Deutschland, Rückblick 2000–2025

Hebel aus `RUECKBLICK.sz.stell`, Bemessungsgrundlagen und Arbeitslosigkeit aus dem Rückblick-Lauf. Auszug (alle Jahre in der Ergebnisdatei):

| Jahr | Modell alt | Modell neu | OECD | Weltbank |
| ---- | ---------- | ---------- | ---- | -------- |
| 2000 | 28,7       | 28,7       | 26,4 | 28,7     |
| 2005 | 29,4       | 29,9       | 29,7 | 31,6     |
| 2010 | 30,1       | 30,5       | 28,6 | 30,2     |
| 2015 | 28,6       | 28,9       | 29,3 | 31,4     |
| 2020 | 28,5       | 28,6       | 30,3 | 32,5     |
| 2022 | 28,1       | 28,2       | 30,9 | 33,7     |

| RMSE                                                      | alt  | neu  |
| --------------------------------------------------------- | ---- | ---- |
| Änderung seit 2000, gegen OECD                            | 2,84 | 2,63 |
| Änderung seit 2000, gegen Weltbank                        | 2,66 | 2,47 |
| Niveau, gegen OECD (Modell startet auf dem Weltbank-Wert) | 1,38 | 1,42 |

Was die neuen Treiber beitragen: Die Senkung der Einkommensteuer 2001–2005 hebt den Gini um 0,5 Punkte, die Mehrwertsteuer 2007 um 0,1, das gesunkene Rentenniveau um 0,2; die höheren Familienleistungen senken ihn um 0,3.

**Zum Niveau-Vergleich gegen OECD:** Er wird um 0,04 schlechter. Das liegt am Startwert: Das Modell beginnt 2000 auf dem Weltbank-Wert (28,7), die OECD misst 26,4. Der alte, zu flache Pfad liegt dadurch zufällig näher an den späteren OECD-Werten. Maßgeblich ist der Vergleich der Änderung; nach Task 4 (Startwert aus der OECD) fallen beide Vergleiche zusammen.

## Grenzen

- Der Gini misst Einkommen, nicht Vermögen. Steuern auf Vermögen und Erbschaft wirken vor allem dort.
- Sehr hohe Einkommen fehlen in Befragungen. Die Wirkung von Steuern auf Kapital im gemessenen Gini ist deshalb kleiner als in der Wirklichkeit.
- Verbrauchsteuern sind im verfügbaren Einkommen nicht enthalten.
- Das Panel misst Aufkommen, nicht Sätze. Ein höheres Aufkommen kann auch aus einer breiteren Basis stammen und dann anders verteilt sein.
- Die Wirkung ist als linear und sofort angenommen. Wie progressiv eine Steuererhöhung ausfällt, hängt an ihrer Ausgestaltung; das Modell kennt nur den Satz.
- Die Werte der Zerlegung (`K`) sind Größenordnungen, im Original **ungeprüft**.
- Deutschland: Der Anstieg 2000–2005 (OECD +3,3 Punkte) und 2019–2021 bleibt weitgehend unerklärt. Löhne, Teilzeit und Haushaltsgrößen führt das Modell nicht.
