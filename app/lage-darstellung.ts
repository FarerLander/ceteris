import { LAGEN } from "../modell/lage";
import type { Lage } from "../modell/typen";

// Symbol-Id je Lage (ohne #). „i-krise“ gehört dem Schock Finanzkrise, deshalb „i-lage-…“.
export const LAGE_SYMBOL = Object.fromEntries(
  LAGEN.map((l) => [l, `i-lage-${l}`]),
) as Record<Lage, string>;

export const lageFarbe = (l: Lage) => `var(--lage-${l})`;
