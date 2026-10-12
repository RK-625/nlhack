/**
 * Every fact, link and number on the site lives here.
 *
 * Unknown values are `todo("...")` placeholders. They render as a muted
 * "Coming soon" pill, never as made-up data. Replace each `todo(...)` with
 * the real value (a string, number, URL or list) when you have it.
 * Search this file for `todo(` to find everything left to fill.
 */

export type Todo = { readonly todo: string };
export type Maybe<T> = T | Todo;

export const todo = (note: string): Todo => ({ todo: note });
export const isTodo = <T,>(v: Maybe<T>): v is Todo =>
  typeof v === "object" && v !== null && "todo" in (v as object);

/** Preserved evidence supplied for publication; trace dashboards may require sign-in. */
export const proofBase = "/evidence/2026-10-12";
export const proofReport = `${proofBase}/northwind-verified-evidence.html`;
export const traceUrl = (id: string) =>
  `https://app.neatlogs.com/traces/${id}?orgId=43303629-c7cb-4d5f-89c8-732d78cf1761&projectId=3fa20372-340e-40a3-bed9-841c1a90c3e3`;

/** Full-size PNG capture in the evidence folder (opened in the lightbox / on click). */
export const proofFile = (name: string) => `${proofBase}/${name}`;
/** Lightweight JPEG preview generated with `sips` (max 1200px wide, quality 70). */
export const proofThumb = (name: string) => `${proofBase}/thumbs/${name.replace(/\.png$/, ".jpg")}`;

/* ------------------------------------------------------------------ site */

export const site = {
  name: "Bot Company",
  hackathon: "neatHack 2026",
  tagline: "A company of AI agents that asks before it acts.",
  description:
    "Bot Company is a multi-agent company copilot built on Mastra. A Primary Bot delegates to specialists for research, finance, GitHub and observability. Every write waits for your approval, every turn has a cost cap, and every run is traced with neatlogs.",
  /** Public URL of this site, used for OG tags. */
  url: "https://bot-company.onrender.com" as Maybe<string>,
  repoUrl: todo("Repo is private for now; public link when it opens") as Maybe<string>,
  credits:
    "Inspired by Grok bot. The UI was built with help from looking at Grok's UI and design.",
};

/* -------------------------------------------------------------- the team */

export type BotColor = "orange" | "blue" | "green" | "yellow" | "pink" | "violet" | "teal" | "slate";

export type Bot = {
  name: string;
  role: string;
  tools: string[];
  color: BotColor;
  /** Source file, relative to the repo root. */
  file: string;
  /** Short note on what needs approval, if anything. */
  gate?: string;
};

export const bots: Bot[] = [
  {
    name: "Primary Bot",
    role: "Talks to you, plans the work and hands each part to the right specialist. Writes the final reply.",
    tools: ["Delegation to every specialist", "Shared file workspace"],
    color: "orange",
    file: "src/mastra/agents/assistant.ts",
  },
  {
    name: "Research Bot",
    role: "Company and market research.",
    tools: ["Crustdata company search", "Crustdata enrichment", "Web search"],
    color: "blue",
    file: "src/mastra/agents/market-researcher.ts",
  },
  {
    name: "CFO Bot",
    role: "Cash flow, runway, budgets, pricing and hiring scenarios.",
    tools: ["Live cfo.ai data via your own OAuth link"],
    color: "green",
    file: "src/mastra/agents/cfo.ts",
    gate: "Changes in cfo.ai need approval",
  },
  {
    name: "GitHub Bot",
    role: "Repos, issues, pull requests and Actions runs.",
    tools: ["GitHub MCP server"],
    color: "violet",
    file: "src/mastra/agents/github.ts",
    gate: "Every non-read-only tool needs approval",
  },
  {
    name: "Neat Bot",
    role: "Reads the traces of the other agents: failures, latency, tokens, detections, triage.",
    tools: ["neatlogs MCP server"],
    color: "teal",
    file: "src/mastra/agents/neatlogs.ts",
    gate: "Employees only see their own traces",
  },
  {
    name: "Customer Success Bot",
    role: "Onboarding, churn risk and renewals.",
    tools: [],
    color: "pink",
    file: "src/mastra/agents/customer-success.ts",
  },
  {
    name: "Legal Bot",
    role: "Contract and compliance checklists, policy drafts. Not legal advice.",
    tools: [],
    color: "slate",
    file: "src/mastra/agents/legal.ts",
  },
  {
    name: "HR Bot",
    role: "Hiring, performance and compensation framing.",
    tools: [],
    color: "yellow",
    file: "src/mastra/agents/hr.ts",
  },
  {
    name: "Marketing Bot",
    role: "Positioning, campaigns and SEO briefs.",
    tools: [],
    color: "pink",
    file: "src/mastra/agents/marketing.ts",
  },
  {
    name: "Sales Bot",
    role: "ICP, outreach and deal strategy.",
    tools: [],
    color: "blue",
    file: "src/mastra/agents/sales.ts",
  },
];

