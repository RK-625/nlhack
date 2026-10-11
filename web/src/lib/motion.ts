import type { Transition, Variants } from "motion/react";

/**
 * Shared motion tokens. Every enter/exit pair is symmetric: the exit uses the same duration
 * and distance as the enter, and its easing is the exact time-reverse of the enter curve, so
 * an exit plays like the enter run backwards. Mirrored in CSS as --motion-* / --ease-* in
 * styles.css for Base UI overlays and CSS state transitions.
 */

type Bezier = readonly [number, number, number, number];

/** Seconds. */
export const DURATION = { fast: 0.15, base: 0.22, slow: 0.3 } as const;

/** Pixels of travel for enter/exit offsets. */
export const DISTANCE = { sm: 4, md: 8, lg: 16 } as const;

/** Delay between siblings in a staggered group (seconds). */
export const STAGGER = 0.035;
/** Most siblings that get their own stagger step; later ones share the last delay. */
export const STAGGER_CAP = 8;

/** Time-reverse of a cubic-bezier: f'(t) = 1 - f(1 - t). */
export function mirrorBezier([x1, y1, x2, y2]: Bezier): Bezier {
  return [1 - x2, 1 - y2, 1 - x1, 1 - y1];
}

/** Decelerating curve for things arriving. */
export const EASE_ENTER: Bezier = [0.22, 1, 0.36, 1];
/** Its exact mirror for things leaving: [0.64, 0, 0.78, 0]. */
export const EASE_EXIT: Bezier = mirrorBezier(EASE_ENTER);
/** Self-mirroring curve for two-way state changes (CSS hover/focus). */
export const EASE_STANDARD: Bezier = [0.45, 0, 0.55, 1];
/** Gentle self-mirroring ease-in-out (sine) for the sidebar: open and close move identically. */
export const EASE_SLIDE: Bezier = [0.37, 0, 0.63, 1];

/** Critically damped spring for layout moves (same response in both directions). */
export const SPRING: Transition = { type: "spring", stiffness: 520, damping: 44, mass: 0.9 };

export const enterTransition = (duration: number = DURATION.base, delay = 0): Transition => ({
  duration,
  delay,
  ease: EASE_ENTER,
});
export const exitTransition = (duration: number = DURATION.base, delay = 0): Transition => ({
  duration,
  delay,
  ease: EASE_EXIT,
});

type Offset = { x?: number | string; y?: number | string; scale?: number };

/**
 * `hidden`/`visible` variants whose exit mirrors the enter. Use as
 * initial="hidden" animate="visible" exit="hidden" under AnimatePresence.
 */
export function symmetric(offset: Offset = {}, duration: number = DURATION.base): Variants {
  return {
    hidden: { opacity: 0, ...offset, transition: exitTransition(duration) },
    visible: { opacity: 1, x: 0, y: 0, scale: 1, transition: enterTransition(duration) },
  };
}

/** Parent variants: children enter in order and leave in reverse order. */
export function staggerGroup(stagger = STAGGER): Variants {
  return {
    hidden: { transition: { staggerChildren: stagger, staggerDirection: -1 } },
    visible: { transition: { staggerChildren: stagger } },
  };
}

export const fade = symmetric({}, DURATION.fast);
/**
 * Every sidebar open/close (button, double-click, Enter, drag snap): the width and the shared
 * avatars, highlight and controls travel on this one tween, identical in both directions.
 */
export const SIDEBAR_SLIDE: Transition = { duration: DURATION.slow, ease: EASE_SLIDE };
/** Sidebar morph labels (phases 1 and 3): same curve both ways, like the slide. */
export const labelFade: Variants = {
  hidden: { opacity: 0, transition: { duration: DURATION.base, ease: EASE_SLIDE } },
  visible: { opacity: 1, transition: { duration: DURATION.base, ease: EASE_SLIDE } },
};
export const rise = symmetric({ y: DISTANCE.md });
export const pop = symmetric({ scale: 0.6 }, DURATION.fast);
/** User bubbles arrive from the send side (right, slightly below). */
export const fromEnd = symmetric({ x: DISTANCE.lg, y: DISTANCE.sm });
/** Chat pane content when switching agents. */
export const paneSwap = symmetric({ y: DISTANCE.sm }, DURATION.fast);

/** Height auto open/close; the content fades with it. */
export const collapse: Variants = {
  hidden: { height: 0, opacity: 0, transition: exitTransition(DURATION.base) },
  visible: { height: "auto", opacity: 1, transition: enterTransition(DURATION.base) },
};

/** Mobile sidebar: slides in from the start edge, same tween both ways. */
export const sidebarMobile: Variants = {
  hidden: { x: "-100%", transition: SIDEBAR_SLIDE },
  visible: { x: 0, transition: SIDEBAR_SLIDE },
};
export const backdrop = symmetric({}, DURATION.slow);

/** Instant transition for reduced motion on properties Motion's "user" mode still animates (width/height). */
export const INSTANT: Transition = { duration: 0 };

/**
 * Same targets with no movement time. MotionConfig reducedMotion="user" already drops
 * transform and layout animations; width/height are not transforms, so callers that
 * animate them swap to these variants when useReducedMotion() is true.
 */
export function instant(variants: Variants): Variants {
  return Object.fromEntries(
    Object.entries(variants).map(([label, target]) => [
      label,
      typeof target === "function" ? target : { ...target, transition: INSTANT },
    ]),
  );
}

/** Lazy feature bundle for <LazyMotion>. */
export const loadMotionFeatures = () => import("./motion-features").then((module) => module.default);
