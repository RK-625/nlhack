import type { CSSProperties, ReactNode } from "react";
import { isTodo, type BotColor, type Maybe } from "../content";

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

/** Muted pill shown wherever content.ts still has a placeholder. */
export function Soon({ note, className }: { note?: string; className?: string }) {
  return (
    <span
      title={note}
      className={cx(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-dashed border-line bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-fg",
        className,
      )}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-muted-fg/60" />
      Coming soon
    </span>
  );
}

/** Renders a value, or the Coming soon pill if it is still a placeholder. */
export function Show<T>({
  value,
  children,
  className,
}: {
  value: Maybe<T>;
  children?: (v: T) => ReactNode;
  className?: string;
}) {
  if (isTodo(value)) return <Soon note={value.todo} className={className} />;
  return <>{children ? children(value) : String(value)}</>;
}

export function ExtLink({
  href,
  children,
  className,
}: {
  href: Maybe<string>;
  children: ReactNode;
  className?: string;
}) {
  if (isTodo(href)) return <Soon note={href.todo} className={className} />;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cx("font-medium text-link underline-offset-4 hover:underline", className)}
    >
      {children}
    </a>
  );
}

/** A simple bot face: colored circle with two eyes. */
export function BotFace({
  color,
  size = 40,
  className,
}: {
  color: BotColor;
  size?: number;
  className?: string;
}) {
  const style = { width: size, height: size, background: `var(--bot-${color})` } as CSSProperties;
  const eye = Math.max(4, Math.round(size * 0.2));
  const pupil = Math.max(2, Math.round(eye * 0.45));
  return (
    <span
      aria-hidden
      style={style}
      className={cx(
        "relative inline-flex shrink-0 items-center justify-center gap-[14%] rounded-full shadow-[inset_0_-3px_0_rgb(0_0_0/0.15)]",
        className,
      )}
    >
      {[0, 1].map((i) => (
        <span
          key={i}
          className="eye flex items-center justify-center rounded-full bg-white"
          style={{ width: eye, height: eye, marginTop: -size * 0.06 }}
        >
          <span
            className="rounded-full bg-[#0b0c0e]"
            style={{ width: pupil, height: pupil, transform: "translate(15%, 10%)" }}
          />
        </span>
      ))}
    </span>
  );
}

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("mx-auto w-full max-w-6xl px-4 sm:px-6", className)}>{children}</div>;
}

export function Section({
  id,
  title,
  intro,
  children,
  className,
}: {
  id?: string;
  title: string;
  intro?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const headingId = id ? `${id}-title` : undefined;
  return (
    <section id={id} aria-labelledby={headingId} className={cx("py-20 sm:py-28", className)}>
      <Container>
        <h2
          id={headingId}
          className="max-w-3xl text-3xl font-semibold tracking-[-0.03em] text-balance sm:text-[2.75rem] sm:leading-[1.08]"
        >
          {title}
        </h2>
        {intro && <p className="mt-4 max-w-[62ch] text-lg text-muted-fg text-pretty">{intro}</p>}
        <div className="mt-12">{children}</div>
      </Container>
    </section>
  );
}

export function Button({
  href,
  children,
  variant = "primary",
  icon,
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "ghost";
  icon?: ReactNode;
}) {
  return (
    <a
      href={href}
      className={cx(
        "inline-flex h-11 items-center gap-2 rounded-full px-5 text-[15px] font-medium transition-colors duration-150",
        variant === "primary"
          ? "bg-primary text-primary-fg hover:opacity-90"
          : "border border-line bg-card text-fg hover:bg-accent",
      )}
    >
      {icon}
      {children}
    </a>
  );
}