/* ---------------------------------------------------------- how it works */

export const steps = [
  { title: "You ask", body: "One message in the web chat or the CLI, in plain language." },
  { title: "Primary Bot delegates", body: "It splits the request and sends each part to the specialist that owns the tools." },
  { title: "A specialist acts", body: "Reads run straight away. Any write pauses and shows an Approve/Deny card with the exact tool and arguments." },
  { title: "You get the reply, with its bill", body: "The answer arrives with the turn's estimated cost and tokens, next to neatlogs' own count." },
];

/* ----------------------------------------------------------------- trust */

/** Shown as an illustration of the approval card, not a real run. */
export const approvalExample = {
  agent: "GitHub Bot",
  via: "Primary Bot",
  tool: "create_issue",
  args: { owner: "your-org", repo: "your-repo", title: "Track competitor pricing changes" },
};

export const caps = {
  costCapUsd: 0.25,
  tokenCap: 300_000,
};

/** Real completed run: Northwind After 2 benchmark (app estimate) and its finalized neatlogs export. */
export const receiptExample = {
  estCostUsd: 0.049858 as Maybe<number>,
  estTokens: "237,208" as Maybe<string>,
  steps: 16 as Maybe<number>,
  neatlogsCostUsd: 0.04985785 as Maybe<number>,
  neatlogsTokens: "237,208" as Maybe<string>,
  traceUrl: traceUrl("b0392391b4829a49a483b6c101ee336b") as Maybe<string>,
};

/* ------------------------------------------------------------------ demo */

export const demo = {
  youtubeId: todo("TODO: YouTube video id") as Maybe<string>,
  /** Chapters for the judges page. `start` is seconds into the video. */
  chapters: [
    { label: "Primary Bot delegates a research + finance question", start: todo("TODO: timestamp") as Maybe<number> },
    { label: "GitHub Bot write pauses for Approve/Deny", start: todo("TODO: timestamp") as Maybe<number> },
    { label: "Cost cap stops a turn", start: todo("TODO: timestamp") as Maybe<number> },
    { label: "Neat Bot reads the trace of that turn", start: todo("TODO: timestamp") as Maybe<number> },
    { label: "CFO Bot connects cfo.ai and plans hiring costs", start: todo("TODO: timestamp") as Maybe<number> },
  ],
};

/* ------------------------------------------------------------- partners */

export type Partner = {
  id: "neatlogs" | "entire" | "cfo";
  name: string;
  claims: string[];
  link: Maybe<string>;
  linkLabel: string;
  /** Full-size capture; the preview uses its thumbnail. */
  screenshot?: Maybe<string>;
  /** Short real text capture, shown when there is no screenshot. */
  excerpt?: string;
  caption: string;
};

