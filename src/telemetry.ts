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

export async function traceRequest<T>(
  channel: "cli",
  sessionId: string,
  run: () => Promise<T>,
  input?: unknown,
): Promise<T> {
  await telemetryReady;
  return trace({
    name: `${channel}.request`,
    kind: "WORKFLOW",
    sessionId,
    sessionEntryPoint: channel,
    input,
    attributes: { "app.channel": channel },
  }, async (activeSpan) => {
    console.info("Neatlogs trace started", { channel, traceId: activeSpan.spanContext().traceId, sessionId });
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
