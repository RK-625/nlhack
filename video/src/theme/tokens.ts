/**
 * Design tokens for the launch video. Colours mirror the Bot Company app's dark theme
 * (web/src/lib/tokens.ts) so the video and the product read as one brand.
 */
export const VIDEO = {
  width: 1920,
  height: 1080,
  fps: 30,
} as const;

export const COLORS = {
  background: "#0b0c0e",
  backgroundDeep: "#060708",
  backgroundLift: "#17181c",
  card: "#141518",
  foreground: "#ececee",
  muted: "#85858a",
  mutedStrong: "#a3a3a8",
  border: "#1e2026",
  primary: "#8B5CF6",
} as const;

export const FONT_FAMILY = "Geist";
export const FONT_STACK = `${FONT_FAMILY}, ui-sans-serif, system-ui, -apple-system, sans-serif`;

/** Spring presets (Remotion `spring` configs). */
export const SPRINGS = {
  /** Text rise / UI settle — no overshoot. */
  smooth: { damping: 200, stiffness: 120, mass: 1 },
  /** Mascot pop / landing — lively overshoot. */
  bouncy: { damping: 11, stiffness: 140, mass: 0.8 },
  /** Dots snapping into the Neatlogs mark. */
  snappy: { damping: 15, stiffness: 170, mass: 0.6 },
  /** Soft wobble for squash-and-stretch recovery. */
  jelly: { damping: 7, stiffness: 180, mass: 0.6 },
} as const;

/** Text reveal defaults (whatships-style blur-in). */
export const TEXT_REVEAL = {
  blur: 8,
  rise: 20,
  /** ~70 ms at 30 fps */
  staggerFrames: 2.1,
  durationFrames: 16,
} as const;

/** Length of the blur-dissolve between scenes. */
export const TRANSITION_FRAMES = 15;
