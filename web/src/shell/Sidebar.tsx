// Layout and classes ported from rakazo's bots sidebar (apps/web/src/pages/Shell.tsx ~2811-3263),
// Apache-2.0, github.com/elie222/rakazo@912c977. Groups, spaces, archive and the user menu are stripped.
import { Moon, PanelLeftClose, Search, SquarePen, Sun } from "lucide-react";
import { AnimatePresence, useReducedMotion, type Variants } from "motion/react";
import * as m from "motion/react-m";
import { useState } from "react";
import { BotAvatar } from "@/components/avatar/bot-avatar";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import type { AgentRowState } from "@/hooks/useAgentChat";
import type { AgentSummary } from "@/hooks/useAgents";
import { agentAvatarValue } from "@/lib/agent-avatar";
import { type ResolvedAppearance, setUiAppearance } from "@/lib/appearance";
import { messageTime } from "@/lib/chats";
import {
  DURATION,
  enterTransition,
  exitTransition,
  fade,
  instant,
  pop,
  SIDEBAR_WIDTH,
  SPRING,
  STAGGER,
  STAGGER_CAP,
  sidebarContent,
  sidebarDesktop,
  sidebarMobile,
} from "@/lib/motion";

/** Rows rise in one after another; a filtered-out row leaves the way it came. */
const rowVariants: Variants = {
  hidden: { opacity: 0, y: 6, transition: exitTransition(DURATION.base) },
  visible: (index: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: enterTransition(DURATION.base, Math.min(index, STAGGER_CAP) * STAGGER),
  }),
};

/**
 * Mounted only while visible (App wraps it in AnimatePresence), so opening and closing are
 * one enter/exit pair: docked on desktop the width grows/shrinks and the content fades;
 * as a mobile overlay it slides in from the start edge.
 */
export function Sidebar({
  docked,
  agents,
  rows,
  activeKey,
  onSelect,
  onNewChat,
  onCollapse,
}: {
  docked: boolean;
  agents: AgentSummary[];
  rows: Record<string, AgentRowState>;
  activeKey: string | null;
  onSelect: (key: string) => void;
  onNewChat: () => void;
  onCollapse: () => void;
}) {
  const [query, setQuery] = useState("");
  const reduce = useReducedMotion();
  const needle = query.trim().toLowerCase();
  const visible = needle
    ? agents.filter((agent) => `${agent.name} ${agent.description}`.toLowerCase().includes(needle))
    : agents;

  return (
    <m.aside
      data-testid="sidebar"
      variants={docked ? (reduce ? instant(sidebarDesktop) : sidebarDesktop) : sidebarMobile}
      initial="hidden"
      animate="visible"
      exit="hidden"
      className={
        docked
          ? "relative flex h-full shrink-0 overflow-hidden border-e border-sidebar-border bg-sidebar"
          : "absolute inset-y-0 start-0 z-40 flex w-[calc(100%-48px)] max-w-[284px] flex-col border-e border-sidebar-border bg-sidebar"
      }
    >
      <m.div
        variants={docked ? sidebarContent : undefined}
        className="flex h-full min-h-0 w-full shrink-0 flex-col"
        style={docked ? { width: SIDEBAR_WIDTH } : undefined}
      >
      <div className="flex items-center justify-between px-[18px] pb-3 pt-4">
        <span className="text-[17px] font-semibold tracking-tight text-foreground">nlhack</span>
        <div className="flex items-center gap-2.5">
          {docked ? (
            <button
              type="button"
              aria-label="Hide agents"
              title="Hide agents"
              onClick={onCollapse}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground/70 hover:text-foreground/75"
            >
              <PanelLeftClose size={15} strokeWidth={1.8} aria-hidden="true" />
            </button>
          ) : null}
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

      <nav aria-label="Agents" className="rk-scroll relative flex flex-1 flex-col gap-0.5 overflow-y-auto px-2.5 pb-2.5">
        {/* Own AnimatePresence (initial on) so rows stagger in each time the sidebar mounts.
            Filtered-out rows fade in place, then the rest glide up (layout) — no overlap. */}
        <AnimatePresence>
        {visible.map((agent, index) => {
          const row = rows[agent.key];
          const last = row?.messages.at(-1);
          const selected = agent.key === activeKey;
          const lastTime = last ? messageTime(last.id) : undefined;
          return (
            <m.button
              key={agent.key}
              type="button"
              layout="position"
              custom={index}
              variants={rowVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              aria-current={selected ? "page" : undefined}
              onClick={() => onSelect(agent.key)}
              className="relative flex w-full items-center gap-3 rounded-xl px-2.5 py-[10px] text-start transition-colors duration-(--motion-fast) ease-(--ease-standard) hover:bg-sidebar-accent"
            >
              {selected ? (
                // One highlight shared across rows: it slides to the newly selected agent.
                <m.span
                  layoutId="agent-selected"
                  transition={SPRING}
                  aria-hidden="true"
                  // z-0 / z-[1]: while sliding it passes under the other rows' content too.
                  className="absolute inset-0 z-0 rounded-xl bg-sidebar-accent"
                />
              ) : null}
              <span className="relative z-[1] shrink-0">
                <BotAvatar
                  color={agentAvatarValue(agent.id)}
                  identity={agent.id}
                  size={38}
                  status={row?.running ? "running" : undefined}
                />
              </span>
              <div className="relative z-[1] min-w-0 flex-1">
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
                    <AnimatePresence initial={false}>
                      {row?.unread ? (
                        <m.span
                          key="unread"
                          data-testid="unread-dot"
                          aria-hidden="true"
                          variants={pop}
                          initial="hidden"
                          animate="visible"
                          exit="hidden"
                          className="inline-block h-2 w-2 rounded-full bg-foreground"
                        />
                      ) : null}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </m.button>
          );
        })}
        {visible.length === 0 ? (
          <m.p
            key="no-match"
            variants={fade}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="px-2.5 py-6 text-center text-[13px] text-muted-foreground"
          >
            No agents match “{query}”.
          </m.p>
        ) : null}
        </AnimatePresence>
      </nav>

      <ThemeToggle />
      </m.div>
    </m.aside>
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
