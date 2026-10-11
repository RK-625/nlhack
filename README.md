# NeatLogs Hackathon Project

This project is being developed for the **NeatLogs Hackathon**.

## Problem Statement

> **Build an AI agent that completes a substantial real-world task from start to finish, using neatlogs to trace and improve its runs and Entire to capture coding context and checkpoints, with other partner tools as optional enhancements.**

## Overview

The web chat (and the CLI) talk to the **Assistant**, the primary orchestrator, or directly to any specialist agent. It handles general conversation directly and delegates company and market research to the **Market Researcher**, which owns the Crustdata company search, enrichment, and web search tools. Business financial analysis goes to the **CFO Agent**, which analyzes figures supplied in the conversation, including cash flow, runway, budgets, pricing, and hiring scenarios. For combined requests, the Assistant passes market research findings to the CFO Agent and synthesizes the final reply. GitHub questions (repositories, issues, pull requests, Actions runs) go to a read-only copy of the **GitHub Agent**, and questions about past agent runs (failures, latency, token usage, detections, triage) go to a read-only copy of the **Neatlogs Agent**.

The CFO Agent currently has no financial tools, document extraction, accounting access, or cfo.ai MCP connection. Its calculations include formulas and assumptions but are not verified by a calculation tool.

The **GitHub Agent** connects to GitHub's official remote MCP server (repos, issues, pull requests, Actions, account context) using `GITHUB_PAT`. In the web chat it can also make changes, but every tool the server does not mark read-only (`readOnlyHint: true`) pauses for an inline Approve/Deny card; a denied call never runs, and sending a new message drops any approval left unanswered. The Assistant only ever gets its read-only tools, so it cannot write to GitHub. Without `GITHUB_PAT` the agent starts with no tools.

The **Neatlogs Agent** is an observability analyst for the other agents: it connects to Neatlogs' hosted MCP server and reads the traces of their runs (search, trace context, evaluations, analytics, detections, triage items), reusing the same `NEATLOGS_API_KEY` as tracing. In the web chat it can also accept, dismiss, update, or restore triage items and create detections, but only a fixed allowlist of read tools runs without approval; every other tool (including any new one the server adds) pauses for the same inline Approve/Deny card. The `log_trace` ingestion tool is never exposed. The Assistant only gets its read tools. Without `NEATLOGS_API_KEY` the agent starts with no tools.

The Assistant has a six-step execution limit, and each delegated specialist run has a twelve-step limit. All four agents remain registered in Mastra for direct development and inspection.

## Run locally

Copy `.env.example` to `.env` and fill in the provider and integration credentials. For the GitHub Agent, set `GITHUB_PAT` to a fine-grained personal access token scoped to the repositories it may use (read/write on Contents, Issues, Pull requests and Actions for changes; read-only permissions are enough for inspection).

- `npm start -- "Research Retool and its competitors"` — run the primary Assistant.
- `AGENT=market-researcher npm start -- "Research Retool"` — run the specialist directly.
- `AGENT=cfo npm start -- "Cash is INR 1200000 and monthly net cash burn is INR 200000. Estimate runway."` — run the CFO Agent directly.
- `npm run serve` — start the web UI and API server (port 3000 by default). `GET /health` returns `{ "status": "ok" }`.
- `npm run dev` — open the Mastra development environment.
- `npm run typecheck` — check TypeScript.

## Key Integrations

- **NeatLogs**: All Mastra agents are wrapped with `neatlogs/mastra`, recording agent runs, model steps, tool calls, inputs/outputs, timing, token usage when returned, and errors. CLI runs have request traces. Tracing does not trim model context.
- **GitHub MCP**: The GitHub Agent uses GitHub's hosted MCP server (`https://api.githubcopilot.com/mcp/`) through `@mastra/mcp`, limited to the context, repos, issues, pull_requests and actions toolsets.
- **Neatlogs MCP**: The Neatlogs Agent uses Neatlogs' hosted MCP server (`https://ingest.neatlogs.com/mcp`) through `@mastra/mcp`, authenticated with the existing `NEATLOGS_API_KEY`. Tools are gated by name (the server sends no read-only annotations): reads run directly, writes and unknown tools need approval.
- **Entire**: Coding-context hooks and checkpoint settings are configured.

## View Neatlogs traces

Set `NEATLOGS_API_KEY` in `.env` to your Neatlogs project ingest key, then restart `npm run serve` (or run `npm start -- "Say hello in one sentence"`). Optional `NEATLOGS_ENDPOINT` selects the ingest endpoint; `NEATLOGS_DEBUG=true` enables SDK diagnostics. Without a key, dashboard export is disabled and startup prints a warning.

Open https://app.neatlogs.com and select the project matching your key. Open its traces view and find the `cli.request` run. The terminal prints the exact `traceId` for each request; use it to identify the run. Expand the agent/model/tool spans to inspect each step. Agent/model/tool tracing captures conversation content and tool results.

`npx neatlogs doctor --local --json` validates the local SDK pipeline without credentials or network calls. `node --env-file=.env node_modules/neatlogs/dist/cli.mjs doctor --probe --json` sends generated diagnostic spans to your configured project and checks their persisted trace. It does not call an LLM. CLI requests explicitly flush at shutdown; the long-running server uses SDK batching and signal shutdown handlers.
