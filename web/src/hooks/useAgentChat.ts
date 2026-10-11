import { useChat } from "@ai-sdk/react";
import type { ChatStatus, UIMessage } from "ai";
import { useSyncExternalStore } from "react";
import {
  chatsVersion,
  dismissHistoryError,
  getChat,
  historyError,
  isHistoryLoading,
  isUnread,
  retryHistory,
  subscribeChats,
} from "@/lib/chats";

export type AgentChat = {
  messages: UIMessage[];
  status: ChatStatus;
  /** True while a request is submitted or a reply is streaming. */
  running: boolean;
  /** True while the saved conversation is being fetched; sending is disabled until then. */
  loading: boolean;
  error: Error | undefined;
  send: (text: string) => void;
  stop: () => void;
  clear: () => void;
  retry: () => void;
  dismissError: () => void;
};

export function isRunning(status: ChatStatus): boolean {
  return status === "submitted" || status === "streaming";
}

/** The open agent's chat, streamed from POST /api/chat/:agentKey. */
export function useAgentChat(agentKey: string): AgentChat {
  const chat = getChat(agentKey);
  const helpers = useChat({ chat, throttle: 50 });
  useSyncExternalStore(subscribeChats, chatsVersion);
  const loading = isHistoryLoading(agentKey);
  const loadError = historyError(agentKey);
  return {
    messages: helpers.messages,
    status: helpers.status,
    running: isRunning(helpers.status),
    loading,
    error: helpers.error ?? loadError,
    send: (text) => {
      const trimmed = text.trim();
      if (!trimmed || isRunning(chat.status) || isHistoryLoading(agentKey)) return;
      void helpers.sendMessage({ text: trimmed });
    },
    stop: () => void helpers.stop(),
    clear: () => {
      void helpers.stop();
      helpers.clearError();
      helpers.setMessages([]);
    },
    retry: () => {
      if (loadError) return retryHistory(agentKey);
      helpers.clearError();
      void helpers.regenerate();
    },
    dismissError: () => {
      helpers.clearError();
      dismissHistoryError(agentKey);
    },
  };
}

export type AgentRowState = { messages: UIMessage[]; running: boolean; unread: boolean; error: boolean };

/** Sidebar summary for every agent, read from the per-agent Chat instances. */
export function useAgentChatSummaries(keys: string[]): Record<string, AgentRowState> {
  useSyncExternalStore(subscribeChats, chatsVersion);
  return Object.fromEntries(
    keys.map((key) => {
      const chat = getChat(key);
      return [
        key,
        { messages: chat.messages, running: isRunning(chat.status), unread: isUnread(key), error: chat.status === "error" },
      ];
    }),
  );
}
