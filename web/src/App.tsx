import { ChevronDown, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { BotAvatar } from "@/components/avatar/bot-avatar";
import { ToolActivityDisclosure, ToolSteps } from "@/components/chat/ToolActivityDisclosure";
import { ChatMarkdown } from "@/components/markdown/markdown.web";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PLACEHOLDER_AGENTS } from "@/hooks/useAgents";
import { type ResolvedAppearance, setUiAppearance } from "@/lib/appearance";

const SAMPLE_MARKDOWN = `### Runway check

Your **monthly burn** is about \`$42k\`. At the current balance that gives roughly *14 months*.

| Scenario | Burn | Runway |
| --- | ---: | ---: |
| Today | $42k | 14 mo |
| +2 hires | $58k | 10 mo |

- Next step: confirm Q4 revenue
- [Mastra docs](https://mastra.ai)
`;

/** S1 verification page: proves the lifted components, tokens and themes render. */
export function App() {
  const [theme, setTheme] = useState<ResolvedAppearance>(
    () => (document.documentElement.dataset.theme as ResolvedAppearance) ?? "dark",
  );
  const [picked, setPicked] = useState(PLACEHOLDER_AGENTS[0]);

  const toggleTheme = () => setTheme(setUiAppearance(theme === "dark" ? "light" : "dark"));

  return (
    <div className="rk-scroll mx-auto flex h-full max-w-2xl flex-col gap-8 overflow-y-auto px-4 py-8">
      <header className="flex items-center justify-between">
        <h1 className="text-[20px] font-semibold">nlhack web · S1 component check</h1>
        <Button variant="outline" size="sm" onClick={toggleTheme}>
          {theme === "dark" ? <Sun /> : <Moon />}
          {theme === "dark" ? "Light" : "Dark"}
        </Button>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-[13px] text-muted-foreground">Agents (BotAvatar)</h2>
        <div className="flex flex-col gap-1 rounded-xl border border-sidebar-border bg-sidebar p-2.5">
          {PLACEHOLDER_AGENTS.map((agent, index) => (
            <div key={agent.id} className="flex items-center gap-3 rounded-xl px-2.5 py-[10px] hover:bg-sidebar-accent">
              <BotAvatar color="" identity={agent.id} size={38} status={index === 0 ? "running" : undefined} />
              <div className="min-w-0">
                <div className="text-[14px] font-medium">{agent.name}</div>
                <div className="text-[12.5px] text-muted-foreground/60">{agent.id}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-wrap items-center gap-3">
        <h2 className="w-full text-[13px] text-muted-foreground">Button + DropdownMenu</h2>
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" />}>
            {picked.name}
            <ChevronDown />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {PLACEHOLDER_AGENTS.map((agent) => (
              <DropdownMenuItem key={agent.id} onClick={() => setPicked(agent)}>
                {agent.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-[13px] text-muted-foreground">Chat bubbles + ChatMarkdown + tool activity</h2>
        <div className="flex justify-end">
          <div className="rounded-[20px] bg-chat-user px-[18px] py-3 text-[15.5px] text-chat-user-foreground">
            How long is our runway if we hire two engineers?
          </div>
        </div>
        <div className="ps-1">
          <ToolActivityDisclosure live={false} stepCount={3} durationMs={4200}>
            <ToolSteps
              steps={[
                { label: "Delegated to CFO Agent", count: 1 },
                { label: "Calculated burn", count: 2 },
              ]}
            />
          </ToolActivityDisclosure>
        </div>
        <div className="flex justify-start">
          <div className="max-w-full rounded-[20px] bg-muted px-[18px] py-3 text-[15.5px] leading-[1.5] text-foreground/90">
            <ChatMarkdown>{SAMPLE_MARKDOWN}</ChatMarkdown>
          </div>
        </div>
      </section>
    </div>
  );
}
