// Per-turn usage row under the chat header pill: the latest turn's cost and tokens against the
// user's caps for this agent (our estimate, which the caps use), Neatlogs' own numbers for the
// turn's trace once they arrive, and an inline editor for the caps.
import { ExternalLink } from "lucide-react";
import { type ReactNode, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AgentCaps } from "@/hooks/useAgentCaps";
import { useTraceLink } from "@/hooks/useTraceLink";
import { cn } from "@/lib/utils";
import {
  formatTokens,
  formatUsd,
  type NeatlogsUsage,
  parseCapsInput,
  type TurnUsage,
  type UsageLevel,
  usageFraction,
  usageLevel,
} from "@/lib/turn-usage";

const BAR_COLOR: Record<UsageLevel, string> = {
  normal: "bg-foreground/55",
  warn: "bg-warning",
  capped: "bg-destructive",
};

function UsageBar({
  label,
  used,
  cap,
  capped,
  format,
  hint,
}: {
  label: string;
  used: number;
  cap: number;
  capped: boolean;
  format: (value: number) => string;
  hint?: string;
}) {
  const level = usageLevel(used, cap, capped);
  const percent = Math.round(usageFraction(used, cap) * 100);
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1" title={hint}>
      <div className="flex items-baseline justify-between gap-2 text-[12.5px]">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn("tabular-nums", level === "capped" ? "text-destructive" : "text-foreground/85")}>
          {format(used)} / {format(cap)}
        </span>
      </div>
      <div
        role="meter"
        aria-label={`${label} used this turn`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-valuetext={`${format(used)} of ${format(cap)}`}
        className="h-1 overflow-hidden rounded-full bg-muted"
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width,background-color] duration-(--motion-base) ease-(--ease-standard)",
            BAR_COLOR[level],
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Neatlogs' own cost and tokens for the turn's trace, next to our estimate in the bars above:
 * "checking Neatlogs…" while the server waits for the trace, then the numbers, or "not available
 * yet" when Neatlogs had no finalized trace in time.
 */
/** Opens the trace in a new tab; plain text when no link template is configured. */
function TraceLink({ href, children }: { href: string | null; children: ReactNode }) {
  if (!href) return <>{children}</>;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 rounded-sm underline-offset-2 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {children}
      <ExternalLink aria-hidden className="size-3 shrink-0" />
    </a>
  );
}

function NeatlogsLine({ usage, neatlogs }: { usage: TurnUsage; neatlogs: NeatlogsUsage }) {
  const title = `Neatlogs trace ${neatlogs.traceId}`;
  const href = useTraceLink(neatlogs.traceId);
  if (neatlogs.status === "pending") {
    return (
      <div data-testid="neatlogs-usage" data-status="pending" title={title} className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" style={{ animation: "rkPulse 1.2s ease-in-out infinite" }} />
        <TraceLink href={href}>Checking Neatlogs…</TraceLink>
      </div>
    );
  }
  if (neatlogs.status === "unavailable" || neatlogs.costUsd === undefined || neatlogs.tokens === undefined) {
    return (
      <div data-testid="neatlogs-usage" data-status="unavailable" title={title} className="text-[12px] text-muted-foreground">
        <TraceLink href={href}>Neatlogs: not available yet</TraceLink>
      </div>
    );
  }
  return (
    <div
      data-testid="neatlogs-usage"
      data-status="ready"
      title={title}
      className="flex items-baseline justify-between gap-2 text-[12.5px]"
    >
      <span className="text-muted-foreground">
        Est. {formatUsd(usage.costUsd)} · {formatTokens(usage.tokens)}
      </span>
      <span className="tabular-nums text-foreground/85">
        <TraceLink href={href}>
          Neatlogs {formatUsd(neatlogs.costUsd)} · {formatTokens(neatlogs.tokens)} tokens
        </TraceLink>
      </span>
    </div>
  );
}

