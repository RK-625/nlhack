import { Agent } from "@mastra/core/agent";

export const assistant = new Agent({
  id: "assistant",
  name: "Assistant",
  instructions: "You are a helpful assistant. Answer clearly and concisely.",
  model: "anthropic/claude-sonnet-5-5",
});
