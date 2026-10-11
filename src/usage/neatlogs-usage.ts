import { flush } from "neatlogs";
import { getTraceMetrics, type TraceMetrics } from "../mastra/tools/neatlogs";

/**
 * Neatlogs' own cost and tokens for one chat turn's trace, saved on the reply as
 * `metadata.neatlogsUsage` next to our estimate (`metadata.turnUsage`). Display only: the caps are
 * always enforced on our estimate.
 * - "pending": the server is still waiting for Neatlogs to finalize the trace.
 * - "ready": costUsd/tokens are Neatlogs' numbers.
 * - "unavailable": Neatlogs had no finalized trace when the server last checked.
 */
export type NeatlogsUsage = {
  status: "pending" | "ready" | "unavailable";
  traceId: string;
  costUsd?: number;
  tokens?: number;
  inputTokens?: number;
  outputTokens?: number;
  /** When the server last asked Neatlogs (ISO). */
  checkedAt: string;
  /** When the ready numbers were fetched (ISO). */
  fetchedAt?: string;
};

// Measured (2026-10-12) with get_trace_context: after a flush (~2.5 s) the trace is finalized in
// Neatlogs within ~2-7 s; without one the SDK's 5 s export batch adds to that. It first appears as
// finalization_status "pending" with zero totals, so only a "finalized" trace counts. The poll
// (1 s, then x1.5 up to 8 s apart) gives up after POLL_BUDGET_MS.
const FLUSH_TIMEOUT_MS = 10_000;
const FIRST_DELAY_MS = 1_000;
const MAX_DELAY_MS = 8_000;
const POLL_BUDGET_MS = 45_000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function pendingNeatlogsUsage(traceId: string): NeatlogsUsage {
  return { status: "pending", traceId, checkedAt: new Date().toISOString() };
}

export function toNeatlogsUsage(traceId: string, metrics: TraceMetrics | null): NeatlogsUsage {
  const now = new Date().toISOString();
  if (!metrics?.finalized) return { status: "unavailable", traceId, checkedAt: now };
  return {
    status: "ready",
    traceId,
    costUsd: metrics.costUsd,
    tokens: metrics.tokens,
    inputTokens: metrics.inputTokens,
    outputTokens: metrics.outputTokens,
    checkedAt: now,
    fetchedAt: now,
  };
}

export function isNeatlogsUsage(value: unknown): value is NeatlogsUsage {
  if (!value || typeof value !== "object") return false;
  const usage = value as Partial<NeatlogsUsage>;
  return (
    (usage.status === "pending" || usage.status === "ready" || usage.status === "unavailable") &&
    typeof usage.traceId === "string" &&
    typeof usage.checkedAt === "string"
  );
}

/** Trace ids being polled right now, so a GET while polling doesn't start a second lookup. */
const inFlight = new Set<string>();

export function isTrackingTrace(traceId: string): boolean {
  return inFlight.has(traceId.toLowerCase());
}

/**
 * After a turn's trace has ended: flushes the Neatlogs exporter (it batches spans), then polls
 * Neatlogs for the trace with backoff until it is finalized or POLL_BUDGET_MS has passed, and
 * hands the result to `save`. Never throws; runs in the background after the reply is sent.
 */
export async function trackNeatlogsUsage(traceId: string, save: (usage: NeatlogsUsage) => Promise<void>): Promise<void> {
  const key = traceId.toLowerCase();
  if (!process.env.NEATLOGS_API_KEY || inFlight.has(key)) return;
  inFlight.add(key);
  try {
    await Promise.race([flush().catch(() => false), sleep(FLUSH_TIMEOUT_MS)]);
    const started = Date.now();
    let delay = FIRST_DELAY_MS;
    let metrics: TraceMetrics | null = null;
    for (;;) {
      await sleep(delay);
      metrics = await getTraceMetrics(traceId);
      if (metrics?.finalized) break;
      delay = Math.min(MAX_DELAY_MS, Math.round(delay * 1.5));
      if (Date.now() - started + delay > POLL_BUDGET_MS) break;
    }
    await save(toNeatlogsUsage(traceId, metrics));
  } catch (error) {
    console.warn("[neatlogs] could not fetch turn usage:", error instanceof Error ? error.message : error);
  } finally {
    inFlight.delete(key);
  }
}

/** One immediate lookup (no polling), for a turn whose background poll gave up or was lost. */
export async function checkNeatlogsUsageOnce(traceId: string): Promise<NeatlogsUsage> {
  const key = traceId.toLowerCase();
  inFlight.add(key);
  try {
    return toNeatlogsUsage(traceId, await getTraceMetrics(traceId));
  } finally {
    inFlight.delete(key);
  }
}
