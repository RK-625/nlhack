import { resolve } from "node:path";
import Database from "better-sqlite3";
import { dataDir } from "../data-dir";

// Per-user, per-agent caps on what one chat turn may spend, in data/auth.db (own connection, same
// file as Better Auth). A turn is one user message (or one approval resume) and everything the
// agent does to answer it, including delegated sub-agents. Users without a row get the defaults.

export type TurnCaps = { costCapUsd: number; tokenCap: number };

export const DEFAULT_CAPS: Readonly<TurnCaps> = Object.freeze({ costCapUsd: 0.25, tokenCap: 300_000 });

/** Sanity bounds that only reject garbage input; there is no business maximum. */
export const MAX_COST_CAP_USD = 1000;
export const MAX_TOKEN_CAP = 100_000_000;

let db: Database.Database | null = null;

// Open the database and create the table idempotently; safe to call repeatedly.
export function capsDb(): Database.Database {
  if (db) return db;
  const conn = new Database(resolve(dataDir(), "auth.db"));
  conn.pragma("busy_timeout = 5000");
  conn.exec(`
    CREATE TABLE IF NOT EXISTS agent_caps (
      user_id TEXT NOT NULL,
      agent_id TEXT NOT NULL,
      cost_cap_usd REAL NOT NULL,
      token_cap INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (user_id, agent_id)
    );
  `);
  db = conn;
  return conn;
}

/** The user's caps for one agent: the stored row, or the defaults. */
export function getCaps(userId: string, agentId: string): TurnCaps {
  const row = capsDb()
    .prepare("SELECT cost_cap_usd, token_cap FROM agent_caps WHERE user_id = ? AND agent_id = ?")
    .get(userId, agentId) as { cost_cap_usd: number; token_cap: number } | undefined;
  return row ? { costCapUsd: row.cost_cap_usd, tokenCap: row.token_cap } : { ...DEFAULT_CAPS };
}

export function setCaps(userId: string, agentId: string, caps: TurnCaps): void {
  capsDb()
    .prepare(
      `INSERT INTO agent_caps (user_id, agent_id, cost_cap_usd, token_cap, updated_at) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(user_id, agent_id) DO UPDATE SET
         cost_cap_usd = excluded.cost_cap_usd, token_cap = excluded.token_cap, updated_at = excluded.updated_at`,
    )
    .run(userId, agentId, caps.costCapUsd, caps.tokenCap, Date.now());
}

/** Back to the defaults. */
export function resetCaps(userId: string, agentId: string): void {
  capsDb().prepare("DELETE FROM agent_caps WHERE user_id = ? AND agent_id = ?").run(userId, agentId);
}

/** Validates a PUT body; returns the caps or an error message. Token caps must be whole numbers. */
export function parseCaps(body: unknown): TurnCaps | string {
  const { costCapUsd, tokenCap } = (body ?? {}) as Record<string, unknown>;
  if (typeof costCapUsd !== "number" || !Number.isFinite(costCapUsd) || costCapUsd <= 0 || costCapUsd > MAX_COST_CAP_USD) {
    return `costCapUsd must be a number greater than 0 and at most ${MAX_COST_CAP_USD}`;
  }
  if (typeof tokenCap !== "number" || !Number.isSafeInteger(tokenCap) || tokenCap <= 0 || tokenCap > MAX_TOKEN_CAP) {
    return `tokenCap must be a whole number greater than 0 and at most ${MAX_TOKEN_CAP}`;
  }
  return { costCapUsd, tokenCap };
}
