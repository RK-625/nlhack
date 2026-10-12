import type http from "node:http";
import { handleChatStream } from "@mastra/ai-sdk";
import type { MastraDBMessage } from "@mastra/core/agent";
import { RequestContext } from "@mastra/core/request-context";
import { toAISdkMessages } from "@mastra/ai-sdk/ui";
import { createUIMessageStream, createUIMessageStreamResponse, type UIMessage, type UIMessageChunk } from "ai";
import { canUseAgent } from "./auth/access";
import { approvalResumeMessage, pendingApprovalIds, withoutPendingApprovals } from "./chat-approvals";
import {
  type CapEscalation,
  type Continuation,
  continuationPrompt,
  denyBudget,
  escalationDecision,
  estimateExtension,
  pendingEscalation,
  TurnFindings,
  withEscalationStatus,
} from "./chat-escalation";
import type { SessionUser } from "./auth/session";
import { mastra } from "./mastra";
import { type TraceHandle, traceRequest } from "./telemetry";
import { USER_ROLE_KEY, WORKSPACE_USER_KEY } from "./mastra/workspace";
import { getCaps } from "./usage/caps";
import { TURN_BUDGET_KEY, TurnBudget, type TurnUsage } from "./usage/turn-budget";
import { isTraceOwner } from "./neatlogs/trace-owners";
import {
  checkNeatlogsUsageOnce,
  isNeatlogsUsage,
  isTrackingTrace,
  type NeatlogsUsage,
  pendingNeatlogsUsage,
  trackNeatlogsUsage,
} from "./usage/neatlogs-usage";

const MAX_BODY_BYTES = 1024 * 1024;

export type AgentSummary = { key: string; id: string; name: string; description: string };

/** Without a user, returns every agent; with one, only the agents that user may use. */
export function listAgents(user?: SessionUser): AgentSummary[] {
  return Object.entries(mastra.listAgents())
    .map(([key, agent]) => ({
      key,
      id: agent.id,
      name: agent.name,
      description: agent.getDescription(),
    }))
    .filter((agent) => !user || canUseAgent(user, agent.id));
}

/** Accepts either the Mastra registry key ("cfoAgent") or the agent id ("cfo"). */
export function resolveAgentId(keyOrId: string): string | undefined {
  return listAgents().find((agent) => agent.key === keyOrId || agent.id === keyOrId)?.id;
}

/** One persisted chat per user per agent. */
export function chatThreadId(userId: string, agentId: string): string {
  return `${userId}:${agentId}`;
}

