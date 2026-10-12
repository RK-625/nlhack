import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { AccentGlow, Dust } from "../components/Backdrop";
import { Chip, StatusPill } from "../components/Chip";
import { Cursor } from "../components/Cursor";
import { Headline } from "../components/Headline";
import type { FramingKey } from "../components/UICard";
import { cardMotion, framingAt, Shot, shotToScreen, Spotlight, UICard } from "../components/UICard";
import { CAP_APPROVED, SHOTS } from "../data/evidence";
import { bump, clamp, tween } from "../lib/motion";
import { COLORS, FONT_STACK } from "../theme/tokens";

const CARD = { x: 960, y: 610, w: 1440, h: 700, radius: 22 };
const SHOT = SHOTS.capApproved;
const T = { enter: 2, stop: 22, cursor: 66, click: 113, reveal: 125, resume: 159 };
const PENDING = { ...CAP_APPROVED.card, h: 266 };
// Recreated from MessageBubble.tsx / shot 01; the token-limit title is from shot 21.
// No pending capture of this particular run exists. The approved pixels are genuine.
const APPROVE = { x: PENDING.x + 109, y: PENDING.y + 185 };
const CAMERA: FramingKey[] = [
  { f: 0, cx: 1440, cy: 1215, zoom: 1.45 },
  { f: 50, cx: 1330, cy: 1290, zoom: 1.9, hold: true },
  { f: 125, cx: 1330, cy: 1290, zoom: 1.92 },
  { f: 177, cx: 1340, cy: 1290, zoom: 1.94, hold: true },
  { f: 255, cx: 1340, cy: 1305, zoom: 1.99 },
];

/** Pending UI reconstructed from the app, preserving the captured run's exact title. */
const PendingCard = ({ frame }: { frame: number }) => {
  const opacity = 1 - tween(frame, [T.reveal, T.reveal + 12], [0, 1]);
  const press = bump(frame - T.click, 2, 2, 7);
  if (opacity <= 0) return null;
  return (
    <div style={{ position: "absolute", left: PENDING.x, top: PENDING.y, width: PENDING.w, height: PENDING.h,
      padding: "27px 36px", boxSizing: "border-box", background: "#f5f5f3", border: "1px solid #e9e9e6",
      borderRadius: 40, fontFamily: FONT_STACK, opacity, color: "#303030", boxShadow: "0 18px 34px rgba(0,0,0,0.04)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16, fontSize: 27, fontWeight: 550, lineHeight: 1.45 }}>
        <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={1.8} style={{ flexShrink: 0, marginTop: 5 }}>
          <path d="M8 3h8l5 5v8l-5 5H8l-5-5V8Z" /><path d="M12 7v6m0 3v1" />
        </svg>
        <span>This reply hit its 300k token limit after 302k. Finishing needs about $0.05 more.</span>
      </div>
      <div style={{ fontSize: 24, lineHeight: 1.45, color: "#65656b", marginTop: 13 }}>
        Approve to finish this reply with a one-time extension; your limit stays as it is. Deny to get the best answer from what was gathered. Or raise the limit from the bot name ▾.
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 16, fontSize: 25, lineHeight: 1, fontWeight: 550 }}>
        <div style={{ width: 147, height: 46, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          background: "#202020", color: "#fff", transform: `scale(${1 - press * 0.05})` }}>
          <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="m5 12 4 4L19 6" /></svg>
          Approve
        </div>
        <div style={{ width: 116, height: 46, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          border: "1px solid #e5e5e2", background: "#fafaf9", fontWeight: 400 }}>
          <svg width={21} height={21} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="m6 6 12 12M6 18 18 6" /></svg>
          Deny
        </div>
      </div>
    </div>
  );
};

/** Scene 5 — pause at the limit, explicitly approve, then continue. */
export const Scene05Guardrails = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const push = clamp(frame / (8 * fps));
  const cam = framingAt(frame, CAMERA);
  const motion = cardMotion(frame, fps, T.enter, push);
  const target = shotToScreen(CARD, motion, SHOT, cam, APPROVE.x, APPROVE.y);
  const reveal = tween(frame, [T.reveal, T.reveal + 12], [0, 1]);
  const spotlight = tween(frame, [16, 35], [0, 0.68]);
  const focus = { x: PENDING.x - 10, y: PENDING.y - 8, w: PENDING.w + 20, h: PENDING.h + 16 - 108 * reveal };
  return (
    <AbsoluteFill>
      <AccentGlow color={frame < T.reveal ? "#f59e0b" : "#10b981"} x={50} y={60} w={52} h={44} opacity={0.14} />
      <Dust seed="guardrails" count={24} opacity={0.55} />
      <UICard geom={CARD} enterAt={T.enter} push={push}>
        <Shot shot={SHOT} camera={cam}>
          {/* Until approval, the captured "Working" row must not show through. */}
          <div style={{ position: "absolute", left: 620, top: 1375, width: 600, height: 150, background: "#fafaf9", opacity: 1 - reveal }} />
          <PendingCard frame={frame} />
          <Spotlight {...focus} amount={spotlight} radius={38} feather={30} />
        </Shot>
      </UICard>
      <div style={{ position: "absolute", left: 960, top: 186, transform: "translateX(-50%)" }}>
        <StatusPill label="Limit reached. Waiting for you." color="#f59e0b" enterAt={T.stop} exitAt={T.click + 2} />
        <Chip label="Approved: one-time extension granted" icon="spinner" color="#10b981" checkAt={T.reveal + 12}
          enterAt={T.reveal} size="lg" />
      </div>
      <div style={{ position: "absolute", left: 960, top: 1000, transform: "translateX(-50%)" }}>
        <StatusPill label="Primary Bot is continuing…" color={COLORS.primary} enterAt={T.resume} />
      </div>
      {/* Relative waypoints follow the gently moving screenshot so the hotspot stays on Approve. */}
      <Cursor keys={[
        { f: T.cursor, x: target.x + 480, y: target.y + 190 },
        { f: T.click - 15, x: target.x + 3, y: target.y + 2, arc: 0.16 },
        { f: T.click + 9, x: target.x + 3, y: target.y + 2 },
        { f: T.click + 30, x: target.x + 230, y: target.y + 150, arc: -0.15 },
      ]} clicks={[T.click]} appearAt={T.cursor} hideAt={T.reveal + 3} rippleColor="rgba(139,92,246,0.95)" />
      <Headline start={14} text="Nothing happens without you." />
    </AbsoluteFill>
  );
};
