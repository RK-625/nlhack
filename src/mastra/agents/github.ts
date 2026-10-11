import { Agent } from "@mastra/core/agent";
import { memory } from "../memory";
import { wrapMastra } from "neatlogs/mastra";
import { GITHUB_INSTRUCTIONS } from "../prompts";
import { getGithubTools } from "../tools/github";

/**
 * Chatted with directly in the web app, and delegated to by the Assistant. Has every GitHub
 * tool; each mutating call suspends for the user's approval, which the web chat shows inline in
 * whichever chat started it (see githubToolNeedsApproval).
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
