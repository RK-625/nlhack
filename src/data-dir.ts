import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

// Absolute DATA_DIR (default ./data), created on first use; shared by auth.db and mastra.db.
export function dataDir(): string {
  const dir = resolve(process.cwd(), process.env.DATA_DIR ?? "./data");
  mkdirSync(dir, { recursive: true });
  return dir;
}
