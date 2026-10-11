import type { ServerResponse } from "node:http";
import type { Role } from "./index";
import type { SessionUser } from "./session";

export type AgentAccess = "all" | "admin";

// Keyed by Mastra agent id. To make a future agent admin-only, add its id here as "admin".
const agentAccess: Record<string, AgentAccess> = {
  assistant: "all",
  "market-researcher": "all",
  cfo: "all",
  github: "all",
  neatlogs: "all",
  "customer-success": "all",
  legal: "all",
  hr: "all",
  marketing: "all",
  sales: "all",
};

// Admins can use every agent; everyone else only agents marked "all" (unlisted agents default to "all").
export function canUseAgent(user: SessionUser, agentId: string): boolean {
  if (user.role === "admin") return true;
  return (agentAccess[agentId] ?? "all") === "all";
}

// Guard for admin-only routes: sends 403 and returns false when the user lacks the role (admin satisfies any role).
// Responds inline (not via chat-api's sendJson) to keep the auth module free of mastra imports.
export function requireRole(user: SessionUser, res: ServerResponse, role: Role): boolean {
  if (user.role === "admin" || user.role === role) return true;
  res.writeHead(403, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify({ error: "Forbidden" }));
  return false;
}
