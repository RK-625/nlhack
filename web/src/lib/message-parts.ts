import { getToolName, isDataUIPart, isReasoningUIPart, isTextUIPart, isToolUIPart, type UIMessage } from "ai";
import type { ToolStep } from "@/components/chat/ToolActivityDisclosure";

/** What a message renders, in stream order. Consecutive tool/data parts merge into one card. */
export type Segment =
  | { kind: "text"; text: string; key: string }
  | { kind: "reasoning"; text: string; key: string }
  | { kind: "tools"; steps: ToolStep[]; callIds: string[]; key: string }
  /**
   * A tool call paused until the user approves or denies it. For a call a delegated sub-agent
   * made, toolName/label/input describe that nested call and `agent` names the sub-agent.
   */
  | { kind: "approval"; approvalId: string; toolName: string; label: string; input: unknown; agent?: string; key: string };

/** Agent display names by registry key and id, for "agent-<key>" delegation tools. */
export type AgentNames = Record<string, string>;

/** Client-observed tool timing (the stream carries none): first seen → first finished. */
const toolTimes = new Map<string, { start: number; end?: number }>();

export function messageSegments(message: UIMessage, agentNames: AgentNames): Segment[] {
  const segments: Segment[] = [];
  const approvalData = toolCallApprovalData(message);
  message.parts.forEach((part, index) => {
    const key = `${message.id}:${index}`;
    if (isTextUIPart(part)) {
      if (part.text.trim()) segments.push({ kind: "text", text: part.text, key });
      return;
    }
    if (isReasoningUIPart(part)) {
      if (part.text.trim()) segments.push({ kind: "reasoning", text: part.text, key });
      return;
    }
    if (isToolUIPart(part) && part.state === "approval-requested") {
      const toolName = getToolName(part);
      // A delegated sub-agent's call surfaces on the "agent-<key>" delegation call; Mastra sends
      // the real nested tool and arguments for the same call id (see toolCallApprovalData).
      const nested = toolName.startsWith("agent-") ? approvalData.get(part.toolCallId) : undefined;
      segments.push(
        nested
          ? {
              kind: "approval",
              approvalId: part.approval.id,
              toolName: nested.toolName,
              label: toolLabel(nested.toolName, agentNames),
              input: nested.args,
              agent: agentName(toolName, agentNames),
              key,
            }
          : {
              kind: "approval",
              approvalId: part.approval.id,
              toolName,
              label: toolLabel(toolName, agentNames),
              input: part.input,
              key,
            },
      );
      return;
    }
    let step: { step: ToolStep; callId: string } | null = null;
    if (isToolUIPart(part)) {
      const status =
        part.state === "output-denied"
          ? "denied"
          : part.state === "output-error"
            ? "error"
            : part.state === "output-available"
              ? "done"
              : "running";
      step = { step: { label: toolLabel(getToolName(part), agentNames), count: 1, status }, callId: part.toolCallId };
      track(part.toolCallId, status !== "running");
    } else if (isDataUIPart(part) && part.type.startsWith("data-tool-agent")) {
      // Mastra sub-agent progress parts; shape varies, so only a safe label is shown.
      const data = (part.data ?? {}) as Record<string, unknown>;
      const name = typeof data.name === "string" ? data.name : typeof data.agentName === "string" ? data.agentName : null;
      step = { step: { label: name ? `${name} working` : "Sub-agent step", count: 1, status: "done" }, callId: key };
    }
    if (!step) return; // step-start, sources, files and unknown parts render nothing.
    const last = segments.at(-1);
    if (last?.kind === "tools") {
      last.steps.push(step.step);
      last.callIds.push(step.callId);
    } else {
      segments.push({ kind: "tools", steps: [step.step], callIds: [step.callId], key });
    }
  });
  return segments;
}

function track(callId: string, finished: boolean) {
  const now = Date.now();
  const time = toolTimes.get(callId) ?? { start: now };
  if (finished && time.end === undefined) time.end = now;
  toolTimes.set(callId, time);
}

/** Wall time across a card's tool calls, when all of them were watched finishing. */
export function toolsDurationMs(callIds: string[]): number | undefined {
  const times = callIds.map((id) => toolTimes.get(id));
  if (times.some((t) => !t || t.end === undefined)) return undefined;
  const start = Math.min(...times.map((t) => t!.start));
  const end = Math.max(...times.map((t) => t!.end!));
  return end - start;
}

type ApprovalData = { toolName?: unknown; args?: unknown; toolCallId?: unknown };

/**
 * The tool name and arguments Mastra reports for each call awaiting approval, by tool call id. On
 * a live stream they arrive as "data-tool-call-approval" parts (never rendered themselves); in
 * loaded history they are the stored `metadata.pendingToolApprovals` entries, keyed by call id.
 */
function toolCallApprovalData(message: UIMessage): Map<string, { toolName: string; args: unknown }> {
  const byCallId = new Map<string, { toolName: string; args: unknown }>();
  const add = (callId: unknown, data: ApprovalData) => {
    if (typeof callId !== "string" || typeof data.toolName !== "string" || !data.toolName) return;
    byCallId.set(callId, { toolName: data.toolName, args: data.args });
  };
  const pending = (message.metadata as { pendingToolApprovals?: unknown } | undefined)?.pendingToolApprovals;
  if (pending && typeof pending === "object") {
    for (const [callId, entry] of Object.entries(pending)) {
      const data = (entry ?? {}) as ApprovalData;
      add(typeof data.toolCallId === "string" ? data.toolCallId : callId, data);
    }
  }
  for (const part of message.parts) {
    if (!isDataUIPart(part) || part.type !== "data-tool-call-approval") continue;
    const data = (part.data ?? {}) as ApprovalData;
    add(typeof data.toolCallId === "string" ? data.toolCallId : part.id, data);
  }
  return byCallId;
}

/** "agent-cfoAgent" → "Delegated to CFO Agent"; "crustdataCompanyEnrich" → "Crustdata company enrich". */
export function toolLabel(toolName: string, agentNames: AgentNames): string {
  if (toolName.startsWith("agent-")) return `Delegated to ${agentName(toolName, agentNames)}`;
  return humanize(toolName);
}

/** "agent-githubAgent" → "GitHub Agent". */
function agentName(toolName: string, agentNames: AgentNames): string {
  const key = toolName.slice("agent-".length);
  return agentNames[key] ?? humanize(key);
}

function humanize(name: string): string {
  const words = name
    .replace(/[-_]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .trim()
    .toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** Plain text of a message, for previews and copy. */
export function messageText(message: UIMessage): string {
  return message.parts
    .filter(isTextUIPart)
    .map((part) => part.text)
    .join("\n")
    .trim();
}
