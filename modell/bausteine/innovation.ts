import type { Baustein } from "../typen";

export const innovation: Baustein = (alt, neu, k) => {
  const fonds =
    k.w("innov.pensionsfondsVC") >= 0.5
      ? k.p("innov.fondsVC") * alt.fondsQuote
      : 0;
  const steuer = Math.max(
    0,
    1 +
      k.p("innov.vcExitElastizitaet") *
        (k.basis("innov.exitSteuer") - k.w("innov.exitSteuer")),
  );
  const huerden = Math.max(
    0,
    1 -
      k.p("innov.huerdenWirkung") *
        (k.w("innov.huerden") - k.basis("innov.huerden")),
  );
  neu.vcQuote = (k.land.start.vcBasis + fonds) * steuer * huerden;
  const verzug = k.p("innov.verzug");
  neu.fueWirk =
    alt.fueWirk +
    (k.w("innov.fue") - k.basis("innov.fue") - alt.fueWirk) / verzug;
  neu.vcWirk =
    alt.vcWirk + (neu.vcQuote - k.land.start.vcBasis - alt.vcWirk) / verzug;
  neu.innovBeitrag =
    (k.p("innov.fueRendite") *
      (neu.fueWirk + k.p("innov.vcFaktor") * neu.vcWirk)) /
    100;
};
