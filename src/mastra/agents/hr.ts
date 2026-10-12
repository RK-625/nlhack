import { Agent } from "@mastra/core/agent";
import { memory } from "../memory";
import { turnCapProcessorsFor } from "../../usage/turn-budget";
import { wrapMastra } from "neatlogs/mastra";
import { HR_INSTRUCTIONS } from "../prompts";
import { companyTools } from "../tools/company";

export const hrAgent = wrapMastra(new Agent({
  id: "hr",
  name: "HR Bot",
  description:
    "Helps with hiring plans, job descriptions, interview loops, onboarding, people policies, performance reviews, and compensation band framing. Also reads the company's HR records (employee directory, salary bands, open roles, candidates, policies) from the shared read-only company folder, handling personal data carefully.",
  instructions: HR_INSTRUCTIONS,
  model: "deepseek/deepseek-flash",
  memory,
  // Per-turn cost and token caps (src/usage), counted across delegated sub-agents too.
  ...turnCapProcessorsFor("hr"),
  // Shared read-only company knowledge folder (src/mastra/tools/company.ts).
  tools: companyTools,
  defaultOptions: { maxSteps: 12 },
}));
