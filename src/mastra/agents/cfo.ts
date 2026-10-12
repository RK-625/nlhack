import { Agent } from "@mastra/core/agent";
import { memory } from "../memory";
import { turnCapProcessorsFor } from "../../usage/turn-budget";
import { wrapMastra } from "neatlogs/mastra";
import { CFO_INSTRUCTIONS } from "../prompts";
import { getCfoTools } from "../tools/cfo";
import { companyTools } from "../tools/company";

/**
 * Chatted with directly in the web app, and delegated to by the Primary Bot. Uses the signed-in
 * user's own cfo.ai connection (resolved per request from the RequestContext): read tools run
 * freely, every change suspends for the user's approval (see cfoToolNeedsApproval).
 */
export const cfoAgent = wrapMastra(new Agent({
  id: "cfo",
  name: "CFO Bot",
  description:
    "Analyzes business financials, cash flow, runway, budgets, pricing, unit economics, and hiring scenarios, using the company's finance exports from the shared read-only company folder and, when connected, live data from the user's own cfo.ai workspace (pages, tables, scenarios, integrations). Reads run freely; any change in cfo.ai is shown with its exact arguments and runs only after the user approves it. Never invents figures.",
  instructions: CFO_INSTRUCTIONS,
  model: "deepseek/deepseek-flash",
  memory,
  // Per-turn cost and token caps (src/usage), counted across delegated sub-agents too.
  ...turnCapProcessorsFor("cfo"),
  // Resolved per request: each user gets their own cfo.ai connection, or only the status tool.
  tools: async ({ requestContext }) => ({ ...(await getCfoTools({ requestContext })), ...companyTools }),
  defaultOptions: { maxSteps: 12 },
}));
