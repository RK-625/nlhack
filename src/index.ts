import { mastra } from "./mastra";
import { randomUUID } from "node:crypto";
import { shutdown } from "neatlogs";
import { traceRequest } from "./telemetry";

const agentId = process.env.AGENT === "market-researcher"
  ? "marketResearcher"
  : process.env.AGENT === "cfo" ? "cfoAgent" : "assistant";
const agent = mastra.getAgent(agentId);
const prompt = process.argv.slice(2).join(" ") || "Say hello in one sentence.";

try {
  await traceRequest("cli", randomUUID(), async () => {
    const res = await agent.generate(prompt);
    console.log(res.text);
    return res.text;
  }, prompt);
} finally {
  await shutdown();
}
