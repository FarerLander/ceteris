# Quellen

Stand: 2026-09-28. Wirkstärken und ihre Quellen stehen im Verzeichnis (`modell/verzeichnis.ts`).
Hier stehen die Handwerte je Land, die automatischen Reihen und jede Änderung an einer Wirkstärke.

## Deutschland — Handwerte

„ungeprüft“ heißt: Der Wert ist aus Fachwissen gesetzt und die Quelle benannt, aber noch nicht im Original nachgeschlagen. Beim Prüfen: Wert ersetzen, wenn er mehr als 10 % abweicht, und Anmerkung auf „geprüft <Datum>“ setzen.

| Feld | Wert | Quelle | Stand | Anmerkung |
|---|---|---|---|---|
| kapitalkoeffizient | 3.0 | Destatis VGR, Nettoanlagevermögen zu Wiederbeschaffungspreisen / BIP | 2024/25 | ungeprüft |
| tfpTrend | 0.4 | Zwischen Rückblick-Kalibrierung (0,3) und Sachverständigenrat (≈0,5) | 2026 | kalibriert |
| lohnquote | 0.53 | Destatis VGR, Arbeitnehmerentgelt / BIP | 2024/25 | ungeprüft |
| nairu | 3.5 | EU-Kommission AMECO (NAWRU) | 2024/25 | ungeprüft |
| erwerbsquote | 0.78 | Destatis Mikrozensus, Erwerbsquote 15 bis Regelaltersgrenze | 2024/25 | ungeprüft |
| erwerbsquoteTrend | 0.003 für 12 Jahre | Fortschreibung des Anstiegs 15–64 von rund 0,3 Pp. pro Jahr 2013–2023 (Destatis Mikrozensus); Ältere und Frauen; nur nach vorn, nicht im Rückblick | 2026 | ungeprüft |
| produktivitaetsLuecke | 0.9 | OECD Productivity Database, Arbeitsproduktivität je Stunde DE/USA | 2024/25 | ungeprüft |
| leitzins | 2.0 | EZB Einlagesatz | 2024/25 | ungeprüft |
| effZins | 1.6 | Destatis/Bundesbank: Zinsausgaben Staat / Schuldenstand | 2024/25 | ungeprüft |
| qe | 20 | EZB PSPP/PEPP-Bestände deutscher Staatsanleihen / BIP | 2024/25 | ungeprüft |
| rentenausgaben | 10.3 | OECD Pensions at a Glance, öffentliche Rentenausgaben | 2024/25 | ungeprüft |
| alg | 1.4 | Bundesagentur für Arbeit / BMAS: ALG I + Bürgergeld | 2024/25 | ungeprüft |
| steuerBasen | {"einkommen": 55, "sozialabgaben": 44, "mwst": 37, "unternehmen": 7.3, "kapitalertrag": 3.5, "vermoegen": 300, "erbschaft": 10} | Kalibriert: Satz × Basis trifft das Aufkommen laut BMF Steuerschätzung | 2024/25 | ungeprüft |
| mix | {"kohle": 0.23, "gas": 0.18, "oel": 0.03, "atom": 0, "ern": 0.56} | Fraunhofer ISE Energy-Charts, Nettostromerzeugung | 2024/25 | ungeprüft |
| industrieTWh | 230 | BDEW Stromverbrauch Industrie | 2024/25 | ungeprüft |
| netzkosten | 30 | BNetzA Monitoringbericht, Netzentgelte Industrie | 2024/25 | ungeprüft |
| energieExportAnteil | 0.15 | Destatis Außenhandel, energieintensive Warengruppen | 2024/25 | ungeprüft |
| nfa | 70 | Bundesbank Auslandsvermögensstatus | 2024/25 | ungeprüft |
| dsrSchwelle | 21 | Modell-Schuldendienstquote im Startjahr (Zins + 8 % Tilgung auf IMF-Privatschuld) plus 4 Pp. (BIS: Entschuldung setzt etwa 4 Pp. über dem Trend ein) | 2024/25 | ungeprüft |
| vcBasis | 0.07 | Invest Europe / KfW Venture-Capital-Dashboard | 2024/25 | ungeprüft |
| eurogewicht | 0.28 | Eurostat, Anteil DE am Euroraum-BIP | 2024/25 | ungeprüft |
| fluchtReaktion | -0.5 | Rendite Bund 2008 und 2020 (sichere Hafen-Bewegung) | 2024/25 | ungeprüft |
| reserve | 0 | Nur Weltwährung hat Reservestatus im Modell | 2024/25 | ungeprüft |
| armut | 15.5 | Destatis Armutsgefährdungsquote (Mikrozensus) | 2024/25 | ungeprüft |
| rendite (Ersatz) | 2.6 | Bundesbank Umlaufrendite 10 Jahre (Ersatz) | 2024/25 | ungeprüft |
| privatschuld (Ersatz) | 110 | BIS Credit to private non-financial sector (Ersatz) | 2024/25 | ungeprüft |
| einnahmen (Ersatz) | 47.5 | Destatis Staatsquote (Ersatz) | 2024/25 | ungeprüft |
| ausgaben (Ersatz) | 49.5 | Destatis Staatsquote (Ersatz) | 2024/25 | ungeprüft |
| importquote (Ersatz) | 0.65 | AG Energiebilanzen (Ersatz) | 2024/25 | ungeprüft |
| co2Mt (Ersatz) | 650 | Umweltbundesamt Treibhausgas-Inventar (Ersatz) | 2024/25 | ungeprüft |

## Deutschland — automatische Reihen

Geholt mit `npm run daten -- DE` am 2026-09-27. Fehlend beim letzten Lauf: keine. Altersgruppen: World Bank SP.POP.<Gruppe>.MA/FE.5Y.

| Schlüssel | Quelle |
|---|---|
| alq | World Bank SL.UEM.TOTL.ZS |
| ausgaben | IMF DataMapper exp |
| bev | World Bank SP.POP.TOTL |
| bevF | World Bank SP.POP.TOTL.FE.IN |
| bevM | World Bank SP.POP.TOTL.MA.IN |
| bip | World Bank NY.GDP.MKTP.CN |
| co2Mt | World Bank EN.GHG.CO2.MT.CE.AR5 |
| einnahmen | IMF DataMapper rev |
| exporte | World Bank NE.EXP.GNFS.ZS |
| gini | World Bank SI.POV.GINI (seit Spec 13.13 nur noch Rückfall) |
| giniOecd | OECD Income Distribution Database (Gini verfügbares Einkommen), siehe „Verteilung“ unten |
| importe | World Bank NE.IMP.GNFS.ZS |
| importquote | World Bank EG.IMP.CONS.ZS |
| inflation | IMF DataMapper PCPIPCH |
| investQuote | World Bank NE.GDI.TOTL.ZS |
| lebenserwartung | World Bank SP.DYN.LE00.IN |
| privatkredit | World Bank FS.AST.PRVT.GD.ZS |
| privatschuld | IMF DataMapper PVD_LS |
| rendite | OECD Financial market statistics IRLT |
| schuldQuote | IMF DataMapper GGXWDG_NGDP |
| tfr | World Bank SP.DYN.TFRT.IN |


## USA — Handwerte

Währung: $, Kurs 1.08 je Euro (EZB-Referenzkurs 2025, gerundet).

| Feld | Wert | Quelle | Stand | Anmerkung |
|---|---|---|---|---|
| steuer.einkommen | 0.16 | IRS/SSA/CBO, OECD Taxing Wages, NATO; Zölle 2025 effektiv rund 10 % (Yale Budget Lab); ungeprüft | 2025 | ungeprüft |
| steuer.sozialabgaben | 0.153 | IRS/SSA/CBO, OECD Taxing Wages, NATO; Zölle 2025 effektiv rund 10 % (Yale Budget Lab); ungeprüft | 2025 | ungeprüft |
| steuer.mwst | 0.07 | IRS/SSA/CBO, OECD Taxing Wages, NATO; Zölle 2025 effektiv rund 10 % (Yale Budget Lab); ungeprüft | 2025 | ungeprüft |
| steuer.unternehmen | 0.25 | IRS/SSA/CBO, OECD Taxing Wages, NATO; Zölle 2025 effektiv rund 10 % (Yale Budget Lab); ungeprüft | 2025 | ungeprüft |
| steuer.kapitalertrag | 0.2 | IRS/SSA/CBO, OECD Taxing Wages, NATO; Zölle 2025 effektiv rund 10 % (Yale Budget Lab); ungeprüft | 2025 | ungeprüft |
| steuer.vermoegen | 0 | IRS/SSA/CBO, OECD Taxing Wages, NATO; Zölle 2025 effektiv rund 10 % (Yale Budget Lab); ungeprüft | 2025 | ungeprüft |
| steuer.erbschaft | 0.01 | IRS/SSA/CBO, OECD Taxing Wages, NATO; Zölle 2025 effektiv rund 10 % (Yale Budget Lab); ungeprüft | 2025 | ungeprüft |
| rente.alter | 67 | IRS/SSA/CBO, OECD Taxing Wages, NATO; Zölle 2025 effektiv rund 10 % (Yale Budget Lab); ungeprüft | 2025 | ungeprüft |
| rente.niveau | 40 | IRS/SSA/CBO, OECD Taxing Wages, NATO; Zölle 2025 effektiv rund 10 % (Yale Budget Lab); ungeprüft | 2025 | ungeprüft |
| rente.beitragsAutomatik | 0 | IRS/SSA/CBO, OECD Taxing Wages, NATO; Zölle 2025 effektiv rund 10 % (Yale Budget Lab); ungeprüft | 2025 | ungeprüft |
| sozial.lohnersatz | 0.4 | IRS/SSA/CBO, OECD Taxing Wages, NATO; Zölle 2025 effektiv rund 10 % (Yale Budget Lab); ungeprüft | 2025 | ungeprüft |
| staat.gesundheit | 8.5 | IRS/SSA/CBO, OECD Taxing Wages, NATO; Zölle 2025 effektiv rund 10 % (Yale Budget Lab); ungeprüft | 2025 | ungeprüft |
| staat.familie | 0.7 | IRS/SSA/CBO, OECD Taxing Wages, NATO; Zölle 2025 effektiv rund 10 % (Yale Budget Lab); ungeprüft | 2025 | ungeprüft |
| staat.verteidigung | 3.3 | IRS/SSA/CBO, OECD Taxing Wages, NATO; Zölle 2025 effektiv rund 10 % (Yale Budget Lab); ungeprüft | 2025 | ungeprüft |
| innov.fue | 3.5 | IRS/SSA/CBO, OECD Taxing Wages, NATO; Zölle 2025 effektiv rund 10 % (Yale Budget Lab); ungeprüft | 2025 | ungeprüft |
| innov.bildung | 5.0 | IRS/SSA/CBO, OECD Taxing Wages, NATO; Zölle 2025 effektiv rund 10 % (Yale Budget Lab); ungeprüft | 2025 | ungeprüft |
| mig.netto | 1100 | IRS/SSA/CBO, OECD Taxing Wages, NATO; Zölle 2025 effektiv rund 10 % (Yale Budget Lab); ungeprüft | 2025 | ungeprüft |
| demo.geburtenrate | 1.62 | IRS/SSA/CBO, OECD Taxing Wages, NATO; Zölle 2025 effektiv rund 10 % (Yale Budget Lab); ungeprüft | 2025 | ungeprüft |
| energie.co2Preis | 0 | IRS/SSA/CBO, OECD Taxing Wages, NATO; Zölle 2025 effektiv rund 10 % (Yale Budget Lab); ungeprüft | 2025 | ungeprüft |
| energie.kohleausstieg | 2060 | IRS/SSA/CBO, OECD Taxing Wages, NATO; Zölle 2025 effektiv rund 10 % (Yale Budget Lab); ungeprüft | 2025 | ungeprüft |
| energie.atom | 1 | IRS/SSA/CBO, OECD Taxing Wages, NATO; Zölle 2025 effektiv rund 10 % (Yale Budget Lab); ungeprüft | 2025 | ungeprüft |
| energie.ausbauTempo | 1.5 | IRS/SSA/CBO, OECD Taxing Wages, NATO; Zölle 2025 effektiv rund 10 % (Yale Budget Lab); ungeprüft | 2025 | ungeprüft |
| energie.netzInvest | 0.3 | IRS/SSA/CBO, OECD Taxing Wages, NATO; Zölle 2025 effektiv rund 10 % (Yale Budget Lab); ungeprüft | 2025 | ungeprüft |
| anleihen.laufzeit | 6 | IRS/SSA/CBO, OECD Taxing Wages, NATO; Zölle 2025 effektiv rund 10 % (Yale Budget Lab); ungeprüft | 2025 | ungeprüft |
| anleihen.auslandsanteil | 0.3 | IRS/SSA/CBO, OECD Taxing Wages, NATO; Zölle 2025 effektiv rund 10 % (Yale Budget Lab); ungeprüft | 2025 | ungeprüft |
| handel.zoelle | 10 | IRS/SSA/CBO, OECD Taxing Wages, NATO; Zölle 2025 effektiv rund 10 % (Yale Budget Lab); ungeprüft | 2025 | ungeprüft |
| handel.kapitalOffenheit | 0.95 | IRS/SSA/CBO, OECD Taxing Wages, NATO; Zölle 2025 effektiv rund 10 % (Yale Budget Lab); ungeprüft | 2025 | ungeprüft |
| handel.abhaengigkeit | 0.3 | IRS/SSA/CBO, OECD Taxing Wages, NATO; Zölle 2025 effektiv rund 10 % (Yale Budget Lab); ungeprüft | 2025 | ungeprüft |
| kapitalkoeffizient | 2.75 | Abgeleitet aus BEA: Abschreibungen 16,3 % BIP (2025) bei 6 % Abschreibungsrate; 3,2 ergab 19,2 % | 2025 | geprüft 28.09.2026 |
| tfpTrend | 1.0 | = Produktivitätsgrenze (welt.grenzeWachstum); ergibt mit dem Kapitalstock rund 1,6 % Potenzialwachstum, CBO 2026: 1,8–2,1 % | 2026 | geprüft 28.09.2026 |
| lohnquote | 0.53 | BEA, BLS, Fed H.4.1, SSA Trustees Report, EIA; NIIP BEA; ungeprüft | 2025 | ungeprüft |
| nairu | 4.2 | BEA, BLS, Fed H.4.1, SSA Trustees Report, EIA; NIIP BEA; ungeprüft | 2025 | ungeprüft |
| erwerbsquote | 0.75 | BEA, BLS, Fed H.4.1, SSA Trustees Report, EIA; NIIP BEA; ungeprüft | 2025 | ungeprüft |
| produktivitaetsLuecke | 1.0 | BEA, BLS, Fed H.4.1, SSA Trustees Report, EIA; NIIP BEA; ungeprüft | 2025 | ungeprüft |
| leitzins | 4.3 | BEA, BLS, Fed H.4.1, SSA Trustees Report, EIA; NIIP BEA; ungeprüft | 2025 | ungeprüft |
| effZins | 3.0 | BEA, BLS, Fed H.4.1, SSA Trustees Report, EIA; NIIP BEA; ungeprüft | 2025 | ungeprüft |
| qe | 15 | BEA, BLS, Fed H.4.1, SSA Trustees Report, EIA; NIIP BEA; ungeprüft | 2025 | ungeprüft |
| rentenausgaben | 5.2 | BEA, BLS, Fed H.4.1, SSA Trustees Report, EIA; NIIP BEA; ungeprüft | 2025 | ungeprüft |
| alg | 0.3 | BEA, BLS, Fed H.4.1, SSA Trustees Report, EIA; NIIP BEA; ungeprüft | 2025 | ungeprüft |
| steuerBasen | {"einkommen": 56, "sozialabgaben": 40, "mwst": 30, "unternehmen": 6, "kapitalertrag": 3, "vermoegen": 300, "erbschaft": 10} | BEA, BLS, Fed H.4.1, SSA Trustees Report, EIA; NIIP BEA; ungeprüft | 2025 | ungeprüft |
| mix | {"kohle": 0.16, "gas": 0.43, "oel": 0.01, "atom": 0.18, "ern": 0.22} | BEA, BLS, Fed H.4.1, SSA Trustees Report, EIA; NIIP BEA; ungeprüft | 2025 | ungeprüft |
| industrieTWh | 1000 | BEA, BLS, Fed H.4.1, SSA Trustees Report, EIA; NIIP BEA; ungeprüft | 2025 | ungeprüft |
| netzkosten | 20 | BEA, BLS, Fed H.4.1, SSA Trustees Report, EIA; NIIP BEA; ungeprüft | 2025 | ungeprüft |
| energieExportAnteil | 0.1 | BEA, BLS, Fed H.4.1, SSA Trustees Report, EIA; NIIP BEA; ungeprüft | 2025 | ungeprüft |
| nfa | -90 | BEA, BLS, Fed H.4.1, SSA Trustees Report, EIA; NIIP BEA; ungeprüft | 2025 | ungeprüft |
| vcBasis | 0.6 | BEA, BLS, Fed H.4.1, SSA Trustees Report, EIA; NIIP BEA; ungeprüft | 2025 | ungeprüft |
| eurogewicht | 0 | BEA, BLS, Fed H.4.1, SSA Trustees Report, EIA; NIIP BEA; ungeprüft | 2025 | ungeprüft |
| fluchtReaktion | -1.0 | BEA, BLS, Fed H.4.1, SSA Trustees Report, EIA; NIIP BEA; ungeprüft | 2025 | ungeprüft |
| reserve | 1 | BEA, BLS, Fed H.4.1, SSA Trustees Report, EIA; NIIP BEA; ungeprüft | 2025 | ungeprüft |
| armut | 17 | BEA, BLS, Fed H.4.1, SSA Trustees Report, EIA; NIIP BEA; ungeprüft | 2025 | ungeprüft |
| rendite (Ersatz) | 4.3 | BEA, BLS, Fed H.4.1, SSA Trustees Report, EIA; NIIP BEA; ungeprüft | 2025 | ungeprüft |
| gini (Ersatz) | 41.3 | BEA, BLS, Fed H.4.1, SSA Trustees Report, EIA; NIIP BEA; ungeprüft | 2025 | ungeprüft |
| privatschuld (Ersatz) | 150 | BEA, BLS, Fed H.4.1, SSA Trustees Report, EIA; NIIP BEA; ungeprüft | 2025 | ungeprüft |
| einnahmen (Ersatz) | 30.5 | BEA, BLS, Fed H.4.1, SSA Trustees Report, EIA; NIIP BEA; ungeprüft | 2025 | ungeprüft |
| ausgaben (Ersatz) | 37.5 | BEA, BLS, Fed H.4.1, SSA Trustees Report, EIA; NIIP BEA; ungeprüft | 2025 | ungeprüft |
| importquote (Ersatz) | -0.05 | BEA, BLS, Fed H.4.1, SSA Trustees Report, EIA; NIIP BEA; ungeprüft | 2025 | ungeprüft |
| co2Mt (Ersatz) | 4800 | BEA, BLS, Fed H.4.1, SSA Trustees Report, EIA; NIIP BEA; ungeprüft | 2025 | ungeprüft |

