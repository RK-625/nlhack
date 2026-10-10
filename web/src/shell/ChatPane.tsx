import { useMemo } from "react";
import { BotAvatar } from "@/components/avatar/bot-avatar";
import { useAgentChat } from "@/hooks/useAgentChat";
import type { AgentSummary } from "@/hooks/useAgents";
import { agentAvatarValue } from "@/lib/agent-avatar";
import type { AgentNames } from "@/lib/message-parts";
import { ChatHeader } from "./ChatHeader";
import { Composer } from "./Composer";
import { MessageList } from "./MessageList";

const SUGGESTIONS: Record<string, string[]> = {
  assistant: ["What can your team do?", "Say hi in 5 words", "Ask the CFO about runway at $50k burn"],
  "market-researcher": ["Look up Stripe's headcount", "Top competitors to Mastra", "Funding history of Vercel"],
  cfo: ["What's our runway with $600k and $50k burn?", "Model hiring 2 engineers", "Price a $20/seat plan"],
};
const DEFAULT_SUGGESTIONS = ["What can you help with?", "Give me an example task"];

export function ChatPane({
  agent,
  agents,
  sidebarCollapsed,
  onOpenMobileSidebar,
  onRestoreSidebar,
}: {
  agent: AgentSummary | null;
  agents: AgentSummary[];
  sidebarCollapsed: boolean;
  onOpenMobileSidebar: () => void;
  onRestoreSidebar: () => void;
}) {
  const agentNames = useMemo<AgentNames>(
    () => Object.fromEntries(agents.flatMap((a) => [[a.key, a.name], [a.id, a.name]])),
    [agents],
  );
  if (!agent) {
    return (
      <>
        <ChatHeader
          agent={null}
          running={false}
          sidebarCollapsed={sidebarCollapsed}
          onOpenMobileSidebar={onOpenMobileSidebar}
          onRestoreSidebar={onRestoreSidebar}
        />
        <div className="grid flex-1 place-items-center text-[14px] text-muted-foreground">Pick an agent to start.</div>
      </>
    );
  }
  return (
    <AgentConversation
      key={agent.key}
      agent={agent}
      agentNames={agentNames}
      sidebarCollapsed={sidebarCollapsed}
      onOpenMobileSidebar={onOpenMobileSidebar}
      onRestoreSidebar={onRestoreSidebar}
    />
  );
}

function AgentConversation({
  agent,
  agentNames,
  sidebarCollapsed,
  onOpenMobileSidebar,
  onRestoreSidebar,
}: {
  agent: AgentSummary;
  agentNames: AgentNames;
  sidebarCollapsed: boolean;
  onOpenMobileSidebar: () => void;
  onRestoreSidebar: () => void;
}) {
  const chat = useAgentChat(agent.key);
  return (
    <>
      <ChatHeader
        agent={agent}
        running={chat.running}
        sidebarCollapsed={sidebarCollapsed}
        onOpenMobileSidebar={onOpenMobileSidebar}
        onRestoreSidebar={onRestoreSidebar}
      />
      <MessageList
        messages={chat.messages}
        status={chat.status}
        error={chat.error}
        agentNames={agentNames}
        onRetry={chat.retry}
        onDismissError={chat.dismissError}
        empty={<EmptyState agent={agent} onPick={chat.send} />}
      />
      <Composer agentName={agent.name} running={chat.running} onSend={chat.send} onStop={chat.stop} />
    </>
  );
}

function EmptyState({ agent, onPick }: { agent: AgentSummary; onPick: (text: string) => void }) {
  return (
    <div className="m-auto flex max-w-md flex-col items-center gap-3 px-6 py-10 text-center">
      <BotAvatar color={agentAvatarValue(agent.id)} identity={agent.id} size={64} />
      <h2 className="mt-1 text-[20px] font-semibold text-foreground">{agent.name}</h2>
      <p className="text-[14px] leading-[1.5] text-muted-foreground">{agent.description}</p>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        {(SUGGESTIONS[agent.id] ?? DEFAULT_SUGGESTIONS).map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onPick(suggestion)}
            className="rounded-full border border-border bg-card px-3.5 py-1.5 text-[13px] text-foreground/80 transition-colors hover:bg-accent hover:text-foreground"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