export const partners: Partner[] = [
  {
    id: "neatlogs",
    name: "neatlogs",
    claims: [
      "Every agent is wrapped with neatlogs/mastra: model steps, timing, tokens and errors per run.",
      "A capped turn finalizes as ERROR (\"Execution Failed\"); its approved continuation is a separate trace that finishes normally.",
      "Each reply shows neatlogs' cost beside our estimate. On the live run both read $0.034 for 167k tokens.",
      "Neat Bot reads traces through the neatlogs MCP server and diagnosed the failed Northwind run from its trace alone.",
    ],
    link: "/judges/#screenshots",
    linkLabel: "See the dashboard captures",
    screenshot: proofFile("17-neatlogs-capped-trace-error.png"),
    caption: "Real dashboard, 12 Oct 2026: the capped turn ends with error after 14 steps, 4m 27.5s.",
  },
  {
    id: "entire",
    name: "Entire",
    claims: [
      "Entire was enabled on day one; git hooks add an Entire-Checkpoint trailer to commits made in a recorded coding session.",
      `84 of 101 commits carry a trailer (as of 2026-10-12). 79 Entire refs are pushed to the private origin.`,
      "Checkpoint 01M4QMYG… for the fix commit 8887e9ba records the agent (Codex), the one file changed and its verification of the benchmark.",
    ],
    link: proofFile("24-entire-checkpoint-8887e9ba.txt"),
    linkLabel: "Read the 8887e9ba checkpoint",
    excerpt: [
      "$ entire checkpoint explain --short 8887e9ba",
      "● Checkpoint 01M4QMYG0STA2ZQR90286XF297",
      "  session  01a12f3f-fde6-75e2-b63f-23c8f91f7b07",
      "  created  2026-10-12 08:51:30",
      "  tokens   6041.7k",
      "  commits  8887e9b fix(agents): reuse company facts in delegated briefs",
      "",
      "$ entire checkpoint tokens 01M4QMYG0STA2ZQR90286XF297",
      "Agent:      Codex",
      "Total:  6041.7k tokens",
      "  Input: 226.3k | Cache read: 5796.6k | Cache write: 0 | Output: 18.8k | API calls: 45",
    ].join("\n"),
    caption: "Real CLI output (email redacted). The repo is private, so these text captures are the public record.",
  },
  {
    id: "cfo",
    name: "cfo.ai",
    claims: [
      "Each user links their own cfo.ai account over OAuth with PKCE; the WorkOS consent step completes end to end in the app.",
      "CFO Bot can read live cfo.ai workspace data; every edit tool waits for approval.",
      "The captured hiring-expense answer used local company files (9 file tool calls, no cfo.ai tool calls), so it does not show live cfo.ai data.",
      "A Bot Company business plan built in cfo.ai is still to do.",
    ],
    link: "/judges/#screenshots",
    linkLabel: "See the cfo.ai captures",
    screenshot: proofFile("29-cfoai-connected.png"),
    caption: "Real capture, 12 Oct 2026: back in the app after consent, with the \"cfo.ai connected.\" toast.",
  },
];

/* ------------------------------------------------------------ comparison */

export type Mark = "yes" | "partly" | "no";

export const comparison: {
  columns: [string, string, string];
  rows: { feature: string; marks: [Mark, Mark, Mark] }[];
} = {
  columns: ["Bot Company", "Single chat assistant", "DIY scripts"],
  rows: [
    { feature: "Specialists with their own tools", marks: ["yes", "no", "partly"] },
    { feature: "Approval before every write, even when delegated", marks: ["yes", "partly", "no"] },
    { feature: "Per-turn cost and token cap", marks: ["yes", "no", "partly"] },
    { feature: "Cost shown on every reply", marks: ["yes", "no", "no"] },
    { feature: "Every run traced", marks: ["yes", "no", "partly"] },
    { feature: "Live finance data per user", marks: ["yes", "no", "partly"] },
    { feature: "Works without setup", marks: ["partly", "yes", "no"] },
  ],
};

/* ------------------------------------------------------- built in public */

export type Post = { date: string; title: string; url: string };

/** Posts tagged #neatHack. */
export const posts: Maybe<Post[]> = todo("TODO: built-in-public posts (date, title, url)");

/* ================================================================ judges */

/** Recounted from `git log` at HEAD on 2026-10-12 (see repo-checkpoints.txt). */
export const repoFacts = {
  asOf: "2026-10-12",
  ref: "e01aee1f6ece270ce53427f18df3dc687c021b21",
  commits: 101,
  firstCommit: "2026-10-10",
  lastCommit: "2026-10-12",
  perDay: "17 on 10 Oct, 45 on 11 Oct, 39 on 12 Oct",
  checkpointTrailers: 84,
  checkpointRefs: 79,
};

export const bigNumbers = [
  { id: "neatlogs", value: "−26.8%" as Maybe<string>, label: "tokens on the fixed run's trace vs the failed one (323,923 → 237,208), which now succeeds" },
  { id: "entire", value: String(repoFacts.checkpointTrailers) as Maybe<string>, label: `of ${repoFacts.commits} commits carry an Entire checkpoint (as of ${repoFacts.asOf})` },
  { id: "cfo", value: "20.4 → 18.5" as Maybe<string>, label: "months of runway before and after 4 planned hires, from CFO Bot's hiring-expense plan (fictional Lumen Labs data)" },
];

