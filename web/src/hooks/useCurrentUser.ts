import { type Role, toRole, useSession } from "@/lib/auth";

/** The signed-in user and their (normalized) role; `user` is null while signed out or loading. */
export function useCurrentUser() {
  const { data: session } = useSession();
  const user = session?.user ?? null;
  const role: Role = toRole(user?.role);
  return { user, role, isAdmin: role === "admin" };
}
