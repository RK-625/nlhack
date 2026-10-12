import type { CSSProperties, ReactNode } from "react";
import { createContext, useContext, useId } from "react";
import { AbsoluteFill, Img, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { Key } from "../lib/motion";
import { clamp, path } from "../lib/motion";
import { COLORS, SPRINGS } from "../theme/tokens";

/** Card placement on the 1920×1080 frame: (x, y) is the card's centre. */
export type CardGeom = { x: number; y: number; w: number; h: number; radius?: number };

/** Camera over a screenshot, in the screenshot's own pixels. zoom 1 = the whole shot ("cover" fit). */
export type Framing = { cx: number; cy: number; zoom: number };

/** A screenshot and its native pixel size. Paths are relative to public/. */
export type ShotSource = { src: string; w: number; h: number };

/** The standard card used by the UI scenes (4, 5, 7–9): below the headline band, 16:9-ish. */
export const STAGE_CARD: CardGeom = { x: 960, y: 614, w: 1440, h: 828, radius: 22 };

const ViewportContext = createContext<{ w: number; h: number }>({ w: STAGE_CARD.w, h: STAGE_CARD.h });

export type CardMotion = { opacity: number; rise: number; blur: number; scale: number };

/**
 * Entrance (spring rise ~20 px, blur 8→0, fade) plus the slow push-in. Exported so a scene
 * can map screenshot points to the screen with exactly the transform the card uses.
 */
export const cardMotion = (
  frame: number,
  fps: number,
  enterAt: number,
  /** 0..1 progress of the slow push-in through the shot. */
  push: number,
  pushTo = 1.04,
): CardMotion => {
  const p = spring({ frame: frame - enterAt, fps, config: SPRINGS.smooth, durationInFrames: 28 });
  return {
    opacity: clamp(p * 1.6),
    rise: 20 * (1 - p),
    blur: 8 * (1 - p),
    scale: (0.985 + 0.015 * p) * (1 + (pushTo - 1) * clamp(push)),
  };
};

/** Where the camera really is once clamped so the view never leaves the screenshot. */
export const shotTransform = (viewport: { w: number; h: number }, shot: ShotSource, cam: Framing) => {
  const base = Math.max(viewport.w / shot.w, viewport.h / shot.h);
  const s = base * Math.max(1, cam.zoom);
  const halfW = viewport.w / (2 * s);
  const halfH = viewport.h / (2 * s);
  const cx = clamp(cam.cx, halfW, shot.w - halfW);
  const cy = clamp(cam.cy, halfH, shot.h - halfH);
  return { s, cx, cy, tx: viewport.w / 2 - cx * s, ty: viewport.h / 2 - cy * s };
};

/** A screenshot pixel → frame pixel, through the camera, the card's push-in and its rise. */
export const shotToScreen = (
  geom: CardGeom,
  motion: CardMotion,
  shot: ShotSource,
  cam: Framing,
  x: number,
  y: number,
) => {
  const t = shotTransform(geom, shot, cam);
  const lx = t.tx + x * t.s - geom.w / 2;
  const ly = t.ty + y * t.s - geom.h / 2;
  return { x: geom.x + lx * motion.scale, y: geom.y + ly * motion.scale + motion.rise, scale: t.s * motion.scale };
};

/** Smooth camera through keyframes (each value its own Hermite path, like the lineup dolly). */
export type FramingKey = { f: number; cx: number; cy: number; zoom: number; hold?: boolean };
export const framingAt = (frame: number, keys: FramingKey[], tension = 0.35): Framing => {
  const k = (pick: (k: FramingKey) => number): Key[] => keys.map((key) => ({ f: key.f, v: pick(key), hold: key.hold }));
  return {
    cx: path(frame, k((key) => key.cx), tension),
    cy: path(frame, k((key) => key.cy), tension),
    zoom: path(frame, k((key) => key.zoom), tension),
  };
};

/**
 * A floating rounded card on the dark backdrop that holds real UI. Children are <Shot>s
 * (stack several to cross-fade between captures); anything else is laid out in card pixels.
 */
export const UICard = ({
  geom = STAGE_CARD,
  enterAt = 0,
  push = 0,
  pushTo = 1.04,
  children,
  style,
}: {
  geom?: CardGeom;
  enterAt?: number;
  push?: number;
  pushTo?: number;
  children: ReactNode;
  style?: CSSProperties;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const m = cardMotion(frame, fps, enterAt, push, pushTo);
  const radius = geom.radius ?? 22;
  if (m.opacity <= 0.001) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: geom.x - geom.w / 2,
        top: geom.y - geom.h / 2,
        width: geom.w,
        height: geom.h,
        transform: `translateY(${m.rise}px) scale(${m.scale})`,
        transformOrigin: "50% 50%",
        opacity: m.opacity,
        filter: m.blur > 0.05 ? `blur(${m.blur}px)` : undefined,
        ...style,
      }}
    >
      {/* soft, deep shadow + a faint coloured floor bounce */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: radius,
          boxShadow:
            "0 60px 140px -30px rgba(0,0,0,0.85), 0 22px 48px -8px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,0,0,0.6)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: radius,
          overflow: "hidden",
          background: COLORS.card,
        }}
      >
        <ViewportContext.Provider value={{ w: geom.w, h: geom.h }}>{children}</ViewportContext.Provider>
      </div>
      {/* hairline border on top so the light screenshot never bleeds past the edge */}
      <div
        style={{
          position: "absolute",
          inset: -1,
          borderRadius: radius + 1,
          border: `1px solid ${COLORS.border}`,
          pointerEvents: "none",
        }}
      />
    </div>
  );
};