export type Badge = "In repo" | "Public" | "Screenshots" | "Report";

export const evidence: {
  criterion: string;
  badge: Badge;
  proof: Maybe<string>;
  link: Maybe<string>;
  linkLabel?: string;
}[] = [
  {
    criterion: "Agent improved (run before and after, with numbers)",
    badge: "Screenshots",
    proof: "Same Northwind question before and after commit 8887e9ba. Paired traces: the failed run (0ce0e491…, $0.0590, 323,923 tokens, 20 LLM calls) became a successful one (b0392391…, $0.0499, 237,208 tokens, 16 LLM calls). Over three runs each: CFO file reads 29 → 10, completed within caps 2/3 → 3/3, cost −3.3%, no latency gain.",
    link: proofFile("12-neatbot-compare-before-after.png"),
    linkLabel: "Open the comparison",
  },
  {
    criterion: "Used neatlogs (trace links or screenshots)",
    badge: "Screenshots",
    proof: "Real dashboard captures of a live turn: the capped trace bbb32395… ends in ERROR (\"Execution Failed\", 14 steps); its approved continuation 3c670bab… finishes normally (11 steps). Six more traces were exported via the neatlogs MCP. Trace links need project sign-in, so screenshots stand in.",
    link: proofFile("17-neatlogs-capped-trace-error.png"),
    linkLabel: "Open the dashboard capture",
  },
  {
    criterion: "Used Entire (checkpoints or entire-graph output)",
    badge: "In repo",
    proof: `${repoFacts.checkpointTrailers} of ${repoFacts.commits} commits carry an Entire-Checkpoint trailer; ${repoFacts.checkpointRefs} Entire refs are on the private origin. The fix commit 8887e9ba maps to checkpoint 01M4QMYG…: Codex session, 6041.7k tokens, 45 API calls, one file changed. Published as CLI text captures.`,
    link: proofFile("24-entire-checkpoint-8887e9ba.txt"),
    linkLabel: "Read the checkpoint",
  },
  {
    criterion: "Used cfo.ai (business plan covering pricing, costs, revenue, runway)",
    badge: "Screenshots",
    proof: "Partly. The per-user cfo.ai OAuth connection completes end to end. CFO Bot then planned hiring costs: 4 open roles, about $447k loaded annual payroll, burn $295,061 → about $326k a month, runway 20.4 → about 18.5 months. That answer came from local fictional Lumen Labs files, not cfo.ai tools. The Bot Company business plan is still to do.",
    link: proofFile("32-cfoai-hiring-expense-answer.png"),
    linkLabel: "Open the answer",
  },
  {
    criterion: "Agent recovers from failures (a run where an action failed, then what it did next)",
    badge: "Screenshots",
    proof: "Live turn on the public app: it hit the 300k token cap at 302k ($0.026 of $0.03). The card offered a one-time extension; after Approve the continuation finished within its $0.05 / 454k budget, using $0.034 and 167k tokens. In the Northwind check, Approve finished at $0.031799 and Deny returned a tool-free answer marked Incomplete.",
    link: proofFile("21-live-cap-card-approved-continuing.png"),
    linkLabel: "Open the cap card",
  },
  {
    criterion: "Built in public (posts tagged #neatHack)",
    badge: "Public",
    proof: todo("TODO: number of posts"),
    link: todo("TODO: link to posts"),
  },
  {
    criterion: "Code written during the hackathon (dated commits)",
    badge: "In repo",
    proof: `${repoFacts.commits} commits, all dated ${repoFacts.firstCommit} to ${repoFacts.lastCommit} (${repoFacts.perDay}). The first commit is the README with the hackathon problem statement.`,
    link: proofFile("repo-checkpoints.txt"),
    linkLabel: "Open the commit list",
  },
];

