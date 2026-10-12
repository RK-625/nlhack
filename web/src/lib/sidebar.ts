import type { AgentSummary } from "@/hooks/useAgents";

/** The orchestrator gets the featured tile; every other agent is listed as a specialist. */
export const PRIMARY_AGENT_KEY = "assistant";

/** Sidebar geometry (px). */
export const SIDEBAR = {
  /** Expanded width bounds and default. */
  MIN: 240,
  MAX: 400,
  DEFAULT: 284,
  /** Compact rail width. */
  RAIL: 76,
  /** Dragging an expanded edge below this snaps to the rail (MIN - 40). */
  SNAP_TO_RAIL: 200,
  /** Dragging the rail's edge past this snaps back to the last expanded width. */
  SNAP_TO_EXPANDED: 140,
  /** Keyboard resize steps. */
  STEP: 16,
  STEP_LARGE: 48,
} as const;

export const clampWidth = (width: number) => Math.min(SIDEBAR.MAX, Math.max(SIDEBAR.MIN, Math.round(width)));

/** Sidebar search: name or description contains the query (case-insensitive); empty matches all. */
export function agentMatches(agent: AgentSummary, query: string): boolean {
  const needle = query.trim().toLowerCase();
  return !needle || `${agent.name} ${agent.description}`.toLowerCase().includes(needle);
}

export function groupAgents(agents: AgentSummary[]): { primary: AgentSummary[]; specialists: AgentSummary[] } {
  return {
    primary: agents.filter((agent) => agent.key === PRIMARY_AGENT_KEY),
    specialists: agents.filter((agent) => agent.key !== PRIMARY_AGENT_KEY),
  };
}

const WIDTH_KEY = "botcompany.sidebarWidth";
const COMPACT_KEY = "botcompany.sidebarCompact";
/** Pre-rail preference ("hidden" sidebar); now maps to the compact rail. */
const LEGACY_COLLAPSED_KEY = "botcompany.sidebarCollapsed";

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Layout preferences are a convenience; ignore blocked storage.
  }
}

export function readSidebarWidth(): number {
  const stored = Number(read(WIDTH_KEY));
  return Number.isFinite(stored) && stored > 0 ? clampWidth(stored) : SIDEBAR.DEFAULT;
}

export function readSidebarCompact(): boolean {
  const stored = read(COMPACT_KEY);
  return stored === null ? read(LEGACY_COLLAPSED_KEY) === "true" : stored === "true";
}

export function writeSidebarLayout(width: number, compact: boolean) {
  write(WIDTH_KEY, String(clampWidth(width)));
  write(COMPACT_KEY, String(compact));
}
