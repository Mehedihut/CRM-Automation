import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";
import {
  applyTheme,
  watchSystemTheme,
  useThemeStore,
} from "./lib/theme";

// Sync the DOM with whatever the persisted store says (the inline script in
// index.html already set data-theme, but reapplying here makes the code
// robust if anyone bypasses the inline script).
applyTheme(useThemeStore.getState().theme);
const stopWatching = watchSystemTheme();

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element #root not found in index.html");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// HMR-friendly cleanup: Vite hot-reloads main.tsx during dev.
if (import.meta.hot) {
  import.meta.hot.dispose(() => stopWatching());
}
