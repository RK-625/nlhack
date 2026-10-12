import { AlertTriangle, ArrowDown } from "lucide-react";
import { Footer, Nav } from "../components/chrome";
import { CopyCommand, Gallery } from "../components/media";
import { Container, ExtLink, Section, Show, Soon } from "../components/ui";
import {
  architecture,
  bigNumbers,
  demo,
  evidence,
  galleries,
  improvement,
  incident,
  isTodo,
  knownLimits,
  partners,
  repoFacts,
  reproduce,
  type Badge,
} from "../content";

const jumps = [
  { href: "#evidence", label: "Evidence" },
  { href: "#improved", label: "Agent improved" },
  { href: "#incident", label: "Failure and recovery" },
  { href: "#screenshots", label: "Screenshots" },
  { href: "#chapters", label: "Demo chapters" },
  { href: "#limits", label: "Known limits" },
  { href: "#reproduce", label: "Reproduce" },
  { href: "#architecture", label: "Code map" },
];

const badgeTone: Record<Badge, string> = {
  "In repo": "var(--bot-violet)",
  Public: "var(--bot-blue)",
  Screenshots: "var(--bot-teal)",
};

function BadgePill({ badge }: { badge: Badge }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium"
      style={{
        borderColor: `color-mix(in srgb, ${badgeTone[badge]} 40%, transparent)`,
        background: `color-mix(in srgb, ${badgeTone[badge]} 12%, transparent)`,
      }}
    >
      <span aria-hidden className="size-1.5 rounded-full" style={{ background: badgeTone[badge] }} />
      {badge}
    </span>
  );
}

