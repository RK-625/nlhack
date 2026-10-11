import { init, log, trace } from "neatlogs";

export const telemetryReady = init({
  workflowName: "nlhack",
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

export async function traceRequest<T>(
  channel: "cli" | "web",
  sessionId: string,
  run: () => Promise<T>,
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
    console.info("Neatlogs trace started", { channel, traceId: activeSpan.spanContext().traceId, sessionId, agentId });
    log("Request started", { channel });
    try {
      const result = await run();
      log("Request completed", { channel });
      return result;
    } catch (error) {
      log("Request failed", { channel, level: "error", error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  });
}
