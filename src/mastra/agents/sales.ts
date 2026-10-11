import { Agent } from "@mastra/core/agent";
import { memory } from "../memory";
import { turnCapProcessors } from "../../usage/turn-budget";
import { wrapMastra } from "neatlogs/mastra";
import { SALES_INSTRUCTIONS } from "../prompts";

export const salesAgent = wrapMastra(new Agent({
  id: "sales",
  name: "Sales Bot",
  description:
    "Helps with ICPs, prospecting sequences, outreach emails, discovery questions, objection handling, pipeline and forecast reviews, and deal strategy from information you provide. No CRM or live data is connected yet.",
  instructions: SALES_INSTRUCTIONS,
  model: "deepseek/deepseek-flash",
  memory,
  // Per-turn cost and token caps (src/usage), counted across delegated sub-agents too.
  ...turnCapProcessors,
  defaultOptions: { maxSteps: 12 },
}));
