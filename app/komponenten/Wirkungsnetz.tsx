import { useMemo, useState } from "react";
import { fmt } from "../../modell/format";
import { BAUSTEIN_IDS } from "../../modell/bausteine";
import { BAUSTEIN_NAME, GROESSEN, bName, gName } from "../../modell/netz/groessen";
import { t } from "../../modell/sprache";
import { landkarte, schreibeMit } from "../../modell/netz/mitschrift";
import { berechneWeg, type WegKnoten } from "../../modell/netz/weg";
import type { BausteinId } from "../../modell/typen";
import { eintrag, stellschrauben, vName } from "../../modell/verzeichnis";
import type { Sim } from "../simulation";
import { PolitikRegeln } from "./PolitikRegeln";
import { KARTE_ZEICHEN, WEG_ZEICHEN, zeilen } from "../textumbruch";

const B = 150; // Breite eines Bausteins
const H = 44;
function lage(i: number): { x: number; y: number } {
  const reihe = i < 5 ? 0 : 1;
  const spalte = i < 5 ? i : 9 - i; // zweite Reihe läuft zurück, der Jahresschritt ist ein Kreis
  return { x: 20 + spalte * 195, y: 30 + reihe * 170 };
}
const mitte = (i: number) => ({ x: lage(i).x + B / 2, y: lage(i).y + H / 2 });

