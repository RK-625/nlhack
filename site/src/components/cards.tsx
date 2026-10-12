import { Check, ShieldQuestion, X } from "lucide-react";
import { useState } from "react";
import { approvalExample, caps, isTodo, receiptExample } from "../content";
import { BotFace, ExtLink, Show, cx } from "./ui";

/** Interactive mock of the inline Approve/Deny card. */
export function ApprovalCard({ compact = false }: { compact?: boolean }) {
  const [state, setState] = useState<"pending" | "approved" | "denied">("pending");
  const a = approvalExample;
  return (
    <div className="rounded-2xl border border-line bg-card p-4 shadow-[0_1px_0_rgb(0_0_0/0.03)] sm:p-5">
      <div className="flex items-center gap-3">
        <BotFace color="violet" size={30} />
        <div className="min-w-0 text-sm leading-tight">
          <p className="font-medium">{a.agent} wants to run a tool</p>
          <p className="text-muted-fg">Asked by {a.via}</p>
        </div>
        <ShieldQuestion aria-hidden className="ml-auto size-5 shrink-0 text-warn" />
      </div>
      <div className="mt-4 overflow-x-auto rounded-xl bg-muted px-3.5 py-3 text-[13px] leading-relaxed">
        <p className="font-semibold">{a.tool}</p>
        <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3">
          {Object.entries(a.args).map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-muted-fg">{k}</dt>
              <dd className="break-words">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="mt-4 flex min-h-10 items-center gap-2" aria-live="polite">
        {state === "pending" ? (
          <>
            <button
              type="button"
              onClick={() => setState("approved")}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-medium text-primary-fg transition-opacity hover:opacity-90"
            >
              <Check aria-hidden className="size-4" /> Approve
            </button>
            <button
              type="button"
              onClick={() => setState("denied")}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-4 text-sm font-medium transition-colors hover:bg-accent"
            >
              <X aria-hidden className="size-4" /> Deny
            </button>
          </>
        ) : (
          <p className={cx("pop flex items-center gap-2 text-sm", state === "approved" ? "text-ok" : "text-bad")}>
            {state === "approved" ? (
              <>
                <Check aria-hidden className="size-4" /> Approved. {a.agent} runs the tool and the reply continues.
              </>
            ) : (
              <>
                <X aria-hidden className="size-4" /> Denied. The tool never runs.
              </>
            )}
            <button
              type="button"
              onClick={() => setState("pending")}
              className="ml-1 text-muted-fg underline underline-offset-4 hover:text-fg"
            >
              Reset
            </button>
          </p>
        )}
      </div>
      {!compact && <p className="mt-3 text-xs text-muted-fg">Illustration. Try the buttons.</p>}
    </div>
  );
}

function money(n: number) {
  return `$${n < 0.1 ? n.toFixed(6) : n.toFixed(2)}`;
}

/** Mock of the per-turn usage receipt. */
export function Receipt() {
  const r = receiptExample;
  const share = isTodo(r.estCostUsd) ? 0 : Math.max(0.02, r.estCostUsd / caps.costCapUsd);
  return (
    <div className="rounded-2xl border border-line bg-card p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <BotFace color="orange" size={30} />
        <p className="text-sm font-medium">Turn receipt</p>
        <span className="ml-auto rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-fg">Under cap</span>
      </div>

      <div className="mt-5">
        <div className="flex items-baseline justify-between text-sm">
          <span className="text-muted-fg">Estimated cost</span>
          <span className="num font-medium">
            <Show value={r.estCostUsd}>{money}</Show>
            <span className="text-muted-fg"> of {money(caps.costCapUsd)} cap</span>
          </span>
        </div>
        <div
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"
          role="img"
          aria-label={`Used ${(share * 100).toFixed(1)} percent of the cost cap`}
        >
          <div className="h-full rounded-full bg-[var(--bot-orange)]" style={{ width: `${share * 100}%` }} />
        </div>
      </div>

      <dl className="num mt-5 grid grid-cols-2 gap-y-3 text-sm">
        <dt className="text-muted-fg">Tokens</dt>
        <dd className="text-right">
          <Show value={r.estTokens} /> <span className="text-muted-fg">of {caps.tokenCap.toLocaleString("en-US")}</span>
        </dd>
        <dt className="text-muted-fg">Model steps</dt>
        <dd className="text-right">
          <Show value={r.steps} />
        </dd>
        <dt className="text-muted-fg">neatlogs cost</dt>
        <dd className="text-right">
          <Show value={r.neatlogsCostUsd}>{money}</Show>
          <span className="text-muted-fg"> for </span>
          <Show value={r.neatlogsTokens} />
          <span className="text-muted-fg"> tokens</span>
        </dd>
      </dl>
      <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-xs text-muted-fg">
        <span>Northwind After 2 · saved run, 12 Oct 2026. Trace may require sign-in.</span>
        <ExtLink href={r.traceUrl}>Trace</ExtLink>
      </div>
    </div>
  );
}
