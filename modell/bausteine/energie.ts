import { co2Intensitaet, stromkosten } from "../energiepreis";
import { rohstoffe } from "./rohstoffe";
import type { Baustein } from "../typen";

export const energie: Baustein = (alt, neu, k) => {
  const m = { ...alt.mix };
  m.ern = Math.min(0.95, alt.mix.ern + k.w("energie.ausbauTempo") / 100);
  const rest = k.w("energie.kohleausstieg") - k.jahr;
  m.kohle = rest <= 0 ? 0 : alt.mix.kohle * (rest / (rest + 1));
  const modus = Math.round(k.w("energie.atom"));
  if (modus === 0) m.atom = Math.max(0, alt.mix.atom - 0.02);
  else if (modus === 2 && k.t > 12)
    m.atom = Math.min(0.25, alt.mix.atom + 0.01);
  else m.atom = alt.mix.atom;
  const fossil = 1 - m.ern - m.kohle - m.atom;
  if (fossil < 0) {
    m.ern = Math.max(0, 1 - m.kohle - m.atom);
    m.gas = 0;
    m.oel = 0;
  } else {
    m.oel = Math.min(alt.mix.oel, fossil);
    m.gas = fossil - m.oel;
  }
  neu.mix = m;

  const atomNeu =
    modus === 2 && m.atom > 0
      ? Math.max(0, m.atom - k.land.start.mix.atom) / m.atom
      : 0;
  const daempfung =
    (1 - 0.5 * k.w("energie.diversifizierung")) * (1.2 - 0.5 * alt.steuerbar);
  const faktor = 1 + (k.schock.energie / 100) * Math.max(0, daempfung);
  const preise = {
    oel: k.welt("oel") * faktor,
    gas: k.welt("gas") * faktor,
    kohle: k.welt("kohle") * faktor,
  };
  const netz0 = k.basis("energie.netzInvest");
  const netzAbweichung =
    (k.w("energie.netzInvest") - netz0) / Math.max(0.1, netz0);
  const strom = stromkosten(
    m,
    preise,
    k.w("energie.co2Preis"),
    atomNeu,
    netzAbweichung,
    k.p,
  );

  const intensAlt = co2Intensitaet(alt.mix);
  neu.co2Strom =
    intensAlt > 0
      ? alt.co2Strom * (co2Intensitaet(m) / intensAlt) * (1 + alt.wachstum)
      : 0;
  neu.co2Rest =
    alt.co2Rest *
    Math.max(0, 1 - k.p("energie.co2Vermeidung") * k.w("energie.co2Preis")) *
    (1 + alt.wachstum);
  neu.co2Mt = neu.co2Strom + neu.co2Rest;
  neu.co2Einnahmen = (k.w("energie.co2Preis") * neu.co2Mt) / 1000;

  const verwendung = Math.round(k.w("energie.co2Verwendung"));
  const entlastung =
    verwendung === 2
      ? (neu.co2Einnahmen * 1000) / k.land.start.industrieTWh
      : 0;
  const industrie = Math.max(
    5,
    strom +
      k.land.start.netzkosten -
      k.w("energie.industrieSubvention") -
      entlastung,
  );
  neu.energiepreis = (100 * industrie) / k.c.energieBasis;

  const fossilAlt = alt.mix.kohle + alt.mix.gas + alt.mix.oel;
  const fossilNeu = m.kohle + m.gas + m.oel;
  neu.importquote =
    fossilAlt > 0 ? alt.importquote * (fossilNeu / fossilAlt) : alt.importquote;
  neu.steuerbar = fossilNeu + m.atom;
  neu.umbauInvest =
    k.w("energie.ausbauTempo") * k.p("energie.umbauKosten") +
    k.w("energie.netzInvest");
  rohstoffe(alt, neu, k);
};
