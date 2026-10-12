// Modified from rakazo (Apache-2.0), github.com/elie222/rakazo@912c977
import { ChevronRight } from "lucide-react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { type ReactNode, useState } from "react";
import { Collapse } from "@/components/motion/Collapse";
import { DISTANCE, DURATION, enterTransition, exitTransition, symmetric } from "@/lib/motion";
import { formatToolActivityDuration, toolStepCount } from "@/lib/tool-activity-view";

/** Step rows slide in as tools start and out when the live window moves past them. */
const stepRow = symmetric({ y: DISTANCE.sm }, DURATION.fast);

/** `status` overrides the currentIndex-based icon (Bot Company: per-step state from AI SDK tool parts). */
export type ToolStep = { label: string; count: number; status?: "running" | "done" | "error" | "denied" };

/** A run's tool steps (rakazo's `steps` message block shape). */
export type ToolStepsBlock = { kind: "steps"; steps: ToolStep[]; durationMs?: number };

/** Replaces lingui's <Plural>: "#" is substituted with the count. */
function plural(n: number, one: string, other: string): string {
  return (n === 1 ? one : other).replace("#", String(n));
}

/** While a run is live, only the most recent steps are listed so a long run does not push the chat down. */
export const LIVE_TOOL_STEP_WINDOW = 6;

export function ToolSteps({
  steps,
  currentIndex,
  limit,
}: {
  steps: readonly ToolStep[];
  currentIndex?: number;
  /** Show only the last `limit` steps, with a count of the earlier ones above them. */
  limit?: number;
}) {
  const hidden = limit !== undefined && steps.length > limit ? steps.length - limit : 0;
  const shown = hidden > 0 ? steps.slice(hidden) : steps;
  return (
    <div className="space-y-0.5" data-testid="tool-rows">
      {hidden > 0 ? (
        <div className="text-[12px] leading-5 text-muted-foreground" data-testid="tool-rows-hidden">
          {plural(hidden, "+# earlier step", "+# earlier steps")}
        </div>
      ) : null}
      <AnimatePresence initial={false}>
      {shown.map((step, offset) => {
        const index = hidden + offset;
        const status = step.status ?? (index === currentIndex ? "running" : "done");
        const isCurrent = status === "running";
        return (
          <m.div
            key={index}
            variants={stepRow}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="flex min-w-0 items-center gap-2 leading-5"
          >
            <span
              className={`text-[12px] ${
                isCurrent
                  ? "text-warning"
                  : status === "error"
                    ? "text-destructive"
                    : status === "denied"
                      ? "text-muted-foreground"
                      : "text-success"
              }`}
              style={{ animation: isCurrent ? "rkPulse 1.2s ease-in-out infinite" : undefined }}
            >
              {isCurrent ? "◷" : status === "error" ? "✕" : status === "denied" ? "⊘" : "✓"}
            </span>
            <span
              className={`min-w-0 flex-1 truncate text-[13px] ${
                isCurrent ? "text-foreground" : "text-muted-foreground"
              }`}
              title={step.label}
            >
              {step.label}
              {step.count > 1 ? ` ×${step.count}` : ""}
              {status === "denied" ? " · declined" : ""}
            </span>
          </m.div>
        );
      })}
      </AnimatePresence>
    </div>
  );
}

/**
 * The tool-activity card. It starts open while the run is live and folds when the run
 * ends (Bot Company: a height-auto Collapse replaces rakazo's <details> so opening and closing
 * animate symmetrically). A manual toggle during the run holds until `live` changes.
 */
export function ToolActivityDisclosure({
  live,
  stepCount,
  durationMs,
  children,
}: {
  live: boolean;
  stepCount: number;
  durationMs?: number;
  children: ReactNode;
}) {
  const duration = formatToolActivityDuration(durationMs);
  const [open, setOpen] = useState(live);
  const [wasLive, setWasLive] = useState(live);
  if (live !== wasLive) {
    // Re-derive from the prop when the run starts or ends (React's "adjust state on prop change").
    setWasLive(live);
    setOpen(live);
  }
  return (
    <div data-testid="tool-activity" data-live={live || undefined} data-open={open || undefined}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={`flex min-h-6 w-fit cursor-pointer items-center gap-1 rounded-md py-0.5 pe-1.5 text-[13px] font-medium outline-none transition-colors duration-(--motion-fast) ease-(--ease-standard) hover:text-foreground/75 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
          live ? "text-foreground/75" : "text-muted-foreground"
        }`}
      >
        <m.span
          aria-hidden
          className="inline-flex"
          initial={false}
          animate={{ rotate: open ? 90 : 0 }}
          transition={open ? enterTransition(DURATION.fast) : exitTransition(DURATION.fast)}
        >
          <ChevronRight size={14} strokeWidth={1.8} />
        </m.span>
        {live ? (
          plural(stepCount, "Working… · # tool", "Working… · # tools")
        ) : (
          <>
            {plural(stepCount, "Done · # tool", "Done · # tools")}
            {duration ? ` · ${duration}` : null}
          </>
        )}
      </button>
      <Collapse open={open}>
        <div className="ms-[7px] mt-0.5 border-s border-border ps-3">{children}</div>
      </Collapse>
    </div>
  );
}

/**
 * A tools-only message: a plain muted line between messages, not a chat bubble.
 */
export function StandaloneToolActivity({
  live,
  steps,
  stepCount,
  durationMs,
}: {
  live: boolean;
  steps: readonly ToolStep[];
  stepCount: number;
  durationMs?: number;
}) {
  return (
    <div className="flex justify-start" dir="ltr" data-testid="tool-activity-line">
      <div className="max-w-[74%] min-w-0 ps-1">
        <ToolActivityDisclosure live={live} stepCount={stepCount} durationMs={durationMs}>
          <ToolSteps
            steps={steps}
            currentIndex={live ? steps.length - 1 : undefined}
            limit={live ? LIVE_TOOL_STEP_WINDOW : undefined}
          />
        </ToolActivityDisclosure>
      </div>
    </div>
  );
}

/** A bot message whose only visible blocks are tool cards: one slim line per card, no bubble. */
export function ToolOnlyNarration({
  blocks,
  live,
}: {
  blocks: readonly ToolStepsBlock[];
  live: boolean;
}) {
  return (
    <>
      {blocks.map((block, i) =>
        block.kind === "steps" ? (
          <StandaloneToolActivity
            key={i}
            live={live}
            steps={block.steps}
            stepCount={toolStepCount(block.steps)}
            durationMs={block.durationMs}
          />
        ) : null,
      )}
    </>
  );
}
