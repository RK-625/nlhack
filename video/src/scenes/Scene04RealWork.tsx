import { AbsoluteFill, Easing, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { AccentGlow, Dust } from "../components/Backdrop";
import { Chip, StatusPill } from "../components/Chip";
import { Cursor } from "../components/Cursor";
import { Headline, SOFT } from "../components/Headline";
import { Mascot } from "../components/Mascot";
import type { FramingKey } from "../components/UICard";
import { cardMotion, framingAt, Highlight, Shot, shotToScreen, Spotlight, STAGE_CARD, UICard } from "../components/UICard";
import type { ShapeAgent } from "../data/agents";
import { AGENTS } from "../data/agents";
import { SHOTS, US_RUN } from "../data/evidence";
import { EXPRESSIONS } from "../lib/expressions";
import { bump, clamp, lerp, tween } from "../lib/motion";
import { formatTokens, formatUsd, isWarn } from "../lib/usage-format";
import { COLORS, FONT_STACK } from "../theme/tokens";

const CARD = STAGE_CARD;
const ENTER = 2;
const SHOT = SHOTS.usRunning;
const M = US_RUN.meter;

/** Beats (scene-local frames; 0–15 is the incoming blur-dissolve). */
const T = {
  pillIn: 16,
  typeFrom: 26,
  send: 100,
  fly: 104,
  chipResearch: 146,
  chipCfo: 154,
  chipsOut: 180,
  climbFrom: 190,
  climbTo: 216,
  crossfade: 216,
} as const;

const CAMERA: FramingKey[] = [
  { f: 0, cx: 1512, cy: 869, zoom: 1 },
  { f: T.send, cx: 1512, cy: 869, zoom: 1.05 },
  // the sent message, the Primary Bot's replies and its delegations
  { f: 132, cx: 1800, cy: 1049, zoom: 1.26 },
  { f: 152, cx: 1320, cy: 1226, zoom: 1.7, hold: true },
  { f: 178, cx: 1320, cy: 1226, zoom: 1.72 },
  // up to the live cost / token meters
  { f: 204, cx: 1796, cy: 435, zoom: 2.0 },
  { f: 255, cx: 1796, cy: 435, zoom: 2.08 },
];

/** Human-ish typing: seeded per-character delays, a touch longer after spaces. */
const QUESTION = US_RUN.question;
const CHAR_AT: number[] = (() => {
  const out: number[] = [];
  let f = T.typeFrom;
  for (let i = 0; i < QUESTION.length; i++) {
    out.push(f);
    f += 0.36 + random(`type-${i}`) * 0.3 + (QUESTION[i] === " " ? 0.22 : 0);
  }
  return out;
})();
const typedAt = (frame: number) => CHAR_AT.filter((f) => f <= frame).length;

/** Pill geometry (frame px). */
const PILL = { x: 960, y: 872, w: 1200, h: 142 };
const SEND_BTN = { x: PILL.x + PILL.w / 2 - 22 - 27, y: PILL.y + PILL.h / 2 - 22 - 27 };

/** Live counters: eased climb from the shot-19 values to the shot-20 values. */
const climb = (frame: number) => Easing.inOut(Easing.quad)(clamp((frame - T.climbFrom) / (T.climbTo - T.climbFrom)));
const usageAt = (frame: number) => {
  const c = climb(frame);
  return { cost: lerp(M.from.cost, M.to.cost, c), tokens: lerp(M.from.tokens, M.to.tokens, c) };
};
/** First frame the token bar turns amber (≥ 80%) — the "Nearing the cap" pill keys off it. */
const WARN_AT = (() => {
  for (let f = T.climbFrom; f <= T.climbTo; f++) if (isWarn(usageAt(f).tokens, M.cap.tokens)) return f;
  return T.climbTo;
})();

const Bar = ({ box, used, cap, frame, warnAt }: { box: { x: number; y: number; w: number; h: number }; used: number; cap: number; frame: number; warnAt: number }) => {
  const warn = clamp((frame - warnAt) / 5);
  const color = warn <= 0 ? M.normal : warn >= 1 ? M.warn : mixHex(M.normal, M.warn, warn);
  return (
    <div style={{ position: "absolute", left: box.x - 2, top: box.y - 3, width: box.w + 4, height: box.h + 6, background: "#ffffff" }}>
      <div style={{ position: "absolute", left: 2, top: 3, width: box.w, height: box.h, borderRadius: box.h / 2, background: M.track, overflow: "hidden" }}>
        <div style={{ width: `${clamp(used / cap) * 100}%`, height: "100%", borderRadius: box.h / 2, background: color }} />
      </div>
    </div>
  );
};

const mixHex = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(lerp(v, pb[i]!, t))).join(",")})`;
};

/** The app's usage popover numbers, re-set live over shot 19 (screenshot pixels). */
const MeterOverlay = ({ frame }: { frame: number }) => {
  const u = usageAt(frame);
  const costWarnAt = (() => {
    for (let f = T.climbFrom; f <= T.climbTo; f++) if (isWarn(usageAt(f).cost, M.cap.cost)) return f;
    return Number.POSITIVE_INFINITY;
  })();
  const text = { fontFamily: FONT_STACK, fontSize: M.fontSize, fill: M.ink, fontVariantNumeric: "tabular-nums" } as const;
  return (
    <>
      {/* blank out the captured values, then draw the climbing ones on the same baseline */}
      <div style={{ position: "absolute", left: 1585, top: 138, width: 200, height: 38, background: "#ffffff" }} />
      <div style={{ position: "absolute", left: 1950, top: 138, width: 200, height: 38, background: "#ffffff" }} />
      <svg width={3024} height={300} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <text x={M.costValue.right} y={M.costValue.baseline} textAnchor="end" style={text}>
          {`${formatUsd(u.cost)} / ${formatUsd(M.cap.cost)}`}
        </text>
        <text x={M.tokensValue.right} y={M.tokensValue.baseline} textAnchor="end" style={text}>
          {`${formatTokens(u.tokens)} / ${formatTokens(M.cap.tokens)}`}
        </text>
      </svg>
      <Bar box={M.costBar} used={u.cost} cap={M.cap.cost} frame={frame} warnAt={costWarnAt} />
      <Bar box={M.tokensBar} used={u.tokens} cap={M.cap.tokens} frame={frame} warnAt={WARN_AT} />
    </>
  );
};

/** The question, typed into an enlarged copy of the app's composer. */
const PromptPill = ({ frame, fps, flyTo }: { frame: number; fps: number; flyTo: { x: number; y: number; w: number } }) => {
  const pIn = spring({ frame: frame - T.pillIn, fps, config: { damping: 18, stiffness: 140, mass: 0.8 } });
  const fly = spring({ frame: frame - T.fly, fps, config: { damping: 20, stiffness: 110, mass: 0.8 } });
  const opacity = clamp(pIn * 1.5) * (1 - clamp((fly - 0.35) / 0.45));
  if (opacity <= 0.001) return null;
  const n = typedAt(frame);
  const typing = frame >= T.typeFrom && n < QUESTION.length;
  const caretOn = typing || Math.floor((frame - T.typeFrom) / 9) % 2 === 0;
  const press = bump(frame - T.send, 2, 2, 6);
  const ready = n > 0;
  const x = lerp(PILL.x, flyTo.x, fly);
  const y = lerp(PILL.y, flyTo.y, fly) + 16 * (1 - pIn);
  const scale = lerp(1, flyTo.w / PILL.w, fly) * (0.94 + 0.06 * pIn);
  return (
    <div
      style={{
        position: "absolute",
        left: x - PILL.w / 2,
        top: y - PILL.h / 2,
        width: PILL.w,
        height: PILL.h,
        transform: `scale(${scale})`,
        opacity,
        filter: pIn < 0.97 || fly > 0.02 ? `blur(${6 * (1 - clamp(pIn)) + 5 * fly}px)` : undefined,
        borderRadius: 30,
        background: "#ffffff",
        border: "1px solid #e4e4e1",
        boxShadow: "0 40px 90px -20px rgba(0,0,0,0.75), 0 12px 30px rgba(0,0,0,0.35), 0 0 0 6px rgba(139,92,246,0.14)",
        fontFamily: FONT_STACK,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 34,
          top: 28,
          right: 110,
          fontSize: 31,
          lineHeight: 1.38,
          color: "#1b1b1c",
          letterSpacing: "-0.01em",
        }}
      >
        {n === 0 ? <span style={{ color: "#9a9a97" }}>Message Primary Bot</span> : QUESTION.slice(0, n)}
        <span
          style={{
            display: "inline-block",
            width: 2.5,
            height: 36,
            marginLeft: 2,
            verticalAlign: "-7px",
            background: COLORS.primary,
            opacity: caretOn && fly < 0.05 ? 1 : 0,
          }}
        />
      </div>
      {/* send button: grey until there is text, then the app's dark filled arrow */}
      <div
        style={{
          position: "absolute",
          right: 22,
          bottom: 22,
          width: 54,
          height: 54,
          borderRadius: "50%",
          background: ready ? "#171717" : "#ececea",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${1 - 0.12 * press})`,
        }}
      >
        <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke={ready ? "#ffffff" : "#a3a3a0"} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      </div>
    </div>
  );
};

