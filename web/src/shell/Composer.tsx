// Composer bar ported from rakazo (apps/web/src/pages/Shell.tsx ~5795-6175),
// Apache-2.0, github.com/elie222/rakazo@912c977. Attachments, mentions, slash commands,
// voice and drafts are stripped.
import { ArrowUp, Square } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export function Composer({
  agentName,
  running,
  onSend,
  onStop,
}: {
  agentName?: string;
  running: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
}) {
  const [draft, setDraft] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const canSend = draft.trim().length > 0 && !running;

  // Auto-size: grow with content up to max-h-25, then scroll.
  useLayoutEffect(() => {
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  }, [draft]);

  const send = () => {
    if (!canSend) return;
    onSend(draft);
    setDraft("");
  };

  const label = agentName ? `Message ${agentName}` : "Message";

  return (
    <fieldset aria-label="Message composer" className="relative z-30 m-0 min-w-0 border-0 px-3 pb-4 pt-3 md:px-6 md:pb-6">
      <div className="flex items-end gap-3 rounded-[26px] border border-border bg-background py-[9px] pe-2.5 ps-[18px] transition-colors focus-within:border-ring">
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
            event.preventDefault();
            send();
          }}
          placeholder={label}
          aria-label={label}
          name="chat-message"
          autoComplete="off"
          dir="auto"
          rows={1}
          className="rk-scroll mb-1 max-h-25 min-h-[24px] min-w-0 flex-1 resize-none overflow-y-auto bg-transparent py-0.5 text-[15.5px] leading-6 text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-40"
        />
        <div className="flex shrink-0 items-center gap-2">
          {running ? (
            <Button
              variant="outline"
              size="icon"
              aria-label="Stop"
              onClick={onStop}
              className="size-8 rounded-full border border-border bg-muted text-foreground/80 shadow-sm transition-colors hover:bg-accent hover:text-foreground"
            >
              <Square size={11} strokeWidth={0} fill="currentColor" />
            </Button>
          ) : null}
          <Button
            size="icon"
            aria-label="Send"
            disabled={!canSend}
            onClick={send}
            className="size-8 shrink-0 rounded-full bg-primary text-primary-foreground shadow-sm transition-transform hover:bg-primary/90 active:scale-95 disabled:bg-muted disabled:text-muted-foreground/40 disabled:opacity-100 disabled:shadow-none"
          >
            <ArrowUp size={16} strokeWidth={2.2} />
          </Button>
        </div>
      </div>
    </fieldset>
  );
}
