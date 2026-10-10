// Shell layout ported from rakazo (apps/web/src/pages/Shell.tsx ~2748-3520),
// Apache-2.0, github.com/elie222/rakazo@912c977.
import { useEffect, useState } from "react";
import { useAgentChatSummaries } from "@/hooks/useAgentChat";
import { useAgents } from "@/hooks/useAgents";
import { getChat, setActiveChat } from "@/lib/chats";
import { ChatPane } from "@/shell/ChatPane";
import { Sidebar } from "@/shell/Sidebar";

const ACTIVE_KEY = "nlhack.activeAgent";
const COLLAPSED_KEY = "nlhack.sidebarCollapsed";

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
  const [collapsed, setCollapsed] = useState(() => readPref(COLLAPSED_KEY) === "true");
  const [mobileOpen, setMobileOpen] = useState(false);

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
  const setCollapsedPref = (value: boolean) => {
    setCollapsed(value);
    writePref(COLLAPSED_KEY, String(value));
  };

  return (
    <div className="relative flex h-full min-w-0 overflow-hidden bg-background text-foreground/90">
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
          className="absolute inset-y-0 end-0 start-[min(calc(100%-48px),316px)] z-30 bg-overlay md:hidden"
        />
      ) : null}
      <Sidebar
        agents={agents}
        rows={rows}
        activeKey={active?.key ?? null}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onSelect={select}
        onNewChat={() => {
          if (active) {
            const chat = getChat(active.key);
            void chat.stop();
            chat.clearError();
            chat.messages = [];
          }
          setMobileOpen(false);
        }}
        onCollapse={() => setCollapsedPref(true)}
      />
      <main
        aria-hidden={mobileOpen || undefined}
        inert={mobileOpen}
        className="isolate flex min-w-0 flex-1 flex-col bg-background"
      >
        <ChatPane
          agent={active}
          agents={agents}
          sidebarCollapsed={collapsed}
          onOpenMobileSidebar={() => setMobileOpen(true)}
          onRestoreSidebar={() => setCollapsedPref(false)}
        />
      </main>
    </div>
  );
}
