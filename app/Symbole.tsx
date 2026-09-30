import { SYMBOLE } from "./symbol-daten";

export function Symbole() {
  return (
    <div aria-hidden="true" dangerouslySetInnerHTML={{ __html: SYMBOLE }} />
  );
}
