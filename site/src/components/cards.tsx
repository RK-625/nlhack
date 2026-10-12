/**
 * Replicas of three pieces of the Bot Company app UI, matched to its source and the 12 Oct 2026
 * captures: the tool-approval card and the cap card (web/src/shell/MessageBubble.tsx) and the
 * usage popover under the bot name (web/src/shell/UsagePanel.tsx).
 */
import { Check, ChevronDown, ChevronRight, ExternalLink, OctagonAlert, ShieldAlert, X } from "lucide-react";
import { type ReactNode, useState } from "react";
import { approvalExample, capCardExample, proofFile, traceUrl, usageSnapshots, type UsageBarView } from "../content";
import { BotAvatar, type AgentId } from "./avatar";
import { cx } from "./ui";

/** The app's small Approve / Deny buttons (shadcn Button size="sm"). */
function DecisionButtons({ onDecide }: { onDecide: (approved: boolean) => void }) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onDecide(true)}
        className="inline-flex h-7 items-center gap-1 rounded-[12px] bg-primary px-2.5 text-[0.8rem] font-medium text-primary-fg transition-opacity hover:opacity-80"
      >
        <Check aria-hidden strokeWidth={1.8} className="size-3.5" /> Approve
      </button>
      <button
        type="button"
        onClick={() => onDecide(false)}
        className="inline-flex h-7 items-center gap-1 rounded-[12px] border border-line bg-bg px-2.5 text-[0.8rem] font-medium transition-colors hover:bg-accent"
      >
        <X aria-hidden strokeWidth={1.8} className="size-3.5" /> Deny
      </button>
    </div>
  );
}

function ResetLink({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="ml-2 underline underline-offset-4 hover:text-fg">
      Reset
    </button>
  );
}

/** Tool-approval card: "<agent> wants to run: <label>", the tool name, its JSON arguments. */
export function ApprovalCard() {
  const [state, setState] = useState<"pending" | "approved" | "denied">("pending");
  const a = approvalExample;
  const title = `${a.agent} wants to run: ${a.label}`;
  return (
    <div
      role="group"
      aria-label={title}
      className="flex max-w-full flex-col gap-2 rounded-[20px] border border-line bg-muted/60 px-[18px] py-3 text-[14.5px] leading-[1.45]"
    >
      <div className="flex items-center gap-2 font-medium">
        <ShieldAlert aria-hidden size={15} strokeWidth={1.8} className="shrink-0 text-muted-fg" />
        <span className="min-w-0 break-words">{title}</span>
      </div>
      <code className="w-fit max-w-full break-all rounded-md bg-bg px-1.5 py-0.5 font-mono text-[12.5px] text-muted-fg">
        {a.toolName}
      </code>
      <pre className="max-w-full overflow-auto whitespace-pre-wrap break-words rounded-lg border border-line bg-bg px-3 py-2 font-mono text-[12.5px] leading-[1.5]">
        {JSON.stringify(a.input, null, 2)}
      </pre>
      <div className="min-h-7" aria-live="polite">
        {state === "pending" ? (
          <DecisionButtons onDecide={(ok) => setState(ok ? "approved" : "denied")} />
        ) : (
          <p className="pop text-[13px] text-muted-fg">
            {state === "approved" ? "Approved: the tool runs and the reply continues." : "Denied: the tool never runs."}
            <ResetLink onClick={() => setState("pending")} />
          </p>
        )}
      </div>
    </div>
  );
}

/** Cap card shown at the end of a capped reply; text copied from capture 21. */
export function CapCard() {
  const [state, setState] = useState<"pending" | "approved" | "denied">("pending");
  const c = capCardExample;
  return (
    <div
      role="group"
      aria-label={c.title}
      className="flex max-w-full flex-col gap-2 rounded-[20px] border border-line bg-muted/60 px-[18px] py-3 text-[14.5px] leading-[1.45]"
    >
      <div className="flex items-start gap-2 font-medium">
        <OctagonAlert aria-hidden size={15} strokeWidth={1.8} className="mt-[3px] shrink-0 text-bad" />
        <span className="min-w-0 break-words">{c.title}</span>
      </div>
      <div aria-live="polite" className="flex flex-col gap-2">
        {state === "pending" ? (
          <>
            <p className="text-[13px] text-muted-fg">{c.pending}</p>
            <DecisionButtons onDecide={(ok) => setState(ok ? "approved" : "denied")} />
          </>
        ) : (
          <p className="pop text-[13px] text-muted-fg">
            {state === "approved" ? c.approved : c.denied}
            <ResetLink onClick={() => setState("pending")} />
          </p>
        )}
      </div>
    </div>
  );
}

const BAR: Record<UsageBarView["level"], string> = {
  normal: "bg-fg/55",
  warn: "bg-warn",
  capped: "bg-bad",
};

