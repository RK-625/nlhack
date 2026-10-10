import { BotAvatar } from "@/components/avatar/bot-avatar";
import type { AgentSummary } from "@/hooks/useAgents";

// TODO(S2): port rakazo's bots sidebar (Shell.tsx ~2811-3263): header, search, collapse, row styling.
export function Sidebar({
  agents,
  activeKey,
  onSelect,
}: {
  agents: AgentSummary[];
  activeKey: string | null;
  onSelect: (key: string) => void;
}) {
  return (
    <aside className="flex w-[316px] shrink-0 flex-col border-e border-sidebar-border bg-sidebar">
      {agents.map((agent) => (
        <button
          key={agent.key}
          type="button"
          onClick={() => onSelect(agent.key)}
          className={`flex items-center gap-3 rounded-xl px-2.5 py-[10px] text-start ${
            agent.key === activeKey ? "bg-sidebar-accent" : "hover:bg-sidebar-accent"
          }`}
        >
          <BotAvatar color="" identity={agent.id} size={38} />
          <span className="truncate text-[14px] font-medium">{agent.name}</span>
        </button>
      ))}
    </aside>
  );
}
