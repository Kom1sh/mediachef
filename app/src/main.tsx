import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
// Fonts are bundled, never fetched: the app runs offline, so a Google Fonts link
// would leave the interface in a fallback face on exactly the machines it is
// built for. @fontsource ships the woff2 next to the CSS, and each of these
// files carries the cyrillic subsets alongside latin — the UI is bilingual.
import "@fontsource/unbounded/600.css";
import "@fontsource/unbounded/700.css";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
