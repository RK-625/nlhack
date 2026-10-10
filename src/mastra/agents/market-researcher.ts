import { Agent } from "@mastra/core/agent";
import { wrapMastra } from "neatlogs/mastra";
import { MARKET_RESEARCHER_INSTRUCTIONS } from "../prompts";
import { crustdataTools } from "../tools/crustdata";

export const marketResearcher = wrapMastra(new Agent({
  id: "market-researcher",
  name: "Market Researcher",
  description:
    "Researches companies, competitors, pricing, funding, headcount, and market trends using Crustdata and live web search. Returns focused findings with sources and data gaps. Delegate factual market research here.",
  instructions: MARKET_RESEARCHER_INSTRUCTIONS,
  model: "deepseek/deepseek-flash",
  tools: crustdataTools,
  defaultOptions: { maxSteps: 12 },
}));
