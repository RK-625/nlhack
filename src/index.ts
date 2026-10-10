import { mastra } from "./mastra";

const agent = mastra.getAgent("assistant");
const prompt = process.argv.slice(2).join(" ") || "Say hello in one sentence.";

const res = await agent.generate(prompt);
console.log(res.text);
