export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

export type AgentChat = {
  messages: ChatMessage[];
  running: boolean;
  send: (text: string) => void;
  stop: () => void;
};

// TODO(S4): replace with AI SDK useChat + DefaultChatTransport → POST /api/chat/:agentKey.
export function useAgentChat(_agentKey: string): AgentChat {
  return { messages: [], running: false, send: () => undefined, stop: () => undefined };
}
