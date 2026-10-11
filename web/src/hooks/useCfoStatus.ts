import { useCallback, useEffect, useSyncExternalStore } from "react";
import { handleUnauthorized } from "@/lib/auth";

export type CfoStatus = { configured: boolean; connected: boolean; expiresAt?: number | string };

/** Shared by every consumer (account menu, chat banner), so one refetch updates them all. */
let current: CfoStatus | null = null;
const listeners = new Set<() => void>();

function publish(next: CfoStatus | null) {
  current = next;
  for (const listener of listeners) listener();
}

/** GET /api/cfo/status; leaves the last known value on failure. */
export async function refetchCfoStatus(): Promise<void> {
  try {
    const res = await fetch("/api/cfo/status", { credentials: "include" });
    if (res.status === 401) return handleUnauthorized();
    if (res.ok) publish((await res.json()) as CfoStatus);
  } catch {
    // Offline or server down: the connect UI simply stays hidden.
  }
}

/** POST /api/cfo/disconnect, then refresh. Returns whether the server accepted it. */
export async function disconnectCfo(): Promise<boolean> {
  try {
    const res = await fetch("/api/cfo/disconnect", { method: "POST", credentials: "include" });
    if (res.status === 401) {
      handleUnauthorized();
      return false;
    }
    await refetchCfoStatus();
    return res.ok;
  } catch {
    return false;
  }
}

/** Full-page navigation: the server redirects to cfo.ai and back to `/?cfo=connected|error`. */
export function startCfoConnect() {
  window.location.assign("/api/cfo/connect");
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => void listeners.delete(listener);
};

/** The signed-in user's cfo.ai link state; `status` is null until the first answer. */
export function useCfoStatus() {
  const status = useSyncExternalStore(subscribe, () => current);
  useEffect(() => {
    if (!current) void refetchCfoStatus();
  }, []);
  const refetch = useCallback(() => refetchCfoStatus(), []);
  return { status, refetch };
}
