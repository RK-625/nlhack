// Grok Bot–style chat header: a small pill floating at the top center of the chat pane.
// (Replaces the rakazo header bar; the sidebar rail makes a "show sidebar" button unnecessary.)
import { Menu } from "lucide-react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { BotAvatar } from "@/components/avatar/bot-avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { AgentSummary } from "@/hooks/useAgents";
import { agentAvatarValue } from "@/lib/agent-avatar";
import { pop } from "@/lib/motion";

export function ChatHeader({
  agent,
  running,
  onOpenMobileSidebar,
}: {
  agent: AgentSummary | null;
  running: boolean;
  onOpenMobileSidebar: () => void;
}) {
  return (
    // Floats over the transcript; the gradient lets scrolled text fade out under the pill.
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex h-16 items-start justify-center bg-linear-to-b from-background via-background/85 to-transparent px-3 pt-3">
      <button
        type="button"
        aria-label="Open navigation"
        onClick={onOpenMobileSidebar}
        className="pointer-events-auto absolute start-3 top-3 grid h-9 w-9 place-items-center rounded-full border border-border bg-card/80 text-foreground/80 shadow-sm backdrop-blur transition-colors duration-(--motion-fast) ease-(--ease-standard) hover:bg-accent md:hidden"
      >
        <Menu size={17} strokeWidth={1.8} />
      </button>
      {agent ? (
        <Tooltip>
          <TooltipTrigger
            render={
              <div
                tabIndex={0}
                data-testid="chat-header-pill"
                className="pointer-events-auto flex h-9 min-w-0 max-w-[min(420px,calc(100%-7rem))] items-center gap-2 rounded-full border border-border bg-card/80 py-1 pe-3.5 ps-1.5 shadow-sm outline-none backdrop-blur focus-visible:ring-2 focus-visible:ring-ring"
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
            {/* Subtle working indicator: a pulsing dot while a reply runs. */}
            <AnimatePresence initial={false}>
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
              ) : null}
            </AnimatePresence>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={8} className="max-w-[320px] text-center leading-[1.45]">
            {agent.description}
          </TooltipContent>
        </Tooltip>
      ) : (
        <span className="pointer-events-auto rounded-full border border-border bg-card/80 px-3.5 py-1.5 text-[13.5px] font-medium text-foreground">
          Select an agent
        </span>
      )}
    </div>
  );
}
