import type { UIMessage, UIMessageChunk } from "ai";
import type { TurnCaps } from "./usage/caps";
import type { TurnUsage } from "./usage/turn-budget";

/**
 * "Cap then escalate": a turn stopped by its cap offers a one-time budget extension instead of
 * dead-ending. The offer is saved on the capped reply as `metadata.capEscalation` (state lives on
 * the server; the client only ever sends `{ id, approved }`). Approve runs a continuation turn with
 * the granted budget; Deny runs one tool-less model step that answers from what was gathered.
 */
export type CapEscalationStatus = "pending" | "approved" | "denied" | "dropped";

/** What the client sees of an offer (on `TurnUsage.escalation`, streamed and saved). */
export type EscalationOffer = { id: string; extraCostUsd: number; extraTokens: number; status: CapEscalationStatus };

/** The server-side record on the capped reply. `id` is the capped turn's trace id. */
export type CapEscalation = EscalationOffer & {
  traceId: string;
  question: string;
  findings: string;
};

export type EscalationDecision = { id: string; approved: boolean };

/** Set on a continuation turn's usage, so the client can label it and the capped reply's card. */
export type Continuation = { from: string; decision: "approved" | "denied" };

/**
 * The one-time extension offered for finishing: 1.5 × whichever is larger, the cap or what the
 * turn actually spent. The capped run is unfinished and we cannot know how many steps remain, so
 * "about as much again as it took to get here" is the simplest honest guess; the extra half covers
 * the final synthesis step, which carries the largest context. Rounded up to the cent / 1k tokens.
 */
export function estimateExtension(usage: Pick<TurnUsage, "costUsd" | "tokens" | "capCostUsd" | "capTokens">): TurnCaps {
  const cost = 1.5 * Math.max(usage.capCostUsd, usage.costUsd);
  const tokens = 1.5 * Math.max(usage.capTokens, usage.tokens);
  return { costCapUsd: Math.ceil(cost * 100) / 100, tokenCap: Math.ceil(tokens / 1000) * 1000 };
}

/**
 * Budget for a Deny answer. It runs as a single model step with no tools (maxSteps 1, toolChoice
 * "none"), so its cost is bounded by one call over the context already gathered; the cap is only
 * a backstop and half of the user's own cap is ample for that one step. If it still tripped, the
 * TripWire would drop the answer, which is why it is not made smaller.
 */
export function denyBudget(caps: TurnCaps): TurnCaps {
  return { costCapUsd: caps.costCapUsd / 2, tokenCap: Math.max(1, Math.floor(caps.tokenCap / 2)) };
}

/** A client message carrying a decision: a user message whose metadata is `{ capEscalation: { id, approved } }`. */
export function escalationDecision(message: UIMessage): EscalationDecision | undefined {
  if (message.role !== "user") return undefined;
  const value = (message.metadata as { capEscalation?: unknown } | undefined)?.capEscalation;
  if (!value || typeof value !== "object") return undefined;
  const { id, approved } = value as { id?: unknown; approved?: unknown };
  return typeof id === "string" && id && typeof approved === "boolean" ? { id, approved } : undefined;
}

/** A stored message, narrowed to what is read here. */
type StoredMessage = { id: string; role: string; content: { metadata?: Record<string, unknown> } };

export function isCapEscalation(value: unknown): value is CapEscalation {
  if (!value || typeof value !== "object") return false;
  const e = value as Partial<CapEscalation>;
  return typeof e.id === "string" && typeof e.status === "string" && typeof e.extraCostUsd === "number" && typeof e.extraTokens === "number";
}

/**
 * The escalation still awaiting a decision: only on the newest assistant message (anything later
 * means the user moved on), and only while pending.
 */
export function pendingEscalation<M extends StoredMessage>(messages: readonly M[]): { message: M; escalation: CapEscalation } | undefined {
  const message = [...messages].reverse().find((m) => m.role === "assistant");
  const escalation = message?.content.metadata?.capEscalation;
  return message && isCapEscalation(escalation) && escalation.status === "pending" ? { message, escalation } : undefined;
}

/**
 * The stored replies whose escalation is still pending, with it marked `status` (the escalation is
 * also mirrored on `turnUsage.escalation`, which the client reads, so both are updated).
 */
