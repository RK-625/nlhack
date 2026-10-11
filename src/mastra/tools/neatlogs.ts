import { MCPClient, type RequireToolApprovalContext } from "@mastra/mcp";

/**
 * Neatlogs' MCP tools carry no annotations (no readOnlyHint), so approval is decided by name:
 * only these known read tools skip approval. Every other tool (triage/detection writes, and any
 * tool the server adds later) needs human approval. Deny by default.
 */
export const NEATLOGS_READ_TOOLS: ReadonlySet<string> = new Set([
  "ping",
  "whoami",
  "search_traces",
  "get_trace_context",
  "get_trace_evaluations",
  "get_project_analytics",
  "list_detections",
  "get_detection_trend",
  "list_detection_groups",
  "get_detection_capabilities",
  "get_detection_status",
  "triage_list",
  "triage_get",
  "triage_get_investigation",
  "triage_list_steps",
  "triage_list_versions",
  "triage_get_version",
]);

/** Never exposed to the agent: it ingests traces rather than reading or triaging them. */
const NEATLOGS_EXCLUDED_TOOLS: ReadonlySet<string> = new Set(["log_trace"]);

export function neatlogsToolNeedsApproval({ toolName }: Pick<RequireToolApprovalContext, "toolName">): boolean {
  return !NEATLOGS_READ_TOOLS.has(toolName);
}

// Neatlogs' hosted MCP server, authenticated with the same project key the tracing SDK uses.
export const neatlogsMcp = new MCPClient({
  id: "neatlogs",
  servers: {
    neatlogs: {
      url: new URL("https://ingest.neatlogs.com/mcp"),
      requestInit: {
        headers: { Authorization: `Bearer ${process.env.NEATLOGS_API_KEY}` },
      },
      // Refuse to follow redirects/requests to any other host with the key attached.
      allowedHosts: ["ingest.neatlogs.com"],
      requireToolApproval: neatlogsToolNeedsApproval,
    },
  },
});

type NeatlogsTools = Awaited<ReturnType<typeof neatlogsMcp.listTools>>;
let cached: NeatlogsTools | undefined;

const TOOL_KEY_PREFIX = "neatlogs_"; // listTools() namespaces tools as `<server>_<tool>`.

function toolName(key: string): string | undefined {
  return key.startsWith(TOOL_KEY_PREFIX) ? key.slice(TOOL_KEY_PREFIX.length) : undefined;
}

/**
 * Resolves the Neatlogs MCP tools lazily (the agent calls this per request), minus excluded ones.
 * Degrades to no tools (logging a warning) when NEATLOGS_API_KEY is missing or the connection
 * fails, so the server still boots. Only a successful, non-empty fetch is cached.
 */
export async function getNeatlogsTools(): Promise<NeatlogsTools> {
  if (cached) return cached;
  if (!process.env.NEATLOGS_API_KEY) {
    console.warn("[neatlogs] NEATLOGS_API_KEY is not set; the Neatlogs agent has no tools");
    return {};
  }
  try {
    // listTools() reports a failed server as an empty result instead of throwing; don't cache that.
    const all = await neatlogsMcp.listTools();
    const tools = Object.fromEntries(
      Object.entries(all).filter(([key]) => {
        const name = toolName(key);
        return name !== undefined && !NEATLOGS_EXCLUDED_TOOLS.has(name);
      }),
    ) as NeatlogsTools;
    if (Object.keys(tools).length > 0) cached = tools;
    return tools;
  } catch (error) {
    console.warn("[neatlogs] could not load Neatlogs MCP tools:", error instanceof Error ? error.message : error);
    return {};
  }
}

/**
 * Only the read allowlist, for callers that cannot show an approval prompt (delegation from the
 * assistant, and therefore the WhatsApp bot). Same predicate as the approval gate.
 */
export async function getNeatlogsReadTools(): Promise<NeatlogsTools> {
  const tools = await getNeatlogsTools();
  return Object.fromEntries(
    Object.entries(tools).filter(([key]) => {
      const name = toolName(key);
      return name !== undefined && !neatlogsToolNeedsApproval({ toolName: name });
    }),
  ) as NeatlogsTools;
}
