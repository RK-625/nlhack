// Layout and classes ported from rakazo's bots sidebar (apps/web/src/pages/Shell.tsx ~2811-3263),
// Apache-2.0, github.com/elie222/rakazo@912c977. Groups, spaces, archive and the user menu are stripped.
import { Moon, PanelLeftClose, Search, SquarePen, Sun } from "lucide-react";
import { useState } from "react";
import { BotAvatar } from "@/components/avatar/bot-avatar";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import type { UIMessage } from "ai";
import type { AgentRowState } from "@/hooks/useAgentChat";
import type { AgentSummary } from "@/hooks/useAgents";
import { agentAvatarValue } from "@/lib/agent-avatar";
import { type ResolvedAppearance, setUiAppearance } from "@/lib/appearance";
import { messageTime } from "@/lib/chats";
import { messageText } from "@/lib/message-parts";

export function Sidebar({
  agents,
  rows,
  activeKey,
  collapsed,
  mobileOpen,
  onSelect,
  onNewChat,
  onCollapse,
}: {
  agents: AgentSummary[];
  rows: Record<string, AgentRowState>;
  activeKey: string | null;
  collapsed: boolean;
  mobileOpen: boolean;
  onSelect: (key: string) => void;
  onNewChat: () => void;
  onCollapse: () => void;
}) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const visible = needle
    ? agents.filter((agent) => `${agent.name} ${agent.description}`.toLowerCase().includes(needle))
    : agents;

  return (
    <aside
      data-collapsed={collapsed ? "true" : "false"}
      inert={collapsed && !mobileOpen ? true : undefined}
      className={`absolute inset-y-0 start-0 z-40 flex w-[calc(100%-48px)] max-w-[316px] shrink-0 flex-col border-e border-sidebar-border bg-sidebar transition-[transform,width,opacity] md:static md:z-auto md:translate-x-0 ${
        mobileOpen ? "translate-x-0" : "-translate-x-full rtl:translate-x-full"
      } ${
        collapsed
          ? "md:pointer-events-none md:w-0 md:max-w-0 md:overflow-hidden md:border-e-0 md:opacity-0"
          : "md:w-[316px]"
      }`}
    >
      <div className="flex items-center justify-between px-[18px] pb-3 pt-4">
        <span className="text-[17px] font-semibold tracking-tight text-foreground">nlhack</span>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            aria-label="Hide agents"
            title="Hide agents"
            onClick={onCollapse}
            className="hidden h-7 w-7 items-center justify-center rounded-full text-muted-foreground/70 hover:text-foreground/75 md:inline-flex"
          >
            <PanelLeftClose size={15} strokeWidth={1.8} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="New chat"
            title="New chat"
            onClick={onNewChat}
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground/70 hover:text-foreground/75"
          >
            <SquarePen size={15} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </div>
      </div>

      <InputGroup className="mx-2.5 mb-3 w-auto rounded-xl border border-border bg-card text-muted-foreground focus-within:border-ring dark:bg-input">
        <InputGroupAddon>
          <Search size={16} strokeWidth={1.8} aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search"
          aria-label="Search agents"
          autoComplete="off"
          name="sidebar-search"
        />
      </InputGroup>

      <nav aria-label="Agents" className="rk-scroll flex flex-1 flex-col gap-0.5 overflow-y-auto px-2.5 pb-2.5">
        {visible.map((agent) => {
          const row = rows[agent.key];
          const last = row?.messages.at(-1);
          const selected = agent.key === activeKey;
          const lastTime = last ? messageTime(last.id) : undefined;
          const preview = row?.running
            ? "Working…"
            : row?.error
              ? "Reply failed"
              : last
                ? previewText(last) || agent.description
                : agent.description;
          return (
            <button
              key={agent.key}
              type="button"
              aria-current={selected ? "page" : undefined}
              onClick={() => onSelect(agent.key)}
              className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-[10px] text-start ${
                selected ? "bg-sidebar-accent" : "hover:bg-sidebar-accent"
              }`}
            >
              <BotAvatar
                color={agentAvatarValue(agent.id)}
                identity={agent.id}
                size={38}
                status={row?.running ? "running" : undefined}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1.5">
                  <span
                    dir="auto"
                    className={`min-w-0 truncate text-[14px] text-foreground ${
                      row?.unread ? "font-semibold" : "font-medium"
                    }`}
                  >
                    {agent.name}
                    {row?.unread ? <span className="sr-only"> (unread)</span> : null}
                  </span>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {lastTime !== undefined ? (
                      <span className="text-[11.5px] tabular-nums text-muted-foreground/60">
                        {formatRosterTime(lastTime)}
                      </span>
                    ) : null}
                    {row?.unread ? (
                      <span aria-hidden="true" className="inline-block h-2 w-2 rounded-full bg-foreground" />
                    ) : null}
                  </div>
                </div>
                <div
                  dir="auto"
                  className={`mt-1 line-clamp-2 whitespace-normal break-words text-[12.5px] ${
                    row?.running || row?.unread ? "font-medium text-foreground/75" : "text-muted-foreground/60"
                  }`}
                >
                  {preview}
                </div>
              </div>
            </button>
          );
        })}
        {visible.length === 0 ? (
          <p className="px-2.5 py-6 text-center text-[13px] text-muted-foreground">No agents match “{query}”.</p>
        ) : null}
      </nav>

      <ThemeToggle />
    </aside>
  );
}

function ThemeToggle() {
  const [theme, setTheme] = useState<ResolvedAppearance>(() =>
    document.documentElement.dataset.theme === "light" ? "light" : "dark",
  );
  const next = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(setUiAppearance(next))}
      className="mx-3 mb-3 flex items-center gap-3 rounded-xl px-2.5 py-2 hover:bg-sidebar-accent"
    >
      <span className="grid h-[30px] w-[30px] place-items-center rounded-lg bg-accent text-foreground/80">
        {theme === "dark" ? <Sun size={15} strokeWidth={1.8} /> : <Moon size={15} strokeWidth={1.8} />}
      </span>
      <span className="text-[14px] font-medium text-foreground/90">
        {theme === "dark" ? "Light mode" : "Dark mode"}
      </span>
    </button>
  );
}

function previewText(message: UIMessage): string {
  const plain = messageText(message)
    .replace(/[#>*_`|]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  return message.role === "user" ? `You: ${plain}` : plain;
}

/** Time for today, weekday within a week, else a short date (as in rakazo's roster). */
function formatRosterTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }
  const days = (now.getTime() - timestamp) / 86_400_000;
  if (days < 7) return date.toLocaleDateString(undefined, { weekday: "short" });
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
