import { Easing, interpolate, useCurrentFrame } from "remotion";
import { bump, clamp, lerp } from "../lib/motion";

/**
 * A cursor waypoint in frame pixels. The segment *arriving* at a key bends by `arc`
 * (fraction of the segment length, sign = side), so moves read as a hand, not a robot.
 */
export type CursorKey = { f: number; x: number; y: number; arc?: number };

/** Hand-like move: quick start, long soft landing. */
const MOVE_EASE = Easing.bezier(0.33, 0, 0.12, 1);

export const cursorAt = (frame: number, keys: CursorKey[]) => {
  const first = keys[0]!;
  const last = keys[keys.length - 1]!;
  if (frame <= first.f) return { x: first.x, y: first.y, moving: false };
  if (frame >= last.f) return { x: last.x, y: last.y, moving: false };
  let i = 0;
  while (i < keys.length - 2 && frame > keys[i + 1]!.f) i++;
  const a = keys[i]!;
  const b = keys[i + 1]!;
  const t = MOVE_EASE(clamp((frame - a.f) / Math.max(1, b.f - a.f)));
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const arc = (b.arc ?? 0.18) * len;
  // quadratic Bézier with the control point pushed off the chord's midpoint
  const cx = (a.x + b.x) / 2 + (-dy / len) * arc;
  const cy = (a.y + b.y) / 2 + (dx / len) * arc;
  const u = 1 - t;
  return {
    x: u * u * a.x + 2 * u * t * cx + t * t * b.x,
    y: u * u * a.y + 2 * u * t * cy + t * t * b.y,
    moving: (a.x !== b.x || a.y !== b.y) && t > 0 && t < 1,
  };
};

const RIPPLE_FRAMES = 18;

/**
 * macOS-style pointer that glides along curved, eased paths. Each click presses the
 * pointer (slight scale-down) and throws a ripple ring from the hotspot.
 */
export const Cursor = ({
  keys,
  clicks = [],
  appearAt,
  hideAt,
  size = 46,
  rippleColor = "rgba(255,255,255,0.95)",
}: {
  keys: CursorKey[];
  clicks?: number[];
  appearAt?: number;
  hideAt?: number;
  /** Pointer height in px. */
  size?: number;
  rippleColor?: string;
}) => {
  const frame = useCurrentFrame();
  const start = appearAt ?? keys[0]!.f;
  const fadeIn = interpolate(frame, [start, start + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fadeOut =
    hideAt === undefined ? 1 : interpolate(frame, [hideAt, hideAt + 8], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const opacity = fadeIn * fadeOut;
  if (opacity <= 0.001) return null;

  const pos = cursorAt(frame, keys);
  // the resting hand is never perfectly still
  const idleX = pos.moving ? 0 : Math.sin(frame / 11) * 0.8;
  const idleY = pos.moving ? 0 : Math.cos(frame / 13) * 0.6;
  const press = Math.max(0, ...clicks.map((c) => bump(frame - c, 2, 2, 6)));
  const k = size / 28;

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0, opacity, pointerEvents: "none" }}>
      {clicks.map((c) => {
        const t = frame - c;
        if (t < 0 || t > RIPPLE_FRAMES) return null;
        const p = Easing.out(Easing.cubic)(t / RIPPLE_FRAMES);
        const r = lerp(6, 46, p);
        return (
          <div
            key={c}
            style={{
              position: "absolute",
              left: pos.x - r,
              top: pos.y - r,
              width: r * 2,
              height: r * 2,
              borderRadius: "50%",
              border: `${lerp(3, 1.2, p)}px solid ${rippleColor}`,
              background: `radial-gradient(closest-side, rgba(255,255,255,${0.32 * (1 - p)}), rgba(255,255,255,0))`,
              opacity: 1 - p,
              boxShadow: `0 0 18px rgba(255,255,255,${0.35 * (1 - p)})`,
            }}
          />
        );
      })}
      <svg
        width={size}
        height={size}
        viewBox="0 0 28 28"
        style={{
          position: "absolute",
          // hotspot (8.2, 4.6) sits on the target point
          left: pos.x + idleX - 8.2 * k,
          top: pos.y + idleY - 4.6 * k,
          overflow: "visible",
          transformOrigin: `${8.2 * k}px ${4.6 * k}px`,
          transform: `scale(${1 - 0.14 * press})`,
          filter: "drop-shadow(0 3px 5px rgba(0,0,0,0.45)) drop-shadow(0 0 1px rgba(0,0,0,0.6))",
        }}
      >
        <path
          d="M8.2 4.6 L8.2 22.4 L12.3 18.5 L15.1 24.9 L18.3 23.5 L15.5 17.3 L21.2 17.3 Z"
          fill="#0b0b0c"
          stroke="#ffffff"
          strokeWidth={1.7}
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};
