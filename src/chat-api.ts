import type http from "node:http";
import { handleChatStream } from "@mastra/ai-sdk";
import { RequestContext } from "@mastra/core/request-context";
import { toAISdkMessages } from "@mastra/ai-sdk/ui";
import { createUIMessageStream, createUIMessageStreamResponse, type UIMessage, type UIMessageChunk } from "ai";
import { canUseAgent } from "./auth/access";
import { approvalResumeMessage, pendingApprovalIds, withoutPendingApprovals } from "./chat-approvals";
import type { SessionUser } from "./auth/session";
import { mastra } from "./mastra";
import { traceRequest } from "./telemetry";
import { USER_ROLE_KEY, WORKSPACE_USER_KEY } from "./mastra/workspace";
import { getCaps } from "./usage/caps";
import { TURN_BUDGET_KEY, TurnBudget, type TurnUsage } from "./usage/turn-budget";

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
  if (last.role === "user") {
    // Namespace the id by user: storage upserts by message id, so a client-chosen id must not hit another user's rows.
    message = { ...last, id: `${user.id}:${last.id}` };
    await dropPendingApprovals(agentId, user);
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
  const threadId = chatThreadId(user.id, agentId);
  const budget = new TurnBudget(getCaps(user.id, agentId));
  await traceRequest("web", threadId, async (trace) => {
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
      },
      onError: (error) => {
        console.error("Web chat stream failed", { agentId, error });
        return "Sorry, something went wrong while generating a reply.";
      },
    });
    let replyId: string | undefined;
    const stream = withTurnUsage(agentStream, budget, (id) => (replyId = id));
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
      const usage = budget.snapshot(true);
      trace.setAttributes({
        "app.turn_cost_usd": usage.costUsd,
        "app.turn_tokens": usage.tokens,
        "app.turn_steps": usage.steps,
        "app.turn_capped": usage.capped,
      });
      if (usage.reason) trace.addTags(usage.reason === "cost" ? "cost-capped" : "token-capped");
      await saveTurnUsage(agentId, user, replyId, usage).catch((error: unknown) => {
        console.warn("Could not save turn usage", { agentId, error: error instanceof Error ? error.message : error });
      });
    }
  }, { agentId, role: last.role }, { userId: user.id, threadId, agentId, tags: last.role === "assistant" ? ["approval-resume"] : [] });
}

const TURN_USAGE_PART_ID = "turn-usage";

/**
 * Passes the agent's UI stream through, adding a `data-turn-usage` part after every model step
 * (same part id, so the client keeps one up-to-date part per reply) and a final one before the
 * reply finishes. A capped reply also gets a closing text note saying why it stopped. The final
 * usage is attached to the finish part as `messageMetadata.turnUsage`.
 */
function withTurnUsage(
  stream: ReadableStream<UIMessageChunk>,
  budget: TurnBudget,
  onReplyId: (id: string) => void,
): ReadableStream<UIMessageChunk> {
  return createUIMessageStream({
    execute: async ({ writer }) => {
      let open = false;
      let ended = false;
      const writeUsage = (usage: TurnUsage) => writer.write({ type: "data-turn-usage", id: TURN_USAGE_PART_ID, data: usage });
      const writeEnd = (): TurnUsage => {
        ended = true;
        if (budget.capped) {
          const id = `turn-cap-note-${crypto.randomUUID()}`;
          writer.write({ type: "text-start", id });
          writer.write({ type: "text-delta", id, delta: `\n\n${budget.cappedMessage()}` });
          writer.write({ type: "text-end", id });
        }
        const usage = budget.snapshot(true);
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
 * show it. Falls back to the newest assistant message when the stream did not name the reply.
 */
async function saveTurnUsage(agentId: string, user: SessionUser, replyId: string | undefined, usage: TurnUsage) {
  if (usage.steps === 0) return;
  const thread = await ownThread(agentId, user);
  if (!thread) return;
  const { messages } = await thread.memory.recall({ ...thread.ids, perPage: false });
  const reply = (replyId && messages.find((m) => m.id === replyId && m.role === "assistant")) || [...messages].reverse().find((m) => m.role === "assistant");
  if (!reply) return;
  const store = await mastra.getStorage()?.getStore("memory");
  await store?.updateMessages({ messages: [{ id: reply.id, content: { ...reply.content, metadata: { ...reply.content.metadata, turnUsage: usage } } }] });
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
