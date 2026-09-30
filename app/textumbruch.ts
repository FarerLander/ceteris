// Zeichen je Zeile, die bei der Schrift des Wirkungsnetzes sicher in einen Kasten passen.
export const KARTE_ZEICHEN = 18; // Kasten 150 px, 13 px fett
export const WEG_ZEICHEN = 25; // Kasten 185 px, 12 px fett

// Bricht an Leerzeichen um; ein einzelnes zu langes Wort bleibt ganz.
export function zeilen(text: string, max: number): string[] {
  const aus: string[] = [];
  let zeile = "";
  for (const wort of text.split(" ")) {
    const probe = zeile ? `${zeile} ${wort}` : wort;
    if (probe.length <= max || !zeile) zeile = probe;
    else {
      aus.push(zeile);
      zeile = wort;
    }
  }
  if (zeile) aus.push(zeile);
  return aus;
}
