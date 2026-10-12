import type { CSSProperties } from "react";
import { useId } from "react";
import type { ShapeAgent } from "../data/agents";
import { SHIPPED_BOT_AVATAR_CENTER, SHIPPED_BOT_AVATAR_VIEWBOX } from "../lib/avatar-shapes";
import type { EyePair, EyeParams } from "../lib/expressions";
import { EXPRESSIONS } from "../lib/expressions";
import type { BodyPose } from "../lib/motion";
import { REST } from "../lib/motion";

const CENTER = SHIPPED_BOT_AVATAR_CENTER;
/** Eye centres from the app's shape-mascot branch (bot-avatar.tsx). */
const EYE_L = { x: CENTER - 29, y: CENTER - 8 };
const EYE_R = { x: CENTER + 29, y: CENTER - 8 };
/** Feet of the shape (bottom of the 0..228.5 path inside the -15..244 viewBox) as a % of the box. */
const FEET_ORIGIN = "50% 94%";

export type MascotProps = {
  agent: ShapeAgent;
  size: number;
  eyes?: EyePair;
  /** 0 open … 1 shut */
  blink?: number;
  /** Eye offset in avatar units (the app's working loop uses ±9 x, ±4 y). */
  look?: { x: number; y: number };
  body?: Partial<BodyPose>;
  /** Coloured halo intensity 0..1. */
  glow?: number;
  /** Ground contact shadow opacity 0..1 (0 to hide). */
  shadow?: number;
  /** Subtle specular sheen on the gradient body (video-only polish). */
  sheen?: boolean;
  style?: CSSProperties;
};

const Eye = ({
  cx,
  cy,
  p,
  blink,
  clipId,
}: {
  cx: number;
  cy: number;
  p: EyeParams;
  blink: number;
  clipId: string;
}) => {
  const open = (1 - p.arc) * (1 - 0.9 * blink);
  const ry = Math.max(0.0001, p.ry);
  // flat upper lid: clip away the top `lid` fraction of the eye
  const lidTop = -ry + p.lid * 2 * ry;
  const arcW = p.rx * 1.05;
  const arcH = Math.max(6.5, ry * 1.15);
  return (
    <g transform={`translate(${cx + p.dx} ${cy + p.dy}) rotate(${p.rot})`}>
      <clipPath id={clipId}>
        <rect x={-p.rx - 4} y={lidTop} width={p.rx * 2 + 8} height={ry * 2 + 8} />
      </clipPath>
      {open > 0.001 ? (
        <g clipPath={p.lid > 0.001 ? `url(#${clipId})` : undefined}>
          <ellipse cx={0} cy={0} rx={p.rx} ry={ry * open} />
        </g>
      ) : null}
      {p.arc > 0.001 ? (
        <path
          d={`M ${-arcW} ${arcH * 0.35} Q 0 ${-arcH * 1.25} ${arcW} ${arcH * 0.35}`}
          fill="none"
          strokeWidth={6.4}
          strokeLinecap="round"
          opacity={Math.min(1, p.arc * 1.4)}
          transform={`scale(1 ${0.55 + 0.45 * p.arc})`}
        />
      ) : null}
    </g>
  );
};

/**
 * The app's shape mascot (web/src/components/avatar/bot-avatar.tsx, `::shape_<n>` branch):
 * a linear-gradient (light → dark, top-left → bottom-right) shape path plus two eye ellipses
 * in `colorDef.eyeColor`. Everything else here — expressions, blink, squash, glow — is
 * animation layered on that exact geometry.
 */
export const Mascot = ({
  agent,
  size,
  eyes = EXPRESSIONS.neutral,
  blink = 0,
  look = { x: 0, y: 0 },
  body,
  glow = 0.55,
  shadow = 1,
  sheen = true,
  style,
}: MascotProps) => {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const { colorDef, shapePath } = agent;
  const pose = { ...REST, ...body };
  const lift = Math.max(0, -pose.y);
  const shadowScale = Math.max(0.45, 1 - lift / (size * 0.9));

  return (
    <div style={{ position: "relative", width: size, height: size, ...style }}>
      {shadow > 0 ? (
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "94%",
            width: size * 0.78,
            height: size * 0.11,
            transform: `translate(-50%, -50%) scale(${shadowScale * pose.sx}, ${shadowScale})`,
            borderRadius: "50%",
            background: "radial-gradient(closest-side, rgba(0,0,0,0.62), rgba(0,0,0,0))",
            opacity: shadow * (0.35 + 0.65 * shadowScale),
          }}
        />
      ) : null}
      {glow > 0 ? (
        <div
          style={{
            position: "absolute",
            inset: -size * 0.32,
            transform: `translateY(${pose.y}px)`,
            background: `radial-gradient(closest-side, ${colorDef.hex}66, ${colorDef.hex}00 72%)`,
            opacity: glow,
          }}
        />
      ) : null}
      <svg
        viewBox={SHIPPED_BOT_AVATAR_VIEWBOX}
        width={size}
        height={size}
        style={{
          position: "absolute",
          inset: 0,
          overflow: "visible",
          transformOrigin: FEET_ORIGIN,
          transform: `translate(${pose.x}px, ${pose.y}px) rotate(${pose.rot}deg) scale(${pose.sx}, ${pose.sy})`,
          filter: `drop-shadow(0 ${size * 0.03}px ${size * 0.05}px rgba(0,0,0,0.5))`,
        }}
      >
        <defs>
          <linearGradient id={`${uid}-ink`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={colorDef.light} />
            <stop offset="100%" stopColor={colorDef.dark} />
          </linearGradient>
          <radialGradient id={`${uid}-sheen`} cx="0.32" cy="0.22" r="0.55">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={0.26} />
            <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
          </radialGradient>
        </defs>
        <path d={shapePath} fill={`url(#${uid}-ink)`} />
        {sheen ? <path d={shapePath} fill={`url(#${uid}-sheen)`} /> : null}
        <g
          fill={colorDef.eyeColor}
          stroke={colorDef.eyeColor}
          strokeWidth={0}
          transform={`translate(${look.x} ${look.y})`}
        >
          <Eye cx={EYE_L.x} cy={EYE_L.y} p={eyes.left} blink={blink} clipId={`${uid}-lidL`} />
          <Eye cx={EYE_R.x} cy={EYE_R.y} p={eyes.right} blink={blink} clipId={`${uid}-lidR`} />
        </g>
      </svg>
    </div>
  );
};
