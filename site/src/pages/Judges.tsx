import { CfoProof } from "../components/cfo-proof";
import { ArrowDown } from "lucide-react";
import { Footer, Nav } from "../components/chrome";
import { GitHubLink } from "../components/github";
import { CopyCommand, Gallery } from "../components/media";
import { ProcessSteps, ReviewText } from "../components/review";
import { Container, ExtLink, Section, Show } from "../components/ui";
import {
  architecture,
  bigNumbers,
  commitsPerDay,
  entireTerminal,
  evidence,
  improvement,
  isTodo,
  knownLimits,
  partners,
  proofBase,
  proofReport,
  repoFacts,
  reproduce,
  site,
  type Criterion,
} from "../content";

const titles: Record<string, string> = {
  improved: "Reducing agent cost and repeated work",
  neatlogs: "Tracing a failed run with neatlogs",
  entire: "Recording the code changes with Entire",
  cfo: "CFO Bot: without and with cfo.ai",
  recovery: "Finishing a capped run with user approval",
  public: "Sharing the build in public",
  commits: "Verifying when the hackathon code was written",
};

function Header() {
  return (
    <header className="pb-14 pt-14 sm:pt-20">
      <Container>
        <h1 className="max-w-4xl text-[2.4rem] font-semibold leading-[1.04] tracking-[-0.045em] text-balance sm:text-6xl">
          See Bot Company at work.
        </h1>
        <p className="mt-5 max-w-[60ch] text-lg text-muted-fg">
          The runs, changes and tools behind the project. Open any screenshot for a closer look.
        </p>
        <nav aria-label="On this page" className="mt-8">
          <ul className="flex flex-wrap gap-2">
            {evidence.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`} className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-sm transition-colors hover:bg-accent">
                  <ArrowDown aria-hidden className="size-3.5 text-muted-fg" />
                  {item.short}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {bigNumbers.map((number) => (
            <div key={number.id} className="min-w-0 rounded-3xl border border-line bg-card p-6">
              <p className="text-sm font-medium">{partners.find((partner) => partner.id === number.id)?.name}</p>
              <p className="num mt-6 min-h-12 text-[2.6rem] font-semibold tracking-[-0.04em] sm:text-5xl">
                <Show value={number.value} className="align-middle text-sm tracking-normal" />
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-fg">{number.label}</p>
            </div>
          ))}
        </div>
      </Container>
    </header>
  );
}

function ImprovementStats() {
  return (
    <>
      <ProcessSteps steps={improvement.story} />
      <div className="mb-10 overflow-x-auto rounded-2xl border border-line">
        <table className="num w-full min-w-[340px] text-left text-sm">
          <caption className="border-b border-line bg-card px-5 py-4 text-left font-semibold">One failed run compared with its matching successful run</caption>
          <thead className="bg-muted">
            <tr>
              <th scope="col" className="px-4 py-3">Metric</th>
              <th scope="col" className="px-4 py-3 text-bad">Before · failed</th>
              <th scope="col" className="px-4 py-3 text-ok">After · completed</th>
            </tr>
          </thead>
          <tbody>
            {improvement.pairedRuns.map((row) => (
              <tr key={row.label} className="border-t border-line">
                <th scope="row" className="px-4 py-3 font-medium">{row.label}</th>
                <td className="px-4 py-3 text-bad">{row.before}</td>
                <td className="bg-ok/5 px-4 py-3 font-semibold text-ok">{row.after}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h3 className="mb-4 text-lg font-semibold">The broader check: three runs before, three after</h3>
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {improvement.stats.map((stat) => (
          <div key={stat.label} className="min-w-0 rounded-2xl border border-line bg-card p-5">
            <p className="text-sm font-medium">{stat.label}</p>
            <dl className="num mt-4 grid grid-cols-2 gap-3">
              <div>
                <dt className="text-xs text-bad">Before</dt>
                <dd className="mt-1 text-lg font-semibold text-bad"><Show value={stat.v1} /></dd>
              </div>
              <div>
                <dt className="text-xs text-ok">After</dt>
                <dd className="mt-1 text-lg font-semibold text-ok"><Show value={stat.v2} /></dd>
              </div>
            </dl>
          </div>
        ))}
      </div>
      <p className="mb-8 max-w-3xl text-sm leading-relaxed text-muted-fg"><ReviewText text={improvement.note} /></p>
    </>
  );
}

function EntireCheckpoint() {
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-line bg-card">
      <p className="border-b border-line px-5 py-3 text-sm text-muted-fg">Saved terminal output · email redacted</p>
      <pre className="overflow-x-auto p-5 font-mono text-xs leading-7 sm:text-sm"><code>{entireTerminal}</code></pre>
    </div>
  );
}

function CommitHistory() {
  return (
    <>
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {commitsPerDay.map((day) => (
          <div key={day.date} className="rounded-2xl border border-line bg-card p-5">
            <time dateTime={day.date} className="text-sm text-muted-fg">{day.date}</time>
            <p className="num mt-3 text-3xl font-semibold">{day.commits} <span className="text-sm font-normal text-muted-fg">commits</span></p>
          </div>
        ))}
      </div>
      <p className="mb-4 text-sm text-muted-fg">Counts are pinned to snapshot <ExtLink href={`${site.repoUrl}/commit/${repoFacts.ref}`}>{repoFacts.ref.slice(0, 8)}</ExtLink>. Clone the public repository to run these checks.</p>
      <div className="grid gap-3 lg:grid-cols-2">
        {reproduce.map((command) => <CopyCommand key={command.label} {...command} />)}
      </div>
    </>
  );
}

function CriterionSection({ item }: { item: Criterion }) {
  return (
    <Section
      id={item.id}
      title={titles[item.id] ?? item.short}
      intro={isTodo(item.proof) ? "Posts tagged #neatHack will appear here once their links are supplied." : <ReviewText text={item.proof} />}
      className="border-t border-line"
    >
      {item.id === "improved" && <ImprovementStats />}
      {item.id === "cfo" && <CfoProof />}
      {item.steps && <ProcessSteps steps={item.steps} />}
      {item.id === "entire" && <EntireCheckpoint />}
      {item.id === "commits" && <CommitHistory />}
      {item.shots && <Gallery name={titles[item.id] ?? item.short} shots={item.shots} />}
      {item.links && (
        <p className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm">
          {item.links.map((link) => !isTodo(link.href) && link.href.startsWith(`${site.repoUrl}/`)
            ? <GitHubLink key={link.label} href={link.href} className="text-link">{link.label}</GitHubLink>
            : <ExtLink key={link.label} href={link.href}>{link.label}</ExtLink>)}
        </p>
      )}
    </Section>
  );
}

function SupportingDetails() {
  return (
    <div className="border-t border-line py-10">
      <Container>
        <details className="border-b border-line pb-4">
          <summary className="cursor-pointer text-sm font-medium">Known limits</summary>
          <ul className="mt-4 max-w-3xl list-disc space-y-3 pl-5 text-sm leading-relaxed text-muted-fg">
            {knownLimits.map((limit) => <li key={limit}>{limit}</li>)}
          </ul>
        </details>
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium">Code map</summary>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            {architecture.map((part) => (
              <div key={part.part} className="min-w-0">
                <dt>{part.part}</dt>
                <dd className="mt-1 break-words font-mono text-xs text-muted-fg"><GitHubLink href={`${site.repoUrl}/blob/main/${part.file}`} className="max-w-full text-link"><span className="min-w-0 break-all">{part.file}</span></GitHubLink></dd>
              </div>
            ))}
          </dl>
        </details>
        <p className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-fg">
          <ExtLink href={proofReport}>Source report</ExtLink>
          <ExtLink href={`${proofBase}/README.md`}>Capture index</ExtLink>
          <ExtLink href={`${proofBase}/SHA256SUMS.txt`}>Checksums</ExtLink>
        </p>
      </Container>
    </div>
  );
}

export function Judges() {
  return (
    <>
      <Nav page="judges" />
      <main id="main">
        <Header />
        {evidence.map((item) => <CriterionSection key={item.id} item={item} />)}
        <SupportingDetails />
      </main>
      <Footer />
    </>
  );
}
