import { useEffect, useState } from "react";
import { handleUnauthorized } from "@/lib/auth";
import { isNeatlogsUsage, type LatestTurnUsage, type NeatlogsUsage } from "@/lib/turn-usage";

/**
 * Waits between checks once a turn has finished. The server flushes the trace and polls Neatlogs
 * for up to ~55 s (finalized ~4 s after a turn in practice); this covers that window, then gives up.
 */
const POLL_DELAYS_MS = [4_000, 3_000, 4_000, 5_000, 6_000, 8_000, 10_000, 12_000, 10_000];

/** Answers already fetched in this tab, by reply id, so reopening the pill doesn't poll again. */
const known = new Map<string, NeatlogsUsage>();

/**
 * Neatlogs' own cost and tokens for the latest finished turn (GET
 * /api/chat/:agentKey/messages/:messageId/neatlogs-usage). Null while the turn is still running or
 * has no trace. While the server is still waiting for Neatlogs this is `pending`; when the checks
 * run out it is `unavailable`.
 */
export function useNeatlogsUsage(agentKey: string, latest: LatestTurnUsage | null): NeatlogsUsage | null {
  const messageId = latest?.messageId;
  const traceId = latest?.usage.final && latest.usage.steps > 0 ? latest.usage.traceId : undefined;
  const saved = latest?.neatlogs ?? null;
  const [fetched, setFetched] = useState<{ messageId: string; usage: NeatlogsUsage } | null>(null);

  const start: NeatlogsUsage | null =
    !messageId || !traceId
      ? null
      : known.get(messageId) ?? (saved && saved.status !== "pending" ? saved : null) ?? {
          status: "pending",
          traceId,
          checkedAt: new Date().toISOString(),
        };
  const needsPoll = start?.status === "pending";

  useEffect(() => {
    if (!messageId || !traceId || !needsPoll) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const url = `/api/chat/${encodeURIComponent(agentKey)}/messages/${encodeURIComponent(messageId)}/neatlogs-usage`;
    const settle = (usage: NeatlogsUsage) => {
      if (usage.status !== "pending") known.set(messageId, usage);
      if (!cancelled) setFetched({ messageId, usage });
    };
    const poll = async (attempt: number) => {
      if (attempt >= POLL_DELAYS_MS.length) {
        settle({ status: "unavailable", traceId, checkedAt: new Date().toISOString() });
        return;
      }
      timer = setTimeout(async () => {
        if (cancelled) return;
        try {
          const res = await fetch(url);
          if (res.status === 401) {
            handleUnauthorized();
            return;
          }
          if (res.status === 404 || res.status === 403) {
            settle({ status: "unavailable", traceId, checkedAt: new Date().toISOString() });
            return;
          }
          const body = (await res.json().catch(() => null)) as { neatlogsUsage?: unknown } | null;
          const usage = res.ok && isNeatlogsUsage(body?.neatlogsUsage) ? body.neatlogsUsage : null;
          if (usage && usage.status !== "pending") {
            settle(usage);
            return;
          }
        } catch {
          // Offline for a moment: try again on the next tick.
        }
        if (!cancelled) void poll(attempt + 1);
      }, POLL_DELAYS_MS[attempt]);
    };
    void poll(0);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [agentKey, messageId, traceId, needsPoll]);

  if (fetched && fetched.messageId === messageId) return fetched.usage;
  return start;
}
