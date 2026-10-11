import { Agent } from "@mastra/core/agent";
import { memory } from "../memory";
import { wrapMastra } from "neatlogs/mastra";
import { ASSISTANT_INSTRUCTIONS } from "../prompts";
import { marketResearcher } from "./market-researcher";
import { cfoAgent } from "./cfo";

export const assistant = wrapMastra(new Agent({
  id: "assistant",
  name: "Assistant",
  description: "Primary assistant that handles conversations and coordinates specialist agents.",
  instructions: ASSISTANT_INSTRUCTIONS,
  model: "deepseek/deepseek-flash",
  memory,
  agents: { marketResearcher, cfoAgent },
  defaultOptions: {
    maxSteps: 6,
    delegation: {
      onDelegationStart: () => ({ modifiedMaxSteps: 12 }),
    },
  },
}));
