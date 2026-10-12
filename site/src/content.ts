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
  tagline: "Managed bots. 🔍 Every run traced. 💸 Every turn capped.",
  description:
    "Bot Company is a multi-agent company copilot built on Mastra. A Primary Bot delegates to specialists for research, finance, GitHub and observability. Every write waits for your approval, every turn has a cost cap, and every run is traced with neatlogs.",
  /** Public URL of this site, used for OG tags. */
  url: "https://bot-company.onrender.com" as Maybe<string>,
  repoUrl: "https://github.com/RK-625/nlhack",
  credits:
    "Inspired by Grok bot. The UI was built with help from looking at Grok's UI and design.",
};

/* -------------------------------------------------------------- the team */

import type { AgentId } from "./components/avatar";

export type Bot = {
  name: string;
  role: string;
  tools: string[];
  /** Agent id; picks the same avatar the app shows (web/src/lib/agent-avatar.ts). */
  agent: AgentId;
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
    agent: "assistant",
    file: "src/mastra/agents/assistant.ts",
  },
  {
    name: "Research Bot",
    role: "Company and market research.",
    tools: ["Crustdata company search", "Crustdata enrichment", "Web search"],
    agent: "market-researcher",
    file: "src/mastra/agents/market-researcher.ts",
  },
  {
    name: "CFO Bot",
    role: "Cash flow, runway, budgets, pricing and hiring scenarios.",
    tools: ["Live cfo.ai data via your own OAuth link"],
    agent: "cfo",
    file: "src/mastra/agents/cfo.ts",
    gate: "Changes in cfo.ai need approval",
  },
  {
    name: "GitHub Bot",
    role: "Repos, issues, pull requests and Actions runs.",
    tools: ["GitHub MCP server"],
    agent: "github",
    file: "src/mastra/agents/github.ts",
    gate: "Every non-read-only tool needs approval",
  },
  {
    name: "Neat Bot",
    role: "Reads the traces of the other agents: failures, latency, tokens, detections, triage.",
    tools: ["neatlogs MCP server"],
    agent: "neatlogs",
    file: "src/mastra/agents/neatlogs.ts",
    gate: "Employees only see their own traces",
  },
  {
    name: "Customer Success Bot",
    role: "Onboarding, churn risk and renewals.",
    tools: [],
    agent: "customer-success",
    file: "src/mastra/agents/customer-success.ts",
  },
  {
    name: "Legal Bot",
    role: "Contract and compliance checklists, policy drafts.",
    tools: [],
    agent: "legal",
    file: "src/mastra/agents/legal.ts",
  },
  {
    name: "HR Bot",
    role: "Hiring, performance and compensation framing.",
    tools: [],
    agent: "hr",
    file: "src/mastra/agents/hr.ts",
  },
  {
    name: "Marketing Bot",
    role: "Positioning, campaigns and SEO briefs.",
    tools: [],
    agent: "marketing",
    file: "src/mastra/agents/marketing.ts",
  },
  {
    name: "Sales Bot",
    role: "ICP, outreach and deal strategy.",
    tools: [],
    agent: "sales",
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

/**
 * Illustration of the app's tool-approval card (web/src/shell/MessageBubble.tsx, ApprovalCard).
 * Layout and wording follow the app; the tool and arguments are an example, not a real run.
 */
export const approvalExample = {
  agent: "GitHub Bot",
  label: "Create issue",
  toolName: "create_issue",
  input: { owner: "your-org", repo: "your-repo", title: "Track competitor pricing changes" },
};

/** Default per-message caps for each bot (src/usage/caps.ts, DEFAULT_CAPS). */
export const caps = {
  costCapUsd: 0.25,
  tokenCap: 300_000,
};

export type UsageBarView = { label: string; text: string; fraction: number; level: "normal" | "warn" | "capped" };

/**
 * Two real states of the app's usage popover under the bot name, copied from captures 15 and 16
 * of the live run on 12 Oct 2026 (trace bbb32395… capped, then 3c670bab… approved continuation).
 */
export const usageSnapshots: {
  id: string;
  tab: string;
  bars: [UsageBarView, UsageBarView];
  neatlogs: { est?: string; text: string; traceId: string };
  footer: string;
  capture: string;
}[] = [
  {
    id: "capped",
    tab: "Capped turn",
    bars: [
      { label: "Cost", text: "$0.026 / $0.03", fraction: 0.026 / 0.03, level: "warn" },
      { label: "Tokens", text: "302k / 300k", fraction: 1, level: "capped" },
    ],
    neatlogs: { text: "Neatlogs: not available yet", traceId: "bbb3239517e0bcbe0ff9eed8e9309a5d" },
    footer: "Latest turn (estimated), per-message limits for this bot.",
    capture: "15-live-capped-turn-usage-token-cap.png",
  },
  {
    id: "continued",
    tab: "After Approve",
    bars: [
      { label: "Cost", text: "$0.034 / $0.05", fraction: 0.034 / 0.05, level: "normal" },
      { label: "Tokens", text: "167k / 454k", fraction: 167 / 454, level: "normal" },
    ],
    neatlogs: { est: "Est. $0.034 · 167k", text: "Neatlogs $0.034 · 167k tokens", traceId: "3c670bab3ed85e64a42acdc15513ca20" },
    footer: "Latest turn (estimated), one-time continuation budget.",
    capture: "16-live-approved-answer-continuation-budget.png",
  },
];

/** The cap card text exactly as captured in 21 (live run, token cap). */
export const capCardExample = {
  title: "This reply hit its 300k token limit after 302k. Finishing needs about $0.05 more.",
  pending:
    "Approve to finish this reply with a one-time extension; your limit stays as it is. Deny to get the best answer from what was gathered. Or raise the limit from the bot name ▾.",
  approved: "Approved: one-time extension granted.",
  denied: "Denied: no budget extension granted.",
  capture: "21-live-cap-card-approved-continuing.png",
};

/* ------------------------------------------------------------------ demo */

export const demo = {
  /** Local launch film. A YouTube id can replace this later. */
  src: "/video/launch.mp4",
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
    link: "/judges/#neatlogs",
    linkLabel: "See the dashboard captures",
    screenshot: proofFile("17-neatlogs-capped-trace-error.png"),
    caption: "Real dashboard, 12 Oct 2026: the capped turn ends with error after 14 steps, 4m 27.5s.",
  },
  {
    id: "entire",
    name: "Entire",
    claims: [
      "Entire was enabled on day one; git hooks add an Entire-Checkpoint trailer to commits made in a recorded coding session.",
      `84 of 101 commits carry a trailer (as of 2026-10-12). 79 Entire refs are pushed to the repository.`,
      "Checkpoint 01M4QMYG… for the fix commit 8887e9ba records the agent (Codex), the one file changed and its verification of the benchmark.",
    ],
    link: `${site.repoUrl}/commit/8887e9ba75daabceb339b35193ccd7c66c518ec1`,
    linkLabel: "View the fix and checkpoint trailer on GitHub",
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
    caption: "Saved CLI output (email redacted). The source and commit trailers are also available on GitHub.",
  },
  {
    id: "cfo",
    name: "cfo.ai",
    claims: [
      "Each user links their own cfo.ai account over OAuth with PKCE; the WorkOS consent step completes end to end in the app.",
      "CFO Bot can read live cfo.ai workspace data; every edit tool waits for approval.",
      "The captured hiring-expense answer used local company files (9 file tool calls, no cfo.ai tool calls), so it does not show live cfo.ai data.",
      "A later turn wrote the Lumen Labs 12-month plan into cfo.ai: named cfo_edit_pages and cfo_edit_scenarios calls, an approval before the text write, and the page open in cfo.ai (Lumen Labs – 12-Month Business Plan#140).",
    ],
    link: "/judges/#cfo",
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

export type Post = {
  date: string;
  when: string;
  stamp: string;
  title: string;
  text: string;
  url: string;
  image?: string;
  video?: string;
};

/** Posts from @rk625dev during the hackathon. Tags used: #neatlogs, #neathacks, and #neathack. Times are IST. */
export const posts: Post[] = [
  {
    date: "2026-10-10",
    when: "Sat Oct 10, 4:11 PM",
    stamp: "4:11 PM · Oct 10, 2026",
    title: "Locked the stack with neatlogs and Entire",
    text: "setting up #neatlogs @neatlogs @EntireHQ\nlocked the stack for the project",
    url: "https://x.com/rk625dev/status/2108870591029850518",
    image: "/posts/01-stack.jpg",
  },
  {
    date: "2026-10-11",
    when: "Sun Oct 11, 4:01 AM",
    stamp: "4:01 AM · Oct 11, 2026",
    title: "Cooking with neatlogs",
    text: "@neatlogs #neatlogs cooking here",
    url: "https://x.com/rk625dev/status/2109049238357426319",
    image: "/posts/02-cooking.jpg",
  },
  {
    date: "2026-10-12",
    when: "Mon Oct 12, 3:02 AM",
    stamp: "3:02 AM · Oct 12, 2026",
    title: "An agent team for startups, plus Neat Bot",
    text: "@neatlogs #neathacks @simranrambles\ninspired from grok bot building a complete agent team for startups with all the integrations and a separate bot (NeatBot) the can see the other bots traces and help u plan and access the user cost here. more to add yet",
    url: "https://x.com/rk625dev/status/2109396835257467109",
    image: "/posts/03-team.jpg",
  },
  {
    date: "2026-10-12",
    when: "Mon Oct 12, 6:54 PM",
    stamp: "6:54 PM · Oct 12, 2026",
    title: "Gearing up for the submission: Bot Company",
    text: "#neatlogs #neathack @neatlogs @EntireHQ @simranrambles\nGearing up for the submission\nProject name Bot Company\ninspired from grokbot",
    url: "https://x.com/rk625dev/status/2109636285593993557",
    video: "/video/launch.mp4",
  },
];

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

export type Shot = { src: string; thumb: string; alt: string };
const shot = (file: string, alt: string): Shot => ({ src: proofFile(file), thumb: proofThumb(file), alt });

/** One judging criterion = one section on /judges/, with its screenshots shown inline. */
export type Criterion = {
  id: string;
  /** Short label for the jump links. */
  short: string;
  criterion: string;
  badge: Badge;
  proof: Maybe<string>;
  shots?: Shot[];
  links?: { href: Maybe<string>; label: string }[];
};

export const evidence: Criterion[] = [
  {
    id: "improved",
    short: "Agent improved",
    criterion: "Agent improved (run before and after, with numbers)",
    badge: "Screenshots",
    proof: "We asked the agent whether fictional Lumen Labs should offer Northwind a renewal credit, and what that would mean for cash runway. One run hit its token limit without a final answer. We inspected the trace, changed how agents share company facts, and repeated the same question.",
    shots: [
      shot("12-neatbot-compare-before-after.png", "Neat Bot compares the two traces: failed $0.0589567 / 323,923 tokens / 20 calls → succeeded $0.0498578 / 237,208 / 16."),
      shot("14-neatbot-compare-what-changed.png", "What changed, as seen in span inputs: the CFO Bot is told not to re-read figures already in its brief."),
      shot("06-northwind-before-after-benchmark-report.png", "Report rendered from the saved benchmark JSON (not a dashboard capture): three runs before, three after."),
    ],
    links: [
      { href: `${site.repoUrl}/commit/8887e9ba75daabceb339b35193ccd7c66c518ec1`, label: "Prompt fix on GitHub" },
      { href: `${proofReport}#benchmark`, label: "Benchmark report" },
      { href: proofFile("northwind-benchmark.json"), label: "Raw benchmark JSON" },
    ],
  },
  {
    id: "neatlogs",
    short: "neatlogs",
    criterion: "Used neatlogs (trace links or screenshots)",
    badge: "Screenshots",
    proof: "Real dashboard captures of a live turn: the capped trace bbb32395… ends in ERROR (\"Execution Failed\", 14 steps); its approved continuation 3c670bab… finishes normally (11 steps). Neat Bot reads traces through the neatlogs MCP; six more traces were exported that way. Trace links need project sign-in, so screenshots stand in.",
    shots: [
      shot("17-neatlogs-capped-trace-error.png", "Capped trace: web.request ERROR, Execution Failed, 14 steps, 4m 27.5s. The CFO Bot span lasted 11 ms, blocked by the cap."),
      shot("18-neatlogs-approved-continuation-trace.png", "Approved continuation: its input names the capped trace and \"Decision: approved\"; 11 steps, 2m 11.3s, normal finish."),
      shot("08-neatbot-diagnosis-verdict.png", "Neat Bot, given only the failed Northwind trace: errored after 208.1 s with no final answer; 20 LLM calls, $0.05896."),
      shot("11-neatbot-diagnosis-ranked-fixes.png", "Neat Bot's ranked changes. The shared fact sheet and short briefs match the fix; cutting fan-out and concurrency were not done."),
    ],
    links: [
      { href: traceUrl("bbb3239517e0bcbe0ff9eed8e9309a5d"), label: "Capped trace (sign-in)" },
      { href: traceUrl("3c670bab3ed85e64a42acdc15513ca20"), label: "Continuation trace (sign-in)" },
      { href: `${proofReport}#traces`, label: "Six exported traces" },
    ],
  },
  {
    id: "entire",
    short: "Entire",
    criterion: "Used Entire (checkpoints or entire-graph output)",
    badge: "In repo",
    proof: `${repoFacts.checkpointTrailers} of ${repoFacts.commits} commits carry an Entire-Checkpoint trailer; ${repoFacts.checkpointRefs} Entire refs are pushed to the repository. The fix commit 8887e9ba maps to checkpoint 01M4QMYG…: Codex session, 6041.7k tokens, 45 API calls, one file changed. Inspect the commit on GitHub or read the saved CLI output below (email redacted).`,
    links: [
      { href: `${site.repoUrl}/commit/8887e9ba75daabceb339b35193ccd7c66c518ec1`, label: "Commit and checkpoint trailer" },
      { href: proofFile("24-entire-checkpoint-8887e9ba.txt"), label: "8887e9ba checkpoint" },
      { href: proofFile("25-entire-checkpoints-key-commits.txt"), label: "Six key checkpoints" },
      { href: proofFile("26-entire-checkpoint-trailers-and-refs.txt"), label: "Trailers and refs" },
    ],
  },
  {
    id: "cfo",
    short: "cfo.ai",
    criterion: "Used cfo.ai (business plan covering pricing, costs, revenue, runway)",
    badge: "Screenshots",
    proof: "The user asked CFO Bot directly, and CFO Bot created Lumen Labs – 12-Month Business Plan#140 in cfo.ai. The chat shows Cfo edit pages, two Cfo edit scenarios calls, Cfo inspect documentation, and another Cfo edit pages call (Done · 5 tools · 6m 26s). Adding the plan text paused on Approve for cfo_edit_pages. The page is open in cfo.ai with pricing, costs, and runway sections, under Main Scenario. The three requested scenario names are not visible in that shot. An earlier hiring-expense answer used local fictional Lumen Labs files (9 file tool calls, no cfo.ai tool calls): 4 open roles, about $447k loaded annual payroll, burn $295,061 → about $326k a month, runway 20.4 → about 18.5 months. The per-user cfo.ai OAuth connection completes end to end.",
    shots: [
      shot("27-cfoai-connect-banner.png", "CFO Bot before connecting, with the \"Connect your cfo.ai account\" banner."),
      shot("28-cfoai-oauth-consent.png", "cfo.ai consent page: external MCP access, step 3 of 3, WorkOS handoff."),
      shot("29-cfoai-connected.png", "Back in the app with the \"cfo.ai connected.\" toast."),
      shot("32-cfoai-hiring-expense-answer.png", "The hiring-expense answer: 4 open roles, about $447k loaded annual payroll, runway 20.4 → about 18.5 months."),
      shot("36-cfoai-business-plan-tools.png", "Named cfo.ai tools finished, and the bot reports page Lumen Labs – 12-Month Business Plan#140."),
      shot("37-cfoai-business-plan-approval.png", "Approve card for cfo_edit_pages before the plan text is written to that page."),
      shot("38-cfoai-business-plan-page.png", "The same page open in cfo.ai, with the plan's starting position and pricing sections."),
    ],
  },
  {
    id: "recovery",
    short: "Recovery",
    criterion: "Agent recovers from failures (a run where an action failed, then what it did next)",
    badge: "Screenshots",
    proof: "Live turn on the public app: it hit the 300k token cap at 302k ($0.026 of $0.03). The card offered a one-time extension; after Approve the continuation finished within its $0.05 / 454k budget, using $0.034 and 167k tokens. In the Northwind check, Approve finished at $0.031799 and Deny returned a tool-free answer marked Incomplete.",
    shots: [
      shot("15-live-capped-turn-usage-token-cap.png", "Stopped by the token cap: 302k / 300k while cost was $0.026 / $0.03."),
      shot("21-live-cap-card-approved-continuing.png", "Cap card: \"Finishing needs about $0.05 more.\" Approved as a one-time extension; the Primary Bot thinks again."),
      shot("16-live-approved-answer-continuation-budget.png", "Continuation finished: $0.034 of $0.05 and 167k of 454k; neatlogs reads the same $0.034 / 167k."),
      shot("07-northwind-approve-deny-verification-report.png", "Report rendered from saved JSON (not a dashboard capture): Northwind Approve and Deny costs, reload persistence, restored caps."),
    ],
    links: [{ href: `${proofReport}#recovery`, label: "Recovery report" }],
  },
  {
    id: "public",
    short: "Built in public",
    criterion: "Built in public (posts tagged #neatHack)",
    badge: "Public",
    proof: "Four posts on X from @rk625dev on 10–12 October 2026. The tags on the posts are #neatlogs, #neathacks, and #neathack. They lock the stack with neatlogs and Entire, show the work in progress, describe the startup agent team with Neat Bot, and name the submission Bot Company.",
    links: posts.map((post) => ({ href: post.url, label: post.title })),
  },
  {
    id: "commits",
    short: "Dated commits",
    criterion: "Code written during the hackathon (dated commits)",
    badge: "In repo",
    proof: `${repoFacts.commits} commits at the recorded snapshot, all dated ${repoFacts.firstCommit} to ${repoFacts.lastCommit}. The first commit is the README with the hackathon problem statement. Browse the public GitHub history or read the saved commit list with dates and checkpoint IDs.`,
    links: [
      { href: `${site.repoUrl}/commits/${repoFacts.ref}`, label: "Commit history on GitHub" },
      { href: proofFile("repo-checkpoints.txt"), label: "Saved commit list with dates" },
    ],
  },
];

/** Commits per day at the snapshot (git log --format=%ad --date=short | sort | uniq -c). */
export const commitsPerDay = [
  { date: "2026-10-10", commits: 17 },
  { date: "2026-10-11", commits: 45 },
  { date: "2026-10-12", commits: 39 },
];

/** Excerpts of the saved Entire CLI captures 24-26, unedited apart from line selection. */
export const entireTerminal = [
  "$ git log -1 --format=\"%h %s\" 8887e9ba   # trailer",
  "8887e9ba fix(agents): reuse company facts in delegated briefs",
  "    Entire-Checkpoint: 01M4QMYG0STA2ZQR90286XF297",
  "",
  "$ entire checkpoint explain --short 01M4QMYG0STA2ZQR90286XF297",
  "● Checkpoint 01M4QMYG0STA2ZQR90286XF297",
  "  session  01a12f3f-fde6-75e2-b63f-23c8f91f7b07",
  "  created  2026-10-12 08:51:30",
  "  tokens   6041.7k",
  "  commits  8887e9b fix(agents): reuse company facts in delegated briefs",
  "",
  "$ entire checkpoint tokens 01M4QMYG0STA2ZQR90286XF297",
  "Agent:      Codex",
  "Model:      gpt-6.1-sol",
  "Total:  6041.7k tokens",
  "  Input: 226.3k | Cache read: 5796.6k | Cache write: 0 | Output: 18.8k | API calls: 45",
  "",
  "$ git ls-remote origin refs/entire/checkpoints/97/01M4QMYG0STA2ZQR90286XF297",
  "3defdd1fc4 refs/entire/checkpoints/97/01M4QMYG0STA2ZQR90286XF297",
  "total refs/entire/* on origin:       79",
].join("\n");

export const improvement = {
  summary: "The fix (commit 8887e9ba) makes the Primary Bot pass the figures and file paths it has already read, so specialists stop re-reading them and reply with a compact brief. Six Northwind runs on fictional local company data, recorded 12 October 2026: three before, three after." as Maybe<string>,
  story: [
    { title: "Before: the run stopped without an answer", text: "The agent used 323,923 tokens, exceeding its 300,000-token limit. Its trace ended in ERROR after 20 model calls, at a cost of $0.0590. Neat Bot's trace review highlighted repeated file reads and large prompts." },
    { title: "The fix: share facts instead of reading them again", text: "In commit 8887e9ba, the Primary Bot passes the figures and file paths it has already read to each specialist. Specialists read only missing information and return a short brief." },
    { title: "After: the same question finished within the limit", text: "The matching after run succeeded with 237,208 tokens and 16 model calls, at a cost of $0.0499. That single trace pair used 26.8% fewer tokens and cost 15.4% less." },
  ],
  note: "The cards show totals across three runs before and three after, separate from the single trace pair above. All three after runs finished within their caps; two of three before runs did. Total estimated cost fell 3.3%, but total time rose from 497.2 to 522.2 seconds. CFO replies were 74.1% shorter (25,989 → 6,730 characters). File-read counts come from app logs; neatlogs recorded no tool spans. This six-run sample does not establish general savings or a speed improvement.",
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

/** Honest limits, taken from the evidence README and the repo README. */
export const knownLimits = [
  "Northwind and Lumen Labs are fictional and use local company files. Nothing here shows a real customer credit being issued.",
  "CFO Bot created Lumen Labs – 12-Month Business Plan#140 in cfo.ai. The text write paused on Approve for cfo_edit_pages, and the page is open with pricing, costs, and runway. The earlier hiring-expense answer used local Lumen Labs files only. The page is under Main Scenario; the three requested scenario names are not visible in that shot.",
  "When the token cap trips after the answer is already written, Approve is still offered and produces a near-duplicate answer. Not fixed yet.",
  "The improvement is three runs against three: cost fell only 3.3% and total time rose about 5%. Cutting the fan-out and running specialists concurrently are future work.",
  "neatlogs recorded no tool spans, so the 29 → 10 CFO file-read count comes from app logs. The cap reason is not exposed through the neatlogs MCP, so Neat Bot blamed an empty Sales Bot delegation instead of the cap.",
  "Some generated answers contain documented calculation and date errors, and their figures were not independently checked. This is not financial advice.",
  "The public guest server runs with Crustdata disabled, so Research Bot returned no sourced market data in the live run. The answer says so.",
  "Three of the six key Entire checkpoints record 0 tokens, and one transcript does not parse.",
  "Customer Success, Legal, HR, Marketing and Sales have no tools yet. They work only from what you tell them.",
  "Caps use our own cost estimate. Usage is checked after model steps, so the last step can overshoot the cap.",
];

export const reproduce = [
  { label: "Clone the public repository", cmd: `git clone ${site.repoUrl}.git\ncd nlhack` },
  { label: "Check out the recorded snapshot", cmd: `git checkout ${repoFacts.ref.slice(0, 8)}` },
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
