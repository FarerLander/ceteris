import { readFileSync } from "node:fs";
import { KRITIK, kritikMarkdown } from "../kritik";

describe("Kritikpunkte", () => {
  it("haben eindeutige ids, Titel, Wirkung und Behebung", () => {
    expect(new Set(KRITIK.map((k) => k.id)).size).toBe(KRITIK.length);
    for (const k of KRITIK)
      expect(k.titel && k.wirkung && k.behebung, k.id).toBeTruthy();
  });
  it("enthalten die ungeprüften Handwerte und die historischen Daten", () => {
    expect(KRITIK.find((k) => k.id === "D1")?.titel).toMatch(
      /Handwerte ungeprüft/,
    );
    expect(KRITIK.find((k) => k.id === "D7")?.titel).toMatch(/Historische/);
  });
  it("Länderkürzel sind bekannte Codes", () => {
    const bekannt = ["DE", "US", "JP", "CN", "RU", "GB", "FR", "IT", "CA"];
    for (const k of KRITIK)
      for (const l of k.laender ?? []) expect(bekannt).toContain(l);
    expect(KRITIK.find((k) => k.id === "M23")?.laender).toEqual(["US"]);
  });
  it("docs/kritikpunkte.md ist aus den Daten erzeugt und aktuell", () => {
    expect(readFileSync("docs/kritikpunkte.md", "utf-8")).toBe(
      kritikMarkdown(),
    );
  });
});
