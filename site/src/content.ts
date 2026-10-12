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

/* ------------------------------------------------------------------ site */

export const site = {
  name: "Bot Company",
  hackathon: "neatHack 2026",
  tagline: "A company of AI agents that asks before it acts.",
  description:
    "Bot Company is a multi-agent company copilot built on Mastra. A Primary Bot delegates to specialists for research, finance, GitHub and observability. Every write waits for your approval, every turn has a cost cap, and every run is traced with neatlogs.",
  /** Public URL of this site, used for OG tags. */
  url: todo("TODO: public site URL") as Maybe<string>,
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

/** Turn receipt. Values come from the example in the repo README. */
export const receiptExample = {
  estCostUsd: 0.0022 as Maybe<number>,
  estTokens: "7.3k" as Maybe<string>,
  steps: todo("TODO: steps for a real turn") as Maybe<number>,
  neatlogsCostUsd: 0.0001 as Maybe<number>,
  neatlogsTokens: "7.3k" as Maybe<string>,
  traceUrl: todo("TODO: neatlogs trace link") as Maybe<string>,
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
    link: todo("TODO: neatlogs trace link"),
    linkLabel: "Open a trace",
    screenshot: todo("TODO: /img/neatlogs-trace.png"),
  },
  {
    id: "entire",
    name: "Entire",
    claims: [
      "Entire checkpoints were enabled on day one of the hackathon.",
      "Commits carry an Entire-Checkpoint trailer that links code to its coding session.",
      "Anyone can count the trailers with one git command.",
    ],
    link: todo("TODO: Entire checkpoints link"),
    linkLabel: "See checkpoints",
    screenshot: todo("TODO: /img/entire-graph.png"),
  },
  {
    id: "cfo",
    name: "cfo.ai",
    claims: [
      "Each user links their own cfo.ai account over OAuth with PKCE.",
      "CFO Bot reads live workspace data; every edit tool waits for approval.",
      "We also used cfo.ai to build Bot Company's own business plan.",
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
  commits: 81,
  firstCommit: "2026-10-10",
  lastCommit: "2026-10-12",
  checkpointTrailers: 64,
};

export const bigNumbers = [
  { id: "neatlogs", value: todo("TODO: number of traced runs") as Maybe<string>, label: "runs traced in neatlogs" },
  { id: "entire", value: String(repoFacts.checkpointTrailers) as Maybe<string>, label: `commits with an Entire checkpoint (as of ${repoFacts.asOf})` },
  { id: "cfo", value: todo("TODO: cfo.ai figure, e.g. months of runway") as Maybe<string>, label: "from the cfo.ai business plan" },
];

export type Badge = "In repo" | "Public" | "Screenshots";

export const evidence: {
  criterion: string;
  badge: Badge;
  proof: Maybe<string>;
  link: Maybe<string>;
}[] = [
  {
    criterion: "Agent improved (run before and after, with numbers)",
    badge: "Screenshots",
    proof: todo("TODO: before/after run summary"),
    link: todo("TODO: before/after traces"),
  },
  {
    criterion: "Used neatlogs (trace links or screenshots)",
    badge: "Public",
    proof: "All ten agents are traced; each reply links to its own neatlogs trace.",
    link: todo("TODO: neatlogs trace link"),
  },
  {
    criterion: "Used Entire (checkpoints or entire-graph output)",
    badge: "In repo",
    proof: `${repoFacts.checkpointTrailers} of ${repoFacts.commits} commits carry an Entire-Checkpoint trailer (as of ${repoFacts.asOf}).`,
    link: todo("TODO: public repo link"),
  },
  {
    criterion: "Used cfo.ai (business plan covering pricing, costs, revenue, runway)",
    badge: "Public",
    proof: todo("TODO: business plan summary"),
    link: todo("TODO: cfo.ai business plan link"),
  },
  {
    criterion: "Agent recovers from failures (a run where an action failed, then what it did next)",
    badge: "Screenshots",
    proof: todo("TODO: failure and recovery run"),
    link: todo("TODO: trace of the failed run"),
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
    link: todo("TODO: public repo link"),
  },
];

export const improvement = {
  summary: todo("TODO: what changed between v1 and v2") as Maybe<string>,
  stats: [
    { label: "Cost per turn", v1: todo("TODO") as Maybe<string>, v2: todo("TODO") as Maybe<string> },
    { label: "Tokens per turn", v1: todo("TODO") as Maybe<string>, v2: todo("TODO") as Maybe<string> },
    { label: "Steps per turn", v1: todo("TODO") as Maybe<string>, v2: todo("TODO") as Maybe<string> },
  ],
};

export const incident: { stage: string; text: Maybe<string>; link?: Maybe<string> }[] = [
  { stage: "Failure", text: todo("TODO: what failed") },
  { stage: "Detected in neatlogs", text: todo("TODO: how it showed up"), link: todo("TODO: trace link") },
  { stage: "Fix", text: todo("TODO: the fix"), link: todo("TODO: commit link") },
  { stage: "Verified", text: todo("TODO: the verifying run"), link: todo("TODO: trace link") },
];

export type Shot = { src: string; alt: string };

/** Files go in site/public/img/. */
export const galleries: { id: string; name: string; shots: Maybe<Shot[]> }[] = [
  { id: "neatlogs", name: "neatlogs", shots: todo("TODO: neatlogs screenshots") },
  { id: "entire", name: "Entire", shots: todo("TODO: Entire screenshots") },
  { id: "cfo", name: "cfo.ai", shots: todo("TODO: cfo.ai screenshots") },
];

/** Honest limits, taken from the README. */
export const knownLimits = [
  "Customer Success, Legal, HR, Marketing and Sales have no tools yet. They work only from what you tell them.",
  "CFO Bot shows formulas and assumptions, but no calculation tool verifies its maths.",
  "Caps use our own cost estimate, which is usually higher than neatlogs' figure because neatlogs counts cache hits.",
  "When a cap is hit, tools already requested by the last step still run before the turn stops.",
  "neatlogs' cost for a reply arrives a few seconds after the reply, and can take up to about 45 seconds.",
  "There are no in-place file edit tools, no command execution and no search index.",
  "The Mastra dev playground can set any request context, so it is for local use only.",
];

export const reproduce = [
  { label: "Clone and enter the repo", cmd: "git clone <repo-url> && cd nlhack" },
  { label: "First and last commit dates", cmd: "git log --reverse --format='%ad %s' --date=iso | sed -n '1p;$p'" },
  { label: "Commits per day", cmd: "git log --format=%ad --date=short | sort | uniq -c" },
  { label: "Count Entire checkpoint trailers", cmd: "git log --format=%B | grep -c '^Entire-Checkpoint:'" },
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
