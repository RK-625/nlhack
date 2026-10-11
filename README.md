# NeatLogs Hackathon Project

This project is being developed for the **NeatLogs Hackathon**.

## Problem Statement

> **Build an AI agent that completes a substantial real-world task from start to finish, using neatlogs to trace and improve its runs and Entire to capture coding context and checkpoints, with other partner tools as optional enhancements.**

## Overview

The web chat (and the CLI) talk to the **Assistant**, the primary orchestrator, or directly to any specialist agent. It handles general conversation directly and delegates company and market research to the **Market Researcher**, which owns the Crustdata company search, enrichment, and web search tools. Business financial analysis goes to the **CFO Agent**, which analyzes cash flow, runway, budgets, pricing, and hiring scenarios from figures supplied in the conversation and, when the user has connected it, live data from their own cfo.ai workspace (changes there need approval). For combined requests, the Assistant passes market research findings to the CFO Agent and synthesizes the final reply. GitHub requests (repositories, issues, pull requests, Actions runs, and changes to them) go to the **GitHub Agent**, and questions about past agent runs (failures, latency, token usage, detections, triage) and triage or detection changes go to the **Neatlogs Agent**. Five further specialists work without tools, purely from what you tell them: the **Customer Success** agent (onboarding, churn risk, renewals), the **Legal Agent** (contract and compliance checklists, policy drafts; not legal advice), the **HR Agent** (hiring, performance, compensation framing), the **Marketing Agent** (positioning, campaigns, SEO briefs) and the **Sales Agent** (ICP, outreach, deal strategy); tools for them come later. Finance stays with the CFO Agent. These are the same write-capable agents you can chat with directly: when one wants to make a change during a delegation, the run pauses and the Approve/Deny card appears in the Assistant's chat, showing which agent wants to run which tool with its exact arguments. Approving resumes the specialist and the Assistant's reply; denying means the change never runs.

The CFO Agent works from figures supplied in the conversation and, once you link your own cfo.ai account (see below), live data from your cfo.ai workspace. It has no other accounting access or document extraction, and its own calculations show formulas and assumptions but are not verified by a calculation tool.

The **GitHub Agent** connects to GitHub's official remote MCP server (repos, issues, pull requests, Actions, account context) using `GITHUB_PAT`. In the web chat it can also make changes, but every tool the server does not mark read-only (`readOnlyHint: true`) pauses for an inline Approve/Deny card; a denied call never runs, and sending a new message drops any approval left unanswered (including the paused specialist run behind a delegated one). The same gate applies when the Assistant delegates to it. Without `GITHUB_PAT` the agent starts with no tools.

The **Neatlogs Agent** is an observability analyst for the other agents: it connects to Neatlogs' hosted MCP server and reads the traces of their runs (search, trace context, evaluations, analytics, detections, triage items), reusing the same `NEATLOGS_API_KEY` as tracing. In the web chat it can also accept, dismiss, update, or restore triage items and create detections, but only a fixed allowlist of read tools runs without approval; every other tool (including any new one the server adds) pauses for the same inline Approve/Deny card. The `log_trace` ingestion tool is never exposed. Changes delegated by the Assistant go through the same approval card in the Assistant's chat. Without `NEATLOGS_API_KEY` the agent starts with no tools.

The Assistant has a six-step execution limit, and each delegated specialist run has a twelve-step limit. All ten agents remain registered in Mastra for direct development and inspection.

## Files

Every agent shares a private, per-user file workspace, so you can say "save this as runway-plan" and later ask any agent (in any chat, after restarts) to list, read, or search your files. Files live on disk under `DATA_DIR/files/<user id>/` (default `./data/files/`, already git-ignored); the CLI (`npm start`) and `npm run dev` use `DATA_DIR/files/local/`. Each user's folder is resolved on the server from the signed-in session, and paths outside it (`../`, absolute paths, symlink escapes) are refused. Agents can read, save (create or overwrite), list, search (grep), inspect, and create folders without asking; deleting a file pauses for the same inline Approve/Deny card, including when a specialist deletes during an Assistant delegation. In-place edit tools are disabled, and there is no command execution or search index. In `npm run dev` the playground can set any request context, so treat it as local-only.

## Run locally

Copy `.env.example` to `.env` and fill in the provider and integration credentials. For the GitHub Agent, set `GITHUB_PAT` to a fine-grained personal access token scoped to the repositories it may use (read/write on Contents, Issues, Pull requests and Actions for changes; read-only permissions are enough for inspection).

