export type AgentSummary = {
  /** Mastra registry key (e.g. "marketResearcher"). */
  key: string;
  /** Agent id (e.g. "market-researcher"); also the avatar identity seed. */
  id: string;
  name: string;
  description?: string;
};

/** Mirrors src/mastra/index.ts until the real endpoint exists. */
export const PLACEHOLDER_AGENTS: AgentSummary[] = [
  { key: "assistant", id: "assistant", name: "Assistant" },
  { key: "marketResearcher", id: "market-researcher", name: "Market Researcher" },
  { key: "cfoAgent", id: "cfo", name: "CFO Agent" },
];

// TODO(S5): fetch GET /api/agents and expose loading/error state.
export function useAgents(): { agents: AgentSummary[]; loading: boolean } {
  return { agents: PLACEHOLDER_AGENTS, loading: false };
}
