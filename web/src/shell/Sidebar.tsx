// Grok Bot–style sidebar: docked on desktop as either the expanded panel or a compact avatar
// rail, resizable by its edge; a slide-in overlay (always expanded) on mobile.
import { animate, delay, type Transition, useMotionValue, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { type KeyboardEvent, type PointerEvent, useEffect, useLayoutEffect, useRef, useState } from "react";
import { DURATION, SPRING_SNAP, sidebarMobile, sidebarResize } from "@/lib/motion";
import { clampWidth, readSidebarCompact, readSidebarWidth, SIDEBAR, writeSidebarLayout } from "@/lib/sidebar";
import { ExpandedPanel, RailPanel, SidebarMorphContext, type SidebarPanelProps } from "./SidebarPanels";

export type { SidebarSearch } from "./SidebarPanels";

/** How long pointer moves are ignored after a snap, so the spring isn't cut short. */
const SNAP_SETTLE_MS = 180;
/** If no shared avatar starts travelling after a flip, start the width anyway. */
const TRAVEL_FALLBACK_MS = 50;

export function Sidebar({ docked, ...props }: SidebarPanelProps & { docked: boolean }) {
  return docked ? <DockedSidebar {...props} /> : <OverlaySidebar {...props} />;
}

/** Mobile: slides in from the start edge (App mounts it under AnimatePresence). */
function OverlaySidebar(props: SidebarPanelProps) {
  return (
    <m.aside
      data-testid="sidebar"
      data-layout="overlay"
      variants={sidebarMobile}
      initial="hidden"
      animate="visible"
      exit="hidden"
      className="absolute inset-y-0 start-0 z-40 flex w-[calc(100%-48px)] max-w-[284px] flex-col border-e border-sidebar-border bg-sidebar"
    >
      <ExpandedPanel {...props} />
    </m.aside>
  );
}

/**
 * Desktop: always docked. Width is a motion value so dragging follows the pointer 1:1 with
 * no animation. Switching layouts is a three-phase morph (see SidebarMorphContext): labels
 * fade out, then the layouts flip while the shared avatars and the width travel together
 * (mirrored tween for button/double-click/Enter, a fast spring for drag snaps), then labels
 * fade in. Collapse plays the same sequence backwards.
 */
function DockedSidebar(props: SidebarPanelProps) {
  const reduce = useReducedMotion();
  const [compact, setCompact] = useState(readSidebarCompact);
  const [width, setWidth] = useState(readSidebarWidth);
  const [dragging, setDragging] = useState(false);
  const [chrome, setChromeState] = useState(true);
  const [travel, setTravel] = useState<Transition | undefined>(undefined);
  /** Layout currently rendered. */
  const compactRef = useRef(compact);
  /** Layout being moved to (differs from compactRef while phase 1 is pending). */
  const targetRef = useRef(compact);
  const chromeRef = useRef(true);
  const widthRef = useRef(width);
  const size = useMotionValue(compact ? SIDEBAR.RAIL : width);
  // The expanded panel's own width, pinned to its target (not derived from `size`), so its
  // layout — the centered tile, row widths — doesn't drift while the aside animates.
  const panelWidth = useMotionValue(width);
  // origin: the expanded width when the drag began — what a snap back to expanded restores.
  const drag = useRef<{ startX: number; base: number; origin: number } | null>(null);
  const settleUntil = useRef(0);
  /** Increments per setMode; stale timers/animation callbacks compare against it. */
  const runRef = useRef(0);
  const cancelFlip = useRef<(() => void) | null>(null);
  const pendingTravel = useRef<{ run: number; target: number; transition: Transition } | null>(null);
  const [flipCount, setFlipCount] = useState(0);

  const setChrome = (value: boolean) => {
    chromeRef.current = value;
    setChromeState(value);
  };

  const commit = (nextWidth: number, nextCompact: boolean) => {
    widthRef.current = nextWidth;
    compactRef.current = nextCompact;
    setWidth(nextWidth);
    setCompact(nextCompact);
    writeSidebarLayout(nextWidth, nextCompact);
  };

  const setMode = (nextCompact: boolean, how: "toggle" | "snap") => {
    if (nextCompact === targetRef.current) return;
    targetRef.current = nextCompact;
    const run = ++runRef.current;
    cancelFlip.current?.();
    cancelFlip.current = null;

    // Reversed during phase 1: the layouts never flipped, so just bring the labels back.
    if (nextCompact === compactRef.current) {
      setChrome(true);
      return;
    }

    const target = nextCompact ? SIDEBAR.RAIL : widthRef.current;
    if (reduce) {
      size.jump(target);
      if (!nextCompact) panelWidth.jump(widthRef.current);
      commit(widthRef.current, nextCompact);
      setChrome(true);
      return;
    }

    const transition = how === "snap" ? SPRING_SNAP : sidebarResize(!nextCompact);
    // Phase 2: flip the layouts; shared avatars travel with the width. The width animation
    // itself starts in the flip's layout effect (below), i.e. after React commits the new
    // layout — the same frame the avatars' layout animations start — so both land together.
    const flip = () => {
      if (run !== runRef.current) return;
      cancelFlip.current = null;
      settleUntil.current = performance.now() + SNAP_SETTLE_MS;
      if (!nextCompact) panelWidth.jump(widthRef.current);
      pendingTravel.current = { run, target, transition };
      setTravel(transition);
      setFlipCount((count) => count + 1);
      commit(widthRef.current, nextCompact);
    };

    // Phase 1: labels fade out first (skipped if they're already hidden mid-morph).
    if (chromeRef.current) {
      setChrome(false);
      cancelFlip.current = delay(flip, DURATION.fast * 1000);
    } else {
      flip();
    }
  };
  const toggle = () => setMode(!targetRef.current, "toggle");
  /** Phase 1 in progress: the layouts are about to flip. */
  const flipPending = () => cancelFlip.current !== null;

  /**
   * Phase 2's width animation starts together with the shared avatars' layout animations
   * (their onLayoutAnimationStart), so width and avatars run on one clock and land on the
   * same frame. Depending on the layout being mounted, Motion starts those a frame after
   * the commit, so starting the width at commit time would let it lead by a frame.
   */
  const startTravel = () => {
    const pending = pendingTravel.current;
    if (!pending) return;
    pendingTravel.current = null;
    // onStop as well as onComplete: a stopped animation never resolves (a drag jump or a
    // newer run stops it); the run id ignores stale ones.
    const landed = () => {
      if (pending.run === runRef.current) setChrome(true);
    };
    animate(size, pending.target, { ...pending.transition, onComplete: landed, onStop: landed });
  };
  // Fallback when no avatar travels (e.g. no agents): start shortly after the flip commits.
  useLayoutEffect(() => {
    if (!pendingTravel.current) return;
    return delay(startTravel, TRAVEL_FALLBACK_MS);
  }, [flipCount]);

  // No text selection and a resize cursor everywhere while dragging.
  useEffect(() => {
    if (!dragging) return;
    const { style } = document.body;
    const previous = { userSelect: style.userSelect, cursor: style.cursor };
    style.userSelect = "none";
    style.cursor = "col-resize";
    return () => {
      style.userSelect = previous.userSelect;
      style.cursor = previous.cursor;
    };
  }, [dragging]);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      startX: event.clientX,
      base: compactRef.current ? SIDEBAR.RAIL : size.get(),
      origin: widthRef.current,
    };
    setDragging(true);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    // Ignore moves while a snap is fading its labels out (phase 1) or its spring is settling.
    if (!current || flipPending() || performance.now() < settleUntil.current) return;
    const candidate = current.base + (event.clientX - current.startX);
    if (compactRef.current) {
      if (candidate > SIDEBAR.SNAP_TO_EXPANDED) {
        setMode(false, "snap");
        drag.current = { ...current, startX: event.clientX, base: widthRef.current };
      }
      return;
    }
    if (candidate < SIDEBAR.SNAP_TO_RAIL) {
      // The edge passed through MIN on the way here; remember the width the drag started at.
      widthRef.current = current.origin;
      setMode(true, "snap");
      drag.current = { ...current, startX: event.clientX, base: SIDEBAR.RAIL };
      return;
    }
    // Between MIN and the snap threshold the edge holds at MIN (a little resistance).
    const next = clampWidth(candidate);
    size.jump(next);
    panelWidth.jump(next);
    widthRef.current = next;
  };

  const endDrag = () => {
    if (!drag.current) return;
    drag.current = null;
    setDragging(false);
    commit(widthRef.current, compactRef.current);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggle();
      return;
    }
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    // Arrow resizing waits for an in-flight morph (Enter can still reverse it).
    if (flipPending() || !chromeRef.current) return;
    const step = event.shiftKey ? SIDEBAR.STEP_LARGE : SIDEBAR.STEP;
    const grow = event.key === "ArrowRight";
    if (compactRef.current) {
      if (grow) setMode(false, "toggle");
      return;
    }
    if (!grow && widthRef.current <= SIDEBAR.MIN) {
      setMode(true, "toggle");
      return;
    }
    const next = clampWidth(widthRef.current + (grow ? step : -step));
    size.jump(next);
    panelWidth.jump(next);
    commit(next, false);
  };

  const panelProps = { ...props, onToggleCompact: toggle };

  return (
    <m.aside
      data-testid="sidebar"
      data-layout={compact ? "rail" : "expanded"}
      data-morph={chrome ? "idle" : "morphing"}
      data-dragging={dragging || undefined}
      style={{ width: size }}
      className="relative h-full shrink-0 border-e border-sidebar-border bg-sidebar"
    >
      <SidebarMorphContext.Provider value={{ chrome, travel, onTravelStart: startTravel }}>
        {/* No AnimatePresence: by the flip the old layout holds only faded labels and the
            shared avatars, which hand off to the new layout's copies (layoutId). */}
        <div className="absolute inset-0 overflow-hidden">
          {compact ? (
            <div key="rail" className="absolute inset-0">
              <RailPanel {...panelProps} />
            </div>
          ) : (
            <m.div key="expanded" className="absolute inset-y-0 start-0" style={{ width: panelWidth }}>
              <ExpandedPanel {...panelProps} />
            </m.div>
          )}
        </div>
      </SidebarMorphContext.Provider>
      {/* Resize handle on the end edge: drag, double-click, or keyboard (arrows resize, Enter toggles). */}
      <div
        role="separator"
        tabIndex={0}
        aria-orientation="vertical"
        aria-label="Resize sidebar"
        aria-valuemin={SIDEBAR.RAIL}
        aria-valuemax={SIDEBAR.MAX}
        aria-valuenow={compact ? SIDEBAR.RAIL : width}
        aria-valuetext={compact ? "Compact" : `${width} pixels`}
        data-testid="sidebar-resize"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={endDrag}
        onDoubleClick={toggle}
        onKeyDown={onKeyDown}
        className="group absolute inset-y-0 -end-1.5 z-30 w-3 cursor-col-resize touch-none outline-none"
      >
        <span
          aria-hidden="true"
          className={`absolute inset-y-0 start-1/2 w-0.5 -translate-x-1/2 transition-colors duration-(--motion-fast) ease-(--ease-standard) group-hover:bg-ring/45 group-focus-visible:bg-ring ${
            dragging ? "bg-ring/70" : "bg-transparent"
          }`}
        />
      </div>
    </m.aside>
  );
}
