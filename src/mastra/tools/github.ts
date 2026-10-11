import { MCPClient } from "@mastra/mcp";

// GitHub's official remote MCP server: https://github.com/github/github-mcp-server
// Auth: a personal access token in GITHUB_PAT. The agent is read-only by construction:
// "X-MCP-Readonly" makes the server expose only non-mutating tools, and the toolset header
// limits it to repos, issues, PRs and Actions so the model sees a small tool surface.
export const githubMcp = new MCPClient({
  id: "github",
  servers: {
    github: {
      url: new URL("https://api.githubcopilot.com/mcp/"),
      requestInit: {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_PAT}`,
          "X-MCP-Toolsets": "context,repos,issues,pull_requests,actions",
          "X-MCP-Readonly": "true",
        },
      },
      // Refuse to follow redirects/requests to any other host with the token attached.
      allowedHosts: ["api.githubcopilot.com"],
    },
  },
});

let cached: Awaited<ReturnType<typeof githubMcp.listTools>> | undefined;

/**
 * Resolves the GitHub MCP tools lazily (the agent calls this per request). Degrades to no tools
 * (logging a warning) when GITHUB_PAT is missing or the connection fails, so the server still
 * boots without a token. Only a successful fetch is cached, so a later retry can recover.
 */
export async function getGithubTools() {
  if (cached) return cached;
  if (!process.env.GITHUB_PAT) {
    console.warn("[github] GITHUB_PAT is not set; the GitHub agent has no tools");
    return {};
  }
  try {
    cached = await githubMcp.listTools();
    return cached;
  } catch (error) {
    console.warn("[github] could not load GitHub MCP tools:", error instanceof Error ? error.message : error);
    return {};
  }
}
