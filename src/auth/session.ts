import type { IncomingMessage, ServerResponse } from "node:http";
import { fromNodeHeaders } from "better-auth/node";
import { auth, type Role } from "./index";

export type SessionUser = { id: string; name: string; username: string; role: Role };

// Resolve the signed-in user from the request cookies, or null.
export async function getSessionUser(req: IncomingMessage): Promise<SessionUser | null> {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session) return null;
  const { id, name, username, role } = session.user;
  return { id, name, username: username ?? "", role: role as Role };
}

// Route guard: send 401/500 and return null when there is no usable session.
// Responds inline (not via chat-api's sendJson) to keep the auth module free of mastra imports.
export async function requireUser(req: IncomingMessage, res: ServerResponse): Promise<SessionUser | null> {
  let user: SessionUser | null;
  try {
    user = await getSessionUser(req);
  } catch (error: unknown) {
    console.error("Session lookup failed", error);
    res.writeHead(500, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: "Session lookup failed" }));
    return null;
  }
  if (!user) {
    res.writeHead(401, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: "Unauthorized" }));
  }
  return user;
}
