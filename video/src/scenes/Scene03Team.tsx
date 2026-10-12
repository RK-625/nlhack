import { AbsoluteFill, Easing, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { AccentGlow, Dust } from "../components/Backdrop";
import { Dolly } from "../components/Camera";
import { DotMatrixLogo } from "../components/DotMatrixLogo";
import { Headline, SOFT } from "../components/Headline";
import { Mascot } from "../components/Mascot";
import type { Agent, ShapeAgent } from "../data/agents";
import { AGENTS } from "../data/agents";
import type { Expression } from "../lib/expressions";
import { blendExpression, EXPRESSIONS } from "../lib/expressions";
import { blinkAt, bump, clamp, composePose, hop, idle, idleBlinks, lerp, REST, tween } from "../lib/motion";
import { COLORS, FONT_STACK, SPRINGS } from "../theme/tokens";

/** Hub layout (frame pixels). The ring is an ellipse so it reads as a tilted orbit. */
const HUB = { x: 960, y: 604 };
const RX = 700;
const RY = 286;
const PRIMARY_SIZE = 212;
const SPEC_SIZE = 134;
const NEAT_SIZE = 106;

const PRIMARY = AGENTS[0] as ShapeAgent;
const SPECIALISTS: Agent[] = AGENTS.slice(1).filter(a => a.kind === "shape");

/** Short labels, as the storyboard names them. */
const LABEL: Record<string, string> = {
  "market-researcher": "Research",
  cfo: "CFO",
  "customer-success": "Customer Success",
  legal: "Legal",
  hr: "HR",
  marketing: "Marketing",
  sales: "Sales",
  github: "GitHub",
  neatlogs: "Neat Bot",
};

/** Final angle of each specialist: 40° apart, none straight above the hub (headline). */
const ANGLE = SPECIALISTS.map((_, i) => ((-110 + (360 / SPECIALISTS.length) * i) * Math.PI) / 180);

/** Beats (scene-local frames; 0–15 is the incoming blur-dissolve). */
const T = {
  primaryIn: 4,
  orbitIn: 18,
  orbitStagger: 4,
  linesAt: 58,
  lineStagger: 4,
  lineDraw: 18,
} as const;

const DEG = Math.PI / 180;
/** Slow drift of the whole ring (~1.2°/s) so the hub never freezes. */
const drift = (frame: number) => (frame / 30) * 1.2 * DEG;

type Packet = { to: number; at: number; back?: boolean; travel: number };
/** Hand-offs: Primary → Research, Primary → CFO, then both report back (matches scene 4). */
const PACKETS: Packet[] = [
  { to: 0, at: 116, travel: 22 },
  { to: 1, at: 132, travel: 22 },
  { to: 0, at: 178, travel: 22, back: true },
  { to: 1, at: 190, travel: 22, back: true },
  ...Array.from({length:6}, (_,i)=>({to:i+2,at:140+i*9,travel:22,back:false})),
  ...Array.from({length:6}, (_,i)=>({to:i+2,at:190+i*6,travel:22,back:true})),
];
const arrivals = (i: number) => PACKETS.filter((p) => p.to === i && !p.back).map((p) => p.at + p.travel);
const RETURNS = PACKETS.filter((p) => p.back).map((p) => p.at + p.travel);

const lineDelay = (i: number) => T.linesAt + i * T.lineStagger;
const labelAt = (i: number) => lineDelay(i) + T.lineDraw - 4;

/** Where specialist i is on this frame (orbit-in spiral, then the slow drift). */
const placeOf = (i: number, frame: number, fps: number) => {
  const p = spring({
    frame: frame - (T.orbitIn + i * T.orbitStagger),
    fps,
    config: { damping: 15, stiffness: 70, mass: 0.9 },
  });
  const a = ANGLE[i]! + drift(frame) - (1 - p) * 2.3;
  const r = 1 + (1 - p) * 1.25;
  const x = HUB.x + Math.cos(a) * RX * r;
  const y = HUB.y + Math.sin(a) * RY * r;
  // nearer the bottom of the ellipse = nearer the camera
  const depth = (Math.sin(a) + 1) / 2;
  return { x, y, p, depth, scale: lerp(0.86, 1.08, clamp(depth)) };
};

/** Quadratic curve hub → (x, y), bowed to one side so the hub looks like a pinwheel. */
const curve = (x: number, y: number) => {
  const dx = x - HUB.x;
  const dy = y - HUB.y;
  const len = Math.hypot(dx, dy) || 1;
  const bow = 0.16 * len;
  const cx = (HUB.x + x) / 2 + (-dy / len) * bow;
  const cy = (HUB.y + y) / 2 + (dx / len) * bow;
  const at = (t: number) => {
    const u = 1 - t;
    return { x: u * u * HUB.x + 2 * u * t * cx + t * t * x, y: u * u * HUB.y + 2 * u * t * cy + t * t * y };
  };
  let L = 0;
  let prev = at(0);
  for (let s = 1; s <= 24; s++) {
    const q = at(s / 24);
    L += Math.hypot(q.x - prev.x, q.y - prev.y);
    prev = q;
  }
  return { d: `M ${HUB.x} ${HUB.y} Q ${cx} ${cy} ${x} ${y}`, length: L, at };
};

const accentOf = (a: Agent) => (a.kind === "shape" ? a.colorDef.light : "#E5E7EB");
const hexOf = (a: Agent) => (a.kind === "shape" ? a.colorDef.hex : "#E5E7EB");

/** The app's "working" ring (bot-avatar.tsx): a gradient arc chasing round the avatar. */
const WorkingRing = ({ size, color, frame, opacity }: { size: number; color: string; frame: number; opacity: number }) => {
  if (opacity <= 0.001) return null;
  // 1.2 s per turn with the app's ease (cubic-bezier(0.4, 0, 0.2, 1))
  const cycle = (frame % 36) / 36;
  const angle = Easing.bezier(0.4, 0, 0.2, 1)(cycle) * 360;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      style={{
        position: "absolute",
        left: -size / 2,
        top: -size / 2,
        overflow: "visible",
        opacity,
        transform: `rotate(${angle}deg)`,
        filter: `drop-shadow(0 0 6px ${color}) drop-shadow(0 0 10px #ffffff)`,
      }}
    >
      <defs>
        <linearGradient id="hub-ring" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity={1} />
          <stop offset="60%" stopColor={color} stopOpacity={0.9} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <circle cx={24} cy={24} r={22} fill="none" stroke="url(#hub-ring)" strokeWidth={1.6} strokeLinecap="round" strokeDasharray="45 80" />
      <circle cx={46} cy={24} r={1.5} fill="#ffffff" />
    </svg>
  );
};

