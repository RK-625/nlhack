import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { BackdropBase } from "../components/Backdrop";
import { DotMatrixLogo } from "../components/DotMatrixLogo";
import { Mascot } from "../components/Mascot";
import { AGENTS } from "../data/agents";
import { EXPRESSIONS } from "../lib/expressions";
import { COLORS, FONT_STACK } from "../theme/tokens";

/** Review sheet: every bot at rest (top) and wearing its lineup expression (bottom). */
export const CastSheet = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cell = 180;
  return (
    <AbsoluteFill style={{ fontFamily: FONT_STACK }}>
      <BackdropBase />
      {[false, true].map((expressive, row) => (
        <div
          key={row}
          style={{ position: "absolute", left: 60, top: 140 + row * 440, display: "flex", gap: 0 }}
        >
          {AGENTS.map((agent) => (
            <div key={agent.id} style={{ width: cell, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
              {agent.kind === "shape" ? (
                <Mascot
                  agent={agent}
                  size={160}
                  eyes={expressive ? EXPRESSIONS[agent.signature] : EXPRESSIONS.neutral}
                />
              ) : (
                <div style={{ width: 160, height: 160, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <DotMatrixLogo size={132} frame={frame} fps={fps} pngAt={expressive ? -100 : undefined} />
                </div>
              )}
              <div style={{ color: COLORS.foreground, fontSize: 20, fontWeight: 500, textAlign: "center" }}>{agent.name}</div>
              <div style={{ color: COLORS.muted, fontSize: 16 }}>
                {agent.kind === "shape" ? `${agent.shapeKey} · ${expressive ? agent.signature : agent.hex}` : expressive ? "PNG tile" : "vector dots"}
              </div>
            </div>
          ))}
        </div>
      ))}
    </AbsoluteFill>
  );
};
