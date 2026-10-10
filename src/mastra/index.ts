import { Mastra } from "@mastra/core/mastra";
import "../telemetry";
import { assistant } from "./agents/assistant";
import { marketResearcher } from "./agents/market-researcher";
import { cfoAgent } from "./agents/cfo";

export const mastra = new Mastra({
  agents: { assistant, marketResearcher, cfoAgent },
});
