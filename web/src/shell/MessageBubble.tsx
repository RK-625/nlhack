import { ChatMarkdown, LinkifiedText } from "@/components/markdown/markdown.web";
import type { ChatMessage } from "@/hooks/useAgentChat";

// TODO(S2): port rakazo's MessageView bubbles (Shell.tsx ~6847-6880); S6 adds tool/sub-agent parts.
export function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-full whitespace-pre-wrap rounded-[20px] bg-chat-user px-[18px] py-3 text-[15.5px] text-chat-user-foreground">
          <LinkifiedText>{message.text}</LinkifiedText>
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-start">
      <div className="max-w-full rounded-[20px] bg-muted px-[18px] py-3 text-[15.5px] text-foreground/90">
        <ChatMarkdown>{message.text}</ChatMarkdown>
      </div>
    </div>
  );
}