function UsageBar({ bar }: { bar: UsageBarView }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2 text-[12.5px]">
        <span className="text-muted-fg">{bar.label}</span>
        <span className={cx("num", bar.level === "capped" ? "text-bad" : "text-fg/85")}>{bar.text}</span>
      </div>
      <div
        role="meter"
        aria-label={`${bar.label} used this turn`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(bar.fraction * 100)}
        aria-valuetext={bar.text}
        className="h-1 overflow-hidden rounded-full bg-muted"
      >
        <div className={cx("h-full rounded-full", BAR[bar.level])} style={{ width: `${Math.min(1, bar.fraction) * 100}%` }} />
      </div>
    </div>
  );
}

/** The chat header pill: avatar, bot name, status dot, chevron. */
export function BotPill({ agent, name, dot }: { agent: AgentId; name: string; dot?: "working" | "capped" }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-line bg-card py-1 pe-3 ps-1.5 text-[14px] font-medium shadow-sm">
      <BotAvatar agent={agent} size={22} />
      {name}
      {dot && (
        <span aria-hidden className={cx("size-1.5 rounded-full", dot === "capped" ? "bg-bad" : "bg-warn")} />
      )}
      <ChevronDown aria-hidden className="size-3.5 text-muted-fg" />
    </span>
  );
}

/** Usage popover under the bot name, in the two states captured during the live run. */
export function UsagePopover() {
  const [i, setI] = useState(0);
  const s = usageSnapshots[i]!;
  return (
    <div>
      <div role="tablist" aria-label="Usage state" className="mb-3 inline-flex rounded-full border border-line bg-muted p-0.5 text-[13px]">
        {usageSnapshots.map((u, k) => (
          <button
            key={u.id}
            type="button"
            role="tab"
            aria-selected={k === i}
            onClick={() => setI(k)}
            className={cx(
              "rounded-full px-3 py-1 font-medium transition-colors",
              k === i ? "bg-card text-fg shadow-sm" : "text-muted-fg hover:text-fg",
            )}
          >
            {u.tab}
          </button>
        ))}
      </div>
      <div className="flex justify-center">
        <BotPill agent="assistant" name="Primary Bot" dot={s.id === "capped" ? "capped" : undefined} />
      </div>
      <section
        aria-label="Usage this turn"
        className="mx-auto mt-2 flex w-full max-w-[380px] flex-col gap-2.5 rounded-2xl border border-line bg-card/95 px-3.5 py-3 shadow-sm"
      >
        <div className="flex items-end gap-4">
          <UsageBar bar={s.bars[0]} />
          <UsageBar bar={s.bars[1]} />
        </div>
        <TraceLine est={s.neatlogs.est} text={s.neatlogs.text} traceId={s.neatlogs.traceId} />
        <div className="flex items-center justify-between gap-2 text-[12px] text-muted-fg">
          <span>{s.footer}</span>
          <span className="rounded-md px-2 py-0.5 text-[12px] font-medium text-fg">Edit</span>
        </div>
      </section>
      <p className="mt-3 text-center text-xs text-muted-fg">
        Real numbers from the live run on 12 Oct 2026 ·{" "}
        <a href={proofFile(s.capture)} target="_blank" rel="noreferrer" className="font-medium text-link underline-offset-4 hover:underline">
          see the capture
        </a>
      </p>
    </div>
  );
}

function TraceLine({ est, text, traceId }: { est?: string; text: string; traceId: string }) {
  const link: ReactNode = (
    <a
      href={traceUrl(traceId)}
      target="_blank"
      rel="noreferrer"
      title={`Neatlogs trace ${traceId} (needs sign-in)`}
      className="inline-flex items-center gap-1 underline-offset-2 hover:underline"
    >
      {text}
      <ExternalLink aria-hidden className="size-3 shrink-0" />
    </a>
  );
  if (!est) return <div className="text-[12px] text-muted-fg">{link}</div>;
  return (
    <div className="flex items-baseline justify-between gap-2 text-[12.5px]">
      <span className="text-muted-fg">{est}</span>
      <span className="num text-fg/85">{link}</span>
    </div>
  );
}

/** The app's tool-activity line: "Done · N tools", expanded to show its steps. */
export function ToolActivity({ summary, steps }: { summary: string; steps: string[] }) {
  return (
    <div className="ps-1 text-muted-fg">
      <p className="flex items-center gap-1 text-[13px] font-medium">
        <ChevronRight aria-hidden className="size-3.5 rotate-90" strokeWidth={1.8} />
        {summary}
      </p>
      <ul className="ms-[7px] mt-0.5 space-y-0.5 border-s border-line ps-3">
        {steps.map((s) => (
          <li key={s} className="flex items-center gap-2 text-[13px] leading-5">
            <Check aria-hidden className="size-3 text-ok" strokeWidth={2} />
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}
