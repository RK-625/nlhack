// Sidebar contents in the two layouts the shell uses (Grok Bot style): the expanded panel
// (featured orchestrator tile + "Specialists" rows) and the compact avatar rail.
// Row markup started from rakazo's bots sidebar (apps/web/src/pages/Shell.tsx ~2811-3263),
// Apache-2.0, github.com/elie222/rakazo@912c977.
import type { UIMessage } from "ai";
import { Moon, PanelLeftClose, PanelLeftOpen, Plus, Search, Sun, X } from "lucide-react";
import { AnimatePresence, type Transition, type Variants } from "motion/react";
import * as m from "motion/react-m";
import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import { UserMenu } from "@/auth/UserMenu";
import { BotAvatar } from "@/components/avatar/bot-avatar";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { AgentRowState } from "@/hooks/useAgentChat";
import type { AgentSummary } from "@/hooks/useAgents";
import { agentAvatarValue } from "@/lib/agent-avatar";
import { type ResolvedAppearance, setUiAppearance } from "@/lib/appearance";
import { messageTime } from "@/lib/chats";
import { messageText } from "@/lib/message-parts";
import {
  DURATION,
  enterTransition,
  exitTransition,
  fade,
  INSTANT,
  labelFade,
  pop,
  SPRING,
  STAGGER,
  STAGGER_CAP,
} from "@/lib/motion";
import { agentMatches, groupAgents, PRIMARY_AGENT_KEY } from "@/lib/sidebar";

export type SidebarSearch = {
  query: string;
  setQuery: (query: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
};

export type SidebarPanelProps = {
  agents: AgentSummary[];
  rows: Record<string, AgentRowState>;
  activeKey: string | null;
  onSelect: (key: string) => void;
  onNewChat: () => void;
  search: SidebarSearch;
  /** Switch between expanded and rail (absent on the mobile overlay). */
  onToggleCompact?: () => void;
};

/**
 * Rail ↔ expanded morph state, provided by the docked sidebar (the mobile overlay uses the
 * default: always idle). `chrome` = labels visible; `travel` = the transition shared elements
 * (avatars, the selection highlight, the toggle / new chat / theme controls) use while they
 * fly between layouts.
 *   phase 1: chrome off (labels fade out) → phase 2: layouts flip, shared elements + width
 *   travel → phase 3: chrome on (labels fade in). Collapse is the same sequence in reverse.
 */
export type SidebarMorph = {
  chrome: boolean;
  travel: Transition | undefined;
  /** Called when a shared element's layout animation starts, to start the width in sync. */
  onTravelStart?: () => void;
};
export const SidebarMorphContext = createContext<SidebarMorph>({ chrome: true, travel: undefined });
const useMorph = () => useContext(SidebarMorphContext);

/** Layout-animation props for a shared (layoutId) element: the travel clock mid-morph. */
function useTravel() {
  const { chrome, travel, onTravelStart } = useMorph();
  return chrome ? {} : { transition: travel, onLayoutAnimationStart: onTravelStart };
}

/**
 * A part of a shared control that only one layout shows (the toggle's open/close icon, the
 * rail's dashed outline, the theme chip's fill). A copy mounted by the flip starts from the
 * other layout's value and cross-fades on the travel clock, so the control morphs as it
 * travels instead of switching style on the flip frame.
 */
function SwapLayer({ show, className, children }: { show: boolean; className?: string; children?: ReactNode }) {
  const { chrome, travel } = useMorph();
  return (
    <m.span
      aria-hidden="true"
      initial={chrome ? false : { opacity: show ? 0 : 1 }}
      animate={{ opacity: show ? 1 : 0 }}
      transition={travel ?? INSTANT}
      className={className}
    >
      {children}
    </m.span>
  );
}

/**
 * Anything that isn't a shared avatar: fades out before the layouts flip and back in after
 * the avatars land. Driven by state (initial={false}), so a layout that mounts mid-morph
 * starts hidden and waits for phase 3.
 */
function Label({ children, className, inline = false }: { children: ReactNode; className?: string; inline?: boolean }) {
  const { chrome } = useMorph();
  const props = {
    "data-morph-label": "",
    variants: labelFade,
    initial: false as const,
    animate: chrome ? "visible" : "hidden",
    className,
  };
  return inline ? <m.span {...props}>{children}</m.span> : <m.div {...props}>{children}</m.div>;
}

/** Items rise in one after another; a filtered-out row leaves the way it came. */
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 6, transition: exitTransition(DURATION.base) },
  visible: (index: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: enterTransition(DURATION.base, Math.min(index, STAGGER_CAP) * STAGGER),
  }),
};

