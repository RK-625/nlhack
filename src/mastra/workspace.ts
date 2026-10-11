import { mkdirSync } from "node:fs";
import { join } from "node:path";
import type { RequestContext } from "@mastra/core/request-context";
import { LocalFilesystem, WORKSPACE_TOOLS, Workspace } from "@mastra/core/workspace";
import { dataDir } from "../data-dir";

/**
 * RequestContext key holding the signed-in user's id. Only the server sets it (src/chat-api.ts),
 * never from client input. Delegated sub-agents receive a copy of the caller's RequestContext, so
 * they resolve the same folder.
 */
export const WORKSPACE_USER_KEY = "nlhack.workspaceUserId";

/** Folder used when no user is in the RequestContext: the CLI (`npm start`) and `mastra dev`. */
const LOCAL_FOLDER = "local";

const SAFE_USER_ID = /^[A-Za-z0-9_-]{1,128}$/;

/**
 * The user's own folder, DATA_DIR/files/<userId>. The id must be a plain folder name; anything
 * else is refused rather than mapped onto a shared or parent folder.
 */
export function userFilesDir(userId: string): string {
  if (!SAFE_USER_ID.test(userId)) throw new Error("Refusing file workspace: user id is not a safe folder name");
  return join(dataDir(), "files", userId);
}

function folderFor(requestContext: RequestContext | undefined): string {
  const value = typeof requestContext?.get === "function" ? requestContext.get(WORKSPACE_USER_KEY) : undefined;
  if (value === undefined || value === null) return userFilesDir(LOCAL_FOLDER);
  if (typeof value !== "string") throw new Error("Refusing file workspace: user id is not a string");
  return userFilesDir(value);
}

const FS = WORKSPACE_TOOLS.FILESYSTEM;

/**
 * One private file folder per user, shared by every agent. Files persist on disk across chats and
 * restarts. Only deleting needs the user's approval; editing in place (edit_file, ast_edit) is off,
 * and no sandbox or search index is configured, so no command or index tools exist.
 */
export const workspace = new Workspace({
  id: "user-files",
  name: "User files",
  filesystem: ({ requestContext }) => {
    const basePath = folderFor(requestContext);
    mkdirSync(basePath, { recursive: true });
    return new LocalFilesystem({
      basePath,
      contained: true,
      // Replaces the default text, which would put the absolute disk path in the prompt.
      instructions:
        "This is the current user's private file workspace. Use relative paths such as \"notes/plan.md\" (the root is \".\"); absolute paths and paths outside it are refused.",
    });
  },
  tools: {
    // Off by default, so only the tools listed as enabled below are ever exposed.
    enabled: false,
    requireApproval: false,
    [FS.READ_FILE]: { enabled: true },
    [FS.WRITE_FILE]: { enabled: true },
    [FS.LIST_FILES]: { enabled: true },
    [FS.GREP]: { enabled: true },
    [FS.FILE_STAT]: { enabled: true },
    [FS.MKDIR]: { enabled: true },
    [FS.DELETE]: { enabled: true, requireApproval: true },
    [FS.EDIT_FILE]: { enabled: false },
    [FS.AST_EDIT]: { enabled: false },
  },
});