export function withEscalationStatus<M extends StoredMessage>(messages: readonly M[], status: CapEscalationStatus, id?: string): Pick<M, "id" | "content">[] {
  const updated: Pick<M, "id" | "content">[] = [];
  for (const message of messages) {
    const metadata = message.content.metadata;
    const escalation = metadata?.capEscalation;
    if (message.role !== "assistant" || !isCapEscalation(escalation) || escalation.status !== "pending") continue;
    if (id && escalation.id !== id) continue;
    const usage = metadata?.turnUsage as (TurnUsage & { escalation?: EscalationOffer }) | undefined;
    updated.push({
      id: message.id,
      content: {
        ...message.content,
        metadata: {
          ...metadata,
          capEscalation: { ...escalation, status },
          ...(usage?.escalation ? { turnUsage: { ...usage, escalation: { ...usage.escalation, status } } } : {}),
        },
      },
    });
  }
  return updated;
}

/** Hidden prompt for the continuation turn, built on the server (client text is ignored). */
export function continuationPrompt(escalation: CapEscalation, approved: boolean): string {
  const findings = escalation.findings || "(Nothing was gathered before the stop.)";
  if (approved) {
    return [
      `[Budget extension approved: about $${escalation.extraCostUsd.toFixed(2)} more for this reply only.]`,
      "Your previous reply to the request below stopped at its cost limit before finishing. Finish it now.",
      "Reuse the findings gathered so far (below) as they are: do not re-read files or re-ask specialists whose results are listed. Only delegate work that is marked as not done, and only if the answer needs it. Then give the complete answer.",
      `Original request:\n${escalation.question}`,
      `Findings gathered so far:\n${findings}`,
    ].join("\n\n");
  }
  return [
    "[Budget extension declined.]",
    "Your previous reply to the request below stopped at its cost limit before finishing, and the user declined more budget.",
    "Without calling any tools or specialists, give the best answer you can from the findings below. Start with the line \"Incomplete answer (budget extension declined):\", and say briefly what is missing.",
    `Original request:\n${escalation.question}`,
    `Findings gathered so far:\n${findings}`,
  ].join("\n\n");
}

const MAX_FINDING_CHARS = 6_000;
const MAX_FINDINGS_CHARS = 24_000;

type ToolCall = { name: string; input: unknown; output?: unknown; error?: string };

/**
 * Collects what a turn gathered from its UI stream, for the continuation prompt. Needed because a
 * TripWire abort stores nothing of the turn in the agent's own thread (measured: no user message,
 * no tool results); delegated sub-agents keep their answers only in their own threads.
 */
export class TurnFindings {
  private text = "";
  private readonly calls = new Map<string, ToolCall>();
  private readonly order: string[] = [];

  add(part: UIMessageChunk): void {
    if (part.type === "text-delta") this.text += part.delta;
    else if (part.type === "tool-input-available") {
      if (!this.calls.has(part.toolCallId)) this.order.push(part.toolCallId);
      this.calls.set(part.toolCallId, { name: part.toolName, input: part.input });
    } else if (part.type === "tool-output-available") {
      const call = this.calls.get(part.toolCallId);
      if (call) call.output = part.output;
    } else if (part.type === "tool-output-error") {
      const call = this.calls.get(part.toolCallId);
      if (call) call.error = part.errorText;
    }
  }

  /** The assistant text streamed so far (without the server's cap note). */
  get partialText(): string {
    return this.text;
  }

  /**
   * A compact digest: each specialist's answer (or that it never ran), and the files already read.
   * File contents are left out: the specialists' answers carry what they found, and the list stops
   * the model from re-reading them.
   */
  digest(): string {
    const lines: string[] = [];
    const files: string[] = [];
    let budget = MAX_FINDINGS_CHARS;
    for (const id of this.order) {
      const call = this.calls.get(id)!;
      if (call.name.startsWith("agent-")) {
        const specialist = call.name.slice("agent-".length);
        const text = (call.output as { text?: unknown } | undefined)?.text;
        if (typeof text === "string" && text.trim()) {
          const clipped = clip(text.trim(), Math.min(MAX_FINDING_CHARS, budget));
          budget -= clipped.length;
          lines.push(`### ${specialist} (done)\n${clipped}`);
        } else {
          const ask = (call.input as { prompt?: unknown } | undefined)?.prompt;
          lines.push(`### ${specialist} (NOT done: stopped before it answered)${typeof ask === "string" ? `\nTask it was given: ${clip(ask, 600)}` : ""}`);
        }
      } else if (call.name === "company_read_file") {
        const path = (call.input as { path?: unknown } | undefined)?.path;
        if (typeof path === "string") files.push(path);
      }
    }
    if (files.length) lines.push(`### Files already read by you\n${[...new Set(files)].join(", ")}`);
    if (this.text.trim()) lines.push(`### Your partial reply\n${clip(this.text.trim(), 2_000)}`);
    return lines.join("\n\n");
  }
}

function clip(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, Math.max(0, max - 20))}\n…[truncated]`;
}
