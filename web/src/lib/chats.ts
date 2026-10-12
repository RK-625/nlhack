import { Chat } from "@ai-sdk/react";
import { DefaultChatTransport, isToolUIPart, type UIMessage } from "ai";
import { handleUnauthorized, onSessionReset } from "@/lib/auth";
import { restorePendingApprovals, shouldResumeToolApprovals } from "@/lib/chat-approvals";

/**
 * One AI SDK `Chat` per agent, kept for the whole session. useChat({ chat }) renders whichever
 * is open; because the state lives in the Chat instance (not the component), history survives
 * switching agents and a reply keeps streaming in the background. The sidebar subscribes to
 * every chat through the same store.
 */

const chats = new Map<string, Chat<UIMessage>>();
const listeners = new Set<() => void>();
const unread = new Set<string>();
/** Client-side receive time per message id (the stream carries no timestamps). */
const stamps = new Map<string, number>();
/** Agents whose saved history is still being fetched; sending waits for it. */
const loading = new Set<string>();
/** Last history load/clear failure per agent, shown like any other chat error. */
const historyErrors = new Map<string, Error>();
const clearing = new Set<string>();
/** Bumped by resetChats so a history response for a previous user is dropped. */
let epoch = 0;
let version = 0;
let activeKey: string | null = null;

function notify() {
  version += 1;
  for (const listener of listeners) listener();
}

function stampAll(chat: Chat<UIMessage>) {
  for (const message of chat.messages) {
    if (stamps.has(message.id)) continue;
    const created = (message.metadata as { createdAt?: string | number } | undefined)?.createdAt;
    const at = created ? new Date(created).getTime() : Number.NaN;
    stamps.set(message.id, Number.isNaN(at) ? Date.now() : at);
  }
}

export function getChat(agentKey: string): Chat<UIMessage> {
  let chat = chats.get(agentKey);
  if (chat) return chat;
  chat = new Chat<UIMessage>({
    id: agentKey,
    transport: new DefaultChatTransport({
      api: `/api/chat/${encodeURIComponent(agentKey)}`,
      // Same response goes back to useChat (its error flow is unchanged); a 401 also ends the session.
      // History lives server-side (Mastra Memory), so only the newest message is sent: the user's
      // message, or after an Approve/Deny the assistant message holding that decision.
      prepareSendMessagesRequest: ({ messages, body }) => ({ body: { ...body, message: messages.at(-1) } }),
      fetch: async (input, init) => {
        const res = await fetch(input, init);
        if (res.status === 401) handleUnauthorized();
        return res;
      },
    }),
    // Once every tool approval in the last reply is answered, send the decisions to resume the run.
    sendAutomaticallyWhen: shouldResumeToolApprovals,
    onFinish: ({ isAbort, isError }) => {
      if (!isAbort && !isError) void refreshPendingApprovals(agentKey, created);
      if (!isAbort && !isError && activeKey !== agentKey) {
        unread.add(agentKey);
        notify();
      }
    },
  });
  const created = chat;
  created["~registerMessagesCallback"](() => {
    stampAll(created);
    notify();
  }, 120);
  created["~registerStatusCallback"](notify);
  created["~registerErrorCallback"](notify);
  chats.set(agentKey, created);
  void loadHistory(agentKey, created);
  return created;
}

const historyUrl = (agentKey: string) => `/api/chat/${encodeURIComponent(agentKey)}/history`;

async function refreshPendingApprovals(agentKey: string, chat: Chat<UIMessage>) {
  const message = chat.messages.at(-1);
  if (!message?.parts.some((part) => isToolUIPart(part) && part.state === "input-available")) return;
  const mine = epoch;
  try {
    const res = await fetch(historyUrl(agentKey));
    if (mine !== epoch || chat.messages.at(-1) !== message || chat.status !== "ready") return;
    if (res.status === 401) return handleUnauthorized();
    if (!res.ok) throw new Error(`Couldn't restore pending approvals (${res.status}).`);
    const data = (await res.json()) as { messages?: UIMessage[] };
    if (mine !== epoch || chat.messages.at(-1) !== message || chat.status !== "ready") return;
    const saved = data.messages?.find((item) => item.id === message.id);
    if (!saved) return;
    const restored = restorePendingApprovals(message, saved);
    if (restored !== message) chat.messages = [...chat.messages.slice(0, -1), restored];
  } catch (error) {
    if (mine === epoch && chat.messages.at(-1) === message) {
      historyErrors.set(agentKey, error instanceof Error ? error : new Error(String(error)));
      notify();
    }
  }
}

/** Seeds the Chat from the saved thread. Resolves before anything can be sent (the composer waits on `loading`). */
async function loadHistory(agentKey: string, chat: Chat<UIMessage>) {
  const mine = epoch;
  loading.add(agentKey);
  historyErrors.delete(agentKey);
  notify();
  try {
    const res = await fetch(historyUrl(agentKey));
    if (mine !== epoch) return;
    if (res.status === 401) {
      handleUnauthorized();
      return;
    }
    if (!res.ok) throw new Error(`Couldn't load the conversation (${res.status}).`);
    const data = (await res.json()) as { messages?: UIMessage[] };
    if (mine === epoch && chat.messages.length === 0 && Array.isArray(data.messages)) {
      chat.messages = data.messages;
    }
  } catch (error) {
    if (mine === epoch) historyErrors.set(agentKey, error instanceof Error ? error : new Error(String(error)));
  } finally {
    if (mine === epoch) {
      loading.delete(agentKey);
      notify();
    }
  }
}

export function isHistoryLoading(agentKey: string): boolean {
  return loading.has(agentKey);
}

export function historyError(agentKey: string): Error | undefined {
  return historyErrors.get(agentKey);
}

export function dismissHistoryError(agentKey: string) {
  if (historyErrors.delete(agentKey)) notify();
}

export function retryHistory(agentKey: string) {
  const chat = chats.get(agentKey);
  if (chat) void loadHistory(agentKey, chat);
}

/** New chat: delete the saved thread first; on failure keep the messages and surface the error. */
export async function clearChatHistory(agentKey: string) {
  if (clearing.has(agentKey)) return;
  const chat = getChat(agentKey);
  const mine = epoch;
  clearing.add(agentKey);
  void chat.stop();
  chat.clearError();
  historyErrors.delete(agentKey);
  try {
    const res = await fetch(historyUrl(agentKey), { method: "DELETE" });
    if (mine !== epoch) return;
    if (res.status === 401) {
      handleUnauthorized();
      return;
    }
    if (!res.ok) throw new Error(`Couldn't clear the conversation (${res.status}).`);
    chat.messages = [];
  } catch (error) {
    if (mine === epoch) historyErrors.set(agentKey, error instanceof Error ? error : new Error(String(error)));
  } finally {
    clearing.delete(agentKey);
    notify();
  }
}

export function subscribeChats(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function chatsVersion(): number {
  return version;
}

export function setActiveChat(agentKey: string | null) {
  activeKey = agentKey;
  if (agentKey && unread.delete(agentKey)) notify();
}

export function isUnread(agentKey: string): boolean {
  return unread.has(agentKey);
}

export function messageTime(messageId: string): number | undefined {
  return stamps.get(messageId);
}

/** Forget every conversation: the next user in this tab must not see the previous user's chats. */
export function resetChats() {
  for (const chat of chats.values()) void chat.stop();
  chats.clear();
  unread.clear();
  stamps.clear();
  loading.clear();
  historyErrors.clear();
  clearing.clear();
  epoch += 1;
  activeKey = null;
  notify();
}

onSessionReset(resetChats);
