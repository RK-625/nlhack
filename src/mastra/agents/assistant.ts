import { Agent } from "@mastra/core/agent";
import { ASSISTANT_INSTRUCTIONS } from "../prompts";
import { marketResearcher } from "./market-researcher";

export const assistant = new Agent({
  id: "assistant",
  name: "Assistant",
  description: "Primary assistant that handles conversations and coordinates specialist agents.",
  instructions: ASSISTANT_INSTRUCTIONS,
  model: "deepseek/deepseek-flash",
  agents: { marketResearcher },
  defaultOptions: {
    maxSteps: 6,
    delegation: {
      onDelegationStart: () => ({ modifiedMaxSteps: 12 }),
    },
  },
});
