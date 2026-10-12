

https://github.com/user-attachments/assets/982c7046-d67e-4c19-b1da-8071a247ad00

# Bot Company

An AI startup team: a Primary Bot that delegates to specialist agents, with an approval for every change. Built for neatHack 2026.

## Quick links

- [Live site](https://bot-company.onrender.com)
- [Judge evidence](https://bot-company.onrender.com/judges/)
- [Launch video](https://bot-company.onrender.com/#video)
- [JUDGE.md](JUDGE.md): judge guide and screenshot provenance
- [Northwind cap-escalation demo](docs/demo/northwind-cap-escalation.md): failure, trace-driven fix, six-run benchmark

## Problem statement

> **Build an AI agent that completes a substantial real-world task from start to finish, using neatlogs to trace and improve its runs and Entire to capture coding context and checkpoints, with other partner tools as optional enhancements.**

## How it works

You chat with the Primary Bot (web UI or CLI), or directly with any specialist. The Primary Bot answers general questions itself and delegates the rest. Any change, such as a GitHub write, a cfo.ai edit or a file delete, pauses for an Approve/Deny card that shows the exact tool and arguments. Denied calls never run.

| Agent | What it does | Tools / integration |
| --- | --- | --- |
| Primary Bot | Orchestrates, delegates, writes the final reply | Delegation to the specialists |
| Research Bot | Company and market research | Crustdata search, enrichment, web search |
| CFO Bot | Cash flow, runway, budgets, pricing, hiring scenarios | Company files, per-user cfo.ai MCP |
| GitHub Bot | Repos, issues, pull requests, Actions | GitHub MCP (`GITHUB_PAT`) |
| Neat Bot | Reads past agent runs: failures, latency, tokens, triage | neatlogs MCP |
| Customer Success, Legal, HR, Marketing, Sales | Advice from what you tell them | No tools yet |

## Partner tools

- **neatlogs**: every agent is traced through `neatlogs/mastra`. Each reply shows a neatlogs cost and token line that links to its trace. Neat Bot reads traces through the neatlogs MCP. It diagnosed the failed Northwind run, and the fix cut tokens 26.8% (323,923 to 237,208); the run now succeeds. Neat Bot also analyzed cost across recent traces. Evidence: [neatlogs](https://bot-company.onrender.com/judges/#neatlogs), [Neat Bot](https://bot-company.onrender.com/judges/#neatbot).
- **Entire**: coding sessions are recorded as checkpoints, and commits carry `Entire-Checkpoint:` trailers. 113 of 130 commits made during the hackathon (10–12 Oct 2026). Example: commit `8887e9ba` links to checkpoint `01M4QMYG0STA2ZQR90286XF297`. Evidence: [Entire](https://bot-company.onrender.com/judges/#entire), [checkpoint notes](docs/demo/entire-checkpoints.md).
- **cfo.ai**: each user connects their own account over OAuth (PKCE). CFO Bot reads live workspace data, and edits need approval. After approval it wrote the Lumen Labs 12-month plan as a cfo.ai page. Evidence: [cfo.ai](https://bot-company.onrender.com/judges/#cfo).

## Run locally

Requires Node.js and npm (no version is pinned in `package.json`).

```
cp .env.example .env
npm install
```

Essential variables in `.env`:

- `DEEPSEEK_API_KEY`: model provider.
- `NEATLOGS_API_KEY`: tracing, and the Neat Bot's MCP access.
- `CRUSTDATA_API_KEY`: Research Bot tools.
- `GITHUB_PAT`: GitHub Bot (fine-grained token).
- `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`: web login (`openssl rand -base64 32` for the secret).
- `CFO_OAUTH_CLIENT_ID`, `CFO_TOKEN_KEY`: optional cfo.ai connection (`npm run cfo:register`).

Commands:

- `npm run serve`: web UI and API on port 3000 (`GET /health`).
- `npm start -- "Research Retool and its competitors"`: ask the Primary Bot from the CLI.
- `AGENT=cfo npm start -- "Cash is INR 1200000, burn INR 200000/month. Estimate runway."`: run one specialist directly.
- `npm run dev`: Mastra development environment.
- `npm run typecheck`: check TypeScript.
- `npm run seed`: sync users from `seed-users.json` (copy `seed-users.example.json`).

## Project layout

```
src/       Mastra agents, server, auth, cfo.ai OAuth, usage caps, neatlogs tracing
web/       Chat web app
site/      Judge site (landing page and /judges/ evidence)
company/   Fictional Lumen Labs records used by the demo
docs/      Architecture and demo evidence
video/     Launch video source
data/      Local SQLite and per-user files (git-ignored)
```

## Docs

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): agents, approvals, Neat Bot scoping, cfo.ai OAuth, files workspace, usage caps, neatlogs traces, seed script
- [JUDGE.md](JUDGE.md): judge guide
- [Northwind cap-escalation demo](docs/demo/northwind-cap-escalation.md)
- [Evidence index](site/public/evidence/2026-10-12/README.md)
- [Entire checkpoints](docs/demo/entire-checkpoints.md)

## Credits

The look and feel is inspired by Grok bot, and the UI was built with help from looking at Grok's UI and design.
