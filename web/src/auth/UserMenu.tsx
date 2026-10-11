import { ChevronsUpDown, LogOut } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { clearSessionState, signOut } from "@/lib/auth";

/** Signed-in user in the sidebar footer: name (+ Admin badge), and a menu with Sign out. */
export function UserMenu({ compact = false }: { compact?: boolean }) {
  const { user, isAdmin } = useCurrentUser();
  const [signingOut, setSigningOut] = useState(false);
  if (!user) return null;

  const initial = (user.name || user.username || "?").trim().charAt(0).toUpperCase();

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      // The gate swaps to the login page once the session clears; wipe in-memory chats either way.
      clearSessionState();
      setSigningOut(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        title={compact ? user.name : undefined}
        className={
          compact
            ? "grid h-10 w-10 place-items-center rounded-xl outline-none transition-colors duration-(--motion-fast) ease-(--ease-standard) hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-ring/50 data-popup-open:bg-sidebar-accent"
            : "mx-3 mb-3 flex min-w-0 items-center gap-3 rounded-xl px-2.5 py-2 text-start outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-ring/50 data-popup-open:bg-sidebar-accent"
        }
      >
        <span
          aria-hidden="true"
          className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full bg-accent text-[13px] font-semibold text-foreground/80"
        >
          {initial}
        </span>
        {compact ? null : (
          <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-foreground/90">{user.name}</span>
        )}
        {isAdmin && !compact ? (
          <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            Admin
          </span>
        ) : null}
        {compact ? null : (
          <ChevronsUpDown size={14} strokeWidth={1.8} aria-hidden="true" className="shrink-0 text-muted-foreground/60" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent side={compact ? "right" : "top"} align={compact ? "end" : "start"} className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-0.5 px-2 py-1.5">
            <span className="truncate text-[13px] font-medium text-foreground">{user.name}</span>
            <span className="truncate text-xs text-muted-foreground">
              {user.username ? `@${user.username} · ` : ""}
              {isAdmin ? "Admin" : "Employee"}
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={signingOut} onClick={() => void handleSignOut()}>
          <LogOut aria-hidden="true" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