/** POST /api/chat/:agentId — streams an AI SDK v7 UI message stream (SSE). */
export async function handleChat(
  agentKeyOrId: string,
  req: http.IncomingMessage,
  res: http.ServerResponse,
  user: SessionUser,
): Promise<void> {
  if (req.method !== "POST") {
    res.writeHead(405, { allow: "POST" }).end();
    return;
  }
  const agentId = resolveAgentId(agentKeyOrId);
  if (!agentId) {
    sendJson(res, 404, { error: `Unknown agent: ${agentKeyOrId}` });
    return;
  }
  if (!canUseAgent(user, agentId)) {
    sendJson(res, 403, { error: "Forbidden" });
    return;
  }

  // Memory already holds the history, so only the newest message is taken from the body: either a
  // new user message, or the assistant message carrying the user's tool-approval decisions.
  let last: UIMessage;
  try {
    const body = JSON.parse(await readBody(req)) as { messages?: unknown; message?: unknown };
    const candidate = (Array.isArray(body?.messages) ? body.messages.at(-1) : body?.message) as UIMessage | undefined;
    if (!candidate || typeof candidate.id !== "string" || !Array.isArray(candidate.parts)) throw new Error("message required");
    if (candidate.role !== "user" && candidate.role !== "assistant") throw new Error("unsupported role");
    last = candidate;
  } catch (error) {
    const tooLarge = error instanceof BodyTooLargeError;
    sendJson(res, tooLarge ? 413 : 400, {
      error: tooLarge ? "Request body too large" : "Expected JSON body whose last message is a user message or a tool approval",
    });
    return;
  }

  let message: UIMessage;
  // Set when this request decides a capped turn's escalation (Approve/Deny on its card).
  let continued: { escalation: CapEscalation; approved: boolean } | undefined;
  const decision = escalationDecision(last);
  if (decision) {
    // Only the escalation pending on the newest reply in the caller's own thread can be decided,
    // once: a stale, repeated or concurrent decision gets 409, like a stale tool approval. The
    // grant and the prompt come from the stored offer, never from the client (its text is ignored).
    const thread = await ownThread(agentId, user);
    const stored = thread ? (await thread.memory.recall({ ...thread.ids, perPage: false })).messages : [];
    const pending = pendingEscalation(stored);
    if (!thread || !pending || pending.escalation.id !== decision.id || decidingEscalations.has(decision.id)) {
      sendJson(res, 409, { error: "That escalation is no longer pending." });
      return;
    }
    decidingEscalations.add(decision.id);
    try {
      const status = decision.approved ? "approved" : "denied";
      await (await mastra.getStorage()?.getStore("memory"))?.updateMessages({ messages: withEscalationStatus([pending.message], status, decision.id) });
    } finally {
      decidingEscalations.delete(decision.id);
    }
    continued = { escalation: pending.escalation, approved: decision.approved };
    message = {
      id: `${user.id}:${last.id}`,
      role: "user",
      parts: [{ type: "text", text: continuationPrompt(pending.escalation, decision.approved) }],
      metadata: { capEscalation: decision },
    };
  } else if (last.role === "user") {
    // Namespace the id by user: storage upserts by message id, so a client-chosen id must not hit another user's rows.
    message = { ...last, id: `${user.id}:${last.id}` };
    await dropPendingApprovals(agentId, user);
    await dropPendingEscalations(agentId, user);
  } else {
    // Approval response: only decisions for approvals pending in the caller's own thread are kept.
    // It resumes the suspended run; the message itself is not stored.
    const thread = await ownThread(agentId, user);
    const stored = thread ? (await thread.memory.recall({ ...thread.ids, perPage: false })).messages : [];
    const resume = approvalResumeMessage(last, pendingApprovalIds(stored));
    if (!resume) {
      sendJson(res, 409, { error: "That approval is no longer pending." });
      return;
    }
    message = resume;
  }

  // Stop generation when the browser disconnects.
  const abort = new AbortController();
  res.on("close", () => {
    if (!res.writableFinished) abort.abort();
  });

  // Only the message is taken from the client: other AgentExecutionOptions (instructions,
  // maxSteps, tools, runId...) must not be client-controlled. Memory thread and resource always
  // come from the session, never from the client, and so does the RequestContext that selects the
  // user's private file folder, cfo.ai connection and Neatlogs trace scope (also on approval
  // resumes, so an approved delete or cfo.ai change runs as this user). With
  // an approval message (last role "assistant"), handleChatStream resumes each approved/denied
  // tool call by its run id instead.
  // The span covers stream creation and the whole response write, so it ends only once the run
  // has finished (or the client disconnected). The thread id is the Neatlogs session, so one
  // conversation with an agent groups as a single session.
  //
  // Each turn (this request) gets a TurnBudget holding the user's caps for this agent; the
  // turn-budget processor on every agent adds each model step's usage to it (also for delegated
  // sub-agents, which share it through the RequestContext) and stops the run once a cap is
  // exceeded. The caps are the ones for the agent the user is chatting with, never a sub-agent's.
  //
  // Once the trace has ended (after the reply is sent), Neatlogs' own cost and tokens for this
  // turn's trace are fetched in the background and saved on the reply as metadata.neatlogsUsage.
  //
  // A capped turn offers a one-time extension (src/chat-escalation.ts). Approve continues with the
  // granted budget instead of the caps; Deny gets one tool-less step on a small backstop budget.
  // Neither changes the stored caps. A Deny answer never offers another extension.
  const threadId = chatThreadId(user.id, agentId);
  const caps = getCaps(user.id, agentId);
  const budget = new TurnBudget(
    !continued ? caps
    : continued.approved ? { costCapUsd: continued.escalation.extraCostUsd, tokenCap: continued.escalation.extraTokens }
    : denyBudget(caps),
  );
  const continuation: Continuation | undefined = continued && { from: continued.escalation.id, decision: continued.approved ? "approved" : "denied" };
  const turn: TurnContext = {
    findings: new TurnFindings(),
    continuation,
    offerEscalation: !continued || continued.approved,
    question: continued ? continued.escalation.question : last.role === "user" ? uiMessageText(message) : "",
    priorFindings: continued?.escalation.findings,
    userMessage: last.role === "user" ? message : undefined,
    startedAt: new Date(),
  };
  const tags = last.role === "assistant" ? ["approval-resume"] : continued ? [continued.approved ? "cap-escalation-approved" : "cap-escalation-denied"] : [];
  let savedReply: { id: string; traceId: string } | undefined;
  await traceRequest("web", threadId, async (trace) => {
    if (continued) {
      // Links this turn to the capped turn it continues (that turn's trace id is the escalation id).
      trace.setAttributes({
        "app.cap_escalation_from_trace": continued.escalation.traceId,
        "app.cap_escalation_decision": continued.approved ? "approved" : "denied",
        "app.cap_escalation_extra_usd": continued.approved ? continued.escalation.extraCostUsd : 0,
      });
    }
    const requestContext = new RequestContext<unknown>([
      [WORKSPACE_USER_KEY, user.id],
      [USER_ROLE_KEY, user.role],
      [TURN_BUDGET_KEY, budget],
    ]);
    const agentStream = await handleChatStream({
      mastra,
      agentId,
      version: "v7",
      params: {
        messages: [message],
        memory: { thread: threadId, resource: user.id },
        requestContext,
        abortSignal: abort.signal,
        ...(continued && !continued.approved ? { maxSteps: 1, toolChoice: "none" as const } : {}),
      },
      onError: (error) => {
        console.error("Web chat stream failed", { agentId, error });
        return "Sorry, something went wrong while generating a reply.";
      },
    });
    let replyId: string | undefined;
    const stream = withTurnUsage(agentStream, budget, trace.traceId, turn, (id) => (replyId = id));
    const response = createUIMessageStreamResponse({ stream });

    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.flushHeaders();
    try {
      if (response.body) {
        for await (const chunk of response.body) {
          if (abort.signal.aborted) break;
          res.write(chunk);
        }
      }
    } finally {
      res.end();
      const usage = turnUsage(budget, trace.traceId, turn, true);
      trace.setAttributes({
        "app.turn_cost_usd": usage.costUsd,
        "app.turn_tokens": usage.tokens,
        "app.turn_steps": usage.steps,
        "app.turn_capped": usage.capped,
      });
      if (usage.reason) markCappedTrace(trace, budget, agentId);
      const savedId = await saveTurnUsage(agentId, user, replyId, usage, turn).catch((error: unknown) => {
        console.warn("Could not save turn usage", { agentId, error: error instanceof Error ? error.message : error });
        return undefined;
      });
      if (savedId) savedReply = { id: savedId, traceId: trace.traceId };
    }
  }, { agentId, role: last.role, ...(continuation ? { continuation } : {}) }, { userId: user.id, threadId, agentId, tags });

  // The trace's root span has ended now, so the exporter can flush it. Not awaited: the reply is
  // already complete; the browser polls GET .../messages/:id/neatlogs-usage for the result.
  if (savedReply) {
    const reply = savedReply;
    void trackNeatlogsUsage(reply.traceId, (neatlogsUsage) => saveNeatlogsUsage(agentId, user, reply.id, neatlogsUsage));
  }
}

