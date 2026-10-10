import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { applyUiAppearance, watchSystemAppearance } from "./lib/appearance";
import "./styles.css";

applyUiAppearance();

function AppearanceSync() {
  useEffect(() => watchSystemAppearance(), []);
  return null;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppearanceSync />
    <App />
  </StrictMode>,
);
