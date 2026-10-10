// Bubble markup ported from rakazo's Transcript/MessageView (apps/web/src/pages/Shell.tsx
// ~5092-5112 and ~6847-6880), Apache-2.0, github.com/elie222/rakazo@912c977.
import type { UIMessage } from "ai";
import { ChevronRight, RotateCcw, X } from "lucide-react";
import type { ReactNode } from "react";
import { StandaloneToolActivity } from "@/components/chat/ToolActivityDisclosure";
import { ChatMarkdown, LinkifiedText } from "@/components/markdown/markdown.web";
import { type AgentNames, messageSegments, messageText, toolsDurationMs } from "@/lib/message-parts";
import { toolStepCount } from "@/lib/tool-activity-view";

const USER_WIDTH = "max-w-[min(84%,calc(100%_-_8rem))] max-md:max-w-[84%] [@media(hover:none)]:max-w-[84%]";
const BOT_WIDTH = "max-w-[min(88%,calc(100%_-_8rem))] max-md:max-w-[92%] [@media(hover:none)]:max-w-[88%]";

function Row({ user, children }: { user: boolean; children: ReactNode }) {
  return (
    <div className={`relative flex ${user ? "justify-end" : "justify-start"}`}>
      <div className={`relative w-fit min-w-0 ${user ? USER_WIDTH : BOT_WIDTH}`}>{children}</div>
    </div>
  );
}

export function MessageBubble({
  message,
  streaming,
  agentNames,
}: {
  message: UIMessage;
  /** This is the assistant message currently being streamed. */
  streaming: boolean;
  agentNames: AgentNames;
}) {
  if (message.role === "user") {
    const text = messageText(message);
    if (!text) return null;
    return (
      <Row user>
        <div
          data-testid="message-user-bubble"
          className="max-w-full whitespace-pre-wrap wrap-anywhere rounded-[20px] bg-chat-user px-[18px] py-3 text-[15.5px] leading-[1.45] text-chat-user-foreground"
          dir="auto"
        >
          <LinkifiedText>{text}</LinkifiedText>
        </div>
      </Row>
    );
  }

  const segments = messageSegments(message, agentNames);
  return (
    <div className="relative flex flex-col gap-1.5">
      {segments.map((segment, index) => {
        const last = index === segments.length - 1;
        if (segment.kind === "tools") {
          const live = streaming && segment.steps.some((step) => step.status === "running");
          return (
            <StandaloneToolActivity
              key={segment.key}
              live={live}
              steps={segment.steps}
              stepCount={toolStepCount(segment.steps)}
              durationMs={live ? undefined : toolsDurationMs(segment.callIds)}
            />
          );
        }
        if (segment.kind === "reasoning") {
          return (
            <details key={segment.key} className="group ps-1 text-[13px] text-muted-foreground">
              <summary className="flex w-fit cursor-pointer list-none items-center gap-1 font-medium hover:text-foreground/75">
                <ChevronRight size={14} strokeWidth={1.8} className="transition-transform group-open:rotate-90" />
                Reasoning
              </summary>
              <div className="ms-[7px] mt-1 whitespace-pre-wrap border-s border-border ps-3 leading-[1.5]">
                {segment.text}
              </div>
            </details>
          );
        }
        return (
          <Row key={segment.key} user={false}>
            <div
              data-testid="message-bot-bubble"
              className="max-w-full rounded-[20px] bg-muted px-[18px] py-3 text-[15.5px] leading-[1.5] text-foreground/90"
              dir="auto"
            >
              <ChatMarkdown streaming={streaming && last}>{segment.text}</ChatMarkdown>
            </div>
          </Row>
        );
      })}
    </div>
  );
}

/** Live placeholder until the agent's first visible output arrives. */
export function WorkingIndicator() {
  return <StandaloneToolActivity live steps={[{ label: "Thinking", count: 1, status: "running" }]} stepCount={1} />;
}

/** Inline error with retry, shown under the transcript when a request fails. */
export function ErrorBubble({
  error,
  onRetry,
  onDismiss,
}: {
  error: Error;
  onRetry: () => void;
  onDismiss: () => void;
}) {
  return (
    <Row user={false}>
      <div
        role="alert"
        data-testid="message-error"
        className="flex max-w-full items-start gap-3 rounded-[20px] border border-destructive/40 bg-destructive/10 px-[18px] py-3 text-[14.5px] leading-[1.45] text-foreground/90"
      >
        <div className="min-w-0 flex-1">
          <div className="font-medium text-destructive">The agent couldn't reply.</div>
          <div className="mt-0.5 line-clamp-3 break-words text-[13px] text-muted-foreground">{describeError(error)}</div>
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-[13px] text-foreground/85 hover:bg-accent"
          >
            <RotateCcw size={13} strokeWidth={1.8} />
            Retry
          </button>
        </div>
        <button
          type="button"
          aria-label="Dismiss error"
          onClick={onDismiss}
          className="text-muted-foreground hover:text-foreground"
        >
          <X size={15} strokeWidth={1.8} />
        </button>
      </div>
    </Row>
  );
}

function describeError(error: Error): string {
  const raw = error.message || "Unknown error";
  // DefaultChatTransport surfaces the response body; unwrap our JSON errors.
  try {
    const parsed = JSON.parse(raw) as { error?: unknown };
    if (typeof parsed.error === "string") return parsed.error;
  } catch {}
  if (/failed to fetch|networkerror|load failed/i.test(raw)) return "Can't reach the server. Check that it is running.";
  return raw.length > 300 ? `${raw.slice(0, 300)}…` : raw;
}
