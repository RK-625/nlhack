import assert from "node:assert/strict";
import test from "node:test";
import { Chat } from "@ai-sdk/react";
import { isToolUIPart, type ChatTransport, type UIMessage } from "ai";
import { restorePendingApprovals, shouldResumeToolApprovals } from "./chat-approvals";

function message(parts: UIMessage["parts"]): UIMessage {
  return { id: "reply", role: "assistant", parts };
}
const queued: UIMessage["parts"][number] = {
  type: "tool-cfo_edit_scenarios", toolCallId: "scenarios", state: "input-available", input: {},
};
const pending: UIMessage["parts"][number] = {
  type: "tool-cfo_edit_pages", toolCallId: "page", state: "approval-requested", input: {},
  approval: { id: "run::page" },
};
const response = (approved: boolean): UIMessage["parts"][number] => ({
  ...pending, state: "approval-responded", approval: { id: "run::page", approved },
});

test("approved or denied Mastra call resumes despite queued sibling", () => {
  for (const approved of [true, false]) {
    assert.equal(shouldResumeToolApprovals({ messages: [message([response(approved), queued])] }), true);
  }
});
test("does not resume unanswered approvals or incomplete input", () => {
  for (const parts of [[pending, queued], [queued], [response(true), pending],
    [response(true), { ...queued, state: "input-streaming" } as UIMessage["parts"][number]]]) {
    assert.equal(shouldResumeToolApprovals({ messages: [message(parts)] }), false);
  }
  assert.equal(shouldResumeToolApprovals({ messages: [] }), false);
});
test("does not replay approvals from earlier steps or user messages", () => {
  assert.equal(shouldResumeToolApprovals({ messages: [message([response(true), { type: "step-start" }, queued])] }), false);
  assert.equal(shouldResumeToolApprovals({ messages: [{ ...message([response(true)]), role: "user" }] }), false);
});
test("normal completed approval responses still resume", () => {
  assert.equal(shouldResumeToolApprovals({ messages: [message([response(true)])] }), true);
});
test("Chat sends the decision once and stops at the next approval", async () => {
  const requests: UIMessage[][] = [];
  let finished!: () => void;
  const done = new Promise<void>((resolve) => { finished = resolve; });
  const transport: ChatTransport<UIMessage> = {
    sendMessages: async ({ messages }) => {
      requests.push(messages);
      return new ReadableStream({
        start(controller) {
          controller.enqueue({ type: "start", messageId: "reply" });
          controller.enqueue({ type: "tool-approval-request", approvalId: "run::scenarios", toolCallId: "scenarios" });
          controller.enqueue({ type: "finish", finishReason: "tool-calls" });
          controller.close();
        },
      });
    },
    reconnectToStream: async () => null,
  };
  const chat = new Chat<UIMessage>({
    messages: [message([pending, queued])], transport,
    sendAutomaticallyWhen: shouldResumeToolApprovals,
    onFinish: finished,
  });
  await chat.addToolApprovalResponse({ id: "run::page", approved: true });
  await done;
  assert.equal(requests.length, 1);
  assert.ok(requests[0][0].parts.some((part) => isToolUIPart(part) && part.state === "approval-responded"));
  assert.ok(chat.lastMessage?.parts.some((part) => isToolUIPart(part) && part.state === "approval-requested" && part.toolCallId === "scenarios"));
  assert.equal(shouldResumeToolApprovals({ messages: chat.messages }), false);
});
test("recovers missing approval without replacing queued sibling or local decisions", () => {
  const live = message([{ ...queued, type: "tool-cfo_edit_pages", toolCallId: "page" }, queued]);
  const saved = message([pending, queued]);
  const restored = restorePendingApprovals(live, saved);
  assert.ok(isToolUIPart(restored.parts[0]));
  assert.equal(restored.parts[0].state, "approval-requested");
  assert.equal(restored.parts[1], queued);
  assert.ok(isToolUIPart(live.parts[0]));
  assert.equal(live.parts[0].state, "input-available");
  const answered = message([response(true), queued]);
  assert.equal(restorePendingApprovals(answered, saved), answered);
  assert.equal(restorePendingApprovals(live, { ...saved, id: "other" }), live);
});