## Japan — Handwerte

Währung: ¥, Kurs 160 je Euro (EZB-Referenzkurs 2025, gerundet).

| Feld | Wert | Quelle | Stand | Anmerkung |
|---|---|---|---|---|
| steuer.einkommen | 0.12 | MOF Japan, MHLW (Rentenniveau Modellhaushalt), OECD Taxing Wages, SIPRI; ungeprüft | 2025 | ungeprüft |
| steuer.sozialabgaben | 0.3 | MOF Japan, MHLW (Rentenniveau Modellhaushalt), OECD Taxing Wages, SIPRI; ungeprüft | 2025 | ungeprüft |
| steuer.mwst | 0.1 | MOF Japan, MHLW (Rentenniveau Modellhaushalt), OECD Taxing Wages, SIPRI; ungeprüft | 2025 | ungeprüft |
| steuer.unternehmen | 0.3 | MOF Japan, MHLW (Rentenniveau Modellhaushalt), OECD Taxing Wages, SIPRI; ungeprüft | 2025 | ungeprüft |
| steuer.kapitalertrag | 0.2 | MOF Japan, MHLW (Rentenniveau Modellhaushalt), OECD Taxing Wages, SIPRI; ungeprüft | 2025 | ungeprüft |
| steuer.vermoegen | 0 | MOF Japan, MHLW (Rentenniveau Modellhaushalt), OECD Taxing Wages, SIPRI; ungeprüft | 2025 | ungeprüft |
| steuer.erbschaft | 0.03 | MOF Japan, MHLW (Rentenniveau Modellhaushalt), OECD Taxing Wages, SIPRI; ungeprüft | 2025 | ungeprüft |
| rente.alter | 65 | MOF Japan, MHLW (Rentenniveau Modellhaushalt), OECD Taxing Wages, SIPRI; ungeprüft | 2025 | ungeprüft |
| rente.niveau | 60 | MOF Japan, MHLW (Rentenniveau Modellhaushalt), OECD Taxing Wages, SIPRI; ungeprüft | 2025 | ungeprüft |
| rente.beitragsAutomatik | 0 | MOF Japan, MHLW (Rentenniveau Modellhaushalt), OECD Taxing Wages, SIPRI; ungeprüft | 2025 | ungeprüft |
| sozial.lohnersatz | 0.5 | MOF Japan, MHLW (Rentenniveau Modellhaushalt), OECD Taxing Wages, SIPRI; ungeprüft | 2025 | ungeprüft |
| staat.gesundheit | 9.5 | MOF Japan, MHLW (Rentenniveau Modellhaushalt), OECD Taxing Wages, SIPRI; ungeprüft | 2025 | ungeprüft |
| staat.familie | 1.8 | MOF Japan, MHLW (Rentenniveau Modellhaushalt), OECD Taxing Wages, SIPRI; ungeprüft | 2025 | ungeprüft |
| staat.verteidigung | 1.4 | MOF Japan, MHLW (Rentenniveau Modellhaushalt), OECD Taxing Wages, SIPRI; ungeprüft | 2025 | ungeprüft |
| innov.fue | 3.4 | MOF Japan, MHLW (Rentenniveau Modellhaushalt), OECD Taxing Wages, SIPRI; ungeprüft | 2025 | ungeprüft |
| innov.bildung | 3.4 | MOF Japan, MHLW (Rentenniveau Modellhaushalt), OECD Taxing Wages, SIPRI; ungeprüft | 2025 | ungeprüft |
| mig.netto | 150 | MOF Japan, MHLW (Rentenniveau Modellhaushalt), OECD Taxing Wages, SIPRI; ungeprüft | 2025 | ungeprüft |
| demo.geburtenrate | 1.2 | MOF Japan, MHLW (Rentenniveau Modellhaushalt), OECD Taxing Wages, SIPRI; ungeprüft | 2025 | ungeprüft |
| energie.co2Preis | 2 | MOF Japan, MHLW (Rentenniveau Modellhaushalt), OECD Taxing Wages, SIPRI; ungeprüft | 2025 | ungeprüft |
| energie.kohleausstieg | 2060 | MOF Japan, MHLW (Rentenniveau Modellhaushalt), OECD Taxing Wages, SIPRI; ungeprüft | 2025 | ungeprüft |
| energie.atom | 1 | MOF Japan, MHLW (Rentenniveau Modellhaushalt), OECD Taxing Wages, SIPRI; ungeprüft | 2025 | ungeprüft |
| energie.ausbauTempo | 1.5 | MOF Japan, MHLW (Rentenniveau Modellhaushalt), OECD Taxing Wages, SIPRI; ungeprüft | 2025 | ungeprüft |
| energie.netzInvest | 0.4 | MOF Japan, MHLW (Rentenniveau Modellhaushalt), OECD Taxing Wages, SIPRI; ungeprüft | 2025 | ungeprüft |
| anleihen.laufzeit | 9 | MOF Japan, MHLW (Rentenniveau Modellhaushalt), OECD Taxing Wages, SIPRI; ungeprüft | 2025 | ungeprüft |
| anleihen.auslandsanteil | 0.12 | MOF Japan, MHLW (Rentenniveau Modellhaushalt), OECD Taxing Wages, SIPRI; ungeprüft | 2025 | ungeprüft |
| handel.zoelle | 2.5 | MOF Japan, MHLW (Rentenniveau Modellhaushalt), OECD Taxing Wages, SIPRI; ungeprüft | 2025 | ungeprüft |
| handel.kapitalOffenheit | 0.8 | MOF Japan, MHLW (Rentenniveau Modellhaushalt), OECD Taxing Wages, SIPRI; ungeprüft | 2025 | ungeprüft |
| handel.abhaengigkeit | 0.4 | MOF Japan, MHLW (Rentenniveau Modellhaushalt), OECD Taxing Wages, SIPRI; ungeprüft | 2025 | ungeprüft |
| kapitalkoeffizient | 3.5 | Cabinet Office, BoJ Flow of Funds (JGB-Bestand der BoJ), METI Energiebilanz, MOF NIIP; ungeprüft | 2025 | ungeprüft |
| tfpTrend | 0.4 | Cabinet Office, BoJ Flow of Funds (JGB-Bestand der BoJ), METI Energiebilanz, MOF NIIP; ungeprüft | 2025 | ungeprüft |
| lohnquote | 0.5 | Cabinet Office, BoJ Flow of Funds (JGB-Bestand der BoJ), METI Energiebilanz, MOF NIIP; ungeprüft | 2025 | ungeprüft |
| nairu | 2.6 | Cabinet Office, BoJ Flow of Funds (JGB-Bestand der BoJ), METI Energiebilanz, MOF NIIP; ungeprüft | 2025 | ungeprüft |
| erwerbsquote | 0.8 | Cabinet Office, BoJ Flow of Funds (JGB-Bestand der BoJ), METI Energiebilanz, MOF NIIP; ungeprüft | 2025 | ungeprüft |
| erwerbsquoteTrend | 0.004 für 10 Jahre | Labour Force Survey: Erwerbsquote 15–64 stieg 2013–2023 um rund 0,6 Pp. pro Jahr, gebremst fortgeschrieben; bildet auch die wachsende Arbeit über 65 grob ab | 2026 | ungeprüft |
| produktivitaetsLuecke | 0.65 | Cabinet Office, BoJ Flow of Funds (JGB-Bestand der BoJ), METI Energiebilanz, MOF NIIP; ungeprüft | 2025 | ungeprüft |
| leitzins | 0.4 | Cabinet Office, BoJ Flow of Funds (JGB-Bestand der BoJ), METI Energiebilanz, MOF NIIP; ungeprüft | 2025 | ungeprüft |
| effZins | 0.8 | Cabinet Office, BoJ Flow of Funds (JGB-Bestand der BoJ), METI Energiebilanz, MOF NIIP; ungeprüft | 2025 | ungeprüft |
| qe | 90 | Cabinet Office, BoJ Flow of Funds (JGB-Bestand der BoJ), METI Energiebilanz, MOF NIIP; ungeprüft | 2025 | ungeprüft |
| rentenausgaben | 10.0 | Cabinet Office, BoJ Flow of Funds (JGB-Bestand der BoJ), METI Energiebilanz, MOF NIIP; ungeprüft | 2025 | ungeprüft |
| alg | 0.2 | Cabinet Office, BoJ Flow of Funds (JGB-Bestand der BoJ), METI Energiebilanz, MOF NIIP; ungeprüft | 2025 | ungeprüft |
| steuerBasen | {"einkommen": 50, "sozialabgaben": 43, "mwst": 50, "unternehmen": 13, "kapitalertrag": 3, "vermoegen": 300, "erbschaft": 10} | Cabinet Office, BoJ Flow of Funds (JGB-Bestand der BoJ), METI Energiebilanz, MOF NIIP; ungeprüft | 2025 | ungeprüft |
| mix | {"kohle": 0.28, "gas": 0.33, "oel": 0.07, "atom": 0.08, "ern": 0.24} | Cabinet Office, BoJ Flow of Funds (JGB-Bestand der BoJ), METI Energiebilanz, MOF NIIP; ungeprüft | 2025 | ungeprüft |
| industrieTWh | 350 | Cabinet Office, BoJ Flow of Funds (JGB-Bestand der BoJ), METI Energiebilanz, MOF NIIP; ungeprüft | 2025 | ungeprüft |
| netzkosten | 30 | Cabinet Office, BoJ Flow of Funds (JGB-Bestand der BoJ), METI Energiebilanz, MOF NIIP; ungeprüft | 2025 | ungeprüft |
| energieExportAnteil | 0.15 | Cabinet Office, BoJ Flow of Funds (JGB-Bestand der BoJ), METI Energiebilanz, MOF NIIP; ungeprüft | 2025 | ungeprüft |
| nfa | 75 | Cabinet Office, BoJ Flow of Funds (JGB-Bestand der BoJ), METI Energiebilanz, MOF NIIP; ungeprüft | 2025 | ungeprüft |
| vcBasis | 0.05 | Cabinet Office, BoJ Flow of Funds (JGB-Bestand der BoJ), METI Energiebilanz, MOF NIIP; ungeprüft | 2025 | ungeprüft |
| eurogewicht | 0 | Cabinet Office, BoJ Flow of Funds (JGB-Bestand der BoJ), METI Energiebilanz, MOF NIIP; ungeprüft | 2025 | ungeprüft |
| fluchtReaktion | -0.3 | Cabinet Office, BoJ Flow of Funds (JGB-Bestand der BoJ), METI Energiebilanz, MOF NIIP; ungeprüft | 2025 | ungeprüft |
| reserve | 0 | Cabinet Office, BoJ Flow of Funds (JGB-Bestand der BoJ), METI Energiebilanz, MOF NIIP; ungeprüft | 2025 | ungeprüft |
| armut | 15.4 | Cabinet Office, BoJ Flow of Funds (JGB-Bestand der BoJ), METI Energiebilanz, MOF NIIP; ungeprüft | 2025 | ungeprüft |
| rendite (Ersatz) | 1.4 | Cabinet Office, BoJ Flow of Funds (JGB-Bestand der BoJ), METI Energiebilanz, MOF NIIP; ungeprüft | 2025 | ungeprüft |
| gini (Ersatz) | 32.9 | Cabinet Office, BoJ Flow of Funds (JGB-Bestand der BoJ), METI Energiebilanz, MOF NIIP; ungeprüft | 2025 | ungeprüft |
| privatschuld (Ersatz) | 190 | Cabinet Office, BoJ Flow of Funds (JGB-Bestand der BoJ), METI Energiebilanz, MOF NIIP; ungeprüft | 2025 | ungeprüft |
| einnahmen (Ersatz) | 37.5 | Cabinet Office, BoJ Flow of Funds (JGB-Bestand der BoJ), METI Energiebilanz, MOF NIIP; ungeprüft | 2025 | ungeprüft |
| ausgaben (Ersatz) | 40.0 | Cabinet Office, BoJ Flow of Funds (JGB-Bestand der BoJ), METI Energiebilanz, MOF NIIP; ungeprüft | 2025 | ungeprüft |
| importquote (Ersatz) | 0.87 | Cabinet Office, BoJ Flow of Funds (JGB-Bestand der BoJ), METI Energiebilanz, MOF NIIP; ungeprüft | 2025 | ungeprüft |
| co2Mt (Ersatz) | 1000 | Cabinet Office, BoJ Flow of Funds (JGB-Bestand der BoJ), METI Energiebilanz, MOF NIIP; ungeprüft | 2025 | ungeprüft |
| fondsQuote0 | 40 | GPIF, Vermögen 31.03.2025 rund 250 Bio. ¥, BIP rund 615 Bio. ¥; im Gesamtstaat (IWF), Erträge in den Einnahmen | 2025 | Größenordnung geprüft |


## Vereinigtes Königreich — Handwerte

Währung: £, Kurs 0.85 je Euro (EZB-Referenzkurs 2025, gerundet).