- `npm start -- "Research Retool and its competitors"` — run the primary Assistant.
- `AGENT=market-researcher npm start -- "Research Retool"` — run the specialist directly.
- `AGENT=cfo npm start -- "Cash is INR 1200000 and monthly net cash burn is INR 200000. Estimate runway."` — run the CFO Agent directly.
- `npm run serve` — start the web UI and API server (port 3000 by default). `GET /health` returns `{ "status": "ok" }`.
- `npm run dev` — open the Mastra development environment.
- `npm run typecheck` — check TypeScript.

## cfo.ai connection

Each signed-in user can link their own cfo.ai account over OAuth (authorization code + PKCE, via cfo.ai's WorkOS AuthKit server, discovered at runtime from `https://api.cfo.ai/mcp`). Tokens are stored per user in `data/auth.db` (`cfo_connections`), encrypted with AES-256-GCM, and refreshed automatically (rotated tokens are re-encrypted; a rejected refresh removes the connection).

The CFO Agent uses each user's own connection: per request it reads the signed-in user from the chat's RequestContext, gets a valid access token, and connects to cfo.ai's MCP server (`https://api.cfo.ai/mcp`, host-pinned to `api.cfo.ai`, server instructions not forwarded) as that user. cfo.ai marks every tool with a `readOnlyHint`: read tools (`inspect_*`, `list_orgs`, `validate_code_blocks`) run freely, and every other tool (`edit_*`, `call_connected_api`, `notify_user`) pauses for Approve/Deny in the chat, including when the Assistant delegates. The agent treats cfo.ai content as untrusted data and never invents figures. Users who have not connected (and CLI runs, which have no signed-in user) get only a `cfo_connection_status` tool, and the agent points them to `/api/cfo/connect`.

1. `npm run cfo:register` — registers this app once as a public OAuth client with redirect URI `${APP_URL or BETTER_AUTH_URL}/api/cfo/callback` and prints `CFO_OAUTH_CLIENT_ID=...`. Re-run it if that origin changes.
2. In `.env`, set `CFO_OAUTH_CLIENT_ID` to the printed value and `CFO_TOKEN_KEY` to the output of `openssl rand -base64 32`, then restart `npm run serve`.
3. Sign in to the web app, then open `http://localhost:3000/api/cfo/connect`. After approving on cfo.ai you return to `/?cfo=connected` (or `/?cfo=error`; the server log says why).

`GET /api/cfo/status` returns `{ configured, connected, expiresAt? }` (never tokens); `POST /api/cfo/disconnect` forgets the current user's tokens. Without the two variables the server starts with a warning and the connect/callback routes return 503.

## Key Integrations

- **NeatLogs**: All Mastra agents are wrapped with `neatlogs/mastra`, recording agent runs, model steps, tool calls, inputs/outputs, timing, token usage when returned, and errors. CLI runs have request traces. Tracing does not trim model context.
- **GitHub MCP**: The GitHub Agent uses GitHub's hosted MCP server (`https://api.githubcopilot.com/mcp/`) through `@mastra/mcp`, limited to the context, repos, issues, pull_requests and actions toolsets.
- **Neatlogs MCP**: The Neatlogs Agent uses Neatlogs' hosted MCP server (`https://ingest.neatlogs.com/mcp`) through `@mastra/mcp`, authenticated with the existing `NEATLOGS_API_KEY`. Tools are gated by name (the server sends no read-only annotations): reads run directly, writes and unknown tools need approval.
- **Entire**: Coding-context hooks and checkpoint settings are configured.

## View Neatlogs traces

Set `NEATLOGS_API_KEY` in `.env` to your Neatlogs project ingest key, then restart `npm run serve` (or run `npm start -- "Say hello in one sentence"`). Optional `NEATLOGS_ENDPOINT` selects the ingest endpoint; `NEATLOGS_DEBUG=true` enables SDK diagnostics. Without a key, dashboard export is disabled and startup prints a warning.

Open https://app.neatlogs.com and select the project matching your key. Open its traces view and find the `cli.request` run. The terminal prints the exact `traceId` for each request; use it to identify the run. Expand the agent/model/tool spans to inspect each step. Agent/model/tool tracing captures conversation content and tool results.

`npx neatlogs doctor --local --json` validates the local SDK pipeline without credentials or network calls. `node --env-file=.env node_modules/neatlogs/dist/cli.mjs doctor --probe --json` sends generated diagnostic spans to your configured project and checks their persisted trace. It does not call an LLM. CLI requests explicitly flush at shutdown; the long-running server uses SDK batching and signal shutdown handlers.
