import { Check, Copy, ImageIcon, Play, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { isTodo, type Maybe, type Shot } from "../content";
import { Soon, cx } from "./ui";

/** Local launch film, or a click-to-play YouTube embed once an id exists. */
export function VideoEmbed({
  id,
  title,
  start,
  src,
}: {
  id?: Maybe<string>;
  title: string;
  start?: number;
  src?: string;
}) {
  const [playing, setPlaying] = useState(false);
  if (src) {
    return (
      <video
        className="aspect-video w-full rounded-2xl border border-line bg-black"
        controls
        playsInline
        preload="metadata"
        aria-label={title}
      >
        <source src={src} type="video/mp4" />
      </video>
    );
  }
  if (!id || isTodo(id)) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line bg-muted text-muted-fg">
        <Play aria-hidden className="size-8" />
        <p className="text-sm">The demo video goes here.</p>
        <Soon note={id && isTodo(id) ? id.todo : "TODO: video"} />
      </div>
    );
  }
  const params = new URLSearchParams({ autoplay: "1", rel: "0" });
  if (start) params.set("start", String(start));
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-line bg-black">
      {playing ? (
        <iframe
          className="absolute inset-0 size-full"
          src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?${params}`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="group absolute inset-0 flex items-center justify-center"
          aria-label={`Play video: ${title}`}
        >
          <img
            src={`https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg`}
            alt=""
            loading="lazy"
            decoding="async"
            className="absolute inset-0 size-full object-cover opacity-80 transition-opacity group-hover:opacity-100"
          />
          <span className="relative flex size-16 items-center justify-center rounded-full bg-white/95 text-black shadow-lg transition-transform group-hover:scale-105">
            <Play aria-hidden className="ml-1 size-7 fill-current" />
          </span>
        </button>
      )}
    </div>
  );
}

/** Screenshot slot: a real image, or a labelled empty frame. */
export function ShotFrame({ src, alt, className }: { src: Maybe<string>; alt: string; className?: string }) {
  if (isTodo(src)) {
    return (
      <div
        className={cx(
          "flex aspect-[16/10] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-muted text-muted-fg",
          className,
        )}
      >
        <ImageIcon aria-hidden className="size-6" />
        <Soon note={src.todo} />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={cx("aspect-[16/10] w-full rounded-xl border border-line object-cover object-top", className)}
    />
  );
}

/** Original captures at full content width, with a lightbox for closer inspection. */
export function Gallery({ name, shots }: { name: string; shots: Maybe<Shot[]> }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState<Shot | null>(null);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  if (isTodo(shots) || shots.length === 0) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <ShotFrame key={i} src={isTodo(shots) ? shots : { todo: `${name} screenshots` }} alt="" className={i === 2 ? "hidden sm:flex" : undefined} />
        ))}
      </div>
    );
  }

  return (
    <>
      <ul className="grid gap-8">
        {shots.map((s) => (
          <li key={s.src}>
            <button
              type="button"
              onClick={() => setOpen(s)}
              className="block w-full overflow-hidden rounded-xl transition-opacity hover:opacity-90"
              aria-label={`Enlarge: ${s.alt}`}
            >
              <img src={s.src} alt={s.alt} width={s.width} height={s.height} loading="lazy" decoding="async" className="block h-auto w-full rounded-xl border border-line" />
            </button>
            <p className="mt-2 text-xs leading-relaxed text-muted-fg">{s.alt}</p>
          </li>
        ))}
      </ul>
      <dialog
        ref={dialog}
        onClose={() => setOpen(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setOpen(null);
        }}
        className="m-auto max-h-[92vh] max-w-[min(1200px,94vw)] bg-transparent p-0 backdrop:bg-[var(--overlay)]"
        aria-label={open?.alt ?? `${name} screenshot`}
      >
        {open && (
          <figure className="pop relative">
            <img src={open.src} alt={open.alt} className="max-h-[86vh] w-auto rounded-xl" />
            <figcaption className="mt-2 text-center text-sm text-white/80">
              {open.alt}{" "}
              <a href={open.src} target="_blank" rel="noreferrer" className="whitespace-nowrap underline underline-offset-4">
                Open full size
              </a>
            </figcaption>
            <button
              type="button"
              onClick={() => setOpen(null)}
              className="absolute right-2 top-2 flex size-9 items-center justify-center rounded-full bg-black/70 text-white"
              aria-label="Close"
            >
              <X aria-hidden className="size-5" />
            </button>
          </figure>
        )}
      </dialog>
    </>
  );
}

export function CopyCommand({ label, cmd }: { label: string; cmd: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(cmd);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable: the command is still selectable */
    }
  };
  return (
    <div className="min-w-0 rounded-xl border border-line bg-card">
      <div className="flex items-center justify-between gap-3 px-4 pt-3 text-sm text-muted-fg">
        <span>{label}</span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-fg transition-colors hover:bg-accent"
          aria-label={`Copy command: ${label}`}
        >
          {copied ? <Check aria-hidden className="size-3.5 text-ok" /> : <Copy aria-hidden className="size-3.5" />}
          <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <pre className="overflow-x-auto px-4 pb-3 pt-2 text-[13px] leading-relaxed">
        <code className="font-mono">
          <span aria-hidden className="select-none text-muted-fg">$ </span>
          {cmd}
        </code>
      </pre>
    </div>
  );
}
