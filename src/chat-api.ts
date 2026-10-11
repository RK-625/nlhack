import type http from "node:http";
import { handleChatStream } from "@mastra/ai-sdk";
import { toAISdkMessages } from "@mastra/ai-sdk/ui";
import { createUIMessageStreamResponse, type UIMessage } from "ai";
import { canUseAgent } from "./auth/access";
import type { SessionUser } from "./auth/session";
import { mastra } from "./mastra";

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
function resolveAgentId(keyOrId: string): string | undefined {
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

  // Memory already holds the history, so only the newest (user) message is taken from the body.
  let message: UIMessage;
  try {
    const body = JSON.parse(await readBody(req)) as { messages?: unknown; message?: unknown };
    const last = (Array.isArray(body?.messages) ? body.messages.at(-1) : body?.message) as UIMessage | undefined;
    if (!last || last.role !== "user" || typeof last.id !== "string") throw new Error("user message required");
    // Namespace the id by user: storage upserts by message id, so a client-chosen id must not hit another user's rows.
    message = { ...last, id: `${user.id}:${last.id}` };
  } catch (error) {
    const tooLarge = error instanceof BodyTooLargeError;
    sendJson(res, tooLarge ? 413 : 400, {
      error: tooLarge ? "Request body too large" : "Expected JSON body whose last message has role \"user\"",
    });
    return;
  }

  // Stop generation when the browser disconnects.
  const abort = new AbortController();
  res.on("close", () => {
    if (!res.writableFinished) abort.abort();
  });

  // Only the user message is taken from the client: other AgentExecutionOptions (instructions,
  // maxSteps, tools...) must not be client-controlled. Memory thread and resource always come
  // from the session, never from the client.
  const stream = await handleChatStream({
    mastra,
    agentId,
    version: "v7",
    params: {
      messages: [message],
      memory: { thread: chatThreadId(user.id, agentId), resource: user.id },
      abortSignal: abort.signal,
    },
    onError: (error) => {
      console.error("Web chat stream failed", { agentId, error });
      return "Sorry, something went wrong while generating a reply.";
    },
  });
  const response = createUIMessageStreamResponse({ stream });

  res.writeHead(response.status, Object.fromEntries(response.headers));
  res.flushHeaders();
  if (!response.body) {
    res.end();
    return;
  }
  try {
    for await (const chunk of response.body) {
      if (abort.signal.aborted) break;
      res.write(chunk);
    }
  } finally {
    res.end();
  }
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

  // The thread id embeds the user id and the resource id is checked, so only the caller's own chat is reachable.
  const agent = Object.values(mastra.listAgents()).find((a) => a.id === agentId);
  const memory = await agent?.getMemory();
  const threadId = chatThreadId(user.id, agentId);
  const thread = memory ? await memory.getThreadById({ threadId }) : null;
  const owned = thread?.resourceId === user.id;

  if (req.method === "DELETE") {
    if (memory && owned) await memory.deleteThread(threadId);
    res.writeHead(204).end();
    return;
  }
  if (!memory || !owned) {
    sendJson(res, 200, { messages: [] });
    return;
  }
  const { messages } = await memory.recall({ threadId, resourceId: user.id, perPage: false });
  sendJson(res, 200, { messages: toAISdkMessages(messages, { version: "v7" }) });
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