| Feld | Wert | Quelle | Stand | Anmerkung |
|---|---|---|---|---|
| steuer.einkommen | 0.17 | HMRC, OECD Taxing Wages, NATO, ONS; Rentenniveau auf Verzeichnisgrenze 35 gesetzt (OECD-Ersatzquote gesetzlich rund 28 %); ungeprüft | 2025 | ungeprüft |
| steuer.sozialabgaben | 0.23 | HMRC, OECD Taxing Wages, NATO, ONS; Rentenniveau auf Verzeichnisgrenze 35 gesetzt (OECD-Ersatzquote gesetzlich rund 28 %); ungeprüft | 2025 | ungeprüft |
| steuer.mwst | 0.2 | HMRC, OECD Taxing Wages, NATO, ONS; Rentenniveau auf Verzeichnisgrenze 35 gesetzt (OECD-Ersatzquote gesetzlich rund 28 %); ungeprüft | 2025 | ungeprüft |
| steuer.unternehmen | 0.25 | HMRC, OECD Taxing Wages, NATO, ONS; Rentenniveau auf Verzeichnisgrenze 35 gesetzt (OECD-Ersatzquote gesetzlich rund 28 %); ungeprüft | 2025 | ungeprüft |
| steuer.kapitalertrag | 0.2 | HMRC, OECD Taxing Wages, NATO, ONS; Rentenniveau auf Verzeichnisgrenze 35 gesetzt (OECD-Ersatzquote gesetzlich rund 28 %); ungeprüft | 2025 | ungeprüft |
| steuer.vermoegen | 0 | HMRC, OECD Taxing Wages, NATO, ONS; Rentenniveau auf Verzeichnisgrenze 35 gesetzt (OECD-Ersatzquote gesetzlich rund 28 %); ungeprüft | 2025 | ungeprüft |
| steuer.erbschaft | 0.02 | HMRC, OECD Taxing Wages, NATO, ONS; Rentenniveau auf Verzeichnisgrenze 35 gesetzt (OECD-Ersatzquote gesetzlich rund 28 %); ungeprüft | 2025 | ungeprüft |
| rente.alter | 66 | HMRC, OECD Taxing Wages, NATO, ONS; Rentenniveau auf Verzeichnisgrenze 35 gesetzt (OECD-Ersatzquote gesetzlich rund 28 %); ungeprüft | 2025 | ungeprüft |
| rente.niveau | 35 | HMRC, OECD Taxing Wages, NATO, ONS; Rentenniveau auf Verzeichnisgrenze 35 gesetzt (OECD-Ersatzquote gesetzlich rund 28 %); ungeprüft | 2025 | ungeprüft |
| rente.beitragsAutomatik | 0 | HMRC, OECD Taxing Wages, NATO, ONS; Rentenniveau auf Verzeichnisgrenze 35 gesetzt (OECD-Ersatzquote gesetzlich rund 28 %); ungeprüft | 2025 | ungeprüft |
| sozial.lohnersatz | 0.3 | HMRC, OECD Taxing Wages, NATO, ONS; Rentenniveau auf Verzeichnisgrenze 35 gesetzt (OECD-Ersatzquote gesetzlich rund 28 %); ungeprüft | 2025 | ungeprüft |
| staat.gesundheit | 8 | HMRC, OECD Taxing Wages, NATO, ONS; Rentenniveau auf Verzeichnisgrenze 35 gesetzt (OECD-Ersatzquote gesetzlich rund 28 %); ungeprüft | 2025 | ungeprüft |
| staat.familie | 1.5 | HMRC, OECD Taxing Wages, NATO, ONS; Rentenniveau auf Verzeichnisgrenze 35 gesetzt (OECD-Ersatzquote gesetzlich rund 28 %); ungeprüft | 2025 | ungeprüft |
| staat.verteidigung | 2.3 | HMRC, OECD Taxing Wages, NATO, ONS; Rentenniveau auf Verzeichnisgrenze 35 gesetzt (OECD-Ersatzquote gesetzlich rund 28 %); ungeprüft | 2025 | ungeprüft |
| innov.fue | 2.8 | HMRC, OECD Taxing Wages, NATO, ONS; Rentenniveau auf Verzeichnisgrenze 35 gesetzt (OECD-Ersatzquote gesetzlich rund 28 %); ungeprüft | 2025 | ungeprüft |
| innov.bildung | 4.1 | HMRC, OECD Taxing Wages, NATO, ONS; Rentenniveau auf Verzeichnisgrenze 35 gesetzt (OECD-Ersatzquote gesetzlich rund 28 %); ungeprüft | 2025 | ungeprüft |
| mig.netto | 400 | HMRC, OECD Taxing Wages, NATO, ONS; Rentenniveau auf Verzeichnisgrenze 35 gesetzt (OECD-Ersatzquote gesetzlich rund 28 %); ungeprüft | 2025 | ungeprüft |
| demo.geburtenrate | 1.44 | HMRC, OECD Taxing Wages, NATO, ONS; Rentenniveau auf Verzeichnisgrenze 35 gesetzt (OECD-Ersatzquote gesetzlich rund 28 %); ungeprüft | 2025 | ungeprüft |
| energie.co2Preis | 50 | HMRC, OECD Taxing Wages, NATO, ONS; Rentenniveau auf Verzeichnisgrenze 35 gesetzt (OECD-Ersatzquote gesetzlich rund 28 %); ungeprüft | 2025 | ungeprüft |
| energie.kohleausstieg | 2025 | HMRC, OECD Taxing Wages, NATO, ONS; Rentenniveau auf Verzeichnisgrenze 35 gesetzt (OECD-Ersatzquote gesetzlich rund 28 %); ungeprüft | 2025 | ungeprüft |
| energie.atom | 1 | HMRC, OECD Taxing Wages, NATO, ONS; Rentenniveau auf Verzeichnisgrenze 35 gesetzt (OECD-Ersatzquote gesetzlich rund 28 %); ungeprüft | 2025 | ungeprüft |
| energie.ausbauTempo | 1.5 | HMRC, OECD Taxing Wages, NATO, ONS; Rentenniveau auf Verzeichnisgrenze 35 gesetzt (OECD-Ersatzquote gesetzlich rund 28 %); ungeprüft | 2025 | ungeprüft |
| energie.netzInvest | 0.5 | HMRC, OECD Taxing Wages, NATO, ONS; Rentenniveau auf Verzeichnisgrenze 35 gesetzt (OECD-Ersatzquote gesetzlich rund 28 %); ungeprüft | 2025 | ungeprüft |
| anleihen.laufzeit | 14 | HMRC, OECD Taxing Wages, NATO, ONS; Rentenniveau auf Verzeichnisgrenze 35 gesetzt (OECD-Ersatzquote gesetzlich rund 28 %); ungeprüft | 2025 | ungeprüft |
| anleihen.auslandsanteil | 0.3 | HMRC, OECD Taxing Wages, NATO, ONS; Rentenniveau auf Verzeichnisgrenze 35 gesetzt (OECD-Ersatzquote gesetzlich rund 28 %); ungeprüft | 2025 | ungeprüft |
| handel.zoelle | 1.5 | HMRC, OECD Taxing Wages, NATO, ONS; Rentenniveau auf Verzeichnisgrenze 35 gesetzt (OECD-Ersatzquote gesetzlich rund 28 %); ungeprüft | 2025 | ungeprüft |
| handel.kapitalOffenheit | 0.95 | HMRC, OECD Taxing Wages, NATO, ONS; Rentenniveau auf Verzeichnisgrenze 35 gesetzt (OECD-Ersatzquote gesetzlich rund 28 %); ungeprüft | 2025 | ungeprüft |
| handel.abhaengigkeit | 0.4 | HMRC, OECD Taxing Wages, NATO, ONS; Rentenniveau auf Verzeichnisgrenze 35 gesetzt (OECD-Ersatzquote gesetzlich rund 28 %); ungeprüft | 2025 | ungeprüft |
| kapitalkoeffizient | 3 | ONS, Bank of England (APF, Bank Rate), OBR, DESNZ Energy Trends, ONS Pink Book; ungeprüft | 2025 | ungeprüft |
| tfpTrend | 0.7 | ONS, Bank of England (APF, Bank Rate), OBR, DESNZ Energy Trends, ONS Pink Book; ungeprüft | 2025 | ungeprüft |
| lohnquote | 0.55 | ONS, Bank of England (APF, Bank Rate), OBR, DESNZ Energy Trends, ONS Pink Book; ungeprüft | 2025 | ungeprüft |
| nairu | 4.3 | ONS, Bank of England (APF, Bank Rate), OBR, DESNZ Energy Trends, ONS Pink Book; ungeprüft | 2025 | ungeprüft |
| erwerbsquote | 0.79 | ONS, Bank of England (APF, Bank Rate), OBR, DESNZ Energy Trends, ONS Pink Book; ungeprüft | 2025 | ungeprüft |
| produktivitaetsLuecke | 0.8 | ONS, Bank of England (APF, Bank Rate), OBR, DESNZ Energy Trends, ONS Pink Book; ungeprüft | 2025 | ungeprüft |
| leitzins | 4.1 | ONS, Bank of England (APF, Bank Rate), OBR, DESNZ Energy Trends, ONS Pink Book; ungeprüft | 2025 | ungeprüft |
| effZins | 3.5 | ONS, Bank of England (APF, Bank Rate), OBR, DESNZ Energy Trends, ONS Pink Book; ungeprüft | 2025 | ungeprüft |
| qe | 25 | ONS, Bank of England (APF, Bank Rate), OBR, DESNZ Energy Trends, ONS Pink Book; ungeprüft | 2025 | ungeprüft |
| rentenausgaben | 5 | ONS, Bank of England (APF, Bank Rate), OBR, DESNZ Energy Trends, ONS Pink Book; ungeprüft | 2025 | ungeprüft |
| alg | 0.5 | ONS, Bank of England (APF, Bank Rate), OBR, DESNZ Energy Trends, ONS Pink Book; ungeprüft | 2025 | ungeprüft |
| steuerBasen | {"einkommen":56,"sozialabgaben":28,"mwst":32,"unternehmen":13,"kapitalertrag":3,"vermoegen":300,"erbschaft":10} | ONS, Bank of England (APF, Bank Rate), OBR, DESNZ Energy Trends, ONS Pink Book; ungeprüft | 2025 | ungeprüft |
| mix | {"kohle":0.01,"gas":0.31,"oel":0.01,"atom":0.14,"ern":0.53} | ONS, Bank of England (APF, Bank Rate), OBR, DESNZ Energy Trends, ONS Pink Book; ungeprüft | 2025 | ungeprüft |
| industrieTWh | 90 | ONS, Bank of England (APF, Bank Rate), OBR, DESNZ Energy Trends, ONS Pink Book; ungeprüft | 2025 | ungeprüft |
| netzkosten | 30 | ONS, Bank of England (APF, Bank Rate), OBR, DESNZ Energy Trends, ONS Pink Book; ungeprüft | 2025 | ungeprüft |
| energieExportAnteil | 0.05 | ONS, Bank of England (APF, Bank Rate), OBR, DESNZ Energy Trends, ONS Pink Book; ungeprüft | 2025 | ungeprüft |
| nfa | -25 | ONS, Bank of England (APF, Bank Rate), OBR, DESNZ Energy Trends, ONS Pink Book; ungeprüft | 2025 | ungeprüft |
| vcBasis | 0.35 | ONS, Bank of England (APF, Bank Rate), OBR, DESNZ Energy Trends, ONS Pink Book; ungeprüft | 2025 | ungeprüft |
| eurogewicht | 0 | ONS, Bank of England (APF, Bank Rate), OBR, DESNZ Energy Trends, ONS Pink Book; ungeprüft | 2025 | ungeprüft |
| fluchtReaktion | -0.3 | ONS, Bank of England (APF, Bank Rate), OBR, DESNZ Energy Trends, ONS Pink Book; ungeprüft | 2025 | ungeprüft |
| reserve | 0 | ONS, Bank of England (APF, Bank Rate), OBR, DESNZ Energy Trends, ONS Pink Book; ungeprüft | 2025 | ungeprüft |
| armut | 17 | ONS, Bank of England (APF, Bank Rate), OBR, DESNZ Energy Trends, ONS Pink Book; ungeprüft | 2025 | ungeprüft |
| rendite (Ersatz) | 4.5 | ONS, Bank of England (APF, Bank Rate), OBR, DESNZ Energy Trends, ONS Pink Book; ungeprüft | 2025 | ungeprüft |
| gini (Ersatz) | 32.4 | ONS, Bank of England (APF, Bank Rate), OBR, DESNZ Energy Trends, ONS Pink Book; ungeprüft | 2025 | ungeprüft |
| privatschuld (Ersatz) | 150 | ONS, Bank of England (APF, Bank Rate), OBR, DESNZ Energy Trends, ONS Pink Book; ungeprüft | 2025 | ungeprüft |
| einnahmen (Ersatz) | 40.5 | ONS, Bank of England (APF, Bank Rate), OBR, DESNZ Energy Trends, ONS Pink Book; ungeprüft | 2025 | ungeprüft |
| ausgaben (Ersatz) | 45.3 | ONS, Bank of England (APF, Bank Rate), OBR, DESNZ Energy Trends, ONS Pink Book; ungeprüft | 2025 | ungeprüft |
| importquote (Ersatz) | 0.4 | ONS, Bank of England (APF, Bank Rate), OBR, DESNZ Energy Trends, ONS Pink Book; ungeprüft | 2025 | ungeprüft |
| co2Mt (Ersatz) | 310 | ONS, Bank of England (APF, Bank Rate), OBR, DESNZ Energy Trends, ONS Pink Book; ungeprüft | 2025 | ungeprüft |

## Frankreich — Handwerte

Währung: €, Kurs 1 je Euro (Euro).

