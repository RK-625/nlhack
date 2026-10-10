// Scroll container, tail-following and jump-to-latest ported from rakazo's Transcript
// (apps/web/src/pages/Shell.tsx ~4736-5243), Apache-2.0, github.com/elie222/rakazo@912c977.
import type { ChatStatus, UIMessage } from "ai";
import { ArrowDown } from "lucide-react";
import { Fragment, type ReactNode, useLayoutEffect, useRef, useState } from "react";
import { messageTime } from "@/lib/chats";
import { type AgentNames, messageSegments } from "@/lib/message-parts";
import { transcriptIsNearEnd, transcriptMovedDown } from "@/lib/transcript-scroll";
import { ErrorBubble, MessageBubble, WorkingIndicator } from "./MessageBubble";

export function MessageList({
  messages,
  status,
  error,
  agentNames,
  onRetry,
  onDismissError,
  empty,
}: {
  messages: UIMessage[];
  status: ChatStatus;
  error: Error | undefined;
  agentNames: AgentNames;
  onRetry: () => void;
  onDismissError: () => void;
  /** Rendered instead of the transcript when there are no messages. */
  empty: ReactNode;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const following = useRef(true);
  const lastScrollTop = useRef<number | null>(null);
  const [atEnd, setAtEnd] = useState(true);

  const last = messages.at(-1);
  const streamingId = status === "streaming" && last?.role === "assistant" ? last.id : null;
  // Show "Thinking" until the reply has something visible to render.
  const waiting =
    status === "submitted" ||
    (status === "streaming" && (!last || last.role !== "assistant" || messageSegments(last, agentNames).length === 0));

  // Follow the tail (including streamed growth) while the reader is at the bottom.
  useLayoutEffect(() => {
    const element = scrollRef.current;
    if (element && following.current) element.scrollTop = element.scrollHeight;
  });

  const stopFollowing = (element: HTMLDivElement) => {
    lastScrollTop.current = element.scrollTop;
    following.current = false;
  };

  const jumpToLatest = () => {
    const element = scrollRef.current;
    if (!element) return;
    following.current = true;
    element.scrollTo({ top: element.scrollHeight, behavior: "smooth" });
  };

  if (messages.length === 0 && status === "ready") {
    return <div className="rk-scroll flex min-h-0 flex-1 overflow-y-auto">{empty}</div>;
  }

  return (
    <div className="relative flex min-h-0 flex-1">
      <div
        ref={scrollRef}
        data-testid="transcript"
        onPointerDown={(event) => stopFollowing(event.currentTarget)}
        onTouchStart={(event) => stopFollowing(event.currentTarget)}
        onWheel={(event) => {
          if (event.deltaY < 0) stopFollowing(event.currentTarget);
        }}
        onScroll={(event) => {
          const element = event.currentTarget;
          const scrolledDown = transcriptMovedDown(lastScrollTop.current, element.scrollTop);
          lastScrollTop.current = element.scrollTop;
          const nearEnd = transcriptIsNearEnd(element);
          setAtEnd(nearEnd);
          if (nearEnd && scrolledDown) following.current = true;
        }}
        className="rk-scroll flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-4 py-5 md:px-7 md:py-6"
      >
        {messages.map((message, index) => (
          <Fragment key={message.id}>
            {startsNewDay(messages[index - 1], message) ? <TimeSeparator at={messageTime(message.id)} /> : null}
            <MessageBubble message={message} streaming={message.id === streamingId} agentNames={agentNames} />
          </Fragment>
        ))}
        {waiting ? <WorkingIndicator /> : null}
        {error ? <ErrorBubble error={error} onRetry={onRetry} onDismiss={onDismissError} /> : null}
      </div>
      <button
        type="button"
        aria-label="Jump to latest"
        aria-hidden={atEnd}
        tabIndex={atEnd ? -1 : 0}
        onClick={jumpToLatest}
        className={`absolute bottom-4 left-1/2 z-20 grid h-9 w-9 -translate-x-1/2 place-items-center rounded-full border border-border bg-muted/95 text-foreground/75 shadow-md backdrop-blur transition-[opacity,transform,background-color] duration-200 ease-[cubic-bezier(.22,1,.36,1)] hover:bg-border motion-reduce:transition-none ${
          atEnd ? "pointer-events-none translate-y-2 opacity-0" : "translate-y-0 opacity-100"
        }`}
      >
        <ArrowDown size={17} strokeWidth={1.8} />
      </button>
    </div>
  );
}

function startsNewDay(previous: UIMessage | undefined, message: UIMessage): boolean {
  if (!previous) return true;
  const a = messageTime(previous.id);
  const b = messageTime(message.id);
  return a !== undefined && b !== undefined && new Date(a).toDateString() !== new Date(b).toDateString();
}

/** rakazo's TimeSeparator (apps/web/src/pages/shell/chat-context.tsx). */
function TimeSeparator({ at }: { at: number | undefined }) {
  const date = new Date(at ?? Date.now());
  const today = new Date();
  const yesterday = new Date(today.getTime() - 86_400_000);
  const label =
    date.toDateString() === today.toDateString()
      ? "Today"
      : date.toDateString() === yesterday.toDateString()
        ? "Yesterday"
        : date.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
  return <h3 className="my-3 select-none text-center text-xs font-normal text-muted-foreground">{label}</h3>;
}