export const improvement = {
  summary: "The fix (commit 8887e9ba) makes the Primary Bot pass the figures and file paths it has already read, so specialists stop re-reading them and reply with a compact brief. Six Northwind runs on fictional local company data, recorded 12 October 2026: three before, three after." as Maybe<string>,
  note: "Totals over three runs each. CFO reply characters fell 74.1% (25,989 → 6,730). The failed before run and the matching after run were compared trace by trace with Neat Bot: 15.4% cheaper, 26.8% fewer tokens, 20 → 16 LLM calls. Total elapsed time rose from 497.2 to 522.2 seconds. A small sample, so no guaranteed savings; the CFO file-read count comes from app logs because neatlogs recorded no tool spans.",
  link: `${proofReport}#benchmark`,
  stats: [
    { label: "CFO file reads (3 runs)", v1: "29" as Maybe<string>, v2: "10" as Maybe<string> },
    { label: "Finished within caps", v1: "2 of 3" as Maybe<string>, v2: "3 of 3" as Maybe<string> },
    { label: "Total tokens (3 runs)", v1: "768,324" as Maybe<string>, v2: "694,000" as Maybe<string> },
    { label: "Total estimated cost (3 runs)", v1: "$0.146359" as Maybe<string>, v2: "$0.141544" as Maybe<string> },
  ],
};

export const incident: { stage: string; text: Maybe<string>; link?: Maybe<string>; linkLabel?: string }[] = [
  {
    stage: "Failure",
    text: "Northwind run before-2 hit the 300k token cap: 323,923 tokens, $0.05896, 20 LLM calls, 208 s, no final answer.",
    link: proofFile("08-neatbot-diagnosis-verdict.png"),
    linkLabel: "Verdict",
  },
  {
    stage: "Detected in neatlogs",
    text: "Trace 0ce0e491… finalized as ERROR with an Execution Failed detection. Given only that trace, Neat Bot found duplicated file reads and prompt tokens at 89.5% of the total, and ranked fixes.",
    link: proofFile("11-neatbot-diagnosis-ranked-fixes.png"),
    linkLabel: "Ranked fixes",
  },
  {
    stage: "Fix",
    text: "Commit 8887e9ba changes one file, src/mastra/prompts/index.ts: the Primary Bot passes the figures and file paths it already read, and specialists reply with a compact brief instead of re-reading. Its Entire checkpoint records the session.",
    link: proofFile("24-entire-checkpoint-8887e9ba.txt"),
    linkLabel: "Checkpoint",
  },
  {
    stage: "Verified",
    text: "The same question, after the fix: trace b0392391… succeeded at $0.0499, 237,208 tokens, 16 LLM calls. All three after runs finished within the caps.",
    link: proofFile("12-neatbot-compare-before-after.png"),
    linkLabel: "Before vs after",
  },
];

export type Shot = { src: string; thumb: string; alt: string };
const shot = (file: string, alt: string): Shot => ({ src: proofFile(file), thumb: proofThumb(file), alt });

export type Gallery = {
  id: string;
  name: string;
  note?: string;
  shots?: Maybe<Shot[]>;
  files?: { href: string; label: string }[];
};

