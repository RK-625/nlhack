import type { ServerResponse } from "node:http";
import type { SessionUser } from "../auth/session";
import {
  CfoOAuthError,
  cfoConfigError,
  completeCfoAuthorization,
  disconnectCfo,
  getCfoStatus,
  startCfoAuthorization,
} from "./oauth";

// HTTP handlers for /api/cfo/*; server.ts resolves the session user first.

function json(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  res.end(JSON.stringify(body));
}

function redirect(res: ServerResponse, location: string): void {
  res.writeHead(302, { location, "cache-control": "no-store" });
  res.end();
}

function notConfigured(res: ServerResponse, reason: string): void {
  json(res, 503, { error: "cfo.ai connection is not configured on this server", reason });
}

// GET /api/cfo/connect -> 302 to the authorization server.
export async function handleCfoConnect(res: ServerResponse, user: SessionUser): Promise<void> {
  const reason = cfoConfigError();
  if (reason) return notConfigured(res, reason);
  try {
    redirect(res, await startCfoAuthorization(user.id));
  } catch (error: unknown) {
    console.error(`cfo.ai connect failed for user ${user.id}: ${(error as Error).message}`);
    redirect(res, "/?cfo=error");
  }
}

// GET /api/cfo/callback?code&state[&iss] -> store tokens, back to the app.
export async function handleCfoCallback(url: URL, res: ServerResponse, user: SessionUser): Promise<void> {
  const reason = cfoConfigError();
  if (reason) return notConfigured(res, reason);
  try {
    await completeCfoAuthorization(user.id, url.searchParams);
    redirect(res, "/?cfo=connected");
  } catch (error: unknown) {
    const code = error instanceof CfoOAuthError ? error.code : "unexpected";
    const message = error instanceof CfoOAuthError ? error.message : "unexpected error";
    console.error(`cfo.ai callback failed for user ${user.id}: ${code} - ${message}`);
    redirect(res, "/?cfo=error");
  }
}

// GET /api/cfo/status -> { configured, connected, expiresAt? } (never tokens).
export function handleCfoStatus(res: ServerResponse, user: SessionUser): void {
  json(res, 200, { configured: cfoConfigError() === null, ...getCfoStatus(user.id) });
}

// POST|DELETE /api/cfo/disconnect -> forget this user's tokens.
export function handleCfoDisconnect(res: ServerResponse, user: SessionUser): void {
  const removed = disconnectCfo(user.id);
  json(res, 200, { connected: false, removed });
}
