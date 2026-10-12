import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { AccentGlow, Dust } from "../components/Backdrop";
import { Chip } from "../components/Chip";
import { Cursor } from "../components/Cursor";
import { Headline, SOFT } from "../components/Headline";
import { cardMotion, Shot, shotToScreen, Spotlight, UICard } from "../components/UICard";
import type { Rect } from "../data/evidence";
import { CFO_PLAN, SHOTS } from "../data/evidence";
import { clamp, tween } from "../lib/motion";
import { COLORS } from "../theme/tokens";

const CARD = { x: 960, y: 618, w: 1440, h: 720 };
const BEATS = [
  { at: 0, shot: SHOTS.cfoPlanTools, cx: 870, cy: 955, zoom: 1.72,
    focus: CFO_PLAN.tools, focus2: null, label: "Page created", tag: "CFO BOT · FIVE TOOLS", color: "#34d399" },
  { at: 110, shot: SHOTS.cfoPlanApproval, cx: 620, cy: 853, zoom: 1.78,
    focus: CFO_PLAN.title, focus2: { x: 416, y: 1034, w: 140, h: 62 }, label: "Approved", tag: "CFO BOT · APPROVE", color: "#fbbf24" },
  { at: 220, shot: SHOTS.cfoPlanPage, cx: 880, cy: 470, zoom: 1.16,
    focus: CFO_PLAN.page, focus2: null, label: "Saved in cfo.ai", tag: "CFO.AI · OPEN PAGE", color: "#6ee7b7" },
] satisfies Array<{ at: number; shot: typeof SHOTS.cfoPlanTools; cx: number; cy: number; zoom: number; focus: Rect; focus2: Rect | null; label: string; tag: string; color: string }>;

const CLICK = 156;

/** Scene 10b — CFO Bot writes the plan, pauses on Approve, and the page opens in cfo.ai. */
export const Scene10bCfoPlan = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const current = BEATS.reduce((last, beat, i) => frame >= beat.at ? i : last, 0);
  const active = BEATS[current]!;
  const push = clamp(frame / 360);
  const approve = BEATS[1]!;
  const approveCam = {
    cx: approve.cx,
    cy: approve.cy,
    zoom: approve.zoom + clamp((frame - approve.at) / 90) * 0.035,
  };
  const target = shotToScreen(
    CARD,
    cardMotion(frame, fps, 4, push),
    approve.shot,
    approveCam,
    CFO_PLAN.approvePoint.x,
    CFO_PLAN.approvePoint.y,
  );
  return <AbsoluteFill>
    <AccentGlow color={frame < CLICK ? active.color : "#34d399"} x={50} y={60} w={55} h={42} opacity={0.12} />
    <Dust seed="cfo-plan" count={23} opacity={0.55} />
    <UICard geom={CARD} enterAt={4} push={push}>
      {BEATS.map((beat, i) => {
        const local = frame - beat.at;
        const incoming = i === 0 ? 1 : tween(frame, [beat.at, beat.at + 13], [0, 1]);
        const outgoing = i === BEATS.length - 1 ? 1 : 1 - tween(frame, [BEATS[i + 1]!.at, BEATS[i + 1]!.at + 13], [0, 1]);
        const opacity = incoming * outgoing;
        if (opacity <= 0) return null;
        const camera = { cx: beat.cx, cy: beat.cy, zoom: beat.zoom + clamp(local / 90) * 0.035 };
        const spot = tween(local, [13, 28], [0, i === 0 ? 0.42 : 0.34]);
        return <Shot key={beat.at} shot={beat.shot} camera={camera} opacity={opacity} blur={(1 - incoming) * 9}>
          <Spotlight {...beat.focus} amount={spot} radius={18} feather={22} />
          {beat.focus2 ? <Spotlight {...beat.focus2} amount={spot} radius={16} feather={14} /> : null}
        </Shot>;
      })}
    </UICard>
    <Headline start={14} text={[{ text: "CFO Bot writes the plan." }, { text: " Saved in cfo.ai.", pause: 200, style: SOFT }]} />
    <div style={{ position: "absolute", left: 960, top: 182, transform: "translateX(-50%)", fontSize: 20,
      letterSpacing: "0.13em", color: COLORS.mutedStrong }}>{active.tag}</div>
    {BEATS.map((beat, i) => <div key={beat.at} style={{ position: "absolute", left: 960, top: 1008, transform: "translateX(-50%)" }}>
      <Chip label={beat.label} icon={i === 1 ? "spinner" : "check"} checkAt={i === 1 ? CLICK + 8 : beat.at + 28}
        color={i === 1 && frame >= CLICK ? "#34d399" : beat.color}
        enterAt={i === 1 ? CLICK : beat.at + 21} exitAt={BEATS[i + 1]?.at} />
    </div>)}
    <Cursor keys={[
      { f: 124, x: target.x + 480, y: target.y + 190 },
      { f: CLICK - 15, x: target.x + 3, y: target.y + 2, arc: 0.16 },
      { f: CLICK + 9, x: target.x + 3, y: target.y + 2 },
      { f: CLICK + 28, x: target.x + 230, y: target.y - 120, arc: -0.15 },
    ]} clicks={[CLICK]} appearAt={124} hideAt={208} rippleColor="rgba(139,92,246,0.95)" />
  </AbsoluteFill>;
};
