export interface Gespeichertes {
  name: string;
  code: string;
  zeit: string;
  land?: string; // fehlt bei alten Einträgen = DE
}

const SCHLUESSEL = "wirtschaftssimulator.szenarien";

export function ladeListe(): Gespeichertes[] {
  try {
    const roh = window.localStorage.getItem(SCHLUESSEL);
    const liste: unknown = roh ? JSON.parse(roh) : [];
    return Array.isArray(liste)
      ? liste.filter(
          (x): x is Gespeichertes =>
            !!x && typeof x.name === "string" && typeof x.code === "string",
        )
      : [];
  } catch {
    return [];
  }
}

export function speichereListe(liste: Gespeichertes[]): boolean {
  try {
    window.localStorage.setItem(SCHLUESSEL, JSON.stringify(liste));
    return true;
  } catch {
    return false;
  }
}
