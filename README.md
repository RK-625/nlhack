# Bot Company

Built for neatHack 2026 (neatlogs, Entire, cfo.ai).

For the failure-and-recovery demo, see [Northwind cap escalation](docs/demo/northwind-cap-escalation.md), including the six-run benchmark, trace links, and answer checks.

## Problem Statement

> **Build an AI agent that completes a substantial real-world task from start to finish, using neatlogs to trace and improve its runs and Entire to capture coding context and checkpoints, with other partner tools as optional enhancements.**

## Overview

The web chat (and the CLI) talk to the **Primary Bot**, the primary orchestrator, or directly to any specialist agent. It handles general conversation directly and delegates company and market research to the **Research Bot**, which owns the Crustdata company search, enrichment, and web search tools. Business financial analysis goes to the **CFO Bot**, which analyzes cash flow, runway, budgets, pricing, and hiring scenarios from figures supplied in the conversation and, when the user has connected it, live data from their own cfo.ai workspace (changes there need approval). For combined requests, the Primary Bot passes market research findings to the CFO Bot and synthesizes the final reply. GitHub requests (repositories, issues, pull requests, Actions runs, and changes to them) go to the **GitHub Bot**, and questions about past agent runs (failures, latency, token usage, detections, triage) and triage or detection changes go to the **Neat Bot**. Five further specialists work without tools, purely from what you tell them: the **Customer Success** agent (onboarding, churn risk, renewals), the **Legal Agent** (contract and compliance checklists, policy drafts; not legal advice), the **HR Agent** (hiring, performance, compensation framing), the **Marketing Agent** (positioning, campaigns, SEO briefs) and the **Sales Agent** (ICP, outreach, deal strategy); tools for them come later. Finance stays with the CFO Bot. These are the same write-capable agents you can chat with directly: when one wants to make a change during a delegation, the run pauses and the Approve/Deny card appears in the Assistant's chat, showing which agent wants to run which tool with its exact arguments. Approving resumes the specialist and the Assistant's reply; denying means the change never runs.

The CFO Bot works from figures supplied in the conversation and, once you link your own cfo.ai account (see below), live data from your cfo.ai workspace. It has no other accounting access or document extraction, and its own calculations show formulas and assumptions but are not verified by a calculation tool.

The **GitHub Bot** connects to GitHub's official remote MCP server (repos, issues, pull requests, Actions, account context) using `GITHUB_PAT`. In the web chat it can also make changes, but every tool the server does not mark read-only (`readOnlyHint: true`) pauses for an inline Approve/Deny card; a denied call never runs, and sending a new message drops any approval left unanswered (including the paused specialist run behind a delegated one). The same gate applies when the Assistant delegates to it. Without `GITHUB_PAT` the agent starts with no tools.

The **Neat Bot** is an observability analyst for the other agents: it connects to Neatlogs' hosted MCP server and reads the traces of their runs (search, trace context, evaluations, analytics, detections, triage items), reusing the same `NEATLOGS_API_KEY` as tracing. Admins see the whole project; other signed-in users (role `employee`) see only the traces of their own conversations, enforced in code: they get only `ping`, `whoami`, `search_traces`, `get_trace_context` and `get_trace_evaluations`, wrapped per request so searches keep only results whose session is one of the user's own chats (`<userId>:<agentId>`, with no project-wide totals) and a trace id opens only if it is recorded as theirs in the `trace_owner` table in `data/auth.db` (written for every web request, and backfilled from their own search results). Analytics, detections, triage and all changes are admin-only. The CLI and `mastra dev` run without a user and get the full tool set. For admins, the web chat can also accept, dismiss, update, or restore triage items and create detections, but only a fixed allowlist of read tools runs without approval; every other tool (including any new one the server adds) pauses for the same inline Approve/Deny card. The `log_trace` ingestion tool is never exposed. Changes delegated by the Assistant go through the same approval card in the Assistant's chat. Without `NEATLOGS_API_KEY` the agent starts with no tools.

The Primary Bot has a six-step execution limit, and each delegated specialist run has a twelve-step limit. All ten agents remain registered in Mastra for direct development and inspection.

## Files

Every agent shares a private, per-user file workspace, so you can say "save this as runway-plan" and later ask any agent (in any chat, after restarts) to list, read, or search your files. Files live on disk under `DATA_DIR/files/<user id>/` (default `./data/files/`, already git-ignored); the CLI (`npm start`) and `npm run dev` use `DATA_DIR/files/local/`. Each user's folder is resolved on the server from the signed-in session, and paths outside it (`../`, absolute paths, symlink escapes) are refused. Agents can read, save (create or overwrite), list, search (grep), inspect, and create folders without asking; deleting a file pauses for the same inline Approve/Deny card, including when a specialist deletes during an Assistant delegation. In-place edit tools are disabled, and there is no command execution or search index. In `npm run dev` the playground can set any request context, so treat it as local-only.

