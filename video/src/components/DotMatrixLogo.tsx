import type { CSSProperties } from "react";
import { useId } from "react";
import { Easing, Img, interpolate, random, spring, staticFile } from "remotion";
import { NL_DOT_RADIUS, NL_DOTS, NL_SOURCE_SIZE, NL_TILE_COLORS } from "../assets/nl-dots";
import { bump, clamp, lerp } from "../lib/motion";
import { SPRINGS } from "../theme/tokens";

const S = NL_SOURCE_SIZE;
const C = S / 2;
const TILE_RADIUS = S * 0.22;

const ys = NL_DOTS.map(([, y]) => y);
const MIN_Y = Math.min(...ys);
const MAX_Y = Math.max(...ys);
const xs = NL_DOTS.map(([x]) => x);
const MARK_CX = (Math.min(...xs) + Math.max(...xs)) / 2;
const MARK_CY = (MIN_Y + MAX_Y) / 2;
const MAX_DIST = Math.max(...NL_DOTS.map(([x, y]) => Math.hypot(x - MARK_CX, y - MARK_CY)));

type Dot = {
  tx: number;
  ty: number;
  sx: number;
  sy: number;
  delay: number;
  swirl: number;
  twinkle: number;
  scale0: number;
};

/** Scatter positions are deterministic so every render (and every still) matches. */
const DOTS: Dot[] = NL_DOTS.map(([tx, ty], i) => {
  const angle = random(`nl-a-${i}`) * Math.PI * 2;
  const r = 70 + Math.pow(random(`nl-r-${i}`), 0.7) * 330;
  const d = Math.hypot(tx - MARK_CX, ty - MARK_CY) / MAX_DIST;
  return {
    tx,
    ty,
    sx: C + Math.cos(angle) * r,
    sy: C + Math.sin(angle) * r * 0.62,
    delay: d * 14 + random(`nl-j-${i}`) * 3,
    swirl: (random(`nl-s-${i}`) - 0.5) * 90,
    twinkle: random(`nl-t-${i}`) * Math.PI * 2,
    scale0: 0.5 + random(`nl-k-${i}`) * 1.1,
  };
});

export type DotMatrixLogoProps = {
  /** Rendered tile edge in px. */
  size: number;
  /** Frame (in the caller's timeline) to read. */
  frame: number;
  fps: number;
  /** Frame at which the scattered dots start springing home. Use -Infinity for "already formed". */
  assembleAt?: number;
  /** Frames at which the mark "blinks" (a top→bottom lid sweep across the dot rows). */
  blinks?: number[];
  /** Frame at which the real PNG tile cross-fades in over the vector rebuild. */
  pngAt?: number;
  /** Frame for a soft pulse ring. */
  pulseAt?: number;
  /** Glow strength 0..1 around the tile. */
  glow?: number;
  style?: CSSProperties;
};

/**
 * Neat Bot = the Neatlogs "nl" dot-matrix tile (web/src/assets/neatlogs-nl.png).
 * The dots are sampled from that PNG (scripts/extract-nl-dots.mjs) so the vector rebuild
 * lines up 1:1 with the real asset for the cross-fade.
 */
