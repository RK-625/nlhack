import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getMigrations } from "better-auth/db/migration";
import { z } from "zod";
import { auth, type Role } from "./index";

const seedUserSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(8),
  name: z.string().min(1),
  role: z.enum(["admin", "employee"] satisfies Role[]),
});

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

for (const { username, password, name, role } of users) {
  // The username plugin stores usernames lowercased.
  const existing = await adapter.findOne({ model: "user", where: [{ field: "username", value: username.toLowerCase() }] });
  if (existing) {
    console.info(`skip ${username} (exists)`);
    continue;
  }
  await auth.api.createUser({ body: { email: `${username}@local.test`, password, name, role, data: { username } } });
  console.info(`created ${username} (${role})`);
}
