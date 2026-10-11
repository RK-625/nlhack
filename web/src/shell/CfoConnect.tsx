import { Link2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { refetchCfoStatus, startCfoConnect, useCfoStatus } from "@/hooks/useCfoStatus";

/** Compact prompt above the CFO Bot's composer while cfo.ai isn't linked. */
export function CfoConnectBanner() {
  const { status } = useCfoStatus();
  if (!status?.configured || status.connected) return null;
  return (
    <div className="mx-auto mb-2 flex w-full max-w-[720px] items-center gap-3 rounded-xl border border-border bg-card px-3 py-2 text-[13px]">
      <span className="min-w-0 flex-1 text-muted-foreground">
        Connect your cfo.ai account so the CFO Bot can use your live financial data.
      </span>
      <Button size="sm" onClick={startCfoConnect}>
        <Link2 aria-hidden="true" />
        Connect cfo.ai
      </Button>
    </div>
  );
}

type Notice = "connected" | "error";

/**
 * Reads the `?cfo=connected|error` result the OAuth callback redirects back with: refetches
 * the status, shows a small dismissible notice, and strips the param from the URL.
 */
export function CfoReturnNotice() {
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    const result = url.searchParams.get("cfo");
    if (!result) return;
    url.searchParams.delete("cfo");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    setNotice(result === "connected" ? "connected" : "error");
    void refetchCfoStatus();
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 6000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  if (!notice) return null;
  return (
    <div
      role="status"
      className="absolute start-1/2 top-3 z-50 flex max-w-[calc(100%-32px)] -translate-x-1/2 items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-[13px] text-foreground shadow-md"
    >
      <span className={notice === "error" ? "text-destructive" : undefined}>
        {notice === "connected" ? "cfo.ai connected." : "Couldn't connect cfo.ai. Please try again."}
      </span>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => setNotice(null)}
        className="grid size-5 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <X size={14} aria-hidden="true" />
      </button>
    </div>
  );
}
