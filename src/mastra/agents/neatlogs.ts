import { Agent } from "@mastra/core/agent";
import { memory } from "../memory";
import { wrapMastra } from "neatlogs/mastra";
import { NEATLOGS_INSTRUCTIONS, NEATLOGS_READER_INSTRUCTIONS } from "../prompts";
import { getNeatlogsReadTools, getNeatlogsTools } from "../tools/neatlogs";

/**
 * Chatted with directly in the web app. Reads every agent's Neatlogs traces and can change
 * triage items and detections; each such call suspends for the user's approval
 * (see neatlogsToolNeedsApproval).
 */
export const neatlogsAgent = wrapMastra(new Agent({
  id: "neatlogs",
  name: "Neatlogs Agent",
  description:
    "Analyzes the Neatlogs traces of this project's agent runs: errors, latency, token usage, evaluations, detections, and triage items. Can update triage items and create detections; every change is shown with its exact arguments and runs only after you approve it.",
  instructions: NEATLOGS_INSTRUCTIONS,
  model: "deepseek/deepseek-flash",
  memory,
  // Resolved per request so a missing key or Neatlogs outage never blocks server startup.
  tools: () => getNeatlogsTools(),
  defaultOptions: { maxSteps: 12 },
}));

/**
 * Read-only twin used only for the assistant's delegation (and so the WhatsApp bot), which has
 * no approval UI. Not registered on Mastra: it is not a chat target.
 */
export const neatlogsReaderAgent = wrapMastra(new Agent({
  id: "neatlogs-reader",
  name: "Neatlogs Agent",
  description:
    "Read-only analysis of the Neatlogs traces of this project's agent runs: errors, latency, token usage, evaluations, detections, and triage items. Returns trace ids and concise findings. Cannot change triage items or detections. Delegate observability questions here.",
  instructions: NEATLOGS_READER_INSTRUCTIONS,
  model: "deepseek/deepseek-flash",
  memory,
  tools: () => getNeatlogsReadTools(),
  defaultOptions: { maxSteps: 12 },
}));
