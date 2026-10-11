import { MCPClient, type RequireToolApprovalContext } from "@mastra/mcp";

/**
 * Deny by default: a tool skips approval only when GitHub's MCP server annotates it with
 * `readOnlyHint: true` (the server sets it explicitly on every read tool). Write tools, and any
 * tool without that annotation, need human approval.
 */
export function githubToolNeedsApproval({
  annotations,
}: Pick<RequireToolApprovalContext, "annotations">): boolean {
  return annotations?.readOnlyHint !== true;
}

// GitHub's official remote MCP server: https://github.com/github/github-mcp-server
// Auth: a personal access token in GITHUB_PAT. Writes are enabled, but every non-read tool
// call suspends for human approval (see githubToolNeedsApproval). The toolset header limits
// the server to repos, issues, PRs and Actions so the model sees a small tool surface.
export const githubMcp = new MCPClient({
  id: "github",
  servers: {
    github: {
      url: new URL("https://api.githubcopilot.com/mcp/"),
      requestInit: {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_PAT}`,
          "X-MCP-Toolsets": "context,repos,issues,pull_requests,actions",
        },
      },
      // Refuse to follow redirects/requests to any other host with the token attached.
      allowedHosts: ["api.githubcopilot.com"],
      requireToolApproval: githubToolNeedsApproval,
    },
  },
});

type GithubTools = Awaited<ReturnType<typeof githubMcp.listTools>>;
let cached: GithubTools | undefined;

/**
 * Resolves the GitHub MCP tools lazily (the agent calls this per request). Degrades to no tools
 * (logging a warning) when GITHUB_PAT is missing or the connection fails, so the server still
 * boots without a token. Only a successful fetch is cached, so a later retry can recover.
 */
export async function getGithubTools(): Promise<GithubTools> {
  if (cached) return cached;
  if (!process.env.GITHUB_PAT) {
    console.warn("[github] GITHUB_PAT is not set; the GitHub agent has no tools");
    return {};
  }
  try {
    // listTools() reports a failed server as an empty result instead of throwing; don't cache that.
    const tools = await githubMcp.listTools();
    if (Object.keys(tools).length > 0) cached = tools;
    return tools;
  } catch (error) {
    console.warn("[github] could not load GitHub MCP tools:", error instanceof Error ? error.message : error);
    return {};
  }
}

const TOOL_KEY_PREFIX = "github_"; // listTools() namespaces tools as `<server>_<tool>`.

/**
 * Only the tools that never need approval, for callers that cannot show an approval prompt
 * (delegation from the assistant). Same predicate as the
 * approval gate, so a tool is either listed here or would have suspended for approval.
 */
export async function getGithubReadTools(): Promise<GithubTools> {
  const tools = await getGithubTools();
  return Object.fromEntries(
    Object.entries(tools).filter(([key, tool]) => {
      if (!key.startsWith(TOOL_KEY_PREFIX)) return false;
      const annotations = (tool as { mcp?: { annotations?: RequireToolApprovalContext["annotations"] } }).mcp?.annotations;
      return !githubToolNeedsApproval({ annotations });
    }),
  );
}
