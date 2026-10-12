import { Agent } from "@mastra/core/agent";
import { memory } from "../memory";
import { turnCapProcessors } from "../../usage/turn-budget";
import { wrapMastra } from "neatlogs/mastra";
import { MARKETING_INSTRUCTIONS } from "../prompts";
import { companyTools } from "../tools/company";

export const marketingAgent = wrapMastra(new Agent({
  id: "marketing",
  name: "Marketing Bot",
  description:
    "Helps with positioning, messaging, campaigns, content calendars, SEO briefs, launch plans, and channel strategy. Also reads the company's marketing records (campaigns, signups by channel, positioning, Q4 content calendar) from the shared read-only company folder.",
  instructions: MARKETING_INSTRUCTIONS,
  model: "deepseek/deepseek-flash",
  memory,
  // Per-turn cost and token caps (src/usage), counted across delegated sub-agents too.
  ...turnCapProcessors,
  // Shared read-only company knowledge folder (src/mastra/tools/company.ts).
  tools: companyTools,
  defaultOptions: { maxSteps: 12 },
}));
