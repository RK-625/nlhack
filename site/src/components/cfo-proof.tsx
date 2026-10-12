import { useEffect, useState } from "react";
import { captureSizes } from "../capture-sizes";
import { proofFile } from "../content";

const connectedStages = [
  { label: "1 · Consent", file: "28-cfoai-oauth-consent.png", title: "The cfo.ai consent page", text: "The cfo.ai consent page for external MCP access, step 3 of 3, explains the secure WorkOS handoff before the account is connected.", rect: [32.5, 9.5, 35, 79.5] },
  { label: "2 · Connected", file: "29-cfoai-connected.png", title: "Back in the app: cfo.ai connected", text: "Back in the app, the \"cfo.ai connected.\" toast confirms the account is linked to CFO Bot.", rect: [44, 0.8, 11.5, 5.4] },
  { label: "3 · MCP tools", file: "36-cfoai-business-plan-tools.png", title: "Earlier connected run → named MCP actions", text: "The expanded activity lists Cfo edit pages, Cfo edit scenarios and Cfo inspect documentation. This is evidence of actual cfo.ai tool use, beyond an account-connected toast.", rect: [21, 64, 28, 14] },
  { label: "4 · Approval", file: "37-cfoai-business-plan-approval.png", title: "Review the exact edit before it runs", text: "The approval card identifies cfo_edit_pages, the page destination and the plan text. Approve and Deny are visible. This capture shows the pending gate; the resulting page is the next piece of evidence.", rect: [21, 50, 68, 38] },
  { label: "5 · Saved page", file: "38-cfoai-business-plan-page.png", title: "The destination changes: a page inside cfo.ai", text: "Lumen Labs – 12-Month Business Plan#140 is open in cfo.ai under Main Scenario, with the starting position and pricing sections written by CFO Bot after approval.", rect: [19, 6, 61, 14] },
];




const localStages = [
  { label: "1 · Connect", file: "27-cfoai-connect-banner.png", title: "Not connected yet: the Connect cfo.ai banner", text: "CFO Bot without a cfo.ai connection: the \"Connect your cfo.ai account\" banner is visible above the message box, so the bot has no live cfo.ai data. Each user connects their own account.", rect: [35, 83, 49, 6.5] },
  { label: "2 · Prompt", file: "43-cfo-disconnected-fresh-prompt.png", title: "A fresh request without cfo.ai", text: "The user reports deleting the previous local draft before this run. The general prompt asks for a 12-month plan. The Connect cfo.ai banner is visible; the deletion itself is not captured.", rect: [32, 12, 66, 9] },
  { label: "3 · Local plan", file: "44-cfo-disconnected-fresh-summary.png", title: "Company files → local Markdown plan", text: "The latest fresh run saves lumen-labs-12-month-plan.md. The highlighted disclosure says live cfo.ai data is not connected. Company exports support the answer; forecast assumptions and calculations remain unverified.", rect: [21, 62, 68, 8] },
  { label: "4 · Assumptions", file: "45-cfo-disconnected-fresh-scenarios.png", title: "Local scenario outputs depend on stated assumptions", text: "The answer lays out bookings and churn assumptions, then presents downside, base and upside projections. These are local answer tables, not evidence of scenarios created in cfo.ai. The numbers require reconciliation against source files.", rect: [21, 28, 68, 34] },
  { label: "5 · Cash flow", file: "46-cfo-disconnected-fresh-cash-hiring.png", title: "Inspect the forecast and hiring inputs", text: "The local forecast ends with $1,939,940 cash and September MRR of $103,491. Four hires are estimated at about $466k annually. These are captured agent calculations and assumptions, not verified financial results.", rect: [21, 25, 68, 35] },
  { label: "6 · Calculation issue", file: "47-cfo-disconnected-fresh-actions.png", title: "A visible inconsistency in the local answer", text: "The local answer equates $60,480 annual gross profit to about 2.4 months of burn. At roughly $300,000 monthly burn that is about 0.2 months. This is an arithmetic error in the answer built without cfo.ai.", rect: [21, 52, 68, 7] },
];

