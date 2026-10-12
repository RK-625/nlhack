# Entire Checkpoints: Walkthrough for the Northwind Fix

Evidence date: 12 October 2026. All output below is real CLI output from this
repo (`entire` CLI, installed locally), saved in
[`evidence/2026-10-12/`](evidence/2026-10-12/).

## How Entire is used in this repo

- Entire is enabled in this repo (`.entire/settings.json`, checkpoint storage type
  `git-refs`). Git hooks (`prepare-commit-msg`, `commit-msg`, `post-commit`,
  `post-rewrite`, `pre-push`) are installed.
- Each commit made during a recorded coding session gets an
  `Entire-Checkpoint: <26-char id>` trailer. The checkpoint holds the session
  record (agent, model, prompts/transcript, files touched, token usage) and is
  stored on separate refs, `refs/entire/checkpoints/<last-2-chars>/<id>`, not on
  `main`.
- The `pre-push` hook pushes those refs alongside normal pushes. At the time of
  writing, 79 `refs/entire/*` refs exist on `origin`, including all six key
  commits below ([evidence 26](evidence/2026-10-12/26-entire-checkpoint-trailers-and-refs.txt)).
- 75 of 92 commits at the 2026-10-12 snapshot carry the trailer
  ([repo-checkpoints.txt](../../site/public/evidence/2026-10-12/repo-checkpoints.txt)).
- Inspect with `entire checkpoint explain <commit-sha|checkpoint-id>`
  (`--short`, `--full`, `--raw-transcript`, `--generate` for an AI summary) and
  `entire checkpoint tokens <id>`.

## Key commits and checkpoints

| Commit | Checkpoint | What the session did (as recorded) | Why it matters |
|---|---|---|---|
| `030a0a75` mark capped turns as errors | `01M4QHHF20ZKNXDC7W1S1K58S6` | Claude Code (claude-sonnet-5-5), session `b91df2cd`. 5 files: `package.json`, `package-lock.json`, `src/chat-api.ts`, `src/telemetry.ts`, `src/usage/turn-budget.ts`. Tokens recorded as 0; transcript fails to parse in `explain`. | Capped runs show as ERROR in Neatlogs: the failure is visible. |
| `729df669` one-time budget extension | `01M4QJDNMAYES40487HGRGPDMZ` | Same Claude Code session. 3 files: `src/chat-api.ts`, `src/chat-escalation.ts`, `src/usage/turn-budget.ts`. Tokens 0. | Server-side escalate: Approve/Deny instead of a dead end. |
| `f3f783d7` Approve/Deny card | `01M4QJDQ5AX3B2A2GM7R0CR8CK` | Same session. 6 web files (`useAgentChat.ts`, `turn-usage.ts`, `ChatPane.tsx`, `MessageBubble.tsx`, `MessageList.tsx`, `SidebarPanels.tsx`). Tokens 0. | The human-facing escalation card. |
| `8887e9ba` reuse company facts in delegated briefs | `01M4QMYG0STA2ZQR90286XF297` | **Codex** (gpt-6.1-sol), session `01a12f3f`, 6041.7k tokens, 45 API calls. 1 file: `src/mastra/prompts/index.ts`. Recorded transcript: resumed the unfinished Sprint 3 fix, checked six saved benchmark runs, reported CFO file reads 29 to 10 (-65.5%), total benchmark cost -3.3%, ran Approve/Deny browser checks. | The fix commit. See "What 8887e9ba shows" below. |
| `6a90ff93` preserve empty capped replies | `01M4QMZVXWXKFYB8569FRC5FH4` | Codex + Claude Code in the same checkpoint, session `140a07e0`, 878k tokens. 1 file: `src/chat-api.ts`. Prompt is a hand-back message from a Claude subagent. | Bug found while verifying: empty capped reply lost its card on reload. |
| `f162e518` single tilde rendering | `01M4QR94CNVKS23A630X1FAPD3` | Claude Code (claude-opus-5-5, claude-sonnet-5-5), session `b91df2cd`. 1 file: `markdown.web.tsx`. Tokens 0. | Polish found while checking the approved answer. |

### What `8887e9ba` shows (and does not)

Shows: the agent, model, token cost, the one file changed, and the verification
narrative: benchmark outcome (CFO reads 29 to 10, all three "after" runs within
default caps versus two of three before), the empty-reply bug found, and the
Approve/Deny browser checks.

Does **not** show: the original trace diagnosis that led to the fix. The
Codex session only picks up a fix that was already present but uncommitted
("the fix ... is present but uncommitted"), left by an earlier Claude session.
The diagnosis itself lives in Neatlogs (trace `0ce0e491...`) and the Neat Bot
captures (`08`-`11`), not in this checkpoint. The checkpoint's AI summary has not
been generated (`entire checkpoint explain --generate` would create one; not run).
The checkpoint's "Intent" field is just an app-open marker, so say "session
record", not "intent".

## 30-45 second shot list

Run from the repo root in a clean terminal, large font.

1. (0-8 s) Trailers on the story commits:
   `git log --format='%h %s%n    %(trailers:key=Entire-Checkpoint)' 030a0a75^..f162e518 | head -30`
   (or the 6 commits individually; saved as evidence 26).
2. (8-25 s) The fix commit's checkpoint:
   `entire checkpoint explain 8887e9ba --short`, then `entire checkpoint tokens 01M4QMYG0STA2ZQR90286XF297`.
   Say: "this session resumed the cap work, measured CFO reads 29 to 10, and
   found the empty-reply bug."
3. (25-35 s) Optional full view: `entire checkpoint explain 8887e9ba | less`. Do
   not scroll through the top: the user turns include local file paths and pasted
   channel context (see limits).
4. (35-45 s) Cut to Neatlogs before/after traces (screenshots `17`, `18`) and say
   the checkpoint is the coding record, the trace is the runtime record.

Web view: entire.io shows checkpoints per repository and branch after signing in
and connecting the repo via the Entire GitHub App, per
[Entire docs](https://docs.entire.io/platforms/cli-and-entire-io). I am not logged
in (`entire auth status`: not logged in), so I have not confirmed the repo is
connected or what its URL is. The CLI is the verified path.

## Honest limits

- Checkpoints record the **coding agents' sessions** (Claude Code, Codex), not the
  Mastra runtime agents (CFO, Primary Bot). Runtime behaviour is in Neatlogs.
- Three of the six checkpoints record tokens as 0; `030a0a75` transcript fails to
  parse in `explain`. Those show files and metadata only.
- `8887e9ba` is a Codex continuation of an earlier Claude session; the root-cause
  analysis is not in it (see above).
- The GitHub repo `RK-625/nlhack` is **private**. The checkpoint refs are on
  `origin` and so private too: judges cannot run `entire checkpoint explain` or see
  transcripts without repo access. Public evidence is the saved text in
  `evidence/2026-10-12/`.
- Some transcripts include local paths, screenshot temp paths and pasted
  third-party channel text. The saved evidence redacts the email and local home
  path and omits user/tool turns. If the repo is made public, the full
  transcripts become public: review them first.
- The saved evidence files are excerpts; nothing was edited beyond redaction.
