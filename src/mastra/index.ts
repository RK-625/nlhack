import { Mastra } from "@mastra/core/mastra";
import { assistant } from "./agents/assistant";
import { marketResearcher } from "./agents/market-researcher";

export const mastra = new Mastra({
  agents: { assistant, marketResearcher },
});