/**
 * A capped turn finished without doing its job, so its trace must not read as OK in Neatlogs: the
 * root span gets status ERROR, a `turn.capped` event and attributes saying which limit stopped it,
 * the cap and the amount spent, and which agent's model step went over (the chatted-with agent or
 * a delegated sub-agent). Spend per agent is kept as JSON, since attributes must be primitives.
 */
function markCappedTrace(trace: TraceHandle, budget: TurnBudget, agentId: string): void {
  const reason = budget.reason;
  if (!reason) return;
  const limit = reason === "cost" ? budget.caps.costCapUsd : budget.caps.tokenCap;
  const spent = reason === "cost" ? Math.round(budget.costUsd * 1e6) / 1e6 : budget.tokens;
  const byAgent = Object.fromEntries(
    [...budget.byAgent].map(([id, spend]) => [id, { ...spend, costUsd: Math.round(spend.costUsd * 1e6) / 1e6 }]),
  );
  const attributes = {
    "app.turn_cap_reason": reason,
    "app.turn_cap_limit": limit,
    "app.turn_cap_spent": spent,
    "app.turn_cap_steps": budget.steps,
    "app.turn_cap_agent_id": agentId,
    "app.turn_cap_tripped_by": budget.trippedBy?.agentId ?? "unknown",
    "app.turn_cap_tripped_step": budget.trippedBy?.step ?? budget.steps,
    "app.turn_cap_spend_by_agent": JSON.stringify(byAgent),
  };
  trace.addTags(reason === "cost" ? "cost-capped" : "token-capped");
  trace.setAttributes(attributes);
  trace.addEvent("turn.capped", attributes);
  trace.setError(budget.cappedMessage());
}

