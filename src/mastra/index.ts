import { resolve } from "node:path";
import { Mastra } from "@mastra/core/mastra";
import { LibSQLStore } from "@mastra/libsql";
import { dataDir } from "../data-dir";
import "../telemetry";
import { assistant } from "./agents/assistant";
import { marketResearcher } from "./agents/market-researcher";
import { cfoAgent } from "./agents/cfo";
import { githubAgent } from "./agents/github";

export const mastra = new Mastra({
  storage: new LibSQLStore({ id: "mastra", url: `file:${resolve(dataDir(), "mastra.db")}` }),
  agents: { assistant, marketResearcher, cfoAgent, githubAgent },
});