| Feld | Wert | Quelle | Stand | Anmerkung |
|---|---|---|---|---|
| steuer.einkommen | 0.14 | DGFiP, OECD Taxing Wages, COR (Rentenniveau), NATO, INSEE; ungeprüft | 2025 | ungeprüft |
| steuer.sozialabgaben | 0.45 | DGFiP, OECD Taxing Wages, COR (Rentenniveau), NATO, INSEE; ungeprüft | 2025 | ungeprüft |
| steuer.mwst | 0.2 | DGFiP, OECD Taxing Wages, COR (Rentenniveau), NATO, INSEE; ungeprüft | 2025 | ungeprüft |
| steuer.unternehmen | 0.25 | DGFiP, OECD Taxing Wages, COR (Rentenniveau), NATO, INSEE; ungeprüft | 2025 | ungeprüft |
| steuer.kapitalertrag | 0.3 | DGFiP, OECD Taxing Wages, COR (Rentenniveau), NATO, INSEE; ungeprüft | 2025 | ungeprüft |
| steuer.vermoegen | 0.003 | DGFiP, OECD Taxing Wages, COR (Rentenniveau), NATO, INSEE; ungeprüft | 2025 | ungeprüft |
| steuer.erbschaft | 0.04 | DGFiP, OECD Taxing Wages, COR (Rentenniveau), NATO, INSEE; ungeprüft | 2025 | ungeprüft |
| rente.alter | 64 | DGFiP, OECD Taxing Wages, COR (Rentenniveau), NATO, INSEE; ungeprüft | 2025 | ungeprüft |
| rente.niveau | 60 | DGFiP, OECD Taxing Wages, COR (Rentenniveau), NATO, INSEE; ungeprüft | 2025 | ungeprüft |
| rente.beitragsAutomatik | 0 | DGFiP, OECD Taxing Wages, COR (Rentenniveau), NATO, INSEE; ungeprüft | 2025 | ungeprüft |
| sozial.lohnersatz | 0.65 | DGFiP, OECD Taxing Wages, COR (Rentenniveau), NATO, INSEE; ungeprüft | 2025 | ungeprüft |
| staat.gesundheit | 9 | DGFiP, OECD Taxing Wages, COR (Rentenniveau), NATO, INSEE; ungeprüft | 2025 | ungeprüft |
| staat.familie | 2.5 | DGFiP, OECD Taxing Wages, COR (Rentenniveau), NATO, INSEE; ungeprüft | 2025 | ungeprüft |
| staat.verteidigung | 2.1 | DGFiP, OECD Taxing Wages, COR (Rentenniveau), NATO, INSEE; ungeprüft | 2025 | ungeprüft |
| innov.fue | 2.2 | DGFiP, OECD Taxing Wages, COR (Rentenniveau), NATO, INSEE; ungeprüft | 2025 | ungeprüft |
| innov.bildung | 5.2 | DGFiP, OECD Taxing Wages, COR (Rentenniveau), NATO, INSEE; ungeprüft | 2025 | ungeprüft |
| mig.netto | 150 | DGFiP, OECD Taxing Wages, COR (Rentenniveau), NATO, INSEE; ungeprüft | 2025 | ungeprüft |
| demo.geburtenrate | 1.62 | DGFiP, OECD Taxing Wages, COR (Rentenniveau), NATO, INSEE; ungeprüft | 2025 | ungeprüft |
| energie.co2Preis | 70 | DGFiP, OECD Taxing Wages, COR (Rentenniveau), NATO, INSEE; ungeprüft | 2025 | ungeprüft |
| energie.kohleausstieg | 2027 | DGFiP, OECD Taxing Wages, COR (Rentenniveau), NATO, INSEE; ungeprüft | 2025 | ungeprüft |
| energie.atom | 1 | DGFiP, OECD Taxing Wages, COR (Rentenniveau), NATO, INSEE; ungeprüft | 2025 | ungeprüft |
| energie.ausbauTempo | 1.5 | DGFiP, OECD Taxing Wages, COR (Rentenniveau), NATO, INSEE; ungeprüft | 2025 | ungeprüft |
| energie.netzInvest | 0.5 | DGFiP, OECD Taxing Wages, COR (Rentenniveau), NATO, INSEE; ungeprüft | 2025 | ungeprüft |
| anleihen.laufzeit | 8.5 | DGFiP, OECD Taxing Wages, COR (Rentenniveau), NATO, INSEE; ungeprüft | 2025 | ungeprüft |
| anleihen.auslandsanteil | 0.53 | DGFiP, OECD Taxing Wages, COR (Rentenniveau), NATO, INSEE; ungeprüft | 2025 | ungeprüft |
| handel.zoelle | 1.5 | DGFiP, OECD Taxing Wages, COR (Rentenniveau), NATO, INSEE; ungeprüft | 2025 | ungeprüft |
| handel.kapitalOffenheit | 0.8 | DGFiP, OECD Taxing Wages, COR (Rentenniveau), NATO, INSEE; ungeprüft | 2025 | ungeprüft |
| handel.abhaengigkeit | 0.45 | DGFiP, OECD Taxing Wages, COR (Rentenniveau), NATO, INSEE; ungeprüft | 2025 | ungeprüft |
| kapitalkoeffizient | 3.2 | INSEE, Banque de France, Agence France Trésor, RTE Bilan électrique, Eurostat; ungeprüft | 2025 | ungeprüft |
| tfpTrend | 0.5 | INSEE, Banque de France, Agence France Trésor, RTE Bilan électrique, Eurostat; ungeprüft | 2025 | ungeprüft |
| lohnquote | 0.58 | INSEE, Banque de France, Agence France Trésor, RTE Bilan électrique, Eurostat; ungeprüft | 2025 | ungeprüft |
| nairu | 7 | INSEE, Banque de France, Agence France Trésor, RTE Bilan électrique, Eurostat; ungeprüft | 2025 | ungeprüft |
| erwerbsquote | 0.74 | INSEE, Banque de France, Agence France Trésor, RTE Bilan électrique, Eurostat; ungeprüft | 2025 | ungeprüft |
| produktivitaetsLuecke | 0.9 | INSEE, Banque de France, Agence France Trésor, RTE Bilan électrique, Eurostat; ungeprüft | 2025 | ungeprüft |
| leitzins | 2 | INSEE, Banque de France, Agence France Trésor, RTE Bilan électrique, Eurostat; ungeprüft | 2025 | ungeprüft |
| effZins | 1.9 | INSEE, Banque de France, Agence France Trésor, RTE Bilan électrique, Eurostat; ungeprüft | 2025 | ungeprüft |
| qe | 25 | INSEE, Banque de France, Agence France Trésor, RTE Bilan électrique, Eurostat; ungeprüft | 2025 | ungeprüft |
| rentenausgaben | 13.8 | INSEE, Banque de France, Agence France Trésor, RTE Bilan électrique, Eurostat; ungeprüft | 2025 | ungeprüft |
| alg | 1.6 | INSEE, Banque de France, Agence France Trésor, RTE Bilan électrique, Eurostat; ungeprüft | 2025 | ungeprüft |
| steuerBasen | {"einkommen":55,"sozialabgaben":36,"mwst":35,"unternehmen":10,"kapitalertrag":4,"vermoegen":300,"erbschaft":10} | INSEE, Banque de France, Agence France Trésor, RTE Bilan électrique, Eurostat; ungeprüft | 2025 | ungeprüft |
| mix | {"kohle":0,"gas":0.04,"oel":0.01,"atom":0.67,"ern":0.28} | INSEE, Banque de France, Agence France Trésor, RTE Bilan électrique, Eurostat; ungeprüft | 2025 | ungeprüft |
| industrieTWh | 110 | INSEE, Banque de France, Agence France Trésor, RTE Bilan électrique, Eurostat; ungeprüft | 2025 | ungeprüft |
| netzkosten | 25 | INSEE, Banque de France, Agence France Trésor, RTE Bilan électrique, Eurostat; ungeprüft | 2025 | ungeprüft |
| energieExportAnteil | 0.1 | INSEE, Banque de France, Agence France Trésor, RTE Bilan électrique, Eurostat; ungeprüft | 2025 | ungeprüft |
| nfa | -30 | INSEE, Banque de France, Agence France Trésor, RTE Bilan électrique, Eurostat; ungeprüft | 2025 | ungeprüft |
| vcBasis | 0.12 | INSEE, Banque de France, Agence France Trésor, RTE Bilan électrique, Eurostat; ungeprüft | 2025 | ungeprüft |
| eurogewicht | 0.2 | INSEE, Banque de France, Agence France Trésor, RTE Bilan électrique, Eurostat; ungeprüft | 2025 | ungeprüft |
| fluchtReaktion | -0.1 | INSEE, Banque de France, Agence France Trésor, RTE Bilan électrique, Eurostat; ungeprüft | 2025 | ungeprüft |
| reserve | 0 | INSEE, Banque de France, Agence France Trésor, RTE Bilan électrique, Eurostat; ungeprüft | 2025 | ungeprüft |
| armut | 15.4 | INSEE, Banque de France, Agence France Trésor, RTE Bilan électrique, Eurostat; ungeprüft | 2025 | ungeprüft |
| rendite (Ersatz) | 3.2 | INSEE, Banque de France, Agence France Trésor, RTE Bilan électrique, Eurostat; ungeprüft | 2025 | ungeprüft |
| gini (Ersatz) | 31.5 | INSEE, Banque de France, Agence France Trésor, RTE Bilan électrique, Eurostat; ungeprüft | 2025 | ungeprüft |
| privatschuld (Ersatz) | 145 | INSEE, Banque de France, Agence France Trésor, RTE Bilan électrique, Eurostat; ungeprüft | 2025 | ungeprüft |
| einnahmen (Ersatz) | 51.3 | INSEE, Banque de France, Agence France Trésor, RTE Bilan électrique, Eurostat; ungeprüft | 2025 | ungeprüft |
| ausgaben (Ersatz) | 57.1 | INSEE, Banque de France, Agence France Trésor, RTE Bilan électrique, Eurostat; ungeprüft | 2025 | ungeprüft |
| importquote (Ersatz) | 0.45 | INSEE, Banque de France, Agence France Trésor, RTE Bilan électrique, Eurostat; ungeprüft | 2025 | ungeprüft |
| co2Mt (Ersatz) | 290 | INSEE, Banque de France, Agence France Trésor, RTE Bilan électrique, Eurostat; ungeprüft | 2025 | ungeprüft |
| fondsQuote0 | 3.5 | Fonds de réserve pour les retraites (rund 20 Mrd. €) und Reserven AGIRC-ARRCO (rund 80 Mrd. €), BIP rund 2,9 Bio. €; ungeprüft | 2025 | ungeprüft |


## Italien — Handwerte

Währung: €, Kurs 1 je Euro (Euro).

| Feld | Wert | Quelle | Stand | Anmerkung |
|---|---|---|---|---|
| steuer.einkommen | 0.2 | MEF, OECD Taxing Wages, INPS/Ragioneria (Rentenniveau auf Verzeichnisgrenze 70 gesetzt, OECD-Ersatzquote rund 76 %), NATO, ISTAT; ungeprüft | 2025 | ungeprüft |
| steuer.sozialabgaben | 0.4 | MEF, OECD Taxing Wages, INPS/Ragioneria (Rentenniveau auf Verzeichnisgrenze 70 gesetzt, OECD-Ersatzquote rund 76 %), NATO, ISTAT; ungeprüft | 2025 | ungeprüft |
| steuer.mwst | 0.22 | MEF, OECD Taxing Wages, INPS/Ragioneria (Rentenniveau auf Verzeichnisgrenze 70 gesetzt, OECD-Ersatzquote rund 76 %), NATO, ISTAT; ungeprüft | 2025 | ungeprüft |
| steuer.unternehmen | 0.24 | MEF, OECD Taxing Wages, INPS/Ragioneria (Rentenniveau auf Verzeichnisgrenze 70 gesetzt, OECD-Ersatzquote rund 76 %), NATO, ISTAT; ungeprüft | 2025 | ungeprüft |
| steuer.kapitalertrag | 0.26 | MEF, OECD Taxing Wages, INPS/Ragioneria (Rentenniveau auf Verzeichnisgrenze 70 gesetzt, OECD-Ersatzquote rund 76 %), NATO, ISTAT; ungeprüft | 2025 | ungeprüft |
| steuer.vermoegen | 0.002 | MEF, OECD Taxing Wages, INPS/Ragioneria (Rentenniveau auf Verzeichnisgrenze 70 gesetzt, OECD-Ersatzquote rund 76 %), NATO, ISTAT; ungeprüft | 2025 | ungeprüft |
| steuer.erbschaft | 0.01 | MEF, OECD Taxing Wages, INPS/Ragioneria (Rentenniveau auf Verzeichnisgrenze 70 gesetzt, OECD-Ersatzquote rund 76 %), NATO, ISTAT; ungeprüft | 2025 | ungeprüft |
| rente.alter | 67 | MEF, OECD Taxing Wages, INPS/Ragioneria (Rentenniveau auf Verzeichnisgrenze 70 gesetzt, OECD-Ersatzquote rund 76 %), NATO, ISTAT; ungeprüft | 2025 | ungeprüft |
| rente.niveau | 70 | MEF, OECD Taxing Wages, INPS/Ragioneria (Rentenniveau auf Verzeichnisgrenze 70 gesetzt, OECD-Ersatzquote rund 76 %), NATO, ISTAT; ungeprüft | 2025 | ungeprüft |
| rente.beitragsAutomatik | 0 | MEF, OECD Taxing Wages, INPS/Ragioneria (Rentenniveau auf Verzeichnisgrenze 70 gesetzt, OECD-Ersatzquote rund 76 %), NATO, ISTAT; ungeprüft | 2025 | ungeprüft |
| sozial.lohnersatz | 0.6 | MEF, OECD Taxing Wages, INPS/Ragioneria (Rentenniveau auf Verzeichnisgrenze 70 gesetzt, OECD-Ersatzquote rund 76 %), NATO, ISTAT; ungeprüft | 2025 | ungeprüft |
| staat.gesundheit | 6.3 | MEF, OECD Taxing Wages, INPS/Ragioneria (Rentenniveau auf Verzeichnisgrenze 70 gesetzt, OECD-Ersatzquote rund 76 %), NATO, ISTAT; ungeprüft | 2025 | ungeprüft |
| staat.familie | 1.3 | MEF, OECD Taxing Wages, INPS/Ragioneria (Rentenniveau auf Verzeichnisgrenze 70 gesetzt, OECD-Ersatzquote rund 76 %), NATO, ISTAT; ungeprüft | 2025 | ungeprüft |
| staat.verteidigung | 1.5 | MEF, OECD Taxing Wages, INPS/Ragioneria (Rentenniveau auf Verzeichnisgrenze 70 gesetzt, OECD-Ersatzquote rund 76 %), NATO, ISTAT; ungeprüft | 2025 | ungeprüft |
| innov.fue | 1.3 | MEF, OECD Taxing Wages, INPS/Ragioneria (Rentenniveau auf Verzeichnisgrenze 70 gesetzt, OECD-Ersatzquote rund 76 %), NATO, ISTAT; ungeprüft | 2025 | ungeprüft |
| innov.bildung | 3.9 | MEF, OECD Taxing Wages, INPS/Ragioneria (Rentenniveau auf Verzeichnisgrenze 70 gesetzt, OECD-Ersatzquote rund 76 %), NATO, ISTAT; ungeprüft | 2025 | ungeprüft |
| mig.netto | 250 | MEF, OECD Taxing Wages, INPS/Ragioneria (Rentenniveau auf Verzeichnisgrenze 70 gesetzt, OECD-Ersatzquote rund 76 %), NATO, ISTAT; ungeprüft | 2025 | ungeprüft |
| demo.geburtenrate | 1.18 | MEF, OECD Taxing Wages, INPS/Ragioneria (Rentenniveau auf Verzeichnisgrenze 70 gesetzt, OECD-Ersatzquote rund 76 %), NATO, ISTAT; ungeprüft | 2025 | ungeprüft |
| energie.co2Preis | 70 | MEF, OECD Taxing Wages, INPS/Ragioneria (Rentenniveau auf Verzeichnisgrenze 70 gesetzt, OECD-Ersatzquote rund 76 %), NATO, ISTAT; ungeprüft | 2025 | ungeprüft |
| energie.kohleausstieg | 2028 | MEF, OECD Taxing Wages, INPS/Ragioneria (Rentenniveau auf Verzeichnisgrenze 70 gesetzt, OECD-Ersatzquote rund 76 %), NATO, ISTAT; ungeprüft | 2025 | ungeprüft |
| energie.atom | 0 | MEF, OECD Taxing Wages, INPS/Ragioneria (Rentenniveau auf Verzeichnisgrenze 70 gesetzt, OECD-Ersatzquote rund 76 %), NATO, ISTAT; ungeprüft | 2025 | ungeprüft |
| energie.ausbauTempo | 1.5 | MEF, OECD Taxing Wages, INPS/Ragioneria (Rentenniveau auf Verzeichnisgrenze 70 gesetzt, OECD-Ersatzquote rund 76 %), NATO, ISTAT; ungeprüft | 2025 | ungeprüft |
| energie.netzInvest | 0.4 | MEF, OECD Taxing Wages, INPS/Ragioneria (Rentenniveau auf Verzeichnisgrenze 70 gesetzt, OECD-Ersatzquote rund 76 %), NATO, ISTAT; ungeprüft | 2025 | ungeprüft |
| anleihen.laufzeit | 7 | MEF, OECD Taxing Wages, INPS/Ragioneria (Rentenniveau auf Verzeichnisgrenze 70 gesetzt, OECD-Ersatzquote rund 76 %), NATO, ISTAT; ungeprüft | 2025 | ungeprüft |
| anleihen.auslandsanteil | 0.28 | MEF, OECD Taxing Wages, INPS/Ragioneria (Rentenniveau auf Verzeichnisgrenze 70 gesetzt, OECD-Ersatzquote rund 76 %), NATO, ISTAT; ungeprüft | 2025 | ungeprüft |
| handel.zoelle | 1.5 | MEF, OECD Taxing Wages, INPS/Ragioneria (Rentenniveau auf Verzeichnisgrenze 70 gesetzt, OECD-Ersatzquote rund 76 %), NATO, ISTAT; ungeprüft | 2025 | ungeprüft |
| handel.kapitalOffenheit | 0.8 | MEF, OECD Taxing Wages, INPS/Ragioneria (Rentenniveau auf Verzeichnisgrenze 70 gesetzt, OECD-Ersatzquote rund 76 %), NATO, ISTAT; ungeprüft | 2025 | ungeprüft |
| handel.abhaengigkeit | 0.5 | MEF, OECD Taxing Wages, INPS/Ragioneria (Rentenniveau auf Verzeichnisgrenze 70 gesetzt, OECD-Ersatzquote rund 76 %), NATO, ISTAT; ungeprüft | 2025 | ungeprüft |
| kapitalkoeffizient | 3.4 | ISTAT, Banca d'Italia, MEF Debito pubblico, Terna, Eurostat; Fluchtreaktion positiv: Aufschläge stiegen 2011 und 2020; ungeprüft | 2025 | ungeprüft |
| tfpTrend | 0.2 | ISTAT, Banca d'Italia, MEF Debito pubblico, Terna, Eurostat; Fluchtreaktion positiv: Aufschläge stiegen 2011 und 2020; ungeprüft | 2025 | ungeprüft |
| lohnquote | 0.52 | ISTAT, Banca d'Italia, MEF Debito pubblico, Terna, Eurostat; Fluchtreaktion positiv: Aufschläge stiegen 2011 und 2020; ungeprüft | 2025 | ungeprüft |
| nairu | 6.8 | ISTAT, Banca d'Italia, MEF Debito pubblico, Terna, Eurostat; Fluchtreaktion positiv: Aufschläge stiegen 2011 und 2020; ungeprüft | 2025 | ungeprüft |
| erwerbsquote | 0.66 | ISTAT, Banca d'Italia, MEF Debito pubblico, Terna, Eurostat; Fluchtreaktion positiv: Aufschläge stiegen 2011 und 2020; ungeprüft | 2025 | ungeprüft |
| produktivitaetsLuecke | 0.8 | ISTAT, Banca d'Italia, MEF Debito pubblico, Terna, Eurostat; Fluchtreaktion positiv: Aufschläge stiegen 2011 und 2020; ungeprüft | 2025 | ungeprüft |
| leitzins | 2 | ISTAT, Banca d'Italia, MEF Debito pubblico, Terna, Eurostat; Fluchtreaktion positiv: Aufschläge stiegen 2011 und 2020; ungeprüft | 2025 | ungeprüft |
| effZins | 2.9 | ISTAT, Banca d'Italia, MEF Debito pubblico, Terna, Eurostat; Fluchtreaktion positiv: Aufschläge stiegen 2011 und 2020; ungeprüft | 2025 | ungeprüft |
| qe | 30 | ISTAT, Banca d'Italia, MEF Debito pubblico, Terna, Eurostat; Fluchtreaktion positiv: Aufschläge stiegen 2011 und 2020; ungeprüft | 2025 | ungeprüft |
| rentenausgaben | 15.5 | ISTAT, Banca d'Italia, MEF Debito pubblico, Terna, Eurostat; Fluchtreaktion positiv: Aufschläge stiegen 2011 und 2020; ungeprüft | 2025 | ungeprüft |
| alg | 0.9 | ISTAT, Banca d'Italia, MEF Debito pubblico, Terna, Eurostat; Fluchtreaktion positiv: Aufschläge stiegen 2011 und 2020; ungeprüft | 2025 | ungeprüft |
| steuerBasen | {"einkommen":55,"sozialabgaben":33,"mwst":30,"unternehmen":10,"kapitalertrag":4,"vermoegen":300,"erbschaft":10} | ISTAT, Banca d'Italia, MEF Debito pubblico, Terna, Eurostat; Fluchtreaktion positiv: Aufschläge stiegen 2011 und 2020; ungeprüft | 2025 | ungeprüft |
| mix | {"kohle":0.02,"gas":0.47,"oel":0.03,"atom":0,"ern":0.48} | ISTAT, Banca d'Italia, MEF Debito pubblico, Terna, Eurostat; Fluchtreaktion positiv: Aufschläge stiegen 2011 und 2020; ungeprüft | 2025 | ungeprüft |
| industrieTWh | 120 | ISTAT, Banca d'Italia, MEF Debito pubblico, Terna, Eurostat; Fluchtreaktion positiv: Aufschläge stiegen 2011 und 2020; ungeprüft | 2025 | ungeprüft |
| netzkosten | 30 | ISTAT, Banca d'Italia, MEF Debito pubblico, Terna, Eurostat; Fluchtreaktion positiv: Aufschläge stiegen 2011 und 2020; ungeprüft | 2025 | ungeprüft |
| energieExportAnteil | 0.1 | ISTAT, Banca d'Italia, MEF Debito pubblico, Terna, Eurostat; Fluchtreaktion positiv: Aufschläge stiegen 2011 und 2020; ungeprüft | 2025 | ungeprüft |
| nfa | 15 | ISTAT, Banca d'Italia, MEF Debito pubblico, Terna, Eurostat; Fluchtreaktion positiv: Aufschläge stiegen 2011 und 2020; ungeprüft | 2025 | ungeprüft |
| vcBasis | 0.04 | ISTAT, Banca d'Italia, MEF Debito pubblico, Terna, Eurostat; Fluchtreaktion positiv: Aufschläge stiegen 2011 und 2020; ungeprüft | 2025 | ungeprüft |
| eurogewicht | 0.15 | ISTAT, Banca d'Italia, MEF Debito pubblico, Terna, Eurostat; Fluchtreaktion positiv: Aufschläge stiegen 2011 und 2020; ungeprüft | 2025 | ungeprüft |
| fluchtReaktion | 0.5 | ISTAT, Banca d'Italia, MEF Debito pubblico, Terna, Eurostat; Fluchtreaktion positiv: Aufschläge stiegen 2011 und 2020; ungeprüft | 2025 | ungeprüft |
| reserve | 0 | ISTAT, Banca d'Italia, MEF Debito pubblico, Terna, Eurostat; Fluchtreaktion positiv: Aufschläge stiegen 2011 und 2020; ungeprüft | 2025 | ungeprüft |
| armut | 18.9 | ISTAT, Banca d'Italia, MEF Debito pubblico, Terna, Eurostat; Fluchtreaktion positiv: Aufschläge stiegen 2011 und 2020; ungeprüft | 2025 | ungeprüft |
| rendite (Ersatz) | 3.6 | ISTAT, Banca d'Italia, MEF Debito pubblico, Terna, Eurostat; Fluchtreaktion positiv: Aufschläge stiegen 2011 und 2020; ungeprüft | 2025 | ungeprüft |
| gini (Ersatz) | 33 | ISTAT, Banca d'Italia, MEF Debito pubblico, Terna, Eurostat; Fluchtreaktion positiv: Aufschläge stiegen 2011 und 2020; ungeprüft | 2025 | ungeprüft |
| privatschuld (Ersatz) | 110 | ISTAT, Banca d'Italia, MEF Debito pubblico, Terna, Eurostat; Fluchtreaktion positiv: Aufschläge stiegen 2011 und 2020; ungeprüft | 2025 | ungeprüft |
| einnahmen (Ersatz) | 47 | ISTAT, Banca d'Italia, MEF Debito pubblico, Terna, Eurostat; Fluchtreaktion positiv: Aufschläge stiegen 2011 und 2020; ungeprüft | 2025 | ungeprüft |
| ausgaben (Ersatz) | 50.4 | ISTAT, Banca d'Italia, MEF Debito pubblico, Terna, Eurostat; Fluchtreaktion positiv: Aufschläge stiegen 2011 und 2020; ungeprüft | 2025 | ungeprüft |
| importquote (Ersatz) | 0.75 | ISTAT, Banca d'Italia, MEF Debito pubblico, Terna, Eurostat; Fluchtreaktion positiv: Aufschläge stiegen 2011 und 2020; ungeprüft | 2025 | ungeprüft |
| co2Mt (Ersatz) | 300 | ISTAT, Banca d'Italia, MEF Debito pubblico, Terna, Eurostat; Fluchtreaktion positiv: Aufschläge stiegen 2011 und 2020; ungeprüft | 2025 | ungeprüft |
| erwerbsquoteTrend | 0.003 | ISTAT Erwerbsquote 15–64, 2014–2024 rund +0,27 Pp. pro Jahr | 2025 | ungeprüft |
| erwerbsquoteTrendJahre | 12 | wie Deutschland | 2025 | ungeprüft |


