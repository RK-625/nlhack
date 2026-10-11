import { Skeleton } from "@/components/ui/skeleton";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { useMemo } from "react";
import { BotAvatar } from "@/components/avatar/bot-avatar";
import { useAgentChat } from "@/hooks/useAgentChat";
import type { AgentSummary } from "@/hooks/useAgents";
import { agentAvatarValue } from "@/lib/agent-avatar";
import type { AgentNames } from "@/lib/message-parts";
import { paneSwap, rise, staggerGroup } from "@/lib/motion";
import { CfoConnectBanner } from "./CfoConnect";
import { ChatHeader } from "./ChatHeader";
import { Composer } from "./Composer";
import { MessageList } from "./MessageList";

const SUGGESTIONS: Record<string, string[]> = {
  assistant: ["What can your team do?", "Say hi in 5 words", "Ask the CFO about runway at $50k burn"],
  "market-researcher": ["Look up Stripe's headcount", "Top competitors to Mastra", "Funding history of Vercel"],
  cfo: ["What's our runway with $600k and $50k burn?", "Model hiring 2 engineers", "Price a $20/seat plan"],
};
const DEFAULT_SUGGESTIONS = ["What can you help with?", "Give me an example task"];

export function ChatPane({
  agent,
  agents,
  onOpenMobileSidebar,
}: {
  agent: AgentSummary | null;
  agents: AgentSummary[];
  onOpenMobileSidebar: () => void;
}) {
  const agentNames = useMemo<AgentNames>(
    () => Object.fromEntries(agents.flatMap((a) => [[a.key, a.name], [a.id, a.name]])),
    [agents],
  );
  if (!agent) {
    return (
      <div className="relative flex min-h-0 flex-1 flex-col">
        <ChatHeader agent={null} running={false} onOpenMobileSidebar={onOpenMobileSidebar} />
        <div className="grid flex-1 place-items-center text-[14px] text-muted-foreground">Pick an agent to start.</div>
      </div>
    );
  }
  return (
    // Switching agents: the old conversation leaves, then the new one arrives (mirrored).
    <AnimatePresence mode="wait" initial={false}>
      <m.div
        key={agent.key}
        variants={paneSwap}
        initial="hidden"
        animate="visible"
        exit="hidden"
        // relative: the header pill floats over the top of the transcript.
        className="relative flex min-h-0 min-w-0 flex-1 flex-col"
      >
        <AgentConversation agent={agent} agentNames={agentNames} onOpenMobileSidebar={onOpenMobileSidebar} />
      </m.div>
    </AnimatePresence>
  );
}

function AgentConversation({
  agent,
  agentNames,
  onOpenMobileSidebar,
}: {
  agent: AgentSummary;
  agentNames: AgentNames;
  onOpenMobileSidebar: () => void;
}) {
  const chat = useAgentChat(agent.key);
  return (
    <>
      <ChatHeader agent={agent} running={chat.running} onOpenMobileSidebar={onOpenMobileSidebar} />
      <MessageList
        messages={chat.messages}
        status={chat.status}
        error={chat.error}
        agentNames={agentNames}
        onRetry={chat.retry}
        onDismissError={chat.dismissError}
        onApproval={chat.respondToApproval}
        empty={chat.loading ? <HistorySkeleton /> : <EmptyState agent={agent} onPick={chat.send} />}
      />
      {agent.id === "cfo" ? <CfoConnectBanner /> : null}
      <Composer agentName={agent.name} running={chat.running} disabled={chat.loading} onSend={chat.send} onStop={chat.stop} />
    </>
  );
}

/**
 * Shown while an agent has no messages. Its pieces and suggestion chips stagger in, and
 * leave in reverse order (MessageList drives hidden/visible under AnimatePresence).
 */
function EmptyState({ agent, onPick }: { agent: AgentSummary; onPick: (text: string) => void }) {
  return (
    <m.div
      variants={staggerGroup()}
      className="m-auto flex max-w-md flex-col items-center gap-3 px-6 pb-10 pt-16 text-center"
    >
      <m.div variants={rise}>
        <BotAvatar color={agentAvatarValue(agent.id)} identity={agent.id} size={64} />
      </m.div>
      <m.h2 variants={rise} className="mt-1 text-[20px] font-semibold text-foreground">
        {agent.name}
      </m.h2>
      <m.p variants={rise} className="text-[14px] leading-[1.5] text-muted-foreground">
        {agent.description}
      </m.p>
      <m.div variants={staggerGroup()} className="mt-2 flex flex-wrap justify-center gap-2">
        {(SUGGESTIONS[agent.id] ?? DEFAULT_SUGGESTIONS).map((suggestion) => (
          <m.button
            key={suggestion}
            type="button"
            variants={rise}
            onClick={() => onPick(suggestion)}
            className="rounded-full border border-border bg-card px-3.5 py-1.5 text-[13px] text-foreground/80 transition-colors duration-(--motion-fast) ease-(--ease-standard) hover:bg-accent hover:text-foreground"
          >
            {suggestion}
          </m.button>
        ))}
      </m.div>
    </m.div>
  );
}


/** Light placeholder while the saved conversation loads. */
function HistorySkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-3 px-6 py-8" aria-busy="true">
      <Skeleton className="h-4 w-2/5 self-end" />
      <Skeleton className="h-4 w-3/5" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}
