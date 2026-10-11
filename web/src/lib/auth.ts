import { createAuthClient } from "better-auth/react";
import { adminClient, usernameClient } from "better-auth/client/plugins";

/**
 * Better Auth client. The API is served from the same origin, so no baseURL: the client falls
 * back to the relative `/api/auth`. Mirrors the server plugins (username sign-in, admin roles).
 */

export type Role = "admin" | "employee";

export const authClient = createAuthClient({
  plugins: [usernameClient(), adminClient()],
});

export const { useSession, signOut } = authClient;

export function signInWithUsername(username: string, password: string) {
  return authClient.signIn.username({ username, password });
}

/** The server stores any string; only these two roles are known to the UI. */
export function toRole(role: string | null | undefined): Role {
  return role === "admin" ? "admin" : "employee";
}

/** Per-user client state (e.g. in-memory chats) registers here to be wiped when the session ends. */
const sessionResetters = new Set<() => void>();

export function onSessionReset(reset: () => void) {
  sessionResetters.add(reset);
}

export function clearSessionState() {
  for (const reset of sessionResetters) reset();
}

/**
 * The server rejected our cookie (401). Drop per-user state and nudge the session store to
 * re-check: get-session then returns null, so the App gate falls back to the login page. The
 * login page makes no requests of its own, so a dead cookie cannot loop.
 */
export function handleUnauthorized() {
  clearSessionState();
  authClient.$store.notify("$sessionSignal");
}
