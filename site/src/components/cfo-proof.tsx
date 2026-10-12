import { useEffect, useState } from "react";
import { captureSizes } from "../capture-sizes";
import { proofFile } from "../content";

const connectedStages = [
  { label: "1 · MCP tools", file: "36-cfoai-business-plan-tools.png", title: "Earlier connected run → named MCP actions", text: "The expanded activity lists Cfo edit pages, Cfo edit scenarios and Cfo inspect documentation. This is evidence of actual cfo.ai tool use, beyond an account-connected toast.", rect: [21, 64, 28, 14] },
  { label: "2 · Approval", file: "37-cfoai-business-plan-approval.png", title: "Review the exact edit before it runs", text: "The approval card identifies cfo_edit_pages, the page destination and the plan text. Approve and Deny are visible. This capture shows the pending gate; the resulting page is the next piece of evidence.", rect: [21, 50, 68, 38] },
  { label: "3 · Saved page", file: "38-cfoai-business-plan-page.png", title: "The destination changes: a page inside cfo.ai", text: "Lumen Labs – 12-Month Business Plan#140 is open in cfo.ai under Main Scenario. This proves the page destination, not that every calculation is correct or that the three requested scenario names were created.", rect: [19, 6, 61, 14] },
];


const localStages = [
  { label: "1 · Prompt", file: "43-cfo-disconnected-fresh-prompt.png", title: "A fresh request without cfo.ai", text: "The user reports deleting the previous local draft before this run. The general prompt asks for a 12-month plan. The Connect cfo.ai banner is visible; the deletion itself is not captured.", rect: [32, 12, 66, 9] },
  { label: "2 · Local plan", file: "44-cfo-disconnected-fresh-summary.png", title: "Company files → local Markdown plan", text: "The latest fresh run saves lumen-labs-12-month-plan.md. The highlighted disclosure says live cfo.ai data is not connected. Company exports support the answer; forecast assumptions and calculations remain unverified.", rect: [21, 62, 68, 8] },
  { label: "3 · Assumptions", file: "45-cfo-disconnected-fresh-scenarios.png", title: "Local scenario outputs depend on stated assumptions", text: "The answer lays out bookings and churn assumptions, then presents downside, base and upside projections. These are local answer tables, not evidence of scenarios created in cfo.ai. The numbers require reconciliation against source files.", rect: [21, 28, 68, 34] },
  { label: "4 · Cash flow", file: "46-cfo-disconnected-fresh-cash-hiring.png", title: "Inspect the forecast and hiring inputs", text: "The local forecast ends with $1,939,940 cash and September MRR of $103,491. Four hires are estimated at about $466k annually. These are captured agent calculations and assumptions, not verified financial results.", rect: [21, 25, 68, 35] },
  { label: "5 · Calculation issue", file: "47-cfo-disconnected-fresh-actions.png", title: "A visible inconsistency in the local answer", text: "The answer equates $60,480 annual gross profit to about 2.4 months of burn. At roughly $300,000 monthly burn, $60,480 ÷ $300,000 is about 0.2 months. This establishes a specific error in this answer; the connected captures do not establish that every corresponding calculation was corrected.", rect: [21, 52, 68, 7] },
];

type Mode = "without" | "with";
function readView(): { mode: Mode; index: number } {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get("cfoMode") === "with" ? "with" : "without";
  const index = Number(params.get("cfoStep") ?? 1) - 1;
  const length = mode === "with" ? connectedStages.length : localStages.length;
  return { mode, index: Number.isInteger(index) && index >= 0 && index < length ? index : 0 };
}
function viewLink(mode: Mode, index: number) {
  const url = new URL(window.location.href);
  url.searchParams.set("cfoMode", mode);
  url.searchParams.set("cfoStep", String(index + 1));
  url.hash = "cfo";
  return `${url.pathname}${url.search}${url.hash}`;
}

export function CfoProof() {
  const [view, setView] = useState(readView);
  const { mode, index: selected } = view;
  const stages = mode === "with" ? connectedStages : localStages;
  useEffect(() => {
    const sync = () => setView(readView());
    window.addEventListener("popstate", sync);
    const frame = new URLSearchParams(window.location.search).has("cfoMode")
      ? window.requestAnimationFrame(() => document.getElementById("cfo")?.scrollIntoView()) : undefined;
    return () => {
      window.removeEventListener("popstate", sync);
      if (frame !== undefined) window.cancelAnimationFrame(frame);
    };
  }, []);
  function select(nextMode: Mode, index: number) {
    window.history.pushState(null, "", viewLink(nextMode, index));
    setView({ mode: nextMode, index });
  }
  const [highlight, setHighlight] = useState(true);
  const stage = stages[selected]!;
  return <div className="mb-12 rounded-2xl border border-line bg-card p-4 sm:p-6" id="cfo-comparison">
    <p className="text-xs font-semibold uppercase tracking-widest text-link">Screenshot walkthrough · two separate runs</p>
    <h3 className="mt-2 text-2xl font-semibold">Inspect the data, assumptions and saved result.</h3>
    <div className="mt-5 grid gap-3 sm:grid-cols-2">
      <button type="button" onClick={() => select("without", 0)} aria-pressed={mode === "without"} className={`cursor-pointer rounded-xl border p-4 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 hover:bg-accent ${mode === "without" ? "border-link bg-link/10" : "border-line"}`}><strong>Without cfo.ai</strong><br />Company files → local Markdown.<br /><span className="text-muted-fg">Fresh baseline: captures 43–47.</span><span className="mt-3 block text-xs text-link">View disconnected result →</span></button>
      <button type="button" onClick={() => select("with", 0)} aria-pressed={mode === "with"} className={`cursor-pointer rounded-xl border p-4 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 hover:bg-accent ${mode === "with" ? "border-link bg-link/10" : "border-line"}`}><strong>With cfo.ai MCP</strong><br />Named tools → approval → saved page.<br /><span className="text-muted-fg">Earlier connected run: captures 36–38.</span><span className="mt-3 block text-xs text-link">View connected workflow →</span></button>
    </div>
    <p className="mt-6 text-sm font-semibold">{mode === "without" ? "Without cfo.ai · local data and calculations" : "With cfo.ai MCP · tools, approval and saved plan"}</p>
    <nav className="mt-3 flex flex-wrap gap-2" aria-label={mode === "without" ? "Disconnected CFO evidence" : "Connected CFO evidence"}>
      {stages.map((s, i) => <a key={s.label} href={viewLink(mode, i)} aria-current={selected === i ? "step" : undefined} onClick={event => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); select(mode, i); }} className={`rounded-full border px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-4 ${selected === i ? "border-link bg-link/15 text-link" : "border-line hover:bg-accent"}`}>{s.label}</a>)}
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
    <p className="mt-4 text-xs leading-relaxed text-muted-fg">Highlights are website overlays; original screenshots are unchanged. Different prompts and starting state: this demonstrates workflow capability, not an accuracy or speed advantage. Financial outputs require verification.</p>
  </div>;
}
