# 13.13 Task 7 — Prüfung Wahltakt

Stand 30.09.2026. Skript: [pruefung-wahltakt.ts](pruefung-wahltakt.ts), Ausgabe: [ergebnis-wahltakt.txt](ergebnis-wahltakt.txt).

## Befund

**Der Wahljahr-Effekt ist in den Daten der App nicht gesichert. Standard für `politik.wahljahr`: 0.** Der Eintrag bleibt im Verzeichnis, mit dem Satz „in den Daten der App nicht sichtbar“.

- In der vorab festgelegten Schätzung (alle Jahre) ist der Haushaltssaldo im Wahljahr nicht schlechter: −0,01 Pp., t 0,0.
- Ohne die Krisenjahre 2009, 2010, 2020 und 2021 stimmt das Vorzeichen, und die Größe passt zur Literatur (−0,31 Pp.; Efthyvoulou 2012 nennt rund 0,3 % BIP für die EU, **ungeprüft**). Die Schwelle |t| ≥ 1,5 wird verfehlt (t −1,1).
- Nur eine dritte Fassung erreicht die Schwelle: mit zusätzlichem Vorwahljahr und ohne Krisenjahre (Wahljahr −0,48, t −1,7; Vorwahljahr −0,46, t −1,6). Sie ist nach dem Blick auf die Daten entstanden und zählt deshalb nicht als Beleg.
- Je Land: Vorzeichen wie erwartet in fünf von sieben Ländern (USA, Japan, Vereinigtes Königreich, Frankreich, Italien), in keinem gesichert. Deutschland und Kanada zeigen das Gegenteil.

Was bleibt, auch bei Standard 0: Die Wahltermine wirken über die Vorwahl. Im Wahljahr und im Jahr davor wählt die Regierung nicht „Unbequem“, und die Rücknahme einer Reform fällt in ein Wahljahr. Dieser Teil von Verzerrung 5 hängt nicht an `politik.wahljahr`.

## Vorgehen

- **Daten:** Einnahmen und Ausgaben des Gesamtstaats in % BIP (IWF, Reihen der Länderdateien), sieben Länder mit Wahltakt, 2001–2024. Produktionslücke aus der Kalman-Schätzung (Spec 13.1). 168 Länderjahre, davon 45 Wahljahre.
- **Schätzung:** Änderung des Saldos gegen das Vorjahr auf Wahljahr und Änderung der Lücke, mit Ländereffekten.
- **Saldo statt Primärsaldo:** Eine gemessene Zinsreihe hat die App nicht. In der Änderung gegen das Vorjahr fallen die Zinsen weitgehend heraus. Für Deutschland rechnet das Skript zusätzlich den Primärsaldo mit den Zinsen des Rückblick-Laufs: kein Effekt (+0,37 Pp., t 0,5; ohne Krisenjahre −0,01).
- **Wahljahre:** die tatsächlichen, nicht der feste Takt, also mit den vorgezogenen Wahlen (Deutschland 2005; Vereinigtes Königreich 2017 und 2019; Japan 2003, 2005, 2012, 2014, 2017; Italien 2008; Kanada 2006, 2008, 2011, 2021). Die Liste steht im Skript und stammt **ungeprüft**.

## Ergebnis

| Schätzung | Wahljahr | t | n |
|---|---|---|---|
| A. Alle Jahre | −0,01 Pp. | 0,0 | 168 |
| B. Ohne Krisenjahre | −0,31 Pp. | −1,1 | 140 |
| C. Ohne Krisenjahre, mit Vorwahljahr | −0,48 Pp. (Vorwahljahr −0,46, t −1,6) | −1,7 | 140 |

Die Lücke erklärt den Saldo deutlich (0,66 bis 0,90 Pp. je Punkt, t 5 bis 16); die automatischen Stabilisatoren sind also sichtbar, der Wahltakt nicht.

## Urteil

Regel aus dem Bauplan: Vorzeichen wie erwartet und |t| ≥ 1,5 im Länder-Panel → Standard 0,3; sonst 0. Zwei von drei Fassungen verfehlen die Schwelle, darunter die vorab festgelegte. **Standard 0.**

## Grenzen

- Nur 38 bis 45 Wahljahre: Ein Effekt von 0,3 Pp. ist bei der Streuung des Saldos (rund 1,5 Pp. je Jahr) kaum nachweisbar. Die Prüfung zeigt, dass er hier nicht gesichert ist; sie widerlegt ihn nicht.
- Der Saldo des Gesamtstaats enthält Länder, Gemeinden und Sozialkassen; der Wahltakt gilt nur für die nationale Wahl.
- Brender/Drazen 2005 finden den Effekt vor allem in jungen Demokratien (**ungeprüft**); die sieben Länder hier sind alte.