const RESEARCH = AGENTS.find((a) => a.id === "market-researcher") as ShapeAgent;
const CFO = AGENTS.find((a) => a.id === "cfo") as ShapeAgent;

const MiniBot = ({ agent }: { agent: ShapeAgent }) => (
  <div style={{ width: 34, height: 34, marginRight: -2 }}>
    <Mascot agent={agent} size={34} eyes={EXPRESSIONS.neutral} glow={0} shadow={0} />
  </div>
);

/** Scene 4 — "Real work. Live costs.": the live US-expansion run, shots 19 → 20. */
export const Scene04RealWork = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const push = clamp(frame / (8 * fps));
  const cam = framingAt(frame, CAMERA);
  const motion = cardMotion(frame, fps, ENTER, push);
  const at = (x: number, y: number) => shotToScreen(CARD, motion, SHOT, cam, x, y);

  const dim = tween(frame, [T.pillIn, T.pillIn + 14], [0, 0.5]) * (1 - tween(frame, [T.send + 2, T.send + 18], [0, 1]));
  const bubble = US_RUN.userBubble;
  const bubbleCenter = at(bubble.x + bubble.w / 2, bubble.y + bubble.h / 2);
  const bubbleGlow = bump(frame - (T.fly + 8), 8, 22, 16);
  const delegSpot = tween(frame, [T.chipResearch - 8, T.chipResearch + 6], [0, 0.32]) * (1 - tween(frame, [T.chipsOut - 4, T.chipsOut + 8], [0, 1]));
  const meterSpot = tween(frame, [T.climbFrom - 10, T.climbFrom + 6], [0, 0.5]);
  const to20 = tween(frame, [T.crossfade, T.crossfade + 10], [0, 1]);

  // chips sit just right of the real "Delegated to …" rows
  const rowR = at(US_RUN.researchRow.x + 340, US_RUN.researchRow.y);
  const rowC = at(US_RUN.cfoRow.x + 340, US_RUN.cfoRow.y);
  const chipsMidY = (rowR.y + rowC.y) / 2;
  const pop = at(US_RUN.popover.x + US_RUN.popover.w / 2, US_RUN.popover.y + US_RUN.popover.h);

  return (
    <AbsoluteFill>
      <AccentGlow color={COLORS.primary} x={50} y={60} w={60} h={50} opacity={0.12} />
      <Dust seed="realwork" count={22} opacity={0.5} />
      <UICard geom={CARD} enterAt={ENTER} push={push}>
        <Shot shot={SHOT} camera={cam}>
          <MeterOverlay frame={frame} />
        </Shot>
        <Shot shot={SHOTS.usNearCap} camera={cam} opacity={to20} />
        <Shot shot={SHOT} camera={cam} bare>
          <Highlight {...bubble} progress={bubbleGlow} radius={44} stroke={5} />
          <Spotlight {...US_RUN.delegations} amount={delegSpot} radius={22} feather={56} />
          <Spotlight {...US_RUN.popover} amount={meterSpot} radius={34} feather={18} />
        </Shot>
        <AbsoluteFill style={{ background: "rgba(8,9,11,1)", opacity: dim }} />
      </UICard>

      {/* delegation chips — the two hand-offs from scene 3, now in the real UI */}
      <div style={{ position: "absolute", left: Math.max(rowR.x, rowC.x) + 36, top: chipsMidY - 64, display: "flex", flexDirection: "column", gap: 14 }}>
        <Chip
          label="Delegated to Research Bot"
          icon="spinner"
          color={RESEARCH.colorDef.light}
          leading={<MiniBot agent={RESEARCH} />}
          enterAt={T.chipResearch}
          exitAt={T.chipsOut}
        />
        <Chip
          label="Delegated to CFO Bot"
          icon="spinner"
          color={CFO.colorDef.light}
          leading={<MiniBot agent={CFO} />}
          enterAt={T.chipCfo}
          exitAt={T.chipsOut}
        />
      </div>

      {/* when the token bar crosses 80% the app turns it amber */}
      <div style={{ position: "absolute", left: pop.x, top: pop.y + 40, transform: "translateX(-50%)" }}>
        <StatusPill label="Nearing the 300k token cap" color={M.warn} enterAt={WARN_AT} />
      </div>

      <PromptPill frame={frame} fps={fps} flyTo={{ x: bubbleCenter.x, y: bubbleCenter.y, w: bubble.w * bubbleCenter.scale }} />

      <Cursor
        keys={[
          { f: 70, x: 1640, y: 1060 },
          { f: 96, x: SEND_BTN.x + 4, y: SEND_BTN.y + 6, arc: 0.22 },
          { f: 106, x: SEND_BTN.x + 4, y: SEND_BTN.y + 6 },
          { f: 124, x: SEND_BTN.x + 120, y: SEND_BTN.y + 150, arc: -0.15 },
        ]}
        clicks={[T.send]}
        appearAt={70}
        hideAt={106}
      />

      <Headline start={14} text={[{ text: "Primary Bot." }, { text: " Live costs.", pause: 5, style: SOFT }]} />
    </AbsoluteFill>
  );
};
