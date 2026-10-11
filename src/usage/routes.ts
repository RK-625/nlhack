import type http from "node:http";
import { canUseAgent } from "../auth/access";
import type { SessionUser } from "../auth/session";
import { resolveAgentId, sendJson } from "../chat-api";
import { DEFAULT_CAPS, getCaps, parseCaps, resetCaps, setCaps } from "./caps";

const MAX_BODY_BYTES = 16 * 1024;

/**
 * GET/PUT/DELETE /api/agents/:agentId/caps — the caller's own per-turn caps for one agent.
 * GET → { costCapUsd, tokenCap, defaults }; PUT { costCapUsd, tokenCap } saves them; DELETE resets
 * to the defaults. Only the signed-in user's own caps are ever read or written.
 */
export async function handleAgentCaps(
  agentKeyOrId: string,
  req: http.IncomingMessage,
  res: http.ServerResponse,
  user: SessionUser,
): Promise<void> {
  const method = req.method ?? "";
  if (method !== "GET" && method !== "PUT" && method !== "DELETE") {
    res.writeHead(405, { allow: "GET, PUT, DELETE" }).end();
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

  if (method === "PUT") {
    let body: unknown;
    try {
      body = JSON.parse(await readBody(req));
    } catch {
      sendJson(res, 400, { error: "Expected a JSON body { costCapUsd, tokenCap }" });
      return;
    }
    const caps = parseCaps(body);
    if (typeof caps === "string") {
      sendJson(res, 400, { error: caps });
      return;
    }
    setCaps(user.id, agentId, caps);
  } else if (method === "DELETE") {
    resetCaps(user.id, agentId);
  }
  sendJson(res, 200, { ...getCaps(user.id, agentId), defaults: DEFAULT_CAPS });
}

async function readBody(req: http.IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > MAX_BODY_BYTES) throw new Error("Request body too large");
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString("utf8");
}