export const galleries: Gallery[] = [
  {
    id: "recovery",
    name: "Live run · cap → Approve → continuation",
    note: "Public app, 12 Oct 2026, 15:52 IST. Caps were $0.03 and 300k tokens. Not the Northwind question: the user asked about US expansion.",
    shots: [
      shot("19-live-us-expansion-question-running-cost-cap.png", "The question running: Research Bot and CFO Bot delegated, $0.017 / 138k used of $0.03 / 300k."),
      shot("20-live-token-usage-approaching-cap.png", "Same turn at $0.024 and 254k tokens, still delegating."),
      shot("15-live-capped-turn-usage-token-cap.png", "Stopped by the token cap: 302k / 300k while cost was $0.026 / $0.03."),
      shot("21-live-cap-card-approved-continuing.png", "Cap card: \"Finishing needs about $0.05 more.\" Approved as a one-time extension."),
      shot("22-live-approved-answer-us-situation-table.png", "The finished answer, with neatlogs' $0.034 / 167k beside the estimate. It says external research returned no sourced data."),
      shot("23-live-approved-answer-recommendation-gaps.png", "Recommendation and a \"What I could not get\" section listing the missing evidence."),
      shot("16-live-approved-answer-continuation-budget.png", "Continuation usage: $0.034 of $0.05 and 167k of 454k, matching neatlogs."),
    ],
  },
  {
    id: "neatlogs",
    name: "neatlogs dashboard · the two traces of that turn",
    note: "Real dashboard screenshots. The trace links need sign-in to the neatlogs project.",
    shots: [
      shot("17-neatlogs-capped-trace-error.png", "Capped trace: web.request ERROR, Execution Failed, 14 steps, 4m 27.5s. The CFO Bot span lasted 11 ms, blocked by the cap."),
      shot("18-neatlogs-approved-continuation-trace.png", "Approved continuation: input names the capped trace and \"Decision: approved\"; 11 steps, 2m 11.3s, normal finish."),
    ],
  },
  {
    id: "neatbot",
    name: "Neat Bot · diagnose → fix → verify",
    note: "Captured after the fix. The diagnosis thread was given only the failed trace and no mention of the fix.",
    shots: [
      shot("08-neatbot-diagnosis-verdict.png", "Verdict: errored after 208.1 s with no final answer; 20 LLM calls, 323,923 tokens, $0.05896."),
      shot("09-neatbot-diagnosis-cost-breakdown.png", "Where cost and time went: calls and LLM time per agent; specialists ran one after another."),
      shot("10-neatbot-diagnosis-waste.png", "What looks wasteful: duplicated file reads, overlapping briefs, duplicate final generations."),
      shot("11-neatbot-diagnosis-ranked-fixes.png", "Ranked changes. The shared fact sheet and short briefs match the fix; cutting fan-out and concurrency were not done."),
      shot("12-neatbot-compare-before-after.png", "Before vs after: failed $0.0589567 / 323,923 tokens / 20 calls → succeeded $0.0498578 / 237,208 / 16."),
      shot("13-neatbot-compare-budget-and-failure.png", "Which agent used the most time in each run, and the failing Sales Bot span in the before run."),
      shot("14-neatbot-compare-what-changed.png", "The prompt change visible in span inputs: the CFO Bot is told not to re-read supplied figures."),
    ],
  },
  {
    id: "cfo",
    name: "cfo.ai · connect, then a CFO Bot hiring-expense plan",
    note: "12 Oct 2026, about 16:05–16:22 IST. The answer used local Lumen Labs files, not cfo.ai tools.",
    shots: [
      shot("27-cfoai-connect-banner.png", "CFO Bot before connecting, with the \"Connect your cfo.ai account\" banner."),
      shot("28-cfoai-oauth-consent.png", "cfo.ai consent page: external MCP access, step 3 of 3, WorkOS handoff."),
      shot("29-cfoai-connected.png", "Back in the app with the \"cfo.ai connected.\" toast."),
      shot("30-cfoai-hiring-expense-question.png", "The question as typed: plan the expenses for the current hiring requirement."),
      shot("31-cfoai-cfo-bot-working.png", "CFO Bot working: tool calls while it reads the company folder."),
      shot("32-cfoai-hiring-expense-answer.png", "Answer: 4 open roles, about $447k loaded annual payroll, runway 20.4 → about 18.5 months."),
      shot("33-cfoai-token-cap-approved.png", "Known issue: the token cap tripped at 349k after the answer was written, and Approve asked for about $0.38 more."),
      shot("34-cfoai-continuation-sensitivity.png", "The near-duplicate continuation: comp, 2026 cash timing and runway sensitivity."),
      shot("35-cfoai-continuation-actions.png", "End of the continuation: risks and recommended actions."),
    ],
  },
  {
    id: "northwind",
    name: "Northwind budget flow · app captures",
    note: "Isolated test server; a $0.02 cap forces the escalation.",
    shots: [
      shot("01-northwind-budget-extension-pending-desktop.png", "A $0.02-capped run offers Approve/Deny with a one-time $0.04 extension."),
      shot("02-northwind-empty-reply-reload-mobile.png", "Mobile, 390 × 844: a capped run with no reply text keeps its card after reload (the bug fixed in 6a90ff93)."),
      shot("04-northwind-incomplete-answer-desktop.png", "After Deny: the answer explains what evidence is missing."),
    ],
  },
  {
    id: "reports",
    name: "Saved evidence reports · rendered from JSON, not dashboard captures",
    shots: [
      shot("05-northwind-neatlogs-trace-results-report.png", "Six finalized neatlogs MCP trace exports: capped roots ERROR, continuations SUCCESS."),
      shot("06-northwind-before-after-benchmark-report.png", "Three-before / three-after benchmark totals."),
      shot("07-northwind-approve-deny-verification-report.png", "Approve / Deny costs, reload persistence and restored caps."),
    ],
  },
  {
    id: "entire",
    name: "Entire · CLI text captures",
    note: "There are no Entire screenshots; these are saved CLI outputs with the email and local paths redacted.",
    files: [
      { href: proofFile("24-entire-checkpoint-8887e9ba.txt"), label: "Checkpoint for the fix commit 8887e9ba (assistant turns and token usage)" },
      { href: proofFile("25-entire-checkpoints-key-commits.txt"), label: "Short explain for the six key Northwind commits" },
      { href: proofFile("26-entire-checkpoint-trailers-and-refs.txt"), label: "Commit trailers and matching checkpoint refs on origin" },
      { href: proofFile("repo-checkpoints.txt"), label: `Every commit with its date and checkpoint ID (${repoFacts.commits} commits)` },
    ],
  },
];

