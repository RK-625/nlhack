// Grok Bot–style chat header: a small pill floating at the top center of the chat pane.
// (Replaces the rakazo header bar; the sidebar rail makes a "show sidebar" button unnecessary.)
import { ChevronDown, Menu } from "lucide-react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { useEffect, useId, useRef, useState } from "react";
import { BotAvatar } from "@/components/avatar/bot-avatar";
import { Collapse } from "@/components/motion/Collapse";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAgentCaps } from "@/hooks/useAgentCaps";
import type { AgentSummary } from "@/hooks/useAgents";
import { agentAvatarValue } from "@/lib/agent-avatar";
import { DURATION, enterTransition, exitTransition, pop } from "@/lib/motion";
import { useNeatlogsUsage } from "@/hooks/useNeatlogsUsage";
import type { LatestTurnUsage } from "@/lib/turn-usage";
import { cn } from "@/lib/utils";
import { UsagePanel } from "./UsagePanel";

export function ChatHeader({
  agent,
  running,
  usage = null,
  onOpenMobileSidebar,
}: {
  agent: AgentSummary | null;
  running: boolean;
  /** The latest turn's usage (live while it streams), with the reply it belongs to. */
  usage?: LatestTurnUsage | null;
  onOpenMobileSidebar: () => void;
}) {
  return (
    // Floats over the transcript; the gradient lets scrolled text fade out under the pill.
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex min-h-16 flex-col items-center bg-linear-to-b from-background via-background/85 to-transparent px-3 pt-3">
      <button
        type="button"
        aria-label="Open navigation"
        onClick={onOpenMobileSidebar}
        className="pointer-events-auto absolute start-3 top-3 grid h-9 w-9 place-items-center rounded-full border border-border bg-card/80 text-foreground/80 shadow-sm backdrop-blur transition-colors duration-(--motion-fast) ease-(--ease-standard) hover:bg-accent md:hidden"
      >
        <Menu size={17} strokeWidth={1.8} />
      </button>
      {agent ? (
        <AgentPill agent={agent} running={running} latest={usage} />
      ) : (
        <span className="pointer-events-auto rounded-full border border-border bg-card/80 px-3.5 py-1.5 text-[13.5px] font-medium text-foreground">
          Select an agent
        </span>
      )}
    </div>
  );
}

/**
 * The agent-name pill. Clicking it toggles the usage row below it; a capped turn marks the pill
 * and opens the row once for that reply.
 */
function AgentPill({
  agent,
  running,
  latest,
}: {
  agent: AgentSummary;
  running: boolean;
  latest: LatestTurnUsage | null;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const caps = useAgentCaps(agent.key);
  const usage = latest?.usage ?? null;
  const neatlogs = useNeatlogsUsage(agent.key, latest);
  const capped = usage?.capped === true;

  // Auto-expand once per capped reply (live or on reload), so the full bar is visible.
  const expandedFor = useRef<string | null>(null);
  const cappedId = capped ? latest!.messageId : null;
  useEffect(() => {
    if (cappedId && expandedFor.current !== cappedId) {
      expandedFor.current = cappedId;
      setOpen(true);
    }
  }, [cappedId]);

  return (
    <>
      <Tooltip disabled={open}>
        <TooltipTrigger
          render={
            <button
              type="button"
              data-testid="chat-header-pill"
              aria-expanded={open}
              aria-controls={open ? panelId : undefined}
              aria-label={`${agent.name}: usage and limits${capped ? " (last turn hit a limit)" : ""}`}
              onClick={() => setOpen((value) => !value)}
              className={cn(
                "pointer-events-auto flex h-9 min-w-0 max-w-[min(420px,calc(100%-7rem))] cursor-pointer items-center gap-2 rounded-full border bg-card/80 py-1 pe-2.5 ps-1.5 shadow-sm outline-none backdrop-blur transition-colors duration-(--motion-fast) ease-(--ease-standard) hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring",
                capped ? "border-destructive/50 ring-1 ring-destructive/25" : "border-border",
              )}
            />
          }
        >
          <BotAvatar
            color={agentAvatarValue(agent.id)}
            identity={agent.id}
            size={24}
            status={running ? "running" : undefined}
          />
          <span className="min-w-0 truncate text-[13.5px] font-medium text-foreground" dir="auto">
            {agent.name}
          </span>
          {/* Subtle working indicator: a pulsing dot while a reply runs; a red dot once capped. */}
          <AnimatePresence initial={false} mode="popLayout">
            {running ? (
              <m.span
                key="working"
                data-testid="pill-working"
                aria-label="Working"
                variants={pop}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="grid h-2 w-2 shrink-0 place-items-center"
              >
                <span
                  className="h-2 w-2 rounded-full bg-warning"
                  style={{ animation: "rkPulse 1.2s ease-in-out infinite" }}
                />
              </m.span>
            ) : capped ? (
              <m.span
                key="capped"
                data-testid="pill-capped"
                aria-hidden
                variants={pop}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="h-2 w-2 shrink-0 rounded-full bg-destructive"
              />
            ) : null}
          </AnimatePresence>
          <m.span
            aria-hidden
            className="inline-flex text-muted-foreground"
            initial={false}
            animate={{ rotate: open ? 180 : 0 }}
            transition={open ? enterTransition(DURATION.fast) : exitTransition(DURATION.fast)}
          >
            <ChevronDown size={14} strokeWidth={1.8} />
          </m.span>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={8} className="max-w-[320px] text-center leading-[1.45]">
          {agent.description}
        </TooltipContent>
      </Tooltip>
      <Collapse open={open}>
        <UsagePanel id={panelId} usage={usage} neatlogs={neatlogs} caps={caps} />
      </Collapse>
    </>
  );
}
