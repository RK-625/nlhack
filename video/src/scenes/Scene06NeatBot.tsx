import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { NL_DOTS, NL_DOT_RADIUS } from "../assets/nl-dots";
import { AccentGlow, Dust } from "../components/Backdrop";
import { DotMatrixLogo } from "../components/DotMatrixLogo";
import { BlurInText } from "../components/BlurInText";
import { StatusPill } from "../components/Chip";
import { clamp, lerp, tween } from "../lib/motion";
import { COLORS } from "../theme/tokens";

/** Scene 6 — the familiar dot mark becomes the agent that inspects your runs. */
export const Scene06NeatBot = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const burst = tween(frame, [12, 33], [0, 1]) * (1 - tween(frame, [34, 65], [0, 1]));
  const settle = tween(frame, [42, 84], [0, 1]);
  const size = lerp(270, 230, settle);
  const x = lerp(960, 620, settle);
  const y = 540 + Math.sin(frame / 13) * 4;
  const hero = 1 - tween(frame, [15, 30], [0, 1]);
  const formed = tween(frame, [37, 56], [0, 1]);
  return <AbsoluteFill>
    <AccentGlow color="#b6bbd1" x={43} y={51} w={45} h={42} opacity={0.15} />
    <Dust seed="neat-intro" count={36} opacity={0.6} />
    <div style={{ position: "absolute", left: 960 - 135, top: 405, opacity: hero }}>
      <DotMatrixLogo size={270} frame={frame} fps={fps} pngAt={-100} glow={0.8} />
    </div>
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: burst > 0 ? 1 : 0 }}>
      {NL_DOTS.map(([dx, dy], i) => {
        const a = i * 2.39996;
        const distance = 70 + (i % 11) * 15;
        const px = (dx - 100) * 1.35 + Math.cos(a) * distance * burst;
        const py = (dy - 100) * 1.35 + Math.sin(a) * distance * burst;
        return <circle key={i} cx={x + px} cy={y + py} r={NL_DOT_RADIUS * 1.35} fill="#ececee"
          opacity={clamp(burst * 3) * (1 - formed)} />;
      })}
    </svg>
    <div style={{ position: "absolute", left: x - size / 2, top: y - size / 2, opacity: formed,
      transform: `scale(${0.94 + 0.06 * settle})` }}>
      <DotMatrixLogo size={size} frame={frame} fps={fps} assembleAt={36} pngAt={76} pulseAt={88} blinks={[114]} glow={0.8} />
    </div>
    <div style={{ position: "absolute", left: 810, top: 415, width: 820 }}>
      <BlurInText text="Meet Neat Bot." start={54} stagger={4} duration={20}
        style={{ fontSize: 94, fontWeight: 600, letterSpacing: "-0.045em", color: COLORS.foreground }} />
      <div style={{ height: 24 }} />
      <BlurInText text="Your agents. Under a microscope." start={76} stagger={2.5}
        style={{ fontSize: 34, fontWeight: 450, color: COLORS.mutedStrong }} />
      <div style={{ height: 35 }} />
      <StatusPill label="Reading traces…" color="#b8b9d8" enterAt={99} />
    </div>
  </AbsoluteFill>;
};
