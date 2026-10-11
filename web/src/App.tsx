// Shell layout ported from rakazo (apps/web/src/pages/Shell.tsx ~2748-3520),
// Apache-2.0, github.com/elie222/rakazo@912c977.
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { useEffect, useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAgentChatSummaries } from "@/hooks/useAgentChat";
import { useAgents } from "@/hooks/useAgents";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { getChat, setActiveChat } from "@/lib/chats";
import { backdrop } from "@/lib/motion";
import { ChatPane } from "@/shell/ChatPane";
import { Sidebar, type SidebarSearch } from "@/shell/Sidebar";

const ACTIVE_KEY = "nlhack.activeAgent";

function readPref(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writePref(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Preferences are a convenience; ignore blocked storage.
  }
}

export function App() {
  const agents = useAgents();
  // ?agent=<key|id> deep-links to an agent; otherwise reopen the last one.
  const [activeKey, setActiveKey] = useState<string | null>(
    () => new URLSearchParams(window.location.search).get("agent") ?? readPref(ACTIVE_KEY),
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  // Search lives here so it survives switching between rail/expanded and reopening the overlay.
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const search: SidebarSearch = { query, setQuery, open: searchOpen, setOpen: setSearchOpen };
  const isDesktop = useIsDesktop();
  const overlayOpen = !isDesktop && mobileOpen;

  const active =
    agents.find((agent) => agent.key === activeKey || agent.id === activeKey) ?? agents[0] ?? null;
  const rows = useAgentChatSummaries(agents.map((agent) => agent.key));
  useEffect(() => {
    setActiveChat(active?.key ?? null);
  }, [active?.key]);

  const select = (key: string) => {
    setActiveKey(key);
    writePref(ACTIVE_KEY, key);
    setMobileOpen(false);
  };
  const newChat = () => {
    if (active) {
      const chat = getChat(active.key);
      void chat.stop();
      chat.clearError();
      chat.messages = [];
    }
    setMobileOpen(false);
  };
  const sidebarProps = { agents, rows, activeKey: active?.key ?? null, onSelect: select, onNewChat: newChat, search };

  return (
    <TooltipProvider delay={250}>
      <div className="relative flex h-full min-w-0 overflow-hidden bg-background text-foreground/90">
        <AnimatePresence initial={false}>
          {overlayOpen ? (
            <m.button
              key="backdrop"
              type="button"
              aria-label="Close navigation"
              onClick={() => setMobileOpen(false)}
              variants={backdrop}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="absolute inset-y-0 end-0 start-[min(calc(100%-48px),284px)] z-30 bg-overlay"
            />
          ) : null}
        </AnimatePresence>
        {isDesktop ? (
          // Always docked on desktop: expanded or the compact rail (Sidebar owns that state).
          <Sidebar docked {...sidebarProps} />
        ) : (
          <AnimatePresence initial={false}>
            {mobileOpen ? <Sidebar key="overlay" docked={false} {...sidebarProps} /> : null}
          </AnimatePresence>
        )}
        <main
          aria-hidden={overlayOpen || undefined}
          inert={overlayOpen}
          className="isolate flex min-w-0 flex-1 flex-col bg-background"
        >
          <ChatPane agent={active} agents={agents} onOpenMobileSidebar={() => setMobileOpen(true)} />
        </main>
      </div>
    </TooltipProvider>
  );
}
