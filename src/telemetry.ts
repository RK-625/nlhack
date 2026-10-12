import { SpanStatusCode } from "@opentelemetry/api";
import { init, log, trace } from "neatlogs";
import { recordTraceOwners } from "./neatlogs/trace-owners";

export const telemetryReady = init({
  workflowName: "bot-company",
  apiKey: process.env.NEATLOGS_API_KEY,
  captureLogs: true,
  debug: process.env.NEATLOGS_DEBUG === "true",
  ...(process.env.NEATLOGS_ENDPOINT ? { endpoint: process.env.NEATLOGS_ENDPOINT } : {}),
});

if (!process.env.NEATLOGS_API_KEY) {
  console.warn("NEATLOGS_API_KEY is missing: traces will not be exported to the dashboard.");
}

const DEPARTMENT_TAGS: Record<string, string> = {
  cfo: "dept:finance",
  legal: "dept:legal",
  hr: "dept:hr",
  marketing: "dept:marketing",
  sales: "dept:sales",
  "customer-success": "dept:customer-success",
  "market-researcher": "dept:research",
  github: "dept:engineering",
  neatlogs: "dept:observability",
  assistant: "dept:general",
};

export type TraceContext = {
  userId?: string;
  /** For web, doubles as the Neatlogs session id so a whole conversation groups as one session. */
  threadId?: string;
  agentId?: string;
  tags?: string[];
};

/** Lets a request annotate its own trace root span once it knows more (e.g. a capped turn). */
export type TraceHandle = {
  /** The Neatlogs (OpenTelemetry) trace id of this request. */
  traceId: string;
  addTags(...tags: string[]): void;
  setAttributes(attributes: Record<string, string | number | boolean>): void;
  /** Adds a timestamped event to the root span (e.g. `turn.capped`). */
  addEvent(name: string, attributes?: Record<string, string | number | boolean>): void;
  /**
   * Marks the root span as failed (status ERROR) with a message, for a request that completed but
   * did not do its job (e.g. a turn stopped by its cap). neatlogs' trace() sets no status on a
   * callback that returns normally, so this one stands.
   */
  setError(message: string): void;
};

export async function traceRequest<T>(
  channel: "cli" | "web",
  sessionId: string,
  run: (trace: TraceHandle) => Promise<T>,
  input?: unknown,
  context: TraceContext = {},
): Promise<T> {
  await telemetryReady;
  const { userId, threadId, agentId } = context;
  const department = agentId ? DEPARTMENT_TAGS[agentId] : undefined;
  const tags = [...(context.tags ?? []), ...(department ? [department] : [])];
  return trace({
    name: `${channel}.request`,
    kind: "WORKFLOW",
    sessionId: channel === "web" && threadId ? threadId : sessionId,
    sessionEntryPoint: channel,
    endUserId: userId,
    input,
    tags,
    // OpenTelemetry attributes must be primitives, so metadata is serialized.
    metadata: JSON.stringify({ agentId, threadId, channel }),
    attributes: {
      "app.channel": channel,
      ...(agentId ? { "app.agent_id": agentId } : {}),
      ...(threadId ? { "app.thread_id": threadId } : {}),
    },
  }, async (activeSpan) => {
    const traceId = activeSpan.spanContext().traceId;
    console.info("Neatlogs trace started", { channel, traceId, sessionId, agentId });
    // Web traces belong to the signed-in user; the Neat Bot shows non-admins only their own.
    if (channel === "web" && userId) {
      try {
        recordTraceOwners(userId, [traceId]);
      } catch (error) {
        console.warn("[neatlogs] could not record trace owner:", error instanceof Error ? error.message : error);
      }
    }
    // trace() records `tags` as the root span's "tags" attribute; re-setting it adds tags later.
    const handle: TraceHandle = {
      traceId,
      addTags: (...extra) => {
        for (const tag of extra) if (!tags.includes(tag)) tags.push(tag);
        activeSpan.setAttribute("tags", [...tags]);
      },
      setAttributes: (attributes) => activeSpan.setAttributes(attributes),
      addEvent: (name, attributes) => activeSpan.addEvent(name, attributes),
      setError: (message) => activeSpan.setStatus({ code: SpanStatusCode.ERROR, message }),
    };
    log("Request started", { channel });
    try {
      const result = await run(handle);
      log("Request completed", { channel });
      return result;
    } catch (error) {
      log("Request failed", { channel, level: "error", error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  });
}
