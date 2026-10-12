import { Check, Minus, Play, X } from "lucide-react";
import { ApprovalCard, Receipt } from "../components/cards";
import { Footer, Nav } from "../components/chrome";
import { ShotFrame, VideoEmbed } from "../components/media";
import { BotFace, Button, Container, ExtLink, Section, Show, cx } from "../components/ui";
import {
  approvalExample,
  bots,
  caps,
  comparison,
  demo,
  partners,
  posts,
  receiptExample,
  site,
  steps,
  type Mark,
} from "../content";

function Hero() {
  return (
    <section className="relative overflow-hidden pb-20 pt-14 sm:pb-28 sm:pt-24">
      <Container className="grid items-center gap-14 lg:grid-cols-[1.05fr_1fr]">
        <div>
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-line px-3 py-1 text-sm text-muted-fg">
            <span className="flex -space-x-1.5">
              {(["orange", "blue", "green", "violet", "teal"] as const).map((c) => (
                <BotFace key={c} color={c} size={18} className="ring-2 ring-bg" />
              ))}
            </span>
            Built for {site.hackathon}
          </p>
          <h1 className="text-[2.6rem] font-semibold leading-[1.02] tracking-[-0.045em] text-balance sm:text-6xl lg:text-[4.4rem]">
            A company of AI agents that asks before it acts.
          </h1>
          <p className="mt-6 max-w-[54ch] text-lg leading-relaxed text-muted-fg text-pretty">
            Ask one bot. It hands the work to specialists for research, finance, GitHub and observability. Every
            change waits for your approval, every turn has a spending cap, and every run is traced with neatlogs.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button href="#video" icon={<Play aria-hidden className="size-4 fill-current" />}>
              Watch the demo
            </Button>
            <Button href="/judges/" variant="ghost">
              See the proof
            </Button>
          </div>
        </div>
        <HeroTranscript />
      </Container>
    </section>
  );
}

function HeroTranscript() {
  const a = approvalExample;
  return (
    <figure className="relative">
      <div className="rounded-[1.75rem] border border-line bg-card/60 p-3 sm:p-4">
        <ol className="seq space-y-3" aria-label="Example chat turn">
          <li className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-accent px-4 py-3 text-[15px]">
            Research Retool's competitors, then open an issue to track their pricing.
          </li>
          <li className="flex gap-3 px-1">
            <BotFace color="orange" size={30} />
            <div className="pt-1 text-[15px]">
              <p className="font-medium">Primary Bot</p>
              <p className="mt-1 text-muted-fg">
                Sending the research to Research Bot and the issue to GitHub Bot.
              </p>
            </div>
          </li>
          <li className="flex items-center gap-3 rounded-xl bg-muted px-3 py-2.5 text-sm">
            <BotFace color="blue" size={22} />
            <span>Research Bot ran Crustdata company search and web search</span>
            <Check aria-hidden className="ml-auto size-4 shrink-0 text-ok" />
          </li>
          <li>
            <ApprovalCard compact />
          </li>
          <li className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-xs text-muted-fg">
            <span className="num">
              Est. <Show value={receiptExample.estCostUsd}>{(n) => `$${n}`}</Show> for{" "}
              <Show value={receiptExample.estTokens} /> tokens
            </span>
            <span className="num">Cap ${caps.costCapUsd.toFixed(2)}</span>
            <span>Traced in neatlogs</span>
          </li>
        </ol>
      </div>
      <figcaption className="mt-3 text-center text-xs text-muted-fg">
        Illustration of one turn. {a.agent} pauses on <span className="font-medium">{a.tool}</span> until you
        choose.
      </figcaption>
    </figure>
  );
}

