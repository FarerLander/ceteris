import { fireEvent, screen } from "@testing-library/react";

// Die Ansicht wird in der Kopfleiste per Auswahl gewechselt (früher Reiter).
function wahl(): HTMLSelectElement {
  return screen.getByRole("combobox", { name: /^(Ansichten|Views)$/ }) as HTMLSelectElement;
}

export function oeffne(name: string): void {
  const w = wahl();
  const o = [...w.options].find((x) => x.text === name);
  if (!o) throw new Error(`Ansicht „${name}“ fehlt`);
  fireEvent.change(w, { target: { value: o.value } });
}

export function ansicht(): string {
  const w = wahl();
  return w.options[w.selectedIndex].text;
}