/** Honest limits, taken from the evidence README and the repo README. */
export const knownLimits = [
  "Northwind and Lumen Labs are fictional and use local company files. Nothing here shows a real customer credit being issued.",
  "cfo.ai: the connection works, but the captured answer made 9 local file tool calls and no cfo.ai calls. The Bot Company business plan in cfo.ai is not done yet.",
  "When the token cap trips after the answer is already written, Approve is still offered and produces a near-duplicate answer. Not fixed yet.",
  "The improvement is three runs against three: cost fell only 3.3% and total time rose about 5%. Cutting the fan-out and running specialists concurrently are future work.",
  "neatlogs recorded no tool spans, so the 29 → 10 CFO file-read count comes from app logs. The cap reason is not exposed through the neatlogs MCP, so Neat Bot blamed an empty Sales Bot delegation instead of the cap.",
  "Some generated answers contain documented calculation and date errors, and their figures were not independently checked. This is not financial advice.",
  "The public guest server runs with Crustdata disabled, so Research Bot returned no sourced market data in the live run. The answer says so.",
  "The repo and its Entire checkpoints are private. Three of the six key checkpoints record 0 tokens, and one transcript does not parse.",
  "Customer Success, Legal, HR, Marketing and Sales have no tools yet. They work only from what you tell them.",
  "Caps use our own cost estimate. Usage is checked after model steps, so the last step can overshoot the cap.",
];

export const reproduce = [
  { label: "With repo access (private), from the repo root", cmd: `git checkout ${repoFacts.ref.slice(0, 8)}` },
  { label: "First and last commit dates", cmd: `git log ${repoFacts.ref.slice(0, 8)} --reverse --format='%ad %s' --date=iso | sed -n '1p;$p'` },
  { label: "Commits per day", cmd: `git log ${repoFacts.ref.slice(0, 8)} --format=%ad --date=short | sort | uniq -c` },
  { label: "Count Entire checkpoint trailers", cmd: `git log ${repoFacts.ref.slice(0, 8)} --format=%B | grep -c '^Entire-Checkpoint:'` },
  { label: "Inspect the fix commit's checkpoint", cmd: "entire checkpoint explain 8887e9ba --short" },
  { label: "Check the TypeScript", cmd: "npm ci && npm run typecheck" },
];

export const architecture: { part: string; file: string }[] = [
  ...bots.map((b) => ({ part: b.name, file: b.file })),
  { part: "Agent registry", file: "src/mastra/index.ts" },
  { part: "Research tools (Crustdata)", file: "src/mastra/tools/crustdata.ts" },
  { part: "cfo.ai MCP tools", file: "src/mastra/tools/cfo.ts" },
  { part: "cfo.ai OAuth", file: "src/cfo/oauth.ts" },
  { part: "GitHub MCP tools", file: "src/mastra/tools/github.ts" },
  { part: "neatlogs MCP tools", file: "src/mastra/tools/neatlogs.ts" },
  { part: "Approve/Deny flow", file: "src/chat-approvals.ts" },
  { part: "Per-turn cost and token cap", file: "src/usage/turn-budget.ts" },
  { part: "Pricing", file: "src/usage/pricing.ts" },
  { part: "neatlogs cost lookup", file: "src/usage/neatlogs-usage.ts" },
  { part: "Tracing setup", file: "src/telemetry.ts" },
];
