import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
// Schriften aus dem Paket statt von Google Fonts: keine Anfrage an fremde Server (Datenschutz).
import "@fontsource/fredoka/500.css";
import "@fontsource/fredoka/600.css";
import "@fontsource/nunito/400.css";
import "@fontsource/nunito/600.css";
import "@fontsource/nunito/700.css";
import "@fontsource/nunito/800.css";
import "./stil.css";
import { ladeFarbmodus, wendeFarbmodusAn } from "./farbmodus";

// Vor dem ersten Bild, damit nichts aufflackert.
wendeFarbmodusAn(ladeFarbmodus());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
