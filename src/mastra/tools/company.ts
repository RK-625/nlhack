import { existsSync, realpathSync } from "node:fs";
import { lstat, readFile, readdir, realpath } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const DEFAULT_COMPANY_DIR = join("company", "lumen-labs");
const MAX_FILE_BYTES = 1_000_000; // larger files are refused; read them in line ranges only if under this
const MAX_OUTPUT_CHARS = 60_000; // per read; the rest is reached through offset/limit
const MAX_LIST_ENTRIES = 500;
const TEXT_EXTENSIONS = new Set([".md", ".csv", ".tsv", ".txt", ".json"]);

/**
 * The shared, read-only company folder: COMPANY_DIR (relative to the working directory) when set,
 * otherwise company/lumen-labs found by walking up from the working directory and from this file.
 * `mastra dev` / `mastra build` run from .mastra/output, so a plain cwd-relative path would miss it.
 * Returns undefined (never throws) when the folder does not exist; the tools then report that.
 */
export function companyRoot(): string | undefined {
  const override = process.env.COMPANY_DIR;
  const candidates: string[] = [];
  if (override) candidates.push(resolve(process.cwd(), override));
  else {
    const starts = [process.cwd(), dirname(fileURLToPath(import.meta.url))];
    for (const start of starts) {
      for (let dir = start; ; dir = dirname(dir)) {
        candidates.push(join(dir, DEFAULT_COMPANY_DIR));
        if (dirname(dir) === dir) break;
      }
    }
  }
  const found = candidates.find((candidate) => existsSync(candidate));
  return found ? realpathSync(found) : undefined;
}

class CompanyFileError extends Error {}

/**
 * Resolves a relative path inside the company root. Rejects absolute paths, ".." escapes and
 * symlinks that leave the root (checked on the real path).
 */
async function resolveInside(root: string, requested: string): Promise<string> {
  if (requested.includes("\0")) throw new CompanyFileError("Invalid path");
  if (isAbsolute(requested) || /^[A-Za-z]:/.test(requested)) throw new CompanyFileError("Absolute paths are not allowed; use a path relative to the company folder");
  const lexical = resolve(root, requested);
  const inside = (p: string) => p === root || p.startsWith(root + sep);
  if (!inside(lexical)) throw new CompanyFileError("Path escapes the company folder");
  let real: string;
  try {
    real = await realpath(lexical);
  } catch {
    throw new CompanyFileError(`Not found: ${requested}`);
  }
  if (!inside(real)) throw new CompanyFileError("Path escapes the company folder");
  return real;
}

function failure(error: unknown): { error: string } {
  if (error instanceof CompanyFileError) return { error: error.message };
  console.warn("[company] file tool failed:", error instanceof Error ? error.message : error);
  return { error: "Could not read the company folder" };
}

const MISSING = { error: "The company folder is not available on this server" };

export const companyListFiles = createTool({
  id: "company_list_files",
  description:
    "List files in the shared, read-only company knowledge folder (fictional company context: finance, HR, sales, legal, marketing, customer success). Recursive, with sizes in bytes. Start with INDEX.md. Optional sub-path, relative to the folder root.",
  inputSchema: z.object({
    path: z.string().optional().describe('Sub-folder relative to the company folder, for example "finance". Defaults to the root.'),
  }),
  execute: async ({ path }) => {
    const root = companyRoot();
    if (!root) return MISSING;
    try {
      const start = await resolveInside(root, path ?? ".");
      const files: { path: string; bytes: number }[] = [];
      let truncated = false;
      const walk = async (dir: string): Promise<void> => {
        for (const entry of (await readdir(dir, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
          if (files.length >= MAX_LIST_ENTRIES) {
            truncated = true;
            return;
          }
          const full = join(dir, entry.name);
          // lstat: symlinks are never followed or listed, so nothing outside the root can appear.
          const info = await lstat(full);
          if (info.isDirectory()) await walk(full);
          else if (info.isFile()) files.push({ path: relative(root, full).split(sep).join("/"), bytes: info.size });
        }
      };
      const info = await lstat(start);
      if (!info.isDirectory()) throw new CompanyFileError("Not a folder; use company_read_file for files");
      await walk(start);
      return { files, truncated };
    } catch (error) {
      return failure(error);
    }
  },
});

export const companyReadFile = createTool({
  id: "company_read_file",
  description:
    "Read a text file (.md, .csv, .tsv, .txt, .json) from the shared, read-only company knowledge folder. Path is relative to the folder root, for example \"INDEX.md\". Optional 1-based line offset and line limit for long files.",
  inputSchema: z.object({
    path: z.string().describe('File path relative to the company folder, for example "finance/budget.csv".'),
    offset: z.number().int().min(1).optional().describe("First line to return (1-based). Defaults to 1."),
    limit: z.number().int().min(1).optional().describe("Maximum number of lines to return."),
  }),
  execute: async ({ path, offset, limit }) => {
    const root = companyRoot();
    if (!root) return MISSING;
    try {
      const real = await resolveInside(root, path);
      const ext = real.slice(real.lastIndexOf(".")).toLowerCase();
      if (!TEXT_EXTENSIONS.has(ext)) throw new CompanyFileError("Only text files (.md, .csv, .tsv, .txt, .json) can be read");
      const info = await lstat(real);
      if (!info.isFile()) throw new CompanyFileError("Not a file; use company_list_files for folders");
      if (info.size > MAX_FILE_BYTES) throw new CompanyFileError("File is too large to read");
      const text = await readFile(real, "utf8");
      if (text.includes("\0")) throw new CompanyFileError("Binary files cannot be read");
      const lines = text.split("\n");
      const start = (offset ?? 1) - 1;
      let content = lines.slice(start, limit === undefined ? undefined : start + limit).join("\n");
      let truncated = false;
      if (content.length > MAX_OUTPUT_CHARS) {
        content = content.slice(0, MAX_OUTPUT_CHARS);
        truncated = true;
      }
      return { path, totalLines: lines.length, content, truncated };
    } catch (error) {
      return failure(error);
    }
  },
});

/** Both tools, to spread into an agent's `tools`. */
export const companyTools = { company_list_files: companyListFiles, company_read_file: companyReadFile };
