import { Agent } from "@mastra/core/agent";
import { memory } from "../memory";
import { wrapMastra } from "neatlogs/mastra";
import { HR_INSTRUCTIONS } from "../prompts";

export const hrAgent = wrapMastra(new Agent({
  id: "hr",
  name: "HR Agent",
  description:
    "Helps with hiring plans, job descriptions, interview loops, onboarding, people policies, performance reviews, and compensation band framing from information you provide, handling personal data carefully. No HR system is connected yet.",
  instructions: HR_INSTRUCTIONS,
  model: "deepseek/deepseek-flash",
  memory,
  defaultOptions: { maxSteps: 12 },
}));