/**
 * One screenshot inside a UICard, framed by `camera`. The <Img> is sized directly (not
 * CSS-scaled) so Chrome resamples it once at the final size — 3024-px captures stay crisp.
 * Children are overlays in the screenshot's own pixel space (counters, spotlights…).
 */
export const Shot = ({
  shot,
  camera,
  opacity = 1,
  blur = 0,
  bare = false,
  children,
}: {
  shot: ShotSource;
  camera: Framing;
  opacity?: number;
  blur?: number;
  /** Overlays only (no image) — e.g. a spotlight that must sit above several stacked shots. */
  bare?: boolean;
  children?: ReactNode;
}) => {
  const viewport = useContext(ViewportContext);
  const t = shotTransform(viewport, shot, camera);
  if (opacity <= 0.001) return null;
  return (
    <AbsoluteFill style={{ opacity, filter: blur > 0.05 ? `blur(${blur}px)` : undefined }}>
      {bare ? null : <Img
        src={staticFile(shot.src)}
        style={{
          position: "absolute",
          left: t.tx,
          top: t.ty,
          width: shot.w * t.s,
          height: shot.h * t.s,
          maxWidth: "none",
        }}
      />}
      {children ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: shot.w,
            height: shot.h,
            transformOrigin: "0 0",
            transform: `translate(${t.tx}px, ${t.ty}px) scale(${t.s})`,
          }}
        >
          {children}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/** Dims everything in the shot except a soft-edged rounded rect (screenshot pixels). */
export const Spotlight = ({
  x,
  y,
  w,
  h,
  amount,
  radius = 28,
  feather = 40,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  /** 0..1 darkness outside the rect. */
  amount: number;
  radius?: number;
  /** Width of the soft edge, in screenshot pixels. */
  feather?: number;
}) => {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  if (amount <= 0.001) return null;
  const big = { x: -6000, y: -6000, width: 16000, height: 16000 };
  return (
    <svg width={1} height={1} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }}>
      <defs>
        <filter id={`${id}-f`} filterUnits="userSpaceOnUse" x={x - feather * 3} y={y - feather * 3} width={w + feather * 6} height={h + feather * 6}>
          <feGaussianBlur stdDeviation={feather / 2} />
        </filter>
        <mask id={`${id}-m`} maskUnits="userSpaceOnUse" {...big}>
          <rect {...big} fill="white" />
          <rect x={x} y={y} width={w} height={h} rx={radius} fill="black" filter={feather > 0 ? `url(#${id}-f)` : undefined} />
        </mask>
      </defs>
      <rect {...big} fill={`rgba(9,10,12,${amount})`} mask={`url(#${id}-m)`} />
    </svg>
  );
};

/** A glowing outline around a region of the shot (screenshot pixels), e.g. the sent message. */
export const Highlight = ({
  x,
  y,
  w,
  h,
  progress,
  color = COLORS.primary,
  radius = 30,
  stroke = 4,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  /** 0 hidden … 1 fully on. */
  progress: number;
  color?: string;
  radius?: number;
  stroke?: number;
}) =>
  progress <= 0.001 ? null : (
    <div
      style={{
        position: "absolute",
        left: x - stroke * 2,
        top: y - stroke * 2,
        width: w + stroke * 4,
        height: h + stroke * 4,
        borderRadius: radius + stroke * 2,
        border: `${stroke}px solid ${color}`,
        boxShadow: `0 0 ${stroke * 8}px ${color}`,
        opacity: progress,
        transform: `scale(${1.03 - 0.03 * progress})`,
        pointerEvents: "none",
      }}
    />
  );