export function UsagePanel({
  id,
  usage,
  neatlogs = null,
  caps,
}: {
  id: string;
  usage: TurnUsage | null;
  /** Neatlogs' own numbers for the latest finished turn; null while it runs or without a trace. */
  neatlogs?: NeatlogsUsage | null;
  caps: AgentCaps;
}) {
  const [editing, setEditing] = useState(false);
  const current = caps.caps ?? (usage ? { costCapUsd: usage.capCostUsd, tokenCap: usage.capTokens } : caps.defaults);
  const usedCost = usage?.costUsd ?? 0;
  const usedTokens = usage?.tokens ?? 0;
  return (
    <section
      id={id}
      aria-label="Usage this turn"
      className="pointer-events-auto mt-2 flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2.5 rounded-2xl border border-border bg-card/95 px-3.5 py-3 shadow-sm backdrop-blur"
    >
      <div className="flex items-end gap-4">
        <UsageBar label="Cost" used={usedCost} cap={current.costCapUsd} capped={usage?.reason === "cost"} format={formatUsd} />
        <UsageBar
          label="Tokens"
          used={usedTokens}
          cap={current.tokenCap}
          capped={usage?.reason === "tokens"}
          format={formatTokens}
          hint={usage?.cachedInputTokens ? `${formatTokens(usage.cachedInputTokens)} cached` : undefined}
        />
      </div>
      {usage && neatlogs ? <NeatlogsLine usage={usage} neatlogs={neatlogs} /> : null}
      {editing ? (
        <CapsEditor caps={caps} current={current} onDone={() => setEditing(false)} />
      ) : (
        <div className="flex items-center justify-between gap-2 text-[12px] text-muted-foreground">
          <span>Latest turn (estimated), per-message limits for this bot.</span>
          <Button size="xs" variant="ghost" onClick={() => setEditing(true)}>
            Edit
          </Button>
        </div>
      )}
    </section>
  );
}

function CapsEditor({
  caps,
  current,
  onDone,
}: {
  caps: AgentCaps;
  current: { costCapUsd: number; tokenCap: number };
  onDone: () => void;
}) {
  const ids = useId();
  const [cost, setCost] = useState(String(current.costCapUsd));
  const [tokens, setTokens] = useState(String(current.tokenCap));
  const [errors, setErrors] = useState<{ cost?: string; tokens?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);

  const run = async (action: () => Promise<string | null>) => {
    setBusy(true);
    const error = await action();
    setBusy(false);
    if (error) setErrors({ form: error });
    else onDone();
  };
  const save = () => {
    const parsed = parseCapsInput(cost, tokens);
    if (!parsed.ok) {
      setErrors(parsed.errors);
      return;
    }
    setErrors({});
    void run(() => caps.save(parsed.caps));
  };

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      <div className="flex gap-3">
        <CapField
          id={`${ids}-cost`}
          label="Cost cap ($)"
          value={cost}
          onChange={setCost}
          error={errors.cost}
          inputMode="decimal"
          placeholder={String(caps.defaults.costCapUsd)}
        />
        <CapField
          id={`${ids}-tokens`}
          label="Token cap"
          value={tokens}
          onChange={setTokens}
          error={errors.tokens}
          inputMode="numeric"
          placeholder={String(caps.defaults.tokenCap)}
        />
      </div>
      {errors.form ? (
        <p role="alert" className="text-[12px] text-destructive">
          {errors.form}
        </p>
      ) : null}
      <div className="flex items-center justify-end gap-1.5">
        <Button
          size="xs"
          variant="ghost"
          className="me-auto"
          disabled={busy}
          onClick={() => {
            setErrors({});
            void run(caps.reset);
          }}
        >
          Reset to defaults
        </Button>
        <Button size="xs" variant="outline" disabled={busy} onClick={onDone}>
          Cancel
        </Button>
        <Button size="xs" type="submit" disabled={busy}>
          Save
        </Button>
      </div>
    </form>
  );
}

function CapField({
  id,
  label,
  value,
  onChange,
  error,
  inputMode,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  inputMode: "decimal" | "numeric";
  placeholder: string;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <label htmlFor={id} className="text-[12px] text-muted-foreground">
        {label}
      </label>
      <Input
        id={id}
        value={value}
        inputMode={inputMode}
        placeholder={placeholder}
        autoComplete="off"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(event) => onChange(event.target.value)}
        className="h-7 text-[13px] md:text-[13px]"
      />
      {error ? (
        <p id={`${id}-error`} className="text-[11.5px] leading-[1.35] text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