const TURN_USAGE_PART_ID = "turn-usage";

/** Escalation ids being decided right now: a concurrent second decision for one gets 409. */
const decidingEscalations = new Set<string>();

/** Per-turn state the stream wrapper and the end-of-turn save share. */
type TurnContext = {
  /** What the turn gathered, collected from its stream (for a later continuation prompt). */
  findings: TurnFindings;
  /** Set when this turn continues a capped one after an Approve/Deny. */
  continuation?: Continuation;
  /** Whether a cap on this turn offers an extension (not for a Deny answer). */
  offerEscalation: boolean;
  /** The user's original request (carried over across continuations). */
  question: string;
  /** Findings of the capped turn this one continues, so a second cap keeps them. */
  priorFindings?: string;
  /** The user message that started the turn (not set on approval resumes). */
  userMessage?: UIMessage;
  startedAt: Date;
};

/** The turn's usage, with the escalation offer on the final usage of a capped turn. */
function turnUsage(budget: TurnBudget, traceId: string, turn: TurnContext, final: boolean): TurnUsage & { traceId: string } {
  const usage: TurnUsage & { traceId: string } = { ...budget.snapshot(final), traceId };
  if (turn.continuation) usage.continuation = turn.continuation;
  if (final && budget.capped && turn.offerEscalation) {
    const extension = estimateExtension(usage);
    usage.escalation = { id: traceId, extraCostUsd: extension.costCapUsd, extraTokens: extension.tokenCap, status: "pending" };
  }
  return usage;
}

/** The server-side escalation record saved on a capped reply. */
function escalationRecord(usage: TurnUsage & { traceId: string }, turn: TurnContext): CapEscalation | undefined {
  if (!usage.escalation) return undefined;
  const findings = [turn.priorFindings, turn.findings.digest()].filter(Boolean).join("\n\n");
  return { ...usage.escalation, traceId: usage.traceId, question: turn.question, findings };
}

function uiMessageText(message: UIMessage): string {
  return message.parts.map((part) => (part.type === "text" ? part.text : "")).join("").trim();
}

/**
 * Passes the agent's UI stream through, adding a `data-turn-usage` part after every model step
 * (same part id, so the client keeps one up-to-date part per reply) and a final one before the
 * reply finishes. A capped reply also gets a closing text note saying why it stopped. The final
 * usage is attached to the finish part as `messageMetadata.turnUsage`.
 */
