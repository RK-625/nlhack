import { Mastra } from "@mastra/core/mastra";
import { assistant } from "./agents/assistant";

export const mastra = new Mastra({
  agents: { assistant },
});
