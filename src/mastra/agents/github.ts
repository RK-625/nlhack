import { Agent } from "@mastra/core/agent";
import { memory } from "../memory";
import { wrapMastra } from "neatlogs/mastra";
import { GITHUB_INSTRUCTIONS } from "../prompts";
import { getGithubTools } from "../tools/github";

export const githubAgent = wrapMastra(new Agent({
  id: "github",
  name: "GitHub Agent",
  description:
    "Read-only inspection of GitHub repositories, issues, pull requests, and Actions runs. Returns concise findings with issue/PR numbers and links. Cannot create, edit, comment, merge, or trigger anything. Delegate GitHub lookups here.",
  instructions: GITHUB_INSTRUCTIONS,
  model: "deepseek/deepseek-flash",
  memory,
  // Resolved per request so a missing token or GitHub outage never blocks server startup.
  tools: () => getGithubTools(),
  defaultOptions: { maxSteps: 12 },
}));
