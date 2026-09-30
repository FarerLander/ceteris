import {
  BANKEN_STANDARD,
  bankenDaten,
  zoegernd,
  type BankenModus,
  type RettungModus,
} from "../../modell/banken-modus";
import { fmt } from "../../modell/format";
import { planAn, planImpuls } from "../../modell/haushaltsplan";
import { politikAn } from "../../modell/politik-modus";
import { t, tk, type Sprache } from "../../modell/sprache";
import { stellschrauben } from "../../modell/verzeichnis";
import type { BausteinId, Grundeinstellungen } from "../../modell/typen";
import type { Sim } from "../simulation";
import { useRef, useState, type ReactNode } from "react";
import { Aenderung, useBlatt } from "./Blatt";
import { FarbmodusKnopf, SprachKnopf, stand } from "./Anzeige";
import { Regler } from "./Regler";
import { Szenarien } from "./Szenarien";

const BLOECKE: [BausteinId, string][] = [
  ["demografie", "Demografie und Migration"],
  ["ordnung", "Wirtschaftsordnung"],
  ["wachstum", "Arbeitsmarkt"],
  ["energie", "Energie und Rohstoffe"],
  ["innovation", "Innovation und Gründungen"],
  ["geld", "Geld und Zins"],
  ["staat", "Staat, Steuern, Rente"],
  ["anleihen", "Anleihen"],
  ["handel", "Handel und Währung"],
  ["banken", "Häuser und Banken"],
];
const BANKEN: [BankenModus, string][] = [
  ["aus", "Aus"],
  ["an", "An"],
];
const RETTUNG: [RettungModus, string][] = [
  ["schnell", "Schnell"],
  ["zoegernd", "Zögernd"],
];
const REGIME: [Grundeinstellungen["regime"], string][] = [
  ["welt", "Weltwährung"],
  ["eigen", "Eigene Währung"],
  ["euro", "Gemeinsame Währung"],
  ["hart", "Harte Währung"],
  ["gelenkt", "Gelenkte Währung"],
];
const RENTE: [Grundeinstellungen["rentensystem"], string][] = [
  ["umlage", "Umlage"],
  ["mischung", "Mischung"],
  ["kapital", "Kapitaldeckung"],
];
const PLAN: ["an" | "aus", string][] = [
  ["an", "Einhalten"],
  ["aus", "Ohne"],
];
const POLITIK: ["fest" | "reagiert", string][] = [
  ["fest", "Fest"],
  ["reagiert", "Reagiert"],
];
const AMPEL = {
  gruen: "Datenqualität gut",
  gelb: "Datenqualität eingeschränkt",
  rot: "Datenqualität schwach",
};

function Auswahl<T extends string | number>(props: {
  name: string;
  titel: string;
  optionen: [T, string][];
  wert: T;
  setze(w: T): void;
  spalten?: 2 | 3;
}) {
  return (
    <div className="field">
      <span className="lbl" id={`${props.name}-lbl`}>
        {props.titel}
      </span>
      <div
        className={`seg${props.spalten === 3 ? " three" : ""}`}
        role="radiogroup"
        aria-labelledby={`${props.name}-lbl`}
      >
        {props.optionen.map(([w, text]) => (
          <span key={String(w)} style={{ display: "contents" }}>
            <input
              type="radio"
              name={props.name}
              id={`${props.name}-${w}`}
              checked={props.wert === w}
              onChange={() => props.setze(w)}
            />
            <label htmlFor={`${props.name}-${w}`}>
              {typeof w === "number" ? text : t(text)}
            </label>
          </span>
        ))}
      </div>
    </div>
  );
}

// Seiten des Blatts auf dem Smartphone; am großen Bildschirm stehen sie untereinander wie bisher.
const SEITEN = [
  "Grundlagen",
  "Hauptregler",
  "Alle Stellschrauben",
  "Szenarien",
];

