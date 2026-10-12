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

/* ------------------------------------------------------------------ site */

export const site = {
  name: "Bot Company",
  hackathon: "neatHack 2026",
  tagline: "A company of AI agents that asks before it acts.",
  description:
    "Bot Company is a multi-agent company copilot built on Mastra. A Primary Bot delegates to specialists for research, finance, GitHub and observability. Every write waits for your approval, every turn has a cost cap, and every run is traced with neatlogs.",
  /** Public URL of this site, used for OG tags. */
  url: "https://bot-company.onrender.com" as Maybe<string>,
  repoUrl: todo("TODO: public repo link") as Maybe<string>,
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

/** Completed After 2 benchmark run; app estimate and saved neatlogs export. */
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
    { label: "CFO Bot with live cfo.ai data", start: todo("TODO: timestamp") as Maybe<number> },
  ],
};

/* ------------------------------------------------------------- partners */

export type Partner = {
  id: "neatlogs" | "entire" | "cfo";
  name: string;
  claims: string[];
  link: Maybe<string>;
  linkLabel: string;
  screenshot: Maybe<string>;
};

export const partners: Partner[] = [
  {
    id: "neatlogs",
    name: "neatlogs",
    claims: [
      "Every agent is wrapped with neatlogs/mastra: model steps, tool calls, timing, tokens and errors.",
      "Each reply shows neatlogs' own cost and tokens beside our estimate, linked to the trace.",
      "Neat Bot reads traces through the neatlogs MCP server; employees see only their own.",
    ],
    link: `${proofReport}#traces`,
    linkLabel: "Read the saved trace report",
    screenshot: `${proofBase}/05-northwind-neatlogs-trace-results-report.png`,
  },
  {
    id: "entire",
    name: "Entire",
    claims: [
      "Entire checkpoints were enabled on day one of the hackathon.",
      "Commits carry an Entire-Checkpoint trailer that links code to its coding session.",
      "A dated commit and checkpoint index is published here; source access is needed to inspect private code and sessions.",
    ],
    link: `${proofBase}/repo-checkpoints.txt`,
    linkLabel: "See checkpoints",
    screenshot: todo("TODO: /img/entire-graph.png"),
  },
  {
    id: "cfo",
    name: "cfo.ai",
    claims: [
      "Each user links their own cfo.ai account over OAuth with PKCE.",
      "CFO Bot reads live workspace data; every edit tool waits for approval.",
      "The business plan evidence will be added when its link or screenshots are supplied.",
    ],
    link: todo("TODO: cfo.ai business plan link"),
    linkLabel: "Read the business plan",
    screenshot: todo("TODO: /img/cfo-plan.png"),
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

export const repoFacts = {
  asOf: "2026-10-12",
  ref: "24b0a60d5093c948eab49a1602540a039a4aa88f",
  commits: 92,
  firstCommit: "2026-10-10",
  lastCommit: "2026-10-12",
  checkpointTrailers: 75,
};

export const bigNumbers = [
  { id: "neatlogs", value: "6" as Maybe<string>, label: "finalized traces in the saved evidence export" },
  { id: "entire", value: String(repoFacts.checkpointTrailers) as Maybe<string>, label: `commits with an Entire checkpoint (as of ${repoFacts.asOf})` },
  { id: "cfo", value: todo("TODO: cfo.ai figure, e.g. months of runway") as Maybe<string>, label: "from the cfo.ai business plan" },
];

export type Badge = "In repo" | "Public" | "Screenshots" | "Report";

export const evidence: {
  criterion: string;
  badge: Badge;
  proof: Maybe<string>;
  link: Maybe<string>;
}[] = [
  {
    criterion: "Agent improved (run before and after, with numbers)",
    badge: "Screenshots",
    proof: "Three runs before and three after: CFO file reads 29 → 10, total tokens 768,324 → 694,000, estimated cost $0.146359 → $0.141544. No latency gain.",
    link: `${proofReport}#benchmark`,
  },
  {
    criterion: "Used neatlogs (trace links or screenshots)",
    badge: "Report",
    proof: "Six finalized traces exported through neatlogs MCP, including capped runs and approved/denied continuations. Dashboard links may require project access.",
    link: `${proofReport}#traces`,
  },
  {
    criterion: "Used Entire (checkpoints or entire-graph output)",
    badge: "In repo",
    proof: `${repoFacts.checkpointTrailers} of ${repoFacts.commits} commits carry an Entire-Checkpoint trailer at snapshot ${repoFacts.ref.slice(0, 8)}. Export includes IDs; private coding sessions require access.`,
    link: `${proofBase}/repo-checkpoints.txt`,
  },
  {
    criterion: "Used cfo.ai (business plan covering pricing, costs, revenue, runway)",
    badge: "Report",
    proof: todo("TODO: business plan summary"),
    link: todo("TODO: cfo.ai business plan link"),
  },
  {
    criterion: "Agent recovers from failures (a run where an action failed, then what it did next)",
    badge: "Screenshots",
    proof: "A $0.02-capped run stopped at $0.020240. Approve resumed with a separate $0.04 budget and completed at $0.031799. Deny returned a one-step, tool-free answer marked Incomplete.",
    link: `${proofReport}#recovery`,
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
    proof: `${repoFacts.commits} commits, all dated ${repoFacts.firstCommit} to ${repoFacts.lastCommit}.`,
    link: `${proofBase}/repo-checkpoints.txt`,
  },
];

export const improvement = {
  summary: "The Primary Bot now passes sourced company facts to specialists, which read only missing evidence and return compact briefs. Six Northwind runs on fictional local company data, recorded 12 October 2026; totals below compare three runs in each group." as Maybe<string>,
  note: "CFO file reads fell 65.5% (29 → 10) and reply characters fell 74.1% (25,989 → 6,730). Completion within the default caps was 2/3 → 3/3. Total elapsed time increased from 497.2 to 522.2 seconds. This small observational sample does not establish guaranteed savings or fully correct answers; After 1's dashboard trace was unavailable.",
  link: `${proofReport}#benchmark`,
  stats: [
    { label: "Total estimated cost (3 runs)", v1: "$0.146359" as Maybe<string>, v2: "$0.141544" as Maybe<string> },
    { label: "Total tokens (3 runs)", v1: "768,324" as Maybe<string>, v2: "694,000" as Maybe<string> },
    { label: "Total model steps (3 runs)", v1: "46" as Maybe<string>, v2: "45" as Maybe<string> },
  ],
};

export const incident: { stage: string; text: Maybe<string>; link?: Maybe<string> }[] = [
  { stage: "Failure", text: "The Northwind task exceeded its $0.02 cap. A separate empty-reply case also lost its pending extension card on reload.", link: `${proofReport}#recovery` },
  { stage: "Recorded in neatlogs", text: "The capped root finalized as ERROR: $0.020240, 85,720 tokens, 6 model calls. The saved export records an Execution Failed detection.", link: traceUrl("444a39d312df7bd2220b074992c306f9") },
  { stage: "Recovery and fix", text: "Approve grants a one-time $0.04 continuation. A fallback message now preserves the pending card after reload when no assistant text exists (commit 6a90ff93).", link: `${proofBase}/northwind-cap-escalation.md` },
  { stage: "Verified", text: "Approved continuation finalized as SUCCESS at $0.031799 over 10 model calls. Deny produced one tool-free step at $0.003093. Execution passed; secondary answer errors remain documented.", link: `${proofReport}#recovery` },
];

export type Shot = { src: string; alt: string };

/** Files go in site/public/img/. */
export const galleries: { id: string; name: string; shots: Maybe<Shot[]> }[] = [
  { id: "app", name: "Actual app captures · Northwind budget flow", shots: [
    { src: `${proofBase}/01-northwind-budget-extension-pending-desktop.png`, alt: "Pending budget extension — desktop app capture" },
    { src: `${proofBase}/02-northwind-empty-reply-reload-mobile.png`, alt: "Empty reply survives reload — mobile app capture" },
    { src: `${proofBase}/04-northwind-incomplete-answer-desktop.png`, alt: "Incomplete answer after denial — desktop app capture" },
  ] },
  { id: "neatlogs", name: "Saved evidence reports · rendered from JSON, not dashboard captures", shots: [
    { src: `${proofBase}/05-northwind-neatlogs-trace-results-report.png`, alt: "Six finalized neatlogs trace exports — rendered report" },
    { src: `${proofBase}/06-northwind-before-after-benchmark-report.png`, alt: "Three-before / three-after benchmark — rendered report" },
    { src: `${proofBase}/07-northwind-approve-deny-verification-report.png`, alt: "Approve / Deny verification — rendered report" },
  ] },
  { id: "entire", name: "Entire", shots: todo("TODO: Entire screenshots") },
  { id: "cfo", name: "cfo.ai", shots: todo("TODO: cfo.ai screenshots") },
];

/** Honest limits, taken from the README. */
export const knownLimits = [
  "Northwind is fictional and uses local company files. This evidence does not establish live cfo.ai data access or a real credit being issued.",
  "Saved runs verify execution and persistence. Some answers contain documented calculation and date errors; completion does not establish full answer correctness.",
  "Deny declines the budget extension but still allows one tool-free model call, which incurs a small cost.",
  "Customer Success, Legal, HR, Marketing and Sales have no tools yet. They work only from what you tell them.",
  "CFO Bot shows formulas and assumptions, but no calculation tool verifies its maths.",
  "Caps use our own cost estimate, which is usually higher than neatlogs' figure because neatlogs counts cache hits.",
  "When a cap is hit, tools already requested by the last step still run before the turn stops.",
  "neatlogs' cost for a reply arrives a few seconds after the reply, and can take up to about 45 seconds.",
  "There are no in-place file edit tools, no command execution and no search index.",
  "The Mastra dev playground can set any request context, so it is for local use only.",
];

export const reproduce = [
  { label: "Clone and enter the repo", cmd: "git clone https://github.com/RK-625/nlhack.git && cd nlhack" },
  { label: "First and last commit dates", cmd: `git log ${repoFacts.ref} --reverse --format='%ad %s' --date=iso | sed -n '1p;$p'` },
  { label: "Commits per day", cmd: `git log ${repoFacts.ref} --format=%ad --date=short | sort | uniq -c` },
  { label: "Count Entire checkpoint trailers", cmd: `git log ${repoFacts.ref} --format=%B | grep -c '^Entire-Checkpoint:'` },
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
