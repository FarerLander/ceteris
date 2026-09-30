import { fmt } from "../../modell/format";
import { useZaehler } from "../bewegung";

export function Zahl({ wert, dez }: { wert: number; dez: number }) {
  return <>{fmt(useZaehler(wert), dez)}</>;
}
