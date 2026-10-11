import { Agent } from "@mastra/core/agent";
import { memory } from "../memory";
import { wrapMastra } from "neatlogs/mastra";
import { ASSISTANT_INSTRUCTIONS } from "../prompts";
import { marketResearcher } from "./market-researcher";
import { cfoAgent } from "./cfo";
import { githubReaderAgent } from "./github";
import { neatlogsReaderAgent } from "./neatlogs";

export const assistant = wrapMastra(new Agent({
  id: "assistant",
  name: "Assistant",
  description: "Primary assistant that handles conversations and coordinates specialist agents.",
  instructions: ASSISTANT_INSTRUCTIONS,
  model: "deepseek/deepseek-flash",
  memory,
  // Delegation gets the read-only GitHub and Neatlogs agents: the assistant's chat cannot
  // show an approval prompt for a sub-agent's write. Writes happen in each agent's own chat.
  // The keys match the registered agents ("githubAgent", "neatlogsAgent") so the prompt and the web UI's "agent-<key>" labels still match.
  agents: { marketResearcher, cfoAgent, githubAgent: githubReaderAgent, neatlogsAgent: neatlogsReaderAgent },
  defaultOptions: {
    maxSteps: 6,
    delegation: {
      onDelegationStart: () => ({ modifiedMaxSteps: 12 }),
    },
  },
}));
