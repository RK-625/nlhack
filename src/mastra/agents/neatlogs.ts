import { Agent } from "@mastra/core/agent";
import { memory } from "../memory";
import { wrapMastra } from "neatlogs/mastra";
import { NEATLOGS_INSTRUCTIONS } from "../prompts";
import { getNeatlogsTools } from "../tools/neatlogs";

/**
 * Chatted with directly in the web app, and delegated to by the Assistant. Reads every agent's
 * Neatlogs traces and can change triage items and detections; each such call suspends for the
 * user's approval in whichever chat started it (see neatlogsToolNeedsApproval).
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
