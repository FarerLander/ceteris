import { useState } from "react";
import { dekodiere, kodiere } from "../../modell/szenario-code";
import type { Sim } from "../simulation";
import { ladeListe, speichereListe } from "../speicher";
import { t } from "../../modell/sprache";

export function Szenarien({ sim }: { sim: Sim }) {
  const [liste, setListe] = useState(ladeListe);
  // Gespeicherte Szenarien gehören zu ihrem Land.
  const eigene = liste.filter((x) => (x.land ?? "DE") === sim.land.code);
  const [name, setName] = useState("");
  const [meldung, setMeldung] = useState("");

  const speichern = () => {
    const n = name.trim() || t("Szenario {nr}", { nr: eigene.length + 1 });
    const neu = [
      ...liste.filter((x) => !(x.name === n && (x.land ?? "DE") === sim.land.code)),
      { name: n, code: kodiere(sim.sz), zeit: new Date().toISOString(), land: sim.land.code },
    ];
    setListe(neu);
    setMeldung(
      speichereListe(neu)
        ? t("„{name}“ gespeichert.", { name: n })
        : t("Speichern nicht möglich: Der Browser-Speicher ist gesperrt."),
    );
    setName("");
  };
  const kopieren = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setMeldung(t("Link kopiert."));
    } catch {
      setMeldung(t("Kopieren nicht möglich. Der Link steht in der Adresszeile."));
    }
  };
  const loeschen = (n: string) => {
    const neu = liste.filter((x) => !(x.name === n && (x.land ?? "DE") === sim.land.code));
    setListe(neu);
    speichereListe(neu);
  };

  return (
    <section aria-label={t("Szenarien")}>
      <h3 className="group-title">{t("Szenario")}</h3>
      <div className="szenario-zeile">
        <input
          id="szenario-name"
          aria-label={t("Name des Szenarios")}
          placeholder={t("Name")}
          value={name}
          onChange={(ev) => setName(ev.target.value)}
          onKeyDown={(ev) => {
            if (ev.key === "Enter") speichern();
          }}
        />
        <button type="button" className="mini" onClick={speichern}>
          {t("Speichern")}
        </button>
      </div>
      <button type="button" className="mini" onClick={kopieren}>
        {t("Link kopieren")}
      </button>
      {meldung && (
        <p className="meldung" role="status">
          {meldung}
        </p>
      )}
      {eigene.length > 0 && (
        <ul className="gespeichert">
          {eigene.map((x) => (
            <li key={x.name}>
              <button
                type="button"
                className="link"
                onClick={() => {
                  const s = dekodiere(x.code, sim.land);
                  if (s) sim.ladeSzenario(s);
                  else setMeldung(t("„{name}“ ist nicht mehr lesbar.", { name: x.name }));
                }}
              >
                {x.name}
              </button>
              <button
                type="button"
                className="x"
                aria-label={t("{name} löschen", { name: x.name })}
                onClick={() => loeschen(x.name)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
