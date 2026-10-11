# NeatLogs Hackathon Project

This project is being developed for the **NeatLogs Hackathon**.

## Problem Statement

> **Build an AI agent that completes a substantial real-world task from start to finish, using neatlogs to trace and improve its runs and Entire to capture coding context and checkpoints, with other partner tools as optional enhancements.**

## Overview

WhatsApp messages go to the **Assistant**, the primary orchestrator. It handles general conversation directly and delegates company and market research to the **Market Researcher**, which owns the Crustdata company search, enrichment, and web search tools. Business financial analysis goes to the **CFO Agent**, which analyzes figures supplied in the conversation, including cash flow, runway, budgets, pricing, and hiring scenarios. For combined requests, the Assistant passes market research findings to the CFO Agent and synthesizes the final reply. GitHub questions (repositories, issues, pull requests, Actions runs) go to a read-only copy of the **GitHub Agent**, and questions about past agent runs (failures, latency, token usage, detections, triage) go to a read-only copy of the **Neatlogs Agent**.

The CFO Agent currently has no financial tools, document extraction, accounting access, or cfo.ai MCP connection. Its calculations include formulas and assumptions but are not verified by a calculation tool.

The **GitHub Agent** connects to GitHub's official remote MCP server (repos, issues, pull requests, Actions, account context) using `GITHUB_PAT`. In the web chat it can also make changes, but every tool the server does not mark read-only (`readOnlyHint: true`) pauses for an inline Approve/Deny card; a denied call never runs, and sending a new message drops any approval left unanswered. The Assistant (and therefore WhatsApp) only ever gets its read-only tools, so it cannot write to GitHub. Without `GITHUB_PAT` the agent starts with no tools.

The **Neatlogs Agent** is an observability analyst for the other agents: it connects to Neatlogs' hosted MCP server and reads the traces of their runs (search, trace context, evaluations, analytics, detections, triage items), reusing the same `NEATLOGS_API_KEY` as tracing. In the web chat it can also accept, dismiss, update, or restore triage items and create detections, but only a fixed allowlist of read tools runs without approval; every other tool (including any new one the server adds) pauses for the same inline Approve/Deny card. The `log_trace` ingestion tool is never exposed. The Assistant (and therefore WhatsApp) only gets its read tools. Without `NEATLOGS_API_KEY` the agent starts with no tools.

The Assistant has a six-step execution limit, and each delegated specialist run has a twelve-step limit. All four agents remain registered in Mastra for direct development and inspection.

WhatsApp follow-ups receive all available conversation messages from Chat SDK's per-conversation cache, including bot replies, with no message-count cap on the cache or model history. The handler reads the thread history, converts it using Chat SDK's `toAiMessages`, and passes it directly to the Assistant. Short message bursts are collected for one second and answered together; messages arriving during a run are queued. Typing indicators replace progress replies. History uses in-memory state, so it clears on restart and is not shared between server instances; the SDK's default cache expiry still applies. Messages from before the bot observed the conversation cannot be retrieved from WhatsApp.

## Run locally

Copy `.env.example` to `.env` and fill in the provider and integration credentials. For the GitHub Agent, set `GITHUB_PAT` to a fine-grained personal access token scoped to the repositories it may use (read/write on Contents, Issues, Pull requests and Actions for changes; read-only permissions are enough for inspection).

- `npm start -- "Research Retool and its competitors"` — run the primary Assistant.
- `AGENT=market-researcher npm start -- "Research Retool"` — run the specialist directly.
- `AGENT=cfo npm start -- "Cash is INR 1200000 and monthly net cash burn is INR 200000. Estimate runway."` — run the CFO Agent directly.
- `npm run bot` — start the WhatsApp webhook server at `/api/webhooks/whatsapp` (port 3000 by default).
- `npm run tunnel` — run the ngrok CLI using `PORT` (defaults to 3000), `NGROK_DOMAIN`, and `NGROK_AUTHTOKEN` from `.env`. Install the ngrok CLI first (`brew install --cask ngrok` on macOS) and set the domain and authtoken from your ngrok dashboard.
- `npm run tunnel:local` — localtunnel fallback. Its requested subdomain is not reserved; check the actual printed URL after every restart before using it in Meta.
- `npm run dev` — open the Mastra development environment.
- `npm run typecheck` — check TypeScript.

