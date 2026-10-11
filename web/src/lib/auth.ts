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
