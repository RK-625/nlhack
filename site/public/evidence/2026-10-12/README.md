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
| [03-northwind-extension-denied-desktop.png](03-northwind-extension-denied-desktop.png) | Northwind: Denied Extension After Reload - Desktop | Fresh capture of the saved denied state and its incomplete answer, taken before stopping the test server. |
| [04-northwind-incomplete-answer-desktop.png](04-northwind-incomplete-answer-desktop.png) | Northwind: Incomplete Answer After Denial - Desktop | Original verification capture showing the denied card and the answer's missing-evidence explanation. |
| [05-northwind-neatlogs-trace-results-report.png](05-northwind-neatlogs-trace-results-report.png) | Northwind: Verified Neatlogs Trace Results | A rendered report of six finalized MCP trace exports: capped roots are ERROR, approved and denied continuations are SUCCESS, with measured costs and tokens. |
| [06-northwind-before-after-benchmark-report.png](06-northwind-before-after-benchmark-report.png) | Northwind: Before and After the Prompt Fix | Three-before/three-after aggregate comparison, including the modest cost reduction and lack of a latency gain. |
| [07-northwind-approve-deny-verification-report.png](07-northwind-approve-deny-verification-report.png) | Northwind: Budget Failure and Recovery | Recorded Approve/Deny costs, continuation steps, reload persistence, stale-decision rejection, and restored caps. |

Screenshots 01-04 are actual app captures. Screenshots 05-07 are explicitly
labeled reports rendered from saved JSON, **not Neatlogs dashboard screenshots**.
The dashboard required sign-in in the capture browser. No dashboard screenshot
or live approved-answer screenshot has been fabricated or reconstructed.

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

The seven PNG files and three JSON exports are byte-identical to the supplied evidence. Relative links in this index, the demo guide, and HTML report were adapted for this public folder; the HTML also adds a mobile viewport and scrollable tables. SHA256SUMS.txt verifies this published copy. The private repository remains private.
