import { Agent } from "@mastra/core/agent";
import { memory } from "../memory";
import { turnCapProcessorsFor } from "../../usage/turn-budget";
import { wrapMastra } from "neatlogs/mastra";
import { SALES_INSTRUCTIONS } from "../prompts";
import { companyTools } from "../tools/company";

export const salesAgent = wrapMastra(new Agent({
  id: "sales",
  name: "Sales Bot",
  description:
    "Helps with ICPs, prospecting sequences, outreach emails, discovery questions, objection handling, pipeline and forecast reviews, and deal strategy. Also reads the company's sales records (CRM deals, Q4 forecast, sales playbook) from the shared read-only company folder.",
  instructions: SALES_INSTRUCTIONS,
  model: "deepseek/deepseek-flash",
  memory,
  // Per-turn cost and token caps (src/usage), counted across delegated sub-agents too.
  ...turnCapProcessorsFor("sales"),
  // Shared read-only company knowledge folder (src/mastra/tools/company.ts).
  tools: companyTools,
  defaultOptions: { maxSteps: 12 },
}));
