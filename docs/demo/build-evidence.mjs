import { readFileSync, writeFileSync } from "node:fs";

const root = new URL("./", import.meta.url);
const traces = JSON.parse(readFileSync(new URL("northwind-trace-verification.json", root), "utf8"));
const benchmark = JSON.parse(readFileSync(new URL("northwind-benchmark.json", root), "utf8"));
const browser = JSON.parse(readFileSync(new URL("northwind-browser-verification.json", root), "utf8"));
const escape = value => String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"})[c]);
const names = ["Before fix: token cap", "After fix: completed", "Budget cap: Approve path", "Approved continuation", "Empty-reply cap: Deny path", "Denied continuation"];
const checked = new Date(traces.checkedAt).toLocaleString("en-GB", {timeZone:"Asia/Kolkata",hour12:false});
const traceRows = traces.summaries.map((r,i) => `<tr><td><strong>${names[i]}</strong><code>${escape(r.traceId)}</code></td><td class="${r.status}">${escape(r.rootStatus)}</td><td>$${r.costUsd.toFixed(6)}</td><td>${r.tokens.toLocaleString("en-US")}</td><td>${r.llmCalls}</td><td>${escape(r.detections.join(", ") || "None")}</td></tr>`).join("");
const totals = benchmark.totals;
const metricRows = [
  ["CFO file reads",29,10,"65.5% fewer"],
  ["CFO reply characters",25989,6730,"74.1% fewer"],
  ["Total tokens",768324,694000,"9.7% fewer"],
  ["Estimated cost (USD)",totals.before.costUsd.toFixed(6),totals.after.costUsd.toFixed(6),"3.3% lower"],
  ["Completed within default caps","2 of 3","3 of 3","Small sample"],
  ["Total seconds",497.2,522.2,"No latency gain"],
].map(row => `<tr>${row.map(v=>`<td>${escape(typeof v === "number" ? v.toLocaleString("en-US") : v)}</td>`).join("")}</tr>`).join("");
const html = `<!doctype html><html lang="en"><meta charset="utf-8"><title>Northwind - Verified Evidence - 12 October 2026</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#fff;color:#222;font:16px/1.5 system-ui,sans-serif}main{max-width:1200px;padding:36px 40px;margin:auto}h1{font-size:30px;margin:0 0 8px}h2{font-size:24px;margin:0 0 8px}p{margin:8px 0 18px;color:#555}section{padding:28px 0;border-bottom:1px solid #ddd}table{width:100%;border-collapse:collapse;font-size:15px}th{text-align:left;background:#f1f3f4}td,th{padding:12px 10px;border-bottom:1px solid #ddd;vertical-align:top}code{display:block;font:12px/1.8 ui-monospace,monospace;overflow-wrap:anywhere;color:#555}.error{color:#b42318;font-weight:700}.success{color:#137245;font-weight:700}.note{border-left:3px solid #777;padding-left:14px;font-size:14px}a{color:#1264a3}.label{font-size:13px;color:#555}ul{padding-left:22px}#traces,#benchmark{scroll-margin-top:0;min-height:850px}#recovery{min-height:750px}footer{font-size:13px;color:#555;margin-top:20px}
body:has(section:target) section:not(:target){display:none}section:target{min-height:0}
</style><main>
<section id="traces"><div class="label">BOT COMPANY / NORTHWIND / 12 OCTOBER 2026</div><h1>Northwind: Verified Trace Evidence</h1>
<p>Exported from neatlogs MCP. This is an evidence report, not a screenshot of the neatlogs dashboard.<br>Verified ${escape(checked)} IST. All six traces were finalized.</p>
<table><thead><tr><th>Run and trace ID</th><th>Root status</th><th>Cost USD</th><th>Tokens</th><th>LLM calls</th><th>Detections</th></tr></thead><tbody>${traceRows}</tbody></table>
<p class="note">Source: <a href="../../northwind-trace-verification.json">northwind-trace-verification.json</a>. Values are measured trace totals. The fictional company dataset is not live cfo.ai accounting data. Custom cap events and attributes were not independently inspected through MCP.</p></section>
<section id="benchmark"><div class="label">THREE BEFORE RUNS / THREE AFTER RUNS</div><h2>Northwind: Before and After the Prompt Fix</h2><p>Same question, default $0.25 / 300,000-token caps, isolated database copy.</p>
<table><thead><tr><th>Metric</th><th>Before</th><th>After</th><th>Observed change</th></tr></thead><tbody>${metricRows}</tbody></table>
<p>The Primary Bot passes sourced company facts to specialists. Delegated specialists read missing evidence and return a compact brief.</p>
<p class="note">Source: <a href="../../northwind-benchmark.json">northwind-benchmark.json</a>, recovered from recorded SSE streams. Costs are app estimates. Routing and cache hits vary; this small sample does not establish guaranteed savings. After 1's dashboard trace was unavailable. Answer-quality limitations are documented in the demo guide.</p></section>
<section id="recovery"><div class="label">BROWSER VERIFICATION / DESKTOP AND MOBILE</div><h2>Northwind: Budget Failure and Recovery</h2><p>Actual recorded browser runs, using a $0.02 per-message cap.</p>
<table><thead><tr><th>Path</th><th>Capped run</th><th>Continuation</th><th>Steps</th><th>Result</th></tr></thead><tbody>
<tr><td>Approve</td><td>$${browser.approved[0].costUsd.toFixed(6)}</td><td>$${browser.approved[1].costUsd.toFixed(6)}</td><td>${browser.approved[1].steps}</td><td>Completed within the one-time $0.04 budget</td></tr>
<tr><td>Deny</td><td>$${browser.denied[0].costUsd.toFixed(6)}</td><td>$${browser.denied[1].costUsd.toFixed(6)}</td><td>${browser.denied[1].steps}</td><td>Tool-free answer marked Incomplete</td></tr></tbody></table>
<ul>${browser.browserChecks.map(check=>`<li>${escape(check)}</li>`).join("")}</ul>
<p class="note">Source: <a href="../../northwind-browser-verification.json">northwind-browser-verification.json</a>. Caps are checked after model steps and may overshoot. Deny still incurs the single answer call. Verification covers execution, persistence, and core figures; model answers contain documented inaccuracies.</p></section>
<footer>Preserved evidence for neatHack 2026. Original app screenshots and source JSON are indexed in README.md.</footer></main></html>`;
writeFileSync(new URL("evidence/2026-10-12/northwind-verified-evidence.html", root), html);
console.log("Generated northwind-verified-evidence.html from the saved JSON exports.");
