import { Chat } from "chat";
import { toAiMessages } from "chat/ai";
import { createWhatsAppAdapter } from "@chat-adapter/whatsapp";
import { createMemoryState } from "@chat-adapter/state-memory";
import { mastra } from "../mastra";
import { log, trace } from "neatlogs";
import { conversationSessionId, traceRequest } from "../telemetry";

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
  const started = Date.now();
  try {
    await traceRequest("whatsapp", conversationSessionId(thread.id), async () => {
      let conversation: Awaited<ReturnType<typeof toAiMessages>> = [];
      await trace({ name: "whatsapp.history", kind: "RETRIEVER" }, async (activeSpan) => {
        const { messages } = await bot.history.thread.list(thread.id);
        conversation = await toAiMessages(messages);
        const historyBytes = Buffer.byteLength(JSON.stringify(conversation), "utf8");
        activeSpan.setAttribute("app.history.messages", conversation.length);
        activeSpan.setAttribute("app.history.bytes", historyBytes);
        log("History loaded", { messages: conversation.length, historyBytes });
        return { messages: conversation.length, historyBytes };
      });
      if (!conversation.length) return;
      console.info("WhatsApp assistant started", { messages: conversation.length });
      // Typing is best-effort and does not add progress messages to chat history.
      await thread.startTyping().catch((error: unknown) => {
        console.error("WhatsApp typing indicator failed", error);
      });
      const agent = mastra.getAgent("assistant");
      const response = await agent.generate(conversation);
      if (!response.text.trim()) throw new Error("Assistant returned an empty response");
      await trace({ name: "whatsapp.reply", kind: "TOOL" }, async () => {
        await thread.post(response.text);
        return { sent: true };
      });
      console.info("WhatsApp reply sent", { durationMs: Date.now() - started });
      return response.text;
    });
  } catch (error: unknown) {
    console.error("WhatsApp conversation failed", error);
    await thread.post("Sorry, I couldn't complete that request. Please try again.").catch((replyError: unknown) => {
      console.error("WhatsApp error reply failed", replyError);
    });
  }
});
