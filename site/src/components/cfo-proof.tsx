import { useState } from "react";
import { captureSizes } from "../capture-sizes";
import { proofFile } from "../content";

const stages = [
  { label: "1 · Without connection", file: "44-cfo-disconnected-fresh-summary.png", title: "Company files → local Markdown plan", text: "The latest fresh run saves lumen-labs-12-month-plan.md. The highlighted disclosure says live cfo.ai data is not connected. Company exports support the answer; forecast assumptions and calculations remain unverified.", rect: [21, 62, 68, 8] },
  { label: "2 · Connected tools", file: "36-cfoai-business-plan-tools.png", title: "Earlier connected run → named MCP actions", text: "The expanded activity lists Cfo edit pages, Cfo edit scenarios and Cfo inspect documentation. This is evidence of actual cfo.ai tool use, beyond an account-connected toast.", rect: [21, 64, 28, 14] },
  { label: "3 · Approve write", file: "37-cfoai-business-plan-approval.png", title: "Review the exact edit before it runs", text: "The approval card identifies cfo_edit_pages, the page destination and the plan text. Approve and Deny are visible. This capture shows the pending gate; the resulting page is the next piece of evidence.", rect: [21, 50, 68, 38] },
  { label: "4 · Saved in cfo.ai", file: "38-cfoai-business-plan-page.png", title: "The destination changes: a page inside cfo.ai", text: "Lumen Labs – 12-Month Business Plan#140 is open in cfo.ai under Main Scenario. This proves the page destination, not that every calculation is correct or that the three requested scenario names were created.", rect: [19, 6, 61, 14] },
];

export function CfoProof() {
  const [selected, setSelected] = useState(0);
  const [highlight, setHighlight] = useState(true);
  const stage = stages[selected]!;
  return <div className="mb-12 rounded-2xl border border-line bg-card p-4 sm:p-6" id="cfo-comparison">
    <p className="text-xs font-semibold uppercase tracking-widest text-link">Screenshot walkthrough · two separate runs</p>
    <h3 className="mt-2 text-2xl font-semibold">From a local plan to an approved cfo.ai write.</h3>
    <div className="mt-5 grid gap-3 sm:grid-cols-2">
      <button type="button" onClick={() => setSelected(0)} aria-pressed={selected === 0} className={`cursor-pointer rounded-xl border p-4 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 hover:bg-accent ${selected === 0 ? "border-link bg-link/10" : "border-line"}`}><strong>Without cfo.ai</strong><br />Company files → local Markdown.<br /><span className="text-muted-fg">Fresh baseline: captures 43–47.</span><span className="mt-3 block text-xs text-link">View disconnected result →</span></button>
      <button type="button" onClick={() => setSelected(1)} aria-pressed={selected > 0} className={`cursor-pointer rounded-xl border p-4 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 hover:bg-accent ${selected > 0 ? "border-link bg-link/10" : "border-line"}`}><strong>With cfo.ai MCP</strong><br />Named tools → approval → saved page.<br /><span className="text-muted-fg">Earlier connected run: captures 36–38.</span><span className="mt-3 block text-xs text-link">View connected workflow →</span></button>
    </div>
    <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="CFO evidence stages">
      {stages.map((s, i) => <button key={s.label} type="button" aria-pressed={selected === i} onClick={() => setSelected(i)} className={`rounded-full border px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-4 ${selected === i ? "border-link bg-link/15 text-link" : "border-line hover:bg-accent"}`}>{s.label}</button>)}
    </div>
    <div aria-live="polite" className="mt-5">
      <h4 className="font-semibold">{stage.title}</h4>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-fg">{stage.text}</p>
    </div>
    <div className="my-3 flex flex-wrap items-center justify-between gap-3 text-xs">
      <label className="flex cursor-pointer items-center gap-2"><input type="checkbox" checked={highlight} onChange={e => setHighlight(e.target.checked)} />Highlight proof in original capture</label>
      <a className="text-link underline underline-offset-4" href={proofFile(stage.file)} target="_blank" rel="noreferrer">Open original full size ↗</a>
    </div>
    <a href={proofFile(stage.file)} target="_blank" rel="noreferrer" className="relative block overflow-hidden rounded-xl border border-line" aria-label={`Open screenshot: ${stage.title}`}>
      <img src={proofFile(stage.file)} alt={stage.title} width={captureSizes[stage.file]?.width} height={captureSizes[stage.file]?.height} className="block h-auto w-full" loading="lazy" />
      {highlight && stage.rect && <span aria-hidden className="pointer-events-none absolute rounded border-[3px] border-amber-400 bg-amber-400/10" style={{ left: `${stage.rect[0]}%`, top: `${stage.rect[1]}%`, width: `${stage.rect[2]}%`, height: `${stage.rect[3]}%` }} />}
    </a>
    <p className="mt-4 text-xs leading-relaxed text-muted-fg">Highlights are website overlays; original screenshots are unchanged. Different prompts and starting state: this demonstrates workflow capability, not an accuracy or speed advantage. Financial outputs require verification.</p>
  </div>;
}
