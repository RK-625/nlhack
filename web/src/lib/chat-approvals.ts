import { isToolUIPart, lastAssistantMessageIsCompleteWithApprovalResponses, type UIMessage } from "ai";

/** Mastra suspends a step at one approval, leaving sibling calls queued until resume. */
export function shouldResumeToolApprovals({ messages }: { messages: UIMessage[] }): boolean {
  if (lastAssistantMessageIsCompleteWithApprovalResponses({ messages })) return true;
  const message = messages.at(-1);
  if (message?.role !== "assistant") return false;
  const stepStart = message.parts.findLastIndex((part) => part.type === "step-start");
  const tools = message.parts.slice(stepStart + 1).filter(isToolUIPart);
  const responded = tools.some(
    (part) => part.state === "approval-responded" && part.approval.id.endsWith(`::${part.toolCallId}`),
  );
  if (!responded) return false;
  // Only the explicit approval decisions are sent; the server validates each against its thread.
  return tools.every(
    (part) => part.state !== "approval-requested" && part.state !== "input-streaming" &&
      !(part.state === "output-available" && part.preliminary === true),
  );
}

/** Recover an approval omitted from a completed live stream without replacing newer UI state. */
export function restorePendingApprovals(message: UIMessage, saved: UIMessage): UIMessage {
  if (message.id !== saved.id || message.role !== "assistant") return message;
  const pending = new Map(
    saved.parts.filter(isToolUIPart).filter((part) => part.state === "approval-requested")
      .map((part) => [part.toolCallId, part]),
  );
  let changed = false;
  const parts = message.parts.map((part) => {
    if (!isToolUIPart(part) || part.state !== "input-available") return part;
    const approval = pending.get(part.toolCallId);
    if (!approval) return part;
    changed = true;
    return approval;
  });
  const metadata = typeof message.metadata === "object" && message.metadata ? message.metadata : {};
  const savedMetadata = typeof saved.metadata === "object" && saved.metadata ? saved.metadata : {};
  return changed ? { ...message, parts, metadata: { ...metadata, ...savedMetadata } } : message;
}
