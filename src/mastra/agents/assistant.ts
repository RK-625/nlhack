import { Agent } from "@mastra/core/agent";
import { ASSISTANT_INSTRUCTIONS } from "../prompts";

export const assistant = new Agent({
  id: "assistant",
  name: "Assistant",
  instructions: ASSISTANT_INSTRUCTIONS,
  model: "deepseek/deepseek-flash",
});
