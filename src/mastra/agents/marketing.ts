import { Agent } from "@mastra/core/agent";
import { memory } from "../memory";
import { wrapMastra } from "neatlogs/mastra";
import { MARKETING_INSTRUCTIONS } from "../prompts";

export const marketingAgent = wrapMastra(new Agent({
  id: "marketing",
  name: "Marketing Agent",
  description:
    "Helps with positioning, messaging, campaigns, content calendars, SEO briefs, launch plans, and channel strategy from information you provide. No analytics or live search data is connected yet.",
  instructions: MARKETING_INSTRUCTIONS,
  model: "deepseek/deepseek-flash",
  memory,
  defaultOptions: { maxSteps: 12 },
}));
