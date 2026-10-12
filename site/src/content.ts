/**
 * Every fact, link and number on the site lives here.
 *
 * Unknown values are `todo("...")` placeholders. They render as a muted
 * "Coming soon" pill, never as made-up data. Replace each `todo(...)` with
 * the real value (a string, number, URL or list) when you have it.
 * Search this file for `todo(` to find everything left to fill.
 */

import { captureSizes } from "./capture-sizes";

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
  tagline: "Bot Company is a workspace with managed AI agents. 🔍 Every run traced. 💸 Every turn capped.",
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
  src: "/video/launch.mp4?v=20261012-160s",
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
      "The latest disconnected baseline saved a local Markdown plan and explicitly reported no live cfo.ai connection. Compare the captured workflows on the judges page; this is not a financial accuracy benchmark.",
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
    video: "/video/launch.mp4?v=20261012-160s",
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

export type Shot = { src: string; thumb: string; alt: string; width: number; height: number };
const shot = (file: string, alt: string): Shot => ({ src: proofFile(file), thumb: proofThumb(file), alt, ...captureSizes[file]! });

/** One judging criterion = one section on /judges/, with its screenshots shown inline. */
export type Criterion = {
  id: string;
  /** Short label for the jump links. */
  short: string;
  criterion: string;
  badge: Badge;
  proof: Maybe<string>;
  steps?: ProcessStep[];
  shots?: Shot[];
  links?: { href: Maybe<string>; label: string }[];
};

export type ProcessStep = {
  status: "failed" | "passed" | "changed" | "recorded" | "check";
  title: string;
  text: string;
};

export const executionRuns = [
  {
    name: "GitHub Bot", cost: "$0.012", tokens: "~98k", duration: "19.5s", spans: "4 LLM spans · 8 displayed steps",
    summary: "Checks assignment before answering", detail: "The answer reports six issues, then explains that assignee filtering removed authored-only matches. It uses recent updates as the time window and leaves PR attribution unverified.",
    shots: [shot("48-github-assignment-answer.png", "GitHub Bot returns six issues and explains its assignee check, updated-date window and attribution limits."), shot("54-github-usage.png", "GitHub app usage: estimated $0.012 / 98k tokens matches the rounded neatlogs values shown beside it; caps are $0.25 / 300k."), shot("55-github-neatlogs-completed.png", "GitHub neatlogs dashboard: Request completed, 19.5s, eight displayed steps and four LLM spans; output matches the captured answer.")],
  },
  {
    name: "Research Bot", cost: "$0.0063", tokens: "~36k", duration: "55.0s", spans: "4 LLM spans · 8 displayed steps",
    summary: "Refines weak results before answering", detail: "Named Crustdata searches return weak initial matches. The bot narrows its search, enriches profiles and returns a cited answer with limits on dates and ranking methodology. The captured market claims are not independently verified.",
    shots: [shot("49-research-crustdata-start.png", "Research begins with named Crustdata company search and web search tools."), shot("50-research-refined-search.png", "The bot reports irrelevant initial matches and switches to targeted search, profile enrichment and web coverage."), shot("51-research-company-answer.png", "Research returns a company-focused answer with citations. Numerical market claims are captured output, not independently verified."), shot("52-research-sources-limits.png", "The answer states research scope, source limitations and point-in-time data caveats."), shot("53-research-usage.png", "Research app usage: estimated $0.0063 / 36k tokens matches the rounded neatlogs values shown beside it; caps are $0.25 / 300k."), shot("56-research-neatlogs-completed.png", "Research neatlogs dashboard: Request completed, 55.0s, eight displayed steps and four LLM spans; the final answer is visible.")],
  },
];