type Stage = { label: string; file: string; title: string; text: string; rect?: number[] };
type Mode = "without" | "with";
const frames: Record<Mode, { stages: Stage[]; heading: string; sub: string; aria: string }> = {
  without: { stages: localStages, heading: "Without cfo.ai", sub: "Not connected: company files → local Markdown. Captures 27, 43–47.", aria: "Disconnected CFO evidence" },
  with: { stages: connectedStages, heading: "With cfo.ai MCP", sub: "Connect → named tools → approval → saved page. Captures 28–29, 36–38.", aria: "Connected CFO evidence" },
};
function readView(): { mode: Mode | null; index: number } {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("cfoMode");
  const mode: Mode | null = raw === "with" || raw === "without" ? raw : null;
  const index = Number(params.get("cfoStep") ?? 1) - 1;
  const length = mode ? frames[mode].stages.length : 0;
  return { mode, index: Number.isInteger(index) && index >= 0 && index < length ? index : 0 };
}
function viewLink(mode: Mode, index: number) {
  const url = new URL(window.location.href);
  url.searchParams.set("cfoMode", mode);
  url.searchParams.set("cfoStep", String(index + 1));
  url.hash = "cfo";
  return `${url.pathname}${url.search}${url.hash}`;
}

function CfoFrame({ mode, selected, onSelect }: { mode: Mode; selected: number; onSelect: (index: number) => void }) {
  const { stages, heading, sub, aria } = frames[mode];
  const [highlight, setHighlight] = useState(true);
  const stage = stages[selected]!;
  return <section id={`cfo-${mode}`} aria-label={heading} className="mb-8 scroll-mt-24 rounded-2xl border border-line bg-card p-4 sm:p-6">
    <p className="text-xs font-semibold uppercase tracking-widest text-link">{heading}</p>
    <p className="mt-1 text-sm text-muted-fg">{sub}</p>
    <nav className="mt-4 flex flex-wrap gap-2" aria-label={aria}>
      {stages.map((s, i) => <a key={s.label} href={viewLink(mode, i)} aria-current={selected === i ? "step" : undefined} onClick={event => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); onSelect(i); }} className={`rounded-full border px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-4 ${selected === i ? "border-link bg-link/15 text-link" : "border-line hover:bg-accent"}`}>{s.label}</a>)}
    </nav>
    <div aria-live="polite" className="mt-5">
      <h4 className="font-semibold">{stage.title}</h4>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-fg">{stage.text}</p>
    </div>
    <div className="my-3 flex flex-wrap items-center justify-between gap-3 text-xs">
      <label className="flex cursor-pointer items-center gap-2"><input type="checkbox" checked={highlight} onChange={e => setHighlight(e.target.checked)} />Highlight proof in original capture</label>
      <a className="text-link underline underline-offset-4" href={viewLink(mode, selected)}>Link to this view</a>
      <a className="text-link underline underline-offset-4" href={proofFile(stage.file)} target="_blank" rel="noreferrer">Open original full size ↗</a>
    </div>
    <a href={proofFile(stage.file)} target="_blank" rel="noreferrer" className="relative block overflow-hidden rounded-xl border border-line" aria-label={`Open screenshot: ${stage.title}`}>
      <img src={proofFile(stage.file)} alt={stage.title} width={captureSizes[stage.file]?.width} height={captureSizes[stage.file]?.height} className="block h-auto w-full" loading="lazy" />
      {highlight && stage.rect && <span aria-hidden className="pointer-events-none absolute rounded border-[3px] border-amber-400 bg-amber-400/10" style={{ left: `${stage.rect[0]}%`, top: `${stage.rect[1]}%`, width: `${stage.rect[2]}%`, height: `${stage.rect[3]}%` }} />}
    </a>
  </section>;
}

export function CfoProof() {
  const [steps, setSteps] = useState<Record<Mode, number>>(() => {
    const { mode, index } = readView();
    return { without: mode === "without" ? index : 0, with: mode === "with" ? index : 0 };
  });
  useEffect(() => {
    const sync = () => {
      const { mode, index } = readView();
      if (mode) setSteps(prev => ({ ...prev, [mode]: index }));
    };
    window.addEventListener("popstate", sync);
    const target = readView().mode;
    const frame = target ? window.requestAnimationFrame(() => document.getElementById(`cfo-${target}`)?.scrollIntoView()) : undefined;
    return () => {
      window.removeEventListener("popstate", sync);
      if (frame !== undefined) window.cancelAnimationFrame(frame);
    };
  }, []);
  function select(mode: Mode, index: number) {
    window.history.pushState(null, "", viewLink(mode, index));
    setSteps(prev => ({ ...prev, [mode]: index }));
  }
  return <div className="mb-12" id="cfo-comparison">
    <CfoFrame mode="without" selected={steps.without} onSelect={i => select("without", i)} />
    <CfoFrame mode="with" selected={steps.with} onSelect={i => select("with", i)} />
    <p className="text-xs leading-relaxed text-muted-fg">Highlights are website overlays; original screenshots are unchanged. The two frames are separate runs with different prompts and starting state: this demonstrates workflow capability, not an accuracy or speed advantage. Financial outputs require verification.</p>
  </div>;
}
