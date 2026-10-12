import { isDataUIPart, type UIMessage } from "ai";

/**
 * One chat turn's usage against the user's caps for that agent. Streamed as the `data-turn-usage`
 * part (fixed id, so the latest replaces earlier ones) and saved on the reply as
 * `metadata.turnUsage` (mirrors TurnUsage in src/usage/turn-budget.ts).
 */
export type TurnUsage = {
  costUsd: number;
  tokens: number;
  inputTokens: number;
  outputTokens: number;
  /** Input tokens served from the provider's prompt cache (part of inputTokens), when reported. */
  cachedInputTokens?: number;
  steps: number;
  capCostUsd: number;
  capTokens: number;
  capped: boolean;
  reason: "cost" | "tokens" | null;
  final: boolean;
  /** The turn's Neatlogs trace id. */
  traceId?: string;
};

/**
 * Neatlogs' own cost and tokens for a turn's trace, fetched by the server after the turn and saved
 * on the reply as `metadata.neatlogsUsage` (mirrors NeatlogsUsage in src/usage/neatlogs-usage.ts).
 * Display only: the caps are enforced on our estimate.
 */
export type NeatlogsUsage = {
  status: "pending" | "ready" | "unavailable";
  traceId: string;
  costUsd?: number;
  tokens?: number;
  inputTokens?: number;
  outputTokens?: number;
  checkedAt: string;
  fetchedAt?: string;
};

export function isNeatlogsUsage(value: unknown): value is NeatlogsUsage {
  if (!value || typeof value !== "object") return false;
  const usage = value as Partial<NeatlogsUsage>;
  return (
    (usage.status === "pending" || usage.status === "ready" || usage.status === "unavailable") &&
    typeof usage.traceId === "string"
  );
}

/** The Neatlogs usage saved on a reply (present after a reload or once the history is refetched). */
export function messageNeatlogsUsage(message: UIMessage): NeatlogsUsage | null {
  const saved = (message.metadata as { neatlogsUsage?: unknown } | undefined)?.neatlogsUsage;
  return isNeatlogsUsage(saved) ? saved : null;
}

export type TurnCaps = { costCapUsd: number; tokenCap: number };

/** Server defaults (src/usage/caps.ts), used until GET /api/agents/:id/caps answers. */
export const DEFAULT_CAPS: TurnCaps = { costCapUsd: 0.25, tokenCap: 300_000 };
/** Same sanity bounds the server enforces on PUT. */
export const MAX_COST_CAP_USD = 1000;
export const MAX_TOKEN_CAP = 100_000_000;

export const TURN_USAGE_PART = "data-turn-usage";

const num = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

export function isTurnUsage(value: unknown): value is TurnUsage {
  if (!value || typeof value !== "object") return false;
  const usage = value as Record<string, unknown>;
  return num(usage.costUsd) && num(usage.tokens) && num(usage.capCostUsd) && num(usage.capTokens) && typeof usage.capped === "boolean";
}

/** A reply's usage: the live `data-turn-usage` part first, else the saved `metadata.turnUsage`. */
export function messageTurnUsage(message: UIMessage): TurnUsage | null {
  if (message.role !== "assistant") return null;
  for (let i = message.parts.length - 1; i >= 0; i--) {
    const part = message.parts[i];
    if (isDataUIPart(part) && part.type === TURN_USAGE_PART && isTurnUsage(part.data)) return part.data;
  }
  const saved = (message.metadata as { turnUsage?: unknown } | undefined)?.turnUsage;
  return isTurnUsage(saved) ? saved : null;
}

export type LatestTurnUsage = { messageId: string; usage: TurnUsage; neatlogs: NeatlogsUsage | null };

/** Usage of the latest turn: the newest assistant reply's usage, or null when it has none. */
export function latestTurnUsage(messages: UIMessage[]): LatestTurnUsage | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (message.role === "user") return null; // A new turn has started and has no usage yet.
    const usage = messageTurnUsage(message);
    if (usage) return { messageId: message.id, usage, neatlogs: messageNeatlogsUsage(message) };
  }
  return null;
}

