# NeatLogs Hackathon Project

This project is being developed for the **NeatLogs Hackathon**.

## Problem Statement

> **Build an AI agent that completes a substantial real-world task from start to finish, using neatlogs to trace and improve its runs and Entire to capture coding context and checkpoints, with other partner tools as optional enhancements.**

## Overview

WhatsApp messages go to the **Assistant**, the primary orchestrator. It handles general conversation directly and delegates company and market research to the **Market Researcher**, which owns the Crustdata company search, enrichment, and web search tools. The Assistant synthesizes the findings into a reply with sources.

The Assistant has a six-step execution limit, and each delegated research run has a twelve-step limit. Both agents remain registered in Mastra for direct development and inspection. Conversation memory is not configured yet, so separate WhatsApp messages do not currently share model context.

## Run locally

Copy `.env.example` to `.env` and fill in the provider and integration credentials.

- `npm start -- "Research Retool and its competitors"` — run the primary Assistant.
- `AGENT=market-researcher npm start -- "Research Retool"` — run the specialist directly.
- `npm run bot` — start the WhatsApp webhook server at `/api/webhooks/whatsapp` (port 3000 by default).
- `npm run dev` — open the Mastra development environment.
- `npm run typecheck` — check TypeScript.

## Key Integrations

- **NeatLogs**: Dependency installed; runtime tracing still needs to be wired up.
- **Entire**: Coding-context hooks and checkpoint settings are configured.