## Kanada — Handwerte

Währung: C$, Kurs 1.5 je Euro (EZB-Referenzkurs 2025, gerundet).

| Feld | Wert | Quelle | Stand | Anmerkung |
|---|---|---|---|---|
| steuer.einkommen | 0.2 | CRA, OECD Taxing Wages, ESDC (OAS/CPP), NATO, IRCC Levels Plan 2025–2027; CO₂-Preis nur Industrie (OBPS) nach Wegfall der Verbraucherabgabe 2025, anteilig; ungeprüft | 2025 | ungeprüft |
| steuer.sozialabgaben | 0.2 | CRA, OECD Taxing Wages, ESDC (OAS/CPP), NATO, IRCC Levels Plan 2025–2027; CO₂-Preis nur Industrie (OBPS) nach Wegfall der Verbraucherabgabe 2025, anteilig; ungeprüft | 2025 | ungeprüft |
| steuer.mwst | 0.12 | CRA, OECD Taxing Wages, ESDC (OAS/CPP), NATO, IRCC Levels Plan 2025–2027; CO₂-Preis nur Industrie (OBPS) nach Wegfall der Verbraucherabgabe 2025, anteilig; ungeprüft | 2025 | ungeprüft |
| steuer.unternehmen | 0.26 | CRA, OECD Taxing Wages, ESDC (OAS/CPP), NATO, IRCC Levels Plan 2025–2027; CO₂-Preis nur Industrie (OBPS) nach Wegfall der Verbraucherabgabe 2025, anteilig; ungeprüft | 2025 | ungeprüft |
| steuer.kapitalertrag | 0.13 | CRA, OECD Taxing Wages, ESDC (OAS/CPP), NATO, IRCC Levels Plan 2025–2027; CO₂-Preis nur Industrie (OBPS) nach Wegfall der Verbraucherabgabe 2025, anteilig; ungeprüft | 2025 | ungeprüft |
| steuer.vermoegen | 0 | CRA, OECD Taxing Wages, ESDC (OAS/CPP), NATO, IRCC Levels Plan 2025–2027; CO₂-Preis nur Industrie (OBPS) nach Wegfall der Verbraucherabgabe 2025, anteilig; ungeprüft | 2025 | ungeprüft |
| steuer.erbschaft | 0.01 | CRA, OECD Taxing Wages, ESDC (OAS/CPP), NATO, IRCC Levels Plan 2025–2027; CO₂-Preis nur Industrie (OBPS) nach Wegfall der Verbraucherabgabe 2025, anteilig; ungeprüft | 2025 | ungeprüft |
| rente.alter | 65 | CRA, OECD Taxing Wages, ESDC (OAS/CPP), NATO, IRCC Levels Plan 2025–2027; CO₂-Preis nur Industrie (OBPS) nach Wegfall der Verbraucherabgabe 2025, anteilig; ungeprüft | 2025 | ungeprüft |
| rente.niveau | 40 | CRA, OECD Taxing Wages, ESDC (OAS/CPP), NATO, IRCC Levels Plan 2025–2027; CO₂-Preis nur Industrie (OBPS) nach Wegfall der Verbraucherabgabe 2025, anteilig; ungeprüft | 2025 | ungeprüft |
| rente.beitragsAutomatik | 0 | CRA, OECD Taxing Wages, ESDC (OAS/CPP), NATO, IRCC Levels Plan 2025–2027; CO₂-Preis nur Industrie (OBPS) nach Wegfall der Verbraucherabgabe 2025, anteilig; ungeprüft | 2025 | ungeprüft |
| sozial.lohnersatz | 0.55 | CRA, OECD Taxing Wages, ESDC (OAS/CPP), NATO, IRCC Levels Plan 2025–2027; CO₂-Preis nur Industrie (OBPS) nach Wegfall der Verbraucherabgabe 2025, anteilig; ungeprüft | 2025 | ungeprüft |
| staat.gesundheit | 8.3 | CRA, OECD Taxing Wages, ESDC (OAS/CPP), NATO, IRCC Levels Plan 2025–2027; CO₂-Preis nur Industrie (OBPS) nach Wegfall der Verbraucherabgabe 2025, anteilig; ungeprüft | 2025 | ungeprüft |
| staat.familie | 1.5 | CRA, OECD Taxing Wages, ESDC (OAS/CPP), NATO, IRCC Levels Plan 2025–2027; CO₂-Preis nur Industrie (OBPS) nach Wegfall der Verbraucherabgabe 2025, anteilig; ungeprüft | 2025 | ungeprüft |
| staat.verteidigung | 2 | CRA, OECD Taxing Wages, ESDC (OAS/CPP), NATO, IRCC Levels Plan 2025–2027; CO₂-Preis nur Industrie (OBPS) nach Wegfall der Verbraucherabgabe 2025, anteilig; ungeprüft | 2025 | ungeprüft |
| innov.fue | 1.7 | CRA, OECD Taxing Wages, ESDC (OAS/CPP), NATO, IRCC Levels Plan 2025–2027; CO₂-Preis nur Industrie (OBPS) nach Wegfall der Verbraucherabgabe 2025, anteilig; ungeprüft | 2025 | ungeprüft |
| innov.bildung | 5.4 | CRA, OECD Taxing Wages, ESDC (OAS/CPP), NATO, IRCC Levels Plan 2025–2027; CO₂-Preis nur Industrie (OBPS) nach Wegfall der Verbraucherabgabe 2025, anteilig; ungeprüft | 2025 | ungeprüft |
| mig.netto | 350 | CRA, OECD Taxing Wages, ESDC (OAS/CPP), NATO, IRCC Levels Plan 2025–2027; CO₂-Preis nur Industrie (OBPS) nach Wegfall der Verbraucherabgabe 2025, anteilig; ungeprüft | 2025 | ungeprüft |
| demo.geburtenrate | 1.26 | CRA, OECD Taxing Wages, ESDC (OAS/CPP), NATO, IRCC Levels Plan 2025–2027; CO₂-Preis nur Industrie (OBPS) nach Wegfall der Verbraucherabgabe 2025, anteilig; ungeprüft | 2025 | ungeprüft |
| energie.co2Preis | 40 | CRA, OECD Taxing Wages, ESDC (OAS/CPP), NATO, IRCC Levels Plan 2025–2027; CO₂-Preis nur Industrie (OBPS) nach Wegfall der Verbraucherabgabe 2025, anteilig; ungeprüft | 2025 | ungeprüft |
| energie.kohleausstieg | 2030 | CRA, OECD Taxing Wages, ESDC (OAS/CPP), NATO, IRCC Levels Plan 2025–2027; CO₂-Preis nur Industrie (OBPS) nach Wegfall der Verbraucherabgabe 2025, anteilig; ungeprüft | 2025 | ungeprüft |
| energie.atom | 1 | CRA, OECD Taxing Wages, ESDC (OAS/CPP), NATO, IRCC Levels Plan 2025–2027; CO₂-Preis nur Industrie (OBPS) nach Wegfall der Verbraucherabgabe 2025, anteilig; ungeprüft | 2025 | ungeprüft |
| energie.ausbauTempo | 1 | CRA, OECD Taxing Wages, ESDC (OAS/CPP), NATO, IRCC Levels Plan 2025–2027; CO₂-Preis nur Industrie (OBPS) nach Wegfall der Verbraucherabgabe 2025, anteilig; ungeprüft | 2025 | ungeprüft |
| energie.netzInvest | 0.4 | CRA, OECD Taxing Wages, ESDC (OAS/CPP), NATO, IRCC Levels Plan 2025–2027; CO₂-Preis nur Industrie (OBPS) nach Wegfall der Verbraucherabgabe 2025, anteilig; ungeprüft | 2025 | ungeprüft |
| anleihen.laufzeit | 6 | CRA, OECD Taxing Wages, ESDC (OAS/CPP), NATO, IRCC Levels Plan 2025–2027; CO₂-Preis nur Industrie (OBPS) nach Wegfall der Verbraucherabgabe 2025, anteilig; ungeprüft | 2025 | ungeprüft |
| anleihen.auslandsanteil | 0.25 | CRA, OECD Taxing Wages, ESDC (OAS/CPP), NATO, IRCC Levels Plan 2025–2027; CO₂-Preis nur Industrie (OBPS) nach Wegfall der Verbraucherabgabe 2025, anteilig; ungeprüft | 2025 | ungeprüft |
| handel.zoelle | 2 | CRA, OECD Taxing Wages, ESDC (OAS/CPP), NATO, IRCC Levels Plan 2025–2027; CO₂-Preis nur Industrie (OBPS) nach Wegfall der Verbraucherabgabe 2025, anteilig; ungeprüft | 2025 | ungeprüft |
| handel.kapitalOffenheit | 0.9 | CRA, OECD Taxing Wages, ESDC (OAS/CPP), NATO, IRCC Levels Plan 2025–2027; CO₂-Preis nur Industrie (OBPS) nach Wegfall der Verbraucherabgabe 2025, anteilig; ungeprüft | 2025 | ungeprüft |
| handel.abhaengigkeit | 0.6 | CRA, OECD Taxing Wages, ESDC (OAS/CPP), NATO, IRCC Levels Plan 2025–2027; CO₂-Preis nur Industrie (OBPS) nach Wegfall der Verbraucherabgabe 2025, anteilig; ungeprüft | 2025 | ungeprüft |
| kapitalkoeffizient | 3 | Statistics Canada, Bank of Canada, Finance Canada Fiscal Reference Tables, CER Energy Futures, IIP; ungeprüft | 2025 | ungeprüft |
| tfpTrend | 0.7 | Statistics Canada, Bank of Canada, Finance Canada Fiscal Reference Tables, CER Energy Futures, IIP; ungeprüft | 2025 | ungeprüft |
| lohnquote | 0.52 | Statistics Canada, Bank of Canada, Finance Canada Fiscal Reference Tables, CER Energy Futures, IIP; ungeprüft | 2025 | ungeprüft |
| nairu | 6 | Statistics Canada, Bank of Canada, Finance Canada Fiscal Reference Tables, CER Energy Futures, IIP; ungeprüft | 2025 | ungeprüft |
| erwerbsquote | 0.78 | Statistics Canada, Bank of Canada, Finance Canada Fiscal Reference Tables, CER Energy Futures, IIP; ungeprüft | 2025 | ungeprüft |
| produktivitaetsLuecke | 0.75 | Statistics Canada, Bank of Canada, Finance Canada Fiscal Reference Tables, CER Energy Futures, IIP; ungeprüft | 2025 | ungeprüft |
| leitzins | 2.6 | Statistics Canada, Bank of Canada, Finance Canada Fiscal Reference Tables, CER Energy Futures, IIP; ungeprüft | 2025 | ungeprüft |
| effZins | 2.8 | Statistics Canada, Bank of Canada, Finance Canada Fiscal Reference Tables, CER Energy Futures, IIP; ungeprüft | 2025 | ungeprüft |
| qe | 12 | Statistics Canada, Bank of Canada, Finance Canada Fiscal Reference Tables, CER Energy Futures, IIP; ungeprüft | 2025 | ungeprüft |
| rentenausgaben | 5 | Statistics Canada, Bank of Canada, Finance Canada Fiscal Reference Tables, CER Energy Futures, IIP; ungeprüft | 2025 | ungeprüft |
| alg | 0.8 | Statistics Canada, Bank of Canada, Finance Canada Fiscal Reference Tables, CER Energy Futures, IIP; ungeprüft | 2025 | ungeprüft |
| steuerBasen | {"einkommen":60,"sozialabgaben":24,"mwst":36,"unternehmen":14,"kapitalertrag":5,"vermoegen":300,"erbschaft":10} | Statistics Canada, Bank of Canada, Finance Canada Fiscal Reference Tables, CER Energy Futures, IIP; ungeprüft | 2025 | ungeprüft |
| mix | {"kohle":0.04,"gas":0.13,"oel":0.02,"atom":0.14,"ern":0.67} | Statistics Canada, Bank of Canada, Finance Canada Fiscal Reference Tables, CER Energy Futures, IIP; ungeprüft | 2025 | ungeprüft |
| industrieTWh | 200 | Statistics Canada, Bank of Canada, Finance Canada Fiscal Reference Tables, CER Energy Futures, IIP; ungeprüft | 2025 | ungeprüft |
| netzkosten | 20 | Statistics Canada, Bank of Canada, Finance Canada Fiscal Reference Tables, CER Energy Futures, IIP; ungeprüft | 2025 | ungeprüft |
| energieExportAnteil | 0.1 | Statistics Canada, Bank of Canada, Finance Canada Fiscal Reference Tables, CER Energy Futures, IIP; ungeprüft | 2025 | ungeprüft |
| nfa | 40 | Statistics Canada, Bank of Canada, Finance Canada Fiscal Reference Tables, CER Energy Futures, IIP; ungeprüft | 2025 | ungeprüft |
| vcBasis | 0.3 | Statistics Canada, Bank of Canada, Finance Canada Fiscal Reference Tables, CER Energy Futures, IIP; ungeprüft | 2025 | ungeprüft |
| eurogewicht | 0 | Statistics Canada, Bank of Canada, Finance Canada Fiscal Reference Tables, CER Energy Futures, IIP; ungeprüft | 2025 | ungeprüft |
| fluchtReaktion | -0.5 | Statistics Canada, Bank of Canada, Finance Canada Fiscal Reference Tables, CER Energy Futures, IIP; ungeprüft | 2025 | ungeprüft |
| reserve | 0 | Statistics Canada, Bank of Canada, Finance Canada Fiscal Reference Tables, CER Energy Futures, IIP; ungeprüft | 2025 | ungeprüft |
| armut | 12 | Statistics Canada, Bank of Canada, Finance Canada Fiscal Reference Tables, CER Energy Futures, IIP; ungeprüft | 2025 | ungeprüft |
| rendite (Ersatz) | 3.3 | Statistics Canada, Bank of Canada, Finance Canada Fiscal Reference Tables, CER Energy Futures, IIP; ungeprüft | 2025 | ungeprüft |
| gini (Ersatz) | 31.7 | Statistics Canada, Bank of Canada, Finance Canada Fiscal Reference Tables, CER Energy Futures, IIP; ungeprüft | 2025 | ungeprüft |
| privatschuld (Ersatz) | 210 | Statistics Canada, Bank of Canada, Finance Canada Fiscal Reference Tables, CER Energy Futures, IIP; ungeprüft | 2025 | ungeprüft |
| einnahmen (Ersatz) | 41 | Statistics Canada, Bank of Canada, Finance Canada Fiscal Reference Tables, CER Energy Futures, IIP; ungeprüft | 2025 | ungeprüft |
| ausgaben (Ersatz) | 43 | Statistics Canada, Bank of Canada, Finance Canada Fiscal Reference Tables, CER Energy Futures, IIP; ungeprüft | 2025 | ungeprüft |
| importquote (Ersatz) | -0.8 | Statistics Canada, Bank of Canada, Finance Canada Fiscal Reference Tables, CER Energy Futures, IIP; ungeprüft | 2025 | ungeprüft |
| co2Mt (Ersatz) | 540 | Statistics Canada, Bank of Canada, Finance Canada Fiscal Reference Tables, CER Energy Futures, IIP; ungeprüft | 2025 | ungeprüft |
| fondsQuote0 | 23 | CPP Investments, Nettovermögen 31.03.2025 rund 714 Mrd. C$, BIP rund 3,0 Bio. C$; im Gesamtstaat (IWF), Erträge in den Einnahmen | 2025 | Größenordnung geprüft |


