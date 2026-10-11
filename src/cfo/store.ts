import { resolve } from "node:path";
import Database from "better-sqlite3";
import { dataDir } from "../data-dir";

// Per-user cfo.ai OAuth state in data/auth.db (own connection, same file as Better Auth).
// Token and verifier columns hold AES-GCM ciphertext from ./crypto, never plaintext.

export const PENDING_TTL_MS = 10 * 60 * 1000;

export type CfoConnectionRow = {
  user_id: string;
  access_token_enc: string;
  refresh_token_enc: string | null;
  expires_at: number; // epoch ms
  scope: string | null;
  org_id: string | null;
  created_at: number;
  updated_at: number;
};

export type CfoPendingRow = {
  state: string;
  user_id: string;
  code_verifier_enc: string;
  created_at: number;
};

let db: Database.Database | null = null;

// Open the database and create tables idempotently; safe to call repeatedly.
export function cfoDb(): Database.Database {
  if (db) return db;
  const conn = new Database(resolve(dataDir(), "auth.db"));
  conn.pragma("busy_timeout = 5000");
  conn.exec(`
    CREATE TABLE IF NOT EXISTS cfo_connections (
      user_id TEXT PRIMARY KEY,
      access_token_enc TEXT NOT NULL,
      refresh_token_enc TEXT,
      expires_at INTEGER NOT NULL,
      scope TEXT,
      org_id TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS cfo_oauth_pending (
      state TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      code_verifier_enc TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS cfo_oauth_pending_created_at ON cfo_oauth_pending (created_at);
  `);
  db = conn;
  return conn;
}

export function savePending(row: CfoPendingRow): void {
  const conn = cfoDb();
  conn.prepare("DELETE FROM cfo_oauth_pending WHERE created_at < ?").run(Date.now() - PENDING_TTL_MS);
  conn
    .prepare("INSERT INTO cfo_oauth_pending (state, user_id, code_verifier_enc, created_at) VALUES (?, ?, ?, ?)")
    .run(row.state, row.user_id, row.code_verifier_enc, row.created_at);
}

export function getPending(state: string): CfoPendingRow | undefined {
  return cfoDb().prepare("SELECT * FROM cfo_oauth_pending WHERE state = ?").get(state) as CfoPendingRow | undefined;
}

export function deletePending(state: string): void {
  cfoDb().prepare("DELETE FROM cfo_oauth_pending WHERE state = ?").run(state);
}

export function getConnection(userId: string): CfoConnectionRow | undefined {
  return cfoDb().prepare("SELECT * FROM cfo_connections WHERE user_id = ?").get(userId) as CfoConnectionRow | undefined;
}

export function upsertConnection(row: Omit<CfoConnectionRow, "created_at" | "updated_at">): void {
  const now = Date.now();
  cfoDb()
    .prepare(
      `INSERT INTO cfo_connections (user_id, access_token_enc, refresh_token_enc, expires_at, scope, org_id, created_at, updated_at)
       VALUES (@user_id, @access_token_enc, @refresh_token_enc, @expires_at, @scope, @org_id, @now, @now)
       ON CONFLICT(user_id) DO UPDATE SET
         access_token_enc = excluded.access_token_enc,
         refresh_token_enc = excluded.refresh_token_enc,
         expires_at = excluded.expires_at,
         scope = excluded.scope,
         org_id = excluded.org_id,
         updated_at = excluded.updated_at`,
    )
    .run({ ...row, now });
}

export function deleteConnection(userId: string): boolean {
  return cfoDb().prepare("DELETE FROM cfo_connections WHERE user_id = ?").run(userId).changes > 0;
}
