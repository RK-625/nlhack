import { Agent } from "@mastra/core/agent";
import { MARKET_RESEARCHER_INSTRUCTIONS } from "../prompts";
import { crustdataTools } from "../tools/crustdata";

export const marketResearcher = new Agent({
  id: "market-researcher",
  name: "Market Researcher",
  instructions: MARKET_RESEARCHER_INSTRUCTIONS,
  model: "deepseek/deepseek-flash",
  tools: crustdataTools,
});