## Geänderte Wirkstärken und Modell-Entscheidungen

| id | alt | neu | Grund | Quelle |
|---|---|---|---|---|
| staat.marktdisziplin | — | 1,0 | Ohne Gegenwehr bei steigenden Aufschlägen explodierte die Schuld | Mauro et al. 2015 (IMF) |
| anleihen.ausfallSchwelle u. a. | — | 8 Pp. | Ventile aus Spec 7 ergänzt (Schuldenschnitt / Monetarisierung) | Reinhart/Rogoff 2009; Cruces/Trebesch 2013 |
| innov.fondsVC | 0,02 | 0,003 | Rentenfonds legen realistisch wenige Promille in Wagniskapital an | OECD Pension Markets in Focus |
| Privatkredit-Normalwachstum | Vorjahreswachstum | Trendwachstum | Verhinderte eine künstliche Zwei-Jahres-Schwingung | Modellkorrektur |
| dsrSchwelle (DE) | 17 | 21 | An die Modell-Schuldendienstquote mit IMF-Privatschuld 139 % angepasst | BIS Debt Service Ratios |
| Haushaltsplan je Land (M29) | — | geeicht, 2031 Plan / Impuls: DE −0,3 / −1,4, US +1,7 / +0,2, JP −0,7 / −2,2, GB +4,7 / +4,4, FR +5,2 / +3,0, IT +4,4 / +1,1, CA +1,9 / +1,1, CN +0,8 / −1,0, RU −0,3 / −0,7 Pp. BIP | Finanzierungssaldo des Basislaufs 2026–2031 auf den IWF gestellt; Skript `scripts/haushaltsplan-eichung.ts` | IWF World Economic Outlook (Datamapper, Stand 28./29.09.2026), GGXCNL_NGDP |
| tfpTrend (GB) | 0,5 | 0,7 | Update 2, Abgleich IWF: Wachstum 0,8 statt 1,4 %; OBR-Trendproduktivität rund 1 % pro Jahr entspricht bei Kapitalanteil 0,3 etwa 0,7 % TFP | OBR Economic and Fiscal Outlook |
| tfpTrend (CA) | 0,5 | 0,7 | Update 2, Abgleich IWF: Wachstum 1,1 statt 1,7 %; Bank of Canada schätzt Trend-Arbeitsproduktivität rund 1 % | Bank of Canada, Potential Output Assessment |
| erwerbsquoteTrend (IT) | — | 0,003 für 12 Jahre | Update 2, Abgleich IWF: Arbeitsangebot sank ohne Trend um rund 0,6 % pro Jahr; steigende Beteiligung von Frauen und Älteren | ISTAT Forze di lavoro |
| grund.tpi (FR, IT) | aus | an | Update 2, Branch-Review: Nur mit TPI trifft der Startaufschlag den beobachteten Abstand zur Bundesanleihe 2025 (FR 0,76, IT 0,98 Pp.; ohne TPI 1,9 und 2,1 Pp.) | EZB Transmission Protection Instrument (Juli 2022); OECD IRLT |
| steuer.sozialabgaben (CA) | 0,12 | 0,2 (Grenze), Basis 40 → 24 | Verzeichnisbereich 0,2–0,55; Aufkommen unverändert | CRA, OECD Taxing Wages |
| rente.deckungJahre (neu) | — | 20 | Reservefonds im Startjahr (Spec 13.7): ein vorhandener Fonds bringt einen Umstieg auf Mischung oder Kapitaldeckung um seinen Anteil an einem vollen Fonds voran | Eurostat, Zusatztabelle Rentenansprüche |

## Konsens-Vergleich (Update 1)

Nur Anzeige, keine Modellwerte. Dateien: `daten/laender/XX-konsens.json` (Hand), Schlüssel `konsens` in `XX.json` (IWF). Aufgenommen 28.09.2026.

| Land | Quelle | Stand | Werte | Beleg |
|---|---|---|---|---|
| alle | IMF World Economic Outlook, DataMapper (NGDP_RPCH, PCPIPCH, LUR, GGXCNL_NGDP, GGXWDG_NGDP) | Abruf 28.09.2026 | 2026–2031 | https://www.imf.org/external/datamapper |
| US | CBO, The Budget and Economic Outlook: 2026 to 2036 | 11.02.2026 | Wachstum 2026 2,2 %, 2027–2036 im Mittel 1,8 %; Defizit Bund 2026 5,8 %; Schuld in Händen der Öffentlichkeit 101 % (2026), 120 % (2036) | https://www.cbo.gov/publication/61882 (Seite hinter Captcha; Zahlen aus der CBO-Zusammenfassung, gegengelesen bei CRFB) |
| US | Federal Reserve, Summary of Economic Projections, Median | 16.09.2026 | Wachstum 2,3/2,4/2,2/2,1; Arbeitslosigkeit 4,1 (2026–2029); PCE-Inflation 3,7/2,3/2,1/2,0 | https://www.federalreserve.gov/monetarypolicy/fomcprojtabl20260916.htm |
| DE | Sachverständigenrat, Frühjahrsgutachten 2026 | Mai 2026 | Wachstum 0,5/0,8; Verbraucherpreise 3,0/2,8 (2026/2027) | https://www.sachverstaendigenrat-wirtschaft.de/en/spring-report-2026.html |
| DE | Deutsche Bundesbank, Deutschland-Prognose Juni 2026 | 12.06.2026 | Wachstum kalenderbereinigt 0,5/0,8/1,4; HVPI 2,9/2,7/1,9 (2026–2028) | Monatsbericht Juni 2026; Pressemitteilung nicht direkt abrufbar, Zahlen aus zwei Berichten darüber übereinstimmend |
| JP | Bank of Japan, Outlook for Economic Activity and Prices, Median des Board | 31.07.2026 | Wachstum 0,6/0,8/0,8; Verbraucherpreise ohne frische Lebensmittel 2,5/2,4/2,0 (Fiskaljahre 2026–2028) | https://www.boj.or.jp/en/mopo/outlook/highlight/ten202607.htm |

Nicht aufgenommen: CBO-Arbeitslosigkeit und -Inflation, Bundesbank-Defizit und -Schuld (nicht zweifelsfrei für die Juni-Projektion 2026 belegt).

## Update 4a — Wirtschaftsordnung, Rohstoffe, gelenkte Währung

Stand 29.09.2026. Bis Update 4c Literaturwerte, nicht an historischen Fällen geprüft (Kritikpunkt M25). Umstrittene Wirkstärken schalten ihren Kanal mit 0 ab.

| Eintrag | Wert | Quelle |
|---|---|---|
| Rechtsstaat, Standard je Land | DE 85, US 72, JP 84, GB 80, FR 75, IT 68, CA 83 | Weltbank WGI Rule of Law Score 2025 (`GOV_WGI_RL.SC`), gerundet |
| Staatsanteil an Unternehmen, Standard | 5 % | OECD, Ownership and Governance of State-Owned Enterprises 2017 (G7 grob) |
| Rechtsstaat → Produktivitätsniveau | 0,5 log je 100 Punkte, Anpassung 15 Jahre | Acemoglu/Johnson/Robinson 2001 |
| Staatsanteil → Produktivitätsniveau | 0,3 log je 100 Punkte | Hsieh/Klenow 2009; Brandt/Zhu 2010 |
| Rechtsstaat → Aufholgeschwindigkeit | Faktor 1 je 100 Punkte | Barro 1991 (bedingte Konvergenz) |
| Rechtsstaat → Kapitalkosten | 0,1 Pp. je Punkt | Acemoglu/Johnson/Robinson 2001 |
| Kapitalflucht | Faktor 1; halbe Wirkung auf Investitionen, 1 % Kurs je % BIP | Schneider 2003; IWF; Entwurf |
| Abwanderung bei schlechter Ordnung | Faktor 0,5 | Docquier/Rapoport 2012 |
| Verluste der Staatsbetriebe | 0,03 % BIP je Punkt | Kornai 1986 (weiche Budgetgrenze) |
| Preiskontrollen: Unterdrückung, Stauabbau, Knappheit → Angebot | 0,7; 0,5 pro Jahr; 0,2 % je Punkt | Kornai 1980; Entwurf |
| Geldnachfrage bei stabilen Preisen, Flucht aus dem Geld | 10 % BIP; 1 je 100 % Inflation | Cagan 1956 |
| Anker bröckelt ab | 25 % Inflation | Entwurf |
| Kreditlenkung: Investitionen, Kapitaleffizienz, faule Kredite | 0,1 Pp. je Punkt; 0,3 je 100 Punkte über 15 Jahre; 10 % | Brandt/Zhu 2010; Hsieh/Klenow 2009; IWF Article IV China |
| Verdeckte Schuld: Übernahme ab | 20 % BIP | Entwurf |
| Hyperinflation: Krise ab | 100 % | Entwurf |
| Förderverfall | 0,15 pro Jahr je 100 Punkte (Staatsanteil − Rechtsstaat) | Wolf 2009; Stevens/Dietsche 2008 |
| Holländische Krankheit | 0,5 % Aufwertung je Pp. Rohstoffexporte über Start | Corden/Neary 1982 |
| Rendite Stabilisierungsfonds | 3 % real | Norges Bank Investment Management |
| Sanktionen gegen Rohstoffexporte | −30/−25/−20/−10 %, × (1 − 0,6 × Diversifizierung) | Entwurf |
| Gelenkte Währung: Reaktion auf Inflation | 0,25 | Entwurf |
| Abwertungsrisiko im Zins | 0,3 Pp. je % Überbewertung × Offenheit | Frankel/Rose 1996 |

## Update 4b — China und Russland

Stand 29.09.2026. Handwerte und Quellen je Eintrag in `daten/laender/CN-hand.json` und `RU-hand.json` (Schlüssel `quellen`). Automatische Reihen: IWF, Weltbank, OECD (`npm run daten -- CN`, `-- RU`).

| Eintrag | China | Russland | Quelle |
|---|---|---|---|
| Rechtsstaat | 52 | 38 | Weltbank WGI Rule of Law Score 2025 |
| Staatsanteil an Unternehmen | 30 | 35 | OECD; Zhang 2019; IWF/EBRD |
| Kreditlenkung | 40 | 30 | IWF Article IV; grob |
| Verdeckte Schuld am Start | 35 % BIP | 0 | IWF Article IV China 2025 (erweiterte Schuld 124 % gegen 90 %) |
| Übernahme-Schwelle | 40 % BIP | 20 % BIP | Landesstandard China: knapp über dem Startbestand, sonst sofortige Übernahme |
| Fondsanteil Rohstoff-Mehreinnahmen | – | 100 % | Haushaltsregel Russlands (Nationaler Wohlfahrtsfonds) |
| Ersatzrendite 10 Jahre | 1,8 % | 12 % | RU: OFZ 2025 rund 15 % (Kriegsinversion); 12 %, damit die Laufzeitprämie rund 1 Pp. beträgt |
| Rohstoffexporte, Staatsanteil, Fonds | – | 11 % BIP; 0,5; 3 % BIP | Bank of Russia; Finanzministerium; NWF |
| Inflationsziel | 2 % | 4 % | PBoC; Bank of Russia |
| TFP-Trend (kalibriert) | 2,3 % | 0,55 % | IWF WEO 2026–2031: Ø 3,78 % bzw. 1,03 % Wachstum, Modell 3,77 bzw. 1,03 % |
| Angleichung des gelenkten Realzinses | 10 Jahre | 10 Jahre | Update 4b; Holston/Laubach/Williams 2017 (langsame Anpassung) |

## Update 4c — Historische Kalibrierfälle

Stand 29.09.2026. Quellen der Fälle je Datei in `daten/kalibrierung/*.json` (Schlüssel `quellen`). Pfade sind grob gesetzt, Prüfmaßstab Richtung und Größenordnung (Spec 9a).

