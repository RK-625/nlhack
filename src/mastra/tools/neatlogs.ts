import type { RequestContext } from "@mastra/core/request-context";
import { createTool } from "@mastra/core/tools";
import { MCPClient, type RequireToolApprovalContext } from "@mastra/mcp";
import { isTraceOwner, recordTraceOwners } from "../../neatlogs/trace-owners";
import { USER_ROLE_KEY, WORKSPACE_USER_KEY } from "../workspace";

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
 * Resolves the shared Neatlogs MCP tools lazily, minus excluded ones. Degrades to no tools
 * (logging a warning) when NEATLOGS_API_KEY is missing or the connection fails, so the server
 * still boots. Only a successful, non-empty fetch is cached. Never mutate the cached tools: they
 * are shared by every request; per-user scoping builds new wrapper tools instead.
 */
async function getAllNeatlogsTools(): Promise<NeatlogsTools> {
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
 * Whose traces the Neat Bot may show in this request:
 * - "all": admins, and runs with no user in the RequestContext at all. Only the CLI (`npm start`)
 *   and `mastra dev` run without one; every web request (src/chat-api.ts) sets the user and role
 *   server-side, so a browser can never reach this branch by omitting them.
 * - "own": any other signed-in user (role "employee", or a missing/unknown role: fail closed).
 * - "none": a user id that is not a plain string id; no tools at all.
 */
export type NeatlogsScope = { kind: "all" } | { kind: "own"; userId: string } | { kind: "none" };

export function neatlogsScope(requestContext: RequestContext | undefined): NeatlogsScope {
  const get = (key: string): unknown => (typeof requestContext?.get === "function" ? requestContext.get(key) : undefined);
  const userId = get(WORKSPACE_USER_KEY);
  if (userId === undefined || userId === null) return { kind: "all" };
  // Session ids are "<userId>:<agentId>", so an id containing ":" could match another user's prefix.
  if (typeof userId !== "string" || !userId || userId.includes(":")) return { kind: "none" };
  return get(USER_ROLE_KEY) === "admin" ? { kind: "all" } : { kind: "own", userId };
}

/**
 * The Neat Bot's tools for this request. Admins (and the CLI) get every Neatlogs tool unchanged;
 * other users get only ping, whoami, search_traces, get_trace_context and get_trace_evaluations,
 * wrapped so they see their own traces only (see scopedTools).
 */
export async function getNeatlogsTools({ requestContext }: { requestContext?: RequestContext } = {}): Promise<NeatlogsTools> {
  const scope = neatlogsScope(requestContext);
  if (scope.kind === "none") return {};
  const all = await getAllNeatlogsTools();
  return scope.kind === "all" ? all : scopedTools(all, scope.userId);
}

type AnyTool = NeatlogsTools[string];
type ExecuteContext = Parameters<NonNullable<AnyTool["execute"]>>[1];

/** Neatlogs returns at most 100 traces per search page; a non-admin search scans at most this many pages. */
const SEARCH_PAGE_SIZE = 100;
const SEARCH_MAX_PAGES = 5;
const DEFAULT_SEARCH_LIMIT = 20;

const NOT_AVAILABLE = "No trace with that id is available to you. Use search_traces to find your own traces.";

function refusal(message: string): { error: true; message: string } {
  return { error: true, message };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** Mastra reports invalid tool input as { error: true, message } instead of throwing. */
function isToolError(value: unknown): boolean {
  return isRecord(value) && value.error === true;
}

/**
 * The JSON payload of a Neatlogs tool result: the single text block of an MCP CallToolResult, or
 * the structured value itself. Undefined whenever it cannot be read with certainty (callers then
 * return nothing).
 */
function parseResult(result: unknown): unknown {
  if (!isRecord(result)) return undefined;
  if (Array.isArray(result.content)) {
    if (result.isError === true) return undefined;
    const texts = result.content.filter((part) => isRecord(part) && part.type === "text");
    if (texts.length !== 1 || typeof texts[0].text !== "string") return undefined;
    try {
      return JSON.parse(texts[0].text);
    } catch {
      return undefined;
    }
  }
  return isToolError(result) ? undefined : result;
}

function intArg(value: unknown, fallback: number, max: number): number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? Math.min(value, max) : fallback;
}

/** Calls the shared tool's execute without touching the tool itself. */
async function callThrough(tool: AnyTool, input: Record<string, unknown>, context: ExecuteContext): Promise<unknown> {
  if (!tool.execute) throw new Error(`Neatlogs tool ${tool.id} cannot be executed`);
  return tool.execute(input as never, context);
}

/** search_traces limited to the user's own sessions, without project-wide totals. */
function ownSearchTraces(original: AnyTool, userId: string): AnyTool {
  const sessionPrefix = `${userId}:`;
  return createTool({
    id: original.id,
    description:
      "Searches the traces of the current user's own conversations (only traces whose session belongs to this user; other users' runs and CLI runs are never returned). Takes the same filters as the project-wide search. Returns { mode, count, results, more_may_exist }; there is no project-wide total.",
    inputSchema: original.inputSchema,
    execute: async (input: Record<string, unknown>, context: ExecuteContext) => {
      // limit/offset count the user's own results; the server is paged separately. `fields` is
      // dropped because filtering needs session_id on every result.
      const { limit: rawLimit, offset: rawOffset, fields: _fields, ...filters } = input;
      const limit = Math.max(1, intArg(rawLimit, DEFAULT_SEARCH_LIMIT, SEARCH_PAGE_SIZE));
      const offset = intArg(rawOffset, 0, SEARCH_PAGE_SIZE * SEARCH_MAX_PAGES);
      const wanted = offset + limit;

      const own = new Map<string, Record<string, unknown>>();
      let mode: unknown;
      let exhausted = false;
      for (let page = 0; page < SEARCH_MAX_PAGES && own.size < wanted; page++) {
        const raw = await callThrough(original, { ...filters, limit: SEARCH_PAGE_SIZE, offset: page * SEARCH_PAGE_SIZE }, context);
        if (page === 0 && isToolError(raw)) return raw; // invalid input: nothing was searched
        const parsed = parseResult(raw);
        const results = isRecord(parsed) && Array.isArray(parsed.results) ? parsed.results : undefined;
        if (!results) {
          if (page === 0) return { mode: undefined, count: 0, results: [], more_may_exist: false, note: "Could not read the Neatlogs search results." };
          break; // keep what earlier pages returned
        }
        if (page === 0 && isRecord(parsed)) mode = parsed.mode;
        for (const result of results) {
          if (
            isRecord(result) &&
            typeof result.trace_id === "string" &&
            typeof result.session_id === "string" &&
            result.session_id.startsWith(sessionPrefix) &&
            !own.has(result.trace_id)
          ) {
            own.set(result.trace_id, result);
          }
        }
        if (results.length < SEARCH_PAGE_SIZE) {
          exhausted = true;
          break;
        }
      }

      try {
        recordTraceOwners(userId, own.keys());
      } catch (error) {
        console.warn("[neatlogs] could not record trace owners:", error instanceof Error ? error.message : error);
      }
      const results = [...own.values()].slice(offset, wanted);
      return {
        mode: typeof mode === "string" ? mode : undefined,
        count: results.length,
        results,
        more_may_exist: own.size > wanted || !exhausted,
      };
    },
  }) as unknown as AnyTool;
}

/** A trace_id tool (get_trace_context, get_trace_evaluations) limited to traces the user owns. */
function ownTraceTool(original: AnyTool, userId: string, rejectedArgs: readonly string[], description: string): AnyTool {
  return createTool({
    id: original.id,
    description,
    inputSchema: original.inputSchema,
    execute: async (input: Record<string, unknown>, context: ExecuteContext) => {
      const rejected = rejectedArgs.filter((name) => input[name] !== undefined);
      if (rejected.length > 0) {
        return refusal(`${rejected.join(", ")} ${rejected.length === 1 ? "is" : "are"} not available. Pass the trace_id of one of your own traces (find it with search_traces).`);
      }
      const traceId = typeof input.trace_id === "string" ? input.trace_id.trim() : "";
      if (!traceId) return refusal("trace_id is required. Find your traces with search_traces.");
      if (!isTraceOwner(traceId, userId)) return refusal(NOT_AVAILABLE);
      const raw = await callThrough(original, { ...input, trace_id: traceId }, context);
      if (isToolError(raw)) return raw;
      // Fail closed unless the result is readable and about the requested trace.
      const parsed = parseResult(raw);
      if (!isRecord(parsed) || typeof parsed.trace_id !== "string" || parsed.trace_id.toLowerCase() !== traceId.toLowerCase()) {
        return refusal("Could not read the Neatlogs result for that trace.");
      }
      return raw;
    },
  }) as unknown as AnyTool;
}

/**
 * Per-request copies for a non-admin: only ping, whoami and the three trace tools, the latter wrapped
 * to the user's own traces. ping and whoami return no trace data and are passed through as is.
 * Analytics, detections, triage and every write tool are left out.
 */
function scopedTools(all: NeatlogsTools, userId: string): NeatlogsTools {
  const tools: NeatlogsTools = {};
  const pick = (name: string) => all[`${TOOL_KEY_PREFIX}${name}`];
  for (const name of ["ping", "whoami"]) {
    const tool = pick(name);
    if (tool) tools[`${TOOL_KEY_PREFIX}${name}`] = tool;
  }
  const search = pick("search_traces");
  if (search) tools[`${TOOL_KEY_PREFIX}search_traces`] = ownSearchTraces(search, userId);
  const context = pick("get_trace_context");
  if (context) {
    tools[`${TOOL_KEY_PREFIX}get_trace_context`] = ownTraceTool(
      context,
      userId,
      ["created_after", "verification_marker", "candidate_offset"],
      "Fetches the full context (spans, timings, tokens, errors, first page of evaluations) of one of the current user's own traces by trace_id. Only trace ids from this user's conversations are allowed; created_after and verification_marker are not available.",
    );
  }
  const evaluations = pick("get_trace_evaluations");
  if (evaluations) {
    tools[`${TOOL_KEY_PREFIX}get_trace_evaluations`] = ownTraceTool(
      evaluations,
      userId,
      ["evaluation_id", "span_id"],
      "Pages through the evaluations of one of the current user's own traces by trace_id (offset/limit and run/response paging). Only trace ids from this user's conversations are allowed; evaluation_id and span_id are not available.",
    );
  }
  return tools;
}

/** Neatlogs' own totals for one trace, as get_trace_context reports them. */
export type TraceMetrics = {
  /** False while Neatlogs is still ingesting the trace; the totals are 0 until it is finalized. */
  finalized: boolean;
  costUsd: number;
  tokens: number;
  inputTokens: number;
  outputTokens: number;
};

const finite = (value: unknown): number => (typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0);

/**
 * Server-side lookup of one trace's cost and tokens through the shared (project-level) Neatlogs MCP
 * client. Never exposed to an agent: callers must pass only a trace id the server itself created
 * for the requesting user. Asks for a single span and no evaluations, since only the trace totals
 * are read (span payloads are ignored; Neatlogs rejects `fields` projection for now). Resolves to
 * null when the trace is not (yet) known to Neatlogs, the key is missing, or the result can't be read.
 */
export async function getTraceMetrics(traceId: string): Promise<TraceMetrics | null> {
  const tool = (await getAllNeatlogsTools())[`${TOOL_KEY_PREFIX}get_trace_context`];
  if (!tool?.execute) return null;
  let raw: unknown;
  try {
    raw = await tool.execute(
      { trace_id: traceId, include_evaluations: false, limit: 1 } as never,
      {} as ExecuteContext,
    );
  } catch {
    return null; // "Trace not found" (not ingested yet) is reported as a thrown tool error.
  }
  const parsed = parseResult(raw);
  if (!isRecord(parsed) || typeof parsed.trace_id !== "string" || parsed.trace_id.toLowerCase() !== traceId.toLowerCase()) {
    return null;
  }
  const inputTokens = finite(parsed.prompt_tokens);
  const outputTokens = finite(parsed.completion_tokens);
  return {
    finalized: parsed.finalization_status === "finalized",
    costUsd: finite(parsed.total_cost),
    tokens: finite(parsed.total_tokens) || inputTokens + outputTokens,
    inputTokens,
    outputTokens,
  };
}