## Run locally

Copy `.env.example` to `.env` and fill in the provider and integration credentials. For the GitHub Bot, set `GITHUB_PAT` to a fine-grained personal access token scoped to the repositories it may use (read/write on Contents, Issues, Pull requests and Actions for changes; read-only permissions are enough for inspection).

- `npm start -- "Research Retool and its competitors"` — run the Primary Bot.
- `AGENT=market-researcher npm start -- "Research Retool"` — run the specialist directly.
- `AGENT=cfo npm start -- "Cash is INR 1200000 and monthly net cash burn is INR 200000. Estimate runway."` — run the CFO Bot directly.
- `npm run serve` — start the web UI and API server (port 3000 by default). `GET /health` returns `{ "status": "ok" }`.
- `npm run dev` — open the Mastra development environment.
- `npm run typecheck` — check TypeScript.
- `npm run seed` — sync users with `seed-users.json` (copy `seed-users.example.json`). Listed users that do not exist are created; existing ones are kept untouched (password, chats, files and caps are never changed).
  Users in the database but not in the file are listed and removed only after you confirm (`Remove these N user(s) and all their data? [y/N]`), together with their sessions, chats, file folder, usage caps, cfo.ai connection and trace ownership. Without a terminal, removal needs `npm run seed -- --yes`; `--dry-run` only prints what would be created, kept and removed. Removal is refused if the file has no `admin` user.

## cfo.ai connection

