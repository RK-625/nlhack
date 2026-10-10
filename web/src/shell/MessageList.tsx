import type { ChatMessage } from "@/hooks/useAgentChat";
import { MessageBubble } from "./MessageBubble";

// TODO(S2): port rakazo's Transcript (Shell.tsx ~4736) with follow-scroll from lib/transcript-scroll.
export function MessageList({ messages }: { messages: ChatMessage[] }) {
  return (
    <div className="rk-scroll flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-4 py-5 md:px-7 md:py-6">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
    </div>
  );
}
