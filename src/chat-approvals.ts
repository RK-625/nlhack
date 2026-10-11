import { isToolUIPart, type UIMessage } from "ai";

/** A stored message, as returned by Mastra Memory recall (MastraDBMessage), narrowed to what is read here. */
type StoredMessage = { role: string; content: unknown };

/**
 * Approval ids ("<runId>::<toolCallId>", the id the AI SDK stream carries) still awaiting a
 * decision in a stored thread. Mastra records each suspended approval under the assistant
 * message's `content.metadata.pendingToolApprovals` and removes it once the call is resumed.
 */
export function pendingApprovalIds(messages: readonly StoredMessage[]): Set<string> {
  const ids = new Set<string>();
  for (const message of messages) {
    if (message.role !== "assistant") continue;
    const metadata = (message.content as { metadata?: { pendingToolApprovals?: unknown } } | null)?.metadata;
    const pending = metadata?.pendingToolApprovals;
    if (!pending || typeof pending !== "object") continue;
    for (const entry of Object.values(pending)) {
      const { runId, toolCallId } = (entry ?? {}) as { runId?: unknown; toolCallId?: unknown };
      if (typeof runId === "string" && runId && typeof toolCallId === "string" && toolCallId) {
        ids.add(`${runId}::${toolCallId}`);
      }
    }
  }
  return ids;
}

/**
 * For dropping approvals the user moved on from: the stored assistant messages that still hold
 * pending approvals, reduced to { id, content } with those approvals removed, and the suspended
 * agent runs they belonged to. When the approval came from a delegated sub-agent, the entry also
 * names that sub-agent's own suspended run (`delegatedRunId`), which is included too. Storage
 * merges metadata keys on update, so the key is set to undefined (left out when serialized)
 * rather than deleted.
 */
export function withoutPendingApprovals<M extends StoredMessage & { id: string; content: { metadata?: Record<string, unknown> } }>(
  messages: readonly M[],
): { messages: Pick<M, "id" | "content">[]; runIds: Set<string> } {
  const cleared: Pick<M, "id" | "content">[] = [];
  const runIds = new Set<string>();
  for (const message of messages) {
    const metadata = message.content.metadata;
    if (message.role !== "assistant" || !metadata?.pendingToolApprovals) continue;
    for (const id of pendingApprovalIds([message])) runIds.add(id.slice(0, id.lastIndexOf("::")));
    if (typeof metadata.pendingToolApprovals === "object") {
      for (const entry of Object.values(metadata.pendingToolApprovals as object)) {
        const { delegatedRunId } = (entry ?? {}) as { delegatedRunId?: unknown };
        if (typeof delegatedRunId === "string" && delegatedRunId) runIds.add(delegatedRunId);
      }
    }
    cleared.push({ id: message.id, content: { ...message.content, metadata: { ...metadata, pendingToolApprovals: undefined } } });
  }
  return { messages: cleared, runIds };
}

/**
 * Rebuilds a client's approval response as the assistant message handleChatStream resumes from
 * (it reads only "approval-responded" tool parts). Keeps only decisions for approvals pending in
 * the caller's own thread, so a client cannot resume another user's run, and copies only the
 * fields Mastra reads (no client reason text). Undefined when nothing valid is left.
 */
export function approvalResumeMessage(message: UIMessage, pending: ReadonlySet<string>): UIMessage | undefined {
  const parts: UIMessage["parts"] = [];
  for (const part of message.parts ?? []) {
    if (!isToolUIPart(part) || part.state !== "approval-responded") continue;
    const { id, approved } = part.approval ?? {};
    if (typeof id !== "string" || typeof approved !== "boolean" || !pending.has(id)) continue;
    if (!id.endsWith(`::${part.toolCallId}`)) continue;
    parts.push({ ...part, approval: { id, approved }, state: "approval-responded" } as UIMessage["parts"][number]);
  }
  return parts.length > 0 ? { id: message.id, role: "assistant", parts } : undefined;
}