Each signed-in user can link their own cfo.ai account over OAuth (authorization code + PKCE, via cfo.ai's WorkOS AuthKit server, discovered at runtime from `https://api.cfo.ai/mcp`). Tokens are stored per user in `data/auth.db` (`cfo_connections`), encrypted with AES-256-GCM, and refreshed automatically (rotated tokens are re-encrypted; a rejected refresh removes the connection).

The CFO Bot uses each user's own connection: per request it reads the signed-in user from the chat's RequestContext, gets a valid access token, and connects to cfo.ai's MCP server (`https://api.cfo.ai/mcp`, host-pinned to `api.cfo.ai`, server instructions not forwarded) as that user. cfo.ai marks every tool with a `readOnlyHint`: read tools (`inspect_*`, `list_orgs`, `validate_code_blocks`) run freely, and every other tool (the remaining `edit_*` tools) pauses for Approve/Deny in the chat, including when the Primary Bot delegates. Six tools are never exposed: `notify_user`, `call_connected_api`, `edit_team`, `edit_org`, `edit_integrations` and `edit_triggers` (they reach outside cfo.ai or change account-level settings). The agent treats cfo.ai content as untrusted data and never invents figures. Users who have not connected (and CLI runs, which have no signed-in user) get only a `cfo_connection_status` tool, and the agent points them to `/api/cfo/connect`.

1. `npm run cfo:register` — registers this app once as a public OAuth client with redirect URI `${APP_URL or BETTER_AUTH_URL}/api/cfo/callback` and prints `CFO_OAUTH_CLIENT_ID=...`. Re-run it if that origin changes.
2. In `.env`, set `CFO_OAUTH_CLIENT_ID` to the printed value and `CFO_TOKEN_KEY` to the output of `openssl rand -base64 32`, then restart `npm run serve`.
3. Sign in to the web app and click **Connect cfo.ai** (in the account menu at the bottom of the sidebar, or the banner above the CFO Bot's composer; it is the same as opening `/api/cfo/connect`). The same menu has **Disconnect cfo.ai**. After approving on cfo.ai you return to `/?cfo=connected` (or `/?cfo=error`; the server log says why).

`GET /api/cfo/status` returns `{ configured, connected, expiresAt? }` (never tokens); `POST /api/cfo/disconnect` forgets the current user's tokens. Without the two variables the server starts with a warning and the connect/callback routes return 503.

## Usage caps

Every chat turn (one user message, or one approval resume, and everything the agent does to answer it: all model steps, tool calls and delegated sub-agent calls) is limited per user and per agent by a **cost cap** (default $0.25) and a **token cap** (default 300,000 tokens). Each user sets their own caps per agent; they are stored in `data/auth.db` (`agent_caps`) and persist across sessions and restarts. The caps of the agent being chatted with apply, including to the sub-agents it delegates to.

- `GET /api/agents/:agentId/caps` returns `{ costCapUsd, tokenCap, defaults }`; `PUT` with `{ costCapUsd, tokenCap }` saves them (both must be greater than 0; at most 1000 USD and 100,000,000 tokens); `DELETE` resets to the defaults. Signed-in users only, own caps only.
- Cost is estimated from `src/usage/pricing.ts` (DeepSeek's published peak prices; input tokens the provider reports as cache hits, `usage.cachedInputTokens`, are priced at the cache-hit rate and the rest at the cache-miss rate, and a step that reports no cached count is priced entirely at the cache-miss rate; unknown models use a high fallback price).
- A processor on every agent (`src/usage/turn-budget.ts`) adds up each model step's usage. Once a cap is exceeded the run stops before the next model call (tools the last step requested still run); the partial reply is kept and a closing note explains which limit was hit.
- The chat stream carries a `data-turn-usage` part (`{ costUsd, tokens, inputTokens, outputTokens, cachedInputTokens, steps, capCostUsd, capTokens, capped, reason, final }`) after each model step and once more at the end. The final usage (plus the turn's Neatlogs `traceId`) is also on the finish part and on the saved reply as `metadata.turnUsage`. Neatlogs traces get `app.turn_cost_usd`, `app.turn_tokens`, `app.turn_steps` and `app.turn_capped`, plus a `cost-capped` or `token-capped` tag.
- After a turn, Neatlogs' own numbers are shown next to the estimate under the bot pill (e.g. "Est. $0.0022 · 7.3k" / "Neatlogs $0.0001 · 7.3k tokens"). Once the reply is sent and the trace has ended, the server flushes the Neatlogs exporter and polls `get_trace_context` for that trace (server-side, through the shared Neatlogs MCP client; never exposed to an agent) until it is finalized, for up to ~45 s (`src/usage/neatlogs-usage.ts`). In practice it is ready about 4-6 s after the reply. The result is saved on the reply as `metadata.neatlogsUsage` (`{ status: "pending" | "ready" | "unavailable", traceId, costUsd, tokens, inputTokens, outputTokens, checkedAt, fetchedAt }`), so a reload shows it. The browser polls `GET /api/chat/:agentId/messages/:messageId/neatlogs-usage`, which only finds replies in the caller's own chat (404 otherwise) and, when no poll is running and the last check is over 10 s old, checks Neatlogs once more. Neatlogs' cost is usually lower than the estimate because it counts DeepSeek cache hits; the caps still use the estimate.
- The Neatlogs line links to the turn's trace in the Neatlogs dashboard (new tab). The link template comes from `GET /api/neatlogs/trace-link`: `NEATLOGS_TRACE_URL` (containing `{traceId}`) if set, otherwise built from the org and project ids that Neatlogs' `whoami` reports for `NEATLOGS_API_KEY`; without either, the line is plain text.

## Key Integrations

- **NeatLogs**: All Mastra agents are wrapped with `neatlogs/mastra`, recording agent runs, model steps, tool calls, inputs/outputs, timing, token usage when returned, and errors. CLI runs have request traces. Tracing does not trim model context.
- **GitHub MCP**: The GitHub Bot uses GitHub's hosted MCP server (`https://api.githubcopilot.com/mcp/`) through `@mastra/mcp`, limited to the context, repos, issues, pull_requests and actions toolsets.
- **Neatlogs MCP**: The Neat Bot uses Neatlogs' hosted MCP server (`https://ingest.neatlogs.com/mcp`) through `@mastra/mcp`, authenticated with the existing `NEATLOGS_API_KEY`. Tools are gated by name (the server sends no read-only annotations): reads run directly, writes and unknown tools need approval.
- **Entire**: Coding-context hooks and checkpoint settings are configured.

## View Neatlogs traces

Set `NEATLOGS_API_KEY` in `.env` to your Neatlogs project ingest key, then restart `npm run serve` (or run `npm start -- "Say hello in one sentence"`). Optional `NEATLOGS_ENDPOINT` selects the ingest endpoint; `NEATLOGS_DEBUG=true` enables SDK diagnostics. Without a key, dashboard export is disabled and startup prints a warning.

Open https://app.neatlogs.com and select the project matching your key. Open its traces view and find the `cli.request` run. The terminal prints the exact `traceId` for each request; use it to identify the run. Expand the agent/model/tool spans to inspect each step. Agent/model/tool tracing captures conversation content and tool results.

`npx neatlogs doctor --local --json` validates the local SDK pipeline without credentials or network calls. `node --env-file=.env node_modules/neatlogs/dist/cli.mjs doctor --probe --json` sends generated diagnostic spans to your configured project and checks their persisted trace. It does not call an LLM. CLI requests explicitly flush at shutdown; the long-running server uses SDK batching and signal shutdown handlers.

## Credits

The look and feel is inspired by Grok bot, and the UI was built with help from looking at Grok's UI and design.

## Judge evidence

See [JUDGE.md](JUDGE.md) for the live judge site, the CFO disconnected/connected workflow comparison and screenshot provenance.

Specialist execution evidence: [GitHub and Research task completion, cost, tokens and trace captures](https://bot-company.onrender.com/judges/#execution). Original captures 48–56 and measurement limits are indexed in the evidence folder.
