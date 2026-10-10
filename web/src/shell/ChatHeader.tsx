// Ported from rakazo's chat header (apps/web/src/pages/Shell.tsx ~3513-3590),
// Apache-2.0, github.com/elie222/rakazo@912c977.
import { Menu, PanelLeftOpen } from "lucide-react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { BotAvatar } from "@/components/avatar/bot-avatar";
import type { AgentSummary } from "@/hooks/useAgents";
import { agentAvatarValue } from "@/lib/agent-avatar";
import { DISTANCE, fade, SPRING, symmetric } from "@/lib/motion";

/** The restore button slides out from where the sidebar's edge was. */
const restoreButton = symmetric({ x: -DISTANCE.md, scale: 0.9 });

export function ChatHeader({
  agent,
  running,
  sidebarCollapsed,
  onOpenMobileSidebar,
  onRestoreSidebar,
}: {
  agent: AgentSummary | null;
  running: boolean;
  sidebarCollapsed: boolean;
  onOpenMobileSidebar: () => void;
  onRestoreSidebar: () => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-sidebar-border px-3 py-[13px] md:px-[22px]">
      {/* relative: popLayout positions the leaving restore button inside this row. */}
      <div className="relative flex min-w-0 items-center gap-2">
        <button
          type="button"
          aria-label="Open navigation"
          onClick={onOpenMobileSidebar}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-foreground/75 hover:bg-accent md:hidden"
        >
          <Menu size={19} strokeWidth={1.7} />
        </button>
        <AnimatePresence initial={false} mode="popLayout">
          {sidebarCollapsed ? (
            <m.button
              key="restore"
              type="button"
              aria-label="Show agents"
              title="Show agents"
              onClick={onRestoreSidebar}
              variants={restoreButton}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="hidden h-8 w-8 shrink-0 place-items-center rounded-lg text-foreground/75 hover:bg-accent md:grid"
            >
              <PanelLeftOpen size={19} strokeWidth={1.7} aria-hidden="true" />
            </m.button>
          ) : null}
        </AnimatePresence>
        {agent ? (
          // Slides over (instead of jumping) when the restore button comes and goes.
          <m.div layout="position" transition={SPRING} className="flex min-w-0 items-center gap-3">
            <BotAvatar
              color={agentAvatarValue(agent.id)}
              identity={agent.id}
              size={26}
              status={running ? "running" : undefined}
            />
            <span className="min-w-0">
              <span className="block truncate text-[16px] font-medium text-foreground" dir="auto">
                {agent.name}
              </span>
              <AnimatePresence mode="wait" initial={false}>
                <m.span
                  key={running ? "working" : "idle"}
                  variants={fade}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="block truncate text-[12.5px] text-muted-foreground"
                  dir="auto"
                >
                  {running ? "Working…" : agent.description}
                </m.span>
              </AnimatePresence>
            </span>
          </m.div>
        ) : (
          <span className="text-[16px] font-medium text-foreground">Select an agent</span>
        )}
      </div>
    </div>
  );
}
