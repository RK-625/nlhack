# Northwind Proof and Evidence - 12 October 2026

Preserved screenshots, source exports, and a standalone report for the neatHack
failure-and-recovery demo. The fictional Northwind scenario uses the local
Lumen Labs dataset. These files do not prove live cfo.ai accounting access or a
real customer credit being issued.

## Screenshot Index

| File | Title | What it proves |
|---|---|---|
| [01-northwind-budget-extension-pending-desktop.png](01-northwind-budget-extension-pending-desktop.png) | Northwind: Pending Budget Extension - Desktop | A $0.02-capped run offers Approve/Deny with a one-time $0.04 extension; preserved from the original browser check. |
| [02-northwind-empty-reply-reload-mobile.png](02-northwind-empty-reply-reload-mobile.png) | Northwind: Empty Reply Survives Reload - Mobile | At 390 x 844, a capped run without assistant text retains its fallback explanation and pending card after reload. |
| [04-northwind-incomplete-answer-desktop.png](04-northwind-incomplete-answer-desktop.png) | Northwind: Incomplete Answer After Denial - Desktop | Original verification capture showing the denied card and the answer's missing-evidence explanation. |
| [05-northwind-neatlogs-trace-results-report.png](05-northwind-neatlogs-trace-results-report.png) | Northwind: Verified Neatlogs Trace Results | A rendered report of six finalized MCP trace exports: capped roots are ERROR, approved and denied continuations are SUCCESS, with measured costs and tokens. |
| [06-northwind-before-after-benchmark-report.png](06-northwind-before-after-benchmark-report.png) | Northwind: Before and After the Prompt Fix | Three-before/three-after aggregate comparison, including the modest cost reduction and lack of a latency gain. |
| [07-northwind-approve-deny-verification-report.png](07-northwind-approve-deny-verification-report.png) | Northwind: Budget Failure and Recovery | Recorded Approve/Deny costs, continuation steps, reload persistence, stale-decision rejection, and restored caps. |

Screenshots 01-04 are actual app captures. Screenshots 05-07 are explicitly
labeled reports rendered from saved JSON, **not Neatlogs dashboard screenshots**.
The dashboard required sign-in in the capture browser. No dashboard screenshot
or live approved-answer screenshot has been fabricated or reconstructed.

## Neat Bot: diagnose → fix → verify

Live Neat Bot answers captured on 12 October 2026, **after** the fix had been
made. They are not how the problem was first found. The diagnosis thread was a
new conversation given only the failed "before" trace
`0ce0e491e0e1bdc3cf89d00ca4dfb65d` and asked to diagnose it and suggest fixes,
with no mention of the fix. Treat it as an independent diagnosis that converges
on the same fix.

| Step | File | Title | What it proves |
|---|---|---|---|
| Diagnose | [08-neatbot-diagnosis-verdict.png](08-neatbot-diagnosis-verdict.png) | Neat Bot: Diagnosis Verdict | From the before trace alone: errored after 208.1 s with no final answer; 20 LLM calls, 323,923 tokens, $0.05896. |
| Diagnose | [09-neatbot-diagnosis-cost-breakdown.png](09-neatbot-diagnosis-cost-breakdown.png) | Neat Bot: Where Cost and Time Went | Per-agent calls and LLM time; prompt tokens are 89.5% of the total; the specialists ran sequentially, not in parallel. |
| Diagnose | [10-neatbot-diagnosis-waste.png](10-neatbot-diagnosis-waste.png) | Neat Bot: What Looks Wasteful | Duplicated file retrieval, overlapping briefs, duplicate final generations, report-length inflation, an empty Sales Bot delegation. |
| Diagnose | [11-neatbot-diagnosis-ranked-fixes.png](11-neatbot-diagnosis-ranked-fixes.png) | Neat Bot: Ranked Changes | Three ranked changes: (1) cut the fan-out, (2) run specialists concurrently, (3) share one fact sheet with file citations, cap replies at about 300-400 words, and fix the empty delegation. |
| Fix | Commit `8887e9ba` `fix(agents): reuse company facts in delegated briefs`; prompt source `src/mastra/prompts/index.ts` | The prompt fix | The Primary Bot passes already-read figures and file paths; delegated specialists do not re-read them and reply with a compact brief. |
| Verify | [12-neatbot-compare-before-after.png](12-neatbot-compare-before-after.png) | Neat Bot: Before vs After | Before `0ce0e491...` failed ($0.0589567, 323,923 tokens, 20 LLM calls); after `b0392391b4829a49a483b6c101ee336b` succeeded ($0.0498578, 237,208 tokens, 16 LLM calls). |
| Verify | [13-neatbot-compare-budget-and-failure.png](13-neatbot-compare-budget-and-failure.png) | Neat Bot: Budget and Failure | Which agent used the most time and hops in each run, and the failing Sales Bot span in the before run. |
| Verify | [14-neatbot-compare-what-changed.png](14-neatbot-compare-what-changed.png) | Neat Bot: What Changed | The prompt change visible in span inputs, with the CFO Bot told not to re-read figures already supplied in its brief. |