/** Name pill under a bot. */
const Label = ({ text, color, at, frame, fps }: { text: string; color: string; at: number; frame: number; fps: number }) => {
  const p = spring({ frame: frame - at, fps, config: { damping: 13, stiffness: 190, mass: 0.6 } });
  if (frame < at) return null;
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 9,
        padding: "7px 15px 7px 12px",
        borderRadius: 999,
        background: "rgba(18,19,23,0.88)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 10px 26px -6px rgba(0,0,0,0.6)",
        fontFamily: FONT_STACK,
        fontSize: 22,
        fontWeight: 500,
        letterSpacing: "-0.01em",
        color: COLORS.foreground,
        whiteSpace: "nowrap",
        opacity: clamp(p * 1.5),
        transform: `translateY(${10 * (1 - p)}px) scale(${0.7 + 0.3 * p})`,
        filter: p < 0.97 ? `blur(${5 * (1 - clamp(p))}px)` : undefined,
      }}
    >
      <span style={{ width: 9, height: 9, borderRadius: "50%", background: color, boxShadow: `0 0 10px ${color}` }} />
      {text}
    </div>
  );
};

/** Scene 3 — "One assistant. Nine specialists.": the delegation hub. */
export const Scene03Team = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const push = clamp(frame / (8 * fps));

  const places = SPECIALISTS.map((_, i) => placeOf(i, frame, fps));
  const curves = places.map((pl) => curve(pl.x, pl.y));

  // Primary Bot: pops in, blinks, glances at whoever it is handing work to
  const primaryPop = spring({ frame: frame - T.primaryIn, fps, config: SPRINGS.bouncy });
  const sending = PACKETS.filter((pk) => frame >= pk.at - 8 && frame <= pk.at + pk.travel);
  const target = sending.length ? places[sending[sending.length - 1]!.to]! : null;
  const lookAmt = target ? 1 : 0;
  const look = target
    ? {
        x: clamp((target.x - HUB.x) / 600, -1, 1) * 9 * lookAmt,
        y: clamp((target.y - HUB.y) / 300, -1, 1) * 5 * lookAmt,
      }
    : { x: 0, y: 1 };
  const returned = Math.max(0, ...RETURNS.map((r) => clamp((frame - r) / 6)));
  const primaryEyes = blendExpression(
    "neutral",
    "happy",
    Math.max(tween(frame, [30, 36], [0, 1]) * (1 - tween(frame, [70, 78], [0, 1])), returned),
  );
  const primaryBlink = blinkAt(frame, [22, 96, 150, 232]);
  const returnBump = Math.max(0, ...RETURNS.map((r) => bump(frame - r, 3, 1, 8)));
  const primaryBody = composePose(composePose(REST, idle(frame, "hub-primary", 0.8)), {
    sy: 1 - 0.06 * returnBump,
    sx: 1 + 0.05 * returnBump,
  });
  const working = tween(frame, [104, 112], [0, 1]) * (1 - tween(frame, [208, 218], [0, 1]));

  return (
    <AbsoluteFill>
      <AccentGlow color={COLORS.primary} x={50} y={56} w={34} h={40} opacity={0.22 * tween(frame, [0, 30], [0, 1])} />
      <Dust seed="team" count={34} opacity={0.65} />
      <Dolly progress={push} from={1} to={1.04} driftY={-4}>
        {/* delegation lines (behind the bots) */}
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <defs>
            {SPECIALISTS.map((agent, i) => {
              const pl = places[i]!;
              return (
                <linearGradient key={agent.id} id={`line-${agent.id}`} gradientUnits="userSpaceOnUse" x1={HUB.x} y1={HUB.y} x2={pl.x} y2={pl.y}>
                  <stop offset="0%" stopColor={PRIMARY.colorDef.light} />
                  <stop offset="100%" stopColor={accentOf(agent)} />
                </linearGradient>
              );
            })}
            <filter id="line-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="5" />
            </filter>
          </defs>
          {SPECIALISTS.map((agent, i) => {
            const c = curves[i]!;
            const draw = Easing.inOut(Easing.cubic)(clamp((frame - lineDelay(i)) / T.lineDraw));
            if (draw <= 0) return null;
            const busy = Math.max(
              0,
              ...PACKETS.filter((pk) => pk.to === i).map((pk) => bump(frame - pk.at + 4, 6, pk.travel, 14)),
            );
            const dash = `${c.length} ${c.length}`;
            const offset = c.length * (1 - draw);
            return (
              <g key={agent.id}>
                <path d={c.d} fill="none" stroke={`url(#line-${agent.id})`} strokeWidth={10} strokeLinecap="round" opacity={0.14 + 0.3 * busy} strokeDasharray={dash} strokeDashoffset={offset} filter="url(#line-glow)" />
                <path d={c.d} fill="none" stroke={`url(#line-${agent.id})`} strokeWidth={2.6 + 1.4 * busy} strokeLinecap="round" opacity={0.5 + 0.45 * busy} strokeDasharray={dash} strokeDashoffset={offset} />
                {/* data flowing outwards once connected */}
                <path d={c.d} fill="none" stroke="#ffffff" strokeWidth={2} strokeLinecap="round" strokeDasharray="2 18" strokeDashoffset={-frame * 1.4} opacity={0.32 * clamp((draw - 0.9) * 10)} />
              </g>
            );
          })}
          {/* packets travelling along the lines */}
          {PACKETS.map((pk, k) => {
            const t = (frame - pk.at) / pk.travel;
            if (t < -0.01 || t > 1.25) return null;
            const c = curves[pk.to]!;
            const color = pk.back ? accentOf(SPECIALISTS[pk.to]!) : PRIMARY.colorDef.light;
            const along = (s: number) => {
              const e = Easing.inOut(Easing.quad)(clamp(s));
              return c.at(pk.back ? 1 - e : e);
            };
            const fade = 1 - clamp((t - 1) * 4);
            return (
              <g key={k} opacity={fade}>
                {Array.from({ length: 7 }, (_, j) => {
                  const q = along(t - (j + 1) * 0.035);
                  return <circle key={j} cx={q.x} cy={q.y} r={6 - j * 0.7} fill={color} opacity={0.5 * (1 - j / 7)} />;
                })}
                {(() => {
                  const q = along(t);
                  return (
                    <>
                      <circle cx={q.x} cy={q.y} r={20} fill={color} opacity={0.35} filter="url(#line-glow)" />
                      <circle cx={q.x} cy={q.y} r={7.5} fill="#ffffff" />
                    </>
                  );
                })()}
              </g>
            );
          })}
        </svg>

        {/* specialists */}
        {SPECIALISTS.map((agent, i) => {
          const pl = places[i]!;
          if (pl.p < 0.005) return null;
          const hits = arrivals(i);
          const hitT = Math.max(...hits.map((h) => (frame >= h ? frame - h : -1)), -1);
          const pulse = hitT >= 0 && hitT < 24 ? Easing.out(Easing.cubic)(hitT / 24) : -1;
          const base = (agent.kind === "neat" ? NEAT_SIZE : SPEC_SIZE) * pl.scale;
          const opacity = clamp(pl.p * 1.8);
          const blur = (1 - clamp(pl.p)) * 10;
          // everyone keeps an eye on the Primary Bot
          const toHub = { x: HUB.x - pl.x, y: HUB.y - pl.y };
          const n = Math.hypot(toHub.x, toHub.y) || 1;
          let node;
          if (agent.kind === "neat") {
            const bob = Math.sin(frame / 12 + 1.3) * 3;
            node = (
              <div style={{ transform: `translateY(${bob}px)` }}>
                <DotMatrixLogo size={base} frame={frame} fps={fps} pngAt={-100} blinks={[84, 168]} glow={0.55} />
              </div>
            );
          } else {
            const reacting = hitT >= 0 && hitT < 46;
            const into = reacting ? tween(hitT, [2, 8], [0, 1]) * (1 - tween(hitT, [34, 44], [0, 1])) : 0;
            const face: Expression = agent.signature === "wink" ? "happy" : agent.signature;
            const eyes = into > 0 ? blendExpression("neutral", face, into) : EXPRESSIONS.neutral;
            const blinks = idleBlinks(`hub-${agent.id}`, 40, 280).filter((b) => !hits.some((h) => b > h - 4 && b < h + 40));
            let body = composePose(REST, idle(frame, `hub-${agent.id}`, 0.9));
            if (hitT >= 0) body = composePose(body, hop(hitT, fps, 20, 9));
            node = (
              <Mascot
                agent={agent}
                size={base}
                eyes={eyes}
                blink={blinkAt(frame, blinks)}
                look={{ x: (toHub.x / n) * 8, y: (toHub.y / n) * 4 }}
                body={body}
                glow={0.45 + 0.4 * (pulse >= 0 ? 1 - pulse : 0)}
                shadow={0}
              />
            );
          }
          return (
            <div key={agent.id}>
              {pulse >= 0 ? (
                <div
                  style={{
                    position: "absolute",
                    left: pl.x,
                    top: pl.y,
                    width: 0,
                    height: 0,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: -base * (0.55 + 0.45 * pulse),
                      top: -base * (0.55 + 0.45 * pulse),
                      width: base * (1.1 + 0.9 * pulse),
                      height: base * (1.1 + 0.9 * pulse),
                      borderRadius: "50%",
                      border: `2px solid ${hexOf(agent)}`,
                      boxShadow: `0 0 24px ${hexOf(agent)}`,
                      opacity: 0.8 * (1 - pulse),
                    }}
                  />
                </div>
              ) : null}
              <div
                style={{
                  position: "absolute",
                  left: pl.x - base / 2,
                  top: pl.y - base / 2,
                  opacity,
                  filter: blur > 0.2 ? `blur(${blur}px)` : undefined,
                }}
              >
                {node}
              </div>
              <div
                style={{
                  position: "absolute",
                  left: pl.x,
                  top: pl.y + base * 0.5 + 12,
                  transform: "translateX(-50%)",
                }}
              >
                <Label text={LABEL[agent.id] ?? agent.name} color={hexOf(agent)} at={labelAt(i)} frame={frame} fps={fps} />
              </div>
            </div>
          );
        })}

        {/* the Primary Bot at the hub */}
        <div style={{ position: "absolute", left: HUB.x, top: HUB.y, width: 0, height: 0 }}>
          <WorkingRing size={PRIMARY_SIZE * 1.3} color={PRIMARY.colorDef.light} frame={frame} opacity={working} />
          <div
            style={{
              position: "absolute",
              left: -PRIMARY_SIZE / 2,
              top: -PRIMARY_SIZE / 2,
              opacity: clamp(primaryPop * 2),
              transform: `scale(${0.5 + 0.5 * primaryPop})`,
            }}
          >
            <Mascot
              agent={PRIMARY}
              size={PRIMARY_SIZE}
              eyes={primaryEyes}
              blink={primaryBlink}
              look={look}
              body={primaryBody}
              glow={0.75}
              shadow={0}
            />
          </div>
          <div style={{ position: "absolute", left: 0, top: PRIMARY_SIZE * 0.5 + 16, transform: "translateX(-50%)" }}>
            <Label text="Primary Bot" color={PRIMARY.colorDef.hex} at={30} frame={frame} fps={fps} />
          </div>
        </div>
      </Dolly>
      <Headline
        start={12}
        text={[
          { text: "Every department." },
          { text: " One team.", pause: 6, style: SOFT },
        ]}
      />
    </AbsoluteFill>
  );
};
