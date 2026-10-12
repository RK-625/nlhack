/**
 * Eye poses for the shape mascots. The app's resting face is two horizontal ellipses
 * (rx 10, ry 7) at CENTER±29, CENTER-8 in the 259-unit avatar viewBox — every expression
 * is a small, interpolatable deviation from that so the bots stay recognisably "ours".
 * The params below stay in the app's units; <Mascot> renders them EYE_SCALE× larger.
 */

/**
 * Video-only enlargement of the eyes (approved in Sprint 3) so expressions read at a
 * distance. Applied around each eye's centre, so every pose, blink and wink keeps its
 * proportions; eye positions are unchanged.
 */
export const EYE_SCALE = 1.2;
export type Expression =
  | "neutral"
  | "happy"
  | "wide"
  | "squint"
  | "deadpan"
  | "wink"
  | "skeptical"
  | "sleepy"
  | "closed";

export type EyeParams = {
  rx: number;
  ry: number;
  /** degrees, clockwise */
  rot: number;
  dx: number;
  dy: number;
  /** 0 = ellipse, 1 = closed "∩" smile arc */
  arc: number;
  /** 0..1 fraction of the eye covered by a flat upper lid */
  lid: number;
};

export type EyePair = { left: EyeParams; right: EyeParams };

export const BASE_EYE: EyeParams = { rx: 10, ry: 7, rot: 0, dx: 0, dy: 0, arc: 0, lid: 0 };

const eye = (p: Partial<EyeParams> = {}): EyeParams => ({ ...BASE_EYE, ...p });
const both = (p: Partial<EyeParams>): EyePair => ({ left: eye(p), right: eye(p) });

export const EXPRESSIONS: Record<Expression, EyePair> = {
  neutral: both({}),
  happy: both({ arc: 1, dy: -1 }),
  wide: both({ rx: 10.5, ry: 10.5, dy: -1.5 }),
  squint: { left: eye({ rx: 11, ry: 3.4, rot: 10 }), right: eye({ rx: 11, ry: 3.4, rot: -10 }) },
  deadpan: both({ rx: 11, ry: 7, lid: 0.5, dy: 1 }),
  wink: { left: eye({ ry: 7.5, dy: -0.5 }), right: eye({ arc: 1 }) },
  skeptical: {
    left: eye({ rx: 11, lid: 0.58, rot: 7, dy: 1 }),
    right: eye({ rx: 10, ry: 8.6, dy: -2.5 }),
  },
  sleepy: both({ rx: 10.5, lid: 0.62, dy: 1.5 }),
  closed: both({ ry: 0.9 }),
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const mixEye = (a: EyeParams, b: EyeParams, t: number): EyeParams => ({
  rx: lerp(a.rx, b.rx, t),
  ry: lerp(a.ry, b.ry, t),
  rot: lerp(a.rot, b.rot, t),
  dx: lerp(a.dx, b.dx, t),
  dy: lerp(a.dy, b.dy, t),
  arc: lerp(a.arc, b.arc, t),
  lid: lerp(a.lid, b.lid, t),
});

export const mixEyes = (a: EyePair, b: EyePair, t: number): EyePair => ({
  left: mixEye(a.left, b.left, t),
  right: mixEye(a.right, b.right, t),
});

/** Blend from one named expression to another. */
export const blendExpression = (from: Expression, to: Expression, t: number): EyePair =>
  mixEyes(EXPRESSIONS[from], EXPRESSIONS[to], t);
