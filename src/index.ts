import { mastra } from "./mastra";

const agent = mastra.getAgent(process.env.AGENT === "market-researcher" ? "marketResearcher" : "assistant");
const prompt = process.argv.slice(2).join(" ") || "Say hello in one sentence.";

const res = await agent.generate(prompt);
console.log(res.text);
