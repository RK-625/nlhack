import { ArrowRight, Check, Minus, Search, X } from "lucide-react";
import type { ProcessStep } from "../content";
import { cx, ExtLink } from "./ui";

/** Authored emphasis and HTTPS references; captured HTML is never rendered. */
export function ReviewText({ text }: { text: string }) {
  return <>{text.split(/(\[[^\]]+\]\(https:\/\/[^\s)]+\)|\*\*.+?\*\*|__.+?__)/g).map((part, i) => {
    const link = part.match(/^\[([^\]]+)\]\((https:\/\/[^\s)]+)\)$/);
    if (link) return <ExtLink key={i} href={link[2]!} className="underline focus-visible:outline-2 focus-visible:outline-offset-4">{link[1]}</ExtLink>;
    if (part.startsWith("**")) return <strong key={i} className="font-semibold text-fg">{part.slice(2, -2)}</strong>;
    if (part.startsWith("__")) return <span key={i} className="text-fg underline decoration-link/50 decoration-2 underline-offset-4">{part.slice(2, -2)}</span>;
    return part;
  })}</>;
}

const statuses = {
  failed: { label: "Failed / capped", Icon: X, color: "text-bad", border: "border-bad/60", background: "bg-bad/10" },
  passed: { label: "Completed", Icon: Check, color: "text-ok", border: "border-ok/60", background: "bg-ok/10" },
  changed: { label: "Action taken", Icon: ArrowRight, color: "text-link", border: "border-link/50", background: "bg-link/10" },
  recorded: { label: "Recorded", Icon: Search, color: "text-muted-fg", border: "border-line", background: "bg-muted" },
  check: { label: "Scope / verification", Icon: Minus, color: "text-warn", border: "border-warn/60", background: "bg-warn/10" },
};

export function ProcessSteps({ steps }: { steps: ProcessStep[] }) {
  return (
    <ol className="mb-10 max-w-3xl space-y-6">
      {steps.map((step) => {
        const status = statuses[step.status];
        return (
          <li key={step.title} data-status={step.status} className={cx("border-l-2 pl-5", status.border)}>
            <span className={cx("mb-2 inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-semibold", status.color, status.background)}>
              <status.Icon aria-hidden className="size-3.5" />{status.label}
            </span>
            <h3 className={cx("text-lg font-semibold text-pretty", step.status === "failed" && "text-bad", step.status === "passed" && "text-ok")}>{step.title}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-muted-fg"><ReviewText text={step.text} /></p>
          </li>
        );
      })}
    </ol>
  );
}