function withTurnUsage(
  stream: ReadableStream<UIMessageChunk>,
  budget: TurnBudget,
  traceId: string,
  turn: TurnContext,
  onReplyId: (id: string) => void,
): ReadableStream<UIMessageChunk> {
  return createUIMessageStream({
    execute: async ({ writer }) => {
      let open = false;
      let ended = false;
      const writeUsage = (usage: TurnUsage) =>
        writer.write({ type: "data-turn-usage", id: TURN_USAGE_PART_ID, data: { ...usage, traceId, ...(turn.continuation ? { continuation: turn.continuation } : {}) } });
      const writeEnd = (): TurnUsage => {
        ended = true;
        if (budget.capped) {
          const id = `turn-cap-note-${crypto.randomUUID()}`;
          writer.write({ type: "text-start", id });
          writer.write({ type: "text-delta", id, delta: `\n\n${budget.cappedMessage()}` });
          writer.write({ type: "text-end", id });
        }
        const usage = turnUsage(budget, traceId, turn, true);
        writeUsage(usage);
        return usage;
      };
      budget.onStep = (usage) => {
        if (!open || ended) return;
        try {
          writeUsage(usage);
        } catch {
          // The response is already closed (client gone); usage is still saved at the end.
        }
      };
      try {
        for await (const part of stream) {
          turn.findings.add(part);
          if (part.type === "start") {
            open = true;
            if (part.messageId) onReplyId(part.messageId);
          }
          if (part.type === "finish" && open && !ended) {
            const usage = writeEnd();
            const metadata = typeof part.messageMetadata === "object" && part.messageMetadata ? part.messageMetadata : {};
            writer.write({ ...part, messageMetadata: { ...metadata, turnUsage: usage } });
            continue;
          }
          writer.write(part);
        }
        // A stream that ended without a finish part (aborted or failed) still reports its usage.
        if (open && !ended) writeEnd();
      } finally {
        budget.onStep = undefined;
      }
    },
  });
}

/**
 * Saves the turn's final usage on the stored reply as `metadata.turnUsage`, so a reloaded chat can
 * show it, with `metadata.neatlogsUsage` marked pending until Neatlogs' own numbers arrive. Falls
 * back to the newest assistant message when the stream did not name the reply. Resolves to the
 * reply's id, or undefined when nothing was saved.
 */
async function saveTurnUsage(
  agentId: string,
  user: SessionUser,
  replyId: string | undefined,
  usage: TurnUsage & { traceId: string },
  turn: TurnContext,
): Promise<string | undefined> {
  if (usage.steps === 0) return undefined;
  const thread = await ownThread(agentId, user);
  if (!thread) return undefined;
  const { messages } = await thread.memory.recall({ ...thread.ids, perPage: false });
  const neatlogsUsage = process.env.NEATLOGS_API_KEY ? pendingNeatlogsUsage(usage.traceId) : undefined;
  const capEscalation = escalationRecord(usage, turn);
  const extra = { turnUsage: usage, ...(neatlogsUsage ? { neatlogsUsage } : {}), ...(capEscalation ? { capEscalation } : {}) };
  let reply = replyId ? messages.find((m) => m.id === replyId && m.role === "assistant") : undefined;
  if (!reply && usage.capped) {
    // A capped run ends in a TripWire, after which Mastra stores nothing of the turn in this
    // thread (measured: not even the user message). Store what the user saw, the request and the
    // partial reply text, so the chat survives a reload and the escalation can be decided.
    const ids = { threadId: thread.ids.threadId, resourceId: thread.ids.resourceId };
    const toSave: MastraDBMessage[] = [];
    if (turn.userMessage && !messages.some((m) => m.id === turn.userMessage!.id)) {
      const metadata = turn.userMessage.metadata as Record<string, unknown> | undefined;
      toSave.push({
        id: turn.userMessage.id,
        role: "user",
        createdAt: turn.startedAt,
        ...ids,
        content: { format: 2, parts: [{ type: "text", text: uiMessageText(turn.userMessage) }], ...(metadata ? { metadata } : {}) },
      });
    }
    // Mastra drops empty messages, including their escalation metadata.
    const text = turn.findings.partialText.trim() || "This reply stopped at its budget limit before an answer was ready.";
    const saved: MastraDBMessage = {
      id: replyId ?? crypto.randomUUID(),
      role: "assistant",
      createdAt: new Date(Math.max(Date.now(), turn.startedAt.getTime() + 1)),
      ...ids,
      content: { format: 2, parts: [{ type: "text", text }], metadata: extra },
    };
    toSave.push(saved);
    await thread.memory.saveMessages({ messages: toSave });
    return neatlogsUsage ? saved.id : undefined;
  }
  reply ??= [...messages].reverse().find((m) => m.role === "assistant");
  if (!reply) return undefined;
  const store = await mastra.getStorage()?.getStore("memory");
  await store?.updateMessages({
    messages: [{ id: reply.id, content: { ...reply.content, metadata: { ...reply.content.metadata, ...extra } } }],
  });
  return neatlogsUsage ? reply.id : undefined;
}

