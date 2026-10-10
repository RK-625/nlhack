import { useAgentChat } from "@/hooks/useAgentChat";
import type { AgentSummary } from "@/hooks/useAgents";
import { ChatHeader } from "./ChatHeader";
import { Composer } from "./Composer";
import { MessageList } from "./MessageList";

// TODO(S2): static shell layout; TODO(S4): live chat via useAgentChat.
export function ChatPane({ agent }: { agent: AgentSummary | null }) {
  const chat = useAgentChat(agent?.key ?? "");
  return (
    <main className="flex min-w-0 flex-1 flex-col bg-background">
      <ChatHeader agent={agent} />
      <MessageList messages={chat.messages} />
      <Composer running={chat.running} onSend={chat.send} onStop={chat.stop} />
    </main>
  );
}
