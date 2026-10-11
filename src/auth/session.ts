import type { IncomingMessage } from "node:http";
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