/** The caller's own stored assistant message with this id, or undefined. */
async function ownReply(agentId: string, user: SessionUser, messageId: string) {
  const thread = await ownThread(agentId, user);
  if (!thread) return undefined;
  const { messages } = await thread.memory.recall({ ...thread.ids, perPage: false });
  return messages.find((m) => m.id === messageId && m.role === "assistant");
}

/** Saves Neatlogs' numbers on the reply (re-read first, so other metadata is kept). */
async function saveNeatlogsUsage(agentId: string, user: SessionUser, messageId: string, neatlogsUsage: NeatlogsUsage): Promise<void> {
  const reply = await ownReply(agentId, user, messageId);
  if (!reply) return; // the chat was cleared meanwhile
  const store = await mastra.getStorage()?.getStore("memory");
  await store?.updateMessages({ messages: [{ id: reply.id, content: { ...reply.content, metadata: { ...reply.content.metadata, neatlogsUsage } } }] });
}

/** A reply with no answer yet is looked up again at most this often (per request). */
const RECHECK_AFTER_MS = 10_000;

/**
 * GET /api/chat/:agentId/messages/:messageId/neatlogs-usage — Neatlogs' own cost and tokens for one
 * of the caller's own replies: `{ neatlogsUsage }` (pending, ready or unavailable). Only replies in
 * the caller's own thread are found (404 otherwise), and only the trace id the server saved on that
 * reply, recorded as the caller's own trace, is looked up. When no background poll is running for
 * it (it gave up, or the server restarted) and the last check is old enough, it is checked once more.
 */
export async function handleNeatlogsUsage(
  agentKeyOrId: string,
  messageId: string,
  req: http.IncomingMessage,
  res: http.ServerResponse,
  user: SessionUser,
): Promise<void> {
  if (req.method !== "GET") {
    res.writeHead(405, { allow: "GET" }).end();
    return;
  }
  const agentId = resolveAgentId(agentKeyOrId);
  if (!agentId) {
    sendJson(res, 404, { error: `Unknown agent: ${agentKeyOrId}` });
    return;
  }
  if (!canUseAgent(user, agentId)) {
    sendJson(res, 403, { error: "Forbidden" });
    return;
  }
  const reply = await ownReply(agentId, user, messageId);
  if (!reply) {
    sendJson(res, 404, { error: "Message not found" });
    return;
  }
  const metadata = reply.content.metadata as { neatlogsUsage?: unknown } | undefined;
  const stored = isNeatlogsUsage(metadata?.neatlogsUsage) ? metadata.neatlogsUsage : null;
  if (!stored || stored.status === "ready" || isTrackingTrace(stored.traceId)) {
    sendJson(res, 200, { neatlogsUsage: stored });
    return;
  }
  const lastChecked = Date.parse(stored.checkedAt);
  if ((Number.isFinite(lastChecked) && Date.now() - lastChecked < RECHECK_AFTER_MS) || !isTraceOwner(stored.traceId, user.id)) {
    sendJson(res, 200, { neatlogsUsage: stored });
    return;
  }
  const fresh = await checkNeatlogsUsageOnce(stored.traceId);
  await saveNeatlogsUsage(agentId, user, reply.id, fresh).catch((error: unknown) => {
    console.warn("Could not save Neatlogs usage", { agentId, error: error instanceof Error ? error.message : error });
  });
  sendJson(res, 200, { neatlogsUsage: fresh });
}

