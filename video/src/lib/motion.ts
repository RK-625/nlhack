import type { SpringConfig } from "remotion";
import { Easing, interpolate, random, spring } from "remotion";
import { SPRINGS } from "../theme/tokens";

export const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** interpolate() with clamping on both ends (the common case in this project). */
export const tween = (
  frame: number,
  input: [number, number],
  output: [number, number],
  easing: (t: number) => number = Easing.inOut(Easing.cubic),
) => interpolate(frame, input, output, { ...CLAMP, easing });

/** A spring that starts at `delay` (frames) and is 0 before it. */
export const springAt = (
  frame: number,
  fps: number,
  delay: number,
  config: Partial<SpringConfig> = SPRINGS.smooth,
  durationInFrames?: number,
) => spring({ frame: frame - delay, fps, config, durationInFrames });

/**
 * Smooth camera path through keyframes: cubic Hermite with tangents scaled by `tension`
 * (0 = stop at every key, 1 = Catmull-Rom). Keys with `hold: true` get a zero tangent.
 */
export type Key = { f: number; v: number; hold?: boolean };
export const path = (frame: number, keys: Key[], tension = 0.5): number => {
  if (keys.length === 0) return 0;
  const first = keys[0]!;
  const last = keys[keys.length - 1]!;
  if (frame <= first.f) return first.v;
  if (frame >= last.f) return last.v;
  let i = 0;
  while (i < keys.length - 2 && frame > keys[i + 1]!.f) i++;
  const k0 = keys[i]!;
  const k1 = keys[i + 1]!;
  const tangent = (j: number) => {
    const k = keys[j]!;
    if (k.hold || j === 0 || j === keys.length - 1) return 0;
    const prev = keys[j - 1]!;
    const next = keys[j + 1]!;
    // slope in value-per-frame, averaged over both neighbours
    return tension * ((next.v - prev.v) / (next.f - prev.f));
  };
  const span = k1.f - k0.f;
  const t = (frame - k0.f) / span;
  const m0 = tangent(i) * span;
  const m1 = tangent(i + 1) * span;
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    (2 * t3 - 3 * t2 + 1) * k0.v +
    (t3 - 2 * t2 + t) * m0 +
    (-2 * t3 + 3 * t2) * k1.v +
    (t3 - t2) * m1
  );
};

/** Asymmetric bump: 0 → 1 over `attack`, holds, back to 0 over `release`. */
export const bump = (t: number, attack: number, hold: number, release: number) => {
  if (t <= 0) return 0;
  if (t < attack) return Easing.out(Easing.quad)(t / attack);
  if (t < attack + hold) return 1;
  if (t < attack + hold + release) return 1 - Easing.inOut(Easing.quad)((t - attack - hold) / release);
  return 0;
};

/** Eyelid closure (0 open … 1 shut) for a set of blink start frames. ~7 frames per blink. */
export const blinkAt = (frame: number, starts: number[], slow = false) => {
  let v = 0;
  for (const s of starts) v = Math.max(v, bump(frame - s, slow ? 4 : 2, slow ? 3 : 1, slow ? 6 : 4));
  return v;
};

/** Seeded idle blinks every ~2.2–3.8 s, starting from `from`. */
export const idleBlinks = (seed: string, from: number, to: number) => {
  const out: number[] = [];
  let f = from + Math.floor(random(`${seed}-b0`) * 50);
  let i = 1;
  while (f < to) {
    out.push(f);
    // occasional double-blink
    if (random(`${seed}-d${i}`) < 0.18) out.push(f + 9);
    f += 66 + Math.floor(random(`${seed}-b${i}`) * 48);
    i++;
  }
  return out;
};

/** Gentle breathing / bob, desynchronised per seed. */
export const idle = (frame: number, seed: string, amount = 1) => {
  const phase = random(`${seed}-phase`) * Math.PI * 2;
  const speed = 0.85 + random(`${seed}-speed`) * 0.4;
  const t = (frame / 30) * Math.PI * 2 * 0.55 * speed + phase;
  return {
    y: Math.sin(t) * 5 * amount,
    sx: 1 + Math.sin(t * 2 + 1.1) * 0.012 * amount,
    sy: 1 - Math.sin(t * 2 + 1.1) * 0.012 * amount,
    rot: Math.sin(t * 0.5 + phase) * 1.4 * amount,
  };
};

export type BodyPose = { x: number; y: number; sx: number; sy: number; rot: number };
export const REST: BodyPose = { x: 0, y: 0, sx: 1, sy: 1, rot: 0 };

/** Compose two body poses (offsets add, scales multiply). */
export const composePose = (a: BodyPose, b: Partial<BodyPose>): BodyPose => ({
  x: a.x + (b.x ?? 0),
  y: a.y + (b.y ?? 0),
  sx: a.sx * (b.sx ?? 1),
  sy: a.sy * (b.sy ?? 1),
  rot: a.rot + (b.rot ?? 0),
});

/**
 * A hop: anticipation squash → stretched jump → landing squash with a jelly wobble.
 * `t` is frames since the hop was triggered. Pivot the body at its feet.
 */
export const hop = (t: number, fps: number, height = 40, air = 12): Partial<BodyPose> => {
  if (t < 0) return {};
  const ANT = 4;
  if (t < ANT) {
    const a = Easing.out(Easing.quad)(t / ANT);
    return { sy: 1 - 0.1 * a, sx: 1 + 0.08 * a };
  }
  if (t < ANT + air) {
    const p = (t - ANT) / air;
    const speed = Math.abs(1 - 2 * p);
    return { y: -height * 4 * p * (1 - p), sy: 1 + 0.12 * speed, sx: 1 - 0.08 * speed };
  }
  const s = spring({ frame: t - ANT - air, fps, config: SPRINGS.jelly });
  const k = 1 - s;
  return { sy: 1 - 0.16 * k, sx: 1 + 0.13 * k };
};

/**
 * Spring entrance along Y with velocity-driven squash & stretch.
 * `from` > 0 pops up from below; `from` < 0 drops in from above. When a drop overshoots
 * past the ground, the overshoot becomes squash instead of sinking into the floor.
 */
export const springEntrance = (
  frame: number,
  fps: number,
  delay: number,
  from: number,
  config: Partial<SpringConfig> = SPRINGS.bouncy,
): Partial<BodyPose> & { progress: number } => {
  const at = (f: number) => from * (1 - spring({ frame: f - delay, fps, config }));
  const y = at(frame);
  const v = y - at(frame - 1);
  const progress = spring({ frame: frame - delay, fps, config });
  let squash = 0;
  let drawY = y;
  if (from < 0 && y > 0) {
    // dropping: overshoot below the ground → squash
    squash = clamp((y / Math.abs(from)) * 3.2, 0, 0.24);
    drawY = 0;
  }
  const stretch = clamp(Math.abs(v) * 0.0055, 0, 0.16);
  const sy = 1 + stretch - squash;
  const sx = 1 - stretch * 0.6 + squash * 0.8;
  return { y: drawY, sx, sy, progress };
};

/** Deterministic float in [lo, hi). */
export const rand = (seed: string, lo = 0, hi = 1) => lo + random(seed) * (hi - lo);