export function Seitenleiste({
  sim,
  setzeLand,
  zeigeWirkung,
  handy = false,
  eingeklappt = false,
  setzeEingeklappt,
  setzeSprache,
}: {
  sim: Sim;
  setzeLand(code: string): void;
  zeigeWirkung?(id: string): void;
  handy?: boolean;
  eingeklappt?: boolean;
  setzeEingeklappt?(zu: boolean): void;
  setzeSprache?(s: Sprache): void;
}) {
  if (!handy && eingeklappt)
    return (
      <aside className="side zu" aria-label={t("Stellschrauben")}>
        <button
          type="button"
          className="aufklappen"
          onClick={() => setzeEingeklappt?.(false)}
          aria-label={t("Stellschrauben zeigen")}
          title={t("Stellschrauben zeigen")}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
            <circle cx="16" cy="6" r="2" />
            <circle cx="10" cy="12" r="2" />
            <circle cx="18" cy="18" r="2" />
          </svg>
          <span>{t("Stellschrauben")}</span>
        </button>
      </aside>
    );
  return handy ? (
    <Blattleiste sim={sim} setzeLand={setzeLand} zeigeWirkung={zeigeWirkung} setzeSprache={setzeSprache} />
  ) : (
    <Leiste
      sim={sim}
      setzeLand={setzeLand}
      zeigeWirkung={zeigeWirkung}
      einklappen={setzeEingeklappt && (() => setzeEingeklappt(true))}
      setzeSprache={setzeSprache}
    />
  );
}

type Teil = {
  sim: Sim;
  setzeLand(code: string): void;
  zeigeWirkung?(id: string): void;
};

function Leiste({
  sim,
  setzeLand,
  zeigeWirkung,
  einklappen,
  setzeSprache,
}: Teil & { einklappen?(): void; setzeSprache?(s: Sprache): void }) {
  const { n, text } = stand(sim);
  return (
    <aside className="side" aria-label={t("Stellschrauben")}>
      <div className="brand">
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <use href="#i-lage-wachstum" />
        </svg>
        <div>
          <h1>Ceteris</h1>
          <small>
            {t("Wirtschaftssimulator")} · {t("Datenstand {jahr}", { jahr: sim.land.datenstand })} ·{" "}
            <span className={`griff-stand${n ? " geaendert" : ""}`}>{text}</span>
          </small>
        </div>
        {einklappen && (
          <button
            type="button"
            className="einklappen"
            onClick={einklappen}
            aria-label={t("Stellschrauben einklappen")}
            title={t("Stellschrauben einklappen")}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
        )}
      </div>
      <Inhalt
        sim={sim}
        setzeLand={setzeLand}
        zeigeWirkung={zeigeWirkung}
        seite={(_, kinder) => kinder}
        anzeige={
          setzeSprache && (
            <>
              <FarbmodusKnopf />
              <SprachKnopf setzeSprache={setzeSprache} />
            </>
          )
        }
      />
    </aside>
  );
}

