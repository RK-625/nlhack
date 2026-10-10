import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { applyResolvedAppearance, applyUiAppearance, watchSystemAppearance } from "./lib/appearance";
import "./styles.css";

// ?theme=light|dark forces a theme for this load only (matches the pre-paint script in index.html).
const forcedTheme = new URLSearchParams(window.location.search).get("theme");
const themeForced = forcedTheme === "light" || forcedTheme === "dark";
if (themeForced) applyResolvedAppearance(forcedTheme);
else applyUiAppearance();

function AppearanceSync() {
  useEffect(() => (themeForced ? undefined : watchSystemAppearance()), []);
  return null;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppearanceSync />
    <App />
  </StrictMode>,
);
