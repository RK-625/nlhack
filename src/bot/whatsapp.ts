import { Chat } from "chat";
import { toAiMessages } from "chat/ai";
import { createWhatsAppAdapter } from "@chat-adapter/whatsapp";
import { createMemoryState } from "@chat-adapter/state-memory";
import { mastra } from "../mastra";

export const bot = new Chat({
  userName: "whatsapp",
  adapters: {
    whatsapp: createWhatsAppAdapter(),
  },
  state: createMemoryState(),
  // The memory state adapter accepts Infinity to disable count-based trimming.
  history: { thread: { maxMessages: Number.POSITIVE_INFINITY } },
  concurrency: {
    strategy: "burst",
    debounceMs: 1000,
    maxQueueSize: 20,
    queueEntryTtlMs: 10 * 60 * 1000,
  },
});

bot.onDirectMessage(async (thread) => {
  try {
    const { messages } = await bot.history.thread.list(thread.id);
    const conversation = await toAiMessages(messages);
    if (!conversation.length) return;
    // Typing is best-effort and does not add progress messages to chat history.
    await thread.startTyping().catch((error: unknown) => {
      console.error("WhatsApp typing indicator failed", error);
    });
    const agent = mastra.getAgent("assistant");
    const response = await agent.generate(conversation);
    if (!response.text.trim()) throw new Error("Assistant returned an empty response");
    await thread.post(response.text);
  } catch (error: unknown) {
    console.error("WhatsApp conversation failed", error);
    await thread.post("Sorry, I couldn't complete that request. Please try again.");
  }
});
