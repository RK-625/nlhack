import { Agent } from "@mastra/core/agent";
import { memory } from "../memory";
import { wrapMastra } from "neatlogs/mastra";
import { ASSISTANT_INSTRUCTIONS } from "../prompts";
import { marketResearcher } from "./market-researcher";
import { cfoAgent } from "./cfo";
import { githubAgent } from "./github";
import { neatlogsAgent } from "./neatlogs";
import { customerSuccessAgent } from "./customer-success";
import { legalAgent } from "./legal";
import { hrAgent } from "./hr";
import { marketingAgent } from "./marketing";
import { salesAgent } from "./sales";

export const assistant = wrapMastra(new Agent({
  id: "assistant",
  name: "Assistant",
  description: "Primary assistant that handles conversations and coordinates specialist agents.",
  instructions: ASSISTANT_INSTRUCTIONS,
  model: "deepseek/deepseek-flash",
  memory,
  // The GitHub and Neatlogs agents are the same write-capable agents the web app chats with. A
  // sub-agent tool call that needs approval suspends this run too: the approval request surfaces
  // on the "agent-<key>" delegation call in the Assistant's own chat (carrying the real nested
  // tool name and arguments), and approving or denying it resumes the sub-agent from there.
  // The keys match the registered agents so the web UI's "agent-<key>" labels resolve.
  agents: { marketResearcher, cfoAgent, githubAgent, neatlogsAgent, customerSuccessAgent, legalAgent, hrAgent, marketingAgent, salesAgent },
  defaultOptions: {
    maxSteps: 6,
    delegation: {
      onDelegationStart: () => ({ modifiedMaxSteps: 12 }),
    },
  },
}));
