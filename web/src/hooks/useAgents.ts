import { useEffect, useState } from "react";
import { handleUnauthorized } from "@/lib/auth";

export type AgentSummary = {
  /** Mastra registry key (e.g. "marketResearcher"). */
  key: string;
  /** Agent id (e.g. "market-researcher"); also the avatar identity. */
  id: string;
  name: string;
  description: string;
};

/** Mirrors GET /api/agents; used until it answers, or when it can't (e.g. standalone `vite`). */
export const FALLBACK_AGENTS: AgentSummary[] = [
  {
    key: "assistant",
    id: "assistant",
    name: "Assistant",
    description: "Primary assistant that handles conversations and coordinates specialist agents.",
  },
  {
    key: "marketResearcher",
    id: "market-researcher",
    name: "Market Researcher",
    description:
      "Researches companies, competitors, pricing, funding, headcount, and market trends using Crustdata and live web search.",
  },
  {
    key: "cfoAgent",
    id: "cfo",
    name: "CFO Agent",
    description:
      "Analyzes business financials, cash flow, runway, budgets, pricing, unit economics, and hiring scenarios, using live data from your own cfo.ai workspace once connected. Reads run freely; changes need your approval.",
  },
  {
    key: "customerSuccessAgent",
    id: "customer-success",
    name: "Customer Success",
    description:
      "Helps with customer onboarding, adoption, churn risk, renewals, health scores, support escalations, and customer communication drafts.",
  },
  {
    key: "legalAgent",
    id: "legal",
    name: "Legal Agent",
    description:
      "Reviews contracts, NDAs, and MSAs, explains clauses, outlines GDPR, DPDP, and SOC 2 compliance, and drafts policies. Not legal advice.",
  },
  {
    key: "hrAgent",
    id: "hr",
    name: "HR Agent",
    description:
      "Helps with hiring plans, job descriptions, interview loops, onboarding, policies, performance reviews, and compensation bands.",
  },
  {
    key: "marketingAgent",
    id: "marketing",
    name: "Marketing Agent",
    description:
      "Helps with positioning, messaging, campaigns, content calendars, SEO briefs, launch plans, and channel strategy.",
  },
  {
    key: "salesAgent",
    id: "sales",
    name: "Sales Agent",
    description:
      "Helps with ICPs, prospecting sequences, outreach emails, discovery questions, objection handling, pipeline reviews, and deal strategy.",
  },
  {
    key: "githubAgent",
    id: "github",
    name: "GitHub Agent",
    description:
      "Inspects GitHub repositories, issues, pull requests, and Actions runs, and makes changes when asked, each after you approve it.",
  },
  {
    key: "neatlogsAgent",
    id: "neatlogs",
    name: "Neatlogs Agent",
    description:
      "Analyzes the Neatlogs traces of this project's agent runs: errors, latency, token usage, evaluations, detections, and triage items. Can update triage items and create detections, each after you approve it.",
  },
];

function isAgentList(value: unknown): value is AgentSummary[] {
  return (
    Array.isArray(value) &&
    value.every(
      (agent) =>
        agent && typeof agent.key === "string" && typeof agent.id === "string" && typeof agent.name === "string",
    )
  );
}

export function useAgents(): AgentSummary[] {
  const [agents, setAgents] = useState(FALLBACK_AGENTS);
  useEffect(() => {
    const abort = new AbortController();
    fetch("/api/agents", { signal: abort.signal })
      .then((res) => {
        if (res.status === 401) {
          handleUnauthorized();
          return null;
        }
        return res.ok ? res.json() : null;
      })
      .then((list: unknown) => {
        if (isAgentList(list) && list.length > 0) setAgents(list);
      })
      .catch(() => undefined);
    return () => abort.abort();
  }, []);
  return agents;
}
