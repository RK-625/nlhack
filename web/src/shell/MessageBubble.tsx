// Bubble markup ported from rakazo's Transcript/MessageView (apps/web/src/pages/Shell.tsx
// ~5092-5112 and ~6847-6880), Apache-2.0, github.com/elie222/rakazo@912c977.
import { StandaloneToolActivity } from "@/components/chat/ToolActivityDisclosure";
import { ChatMarkdown, LinkifiedText } from "@/components/markdown/markdown.web";
import type { ChatMessage } from "@/hooks/useAgentChat";
import { toolStepCount } from "@/lib/tool-activity-view";

export function MessageBubble({ message }: { message: ChatMessage }) {
  const user = message.role === "user";
  return (
    <div className="relative flex flex-col gap-1.5">
      {!user && message.tools ? (
        <StandaloneToolActivity
          live={false}
          steps={message.tools.steps}
          stepCount={toolStepCount(message.tools.steps)}
          durationMs={message.tools.durationMs}
        />
      ) : null}
      <div className={`relative flex ${user ? "justify-end" : "justify-start"}`}>
        <div
          className={`relative w-fit min-w-0 ${
            user
              ? "max-w-[min(84%,calc(100%_-_8rem))] max-md:max-w-[84%] [@media(hover:none)]:max-w-[84%]"
              : "max-w-[min(88%,calc(100%_-_8rem))] max-md:max-w-[92%] [@media(hover:none)]:max-w-[88%]"
          }`}
        >
          {user ? (
            <div
              data-testid="message-user-bubble"
              className="max-w-full whitespace-pre-wrap wrap-anywhere rounded-[20px] bg-chat-user px-[18px] py-3 text-[15.5px] leading-[1.45] text-chat-user-foreground"
              dir="auto"
            >
              <LinkifiedText>{message.text}</LinkifiedText>
            </div>
          ) : (
            <div
              data-testid="message-bot-bubble"
              className="max-w-full rounded-[20px] bg-muted px-[18px] py-3 text-[15.5px] leading-[1.5] text-foreground/90"
              dir="auto"
            >
              <ChatMarkdown>{message.text}</ChatMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Live placeholder while the agent works: the open tool-activity card, no bubble yet. */
export function WorkingIndicator() {
  return (
    <StandaloneToolActivity live steps={[{ label: "Thinking", count: 1 }]} stepCount={1} />
  );
}
