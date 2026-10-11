import { resolve } from "node:path";
import Database from "better-sqlite3";
import { dataDir } from "../data-dir";

// Which signed-in user each Neatlogs trace belongs to, in data/auth.db (own connection, same file
// as Better Auth). The Neat Bot uses it to let non-admins open only their own traces, because
// Neatlogs' trace tools return no session or user. Rows come from two places: web requests
// (src/telemetry.ts, the user is known) and a non-admin's own search results (session id
// "<userId>:<agentId>"). An existing owner is never overwritten.

let db: Database.Database | null = null;

// Open the database and create the table idempotently; safe to call repeatedly.
function ownersDb(): Database.Database {
  if (db) return db;
  const conn = new Database(resolve(dataDir(), "auth.db"));
  conn.pragma("busy_timeout = 5000");
  conn.exec(`
    CREATE TABLE IF NOT EXISTS trace_owner (
      trace_id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);
  db = conn;
  return conn;
}

// Trace ids are hex; store and compare them lowercase so case never splits one trace in two.
function normalize(traceId: string): string {
  return traceId.trim().toLowerCase();
}

/** Records the user as owner of each trace id it has no owner for yet (first owner wins). */
export function recordTraceOwners(userId: string, traceIds: Iterable<string>): void {
  const conn = ownersDb();
  const insert = conn.prepare("INSERT OR IGNORE INTO trace_owner (trace_id, user_id, created_at) VALUES (?, ?, ?)");
  const now = Date.now();
  conn.transaction(() => {
    for (const traceId of traceIds) {
      const id = normalize(traceId);
      if (id) insert.run(id, userId, now);
    }
  })();
}

/** True only when the trace is recorded as owned by this user. */
export function isTraceOwner(traceId: string, userId: string): boolean {
  const row = ownersDb().prepare("SELECT user_id FROM trace_owner WHERE trace_id = ?").get(normalize(traceId)) as
    | { user_id: string }
    | undefined;
  return row?.user_id === userId;
}
