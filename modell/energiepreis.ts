import type { Mix } from "./typen";

// Physikalische Umrechnungen (keine Wirkstärken): t CO₂ je MWh Strom, Brennstoffkosten je MWh.
const CO2 = { kohle: 0.95, gas: 0.37, oel: 0.7 };

export function co2Intensitaet(mix: Mix): number {
  return mix.kohle * CO2.kohle + mix.gas * CO2.gas + mix.oel * CO2.oel;
}

// Stromgestehungskosten des Mix in €/MWh.
export function stromkosten(
  mix: Mix,
  preise: { oel: number; gas: number; kohle: number },
  co2Preis: number,
  atomNeuAnteil: number,
  netzAbweichung: number,
  p: (id: string) => number,
): number {
  const kohle = 25 + preise.kohle / 3.3 + co2Preis * CO2.kohle;
  const gas = 15 + preise.gas * 2 + co2Preis * CO2.gas;
  const oel = 20 + preise.oel * 0.6 + co2Preis * CO2.oel;
  const atom =
    p("energie.kostenAtomAlt") * (1 - atomNeuAnteil) +
    p("energie.kostenAtomNeu") * atomNeuAnteil;
  const ern =
    p("energie.kostenErn") +
    p("energie.integrationskosten") *
      mix.ern ** 2 *
      Math.max(0.3, 1 - 0.5 * netzAbweichung);
  return (
    mix.kohle * kohle +
    mix.gas * gas +
    mix.oel * oel +
    mix.atom * atom +
    mix.ern * ern
  );
}
