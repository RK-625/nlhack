// Bubble markup ported from rakazo's Transcript/MessageView (apps/web/src/pages/Shell.tsx
// ~5092-5112 and ~6847-6880), Apache-2.0, github.com/elie222/rakazo@912c977.
import type { UIMessage } from "ai";
import { Check, ChevronRight, RotateCcw, ShieldAlert, X } from "lucide-react";
import * as m from "motion/react-m";
import { type ReactNode, useState } from "react";
import { StandaloneToolActivity } from "@/components/chat/ToolActivityDisclosure";
import { Button } from "@/components/ui/button";
import { Collapse } from "@/components/motion/Collapse";
import { DURATION, enterTransition, exitTransition } from "@/lib/motion";
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
  earlier,
  agentNames,
  onApproval,
}: {
  message: UIMessage;
  /** This is the assistant message currently being streamed. */
  streaming: boolean;
  /** A later message follows this one, so nothing in it is still in progress. */
  earlier: boolean;
  agentNames: AgentNames;
  /** Answers a tool call awaiting approval; omitted when this message can't be answered now. */
  onApproval?: (approvalId: string, approved: boolean) => void;
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
          // In an earlier reply a call can't still be running: it never ran (an approval dropped
          // when the user sent a new message), so it shows as declined.
          const steps = earlier
            ? segment.steps.map((step) => (step.status === "running" ? { ...step, status: "denied" as const } : step))
            : segment.steps;
          return (
            <StandaloneToolActivity
              key={segment.key}
              live={live}
              steps={steps}
              stepCount={toolStepCount(steps)}
              durationMs={live ? undefined : toolsDurationMs(segment.callIds)}
            />
          );
        }
        if (segment.kind === "approval") {
          return (
            <ApprovalCard
              key={segment.key}
              label={segment.label}
              agent={segment.agent}
              toolName={segment.toolName}
              input={segment.input}
              onRespond={onApproval ? (approved) => onApproval(segment.approvalId, approved) : undefined}
            />
          );
        }
        if (segment.kind === "reasoning") {
          return <ReasoningNote key={segment.key} text={segment.text} />;
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

/** Collapsed, dimmed reasoning; opens and closes with the shared height motion. */
function ReasoningNote({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="ps-1 text-[13px] text-muted-foreground">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex w-fit cursor-pointer items-center gap-1 font-medium transition-colors duration-(--motion-fast) ease-(--ease-standard) hover:text-foreground/75"
      >
        <m.span
          aria-hidden
          className="inline-flex"
          initial={false}
          animate={{ rotate: open ? 90 : 0 }}
          transition={open ? enterTransition(DURATION.fast) : exitTransition(DURATION.fast)}
        >
          <ChevronRight size={14} strokeWidth={1.8} />
        </m.span>
        Reasoning
      </button>
      <Collapse open={open}>
        <div className="ms-[7px] mt-1 whitespace-pre-wrap border-s border-border ps-3 leading-[1.5]">{text}</div>
      </Collapse>
    </div>
  );
}

/**
 * A tool call paused for the user's decision: what will run, with its exact arguments. For a call
 * a delegated sub-agent wants to make, `agent` names that sub-agent.
 */
function ApprovalCard({
  label,
  agent,
  toolName,
  input,
  onRespond,
}: {
  label: string;
  agent?: string;
  toolName: string;
  input: unknown;
  onRespond?: (approved: boolean) => void;
}) {
  const title = agent ? `${agent} wants to run: ${label}` : `Approve ${label}?`;
  return (
    <Row user={false}>
      <div
        role="group"
        aria-label={title}
        data-testid="tool-approval"
        className="flex max-w-full flex-col gap-2 rounded-[20px] border border-border bg-muted/60 px-[18px] py-3 text-[14.5px] leading-[1.45] text-foreground/90"
      >
        <div className="flex items-center gap-2 font-medium">
          <ShieldAlert size={15} strokeWidth={1.8} className="shrink-0 text-muted-foreground" />
          <span className="min-w-0 break-words">{title}</span>
        </div>
        <code className="w-fit max-w-full break-all rounded-md bg-background px-1.5 py-0.5 font-mono text-[12.5px] text-muted-foreground">
          {toolName}
        </code>
        <pre className="rk-scroll max-h-64 max-w-full overflow-auto whitespace-pre-wrap break-words rounded-lg border border-border bg-background px-3 py-2 font-mono text-[12.5px] leading-[1.5]">
          {formatArgs(input)}
        </pre>
        {onRespond ? (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => onRespond(true)}>
              <Check strokeWidth={1.8} />
              Approve
            </Button>
            <Button size="sm" variant="outline" onClick={() => onRespond(false)}>
              <X strokeWidth={1.8} />
              Deny
            </Button>
          </div>
        ) : (
          <div className="text-[13px] text-muted-foreground">Not run: no decision was made.</div>
        )}
      </div>
    </Row>
  );
}

function formatArgs(input: unknown): string {
  if (input === undefined) return "(no arguments)";
  try {
    return JSON.stringify(input, null, 2) ?? String(input);
  } catch {
    return String(input);
  }
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
    if (parsed.error === "Forbidden") return "You don't have access to this agent.";
    if (typeof parsed.error === "string") return parsed.error;
  } catch {}
  if (/failed to fetch|networkerror|load failed/i.test(raw)) return "Can't reach the server. Check that it is running.";
  return raw.length > 300 ? `${raw.slice(0, 300)}…` : raw;
}
