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
Real Neatlogs dashboard screenshots (17, 18) and the live approved answer (16)
are in the "Live run" section below; nothing has been fabricated or reconstructed.

## Live run: cap → Approve (public app, 15:52 IST)

Real captures from the public app on 12 October 2026, plus real Neatlogs
dashboard screenshots of the two resulting traces. This is **not** the Northwind
renewal question: the user asked the Primary Bot (typed as written) "can make a
check the coo bot with these data about can expand the business here and what is
the current business situation in us". The Primary Bot noted there is no COO bot,
read it as US expansion plus the current US picture, and delegated to the
Research Bot and CFO Bot. The per-message caps were $0.03 and 300k tokens.

| File | Title | What it proves |
|---|---|---|
| [15-live-capped-turn-usage-token-cap.png](15-live-capped-turn-usage-token-cap.png) | Live: Capped Turn Usage | Cost $0.026 / $0.03 but tokens 302k / 300k (red): the **token** cap, not the cost cap, stopped the turn. "Neatlogs: not available yet" means the trace was not finalized when the app checked, not that it was missing. Tooltip trace `bbb3239517e0bcbe0ff9eed8e9309a5d`. |
| [16-live-approved-answer-continuation-budget.png](16-live-approved-answer-continuation-budget.png) | Live: Approved Answer and Continuation Budget | After Approve the answer completed. Usage $0.034 / $0.05 and 167k / 454k (the one-time continuation budget); the Neatlogs link reads $0.034 and 167k tokens, matching the app's estimate. Trace `3c670bab3ed85e64a42acdc15513ca20`. |
| [17-neatlogs-capped-trace-error.png](17-neatlogs-capped-trace-error.png) | Neatlogs: Capped Trace | Real dashboard: `web.request` ERROR, "Execution Failed", 14 steps, 4m 27.5s. The Research Bot made 7 LLM calls, then the CFO Bot span lasted 11 ms (blocked by the cap before its first model call). "Ended with error". |
| [18-neatlogs-approved-continuation-trace.png](18-neatlogs-approved-continuation-trace.png) | Neatlogs: Approved Continuation | Real dashboard: input "Continuation: From: bbb3239517e0bcbe0ff9eed8e9309a5d, Decision: approved"; 11 steps, 2m 11.3s, normal finish with the answer as output. |
| [19-live-us-expansion-question-running-cost-cap.png](19-live-us-expansion-question-running-cost-cap.png) | Live: Question Running | The question above, the Research Bot and CFO Bot delegations in progress, and the $0.03 / 300k caps in the popover ($0.017 / 138k at this point). |
| [20-live-token-usage-approaching-cap.png](20-live-token-usage-approaching-cap.png) | Live: Tokens Approaching Cap | Same turn at $0.024 / $0.03 and 254k / 300k, still delegating. |
| [21-live-cap-card-approved-continuing.png](21-live-cap-card-approved-continuing.png) | Live: Cap Card Approved | "This reply hit its 300k token limit after 302k. Finishing needs about $0.05 more." with "Approved: one-time extension granted", and the Primary Bot thinking again. |
| [22-live-approved-answer-us-situation-table.png](22-live-approved-answer-us-situation-table.png) | Live: Approved Answer, US Situation | Top of the completed answer with the Neatlogs link ($0.034, 167k) beside the estimate. It states the external market research returned no sourced data and marks what is supported by company records. |
| [23-live-approved-answer-recommendation-gaps.png](23-live-approved-answer-recommendation-gaps.png) | Live: Approved Answer, Recommendation and Gaps | The recommendation and a "What I could not get" section listing missing external US market evidence and internal data gaps. |

Trace links (may require access to the Neatlogs project):

- [Capped turn `bbb3239517e0bcbe0ff9eed8e9309a5d`](https://app.neatlogs.com/traces/bbb3239517e0bcbe0ff9eed8e9309a5d?orgId=43303629-c7cb-4d5f-89c8-732d78cf1761&projectId=3fa20372-340e-40a3-bed9-841c1a90c3e3)
- [Approved continuation `3c670bab3ed85e64a42acdc15513ca20`](https://app.neatlogs.com/traces/3c670bab3ed85e64a42acdc15513ca20?orgId=43303629-c7cb-4d5f-89c8-732d78cf1761&projectId=3fa20372-340e-40a3-bed9-841c1a90c3e3)

Notes:

- The capped turn was stopped by the token cap (302k / 300k) while cost was
  $0.026 of $0.03. Approve granted a one-time continuation budget ($0.05 /
  454k tokens); the continuation used $0.034 / 167k, and Neatlogs' cost and
  tokens matched the app's estimate.
- The guest-safe server runs with Crustdata disabled, so the Research Bot
  returned no sourced external data, and the answer says so. This is an
  environment limit, not a bug.
- The answer's figures are not independently verified.
- Screenshots 15-23 are unedited captures (PNG conversions of the originals);
  other screenshots from the same session that showed the earlier Northwind
  turn, or duplicated 17, were left out.

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

Real Neatlogs dashboard screenshots (17, 18) and a live approved-answer
screenshot (16) now exist for the 15:52 IST run; they cover that run only, not
the Northwind scenario. The browser checks establish execution and persistence. Some generated answers
contain documented calculation and date errors, so they are not fully verified
financial advice. Costs vary with routing and cache hits. After 1's dashboard
trace was unavailable; its local SSE metrics are retained but not represented as
dashboard-verified. Custom cap attributes/events were not independently read
back through MCP.


## Published copy

PNGs 01-07 and the three JSON exports are byte-identical to the supplied evidence; PNGs 08-14 are Neat Bot screenshots added afterwards. Relative links in this index, the demo guide, and HTML report were adapted for this public folder; the HTML also adds a mobile viewport and scrollable tables. SHA256SUMS.txt verifies this published copy. The private repository remains private.
