import { Agent } from "@mastra/core/agent";
import { memory } from "../memory";
import { turnCapProcessors } from "../../usage/turn-budget";
import { wrapMastra } from "neatlogs/mastra";
import { CUSTOMER_SUCCESS_INSTRUCTIONS } from "../prompts";
import { companyTools } from "../tools/company";

export const customerSuccessAgent = wrapMastra(new Agent({
  id: "customer-success",
  name: "Customer Success Bot",
  description:
    "Helps with customer onboarding, adoption, churn risk, renewals, health scores, support escalations, and customer communication drafts. Also reads the company's customer records (account health, support tickets, churn log) from the shared read-only company folder.",
  instructions: CUSTOMER_SUCCESS_INSTRUCTIONS,
  model: "deepseek/deepseek-flash",
  memory,
  // Per-turn cost and token caps (src/usage), counted across delegated sub-agents too.
  ...turnCapProcessors,
  // Shared read-only company knowledge folder (src/mastra/tools/company.ts).
  tools: companyTools,
  defaultOptions: { maxSteps: 12 },
}));