function Team() {
  const [primary, ...rest] = bots;
  const tooled = rest.filter((b) => b.tools.length > 0);
  const plain = rest.filter((b) => b.tools.length === 0);
  return (
    <Section
      id="team"
      title="Ten bots. You only talk to one."
      intro="The Primary Bot plans and delegates. Specialists own the tools. You can also open a chat with any of them directly."
    >
      <div className="grid gap-4 lg:grid-cols-3">
        {primary && (
          <article className="flex flex-col justify-between rounded-3xl bg-[var(--bot-orange)] p-6 text-[#1a1208] sm:p-8 lg:row-span-2">
            <BotFace color="orange" size={64} className="ring-4 ring-white/40" />
            <div className="mt-10">
              <h3 className="text-2xl font-semibold tracking-[-0.02em]">{primary.name}</h3>
              <p className="mt-2 max-w-[40ch] text-[15px] leading-relaxed opacity-85">{primary.role}</p>
              <ul className="mt-5 flex flex-wrap gap-2 text-sm">
                {primary.tools.map((t) => (
                  <li key={t} className="rounded-full bg-black/10 px-3 py-1">
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </article>
        )}
        {tooled.map((b) => (
          <article key={b.name} className="rounded-3xl border border-line bg-card p-6">
            <div className="flex items-center gap-3">
              <BotFace color={b.color} size={40} />
              <h3 className="text-lg font-semibold tracking-[-0.01em]">{b.name}</h3>
            </div>
            <p className="mt-4 text-[15px] leading-relaxed text-muted-fg">{b.role}</p>
            <ul className="mt-4 flex flex-wrap gap-2 text-sm">
              {b.tools.map((t) => (
                <li key={t} className="rounded-full bg-muted px-3 py-1">
                  {t}
                </li>
              ))}
            </ul>
            {b.gate && <p className="mt-4 border-t border-line pt-3 text-sm text-warn">{b.gate}</p>}
          </article>
        ))}
      </div>
      <div className="mt-4 rounded-3xl border border-dashed border-line p-6">
        <h3 className="text-sm font-medium text-muted-fg">Advisers with no tools yet. They work from what you tell them.</h3>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {plain.map((b) => (
            <li key={b.name} className="flex gap-3">
              <BotFace color={b.color} size={30} />
              <div className="text-sm">
                <p className="font-medium">{b.name}</p>
                <p className="mt-0.5 text-muted-fg">{b.role}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

function HowItWorks() {
  return (
    <Section id="how" title="One question in, one answer out, with a bill attached." className="border-t border-line">
      <ol className="grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <li key={s.title} className="flex flex-col bg-bg p-6 sm:p-7">
            <span className="num flex size-8 items-center justify-center rounded-full border border-line text-sm font-medium">
              {i + 1}
            </span>
            <h3 className="mt-6 text-lg font-semibold tracking-[-0.01em]">{s.title}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-muted-fg">{s.body}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

function Trust() {
  return (
    <Section
      id="proof"
      title="Nothing changes until you say yes."
      intro="Writes stop for approval, even when a specialist acts on the Primary Bot's behalf. Spending stops at a cap you set."
      className="border-t border-line"
    >
      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <ApprovalCard />
          <ul className="mt-6 space-y-3 text-[15px] leading-relaxed">
            <li>The card names the agent, the tool and the exact arguments.</li>
            <li>Deny, and the call never runs. Send a new message, and any open request is dropped.</li>
            <li>Reads run straight away, so research stays fast.</li>
          </ul>
        </div>
        <div>
          <Receipt />
          <ul className="mt-6 space-y-3 text-[15px] leading-relaxed">
            <li>
              Each turn is capped per user and per agent: ${caps.costCapUsd.toFixed(2)} and{" "}
              {caps.tokenCap.toLocaleString("en-US")} tokens by default, and you can change both.
            </li>
            <li>The cap is checked before every model call, so a runaway turn stops early.</li>
            <li>neatlogs' own figure appears next to ours, linked to the trace.</li>
          </ul>
        </div>
      </div>
    </Section>
  );
}

function Video() {
  return (
    <Section id="video" title="See a full turn in the demo." className="border-t border-line">
      <div className="mx-auto max-w-4xl">
        <VideoEmbed id={demo.youtubeId} title={`${site.name} demo`} />
      </div>
    </Section>
  );
}

function PoweredBy() {
  return (
    <Section
      id="partners"
      title="Built with neatlogs, Entire and cfo.ai."
      intro="Each partner tool does real work in the product or in how we built it."
      className="border-t border-line"
    >
      <div className="grid gap-10 md:grid-cols-3">
        {partners.map((p) => (
          <article key={p.id} className="flex flex-col">
            <h3 className="text-xl font-semibold tracking-[-0.02em]">{p.name}</h3>
            <ul className="mt-4 flex-1 space-y-3 text-[15px] leading-relaxed text-muted-fg">
              {p.claims.map((c) => (
                <li key={c} className="flex gap-2.5">
                  <Check aria-hidden className="mt-1 size-4 shrink-0 text-ok" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
            <ShotFrame src={p.screenshot} alt={`${p.name} screenshot`} className="mt-6" />
            <p className="mt-4 text-sm">
              <ExtLink href={p.link}>{p.linkLabel}</ExtLink>
            </p>
          </article>
        ))}
      </div>
    </Section>
  );
}

const markLabel: Record<Mark, string> = { yes: "Yes", partly: "Partly", no: "No" };

function MarkCell({ mark }: { mark: Mark }) {
  const Icon = mark === "yes" ? Check : mark === "partly" ? Minus : X;
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 text-sm",
        mark === "yes" ? "font-medium text-fg" : "text-muted-fg",
      )}
    >
      <Icon aria-hidden className={cx("size-4", mark === "yes" && "text-ok")} />
      {markLabel[mark]}
    </span>
  );
}

function Compare() {
  return (
    <Section id="compare" title="What you get over a single chatbot or a pile of scripts." className="border-t border-line">
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <table className="w-full min-w-[560px] border-collapse text-left">
          <caption className="sr-only">Bot Company compared with a single chat assistant and DIY scripts</caption>
          <thead>
            <tr className="border-b border-line text-sm">
              <th scope="col" className="py-3 pr-4 font-medium text-muted-fg">
                Feature
              </th>
              {comparison.columns.map((c, i) => (
                <th key={c} scope="col" className={cx("px-4 py-3 font-medium", i === 0 ? "text-fg" : "text-muted-fg")}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comparison.rows.map((r) => (
              <tr key={r.feature} className="border-b border-line">
                <th scope="row" className="py-4 pr-4 text-[15px] font-normal">
                  {r.feature}
                </th>
                {r.marks.map((m, i) => (
                  <td key={i} className={cx("px-4 py-4", i === 0 && "bg-muted/60")}>
                    <MarkCell mark={m} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

function Timeline() {
  return (
    <Section id="timeline" title="Built in public, one post at a time." className="border-t border-line">
      <Show value={posts}>
        {(list) => (
          <ol className="relative space-y-8 border-l border-line pl-6">
            {list.map((p) => (
              <li key={p.url} className="relative">
                <span aria-hidden className="absolute -left-[29px] top-1.5 size-2.5 rounded-full bg-[var(--bot-orange)]" />
                <time className="num text-sm text-muted-fg" dateTime={p.date}>
                  {p.date}
                </time>
                <p className="mt-1">
                  <ExtLink href={p.url}>{p.title}</ExtLink>
                </p>
              </li>
            ))}
          </ol>
        )}
      </Show>
    </Section>
  );
}

function JudgesCta() {
  return (
    <section className="border-t border-line py-20">
      <Container className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <h2 className="max-w-xl text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
          Judging? Every claim on this page has a link or a command behind it.
        </h2>
        <Button href="/judges/">Open the judges page</Button>
      </Container>
    </section>
  );
}

export function Home() {
  return (
    <>
      <Nav page="home" />
      <main id="main">
        <Hero />
        <Team />
        <HowItWorks />
        <Trust />
        <Video />
        <PoweredBy />
        <Compare />
        <Timeline />
        <JudgesCta />
      </main>
      <Footer />
    </>
  );
}
