import { Agent } from "@mastra/core/agent";
import { memory } from "../memory";
import { wrapMastra } from "neatlogs/mastra";
import { CFO_INSTRUCTIONS } from "../prompts";
import { getCfoTools } from "../tools/cfo";

/**
 * Chatted with directly in the web app, and delegated to by the Assistant. Uses the signed-in
 * user's own cfo.ai connection (resolved per request from the RequestContext): read tools run
 * freely, every change suspends for the user's approval (see cfoToolNeedsApproval).
 */
export const cfoAgent = wrapMastra(new Agent({
  id: "cfo",
  name: "CFO Agent",
  description:
    "Analyzes business financials, cash flow, runway, budgets, pricing, unit economics, and hiring scenarios, using live data from the user's own cfo.ai workspace when they have connected it (pages, tables, scenarios, integrations). Reads run freely; any change in cfo.ai is shown with its exact arguments and runs only after the user approves it. Never invents figures.",
  instructions: CFO_INSTRUCTIONS,
  model: "deepseek/deepseek-flash",
  memory,
  // Resolved per request: each user gets their own cfo.ai connection, or only the status tool.
  tools: ({ requestContext }) => getCfoTools({ requestContext }),
  defaultOptions: { maxSteps: 12 },
}));
