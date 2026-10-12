import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { AccentGlow, Dust } from "../components/Backdrop";
import { BlurInText } from "../components/BlurInText";
import { DotMatrixLogo } from "../components/DotMatrixLogo";
import { Mascot } from "../components/Mascot";
import { AGENTS } from "../data/agents";
import { EXPRESSIONS } from "../lib/expressions";
import { blinkAt, clamp, composePose, idle, REST, springEntrance, tween } from "../lib/motion";
import { COLORS, SPRINGS } from "../theme/tokens";

/** Scene 11 — return to the cast, readable URL and a clean final fade. */
export const Scene11EndCard = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const url = tween(frame, [65, 89], [0, 1]);
  const primary = AGENTS[0]!;
  return <AbsoluteFill>
    <AccentGlow color={COLORS.primary} x={50} y={42} w={48} h={43} opacity={0.18} />
    <Dust seed="end-card" count={32} opacity={0.6} />
    {primary.kind === "shape" ? <div style={{ position: "absolute", top: 215, left: 875 }}>
      <Mascot agent={primary} size={170} eyes={EXPRESSIONS.happy} blink={blinkAt(frame, [37, 142])}
        body={composePose(composePose(REST, idle(frame, "end-primary")), springEntrance(frame, fps, 9, -140, SPRINGS.bouncy))} glow={0.6} />
    </div> : null}
    <div style={{ position: "absolute", top: 414, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
      <BlurInText text="Try Bot Company" start={20} stagger={4.2} duration={22}
        style={{ fontSize: 116, letterSpacing: "-0.045em", fontWeight: 600, color: COLORS.foreground }} />
    </div>
    <div style={{ position: "absolute", top: 566, left: 0, right: 0, textAlign: "center" }}>
      <BlurInText text="AI that asks before it acts." start={43} stagger={2.7}
        style={{ fontSize: 40, color: COLORS.mutedStrong, letterSpacing: "-0.02em" }} />
    </div>
    <div style={{ position: "absolute", top: 660, left: 960, padding: "20px 36px", borderRadius: 99,
      border: "1px solid #4a3b65", background: "#1c1627", boxShadow: "0 12px 45px #0008", color: "#e4d8fa",
      fontSize: 36, fontWeight: 500, letterSpacing: "-0.02em", opacity: url,
      transform: `translate(-50%, ${12 * (1 - url)}px) scale(${0.98 + 0.02 * url})` }}>github.com/RK-625/nlhack <span style={{ marginLeft: 14 }}>↗</span></div>
    <div style={{ position: "absolute", top: 802, left: 0, right: 0, textAlign: "center" }}>
      <BlurInText text="Built for neatHack 2026 · Neatlogs · Entire · cfo.ai" start={91} stagger={1.5}
        style={{ fontSize: 26, color: COLORS.mutedStrong }} />
    </div>
    {AGENTS.map((agent, i) => {
      const at = 26 + i * 4;
      const x = 960 + (i - 4.5) * 172;
      const pose = composePose(composePose(REST, idle(frame, `${agent.id}-ending`)), springEntrance(frame, fps, at, 230, SPRINGS.bouncy));
      const size = agent.kind === "neat" ? 112 : 138;
      if (frame < at) return null;
      return <div key={agent.id} style={{ position: "absolute", left: x - size / 2, top: 914,
        transform: agent.kind === "neat" ? `translateY(${pose.y}px)` : undefined,
        opacity: clamp((frame - at) / 8) }}>
        {agent.kind === "neat" ? <DotMatrixLogo size={size} frame={frame} fps={fps} pngAt={-100} pulseAt={87} blinks={[139]} glow={0.5} /> :
          <Mascot agent={agent} size={size} eyes={i % 3 === 0 ? EXPRESSIONS.happy : EXPRESSIONS.neutral}
            blink={blinkAt(frame, [121 + i * 3, 179 + i])} body={pose} glow={0.4} />}
      </div>;
    })}
    <AbsoluteFill style={{ background: "#000", opacity: tween(frame, [195, 209], [0, 1]) }} />
  </AbsoluteFill>;
};
