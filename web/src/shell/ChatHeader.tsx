import type { AgentSummary } from "@/hooks/useAgents";

// TODO(S2): port rakazo's chat header (Shell.tsx ~3513-3590): avatar, name, mobile menu, sidebar restore.
export function ChatHeader({ agent }: { agent: AgentSummary | null }) {
  return (
    <div className="border-b border-sidebar-border px-[22px] py-[17px] text-[16px] font-medium">
      {agent?.name ?? "Select an agent"}
    </div>
  );
}
