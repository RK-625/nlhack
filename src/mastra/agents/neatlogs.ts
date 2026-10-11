import { Agent } from "@mastra/core/agent";
import { memory } from "../memory";
import { turnCapProcessors } from "../../usage/turn-budget";
import { wrapMastra } from "neatlogs/mastra";
import { NEATLOGS_INSTRUCTIONS } from "../prompts";
import { getNeatlogsTools } from "../tools/neatlogs";

/**
 * Chatted with directly in the web app, and delegated to by the Primary Bot. For admins (and the
 * CLI) it reads every agent's Neatlogs traces and can change triage items and detections; each such
 * call suspends for the user's approval in whichever chat started it (see
 * neatlogsToolNeedsApproval). Other users get read tools limited to their own traces
 * (see getNeatlogsTools).
 */
export const neatlogsAgent = wrapMastra(new Agent({
  id: "neatlogs",
  name: "Neat Bot",
  description:
    "Analyzes the Neatlogs traces of this project's agent runs: errors, latency, token usage, evaluations, detections, and triage items. Admins see the whole project and can update triage items and create detections (every change runs only after approval); other users see only the traces of their own conversations.",
  instructions: NEATLOGS_INSTRUCTIONS,
  model: "deepseek/deepseek-flash",
  memory,
  // Per-turn cost and token caps (src/usage), counted across delegated sub-agents too.
  ...turnCapProcessors,
  // Resolved per request from the server-set RequestContext (user and role), so each user gets
  // their own scope, and a missing key or Neatlogs outage never blocks server startup.
  tools: ({ requestContext }) => getNeatlogsTools({ requestContext }),
  defaultOptions: { maxSteps: 12 },
}));
