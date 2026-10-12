import * as m from "motion/react-m";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { signInWithUsername } from "@/lib/auth";
import { rise } from "@/lib/motion";

/** Better Auth answers wrong credentials with 401; anything else shows the server's message. */
function errorMessage(error: { status?: number; message?: string }): string {
  if (error.status === 401) return "Invalid username or password";
  return error.message || "Sign-in failed. Please try again.";
}

/** Username + password sign-in. Sign-up is disabled server-side, so accounts come from an admin. */
export function LoginPage({ onSignedIn }: { onSignedIn?: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const name = username.trim();
    if (!name || !password || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const { error: failure } = await signInWithUsername(name, password);
      if (failure) {
        setError(errorMessage(failure));
        setSubmitting(false);
        return;
      }
      onSignedIn?.();
    } catch {
      setError("Could not reach the server. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="grid h-full place-items-center overflow-y-auto bg-background px-4 py-8 text-foreground/90">
      <m.div
        variants={rise}
        initial="hidden"
        animate="visible"
        className="w-full max-w-[360px] rounded-2xl border border-border bg-card p-6 text-card-foreground"
      >
        <h1 className="text-[17px] font-semibold tracking-tight text-foreground">Bot Company</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">Sign in to continue.</p>

        <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-[13px] font-medium text-foreground/90">
            Username
            <Input
              name="username"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              // biome-ignore lint/a11y/noAutofocus: the sign-in form is the only thing on screen.
              autoFocus
              required
              value={username}
              disabled={submitting}
              aria-invalid={error ? true : undefined}
              onChange={(event) => {
                setUsername(event.target.value);
                setError(null);
              }}
              className="h-9 border-border bg-background dark:bg-background"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-[13px] font-medium text-foreground/90">
            Password
            <Input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              value={password}
              disabled={submitting}
              aria-invalid={error ? true : undefined}
              onChange={(event) => {
                setPassword(event.target.value);
                setError(null);
              }}
              className="h-9 border-border bg-background dark:bg-background"
            />
          </label>

          {/* Fixed-height slot: the card doesn't jump when the error appears or clears. */}
          <div className="-my-1 min-h-5 text-[13px] leading-5 text-destructive">
            {error ? <p role="alert">{error}</p> : null}
          </div>

          <Button type="submit" size="lg" disabled={submitting} className="mt-1 h-9 w-full">
            {submitting ? <Spinner aria-hidden="true" role="presentation" /> : null}
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-5 text-center text-[12px] text-muted-foreground/70">
          Accounts are provisioned by an admin.
        </p>
      </m.div>
    </div>
  );
}
