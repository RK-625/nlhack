import type { RequestContext } from "@mastra/core/request-context";
import { createTool } from "@mastra/core/tools";
import { MCPClient, type RequireToolApprovalContext } from "@mastra/mcp";
import { z } from "zod";
import { CFO_MCP_URL, cfoConfigError, getCfoAccessToken, getCfoStatus } from "../../cfo/oauth";
import { WORKSPACE_USER_KEY } from "../workspace";

/** Where a signed-in user links their cfo.ai account (relative, served by src/cfo/routes.ts). */
export const CFO_CONNECT_PATH = "/api/cfo/connect";

/**
 * Deny by default: cfo.ai annotates every tool with an explicit readOnlyHint (the inspect_* tools,
 * list_orgs and validate_code_blocks are true; every edit_*, call_connected_api and notify_user is
 * false; the risky ones are excluded entirely, see CFO_EXCLUDED_TOOLS). Only `readOnlyHint: true` skips approval; any other tool, or one without annotations,
 * needs the user's approval.
 */
export function cfoToolNeedsApproval({ annotations }: Pick<RequireToolApprovalContext, "annotations">): boolean {
  return annotations?.readOnlyHint !== true;
}

/**
 * Never exposed to the agent, even behind approval: they reach outside cfo.ai (email/Slack,
 * third-party APIs) or change account-level settings (team, org, integrations, triggers).
 */
const CFO_EXCLUDED_TOOLS: ReadonlySet<string> = new Set([
  "notify_user",
  "call_connected_api",
  "edit_team",
  "edit_org",
  "edit_integrations",
  "edit_triggers",
]);

const CFO_TOOL_KEY_PREFIX = "cfo_"; // listTools() namespaces tools as `<server>_<tool>`.

/** Drops the excluded cfo.ai tools from a listTools() result. */
function withoutExcludedTools(tools: McpTools): McpTools {
  return Object.fromEntries(
    Object.entries(tools).filter(
      ([key]) => !(key.startsWith(CFO_TOOL_KEY_PREFIX) && CFO_EXCLUDED_TOOLS.has(key.slice(CFO_TOOL_KEY_PREFIX.length))),
    ),
  ) as McpTools;
}

/** The signed-in user's id, set only by the server (src/chat-api.ts); undefined for the CLI. */
function requestUserId(requestContext: RequestContext | undefined): string | undefined {
  const value = typeof requestContext?.get === "function" ? requestContext.get(WORKSPACE_USER_KEY) : undefined;
  return typeof value === "string" && value ? value : undefined;
}

type McpTools = Awaited<ReturnType<MCPClient["listTools"]>>;
type ClientEntry = { token: string; client: MCPClient; tools?: Promise<McpTools> };

/** One MCPClient per user, keyed by user id and rebuilt when that user's access token changes. */
const clients = new Map<string, ClientEntry>();

function dropClient(userId: string, entry: ClientEntry): void {
  if (clients.get(userId) === entry) clients.delete(userId);
  void entry.client.disconnect().catch(() => {});
}

function clientFor(userId: string, token: string): ClientEntry {
  const existing = clients.get(userId);
  if (existing?.token === token) return existing;
  if (existing) dropClient(userId, existing);
  const entry: ClientEntry = {
    token,
    client: new MCPClient({
      id: `cfo:${userId}`,
      servers: {
        cfo: {
          url: new URL(CFO_MCP_URL),
          requestInit: { headers: { Authorization: `Bearer ${token}` } },
          // Refuse to follow redirects/requests to any other host with the token attached.
          allowedHosts: ["api.cfo.ai"],
          // cfo.ai sends server instructions; keep them out of the system prompt.
          forwardInstructions: false,
          requireToolApproval: cfoToolNeedsApproval,
        },
      },
    }),
  };
  clients.set(userId, entry);
  return entry;
}

/** Reports whether cfo.ai is usable for the current user. Never returns tokens. */
export const cfoConnectionStatus = createTool({
  id: "cfo_connection_status",
  description:
    "Checks whether the current user has linked their cfo.ai account. Returns configured, connected and the path where the user can connect. Call it when cfo.ai tools are missing or the user asks about the connection.",
  inputSchema: z.object({}),
  outputSchema: z.object({
    configured: z.boolean(),
    signedIn: z.boolean(),
    connected: z.boolean(),
    connectPath: z.string(),
    note: z.string(),
  }),
  execute: async (_input, context) => {
    const configured = cfoConfigError() === null;
    const userId = requestUserId(context?.requestContext);
    const connected = configured && userId !== undefined && getCfoStatus(userId).connected;
    const note = !configured
      ? "cfo.ai is not configured on this server; an administrator must set it up."
      : !userId
        ? "No signed-in user (CLI run); cfo.ai is available only in the web app after signing in."
        : connected
          ? "Connected. cfo.ai tools are available; if they are missing, cfo.ai may be temporarily unreachable."
          : `Not connected. The user can connect at ${CFO_CONNECT_PATH}.`;
    return { configured, signedIn: userId !== undefined, connected, connectPath: CFO_CONNECT_PATH, note };
  },
});

/**
 * The CFO Bot's tools for this request: the connection status tool, plus the user's cfo.ai MCP
 * tools when they have linked an account. Degrades to the status tool alone when there is no
 * signed-in user, no connection, a failed refresh, or a cfo.ai outage. Only a non-empty tool list
 * is cached, so a later request can recover.
 */
export async function getCfoTools({ requestContext }: { requestContext?: RequestContext }): Promise<McpTools> {
  const base: McpTools = { cfo_connection_status: cfoConnectionStatus };
  const userId = requestUserId(requestContext);
  if (!userId) return base;
  const token = await getCfoAccessToken(userId);
  if (!token) {
    const stale = clients.get(userId);
    if (stale) dropClient(userId, stale);
    return base;
  }
  const entry = clientFor(userId, token);
  if (!entry.tools) {
    // listTools() reports a failed server as an empty result instead of throwing.
    const pending = entry.client.listTools();
    entry.tools = pending;
    pending.then(
      (tools) => {
        if (Object.keys(tools).length === 0 && entry.tools === pending) entry.tools = undefined;
      },
      () => {
        if (entry.tools === pending) entry.tools = undefined;
      },
    );
  }
  try {
    const tools = await entry.tools;
    if (Object.keys(tools).length === 0) console.warn("[cfo] cfo.ai returned no tools for this user");
    return { ...withoutExcludedTools(tools), ...base };
  } catch (error) {
    console.warn("[cfo] could not load cfo.ai MCP tools:", error instanceof Error ? error.message : error);
    return base;
  }
}
