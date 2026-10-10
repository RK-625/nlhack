import { useSyncExternalStore } from "react";
import type { ToolStepsBlock } from "@/components/chat/ToolActivityDisclosure";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  createdAt: number;
  /** Tool activity shown above an assistant reply. */
  tools?: ToolStepsBlock;
};

export type AgentChat = {
  messages: ChatMessage[];
  running: boolean;
  send: (text: string) => void;
  stop: () => void;
  clear: () => void;
};

// ---------------------------------------------------------------------------
// S2 static data: an in-memory fake chat store so the shell can be exercised.
// TODO(S4): replace with AI SDK useChat + DefaultChatTransport → POST /api/chat/:agentKey.
// ---------------------------------------------------------------------------

type AgentState = { messages: ChatMessage[]; running: boolean; unread: boolean };

const FAKE_REPLY_MS = 1200;
const minutesAgo = (m: number) => Date.now() - m * 60_000;
let nextId = 1;
const newId = () => `local-${nextId++}`;

const seed: Record<string, ChatMessage[]> = {
  assistant: [
    { id: "s1", role: "user", text: "What can your team help me with?", createdAt: minutesAgo(42) },
    {
      id: "s2",
      role: "assistant",
      createdAt: minutesAgo(41),
      text: [
        "I coordinate two specialists:",
        "",
        "- **Market Researcher** — companies, competitors, pricing, funding and headcount.",
        "- **CFO Agent** — runway, burn, budgets, pricing and hiring scenarios.",
        "",
        "Ask me anything and I'll delegate when a specialist is the better fit.",
      ].join("\n"),
    },
    { id: "s3", role: "user", text: "How long is our runway if we hire two engineers?", createdAt: minutesAgo(12) },
    {
      id: "s4",
      role: "assistant",
      createdAt: minutesAgo(11),
      tools: {
        kind: "steps",
        steps: [
          { label: "Delegated to CFO Agent", count: 1 },
          { label: "Calculated burn scenarios", count: 2 },
        ],
        durationMs: 4200,
      },
      text: [
        "### Runway check",
        "",
        "With a **monthly burn** of `$42k` you have roughly *14 months*.",
        "",
        "| Scenario | Burn | Runway |",
        "| --- | ---: | ---: |",
        "| Today | $42k | 14 mo |",
        "| +2 engineers | $58k | 10 mo |",
        "",
        "Confirm Q4 revenue and I can tighten the estimate.",
      ].join("\n"),
    },
  ],
  marketResearcher: [
    { id: "m1", role: "user", text: "Who are the main competitors to Mastra?", createdAt: minutesAgo(60 * 26) },
    {
      id: "m2",
      role: "assistant",
      createdAt: minutesAgo(60 * 26 - 1),
      tools: { kind: "steps", steps: [{ label: "Searched the web", count: 3 }], durationMs: 6100 },
      text: "The closest are **LangGraph**, **CrewAI** and the **OpenAI Agents SDK**. I can pull funding and headcount for each from Crustdata.",
    },
  ],
};

const state: Record<string, AgentState> = {};
const timers = new Map<string, number>();
const listeners = new Set<() => void>();

function get(key: string): AgentState {
  state[key] ??= { messages: seed[key] ?? [], running: false, unread: false };
  return state[key];
}

let version = 0;

function update(key: string, patch: Partial<AgentState>) {
  state[key] = { ...get(key), ...patch };
  version += 1;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

let activeKey: string | null = null;

/** Tells the fake store which agent is open, so replies elsewhere mark it unread. */
export function setActiveAgent(key: string | null) {
  activeKey = key;
  if (key && get(key).unread) update(key, { unread: false });
}

function cannedReply(text: string): string {
  return [
    `This is a placeholder reply — live agent responses arrive in **S4**.`,
    "",
    `> ${text.replace(/\s+/g, " ").slice(0, 140)}`,
  ].join("\n");
}

const actions = (key: string) => ({
  send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || get(key).running) return;
    const user: ChatMessage = { id: newId(), role: "user", text: trimmed, createdAt: Date.now() };
    update(key, { messages: [...get(key).messages, user], running: true });
    const started = Date.now();
    timers.set(
      key,
      window.setTimeout(() => {
        timers.delete(key);
        const reply: ChatMessage = {
          id: newId(),
          role: "assistant",
          text: cannedReply(trimmed),
          createdAt: Date.now(),
          tools: { kind: "steps", steps: [{ label: "Thought about it", count: 1 }], durationMs: Date.now() - started },
        };
        update(key, { messages: [...get(key).messages, reply], running: false, unread: activeKey !== key });
      }, FAKE_REPLY_MS),
    );
  },
  stop() {
    window.clearTimeout(timers.get(key));
    timers.delete(key);
    update(key, { running: false });
  },
  clear() {
    window.clearTimeout(timers.get(key));
    timers.delete(key);
    update(key, { messages: [], running: false });
  },
});

export function useAgentChat(agentKey: string): AgentChat {
  const current = useSyncExternalStore(subscribe, () => get(agentKey));
  return { messages: current.messages, running: current.running, ...actions(agentKey) };
}

/** Sidebar summary for every agent: last message, running and unread flags. */
export function useAgentChatSummaries(keys: string[]): Record<string, AgentState> {
  useSyncExternalStore(subscribe, () => version);
  return Object.fromEntries(keys.map((key) => [key, get(key)]));
}
