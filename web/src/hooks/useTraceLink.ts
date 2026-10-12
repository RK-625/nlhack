import { useEffect, useState } from "react";
import { handleUnauthorized } from "@/lib/auth";

/** GET /api/neatlogs/trace-link answer, fetched once per session and shared by every usage row. */
let template: string | null | undefined;
let inflight: Promise<void> | undefined;

function load(): Promise<void> {
  inflight ??= (async () => {
    try {
      const res = await fetch("/api/neatlogs/trace-link", { credentials: "include" });
      if (res.status === 401) return handleUnauthorized();
      if (!res.ok) return;
      const body = (await res.json()) as { template?: unknown };
      template = typeof body.template === "string" && body.template.includes("{traceId}") ? body.template : null;
    } catch {
      // Offline or server down: no link; retried on the next mount.
    }
  })().finally(() => {
    inflight = undefined;
  });
  return inflight;
}

/** The trace URL builder for a trace id, or null while loading or when no link is configured. */
export function useTraceLink(traceId: string): string | null {
  const [value, setValue] = useState(template);
  useEffect(() => {
    if (template !== undefined) return;
    let live = true;
    void load().then(() => live && setValue(template));
    return () => {
      live = false;
    };
  }, []);
  return value ? value.replace("{traceId}", encodeURIComponent(traceId)) : null;
}