function Landkarte({
  sim,
  gewaehlt,
  waehle,
}: {
  sim: Sim;
  gewaehlt: BausteinId | null;
  waehle(b: BausteinId): void;
}) {
  const kanten = useMemo(
    () => landkarte(schreibeMit(sim.land, sim.sz)),
    [sim.land, sim.sz],
  );
  const idx = (b: BausteinId) => BAUSTEIN_IDS.indexOf(b);
  return (
    <svg
      viewBox="0 0 1000 260"
      className="netz-karte"
      role="group"
      aria-label={t("Landkarte")}
    >
      <defs>
        <marker
          id="pfeil"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 z" fill="var(--muted)" />
        </marker>
      </defs>
      {kanten.map((k) => {
        const a = mitte(idx(k.von));
        const b = mitte(idx(k.nach));
        const bogen = (idx(k.nach) - idx(k.von)) * 6;
        const hervor = gewaehlt && (k.von === gewaehlt || k.nach === gewaehlt);
        return (
          <path
            key={`${k.von}-${k.nach}`}
            d={`M${a.x},${a.y} Q${(a.x + b.x) / 2 + bogen},${(a.y + b.y) / 2 - bogen} ${b.x},${b.y}`}
            fill="none"
            stroke={hervor ? "var(--accent)" : "var(--muted)"}
            strokeWidth={1 + Math.min(4, k.groessen.length)}
            strokeDasharray={k.vorjahr ? "5 5" : undefined}
            markerEnd="url(#pfeil)"
            opacity={gewaehlt && !hervor ? 0.25 : 0.9}
          >
            <title>{`${bName(k.von)} → ${bName(k.nach)}: ${k.groessen.map((g) => gName(g)).join(", ")}`}</title>
          </path>
        );
      })}
      {BAUSTEIN_IDS.map((b, i) => {
        const { x, y } = lage(i);
        return (
          <g
            key={b}
            role="button"
            tabIndex={0}
            aria-label={t("Baustein {name}", { name: bName(b) })}
            data-baustein={b}
            aria-pressed={gewaehlt === b}
            className="netz-baustein"
            onClick={() => waehle(b)}
            onKeyDown={(ev) =>
              (ev.key === "Enter" || ev.key === " ") && waehle(b)
            }
          >
            <rect x={x} y={y} width={B} height={H} rx={12} />
            <text x={x + B / 2} y={y + H / 2 + 5} textAnchor="middle">
              {zeilen(bName(b), KARTE_ZEICHEN).map((z, i, alle) => (
                <tspan key={z} x={x + B / 2} dy={i === 0 ? -(alle.length - 1) * 8 : 16}>
                  {z}
                </tspan>
              ))}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function wertText(k: WegKnoten): string {
  const g = GROESSEN[k.feld];
  const d = Math.abs(k.wert) < 1 ? 2 : 1;
  return `${k.wert >= 0 ? "+" : "−"}${fmt(Math.abs(k.wert), d)} ${g.art === "quote" ? t("Pp.") : "%"}`;
}

const KB = 185; // Kastenbreite im Weg
function WegBild({ weg }: { weg: ReturnType<typeof berechneWeg> }) {
  const spalten = [0, 1, 2, 3, 4];
  const stellZeilen = zeilen(weg.name, WEG_ZEICHEN);
  const stellH = 12 + stellZeilen.length * 16;
  const pos = new Map<string, { x: number; y: number }>();
  pos.set("stell", { x: 10, y: 140 });
  for (const s of spalten.slice(1)) {
    const inSpalte = weg.knoten.filter((k) => k.spalte === s);
    inSpalte.forEach((k, i) =>
      pos.set(k.feld, { x: 10 + s * 200, y: 20 + i * 52 }),
    );
  }
  const hoehe = Math.max(
    300,
    40 +
      Math.max(
        ...spalten.map((s) => weg.knoten.filter((k) => k.spalte === s).length),
      ) *
        52,
  );
  return (
    <svg
      viewBox={`0 0 1000 ${hoehe}`}
      className="netz-weg"
      role="img"
      aria-label={weg.satz}
    >
      {[
        t("Stellschraube"),
        ...(weg.ab === null
          ? [t("im ersten Jahr"), t("nach 2–3 Jahren"), t("nach 4–10 Jahren")]
          : [String(weg.ab), `${weg.ab + 1}–${weg.ab + 2}`, `${weg.ab + 3}–${weg.ab + weg.jahr - 1}`]),
        t("Kennzahlen"),
      ].map((spalte, s) => (
        <text key={spalte} x={10 + s * 200} y={12} className="netz-spalte">
          {spalte}
        </text>
      ))}
      {weg.kanten.map(([a, b]) => {
        const p = pos.get(a)!;
        const q = pos.get(b)!;
        return (
          <line
            key={`${a}-${b}`}
            x1={p.x + KB}
            y1={a === "stell" ? p.y + stellH / 2 : p.y + 20}
            x2={q.x}
            y2={q.y + 20}
            stroke="var(--muted)"
            strokeOpacity={0.7}
            strokeWidth={1.5}
            markerEnd="url(#pfeil)"
          />
        );
      })}
      <g className="netz-knoten stell">
        <rect x={10} y={140} width={KB} height={stellH} rx={10} />
        <text x={20} y={140}>
          {stellZeilen.map((z) => (
            <tspan key={z} x={20} dy={16}>
              {z}
            </tspan>
          ))}
        </text>
      </g>
      {weg.knoten.map((k) => {
        const p = pos.get(k.feld)!;
        return (
          <g
            key={k.feld}
            className={`netz-knoten ${k.gut > 0 ? "gut" : k.gut < 0 ? "schlecht" : ""}`}
          >
            <rect x={p.x} y={p.y} width={KB} height={40} rx={10} />
            <text x={p.x + 10} y={p.y + 17}>
              {k.name}
            </text>
            <text x={p.x + 10} y={p.y + 33} className="netz-wert">
              {wertText(k)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function Wirkungsnetz({
  sim,
  fokus,
  setzeFokus,
}: {
  sim: Sim;
  fokus: string | null;
  setzeFokus(id: string): void;
}) {
  const [gewaehlt, setGewaehlt] = useState<BausteinId | null>(null);
  const alle = stellschrauben();
  const mitschrift = useMemo(
    () => schreibeMit(sim.land, sim.sz),
    [sim.land, sim.sz],
  );
  const weg = useMemo(
    () => (fokus ? berechneWeg(sim.land, sim.sz, fokus, mitschrift) : null),
    [sim.land, sim.sz, fokus, mitschrift],
  );
  const spur = gewaehlt
    ? mitschrift.spuren.find((s) => s.id === gewaehlt)
    : null;
  const eingaenge = gewaehlt
    ? landkarte(mitschrift)
        .filter((k) => k.nach === gewaehlt)
        .map((k) => bName(k.von))
    : [];
  return (
    <>
      <section className="card" aria-label={t("Landkarte der Bausteine")} data-tour="netz-karte">
        <h2>{t("Landkarte der Bausteine")}</h2>
        <p className="lead">
          {t("Die zehn Bausteine in der Reihenfolge, in der das Modell jedes Jahr rechnet. Ein Pfeil heißt: Der Baustein am Ende liest eine Größe, die der am Anfang schreibt. Gestrichelt: erst im Folgejahr. Ermittelt aus einer echten Rechnung, nicht von Hand gezeichnet.")}
        </p>
        <Landkarte sim={sim} gewaehlt={gewaehlt} waehle={setGewaehlt} />
        {spur && gewaehlt && (
          <div
            className="netz-detail"
            aria-label={t("Baustein im Detail")}
            role="region"
          >
            <h3>{bName(gewaehlt)}</h3>
            <p>
              <strong>{t("Stellschrauben:")}</strong>{" "}
              {alle.filter((e) => e.baustein === gewaehlt).length === 0 &&
                t("keine")}
              {alle
                .filter((e) => e.baustein === gewaehlt)
                .map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    className="netz-chip"
                    onClick={() => setzeFokus(e.id)}
                  >
                    {vName(e)}
                  </button>
                ))}
            </p>
            <p>
              <strong>{t("Rechnet aus:")}</strong>{" "}
              {[...spur.schreibt]
                .filter((f) => GROESSEN[f])
                .map((f) => gName(f))
                .join(", ") || t("nur interne Größen")}
            </p>
            <p>
              <strong>{t("Bekommt Eingänge von:")}</strong>{" "}
              {eingaenge.join(", ") || t("keinem anderen Baustein")}
            </p>
          </div>
        )}
      </section>
      <section className="card" aria-label={t("Weg einer Stellschraube")} data-tour="netz-weg">
        <h2>{t("Weg einer Stellschraube")}</h2>
        <div className="field">
          <label htmlFor="netz-fokus">{t("Stellschraube")}</label>
          <select
            id="netz-fokus"
            value={fokus ?? ""}
            onChange={(ev) => ev.target.value && setzeFokus(ev.target.value)}
          >
            <option value="">{t("— wählen —")}</option>
            {BAUSTEIN_IDS.filter((b) => alle.some((e) => e.baustein === b)).map(
              (b) => (
                <optgroup key={b} label={bName(b)}>
                  {alle
                    .filter((e) => e.baustein === b)
                    .map((e) => (
                      <option key={e.id} value={e.id}>
                        {vName(e)}
                      </option>
                    ))}
                </optgroup>
              ),
            )}
          </select>
        </div>
        {!weg && (
          <p className="lead">
            {t("Wähle eine Stellschraube oder klicke in der Landkarte auf einen Baustein.")}
          </p>
        )}
        {weg && (
          <>
            <p className="netz-satz" role="status">
              {weg.satz}
            </p>
            <WegBild weg={weg} />
            <p className="hint">
              {eintrag(weg.id).optionen
                ? t("Gerechnet im aktuellen Szenario: einmal wie eingestellt, einmal mit der gezeigten anderen Auswahl. Die Linien zeigen, worüber eine Wirkung laufen kann, nicht wie viel über welchen Zweig läuft.")
                : t("Gerechnet im aktuellen Szenario: einmal wie eingestellt, einmal mit der Stellschraube um 10 % ihrer Spanne verstellt. Die Linien zeigen, worüber eine Wirkung laufen kann, nicht wie viel über welchen Zweig läuft.")}
            </p>
          </>
        )}
      </section>
      <PolitikRegeln sim={sim} />
    </>
  );
}