/** GET/DELETE /api/chat/:agentId/history — read or clear the caller's own chat with one agent. */
export async function handleChatHistory(
  agentKeyOrId: string,
  req: http.IncomingMessage,
  res: http.ServerResponse,
  user: SessionUser,
): Promise<void> {
  if (req.method !== "GET" && req.method !== "DELETE") {
    res.writeHead(405, { allow: "GET, DELETE" }).end();
    return;
  }
  const agentId = resolveAgentId(agentKeyOrId);
  if (!agentId) {
    sendJson(res, 404, { error: `Unknown agent: ${agentKeyOrId}` });
    return;
  }
  if (!canUseAgent(user, agentId)) {
    sendJson(res, 403, { error: "Forbidden" });
    return;
  }

  const thread = await ownThread(agentId, user);
  if (req.method === "DELETE") {
    if (thread) await thread.memory.deleteThread(thread.ids.threadId);
    res.writeHead(204).end();
    return;
  }
  if (!thread) {
    sendJson(res, 200, { messages: [] });
    return;
  }
  const { messages } = await thread.memory.recall({ ...thread.ids, perPage: false });
  sendJson(res, 200, { messages: toAISdkMessages(messages, { version: "v7" }) });
}

/**
 * The caller's own saved chat with an agent, or undefined when there is none. The thread id embeds
 * the user id and the resource id is checked, so only the caller's own chat is reachable.
 */
async function ownThread(agentId: string, user: SessionUser) {
  const agent = Object.values(mastra.listAgents()).find((a) => a.id === agentId);
  const memory = await agent?.getMemory();
  const threadId = chatThreadId(user.id, agentId);
  const thread = memory ? await memory.getThreadById({ threadId }) : null;
  if (!memory || thread?.resourceId !== user.id) return undefined;
  return { memory, ids: { threadId, resourceId: user.id } };
}

/**
 * A new user message moves past any approval still awaiting a decision: it is cleared from the
 * stored history (so it is no longer offered, and a late decision gets 409) and its suspended run
 * is discarded, deleting the same snapshot rows Mastra deletes when an agent run finishes. For an
 * approval raised by a delegated sub-agent, the sub-agent's own suspended run is discarded too.
 */
async function dropPendingApprovals(agentId: string, user: SessionUser): Promise<void> {
  const thread = await ownThread(agentId, user);
  if (!thread) return;
  const { messages } = await thread.memory.recall({ ...thread.ids, perPage: false });
  const dropped = withoutPendingApprovals(messages);
  if (dropped.messages.length === 0) return;
  const storage = mastra.getStorage();
  await (await storage?.getStore("memory"))?.updateMessages({ messages: dropped.messages });
  const workflows = await storage?.getStore("workflows");
  for (const runId of dropped.runIds) {
    await workflows?.deleteWorkflowRunById({ runId, workflowName: "agentic-loop" });
    await workflows?.deleteWorkflowRunById({ runId, workflowName: "executionWorkflow" });
  }
}

/** A new user message moves past a pending escalation too: it is marked dropped (a late decision gets 409). */
async function dropPendingEscalations(agentId: string, user: SessionUser): Promise<void> {
  const thread = await ownThread(agentId, user);
  if (!thread) return;
  const { messages } = await thread.memory.recall({ ...thread.ids, perPage: false });
  const dropped = withEscalationStatus(messages, "dropped");
  if (dropped.length === 0) return;
  await (await mastra.getStorage()?.getStore("memory"))?.updateMessages({ messages: dropped });
}

export function sendJson(res: http.ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

class BodyTooLargeError extends Error {}

async function readBody(req: http.IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > MAX_BODY_BYTES) throw new BodyTooLargeError();
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString("utf8");
}