## WhatsApp connection checks

Keep `npm run bot` and `npm run tunnel` running in separate terminals. Configure Meta's WhatsApp Business Account webhook callback as `https://<NGROK_DOMAIN>/api/webhooks/whatsapp`, use the same `WHATSAPP_VERIFY_TOKEN` as `.env`, and subscribe to `messages`.

Also subscribe your app to the WhatsApp Business Account itself. Verify that your app appears in `GET /<WABA_ID>/subscribed_apps`; with approval, add it using `POST /<WABA_ID>/subscribed_apps` authenticated with your app's WhatsApp management token. A `messages` field subscription alone does not bind the app to the account. Meta's internal test app appearing in the list is not enough.

`GET /health` returns `{ "status": "ok" }`. `WhatsApp assistant started` confirms the incoming message reached the model handler; `WhatsApp reply sent` confirms Meta accepted the outgoing reply. Confirm delivery separately in WhatsApp.

If Meta rejects the access token as expired (OAuth error 190, subcode 463), replace `WHATSAPP_ACCESS_TOKEN` and restart the bot. Refreshing the file does not change the running process. Check the app dashboard's publication requirements when it warns that unpublished apps only receive dashboard test events. A successful dashboard sample is not an end-to-end test: it uses sample phone details and cannot prove delivery to your phone.

## Key Integrations

- **NeatLogs**: All Mastra agents are wrapped with `neatlogs/mastra`, recording agent runs, model steps, tool calls, inputs/outputs, timing, token usage when returned, and errors. CLI and WhatsApp runs have request traces; WhatsApp also records history message count/bytes and reply delivery. Tracing does not trim model context.
- **GitHub MCP**: The GitHub Agent uses GitHub's hosted MCP server (`https://api.githubcopilot.com/mcp/`) through `@mastra/mcp`, limited to the context, repos, issues, pull_requests and actions toolsets.
- **Neatlogs MCP**: The Neatlogs Agent uses Neatlogs' hosted MCP server (`https://ingest.neatlogs.com/mcp`) through `@mastra/mcp`, authenticated with the existing `NEATLOGS_API_KEY`. Tools are gated by name (the server sends no read-only annotations): reads run directly, writes and unknown tools need approval.
- **Entire**: Coding-context hooks and checkpoint settings are configured.

## View Neatlogs traces

Set `NEATLOGS_API_KEY` in `.env` to your Neatlogs project ingest key, then restart `npm run bot` (or run `npm start -- "Say hello in one sentence"`). Optional `NEATLOGS_ENDPOINT` selects the ingest endpoint; `NEATLOGS_DEBUG=true` enables SDK diagnostics. Without a key, dashboard export is disabled and startup prints a warning.

Open https://app.neatlogs.com and select the project matching your key. Open its traces view and find the `whatsapp.request` or `cli.request` run. The terminal prints the exact `traceId` for each request; use it to identify the run. Expand the agent/model/tool spans to inspect each step. WhatsApp turns share a hashed conversation session ID. Agent/model/tool tracing captures conversation content and tool results; session hashing only hides the phone number in the session identifier.

`npx neatlogs doctor --local --json` validates the local SDK pipeline without credentials or network calls. `node --env-file=.env node_modules/neatlogs/dist/cli.mjs doctor --probe --json` sends generated diagnostic spans to your configured project and checks their persisted trace. It does not call an LLM. CLI requests explicitly flush at shutdown; the long-running bot uses SDK batching and signal shutdown handlers.
