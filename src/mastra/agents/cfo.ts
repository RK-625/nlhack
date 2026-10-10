import { Agent } from "@mastra/core/agent";
import { wrapMastra } from "neatlogs/mastra";
import { CFO_INSTRUCTIONS } from "../prompts";

export const cfoAgent = wrapMastra(new Agent({
  id: "cfo",
  name: "CFO Agent",
  description:
    "Analyzes user-provided business financials, cash flow, runway, budgets, pricing, unit economics, and hiring scenarios. Returns traceable calculations, assumptions, risks, and missing inputs. No live accounting or cfo.ai connection is available yet.",
  instructions: CFO_INSTRUCTIONS,
  model: "deepseek/deepseek-flash",
  defaultOptions: { maxSteps: 12 },
}));
