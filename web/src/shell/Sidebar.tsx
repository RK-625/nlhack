// Grok Bot–style sidebar: docked on desktop as either the expanded panel or a compact avatar
// rail, resizable by its edge; a slide-in overlay (always expanded) on mobile.
import { AnimatePresence, animate, type Transition, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import * as m from "motion/react-m";
import { type KeyboardEvent, type PointerEvent, useEffect, useRef, useState } from "react";
import { panelSwap, SPRING_SNAP, sidebarMobile, sidebarResize } from "@/lib/motion";
import { clampWidth, readSidebarCompact, readSidebarWidth, SIDEBAR, writeSidebarLayout } from "@/lib/sidebar";
import { ExpandedPanel, RailPanel, type SidebarPanelProps } from "./SidebarPanels";

export type { SidebarSearch } from "./SidebarPanels";

/** How long pointer moves are ignored after a snap, so the spring isn't cut short. */
const SNAP_SETTLE_MS = 180;

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
 * no animation; switching layouts animates it (mirrored tween for button/double-click/Enter,
 * a fast spring when a drag crosses a snap threshold) while the panels cross-fade.
 */
function DockedSidebar(props: SidebarPanelProps) {
  const reduce = useReducedMotion();
  const [compact, setCompact] = useState(readSidebarCompact);
  const [width, setWidth] = useState(readSidebarWidth);
  const [dragging, setDragging] = useState(false);
  const compactRef = useRef(compact);
  const widthRef = useRef(width);
  const size = useMotionValue(compact ? SIDEBAR.RAIL : width);
  // The expanded panel never lays out narrower than MIN, so it doesn't reflow while shrinking.
  const panelWidth = useTransform(size, (value) => Math.max(value, SIDEBAR.MIN));
  // origin: the expanded width when the drag began — what a snap back to expanded restores.
  const drag = useRef<{ startX: number; base: number; origin: number } | null>(null);
  const settleUntil = useRef(0);

  const commit = (nextWidth: number, nextCompact: boolean) => {
    widthRef.current = nextWidth;
    compactRef.current = nextCompact;
    setWidth(nextWidth);
    setCompact(nextCompact);
    writeSidebarLayout(nextWidth, nextCompact);
  };

  const animateSize = (target: number, transition: Transition) => {
    if (reduce) {
      size.jump(target);
      return;
    }
    settleUntil.current = performance.now() + SNAP_SETTLE_MS;
    animate(size, target, transition);
  };

  const setMode = (nextCompact: boolean, how: "toggle" | "snap") => {
    if (nextCompact === compactRef.current) return;
    commit(widthRef.current, nextCompact);
    animateSize(nextCompact ? SIDEBAR.RAIL : widthRef.current, how === "snap" ? SPRING_SNAP : sidebarResize(!nextCompact));
  };
  const toggle = () => setMode(!compactRef.current, "toggle");

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
    if (!current || performance.now() < settleUntil.current) return;
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
    commit(next, false);
  };

  const panelProps = { ...props, onToggleCompact: toggle };

  return (
    <m.aside
      data-testid="sidebar"
      data-layout={compact ? "rail" : "expanded"}
      data-dragging={dragging || undefined}
      style={{ width: size }}
      className="relative h-full shrink-0 border-e border-sidebar-border bg-sidebar"
    >
      <div className="absolute inset-0 overflow-hidden">
        <AnimatePresence initial={false}>
          {compact ? (
            <m.div
              key="rail"
              variants={panelSwap}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="absolute inset-y-0 start-0"
              style={{ width: SIDEBAR.RAIL }}
            >
              <RailPanel {...panelProps} />
            </m.div>
          ) : (
            <m.div
              key="expanded"
              variants={panelSwap}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="absolute inset-y-0 start-0"
              style={{ width: panelWidth }}
            >
              <ExpandedPanel {...panelProps} />
            </m.div>
          )}
        </AnimatePresence>
      </div>
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
