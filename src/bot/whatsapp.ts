import { Chat } from "chat";
import { createWhatsAppAdapter } from "@chat-adapter/whatsapp";
import { createMemoryState } from "@chat-adapter/state-memory";
import { mastra } from "../mastra";

export const bot = new Chat({
  userName: "whatsapp",
  adapters: {
    whatsapp: createWhatsAppAdapter(),
  },
  state: createMemoryState(),
});

bot.onDirectMessage(async (thread, message) => {
  if (!message.text) return;
  await thread.post("Please wait, the agent is responding...");
  try {
    const agent = mastra.getAgent("assistant");
    const response = await agent.generate(message.text);
    await thread.post(response.text);
  } catch (error: any) {
    await thread.post(`Sorry, an error occurred: ${error.message}`);
  }
});
