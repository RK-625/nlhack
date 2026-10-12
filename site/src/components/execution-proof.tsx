import { executionRuns } from "../content";
import { Gallery } from "./media";

export function ExecutionProof() {
  return <div className="mb-10">
    <div className="overflow-x-auto rounded-2xl border border-line">
      <table className="num w-full min-w-[590px] text-left text-sm">
        <caption className="border-b border-line bg-card px-5 py-4 text-left font-semibold">Two completed tasks · captured usage, not a comparative benchmark</caption>
        <thead className="bg-muted"><tr>{["Specialist", "Displayed cost", "Displayed tokens", "Trace duration", "Per-message caps"].map(t => <th key={t} scope="col" className="px-4 py-3">{t}</th>)}</tr></thead>
        <tbody>{executionRuns.map(run => <tr key={run.name} className="border-t border-line"><th scope="row" className="px-4 py-4">{run.name}</th><td className="px-4 py-4">{run.cost}</td><td className="px-4 py-4">{run.tokens}</td><td className="px-4 py-4">{run.duration}</td><td className="px-4 py-4">$0.25 / 300k tokens</td></tr>)}</tbody>
      </table>
    </div>
    <p className="mt-3 text-xs leading-relaxed text-muted-fg">Costs and token counts are rounded values from the supplied app popovers; durations come from the dashboard screenshots. Matching display values are not an independent billing audit. Each dashboard shows four LLM spans and eight displayed steps, with no separate tool spans shown.</p>
    <div className="mt-6 space-y-4">
      {executionRuns.map(run => <details key={run.name} className="group rounded-2xl border border-line bg-card p-4 sm:p-6">
        <summary className="cursor-pointer text-lg font-semibold focus-visible:outline-2 focus-visible:outline-offset-4">{run.name} · {run.summary}<span className="mt-2 block text-xs font-normal text-link">Open {run.shots.length} original screenshots: task → answer → usage → trace</span></summary>
        <p className="my-5 max-w-3xl text-sm leading-relaxed text-muted-fg">{run.detail}</p>
        <Gallery name={`${run.name} execution evidence`} shots={run.shots} />
      </details>)}
    </div>
  </div>;
}
