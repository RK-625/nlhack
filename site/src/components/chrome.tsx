import { site } from "../content";
import { BotAvatar } from "./avatar";
import { Container, ExtLink, cx } from "./ui";

export function Wordmark() {
  return (
    <a href="/" className="flex items-center gap-2.5 rounded-full" aria-label={`${site.name} home`}>
      <BotAvatar agent="assistant" size={28} />
      <span className="text-[17px] font-semibold tracking-[-0.02em]">{site.name}</span>
    </a>
  );
}

export function Nav({ page }: { page: "home" | "judges" }) {
  const base = page === "home" ? "" : "/";
  const links = [
    { href: `${base}#how`, label: "How it works" },
    { href: `${base}#proof`, label: "Proof" },
    { href: `${base}#video`, label: "Video" },
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/80 backdrop-blur-md supports-[not(backdrop-filter:blur(1px))]:bg-bg">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:rounded-md focus:bg-card focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <Container className="flex h-16 items-center justify-between gap-4">
        <Wordmark />
        <nav aria-label="Main" className="flex items-center gap-1">
          <ul className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="rounded-full px-3 py-2 text-sm text-muted-fg transition-colors hover:text-fg"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <a
            href="/judges/"
            aria-current={page === "judges" ? "page" : undefined}
            className={cx(
              "ml-2 inline-flex h-9 items-center rounded-full px-4 text-sm font-medium transition-colors",
              page === "judges"
                ? "border border-line bg-accent text-fg"
                : "bg-primary text-primary-fg hover:opacity-90",
            )}
          >
            For judges
          </a>
        </nav>
      </Container>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-line py-12 text-sm text-muted-fg">
      <Container className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-md space-y-2">
          <Wordmark />
          <p>Built for {site.hackathon}.</p>
          <p>{site.credits}</p>
        </div>
        <ul className="flex flex-col gap-2 sm:items-end">
          <li>
            Source code: <ExtLink href={site.repoUrl}>GitHub repo</ExtLink>
          </li>
          <li>
            <a href="/judges/" className="text-fg underline-offset-4 hover:underline">
              Evidence for judges
            </a>
          </li>
        </ul>
      </Container>
    </footer>
  );
}