| Änderung | Wert | Fall und Quelle |
|---|---|---|
| Kreditlenkung → Kapitaleffizienz (`ordnung.lenkVerlust`) | 0,3 → 0,5, Belegstärke „kalibriert“ | UdSSR: Kapitaleffizienz 1985 unter 0,85 (Easterly/Fischer 1995) |
| Rohstofferlöse zum realen Wechselkurs | Erlös ÷ realer Kurs | Venezuela: Ölexporte 2008 rund 30 % BIP statt 75 % (Weltbank WDI) |
| Rohstoffmenge in der Wirtschaftsleistung | Potenzial × (1 + Anteil am Start × (Menge − 1)) | Venezuela, Kuba: Förder- und Ernteeinbrüche |
| Preiskontrollen bei hoher Inflation | Unterdrückung ÷ (1 + (Inflation − 25) / 25) über 25 % | Venezuela 2016–2019; Kornai 1992 |
| Negativer Realzins in Nachfrage und Kredit | höchstens bis −5 % | Venezuela: kein Scheinboom bei Hyperinflation |
| Historischer Rohstoffpreis (`rohstoffBezug`) | Startjahr-Preise je Fall | Venezuela 18 $, Russland 1995 17 $ (BP Statistical Review) |

## Staatspleiten (Spec 13.11, 29.09.2026)

| Eintrag | Wert | Quelle |
|---|---|---|
| Aufschlag je Pp. Auslandsschuld (`anleihen.nfaRisiko`) | 0,03 ab 60 % BIP netto | Lane/Milesi-Ferretti 2012; Catão/Milesi-Ferretti 2014; kalibriert an Griechenland |
| Aufschlag je Pp. Primärdefizit (`anleihen.defizitRisiko`) | 0,25 ab 3 % BIP | Laubach 2009 |
| Panik ohne Notenbank (`anleihen.panik`) | Faktor 0,5 über 5 Pp. | De Grauwe 2011; De Grauwe/Ji 2013; kalibriert an Griechenland |
| Fall Griechenland ohne Schutzprogramm; Ausgaben 2009 +5 % BIP | – | OMT erst 2012, TPI 2022; Eurostat (Defizit 2009 15,4 %) |
| Fall Argentinien: Landesschwelle 35 %, Auslandsposition −35 %, Leistungsbilanz-Rest −3 % | – | Reinhart/Rogoff/Savastano 2003; IWF |

## Politik reagiert (Spec 13.10, 29.09.2026)

| Eintrag | Wert | Quelle |
|---|---|---|
| Konjunkturpaket (`politik.konjunktur`) | 1 % BIP für 2 Jahre nach 3 Jahren Schwäche | Galí/Perotti 2003 (diskretionäre Fiskalpolitik reagiert auf die Produktionslücke); Auerbach/Gorodnichenko 2012 (Multiplikator in schwachen Phasen) |
| Reform nach 5 Jahren Schwäche, höchstens eine je 10 Jahre | – | IMF WEO April 2004, Kap. 3; Abiad/Mody 2005; Drazen/Easterly 2001 („crisis induces reform“) |
| Konsolidierung: ein Drittel der Lücke, höchstens 1 % BIP pro Jahr; Steueranteil 0,4 | – | Alesina/Favero/Giavazzi 2019, *Austerity* (ausgabenseitige Konsolidierung kostet weniger Wachstum) |
| Haltender Primärsaldo (r − g)/(1 + g) × Schuld | Lehrbuch | Schuldendynamik, z. B. Blanchard, *Macroeconomics* |
| Kürzung je Bereich höchstens 20 % | Spec-Entscheidung | – |
| Politisches Risiko (`politik.risikoAufschlag`) | 0,5 Pp. für 5 Jahre nach einer Krise, Standard aus | Funke/Schularick/Trebesch 2016 (Randparteien gewinnen nach Finanzkrisen rund 30 % Stimmenanteil hinzu) |


## Kalman-Filter (Spec 13.1, 29.09.2026)

Zustandsraummodell je Land, Jahreswerte 2000 bis Datenstand, Einheiten in % bzw. Pp. Code: `daten/schaetzung/`, Aufruf `npm run schaetzen`.

- Potenzial: `y*_t = y*_{t−1} + g_{t−1} + η1`, Potenzialwachstum `g_t = g_{t−1} + η2` (Laubach/Williams 2003).
- Produktionslücke: `c_t = φ·c_{t−1} − β·(r_{t−1} − r*_{t−1}) + η3`, φ = `wachstum.lueckePersistenz`, β = `wachstum.zinsWirkung` (IS-Kurve wie im Modell).
- NAIRU `u*_t = u*_{t−1} + η4` (OECD-Methode, Richardson u. a. 2000); neutraler Zins `r* = g + z`, `z_t = z_{t−1} + η5` (Holston/Laubach/Williams 2017).
- Messung: BIP `y = y* + c + ε1`; Arbeitslosigkeit `u = u* − okun·c + ε2`; Inflation `π = πe + phillips·c + ε3` mit `πe = anker·ziel + (1 − anker)·π_{t−1}` (wie `geld.ts`); Realzins = Kurzfristzins − πe.

| Annahme | Wert | Begründung |
|---|---|---|
| η1 Potenzialniveau | 0,3 % | Kleine Niveausprünge (Revisionen, Einmaleffekte); klein gegen die Lücke, damit Schwankungen in c landen |
| η2 Potenzialwachstum | 0,1 Pp. pro Jahr | Laubach/Williams 2003: Signal-Rausch-Verhältnis λ_g ≈ 0,05 (Median-unverzerrt); der Trend bewegt sich über Jahrzehnte um wenige Zehntel |
| η3 Produktionslücke | 1,2 % | Streuung der Produktionslücken der G7 2000–2024 um 1,5–2 % (OECD Economic Outlook); abzüglich des Teils, den Beharrung und Zins erklären |
| η4 NAIRU | 0,25 Pp. pro Jahr | Richardson u. a. 2000 (OECD Working Paper 250): NAIRU ändert sich langsam; Größenordnung der jährlichen Revisionen der AMECO-NAWRU |
| η5 Rest des neutralen Zinses | 0,2 Pp. pro Jahr | Holston/Laubach/Williams 2017, jährlich hochgerechnet |
| ε1 BIP | 0,1 % | Messfehler klein; BIP-Revisionen stecken in η1 |
| ε2 Arbeitslosigkeit | 0,3 Pp. | Streuung um das Okunsche Gesetz |
| ε3 Inflation | 1,0 Pp. | Energie-, Steuer- und Einmaleffekte, die die Phillips-Kurve nicht kennt |
| Skalierung κ | geschätzt | Konzentrierte Likelihood; alle Bänder × κ. Nur κ wird geschätzt, weil 26 Jahreswerte acht Varianzen nicht tragen („Pile-up“, Stock/Watson 1998) |
| Inflation 2021–2023 ausgelassen | – | Energie- und Lieferkettenschock; nur die Messwerte fehlen, Erwartung und Realzins nutzen die Ist-Inflation. Mit diesen Jahren lag die NAIRU der USA bei 5,4 statt nahe CBO (4,4) und κ in 8 von 9 Ländern höher |
| Handwert im Band bleibt | ±1 Standardabweichung | Liegt der Handwert im Band der Schätzung, widersprechen ihm die Daten nicht; er bleibt und gilt als bestätigt (Befund der Prüfung, 29.09.2026) |
| Rückfall auf Handwert | κ > 3, außerhalb des Bereichs, Band zu breit | Produktivitätstrend −0,5 bis 3,5 (Band ≤ 0,8), NAIRU 1 bis 15 (≤ 2,5), r* −4 bis 5 (≤ 3), Lücke −10 bis 10 (≤ 5) |
| Produktivitätstrend aus g | `(1 − α)·(g − gL)` | Cobb-Douglas bei festem Kapitalkoeffizienten; gL = Wachstum des Arbeitspotenzials der letzten 10 Jahre |
| HP-Gegenprobe | λ = 6,25 | Ravn/Uhlig 2002 für Jahresdaten; nur Gegenprobe, nie Hauptmethode (Hamilton 2018) |
| Kurzfristzins | OECD IR3TIB | OECD Financial market statistics, Jahreswerte; Russland bis 2021 |
| Urteil gegen die Schätzung | 0,3 Pp. | Führt eine Schätzung das Wachstum 2026–2030 um mehr als 0,3 Pp. weiter vom IWF-Konsens weg, bleibt der Handwert (`schaetzungAus` in der Handdatei, Grund sichtbar in der Annahmen-Ansicht). |

## Frühwarn-Lampen (Spec 13.2, 29.09.2026)

| Eintrag | Wert | Quelle |
|---|---|---|
| Inverse Zinskurve (`schwelle.zinskurve`) | Rendite 10 Jahre − Leitzins < 0 Pp.; bei Gemeinschaftswährung Euroraum-Leitzins; keine Lampe bei gelenkter Währung | Estrella/Mishkin 1998, „Predicting U.S. Recessions: Financial Variables as Leading Indicators“; Federal Reserve Bank of New York, Yield Curve as a Leading Indicator |
| Kreditlücke (`schwelle.kreditluecke`) | Privatschuld − Trend > 10 Pp. | BCBS 2010, „Guidance for national authorities operating the countercyclical capital buffer“; Drehmann/Juselius 2014, „Evaluating early warning indicators of banking crises“ |
| Trend der Privatschuld | Einseitiger HP-Filter, λ = 1.562,5 (Jahre) | BIS: λ = 400.000 für Quartale; Jahreswert 400.000/4⁴ nach Ravn/Uhlig 2002. Im Modell als stationärer Kalman-Filter (lokaler linearer Trend) gerechnet; trifft den einseitigen HP auf den IWF-Reihen auf höchstens 0,3 Pp. Ein gleitender Durchschnitt (erster Vorschlag der Spec) hinkt 10–40 Pp. hinterher und ist verworfen |
| Datenreihe für den Start | IWF Global Debt Database, Privatschuld % BIP | Statt der BIS-Reihe „Credit to the private non-financial sector“; gleiches Konzept, Abgrenzung im Detail anders |
| Schwäche der Kreditlücke | – | Repullo/Saurina 2011: Nach BIP-Einbrüchen steigt die Quote über den Nenner; im Rückblick Deutschland 2010 sichtbar |
| Vorab-Hinweis „etwa alle x Jahre“ | Jahre des Rückblicks ÷ Schocks im Rückblick-Szenario | Rückblick Deutschland 2000–2025: Finanzkrise 2009, Pandemie 2020, Energie 2022 → 9 Jahre |

## Vermögenspreise und Banken (Spec 13.6, 30.09.2026)

### Startwerte je Land

Abruf 30.09.2026 mit `npx tsx daten/holen.ts XX --nur-banken`. Die übrigen Reihen in `XX.json` blieben byte-gleich.

