import { Agent } from "@mastra/core/agent";
import { memory } from "../memory";
import { turnCapProcessors } from "../../usage/turn-budget";
import { wrapMastra } from "neatlogs/mastra";
import { LEGAL_INSTRUCTIONS } from "../prompts";

export const legalAgent = wrapMastra(new Agent({
  id: "legal",
  name: "Legal Bot",
  description:
    "Prepares contract, NDA, and MSA review checklists, explains clauses, gives GDPR, DPDP, and SOC 2 compliance overviews, and drafts policies from information you provide. Not legal advice; flags when a qualified lawyer is needed. No live legal data is connected yet.",
  instructions: LEGAL_INSTRUCTIONS,
  model: "deepseek/deepseek-flash",
  memory,
  // Per-turn cost and token caps (src/usage), counted across delegated sub-agents too.
  ...turnCapProcessors,
  defaultOptions: { maxSteps: 12 },
}));
