import { AbsoluteFill, useCurrentFrame } from "remotion";
import { AccentGlow, Dust } from "../components/Backdrop";
import { Chip } from "../components/Chip";
import { Headline } from "../components/Headline";
import type { Rect } from "../data/evidence";
import { SHOTS } from "../data/evidence";
import { Shot, Spotlight, UICard } from "../components/UICard";
import { clamp, tween } from "../lib/motion";
import { COLORS } from "../theme/tokens";

const BEATS = [
  { at: 0, shot: SHOTS.cappedTrace, cx: 1040, cy: 555, zoom: 1.08,
    focus: { x: 365, y: 245, w: 1165, h: 160 }, label: "Capped turns leave an error trace", tag: "LIVE RUN · TOKEN CAP", color: "#f87171" },
  { at: 84, shot: SHOTS.diagnosis, cx: 1170, cy: 415, zoom: 1.16,
    focus: { x: 425, y: 43, w: 1310, h: 200 }, label: "Northwind example: no final answer", tag: "NORTHWIND · TRACE DIAGNOSIS", color: "#c4b5fd" },
  { at: 174, shot: SHOTS.waste, cx: 1160, cy: 570, zoom: 1.16,
    focus: { x: 433, y: 371, w: 1295, h: 162 }, label: "Waste found: duplicated retrieval", tag: "NORTHWIND · WASTE FOUND", color: "#fbbf24" },
  { at: 264, shot: SHOTS.fixes, cx: 1160, cy: 860, zoom: 1.16,
    focus: { x: 440, y: 890, w: 1330, h: 102 }, label: "Ranked fix: share context, cap output", tag: "NORTHWIND · RANKED FIXES", color: "#34d399" },
] satisfies Array<{ at: number; shot: typeof SHOTS.diagnosis; cx: number; cy: number; zoom: number; focus: Rect; label: string; tag: string; color: string }>;

/** Scene 8 — real trace, verdict, repeated work, and the implemented shared-context fix. */
export const Scene08Diagnosis = () => {
  const frame = useCurrentFrame();
  const current = BEATS.reduce((last, beat, i) => frame >= beat.at ? i : last, 0);
  const active = BEATS[current]!;
  return <AbsoluteFill>
    <AccentGlow color={active.color} x={50} y={60} w={55} h={42} opacity={0.1} />
    <Dust seed="diagnosis" count={23} opacity={0.55} />
    <UICard geom={{ x: 960, y: 618, w: 1440, h: 720 }} enterAt={4} push={clamp(frame / 360)}>
      {BEATS.map((beat, i) => {
        const local = frame - beat.at;
        const incoming = i === 0 ? 1 : tween(frame, [beat.at, beat.at + 13], [0, 1]);
        const outgoing = i === BEATS.length - 1 ? 1 : 1 - tween(frame, [BEATS[i + 1]!.at, BEATS[i + 1]!.at + 13], [0, 1]);
        const opacity = incoming * outgoing;
        if (opacity <= 0) return null;
        const camera = { cx: beat.cx, cy: beat.cy, zoom: beat.zoom + clamp(local / 90) * 0.035 };
        return <Shot key={beat.at} shot={beat.shot} camera={camera} opacity={opacity} blur={(1 - incoming) * 9}>
          <Spotlight {...beat.focus} amount={tween(local, [13, 28], [0, i === 0 ? 0.18 : 0.58])} radius={18} feather={24} />
        </Shot>;
      })}
    </UICard>
    <Headline start={14} text="It reads every trace." />
    <div style={{ position: "absolute", left: 960, top: 182, transform: "translateX(-50%)", fontSize: 20,
      letterSpacing: "0.13em", color: COLORS.mutedStrong }}>{active.tag}</div>
    {BEATS.map((beat, i) => <div key={beat.at} style={{ position: "absolute", left: 960, top: 1008, transform: "translateX(-50%)" }}>
      <Chip label={beat.label} icon={i === 0 ? "dot" : "spinner"} checkAt={beat.at + 33} color={beat.color}
        enterAt={beat.at + 21} exitAt={BEATS[i + 1]?.at} />
    </div>)}
  </AbsoluteFill>;
};
