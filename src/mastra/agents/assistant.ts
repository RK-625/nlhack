import { Agent } from "@mastra/core/agent";
import { memory } from "../memory";
import { wrapMastra } from "neatlogs/mastra";
import { ASSISTANT_INSTRUCTIONS } from "../prompts";
import { marketResearcher } from "./market-researcher";
import { cfoAgent } from "./cfo";
import { githubReaderAgent } from "./github";

export const assistant = wrapMastra(new Agent({
  id: "assistant",
  name: "Assistant",
  description: "Primary assistant that handles conversations and coordinates specialist agents.",
  instructions: ASSISTANT_INSTRUCTIONS,
  model: "deepseek/deepseek-flash",
  memory,
  // Delegation gets the read-only GitHub agent: neither the assistant's web chat nor WhatsApp can
  // show an approval prompt for a sub-agent's write. Writes happen in the GitHub agent's own chat.
  // The key stays "githubAgent" so the prompt and the web UI's "agent-githubAgent" label still match.
  agents: { marketResearcher, cfoAgent, githubAgent: githubReaderAgent },
  defaultOptions: {
    maxSteps: 6,
    delegation: {
      onDelegationStart: () => ({ modifiedMaxSteps: 12 }),
    },
  },
}));
