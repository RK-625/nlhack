import { mastra } from "./mastra";

const agentId = process.env.AGENT === "market-researcher"
  ? "marketResearcher"
  : process.env.AGENT === "cfo" ? "cfoAgent" : "assistant";
const agent = mastra.getAgent(agentId);
const prompt = process.argv.slice(2).join(" ") || "Say hello in one sentence.";

const res = await agent.generate(prompt);
console.log(res.text);