| Startwert | Quelle | Status |
|---|---|---|
| `bankKapital0` Eigenkapital / Bilanzsumme, ungewichtet | World Bank FB.BNK.CAPA.ZS (IWF Financial Soundness Indicators) | automatisch. Letzter Wert bis zum Startjahr; Japan 2022, China 2021 |
| `npl0` faule Kredite / Kredite | World Bank FB.AST.NPER.ZS | automatisch. Japan 2022, Russland 2023. China: offizielle Quote 1,5 %, begründete Zweifel, Datenampel bleibt gelb |
| `bankBilanz0` Forderungen der Banken an heimische Nichtbanken / BIP | World Bank GFDD.DI.02 „Deposit money banks' assets to GDP“ (Quelle 32) | automatisch, Stand 2020/2021. Älter als sechs Jahre gilt nicht: Kanada (Reihe endet 2008) rechnet mit dem Ersatzwert 120 (BIS-Bankkredit 102 plus Staatsanleihen bei Banken), ungeprüft |
| `bankKreditAnteil` Anteil der Privatschuld bei Banken | BIS Total Credit (WS_TC): Bankkredit ÷ Kredit aller Sektoren an den privaten nichtfinanziellen Sektor, Jahresende | automatisch. USA 0,31, China 0,99 |
| `bankStaatsAnteil` Anteil der Staatsschuld bei heimischen Banken | IWF, Arslanalp/Tsuda, „Tracking Global Demand for Advanced Economy Sovereign Debt“ (fortgeschriebene Datenbank); für China und Russland Größenordnung aus Notenbankberichten | Handwert, **ungeprüft** (nicht im Original nachgeschlagen): DE 0,14, US 0,08, JP 0,12, GB 0,10, FR 0,10, IT 0,22, CA 0,17, CN 0,65, RU 0,60 |
| `hausVermoegen0` Wohnimmobilien der Haushalte / BIP | Nationale Vermögensbilanzen (Bundesbank/Destatis, Fed Z.1, ONS, INSEE, Banca d'Italia, StatCan, Cabinet Office); China und Russland Schätzungen | Handwert, **ungeprüft**: DE 240, US 165, JP 160, GB 250, FR 290, IT 250, CA 245, CN 300, RU 100 |
| `hausBewertung0` Preis über dem langjährigen Preis-Einkommen-Verhältnis | OECD Analytical house prices indicators, HPI_YDH_AVG; Wert des Startjahres gegen das Mittel der Reihe bis zum Startjahr | automatisch. Reihen ab 1960 (Japan), 1970 (USA, Italien, Kanada), 1978 (Frankreich), 1980 (Deutschland), 1987 (Großbritannien). Die OECD mittelt über einen kürzeren Zeitraum: Japan −12 statt −20, Kanada +50 statt +57, USA +13 statt +10. China und Russland: keine OECD-Reihe, 0 gesetzt (keine belegte Abweichung) |
| Hauspreis-Trend, -Steigung, -Wachstum im Startjahr | BIS Selected residential property prices, real (WS_SPP, Q.XX.R.628), Jahresmittel; einseitiger HP-Filter λ = 1.562,5 auf 100·ln | automatisch über `npm run schaetzen` (`XX-schaetzung.json`, Feld `haus`) |

**Was „Bilanz“ hier heißt:** nicht die Bilanzsumme der Banken (Deutschland rund 250 % BIP), sondern ihre Forderungen an heimische Nichtbanken (rund 96 % BIP). Das Modell kennt nur Verluste aus heimischem Kredit und Staatsanleihen. Eigenkapitalquote mal diese Bilanz ist das Eigenkapital, das hinter genau diesen Forderungen steht.

**Rückblick Deutschland 2000:** Eigenkapital 4,3 % (Bundesbank Bankenstatistik), faule Kredite 4,7 % (IWF Global Financial Stability Report), Bilanz 142 % BIP (GFDD, zwischen 1998 und 2001), Staatsschuld bei heimischen Banken 40 % (Bundesbank), Wohnimmobilien 240 % BIP. Alle fünf **ungeprüft**. Bankanteil am Kredit 0,69 (BIS) und Bewertung −4 % (OECD) kommen aus den Reihen. Hauspreis-Trend aus BIS-Realpreisen 1970–2000.

### Kalibrierfälle mit Bankenkrise (Task 6)

Dateien `daten/kalibrierung/{usa-2000,spanien-1998,irland-2002,japan-1985,kanada-2000}.json`, Quellen je Datei im Schlüssel `quellen`. Kriterien und Werte: `npx tsx scripts/banken-kalibrierung.ts`.

| Eintrag | Wert | Quelle |
|---|---|---|
| Macrohistory-Auszug | `daten/kalibrierung/jst-auszug.csv`, sechs Länder, 1980–2020, 15 Spalten | Jordà/Schularick/Taylor, Macrohistory Database R6, macrohistory.net, abgerufen 30.09.2026; Lizenz CC BY-NC-SA 4.0 (Namensnennung, nicht kommerziell, gleiche Lizenz), Hinweis in `daten/kalibrierung/JST-LIZENZ.md`. Auszug mit `docs/methodik/jst-auszug.py` |
| Weltpfade der Fälle | Leitzins = gemessener Kurzfristzins; Laufzeitprämie so, dass die Rendite der gemessenen folgt | aus dem Auszug mit `docs/methodik/faelle-pfade.py` |
| Krisenbeginn, fiskalische Kosten, Höchststand fauler Kredite, Anstieg der Staatsschuld | USA 2007: 4,5 % BIP, 5,0 %, +21,9 Pp. · Spanien 2008: 5,4 %, 9,4 %, +31,8 · Irland 2008: 37,6 %, 25,7 %, +76,5 · Japan 1997: 8,6 %, 35,0 %, +41,7 · Deutschland 2008: 2,7 %, 3,7 %, +16,2 | Laeven/Valencia 2018, „Systemic Banking Crises Revisited“, IWF WP 18/206, Tabelle im Anhang; **geprüft** am Original (30.09.2026) |
| Abweichung von den Richtwerten im Entwurf | Japan 8,6 statt rund 14 % BIP (−39 %); Spanien 5,4 statt rund 4 (+35 %); Deutschland 2,7 statt rund 2 (+35 %) | Der Entwurf nannte ältere Fassungen (Laeven/Valencia 2012). Die Kriterien verschieben sich nicht: USA und Spanien liegen im Rahmen 2–8 %, Irland über 20 % |
| Startwerte der Fälle | Bilanz, Bankanteil, Bewertung, Hauspreis- und Kredittrend aus Weltbank GFDD, BIS, OECD; faule Kredite, Staatsanleihen bei Banken, Hausvermögen, Eigenkapital Irland von Hand | Handwerte **ungeprüft** |
| Bewertung im Startjahr | Preis-Einkommen-Verhältnis gegen sein Mittel bis zum Startjahr | OECD HPI_YDH; ohne Wissen aus der Zukunft (das Mittel der ganzen Reihe enthält die späteren Blasen) |

### Kalibrierte Wirkstärken (Task 6)

| Wirkstärke | Bauplan | jetzt | Grund |
|---|---|---|---|
| `banken.hausAnpassung` | 0,1 | 0,2 | Gipfel der Blase im richtigen Jahr (USA 2008, Japan 1991); oberer Rand der Spanne |
| `banken.sicherheiten` | 0,15 des Zuwachses an Hausvermögen | 0,2 % Kredit je % Hauspreis über dem Einkommen | Neues Maß (Kreditbestand statt Hausvermögen); Wert hält die Basisläufe bei hoher Privatschuld ruhig. Spanne 0–0,3: Bis dorthin bleibt die Schleife in den Robustheitstests begrenzt |
| `banken.nplAlq` | 0,5 | 1,0 | USA 2008–2011: faule Kredite 5,4 % (gemessen 5,0 %) |
| `banken.nplHaus` | 0,15 | 0,3 | wie oben; oberer Rand |
| `banken.abschreibung` | 0,25 | 0,4 | oberer Rand; steht auch für Wertpapierverluste |
| `banken.rendite` | neu, 8 % | 5 % | unterer Rand: 2008 fingen Gewinne die Verluste nicht ab. Die Spanne 5–12 ist eine Größenordnung nach EZB und FDIC, im Original **ungeprüft** |
| `banken.hausKredit`, `hausMomentum`, `hausZins`, übrige | unverändert | — | 1,3 statt 1,0 träfe die USA besser (tieferer Fall, Rettung rund 2 % BIP), lässt aber Frankreich, Kanada und China im Basislauf von selbst schwingen |

## Investitionen und öffentlicher Kapitalstock (Spec 13.5 Teil B, 30.09.2026)

| Eintrag | Wert | Quelle |
|---|---|---|
| `wachstum.akzelerator` | 0,44 Pp. Investitionsquote je % Lücke des Vorjahres | Eigene Schätzung, Macrohistory-Datenbank R6 (Jordà/Schularick/Taylor), 18 Länder 1955–2019, Länder- und Jahreseffekte, t 6,4; Skript `docs/methodik/pruefung-b-jst.py`. Gegenprobe auf den Reihen der App: alle neun Länder positiv (`docs/methodik/pruefung-b-laender.py`) |
| `wachstum.investElastizitaet` | 0,15 (vorher 0,6) | Dieselbe Schätzung: 0,04 bis 0,15 Pp. je Pp. realem Langfristzins. Chirinko/Fazzari/Meyer 1999 (Nutzerkosten-Elastizität klein), im Original **ungeprüft** |
| `staat.oeffKapital` | 0,1 | Bom/Ligthart 2014, „What have we learned from three decades of research on the productivity of public capital?“, Journal of Economic Surveys (Meta-Analyse, 578 Schätzungen), im Original **ungeprüft** |
| `staat.oeffAbschreibung` | 4,5 % pro Jahr | Kamps 2006 (IWF Staff Papers); IWF Investment and Capital Stock Dataset, **ungeprüft**. Gegenprobe Eurostat: Abschreibungen des deutschen Staates rund 2,4 % BIP |
| `staat.investitionen`, Standard DE, FR, IT | 3,3 / 4,4 / 3,8 % BIP | Eurostat `gov_10a_main`, Bruttoanlageinvestitionen des Staates (P.51g), Abruf 30.09.2026 |
| `staat.investitionen`, Standard US, JP, GB, CA, CN, RU | 3,6 / 3,9 / 3,2 / 3,9 / 6,0 / 3,0 % BIP | OECD Government at a Glance, IWF Investment and Capital Stock Dataset; **ungeprüft** |
| Rückblick Deutschland, Pfad 2000–2025 | 2,6 % (2000), Tief 2,2 % (2004–2007), 3,3 % (2025) | Eurostat `gov_10a_main` |
| Nettoinvestition des Staates 2000–2023 | Deutschland 0,12 % BIP, Frankreich 0,61 %, Italien 0,0 % | Eurostat `gov_10a_main`, P.51g abzüglich P.51c |

## Zufallsschocks (Spec 13.4, 30.09.2026)

| Eintrag | Wert | Quelle |
|---|---|---|
| `zufall.kriseBasis` | 2,0 % pro Jahr bei Kreditlücke null | Eigene Schätzung, Macrohistory-Datenbank R6 (Jordà/Schularick/Taylor), 18 Länder 1970–2020: 25 Krisen in 918 Länderjahren (2,7 %); Logit mit der Kreditlücke des Vorjahres, Achsenabschnitt −3,91. Skript `docs/methodik/haeufigkeit-jst.py`, Ergebnis `docs/methodik/ergebnis-jst.txt` |
| `zufall.kriseKredit` | 0,09 Logit je Pp. Kreditlücke | Dieselbe Schätzung: 0,094 (t 4,8) allein, 0,077 (t 3,7) zusammen mit der Hauspreislücke. Kreditlücke wie im Modell (einseitiger HP-Filter, λ 1562,5) auf Bankkredit/BIP. Schularick/Taylor 2012, im Original **ungeprüft** |
| `zufall.kriseHaus` | 0,05 Logit je % Hauspreislücke | Dieselbe Schätzung: 0,048 (t 2,8), 1970–2020. Über 1950–2020 nur 0,014 (t 1,3) |
| `zufall.kriseRuhe` | 10 Jahre | Dieselben Daten: seit 1950 mindestens 16 Jahre zwischen zwei Krisen im selben Land |
| `zufall.staerke` | Log-Standardabweichung 0,4 | Dieselben Daten: Einbuße an Wachstum pro Kopf über zwei Jahre in 25 Krisen seit 1950 (eine ohne Einbuße), Perzentile 10/50/90 bei −11,5 / −6,6 / −3,8 Pp. (0,6- bis 1,8-Faches des Medians) |
| `zufall.kriseMax` | 15 % pro Jahr | Annahme |
| `zufall.oel` | 5 % pro Jahr | Annahme nach Hamilton 2013, „Historical Oil Shocks“ (1973, 1979, 1990, 2008), im Original **ungeprüft** |
| `zufall.pandemie` | 2 % pro Jahr | Marani u. a. 2021, „Intensity and frequency of extreme novel epidemics“, PNAS, im Original **ungeprüft** |
| `zufall.proxy` | 1,5 % pro Jahr | Annahme: ein Fall seit 1950 für Deutschland (2022) |
| `zufall.konjunktur` | 1 % BIP Standardabweichung | Kalibriert: Wachstum Deutschlands in ruhigen Jahren ab 1995 streut um 1,26 Pp. (ohne 2008–2010, 2020–2022), das Modell nur mit Konjunktur-Zufall um 1,20 Pp.; mit großen Schocks 1,69 gegen gemessen 2,06. Skript `docs/methodik/eichung-zufall.ts` |

## Verteilung: Gini und Armut (Spec 13.13, 30.09.2026)

### Startwerte des Gini

Quelle für Deutschland, USA, Japan, Vereinigtes Königreich, Frankreich, Italien, Kanada: OECD Income Distribution Database, Gini des verfügbaren Einkommens, neue Einkommensdefinition (seit 2012), alle Altersgruppen; Abruf 30.09.2026 mit `npx tsx daten/holen.ts <Land> --nur-gini`, Reihe `giniOecd` in der Länderdatei. Es gilt der letzte Wert, höchstens sechs Jahre alt. China und Russland: Weltbank `SI.POV.GINI` (die OECD-Werte enden 2011 und 2017); der Landeshinweis sagt, dass die Messung nicht direkt vergleichbar ist.

| Land | vorher | Quelle vorher | neu | Quelle neu |
|---|---|---|---|---|
| Deutschland | 31,5 | Ersatzwert EU-SILC (Handdatei, ungeprüft) | 30,7 | OECD 2023 |
| USA | 41,8 | Weltbank 2024 | 39,4 | OECD 2023 |
| Japan | 32,9 | Ersatzwert (Handdatei, ungeprüft) | 33,8 | OECD 2021 |
| Vereinigtes Königreich | 32,4 | Ersatzwert (Handdatei, ungeprüft) | 36,7 | OECD 2023 |
| Frankreich | 31,8 | Weltbank 2023 | 29,9 | OECD 2023 |
| Italien | 34,3 | Weltbank 2023 | 32,5 | OECD 2023 |
| Kanada | 31,7 | Ersatzwert (Handdatei, ungeprüft) | 30,6 | OECD 2023 |
| China | 36,0 | Ersatzwert (Handdatei) | 36,0 | Weltbank 2022 |
| Russland | 33,0 | Weltbank 2023 | 33,0 | Weltbank 2023 |

Rückblick Deutschland: Startwert 2000 und Ist-Reihe aus derselben OECD-Datenbank (`DE-historie.json`), bis 2010 alte Einkommensdefinition, ab 2011 neue. Der Bruch 2011 beträgt 0,2 Punkte (29,3 alt, 29,1 neu).

### Wirkstärken

Eigene Schätzung: OECD Income Distribution Database gegen OECD Revenue Statistics und OECD Social Expenditure, 36 bis 37 Länder, 1990–2023, Länder- und Jahreseffekte, Standardfehler nach Ländern geclustert. Skript `docs/methodik/pruefung-gini.py`, Ausgabe `ergebnis-gini.txt`, Vorlage `pruefung-gini.md`. Alle sieben sind umstritten markiert (abschaltbar, neutral 0) und tragen die Beleg-Art „an Daten kalibriert“. Gezählt wird das Aufkommen, das das Modell einnimmt (mit ausweichender Bemessungsgrundlage).

| Eintrag | Wert | Beleg |
|---|---|---|
| `staat.giniEinkommensteuer` | 0,3 Gini-Punkte je % BIP Aufkommen | Panel −0,29 (t −2,5) bis −0,33 (t −3,0); Zerlegung nach Kakwani 0,39 |
| `staat.giniKapital` | 0,3 Gini-Punkte je % BIP | **dünn belegt:** im Panel nicht getrennt messbar; gleicher Wert wie Einkommensteuer |
| `staat.giniMwst` | 0,1 Gini-Punkte je % BIP (erhöht) | **dünn belegt:** Panel +0,4 (t 2,0 bis 2,5), aber der gemessene Gini enthält Verbrauchsteuern nicht; Wert aus der Belastungsrechnung. OECD/KIPF 2014, im Original **ungeprüft** |
| `staat.giniTransfers` | 0,5 Gini-Punkte je % BIP Familienleistungen | **dünn belegt:** Panel −0,51 (t −1,8) bis −0,59 (t −1,96), Umverteilung ohne Befund; Zerlegung 0,5 |
| `staat.giniRente` | 0,04 Gini-Punkte je Pp. Rentenniveau | **dünn belegt:** Panel −0,038 (t −1,5); Zerlegung 0,045 |
| `staat.armutTransfers` | 0,6 Pp. je % BIP Familienleistungen | Panel −0,57 (t −2,3), Armutsgrenze 60 % des Medians |
| `staat.armutRente` | 0,05 Pp. je Pp. Rentenniveau | **dünn belegt:** über 65-Jährige −0,27 (t −2,8), mal Bevölkerungsanteil 20 %; für alle kein Befund |

Literatur zur Einordnung, alles im Original **ungeprüft**: Joumard/Pisu/Bloch 2012 (OECD), Causa/Hermansen 2017 (OECD), Immervoll/Richardson 2011, Kakwani 1977, OECD/KIPF 2014.

## Politik als Verzerrung (Spec 13.13, 30.09.2026)

### Wirksamkeit der Regierung und Wahltakt

Wirksamkeit: Weltbank Worldwide Governance Indicators, Government Effectiveness Score (`GOV_WGI_GE.SC`, `source=3`, Skala 0–100), Jahr 2025, gerundet; Abruf 30.09.2026. Derselbe Weg wie beim Rechtsstaat (Update 4a). Wahltakt: Legislaturlänge und letztes Wahljahr als feste Daten, keine Prognose; vorgezogene Wahlen kennt der Takt nicht. Die Wahltermine stammen **ungeprüft**.

| Land | Wirksamkeit | Legislatur | letzte Wahl | Gewicht | Wahl |
|---|---|---|---|---|---|
| Deutschland | 83 | 4 | 2025 | 1 | Bundestagswahl |
| USA | 77 | 4 | 2024 | 1 | Präsidentschaftswahl |
| Japan | 94 | 4 | 2024 | 1 | Unterhauswahl (Höchstdauer) |
| Vereinigtes Königreich | 78 | 5 | 2024 | 1 | Unterhauswahl (Höchstdauer) |
| Frankreich | 77 | 5 | 2022 | 1 | Präsidentschaftswahl |
| Italien | 71 | 5 | 2022 | 1 | Parlamentswahl |
| Kanada | 88 | 4 | 2025 | 1 | Unterhauswahl (fester Termin) |
| China | 65 | 5 | 2022 | 0 | Parteitag; kein Wahljahr-Effekt |
| Russland | 42 | 6 | 2024 | 0 | Präsidentschaftswahl; kein Wahljahr-Effekt |

Rückblick Deutschland (Startjahr 2000): Wirksamkeit 89 (WGI 2000: 88,7), Legislatur 4, letzte Wahl 1998.

### Struktur des Landes

| Eintrag | Wert | Quelle |
|---|---|---|
| `politik.sozialSchwelle` | 20 % BIP (Rente, Gesundheit, Familie, Arbeitslosengeld) | Spec 13.13; Setzung. Der Bauplan nannte 25; die Sozialquote des Modells ist enger als die der OECD (Deutschland 21,9) |
| `politik.energieSchwelle` | 0,75 (Anteil importierter Energie) | Spec 13.13; Setzung. Der Bauplan nannte 0,6; damit wären Deutschland und Italien Energie- statt Sozialstaaten |
| `politik.handelSchwelle` | 2 % BIP Leistungsbilanzdefizit | Spec 13.13; Setzung |

### Wirkstärken und Schwellen der Eingriffe

Alle Größen sind Setzungen der Spec 13.13; die genannte Literatur stützt die Richtung der Verzerrung, nicht den Wert, und ist im Original **ungeprüft**. „abschaltbar“ heißt: im Verzeichnis als umstritten markiert, neutral 0.

| Eintrag | Wert | Quelle |
|---|---|---|
| `politik.punktAbstand` | 4 Jahre (nur ohne Wahltakt) | Setzung |
| `politik.druckSchwelle` | 1,0 | Setzung; an der deutschen Probe geprüft, nicht nachgestellt |
| `politik.verspaetung` | 4 Jahre, abschaltbar | Alesina/Drazen 1991, „Why are stabilizations delayed?“ (war of attrition) |
| `politik.umsetzungMin`, `politik.umsetzungSpanne` | 0,3 und 0,5 | Setzung |
| `politik.sperrklinke` | 0,3, abschaltbar | Peacock/Wiseman 1961 (displacement effect) |
| `politik.kalteProgression` | 0,002 je Jahr, abschaltbar | Alesina/Tabellini 1990; Größenordnung kalte Progression Deutschland (BMF Steuerprogressionsbericht) |
| `politik.programm` | 1 % BIP, abschaltbar | Setzung |
| `politik.programmZoll` | 10 Prozentpunkte | Setzung |
| `politik.programmAbstand` | 10 Jahre | Setzung; Spec 13.13: „ab und zu“ |
| `politik.ruecknahme` | 0,3, abschaltbar | Setzung (Beispiel Rente mit 63 nach der Agenda 2010) |
| `politik.wahljahr` | 0 % BIP, abschaltbar | Efthyvoulou 2012; Brender/Drazen 2005; Alt/Lassen 2006; eigene Prüfung `docs/methodik/pruefung-wahltakt.md`: in den Daten der App nicht gesichert (−0,31 Pp., t −1,1 ohne Krisenjahre) |

### Prüfungen

- **Wahltakt:** IWF-Reihen Einnahmen und Ausgaben des Gesamtstaats, sieben Länder, 2001–2024, mit den tatsächlichen Wahljahren (**ungeprüft**). Skript `docs/methodik/pruefung-wahltakt.ts`.
- **Deutsche Probe:** Rückblick 2000–2025 mit gemessenem Wachstum pro Kopf und gemessener Arbeitslosigkeit, tatsächliche Wahljahre. Skript `docs/methodik/probe-deutschland.ts`, Ausgabe `ergebnis-probe.txt`.