/** "$0.0031" under a cent, "$0.25" / "$0.263" under a dollar, "$5.00" above. */
export function formatUsd(value: number): string {
  const usd = Math.max(0, value);
  if (usd === 0) return "$0.00";
  if (usd < 0.01) return `$${usd.toFixed(4)}`;
  if (usd < 1) {
    const three = usd.toFixed(3);
    return `$${three.endsWith("0") ? three.slice(0, -1) : three}`;
  }
  return `$${usd.toFixed(2)}`;
}

const trim = (value: number, digits: number) => value.toFixed(digits).replace(/\.?0+$/, "");

/** 950 → "950", 1500 → "1.5k", 36_400 → "36k", 300_000 → "300k", 1_250_000 → "1.25M". */
export function formatTokens(value: number): string {
  const tokens = Math.max(0, Math.round(value));
  if (tokens < 1000) return String(tokens);
  if (tokens < 10_000) return `${trim(tokens / 1000, 1)}k`;
  if (tokens < 1_000_000) return `${Math.round(tokens / 1000)}k`;
  return `${trim(tokens / 1_000_000, 2)}M`;
}

export type UsageLevel = "normal" | "warn" | "capped";

/** Bar colour: capped (this limit stopped the turn) → red, ≥80% → amber, else normal. */
export function usageLevel(used: number, cap: number, capped: boolean): UsageLevel {
  if (capped) return "capped";
  return cap > 0 && used / cap >= 0.8 ? "warn" : "normal";
}

/** Fill fraction for a bar, clamped to 0..1. */
export function usageFraction(used: number, cap: number): number {
  if (!(cap > 0)) return 0;
  return Math.min(1, Math.max(0, used / cap));
}

/** The closing note the server streams on a capped reply (not persisted); replaced by CapNotice. */
const CAP_NOTE = /^\s*Stopped: this reply reached its (cost|token) limit\b/;
export function isCapNoteText(text: string): boolean {
  return CAP_NOTE.test(text);
}

/** Inline notice shown at the end of a capped reply. */
export function capNoticeText(usage: TurnUsage): string {
  const tail = "Raise it from the bot name ▾.";
  if (usage.reason === "tokens") {
    return `Stopped: this turn hit your ${formatTokens(usage.capTokens)} token limit (used ${formatTokens(usage.tokens)}). ${tail}`;
  }
  return `Stopped: this turn hit your ${formatUsd(usage.capCostUsd)} cost limit (used ${formatUsd(usage.costUsd)}). ${tail}`;
}

/** Parses "300000", "300,000", "300k" or "1.5m" into a whole number of tokens. */
function parseTokenInput(raw: string): number {
  const match = raw.trim().replace(/[,_\s]/g, "").match(/^(\d+(?:\.\d+)?)([km]?)$/i);
  if (!match) return Number.NaN;
  const scale = match[2].toLowerCase() === "k" ? 1e3 : match[2].toLowerCase() === "m" ? 1e6 : 1;
  return Number(match[1]) * scale;
}

export type CapsInputResult =
  | { ok: true; caps: TurnCaps }
  | { ok: false; errors: { cost?: string; tokens?: string } };

/** Validates the edit form's text inputs with the same rules as the server. */
export function parseCapsInput(costRaw: string, tokensRaw: string): CapsInputResult {
  const errors: { cost?: string; tokens?: string } = {};
  const cost = Number(costRaw.trim().replace(/^\$/, ""));
  if (!costRaw.trim() || !Number.isFinite(cost) || cost <= 0 || cost > MAX_COST_CAP_USD) {
    errors.cost = `Enter an amount above $0 and at most $${MAX_COST_CAP_USD}.`;
  }
  const tokens = parseTokenInput(tokensRaw);
  if (!Number.isSafeInteger(tokens) || tokens <= 0 || tokens > MAX_TOKEN_CAP) {
    errors.tokens = `Enter a whole number above 0 and at most ${formatTokens(MAX_TOKEN_CAP)} (e.g. 300k).`;
  }
  if (errors.cost || errors.tokens) return { ok: false, errors };
  return { ok: true, caps: { costCapUsd: cost, tokenCap: tokens } };
}