export const DotMatrixLogo = ({
  size,
  frame,
  fps,
  assembleAt = Number.NEGATIVE_INFINITY,
  blinks = [],
  pngAt,
  pulseAt,
  glow = 0.6,
  style,
}: DotMatrixLogoProps) => {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const formed = !Number.isFinite(assembleAt);
  const t = frame - (formed ? -1000 : assembleAt);

  // Tile body appears as the last dots land.
  const tileIn = formed ? 1 : spring({ frame: t - 16, fps, config: SPRINGS.smooth, durationInFrames: 18 });
  const png = pngAt === undefined ? 0 : interpolate(frame, [pngAt, pngAt + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  const pulse = pulseAt === undefined ? 0 : Easing.out(Easing.cubic)(clamp((frame - pulseAt) / 26, 0, 1));
  const pulseOpacity = pulseAt === undefined || frame < pulseAt ? 0 : (1 - pulse) * 0.6;

  // Whole-mark squash during a blink, like the shape mascots.
  const blinkMark = Math.max(0, ...blinks.map((b) => bump(frame - b - 2, 3, 1, 4)));

  const arrived = DOTS.map((d) =>
    formed ? 1 : spring({ frame: t - d.delay, fps, config: SPRINGS.snappy, durationInFrames: 24 }),
  );
  const assembled = arrived.reduce((a, b) => a + Math.min(1, b), 0) / DOTS.length;

  return (
    <div style={{ position: "relative", width: size, height: size, ...style }}>
      {/* soft halo */}
      <div
        style={{
          position: "absolute",
          inset: -size * 0.45,
          background: "radial-gradient(closest-side, rgba(236,236,238,0.20), rgba(236,236,238,0) 70%)",
          opacity: glow * (0.35 + 0.65 * assembled),
        }}
      />
      {/* pulse ring */}
      {pulseOpacity > 0 ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: size * (TILE_RADIUS / S),
            border: `${Math.max(1.5, size * 0.008)}px solid rgba(255,255,255,0.9)`,
            transform: `scale(${1.02 + pulse * 0.5})`,
            opacity: pulseOpacity,
            boxShadow: "0 0 24px rgba(255,255,255,0.35)",
          }}
        />
      ) : null}
      <svg
        viewBox={`0 0 ${S} ${S}`}
        width={size}
        height={size}
        style={{
          position: "absolute",
          inset: 0,
          overflow: "visible",
          transformOrigin: "50% 50%",
          transform: `scale(${1 + blinkMark * 0.02}, ${1 - blinkMark * 0.035})`,
        }}
      >
        <defs>
          <linearGradient id={`${uid}-tile`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={NL_TILE_COLORS.topLeft} />
            <stop offset="100%" stopColor={NL_TILE_COLORS.topRight} />
          </linearGradient>
          <filter id={`${uid}-dotglow`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g
          opacity={tileIn}
          transform={`translate(${C} ${C}) scale(${lerp(0.86, 1, tileIn)}) translate(${-C} ${-C})`}
        >
          <rect
            x={0}
            y={0}
            width={S}
            height={S}
            rx={TILE_RADIUS}
            fill={`url(#${uid}-tile)`}
            stroke="rgba(255,255,255,0.10)"
            strokeWidth={1.2}
          />
        </g>
        <g fill="#ffffff" filter={formed || assembled > 0.98 ? undefined : `url(#${uid}-dotglow)`}>
          {DOTS.map((d, i) => {
            const p = arrived[i] ?? 1;
            const pc = Math.min(1, p);
            // curved flight: a perpendicular swirl that vanishes on arrival
            const x = lerp(d.sx, d.tx, p);
            const y = lerp(d.sy, d.ty, p);
            const dx = d.tx - d.sx;
            const dy = d.ty - d.sy;
            const len = Math.hypot(dx, dy) || 1;
            const bend = Math.sin(Math.PI * pc) * (d.swirl / 100) * len * 0.25;
            const px = x + (-dy / len) * bend;
            const py = y + (dx / len) * bend;
            const drift = (1 - pc) * Math.sin(frame / 9 + d.twinkle) * 5;
            const r = NL_DOT_RADIUS * 0.94 * lerp(d.scale0, 1, pc);
            const twinkle = 0.45 + 0.35 * Math.sin(frame / 5 + d.twinkle);
            const opacity = lerp(twinkle, 1, pc);
            const rowDelay = ((d.ty - MIN_Y) / (MAX_Y - MIN_Y)) * 4;
            // LED-style blink: a lid sweeps top→bottom, each row of dots dips and relights
            const lid = Math.max(0, ...blinks.map((b) => bump(frame - b - rowDelay, 2, 1, 4)));
            return (
              <circle
                key={i}
                cx={px}
                cy={py + drift}
                r={r * (1 - 0.55 * lid)}
                opacity={opacity * (1 - 0.75 * lid)}
              />
            );
          })}
        </g>
      </svg>
      {png > 0 ? (
        <Img
          src={staticFile("neatlogs-nl.png")}
          style={{
            position: "absolute",
            inset: 0,
            width: size,
            height: size,
            borderRadius: size * (TILE_RADIUS / S),
            opacity: png,
          }}
        />
      ) : null}
    </div>
  );
};
