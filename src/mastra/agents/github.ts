import { Agent } from "@mastra/core/agent";
import { memory } from "../memory";
import { wrapMastra } from "neatlogs/mastra";
import { GITHUB_INSTRUCTIONS, GITHUB_READER_INSTRUCTIONS } from "../prompts";
import { getGithubReadTools, getGithubTools } from "../tools/github";

/**
 * Chatted with directly in the web app. Has every GitHub tool; each mutating call suspends
 * for the user's approval, which the web chat shows inline (see githubToolNeedsApproval).
 */
export const githubAgent = wrapMastra(new Agent({
  id: "github",
  name: "GitHub Agent",
  description:
    "Inspects GitHub repositories, issues, pull requests, and Actions runs, and makes changes (issues, comments, branches, files, pull requests, reviews, merges) when asked. Every change is shown with its exact arguments and runs only after you approve it.",
  instructions: GITHUB_INSTRUCTIONS,
  model: "deepseek/deepseek-flash",
  memory,
  // Resolved per request so a missing token or GitHub outage never blocks server startup.
  tools: () => getGithubTools(),
  defaultOptions: { maxSteps: 12 },
}));

/**
 * Read-only twin used only for the assistant's delegation (and so the WhatsApp bot). Those
 * paths have no approval UI, so it never receives a tool that could suspend for approval.
 * Not registered on Mastra: it is not a chat target and does not appear in the agent list.
 */
export const githubReaderAgent = wrapMastra(new Agent({
  id: "github-reader",
  name: "GitHub Agent",
  description:
    "Read-only inspection of GitHub repositories, issues, pull requests, and Actions runs. Returns concise findings with issue/PR numbers and links. Cannot create, edit, comment, merge, or trigger anything. Delegate GitHub lookups here.",
  instructions: GITHUB_READER_INSTRUCTIONS,
  model: "deepseek/deepseek-flash",
  memory,
  tools: () => getGithubReadTools(),
  defaultOptions: { maxSteps: 12 },
}));
