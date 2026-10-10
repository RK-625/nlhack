import { ArrowUp, Square } from "lucide-react";
import { useState } from "react";

// TODO(S2): port rakazo's composer bar styling (Shell.tsx ~5970-6171): auto-grow, Enter to send.
export function Composer({
  running,
  onSend,
  onStop,
}: {
  running: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
}) {
  const [text, setText] = useState("");
  return (
    <form
      className="mx-4 mb-4 flex items-center gap-3 rounded-[26px] border border-border bg-background px-3 py-[9px] focus-within:border-ring"
      onSubmit={(event) => {
        event.preventDefault();
        if (!text.trim()) return;
        onSend(text);
        setText("");
      }}
    >
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={1}
        placeholder="Message"
        className="flex-1 resize-none bg-transparent text-[15.5px] outline-none placeholder:text-muted-foreground"
      />
      {running ? (
        <button type="button" aria-label="Stop" onClick={onStop}>
          <Square size={11} strokeWidth={0} fill="currentColor" />
        </button>
      ) : (
        <button type="submit" aria-label="Send">
          <ArrowUp size={16} strokeWidth={2.2} />
        </button>
      )}
    </form>
  );
}