function Blattleiste({ sim, setzeLand, zeigeWirkung, setzeSprache }: Teil & { setzeSprache?(s: Sprache): void }) {
  const b = useBlatt();
  const seiten = useRef<HTMLDivElement>(null);
  const [aktiv, setAktiv] = useState(0);
  const geheZu = (i: number) => {
    const el = seiten.current;
    if (el) el.scrollTo?.({ left: i * el.clientWidth, behavior: "smooth" });
    setAktiv(i);
    if (b.stufe === "zu") b.setStufe("halb");
  };
  return (
    <aside
      className={`side blatt ${b.stufe}${b.klein ? " klein" : ""}`}
      aria-label={t("Stellschrauben")}
      ref={b.blatt}
      style={b.stil}
    >
      <div className="griff" ref={b.griff} {...b.griffEreignisse}>
        <span className="griff-strich" aria-hidden="true" ref={b.strich} />
        <div className="griff-zeile" ref={b.zeile}>
          <strong>{t("Stellschrauben")}</strong>
          <Aenderung sim={sim} ruhe={<span className={`griff-stand${stand(sim).n ? " geaendert" : ""}`}>{stand(sim).text}</span>} />
          <button
            type="button"
            className="griff-knopf"
            onClick={() => b.setStufe(b.stufe === "zu" ? "halb" : "zu")}
            aria-expanded={b.stufe !== "zu"}
            aria-label={
              b.stufe === "zu"
                ? t("Stellschrauben zeigen")
                : t("Stellschrauben einklappen")
            }
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d={b.stufe === "zu" ? "M5 15l7-7 7 7" : "M5 9l7 7 7-7"} />
            </svg>
          </button>
        </div>
        <nav
          className="seiten-reiter"
          role="tablist"
          aria-label={t("Stellschrauben")}
        >
          {SEITEN.map((name, i) => (
            <button
              key={name}
              type="button"
              role="tab"
              aria-selected={aktiv === i}
              onClick={() => geheZu(i)}
            >
              {t(name)}
            </button>
          ))}
        </nav>
      </div>
      <div
        className="seiten"
        ref={seiten}
        onScroll={(ev) => {
          const el = ev.currentTarget;
          setAktiv(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
        }}
      >
        <Inhalt
          sim={sim}
          setzeLand={setzeLand}
          // Das Wirkungsnetz soll sichtbar sein, also Blatt einklappen.
          zeigeWirkung={
            zeigeWirkung &&
            ((id) => {
              b.setStufe("zu");
              zeigeWirkung(id);
            })
          }
          blatt
          anzeige={
            setzeSprache && (
              <>
                <FarbmodusKnopf />
                <SprachKnopf setzeSprache={setzeSprache} />
              </>
            )
          }
          seite={(i, kinder) => (
            <div className="seite" key={i} aria-label={t(SEITEN[i])}>
              {kinder}
            </div>
          )}
        />
      </div>
    </aside>
  );
}

function Inhalt({
  sim,
  setzeLand,
  zeigeWirkung,
  seite,
  blatt = false,
  anzeige,
}: Teil & { seite(i: number, kinder: ReactNode): ReactNode; blatt?: boolean; anzeige?: ReactNode }) {
  const { land, sz } = sim;
  const alle = stellschrauben();
  const s = land.datenstand;
  // Haushaltsplan (M29): letztes Planjahr und die Maßnahmen bis dahin (Impuls, ohne den Ausgleich der
  // Renten- und Zinsdrift), nur wenn der Plan zum Datenstand passt.
  const planJahre = land.plan?.datenstand === s ? Object.keys(land.plan.werte).map(Number) : [];
  const planEnde = planJahre.length ? Math.max(...planJahre) : undefined;
  const planBetrag = planEnde === undefined ? 0 : planImpuls(land, { ...sz.grund, haushaltsplan: "an" }, planEnde);
  return (
    <>
      {seite(
        0,
        <>
          <section>
            <h3 className="group-title">{t("Grundeinstellungen")}</h3>
            <div className="field">
              <label htmlFor="land">
                {t("Land")}{" "}
                <span
                  className={`ampel ${land.qualitaet}`}
                  title={t(AMPEL[land.qualitaet])}
                  aria-label={t(AMPEL[land.qualitaet])}
                />
              </label>
              <select
                id="land"
                value={land.code}
                onChange={(ev) => setzeLand(ev.target.value)}
              >
                <option value="DE">{t("Deutschland")}</option>
                <option value="US">{t("USA")}</option>
                <option value="JP">{t("Japan")}</option>
                <option value="GB">{t("Vereinigtes Königreich")}</option>
                <option value="FR">{t("Frankreich")}</option>
                <option value="IT">{t("Italien")}</option>
                <option value="CA">{t("Kanada")}</option>
                <option value="CN">{t("China")}</option>
                <option value="RU">{t("Russland")}</option>
              </select>
              {land.hinweis && (
                <p className="land-hinweis">
                  {tk(`land:${land.code}:hinweis`, land.hinweis)}
                </p>
              )}
            </div>
            <Auswahl
              name="regime"
              titel={t("Währung")}
              optionen={REGIME}
              wert={sz.grund.regime}
              setze={(regime) => sim.setzeGrund({ regime })}
            />
            <Auswahl
              name="rentensystem"
              titel={t("Rentensystem")}
              optionen={RENTE}
              wert={sz.grund.rentensystem}
              setze={(rentensystem) => sim.setzeGrund({ rentensystem })}
              spalten={3}
            />
            <Auswahl
              name="politik"
              titel={t("Politik")}
              optionen={POLITIK}
              wert={politikAn(sz.grund) ? "reagiert" : "fest"}
              setze={(politik) => sim.setzeGrund({ politik })}
            />
            {politikAn(sz.grund) && (
              <p className="grund-hinweis">
                {t(
                  "An jedem Entscheidungspunkt wählt die Regierung zwischen drei Möglichkeiten. Im Wetterband siehst du die Punkte und kannst umschalten.",
                )}
              </p>
            )}
            {planEnde === undefined ? (
              <p className="grund-hinweis">{t("Für dieses Land liegt kein Haushaltsplan vor.")}</p>
            ) : (
              <>
                <Auswahl
                  name="haushaltsplan"
                  titel={t("Haushaltspläne bis 2031")}
                  optionen={PLAN}
                  wert={planAn(sz.grund) ? "an" : "aus"}
                  setze={(haushaltsplan) => sim.setzeGrund({ haushaltsplan })}
                />
                <p className="grund-hinweis">
                  {t(planBetrag >= 0
                    ? "Bis {jahr} folgt der Haushalt den Plänen, die der IWF einrechnet: Die Regierung spart {wert} Pp. BIP. Dazu gleicht der Plan aus, was das Modell bei Renten und Zinsen anders rechnet. Danach bleiben die Maßnahmen bestehen."
                    : "Bis {jahr} folgt der Haushalt den Plänen, die der IWF einrechnet: Die Regierung gibt {wert} Pp. BIP mehr aus. Dazu gleicht der Plan aus, was das Modell bei Renten und Zinsen anders rechnet. Danach bleiben die Maßnahmen bestehen.", {
                    jahr: planEnde,
                    wert: fmt(Math.abs(planBetrag), 1),
                  })}
                </p>
              </>
            )}
          </section>

          <section>
            <h3 className="group-title">{t("Zeitraum")}</h3>
            <div className="field">
              <span className="lbl">
                {t("Start: {jahr} (letzter Datenstand)", { jahr: s })}
              </span>
            </div>
            <Auswahl
              name="horizont"
              titel={t("Rechnen bis")}
              spalten={3}
              optionen={[
                [26, String(s + 25)],
                [51, String(s + 50)],
                [101, String(s + 100)],
              ]}
              wert={sz.jahre}
              setze={(j) => sim.setzeJahre(j)}
            />
          </section>

          {anzeige && (
            <section>
              <h3 className="group-title">{t("Anzeige")}</h3>
              <div className="anzeige-knoepfe">{anzeige}</div>
            </section>
          )}
        </>,
      )}

      {seite(
        1,
        <section>
          <h3 className="group-title">{t("Hauptregler")}</h3>
          {alle
            .filter((e) => e.haupt)
            .map((e) => (
              <Regler key={e.id} e={e} sim={sim} zeigeWirkung={zeigeWirkung} />
            ))}
        </section>,
      )}

      {seite(
        2,
        <details className="more" open={blatt || undefined}>
          <summary>{t("Alle Stellschrauben")}</summary>
          {BLOECKE.map(([b, titel]) => (
            <details className="block" key={b}>
              <summary>{t(titel)}</summary>
              <div className="inner">
                {b === "banken" && (
                  <>
                    <Auswahl
                      name="banken"
                      titel={t("Häuser und Banken mitrechnen")}
                      optionen={BANKEN}
                      wert={sz.grund.banken ?? BANKEN_STANDARD}
                      setze={(banken) => sim.setzeGrund({ banken })}
                    />
                    <p className="land-hinweis">
                      {bankenDaten(land.start)
                        ? t(
                            "Im Standard aus. An: Hauspreise, faule Kredite und das Eigenkapital der Banken rechnen mit, und der Staat rettet Banken auf Kosten der Staatsschuld. Ein Hausboom entsteht aus billigem Geld; das Platzen braucht einen Schock. Rettungen fallen kleiner aus als in der Geschichte (Kritikpunkte M31–M33).",
                          )
                        : t(
                            "Für dieses Land fehlen Bankdaten; der Baustein rechnet nicht.",
                          )}
                    </p>
                    <Auswahl
                      name="rettung"
                      titel={t("Bankenrettung")}
                      optionen={RETTUNG}
                      wert={zoegernd(sz.grund) ? "zoegernd" : "schnell"}
                      setze={(rettung) => sim.setzeGrund({ rettung })}
                    />
                  </>
                )}
                {alle
                  .filter((e) => e.baustein === b && !e.haupt)
                  .map((e) => (
                    <Regler
                      key={e.id}
                      e={e}
                      sim={sim}
                      zeigeWirkung={zeigeWirkung}
                    />
                  ))}
                {b === "anleihen" && (
                  <label className="check" htmlFor="tpi">
                    <input
                      type="checkbox"
                      id="tpi"
                      checked={sz.grund.tpi}
                      disabled={sz.grund.regime !== "euro"}
                      onChange={(ev) =>
                        sim.setzeGrund({ tpi: ev.target.checked })
                      }
                    />
                    <span>
                      {t("EZB-Schutzprogramm (TPI)")}
                      <small>{t("Nur bei gemeinsamer Währung wirksam.")}</small>
                    </span>
                  </label>
                )}
              </div>
            </details>
          ))}
        </details>,
      )}

      {seite(
        3,
        <>
          <Szenarien sim={sim} />

          <button className="reset" type="button" onClick={sim.zuruecksetzen}>
            {t("Zurück zur Basislinie")}
          </button>
        </>,
      )}
    </>
  );
}
