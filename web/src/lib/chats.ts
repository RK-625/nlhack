import { Chat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { handleUnauthorized, onSessionReset } from "@/lib/auth";

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
let version = 0;
let activeKey: string | null = null;

function notify() {
  version += 1;
  for (const listener of listeners) listener();
}

function stampAll(chat: Chat<UIMessage>) {
  for (const message of chat.messages) {
    if (!stamps.has(message.id)) stamps.set(message.id, Date.now());
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
      fetch: async (input, init) => {
        const res = await fetch(input, init);
        if (res.status === 401) handleUnauthorized();
        return res;
      },
    }),
    onFinish: ({ isAbort, isError }) => {
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
  return created;
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
  activeKey = null;
  notify();
}

onSessionReset(resetChats);
