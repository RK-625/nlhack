import { LazyMotion, MotionConfig } from "motion/react";
import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { applyResolvedAppearance, applyUiAppearance, watchSystemAppearance } from "./lib/appearance";
import { loadMotionFeatures } from "./lib/motion";
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
    {/* reducedMotion="user": with prefers-reduced-motion, transforms and layout moves are dropped (opacity stays). */}
    <MotionConfig reducedMotion="user">
      {/* strict: only the lean `m.*` components are allowed; features load lazily. */}
      <LazyMotion features={loadMotionFeatures} strict>
        <App />
      </LazyMotion>
    </MotionConfig>
  </StrictMode>,
);
