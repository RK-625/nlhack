// Scroll container, tail-following and jump-to-latest ported from rakazo's Transcript
// (apps/web/src/pages/Shell.tsx ~4736-5243), Apache-2.0, github.com/elie222/rakazo@912c977.
import { ArrowDown } from "lucide-react";
import { Fragment, type ReactNode, useLayoutEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/hooks/useAgentChat";
import { transcriptIsNearEnd, transcriptMovedDown } from "@/lib/transcript-scroll";
import { MessageBubble, WorkingIndicator } from "./MessageBubble";

export function MessageList({
  messages,
  running,
  empty,
}: {
  messages: ChatMessage[];
  running: boolean;
  /** Rendered instead of the transcript when there are no messages. */
  empty: ReactNode;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const following = useRef(true);
  const lastScrollTop = useRef<number | null>(null);
  const [atEnd, setAtEnd] = useState(true);

  // Follow the tail while the reader is at the bottom; leave them alone once they scroll up.
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-run when the transcript grows.
  useLayoutEffect(() => {
    const element = scrollRef.current;
    if (element && following.current) element.scrollTop = element.scrollHeight;
  }, [messages.length, running]);

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

  if (messages.length === 0 && !running) {
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
            {startsNewDay(messages[index - 1], message) ? <TimeSeparator at={message.createdAt} /> : null}
            <MessageBubble message={message} />
          </Fragment>
        ))}
        {running ? <WorkingIndicator /> : null}
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

function startsNewDay(previous: ChatMessage | undefined, message: ChatMessage): boolean {
  return !previous || new Date(previous.createdAt).toDateString() !== new Date(message.createdAt).toDateString();
}

/** rakazo's TimeSeparator (apps/web/src/pages/shell/chat-context.tsx). */
function TimeSeparator({ at }: { at: number }) {
  const date = new Date(at);
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
