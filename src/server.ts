import http from "node:http";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth";
import { requireUser } from "./auth/session";
import { cfoConfigError } from "./cfo/oauth";
import { handleCfoCallback, handleCfoConnect, handleCfoDisconnect, handleCfoStatus } from "./cfo/routes";
import { cfoDb } from "./cfo/store";
import { handleChat, handleChatHistory, listAgents, sendJson } from "./chat-api";
import { createWebHandler } from "./web";

const authHandler = toNodeHandler(auth);

// cfo.ai per-user OAuth: create tables now; routes answer 503 until configured.
cfoDb();
const cfoConfigIssue = cfoConfigError();
if (cfoConfigIssue) console.warn(`cfo.ai connection disabled: ${cfoConfigIssue}. See README "cfo.ai connection".`);

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

  if (req.method === "GET" && url.pathname === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  // Better Auth endpoints (sign-in, sign-out, session)
  if (url.pathname === "/api/auth" || url.pathname.startsWith("/api/auth/")) {
    try {
      await authHandler(req, res);
    } catch (error: unknown) {
      console.error("Auth request failed", error);
      if (!res.headersSent) sendJson(res, 500, { error: "Auth failed" });
      else res.end();
    }
    return;
  }

  // Current user
  if (url.pathname === "/api/me") {
    if (req.method !== "GET") {
      res.writeHead(405, { allow: "GET" }).end();
      return;
    }
    const user = await requireUser(req, res);
    if (!user) return;
    sendJson(res, 200, { user });
    return;
  }

  // Web chat API
  if (url.pathname === "/api/agents") {
    if (req.method !== "GET") {
      res.writeHead(405, { allow: "GET" }).end();
      return;
    }
    const user = await requireUser(req, res);
    if (!user) return;
    sendJson(res, 200, listAgents(user));
    return;
  }

  const historyMatch = url.pathname.match(/^\/api\/chat\/([^/]+)\/history$/);
  if (historyMatch) {
    try {
      const user = await requireUser(req, res);
      if (!user) return;
      await handleChatHistory(decodeURIComponent(historyMatch[1]), req, res, user);
    } catch (error: unknown) {
      console.error("Chat history failed", error);
      if (!res.headersSent) sendJson(res, 500, { error: "Chat history failed" });
      else res.end();
    }
    return;
  }

  const chatMatch = url.pathname.match(/^\/api\/chat\/([^/]+)$/);
  if (chatMatch) {
    try {
      const user = await requireUser(req, res);
      if (!user) return;
      await handleChat(decodeURIComponent(chatMatch[1]), req, res, user);
    } catch (error: unknown) {
      console.error("Web chat failed", error);
      if (!res.headersSent) sendJson(res, 500, { error: "Chat failed" });
      else res.end();
    }
    return;
  }

  // cfo.ai OAuth connection (per signed-in user)
  if (url.pathname.startsWith("/api/cfo/")) {
    const route = url.pathname.slice("/api/cfo/".length);
    const allowed: Record<string, string[]> = {
      connect: ["GET"],
      callback: ["GET"],
      status: ["GET"],
      disconnect: ["POST", "DELETE"],
    };
    const methods = allowed[route];
    if (!methods) {
      res.writeHead(404).end();
      return;
    }
    if (!methods.includes(req.method ?? "")) {
      res.writeHead(405, { allow: methods.join(", ") }).end();
      return;
    }
    try {
      const user = await requireUser(req, res);
      if (!user) return;
      if (route === "connect") await handleCfoConnect(res, user);
      else if (route === "callback") await handleCfoCallback(url, res, user);
      else if (route === "status") handleCfoStatus(res, user);
      else handleCfoDisconnect(res, user);
    } catch (error: unknown) {
      console.error("cfo.ai route failed", (error as Error).message);
      if (!res.headersSent) sendJson(res, 500, { error: "cfo.ai request failed" });
      else res.end();
    }
    return;
  }

  if (url.pathname === "/api" || url.pathname.startsWith("/api/")) {
    res.writeHead(404).end();
    return;
  }

  // Everything else is the web UI (Vite dev middleware, or web/dist in production).
  webHandler(req, res);
});

const webHandler = await createWebHandler(server);

const PORT = Number(process.env.PORT) || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