function Header() {
  return (
    <section className="pb-14 pt-14 sm:pt-20">
      <Container>
        <h1 className="max-w-4xl text-[2.4rem] font-semibold leading-[1.04] tracking-[-0.045em] text-balance sm:text-6xl">
          Check every Bot Company claim in 60 seconds.
        </h1>
        <p className="mt-5 max-w-[60ch] text-lg text-muted-fg">
          Seven criteria, each with a proof and a link. Anything not ready yet says so.
        </p>
        <nav aria-label="On this page" className="mt-8">
          <ul className="flex flex-wrap gap-2">
            {jumps.map((j) => (
              <li key={j.href}>
                <a
                  href={j.href}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-sm transition-colors hover:bg-accent"
                >
                  <ArrowDown aria-hidden className="size-3.5 text-muted-fg" />
                  {j.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {bigNumbers.map((n) => {
            const p = partners.find((x) => x.id === n.id);
            return (
              <div key={n.id} className="rounded-3xl border border-line bg-card p-6">
                <p className="text-sm font-medium">{p?.name}</p>
                <p className="num mt-6 min-h-12 text-5xl font-semibold tracking-[-0.04em]">
                  <Show value={n.value} className="align-middle text-sm tracking-normal" />
                </p>
                <p className="mt-2 text-sm text-muted-fg">{n.label}</p>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

function Evidence() {
  return (
    <Section id="evidence" title="The seven official evidence rows." className="border-t border-line">
      <ol className="divide-y divide-line border-y border-line">
        {evidence.map((e, i) => (
          <li key={e.criterion} className="grid gap-3 py-6 sm:grid-cols-[3rem_1fr_auto] sm:items-start sm:gap-6">
            <span className="num text-2xl font-semibold text-muted-fg">{i + 1}</span>
            <div className="min-w-0">
              <h3 className="text-[17px] font-medium leading-snug">{e.criterion}</h3>
              <p className="mt-2 text-[15px] text-muted-fg">
                <Show value={e.proof} />
              </p>
            </div>
            <div className="flex items-center gap-3 sm:flex-col sm:items-end">
              <BadgePill badge={e.badge} />
              <ExtLink href={e.link} className="text-sm">
                Open proof
              </ExtLink>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}

function Improved() {
  return (
    <Section
      id="improved"
      title="The same task, before and after we improved the agent."
      intro={<Show value={improvement.summary} />}
      className="border-t border-line"
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {improvement.stats.map((s) => (
          <div key={s.label} className="rounded-3xl border border-line bg-card p-6">
            <p className="text-sm font-medium">{s.label}</p>
            <dl className="num mt-5 grid grid-cols-2 gap-4">
              <div>
                <dt className="text-xs text-muted-fg">v1</dt>
                <dd className="mt-1 text-2xl font-semibold text-muted-fg">
                  <Show value={s.v1} className="text-xs" />
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-fg">v2</dt>
                <dd className="mt-1 text-2xl font-semibold">
                  <Show value={s.v2} className="text-xs" />
                </dd>
              </div>
            </dl>
          </div>
        ))}
      </div>
    </Section>
  );
}

function Incident() {
  return (
    <Section id="incident" title="When a run failed, this is what happened next." className="border-t border-line">
      <ol className="grid gap-4 md:grid-cols-4">
        {incident.map((s, i) => (
          <li key={s.stage} className="relative rounded-3xl border border-line bg-card p-6">
            <span className="num flex size-8 items-center justify-center rounded-full border border-line text-sm font-medium">
              {i + 1}
            </span>
            <h3 className="mt-5 font-semibold">{s.stage}</h3>
            <p className="mt-2 text-[15px] text-muted-fg">
              <Show value={s.text} />
            </p>
            {s.link && !isTodo(s.text) && (
              <p className="mt-3 text-sm">
                <ExtLink href={s.link}>Open</ExtLink>
              </p>
            )}
          </li>
        ))}
      </ol>
    </Section>
  );
}

function Screenshots() {
  return (
    <Section id="screenshots" title="Screenshots from each tool." intro="Select an image to enlarge it." className="border-t border-line">
      <div className="space-y-12">
        {galleries.map((g) => (
          <div key={g.id}>
            <h3 className="mb-4 text-lg font-semibold">{g.name}</h3>
            <Gallery name={g.name} shots={g.shots} />
          </div>
        ))}
      </div>
    </Section>
  );
}

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  return `${m}:${String(sec % 60).padStart(2, "0")}`;
}

function Chapters() {
  const id = demo.youtubeId;
  return (
    <Section id="chapters" title="Jump straight to the part you want to see." className="border-t border-line">
      {isTodo(id) && (
        <p className="mb-6 flex items-center gap-2 text-sm text-muted-fg">
          Demo video <Soon note={id.todo} />
        </p>
      )}
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <table className="w-full min-w-[420px] border-collapse text-left">
          <caption className="sr-only">Demo video chapters</caption>
          <thead>
            <tr className="border-b border-line text-sm text-muted-fg">
              <th scope="col" className="w-28 py-3 pr-4 font-medium">
                Time
              </th>
              <th scope="col" className="py-3 font-medium">
                Chapter
              </th>
            </tr>
          </thead>
          <tbody>
            {demo.chapters.map((c) => (
              <tr key={c.label} className="border-b border-line">
                <td className="num py-4 pr-4">
                  {isTodo(c.start) || isTodo(id) ? (
                    <Soon note={isTodo(c.start) ? c.start.todo : "video id"} />
                  ) : (
                    <a
                      href={`https://www.youtube.com/watch?v=${encodeURIComponent(id)}&t=${c.start}s`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-link underline-offset-4 hover:underline"
                    >
                      {fmt(c.start)}
                    </a>
                  )}
                </td>
                <td className="py-4 text-[15px]">{c.label}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

function Limits() {
  return (
    <Section
      id="limits"
      title="What doesn't work yet."
      intro="Taken from the repo README. We would rather you hear it from us."
      className="border-t border-line"
    >
      <ul className="grid gap-3 md:grid-cols-2">
        {knownLimits.map((l) => (
          <li key={l} className="flex gap-3 rounded-2xl bg-muted p-4 text-[15px] leading-relaxed">
            <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0 text-warn" />
            <span>{l}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function Reproduce() {
  return (
    <Section
      id="reproduce"
      title="Run the checks yourself."
      intro={
        <>
          From a clone of the repo. As of {repoFacts.asOf} these show {repoFacts.commits} commits from{" "}
          {repoFacts.firstCommit} to {repoFacts.lastCommit}, {repoFacts.checkpointTrailers} with an Entire checkpoint.
        </>
      }
      className="border-t border-line"
    >
      <div className="grid gap-3 lg:grid-cols-2">
        {reproduce.map((r) => (
          <CopyCommand key={r.label} label={r.label} cmd={r.cmd} />
        ))}
      </div>
    </Section>
  );
}

function Architecture() {
  return (
    <Section id="architecture" title="Every bot maps to one file." className="border-t border-line">
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <table className="w-full min-w-[480px] border-collapse text-left">
          <caption className="sr-only">Which source file implements each part</caption>
          <thead>
            <tr className="border-b border-line text-sm text-muted-fg">
              <th scope="col" className="py-3 pr-4 font-medium">
                Part
              </th>
              <th scope="col" className="py-3 font-medium">
                Source file
              </th>
            </tr>
          </thead>
          <tbody>
            {architecture.map((a) => (
              <tr key={a.part} className="border-b border-line">
                <th scope="row" className="py-3 pr-4 text-[15px] font-normal">
                  {a.part}
                </th>
                <td className="py-3">
                  <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[13px]">{a.file}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

export function Judges() {
  return (
    <>
      <Nav page="judges" />
      <main id="main">
        <Header />
        <Evidence />
        <Improved />
        <Incident />
        <Screenshots />
        <Chapters />
        <Limits />
        <Reproduce />
        <Architecture />
      </main>
      <Footer />
    </>
  );
}
