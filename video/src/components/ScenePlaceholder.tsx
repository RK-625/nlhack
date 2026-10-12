import { AbsoluteFill } from "remotion";
import type { SceneDef } from "../timeline";
import { COLORS, FONT_STACK } from "../theme/tokens";
import { BlurInText } from "./BlurInText";

/** Animatic card for scenes that are not built yet, so the full 82 s timing is reviewable. */
export const ScenePlaceholder = ({ scene, index }: { scene: SceneDef; index: number }) => (
  <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", fontFamily: FONT_STACK }}>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28, maxWidth: 1300, textAlign: "center" }}>
      <div style={{ fontSize: 26, letterSpacing: "0.18em", textTransform: "uppercase", color: COLORS.muted }}>
        Scene {index + 1} · {scene.title} · placeholder
      </div>
      {scene.onScreen ? (
        <BlurInText
          by="word"
          start={8}
          text={scene.onScreen}
          style={{ fontSize: 84, fontWeight: 600, letterSpacing: "-0.035em", color: COLORS.foreground }}
        />
      ) : null}
    </div>
  </AbsoluteFill>
);
