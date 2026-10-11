import { Agent } from "@mastra/core/agent";
import { memory } from "../memory";
import { wrapMastra } from "neatlogs/mastra";
import { CUSTOMER_SUCCESS_INSTRUCTIONS } from "../prompts";

export const customerSuccessAgent = wrapMastra(new Agent({
  id: "customer-success",
  name: "Customer Success Bot",
  description:
    "Helps with customer onboarding, adoption, churn risk, renewals, health scores, support escalations, and customer communication drafts, working from information you provide. No CRM or live data is connected yet.",
  instructions: CUSTOMER_SUCCESS_INSTRUCTIONS,
  model: "deepseek/deepseek-flash",
  memory,
  defaultOptions: { maxSteps: 12 },
}));