### What matches the fix, and what does not

- Ranked change 3(a) and 3(b) (one shared fact sheet with file citations, and
  specialist replies capped at about 300-400 words) matches what commit
  `8887e9ba` did.
- Ranked change 1 (cut the fan-out) and change 2 (run the specialists
  concurrently; the trace shows they ran sequentially) were **not** implemented.
  They are future work.

### Known limits

- neatlogs recorded no tool spans (`tool_calls: 0`), so file reads are inferred
  from the agents' own text. The 29 to 10 CFO file-read count comes from app SSE
  logs, not neatlogs.
- The Neat Bot attributed the failure to an empty Sales Bot delegation. The
  actual trigger was the per-turn cap: once the budget was exhausted, the cap
  processor aborted the Sales Bot before its first model call (see
  `src/usage/turn-budget.ts`, `processInputStep`). The cap reason is not exposed
  through the neatlogs MCP, so its fix 3(c) addresses a symptom.
- The two threads describe the before brief slightly differently: the comparison
  thread says the CFO brief gave file paths without the figures, while the
  diagnosis thread says the briefs embedded a large "known context" block. This
  is noted, not resolved.
- The two threads also disagree on concurrency: the diagnosis thread reads the
  span durations as strictly sequential, while the comparison thread describes
  the specialists as parallel. The diagnosis arithmetic (specialist spans plus
  Primary Bot time about equal to the root duration) favours sequential.

## Source Evidence

- [Standalone evidence report](northwind-verified-evidence.html): opens directly without a server.
- [Verified Neatlogs trace exports](northwind-trace-verification.json): six finalized traces, checked 12 October 2026 at 14:21:04 IST.
- [Browser verification](northwind-browser-verification.json): actual capped and continuation usage records and checked behaviors.
- [Six-run benchmark](northwind-benchmark.json): local SSE measurements, model, caps, trace IDs, and per-run totals.
- [Recording guide and trace links](northwind-cap-escalation.md): scenario, source facts, recording sequence, and answer-quality limitations.
- [SHA-256 manifest](SHA256SUMS.txt): integrity hashes for the preserved screenshots, report, and source exports.

Regenerate the HTML report from the JSON exports from the repository root:

```sh
node docs/demo/build-evidence.mjs
```

## Evidence Limits

The browser checks establish execution and persistence. Some generated answers
contain documented calculation and date errors, so they are not fully verified
financial advice. Costs vary with routing and cache hits. After 1's dashboard
trace was unavailable; its local SSE metrics are retained but not represented as
dashboard-verified. Custom cap attributes/events were not independently read
back through MCP.


## Published copy

PNGs 01-07 and the three JSON exports are byte-identical to the supplied evidence; PNGs 08-14 are Neat Bot screenshots added afterwards. Relative links in this index, the demo guide, and HTML report were adapted for this public folder; the HTML also adds a mobile viewport and scrollable tables. SHA256SUMS.txt verifies this published copy. The private repository remains private.
