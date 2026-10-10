// Ported from rakazo's chat header (apps/web/src/pages/Shell.tsx ~3513-3590),
// Apache-2.0, github.com/elie222/rakazo@912c977.
import { Menu, PanelLeftOpen } from "lucide-react";
import { BotAvatar } from "@/components/avatar/bot-avatar";
import type { AgentSummary } from "@/hooks/useAgents";
import { agentAvatarValue } from "@/lib/agent-avatar";

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
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          aria-label="Open navigation"
          onClick={onOpenMobileSidebar}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-foreground/75 hover:bg-accent md:hidden"
        >
          <Menu size={19} strokeWidth={1.7} />
        </button>
        {sidebarCollapsed ? (
          <button
            type="button"
            aria-label="Show agents"
            title="Show agents"
            onClick={onRestoreSidebar}
            className="hidden h-8 w-8 shrink-0 place-items-center rounded-lg text-foreground/75 hover:bg-accent md:grid"
          >
            <PanelLeftOpen size={19} strokeWidth={1.7} aria-hidden="true" />
          </button>
        ) : null}
        {agent ? (
          <div className="flex min-w-0 items-center gap-3">
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
              <span className="block truncate text-[12.5px] text-muted-foreground" dir="auto">
                {running ? "Working…" : agent.description}
              </span>
            </span>
          </div>
        ) : (
          <span className="text-[16px] font-medium text-foreground">Select an agent</span>
        )}
      </div>
    </div>
  );
}