// The roster staggers in once per page load, not every time a panel remounts
// (expand/collapse, reopening the mobile overlay).
let rosterStaggered = false;
function useFirstLoadStagger(): boolean {
  const [stagger] = useState(() => !rosterStaggered);
  useEffect(() => {
    rosterStaggered = true;
  }, []);
  return stagger;
}

type Badge = "working" | "error" | "unread" | null;
const badgeFor = (row: AgentRowState | undefined): Badge =>
  row?.running ? "working" : row?.error ? "error" : row?.unread ? "unread" : null;

/**
 * Avatar with a corner badge: pulsing while working, red on failure, a dot when unread.
 * Specialist rows pass `activityOnly` because they show unread as an inline dot instead.
 */
function AgentAvatar({
  agent,
  size,
  row,
  activityOnly = false,
}: {
  agent: AgentSummary;
  size: number;
  row?: AgentRowState;
  activityOnly?: boolean;
}) {
  const travel = useTravel();
  const status = badgeFor(row);
  const badge = activityOnly && status === "unread" ? null : status;
  return (
    // Shared across layouts: the same agent's avatar flies (and scales 40↔56/36) between the
    // rail and the expanded panel instead of disappearing in one and appearing in the other.
    <m.span
      layoutId={`sidebar-avatar-${agent.key}`}
      {...travel}
      data-morph-avatar={agent.key}
      className="relative inline-flex shrink-0"
    >
      <BotAvatar
        color={agentAvatarValue(agent.id)}
        identity={agent.id}
        size={size}
        status={row?.running ? "running" : undefined}
      />
      <AnimatePresence initial={false}>
        {badge ? (
          <m.span
            key={badge}
            data-testid={`badge-${badge}`}
            aria-hidden="true"
            variants={pop}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="absolute -end-0.5 -top-0.5 grid h-3 w-3 place-items-center rounded-full bg-sidebar"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                badge === "working" ? "bg-warning" : badge === "error" ? "bg-destructive" : "bg-foreground"
              }`}
              style={badge === "working" ? { animation: "rkPulse 1.2s ease-in-out infinite" } : undefined}
            />
          </m.span>
        ) : null}
      </AnimatePresence>
    </m.span>
  );
}

/**
 * The one selection highlight, shared by the rail square, the featured tile and the rows:
 * it springs between agents within a layout and travels with the morph between layouts.
 * Radius lives in `style` (14/16/12) so Motion corrects the corners while it stretches.
 */
function SelectedHighlight({ radius }: { radius: number }) {
  const { chrome, travel } = useMorph();
  return (
    <m.span
      layoutId="sidebar-selected"
      data-morph-highlight=""
      transition={chrome ? SPRING : travel}
      aria-hidden="true"
      className="absolute inset-0 z-0 bg-sidebar-accent"
      style={{ borderRadius: radius }}
    />
  );
}

const iconButton =
  "grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground/80 transition-colors duration-(--motion-fast) ease-(--ease-standard) hover:bg-sidebar-accent hover:text-foreground";

/** Expanded layout: wordmark + search/new chat, featured tile, specialists, theme toggle. */
export function ExpandedPanel({ agents, rows, activeKey, onSelect, onNewChat, search, onToggleCompact }: SidebarPanelProps) {
  const stagger = useFirstLoadStagger();
  const matches = (agent: AgentSummary) => agentMatches(agent, search.query);
  const { primary, specialists } = groupAgents(agents);
  const shownPrimary = primary.filter(matches);
  const shownSpecialists = specialists.filter(matches);
  const closeSearch = () => {
    search.setQuery("");
    search.setOpen(false);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-[52px] shrink-0 items-center gap-1 px-3 pt-2">
        <Label className="flex min-w-0 flex-1 items-center gap-1">
          <AnimatePresence mode="wait" initial={false}>
            {search.open ? (
              <m.div key="search" variants={fade} initial="hidden" animate="visible" exit="hidden" className="min-w-0 flex-1">
                <InputGroup className="h-8 rounded-lg border border-border bg-card text-muted-foreground focus-within:border-ring dark:bg-input">
                  <InputGroupAddon>
                    <Search size={14} strokeWidth={1.8} aria-hidden="true" />
                  </InputGroupAddon>
                  <InputGroupInput
                    autoFocus
                    value={search.query}
                    onChange={(event) => search.setQuery(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Escape") closeSearch();
                    }}
                    onBlur={() => {
                      if (!search.query.trim()) closeSearch();
                    }}
                    placeholder="Search agents"
                    aria-label="Search agents"
                    autoComplete="off"
                    name="sidebar-search"
                  />
                  <InputGroupAddon align="inline-end">
                    <button
                      type="button"
                      aria-label="Close search"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={closeSearch}
                      className="grid h-5 w-5 place-items-center rounded text-muted-foreground hover:text-foreground"
                    >
                      <X size={13} strokeWidth={1.8} />
                    </button>
                  </InputGroupAddon>
                </InputGroup>
              </m.div>
            ) : (
              <m.span
                key="wordmark"
                variants={fade}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="min-w-0 flex-1 truncate ps-1.5 text-[15px] font-semibold tracking-tight text-foreground"
              >
                nlhack
              </m.span>
            )}
          </AnimatePresence>
          {search.open ? null : (
            <button type="button" aria-label="Search agents" title="Search" onClick={() => search.setOpen(true)} className={iconButton}>
              <Search size={16} strokeWidth={1.8} aria-hidden="true" />
            </button>
          )}
        </Label>
        <NewChatButton onNewChat={onNewChat} />
        {onToggleCompact ? <ToggleButton onToggle={onToggleCompact} /> : null}
      </div>

      <nav aria-label="Agents" className="rk-scroll relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2.5 pb-3 pt-1">
        <AnimatePresence initial={stagger}>
          {shownPrimary.length > 0 ? (
            <m.div key="featured" layout="position" className="flex flex-wrap justify-center gap-2 px-0.5 pb-3 pt-1">
              {shownPrimary.map((agent, index) => {
                const selected = agent.key === activeKey;
                return (
                  <m.button
                    key={agent.key}
                    type="button"
                    data-testid="featured-agent"
                    custom={index}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    aria-current={selected ? "page" : undefined}
                    onClick={() => onSelect(agent.key)}
                    className={`relative flex w-24 flex-col items-center gap-2 rounded-2xl px-2 pb-2.5 pt-3 transition-colors duration-(--motion-fast) ease-(--ease-standard) ${
                      selected ? "" : "hover:bg-sidebar-accent/60"
                    }`}
                  >
                    {selected ? <SelectedHighlight radius={16} /> : null}
                    <AgentAvatar agent={agent} size={56} row={rows[agent.key]} />
                    <Label inline className="relative w-full truncate text-center text-[13px] font-medium text-foreground">
                      {agent.name}
                    </Label>
                  </m.button>
                );
              })}
            </m.div>
          ) : null}
          {shownSpecialists.length > 0 ? (
            <m.p
              key="specialists-label"
              layout="position"
              variants={fade}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="px-2.5 pb-1.5 pt-1 text-[12px] font-medium text-muted-foreground/70"
            >
              <Label inline>Specialists</Label>
            </m.p>
          ) : null}
          {shownSpecialists.map((agent, index) => (
            <SpecialistRow
              key={agent.key}
              agent={agent}
              index={index + shownPrimary.length}
              row={rows[agent.key]}
              selected={agent.key === activeKey}
              onSelect={onSelect}
            />
          ))}
          {shownPrimary.length + shownSpecialists.length === 0 ? (
            <m.p
              key="no-match"
              variants={fade}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="px-2.5 py-6 text-center text-[13px] text-muted-foreground"
            >
              <Label inline>No agents match “{search.query}”.</Label>
            </m.p>
          ) : null}
        </AnimatePresence>
      </nav>

      <ThemeToggle />
      <UserMenu />
    </div>
  );
}

function SpecialistRow({
  agent,
  index,
  row,
  selected,
  onSelect,
}: {
  agent: AgentSummary;
  index: number;
  row?: AgentRowState;
  selected: boolean;
  onSelect: (key: string) => void;
}) {
  const last = row?.messages.at(-1);
  const lastTime = last ? messageTime(last.id) : undefined;
  const status = row?.running ? "working" : row?.error ? "error" : "idle";
  // One line: the latest message, or the run state. Nothing before the first message.
  const preview = status === "working" ? "Working…" : status === "error" ? "Reply failed" : last ? previewText(last) : "";
  return (
    <m.button
      type="button"
      data-testid="specialist-row"
      layout="position"
      custom={index}
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      aria-current={selected ? "page" : undefined}
      onClick={() => onSelect(agent.key)}
      className="relative flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-start transition-colors duration-(--motion-fast) ease-(--ease-standard) hover:bg-sidebar-accent/60"
    >
      {/* Under the other rows' content too (z-0 vs z-[1]) while it slides between rows. */}
      {selected ? <SelectedHighlight radius={12} /> : null}
      <span className="relative z-[1]">
        <AgentAvatar agent={agent} size={36} row={row} activityOnly />
      </span>
      <Label inline className="relative z-[1] flex min-w-0 flex-1 flex-col">
        <span className="flex items-center justify-between gap-1.5">
          <span
            dir="auto"
            className={`min-w-0 truncate text-[14px] text-foreground ${row?.unread ? "font-semibold" : "font-medium"}`}
          >
            {agent.name}
            {row?.unread ? <span className="sr-only"> (unread)</span> : null}
          </span>
          <span className="flex shrink-0 items-center gap-1.5">
            {lastTime !== undefined ? (
              <span className="text-[11.5px] tabular-nums text-muted-foreground/60">{formatRosterTime(lastTime)}</span>
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
          </span>
        </span>
        {/* Status changes (Working… / failed / latest message) cross-fade. */}
        <AnimatePresence mode="wait" initial={false}>
          {preview ? (
            <m.span
              key={status}
              variants={fade}
              initial="hidden"
              animate="visible"
              exit="hidden"
              dir="auto"
              className={`truncate text-[12.5px] ${
                status !== "idle" || row?.unread ? "font-medium text-foreground/75" : "text-muted-foreground/70"
              }`}
            >
              {preview}
            </m.span>
          ) : null}
        </AnimatePresence>
      </Label>
    </m.button>
  );
}

/** Compact rail: avatars only, featured agent first, then a divider and the specialists. */
export function RailPanel({ agents, rows, activeKey, onSelect, onNewChat, search, onToggleCompact }: SidebarPanelProps) {
  const stagger = useFirstLoadStagger();
  const { chrome } = useMorph();
  const { primary, specialists } = groupAgents(agents);
  const item = (agent: AgentSummary, index: number) => {
    const node = railItem(agent, index);
    // The rail lists every agent; ones hidden by the expanded panel's search have no
    // counterpart to fly to, so they fade like labels instead.
    return agentMatches(agent, search.query) ? (
      node
    ) : (
      <Label key={agent.key} className="flex">
        {node}
      </Label>
    );
  };
  const railItem = (agent: AgentSummary, index: number) => {
    const selected = agent.key === activeKey;
    const specialist = agent.key !== PRIMARY_AGENT_KEY;
    return (
      // Disabled mid-morph: closes an open tooltip and blocks new ones while avatars travel.
      <Tooltip key={agent.key} disabled={!chrome}>
        <TooltipTrigger
          render={
            <button
              type="button"
              data-testid="rail-agent"
              aria-label={agent.name}
              aria-current={selected ? "page" : undefined}
              onClick={() => onSelect(agent.key)}
              className="relative grid h-12 w-12 shrink-0 place-items-center rounded-[14px] transition-colors duration-(--motion-fast) ease-(--ease-standard) hover:bg-sidebar-accent/60"
            />
          }
        >
          {selected ? <SelectedHighlight radius={14} /> : null}
          <m.span
            className="relative z-[1] inline-flex"
            custom={index}
            variants={itemVariants}
            initial={stagger ? "hidden" : false}
            animate="visible"
          >
            {/* A specialist's unread badge counts as a label here: it fades out before the
                morph and the row's inline unread dot fades in after (and the reverse). */}
            <AgentAvatar agent={agent} size={40} row={rows[agent.key]} activityOnly={specialist && !chrome} />
          </m.span>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {agent.name}
        </TooltipContent>
      </Tooltip>
    );
  };

  // The rail layer spans the whole aside (inset-0) with a fixed 76px column, so while the
  // aside is still wider (collapsing) nothing in the rail clips an avatar travelling in.
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-[52px] w-[76px] shrink-0 items-center justify-center pt-2">
        {onToggleCompact ? <ToggleButton compact onToggle={onToggleCompact} /> : null}
      </div>
      <nav aria-label="Agents" className="rk-scroll min-h-0 w-full flex-1 overflow-y-auto overflow-x-hidden py-1">
        <div className="flex w-[76px] flex-col items-center gap-1.5">
          {primary.map((agent, index) => item(agent, index))}
          {primary.length > 0 && specialists.length > 0 ? (
            <Label inline className="my-1 h-px w-8 shrink-0 bg-sidebar-border">
              {null}
            </Label>
          ) : null}
          {specialists.map((agent, index) => item(agent, index + primary.length))}
        </div>
      </nav>
      <div className="flex w-[76px] shrink-0 flex-col items-center gap-1.5 pb-3 pt-2">
        <NewChatButton compact onNewChat={onNewChat} />
        <ThemeToggle compact />
        <UserMenu compact />
      </div>
    </div>
  );
}

// Shared controls: the toggle and theme chip each travel between the expanded header/footer
// and the rail during the morph, like the avatars (layoutId); new chat cross-fades instead.

/** Collapse/expand: travels between the header's end and the rail's top; its icon cross-fades. */
function ToggleButton({ compact = false, onToggle }: { compact?: boolean; onToggle: () => void }) {
  const travel = useTravel();
  const label = compact ? "Expand sidebar" : "Collapse sidebar";
  return (
    <m.button
      type="button"
      layoutId="sidebar-toggle"
      {...travel}
      data-morph-control="toggle"
      aria-label={label}
      title={label}
      onClick={onToggle}
      className={iconButton}
    >
      <SwapLayer show={!compact} className="[grid-area:1/1]">
        <PanelLeftClose size={16} strokeWidth={1.8} />
      </SwapLayer>
      <SwapLayer show={compact} className="[grid-area:1/1]">
        <PanelLeftOpen size={16} strokeWidth={1.8} />
      </SwapLayer>
    </m.button>
  );
}

/**
 * New chat: a header icon button (32px) when expanded, a dashed 40px tile below the rail's
 * list. It doesn't travel: each layout's copy cross-fades with the labels.
 */
function NewChatButton({ compact = false, onNewChat }: { compact?: boolean; onNewChat: () => void }) {
  return (
    <Label inline className="grid shrink-0">
      <button
        type="button"
        data-morph-control="new-chat"
        aria-label="New chat"
        title="New chat"
        onClick={onNewChat}
        className={`grid place-items-center text-muted-foreground transition-colors duration-(--motion-fast) ease-(--ease-standard) hover:text-foreground ${
          compact
            ? "h-10 w-10 rounded-xl border border-dashed border-border hover:border-ring"
            : "h-8 w-8 rounded-lg text-muted-foreground/80 hover:bg-sidebar-accent"
        }`}
      >
        <Plus size={17} strokeWidth={1.8} aria-hidden="true" />
      </button>
    </Label>
  );
}

/**
 * Theme: the icon chip travels between the expanded footer row (where "Light mode"/"Dark mode"
 * is a label beside it) and the rail's last slot; its fill shows only when expanded.
 */
function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const travel = useTravel();
  const [theme, setTheme] = useState<ResolvedAppearance>(() =>
    document.documentElement.dataset.theme === "light" ? "light" : "dark",
  );
  const next = theme === "dark" ? "light" : "dark";
  const label = theme === "dark" ? "Light mode" : "Dark mode";
  const chip = (
    <m.span
      layoutId="sidebar-theme"
      {...travel}
      data-morph-control="theme"
      style={{ borderRadius: 8 }}
      className="relative grid h-[30px] w-[30px] shrink-0 place-items-center text-foreground/80"
    >
      <SwapLayer show={!compact} className="absolute inset-0 rounded-[inherit] bg-accent" />
      <span className="relative grid place-items-center">
        {theme === "dark" ? <Sun size={15} strokeWidth={1.8} /> : <Moon size={15} strokeWidth={1.8} />}
      </span>
    </m.span>
  );
  if (compact) {
    return (
      <button
        type="button"
        aria-label={label}
        title={label}
        onClick={() => setTheme(setUiAppearance(next))}
        className="grid h-10 w-10 place-items-center rounded-xl transition-colors duration-(--motion-fast) ease-(--ease-standard) hover:bg-sidebar-accent"
      >
        {chip}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={() => setTheme(setUiAppearance(next))}
      className="mx-3 mb-3 flex shrink-0 items-center gap-3 rounded-xl px-2.5 py-2 transition-colors duration-(--motion-fast) ease-(--ease-standard) hover:bg-sidebar-accent"
    >
      {chip}
      <Label inline className="text-[14px] font-medium text-foreground/90">
        {label}
      </Label>
    </button>
  );
}

function previewText(message: UIMessage): string {
  const plain = messageText(message)
    .replace(/[#>*_`|]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  return plain && message.role === "user" ? `You: ${plain}` : plain;
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