export const evidence: Criterion[] = [
  {
    id: "improved",
    short: "Agent cost reduction",
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
    short: "Trace diagnosis",
    criterion: "Used neatlogs (trace links or screenshots)",
    badge: "Screenshots",
    proof: "When a run stops, neatlogs lets us look inside it. We captured the stopped run and its continuation, then asked Neat Bot to investigate a separate Northwind failure.",
    steps: [
      { status: "failed", title: "The dashboard shows where the live run stopped", text: `Trace [bbb32395…](${traceUrl("bbb3239517e0bcbe0ff9eed8e9309a5d")}) ended in **ERROR** after **14 steps**. The dashboard reports Execution Failed. The CFO Bot was blocked by the cap.` },
      { status: "passed", title: "The approved continuation has its own trace", text: `Trace [3c670bab…](${traceUrl("3c670bab3ed85e64a42acdc15513ca20")}) names the earlier run and the approval decision. It finished normally in **11 steps**, so we can follow __the stopped run and its continuation__ separately.` },
      { status: "recorded", title: "Neat Bot helped us investigate the Northwind failure", text: "Given the failed Northwind trace, Neat Bot highlighted repeated reads and large prompts, then suggested changes. We exported **six traces** through the neatlogs MCP. The trace links require project sign-in; the screenshots below can be viewed directly." },
    ],
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
    short: "Coding checkpoints",
    criterion: "Used Entire (checkpoints or entire-graph output)",
    badge: "In repo",
    proof: "Entire connects the code change to the coding session that produced it. For the Northwind fix, you can inspect both the public commit and its saved checkpoint output.",
    steps: [
      { status: "recorded", title: "Start with the change that reduced repeated reads", text: "Commit **8887e9ba** changes one file: src/mastra/prompts/index.ts. Its trailer points to checkpoint **01M4QMYG0STA2ZQR90286XF297**." },
      { status: "passed", title: "The checkpoint records the coding session", text: "The saved CLI output identifies Codex, **45 API calls**, **6041.7k tokens**, and the one changed file. Email addresses are redacted in the published text." },
      { status: "recorded", title: "Check the wider commit trail", text: `At the recorded snapshot, **${repoFacts.checkpointTrailers} of ${repoFacts.commits} commits** have checkpoint trailers and **${repoFacts.checkpointRefs} checkpoint refs** were pushed. These are __snapshot counts__, not today's repository totals.` },
    ],
    links: [
      { href: `${site.repoUrl}/commit/8887e9ba75daabceb339b35193ccd7c66c518ec1`, label: "Commit and checkpoint trailer" },
      { href: proofFile("24-entire-checkpoint-8887e9ba.txt"), label: "8887e9ba checkpoint" },
      { href: proofFile("25-entire-checkpoints-key-commits.txt"), label: "Six key checkpoints" },
      { href: proofFile("26-entire-checkpoint-trailers-and-refs.txt"), label: "Trailers and refs" },
    ],
  },
  {
    id: "execution", short: "Execution and usage", criterion: "Specialist task completion with visible cost, tokens and traces", badge: "Screenshots",
    proof: "Two direct specialist runs show how the bots check or refine their work, return answers and expose per-turn usage. Original app captures are paired with neatlogs dashboard captures. These are examples of observable execution, separate from the Northwind improvement benchmark.",
    steps: [
      { status: "passed", title: "Answers returned; requests completed", text: "GitHub Bot checks the **assignee filter** before returning its issue list. Research Bot **refines irrelevant search results** before returning a cited answer. Both supplied dashboards show **Request completed** and the final output." },
      { status: "recorded", title: "Usage visible in the app and dashboard", text: "The app shows **$0.012 / ~98k tokens** for GitHub and **$0.0063 / ~36k tokens** for Research. Rounded app estimates and neatlogs values agree in each popover. Both are below the displayed **$0.25 / 300k** per-message caps. Dashboard durations are **19.5s** and **55.0s**; tool-group durations are not end-to-end run times." },
      { status: "check", title: "What these two runs establish", text: "These captures show completion, visible checking/refinement and usage accounting, not a general reliability rate or proof that every answer claim is correct. Eight dashboard steps are **not eight tool calls**. The two supplied trace links require project access; their individual mapping to these screenshot runs was not independently verified." },
    ],
    links: [{ href: traceUrl("87076f45034abc2541cc7c93b381052d"), label: "Supplied trace 87076f45…" }, { href: traceUrl("16f68f56484261784e446ec67d793d19"), label: "Supplied trace 16f68f56…" }, { href: `${proofBase}/README.md`, label: "Capture provenance and measurement notes" }],
  },
  {
    id: "cfo",
    short: "cfo.ai business plan",
    criterion: "Used cfo.ai (business plan covering pricing, costs, revenue, runway)",
    badge: "Screenshots",
    proof: "Two captured workflows for fictional Lumen Labs: a fresh plan saved to the company workspace without cfo.ai, and an earlier connected MCP run that wrote a page in cfo.ai after approval. This compares source access and where work is saved.",
    steps: [
      { status: "recorded", title: "Without cfo.ai: build a plan from company files", text: "In the latest run, the user reports deleting the earlier draft before asking again. The captures show **20 tools · 1m 27s**, then **1 tool · 19s**, and a plan saved to **lumen-labs-12-month-plan.md**. The answer explicitly says __live cfo.ai data is not connected__. The groups are collapsed, so these screenshots do not independently identify every tool." },
      { status: "passed", title: "Connect a cfo.ai account", text: "The OAuth consent flow returns to the app with **cfo.ai connected**. Each user connects their own account." },
      { status: "changed", title: "Approve the plan text before it is written", text: "CFO Bot's activity lists **five tool calls** over **6m 26s**, including page edits, scenario edits, and documentation inspection. The **cfo_edit_pages** call that adds the plan text __pauses for approval__." },
      { status: "passed", title: "Open the plan in cfo.ai", text: "CFO Bot reports **Lumen Labs – 12-Month Business Plan#140**. The same page is open in cfo.ai with pricing, costs, and runway sections, under **Main Scenario**." },
      { status: "check", title: "What the comparison establishes", text: "The disconnected run produced a **local file**; the earlier connected run shows **named MCP edits, an approval gate and a saved cfo.ai page**. The prompts and starting workspace state differ, so this does not establish a speed or accuracy improvement. The fresh answer incorrectly calls $60,480 annual gross profit about 2.4 months of burn; at roughly $300k monthly burn it is **about 0.2 months**." },
    ],
    links: [{ href: "/JUDGE.md", label: "Judge guide and comparison scope" }, { href: `${proofBase}/README.md`, label: "Original capture index" }, { href: `${proofBase}/SHA256SUMS.txt`, label: "Capture checksums" }],
  },
  {
    id: "neatbot",
    short: "Neat Bot monitoring",
    criterion: "Neat Bot tracking and monitoring recent traces",
    badge: "Screenshots",
    proof: "Neat Bot, our neatlogs specialist, was asked in the Bot Company app to look at recent traces and make a cost analysis of each agent. It checked the neatlogs connection, pulled recent traces and returned a per-run table with findings on what drives cost.",
    steps: [
      { status: "recorded", title: "Ask for a cost analysis of recent traces", text: "The request reads \"take a look at recent traces make a cost analysis of each agent here btw\". Neat Bot replies that it will start by checking the connection and pulling recent traces, then runs **Neatlogs ping** and **Neatlogs whoami**." },
      { status: "passed", title: "Per-run detail across the agents", text: "The answer's per-run table lists **9 traces** from the CFO, GitHub, Research, Primary and Neat bots, with trace ID, start time, tokens (input + output), cost and latency." },
      { status: "recorded", title: "What it says is driving the cost", text: "Neat Bot reports that **97.1%** of tokens on the seven traces with a prompt/completion split were prompt tokens, and that two CFO runs account for **63% of tokens and 57% of spend**. It also notes that prompt size per call varies widely and that a GitHub question was asked twice. These are Neat Bot's figures as displayed, not independently re-checked." },
    ],
    shots: [
      shot("57-neatbot-cost-prompt.png", "Neat Bot asked to take a look at recent traces and make a cost analysis of each agent; it runs Neatlogs ping and Neatlogs whoami."),
      shot("58-neatbot-cost-analysis.png", "Neat Bot's per-run detail table of nine traces with tokens, cost and latency, and its \"What's driving the cost\" findings."),
    ],
  },
  {
    id: "recovery",
    short: "Cap and recovery",
    criterion: "Agent recovers from failures (a run where an action failed, then what it did next)",
    badge: "Screenshots",
    proof: "A live run reached its token limit before it could finish. The app asked for a one-time extension, and the user approved it. Here is what happened next.",
    steps: [
      { status: "failed", title: "The run reached its token cap", text: "Usage reached **302k tokens against a 300k cap**, while cost was $0.026 of $0.03. Checks happen after model steps, so the step that hits the cap can overshoot it." },
      { status: "changed", title: "The user approved a one-time extension", text: "The cap card asked for about **$0.05 more**. Approve granted a continuation budget of **$0.05 and 454k tokens**; __the saved limit stayed unchanged__." },
      { status: "passed", title: "The continuation finished within its budget", text: "The answer completed using **$0.034 and 167k tokens**. The app and neatlogs show the same continuation usage." },
      { status: "check", title: "We also checked what happens when the user declines", text: "In the separate Northwind test, Approve completed at **$0.031799**. Deny returned a **tool-free answer marked Incomplete**. Declining the extension still incurs the final answer's model cost." },
    ],
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
    proof: "We shared the build as it happened, from choosing the stack to posting the Bot Company submission. The four original posts are linked below.",
    steps: [
      { status: "recorded", title: "Follow the build from 10 to 12 October", text: "The posts from **@rk625dev** show the neatlogs and Entire setup, work in progress, the startup agent team, and the submission film." },
      { status: "passed", title: "Open the original posts", text: "All **four posts** have direct X links. Their actual tags are **#neatlogs, #neathacks, and #neathack**; the submission post includes #neathack." },
    ],
    links: posts.map((post) => ({ href: post.url, label: post.title })),
  },
  {
    id: "commits",
    short: "Hackathon commit history",
    criterion: "Code written during the hackathon (dated commits)",
    badge: "In repo",
    proof: "The public Git history shows when the code was written. The counts below come from a fixed snapshot, so they remain reproducible as we keep improving the project.",
    steps: [
      { status: "passed", title: "The recorded commits fall within the build dates", text: `The snapshot contains **${repoFacts.commits} commits**, dated **10–12 October 2026**. The first commit is the README with the hackathon problem statement.` },
      { status: "recorded", title: "Verify the dates yourself", text: "Open the public commit history or clone the repository and run the commands below. The saved list also includes checkpoint IDs. __Later commits are not included in these counts__." },
    ],
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
    { status: "failed", title: "Before: the run stopped without an answer", text: "The agent used **323,923 tokens**, exceeding its **300,000-token limit**. Its trace ended in **ERROR** after **20 model calls**, at a cost of **$0.0590**. Neat Bot's trace review highlighted repeated file reads and large prompts." },
    { status: "changed", title: "The fix: share facts instead of reading them again", text: "In commit **8887e9ba**, the Primary Bot passes the figures and file paths it has already read to each specialist. Specialists __read only missing information__ and return a short brief." },
    { status: "passed", title: "After: the same question finished within the limit", text: "The matching after run succeeded with **237,208 tokens** and **16 model calls**, at a cost of **$0.0499**. That single trace pair used **26.8% fewer tokens** and cost **15.4% less**." },
  ] satisfies ProcessStep[],
  pairedRuns: [
    { label: "Outcome", before: "Failed · no final answer", after: "Succeeded · answer completed" },
    { label: "Tokens", before: "323,923", after: "237,208" },
    { label: "Model calls", before: "20", after: "16" },
    { label: "Trace cost", before: "$0.0590", after: "$0.0499" },
  ],
  note: "The cards show totals across **three runs before and three after**, separate from the single trace pair above. All three after runs finished within their caps; two of three before runs did. Total estimated cost fell **3.3%**, but total time rose from **497.2 to 522.2 seconds**. CFO replies were **74.1% shorter** (25,989 → 6,730 characters). File-read counts come from app logs; neatlogs recorded no tool spans. __This six-run sample does not establish general savings or a speed improvement.__",
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
  "CFO Bot created Lumen Labs – 12-Month Business Plan#140 in cfo.ai. The text write paused on Approve for cfo_edit_pages, and the page is open with pricing, costs, and runway. The latest fresh disconnected run saved a local Markdown plan and explicitly reported no live cfo.ai connection. Its financial figures are not independently verified, and its 2.4-month gross-profit claim is erroneous. These runs have different prompts and are not a controlled accuracy or speed comparison. The page is under Main Scenario; the three requested scenario names are not visible in that shot.",
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
