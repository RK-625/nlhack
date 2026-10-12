import { getNeatlogsProject } from "../mastra/tools/neatlogs";

const DASHBOARD = "https://app.neatlogs.com/traces/{traceId}";

let detected: string | null = null;

/**
 * URL template for opening a trace in the Neatlogs dashboard, with a `{traceId}` placeholder.
 * NEATLOGS_TRACE_URL wins; otherwise it is built once from the key's org and project (whoami) and
 * cached. Null when neither is available (a failed lookup is retried on the next call). Never throws.
 */
export async function getTraceUrlTemplate(): Promise<string | null> {
  const override = process.env.NEATLOGS_TRACE_URL?.trim();
  if (override?.includes("{traceId}")) return override;
  if (detected) return detected;
  try {
    const project = await getNeatlogsProject();
    if (!project) return null;
    detected = `${DASHBOARD}?orgId=${encodeURIComponent(project.orgId)}&projectId=${encodeURIComponent(project.projectId)}`;
    return detected;
  } catch {
    return null;
  }
}
