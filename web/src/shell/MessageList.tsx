// Scroll container, tail-following and jump-to-latest ported from rakazo's Transcript
// (apps/web/src/pages/Shell.tsx ~4736-5243), Apache-2.0, github.com/elie222/rakazo@912c977.
import type { ChatStatus, UIMessage } from "ai";
import { ArrowDown } from "lucide-react";
import { AnimatePresence, type Variants } from "motion/react";
import * as m from "motion/react-m";
import { type ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";
import { messageTime } from "@/lib/chats";
import { type AgentNames, messageSegments } from "@/lib/message-parts";
import {
  DISTANCE,
  DURATION,
  enterTransition,
  exitTransition,
  rise,
  STAGGER,
  STAGGER_CAP,
  staggerGroup,
  symmetric,
} from "@/lib/motion";
import { transcriptIsNearEnd, transcriptMovedDown } from "@/lib/transcript-scroll";
import { ErrorBubble, MessageBubble, WorkingIndicator } from "./MessageBubble";

/**
 * A bubble arrives once (on mount); streamed text updates never re-animate it. On "New chat"
 * every bubble leaves, newest first (`custom` = position from the end), the mirror of how
 * they arrived. User bubbles come from the send side, replies from below.
 */
const bubbleVariants = (user: boolean): Variants => ({
  hidden: (fromEnd: number = 0) => ({
    opacity: 0,
    x: user ? DISTANCE.lg : 0,
    y: user ? DISTANCE.sm : DISTANCE.md,
    transition: exitTransition(DURATION.base, Math.min(fromEnd, STAGGER_CAP) * STAGGER),
  }),
  visible: { opacity: 1, x: 0, y: 0, transition: enterTransition(DURATION.base) },
});
const userBubble = bubbleVariants(true);
const botBubble = bubbleVariants(false);

/** Time for every bubble to finish leaving, so the transcript fades only after them. */
const bubblesExitSeconds = (count: number) =>
  DURATION.base + Math.min(Math.max(count - 1, 0), STAGGER_CAP) * STAGGER;

const jumpButton = symmetric({ y: DISTANCE.md, scale: 0.9 }, DURATION.base);

export function MessageList({
  messages,
  status,
  error,
  agentNames,
  onRetry,
  onDismissError,
  onApproval,
  onEscalation,
  empty,
}: {
  messages: UIMessage[];
  status: ChatStatus;
  error: Error | undefined;
  agentNames: AgentNames;
  onRetry: () => void;
  onDismissError: () => void;
  /** Approve or deny a tool call that is awaiting approval in the latest reply. */
  onApproval: (approvalId: string, approved: boolean) => void;
  /** Approve or deny the budget extension offered on the latest reply when it hit its cap. */
  onEscalation: (escalationId: string, approved: boolean) => void;
  /** Rendered instead of the transcript when there are no messages. */
  empty: ReactNode;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const following = useRef(true);
  const lastScrollTop = useRef<number | null>(null);
  const [atEnd, setAtEnd] = useState(true);

  const last = messages.at(-1);
  const streamingId = status === "streaming" && last?.role === "assistant" ? last.id : null;
  // Show "Thinking" until the reply has something visible to render.
  const waiting =
    status === "submitted" ||
    (status === "streaming" && (!last || last.role !== "assistant" || messageSegments(last, agentNames).length === 0));
  const isEmpty = messages.length === 0 && status === "ready";
  const running = status === "submitted" || status === "streaming";

  const followTail = () => {
    const element = scrollRef.current;
    if (element && following.current) element.scrollTop = element.scrollHeight;
  };

  // Follow the tail (including streamed growth) while the reader is at the bottom.
  useLayoutEffect(followTail);

  // Height animations (tool cards opening, bubbles mounting) change the size between React
  // renders; keep following those too. Bubbles enter with transforms, which never resize.
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-attach when the transcript mounts.
  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    const observer = new ResizeObserver(followTail);
    observer.observe(content);
    return () => observer.disconnect();
  }, [isEmpty]);

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

  return (
    <AnimatePresence mode="wait">
      {isEmpty ? (
        <m.div
          key="empty"
          variants={staggerGroup()}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="rk-scroll flex min-h-0 flex-1 overflow-y-auto"
        >
          {empty}
        </m.div>
      ) : (
        <m.div
          key="transcript"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: enterTransition(DURATION.fast) }}
          exit={{ opacity: 0, transition: exitTransition(DURATION.fast, bubblesExitSeconds(messages.length)) }}
          className="relative flex min-h-0 flex-1"
        >
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
            className="rk-scroll flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-5 pt-16 md:px-7 md:pb-6"
          >
            <div ref={contentRef} className="flex flex-col gap-2">
              {/* Bubbles already there when the transcript mounts (switching agents) don't
                  re-enter; the first message after the empty state does.
                  propagate: when the transcript leaves, the bubbles play their exits. */}
              <AnimatePresence initial={messages.length <= 1} propagate>
                {messages.map((message, index) => (
                  <m.div
                    key={message.id}
                    data-testid="message"
                    custom={messages.length - 1 - index}
                    variants={message.role === "user" ? userBubble : botBubble}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className="flex flex-col gap-2"
                  >
                    {startsNewDay(messages[index - 1], message) ? <TimeSeparator at={messageTime(message.id)} /> : null}
                    <MessageBubble
                      message={message}
                      streaming={message.id === streamingId}
                      earlier={index < messages.length - 1}
                      agentNames={agentNames}
                      // Only the latest reply can be answered (the AI SDK resumes from the last message), and not mid-request.
                      onApproval={index === messages.length - 1 && !running ? onApproval : undefined}
                      next={messages[index + 1]}
                      onEscalation={index === messages.length - 1 && !running ? onEscalation : undefined}
                    />
                  </m.div>
                ))}
                {waiting ? (
                  <m.div key="working" variants={rise} initial="hidden" animate="visible" exit="hidden">
                    <WorkingIndicator />
                  </m.div>
                ) : null}
                {error ? (
                  <m.div key="error" variants={rise} initial="hidden" animate="visible" exit="hidden">
                    <ErrorBubble error={error} onRetry={onRetry} onDismiss={onDismissError} />
                  </m.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
          <AnimatePresence initial={false}>
            {atEnd ? null : (
              <m.button
                key="jump"
                type="button"
                aria-label="Jump to latest"
                onClick={jumpToLatest}
                variants={jumpButton}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="absolute bottom-4 left-1/2 z-20 grid h-9 w-9 -translate-x-1/2 place-items-center rounded-full border border-border bg-muted/95 text-foreground/75 shadow-md backdrop-blur transition-colors duration-(--motion-fast) ease-(--ease-standard) hover:bg-border"
              >
                <ArrowDown size={17} strokeWidth={1.8} />
              </m.button>
            )}
          </AnimatePresence>
        </m.div>
      )}
    </AnimatePresence>
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
