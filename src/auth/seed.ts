import { existsSync, readFileSync, rmSync } from "node:fs";
import { resolve, sep } from "node:path";
import { createInterface } from "node:readline/promises";
import Database from "better-sqlite3";
import { LibSQLStore } from "@mastra/libsql";
import { Memory } from "@mastra/memory";
import { getMigrations } from "better-auth/db/migration";
import { z } from "zod";
import { dataDir } from "../data-dir";
import { userFilesDir } from "../mastra/workspace";
import { auth, type Role } from "./index";

const seedUserSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(8),
  name: z.string().min(1),
  role: z.enum(["admin", "employee"] satisfies Role[]),
});

// Syncs the database with seed-users.json: creates missing users, leaves existing ones untouched,
// and (after confirmation) removes users that are not listed. Flags: --yes (skip the prompt), --dry-run.
const yes = process.argv.includes("--yes");
const dryRun = process.argv.includes("--dry-run");

// Create any missing auth tables/columns (no-op when the schema is current).
const { toBeCreated, toBeAdded, runMigrations } = await getMigrations(auth.options);
if (toBeCreated.length > 0 || toBeAdded.length > 0) {
  await runMigrations();
  console.info(`Created auth tables: ${[...toBeCreated, ...toBeAdded].map((t) => t.table).join(", ")}`);
}

const file = resolve(process.cwd(), "seed-users.json");
if (!existsSync(file)) {
  console.error("seed-users.json not found. Copy seed-users.example.json to seed-users.json and set passwords.");
  process.exit(1);
}

const users = z.array(seedUserSchema).parse(JSON.parse(readFileSync(file, "utf8")));
const { adapter } = await auth.$context;
// The username plugin stores usernames lowercased.
const listed = new Set(users.map((u) => u.username.toLowerCase()));
const dbUsers = await adapter.findMany<{ id: string; username?: string | null; email: string; role?: string | null }>({ model: "user" });
const existing = new Set(dbUsers.map((u) => u.username ?? ""));

let created = 0;
let kept = 0;
for (const { username, password, name, role } of users) {
  if (existing.has(username.toLowerCase())) {
    console.info(`keep ${username}`);
    kept++;
    continue;
  }
  if (dryRun) {
    console.info(`would create ${username} (${role})`);
  } else {
    await auth.api.createUser({ body: { email: `${username}@local.test`, password, name, role, data: { username } } });
    console.info(`created ${username} (${role})`);
  }
  created++;
}

const stale = dbUsers.filter((u) => !listed.has(u.username ?? ""));
let removed = 0;
if (stale.length > 0) {
  console.info(`\nNot in seed-users.json (${stale.length}):`);
  for (const u of stale) console.info(`  ${u.username ?? u.email} (${u.role ?? "employee"})`);
  console.info("Removal deletes each user's login, sessions, chats, files folder, usage caps, cfo.ai connection and trace ownership.");
  if (!users.some((u) => u.role === "admin")) {
    console.error("Removal aborted: seed-users.json has no admin user, so no admin would remain.");
    process.exitCode = 1;
  } else if (dryRun) {
    for (const u of stale) console.info(`would remove ${u.username ?? u.email}`);
  } else if (await confirmRemoval(stale.length)) {
    for (const u of stale) {
      await removeUser(u.id);
      console.info(`removed ${u.username ?? u.email}`);
      removed++;
    }
  } else {
    console.info("Removal skipped.");
  }
}
console.info(`${dryRun ? "dry run: " : ""}created ${created}, kept ${kept}, removed ${removed}`);

async function confirmRemoval(count: number): Promise<boolean> {
  if (yes) return true;
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    console.info("Not an interactive terminal: pass --yes to remove them.");
    return false;
  }
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(`Remove these ${count} user(s) and all their data? [y/N] `);
  rl.close();
  return /^y(es)?$/i.test(answer.trim());
}

// Deletes one user and everything keyed by their id. Order: sessions (locks them out), chats,
// app rows, files, then the user record last so a failed run can simply be repeated.
async function removeUser(userId: string): Promise<void> {
  await adapter.deleteMany({ model: "session", where: [{ field: "userId", value: userId }] });

  // Chats: Mastra threads use the user id as resourceId (src/chat-api.ts).
  const memory = new Memory({ storage: new LibSQLStore({ id: "mastra", url: `file:${resolve(dataDir(), "mastra.db")}` }) });
  const { threads } = await memory.listThreads({ filter: { resourceId: userId }, perPage: false });
  for (const t of threads) await memory.deleteThread(t.id);

  // App tables in auth.db; each is created lazily by its feature, so skip the ones not there yet.
  const db = new Database(resolve(dataDir(), "auth.db"));
  try {
    db.pragma("busy_timeout = 5000");
    for (const table of ["agent_caps", "cfo_connections", "cfo_oauth_pending", "trace_owner"]) {
      if (db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(table)) {
        db.prepare(`DELETE FROM ${table} WHERE user_id = ?`).run(userId);
      }
    }
  } finally {
    db.close();
  }

  // Files: only ever inside DATA_DIR/files (userFilesDir refuses unsafe ids).
  const dir = userFilesDir(userId);
  if (!dir.startsWith(resolve(dataDir(), "files") + sep)) throw new Error(`Refusing to delete outside DATA_DIR/files: ${dir}`);
  rmSync(dir, { recursive: true, force: true });

  await adapter.deleteMany({ model: "account", where: [{ field: "userId", value: userId }] });
  await adapter.delete({ model: "user", where: [{ field: "id", value: userId }] });
}
