import { useCallback, useEffect, useState } from "react";
import { handleUnauthorized } from "@/lib/auth";
import { DEFAULT_CAPS, type TurnCaps } from "@/lib/turn-usage";

type CapsResponse = TurnCaps & { defaults: TurnCaps };

export type AgentCaps = {
  /** The user's caps for this agent; null until loaded (callers fall back to the defaults). */
  caps: TurnCaps | null;
  defaults: TurnCaps;
  /** PUT the caps; resolves to an error message, or null on success. */
  save: (caps: TurnCaps) => Promise<string | null>;
  /** DELETE: back to the defaults; resolves to an error message, or null on success. */
  reset: () => Promise<string | null>;
};

function isCapsResponse(value: unknown): value is CapsResponse {
  const body = value as Partial<CapsResponse> | null;
  return (
    !!body &&
    typeof body.costCapUsd === "number" &&
    typeof body.tokenCap === "number" &&
    typeof body.defaults?.costCapUsd === "number" &&
    typeof body.defaults?.tokenCap === "number"
  );
}

/** The signed-in user's per-turn caps for one agent (GET/PUT/DELETE /api/agents/:agentKey/caps). */
export function useAgentCaps(agentKey: string): AgentCaps {
  const [state, setState] = useState<{ caps: TurnCaps | null; defaults: TurnCaps }>({ caps: null, defaults: DEFAULT_CAPS });
  const url = `/api/agents/${encodeURIComponent(agentKey)}/caps`;

  const request = useCallback(
    async (init?: RequestInit): Promise<string | null> => {
      try {
        const res = await fetch(url, init);
        if (res.status === 401) {
          handleUnauthorized();
          return "Your session has ended. Sign in again.";
        }
        const body: unknown = await res.json().catch(() => null);
        if (!res.ok) {
          const error = (body as { error?: unknown } | null)?.error;
          return typeof error === "string" ? error : `Request failed (${res.status}).`;
        }
        if (!isCapsResponse(body)) return "Unexpected response from the server.";
        setState({ caps: { costCapUsd: body.costCapUsd, tokenCap: body.tokenCap }, defaults: body.defaults });
        return null;
      } catch {
        return "Can't reach the server.";
      }
    },
    [url],
  );

  useEffect(() => {
    setState({ caps: null, defaults: DEFAULT_CAPS });
    void request();
  }, [request]);

  return {
    ...state,
    save: (caps) =>
      request({ method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(caps) }),
    reset: () => request({ method: "DELETE" }),
  };
}
