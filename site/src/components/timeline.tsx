import { useState, type ReactNode } from "react";
import type { Post } from "../content";

const author = {
  name: "Rithesh Kumar",
  handle: "@rk625dev",
  avatar: "/posts/avatar.jpg",
  profile: "https://x.com/rk625dev",
};

function RichText({ text }: { text: string }) {
  const parts = text.split(/([@#][\w]+)/g);
  return (
    <p className="whitespace-pre-wrap text-[15px] leading-snug text-[#0f1419]">
      {parts.map((part, i) =>
        part.startsWith("@") || part.startsWith("#") ? (
          <span key={i} className="text-[#1d9bf0]">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </p>
  );
}

function PostCard({ post }: { post: Post }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(post.url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }
  return (
    <article className="overflow-hidden rounded-2xl border border-black/10 bg-white text-[#0f1419] shadow-[0_8px_30px_rgba(0,0,0,0.18)]">
      <header className="flex items-start gap-3 px-4 pt-4">
        <a href={author.profile} target="_blank" rel="noreferrer" className="shrink-0">
          <img src={author.avatar} alt="" className="size-11 rounded-full object-cover" />
        </a>
        <div className="min-w-0 flex-1">
          <a href={author.profile} target="_blank" rel="noreferrer" className="block truncate font-semibold leading-tight hover:underline">
            {author.name}
          </a>
          <a href={author.profile} target="_blank" rel="noreferrer" className="block truncate text-sm text-[#536471]">
            {author.handle}
          </a>
        </div>
        <a href={post.url} target="_blank" rel="noreferrer" aria-label="Open on X" className="text-black">
          <svg viewBox="0 0 24 24" className="size-5 fill-current" aria-hidden>
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </a>
      </header>
      <div className="px-4 py-3">
        <RichText text={post.text} />
      </div>
      {post.image && (
        <a href={post.url} target="_blank" rel="noreferrer" className="mx-4 mb-3 block overflow-hidden rounded-2xl border border-black/10">
          <img src={post.image} alt="" className="max-h-72 w-full object-cover" />
        </a>
      )}
      {post.video && (
        <video
          className="mx-4 mb-3 aspect-video w-[calc(100%-2rem)] rounded-2xl border border-black/10 bg-black"
          controls
          playsInline
          preload="metadata"
          aria-label={post.title}
        >
          <source src={post.video} type="video/mp4" />
        </video>
      )}
      <a href={post.url} target="_blank" rel="noreferrer" className="block px-4 text-sm text-[#536471] hover:underline">
        <time dateTime={post.date}>{post.stamp}</time>
      </a>
      <div className="mt-2 flex items-center gap-5 px-4 text-sm text-[#536471]">
        <a href={post.url} target="_blank" rel="noreferrer" className="hover:text-[#1d9bf0]">
          Reply
        </a>
        <button type="button" onClick={copy} className="hover:text-[#1d9bf0]">
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>
      <div className="p-3">
        <a
          href={post.url}
          target="_blank"
          rel="noreferrer"
          className="flex h-10 items-center justify-center rounded-full border border-[#cfd9de] text-sm font-semibold text-[#0f1419] hover:bg-[#f7f9f9]"
        >
          Read more on X
        </a>
      </div>
    </article>
  );
}

/** Two-up public posts with a path, in the shape of a build-in-public timeline. */
export function PublicTimeline({ posts, renderPost }: { posts: Post[]; renderPost?: (post: Post) => ReactNode }) {
  const rows: Post[][] = [];
  for (let i = 0; i < posts.length; i += 2) rows.push(posts.slice(i, i + 2));
  return (
    <div className="mx-auto max-w-5xl">
      {rows.map((row, rowIndex) => (
        <div key={row[0].url} className="relative pb-8 md:pb-10">
          <div aria-hidden className={`pointer-events-none absolute left-[18%] top-[5px] hidden border-t-2 border-[#3b82f6] md:block ${rowIndex < rows.length - 1 || rowIndex > 0 ? "right-[10%]" : "right-[18%]"}`} />
          {rowIndex < rows.length - 1 && (
            <div
              aria-hidden
              className="pointer-events-none absolute -right-[2%] top-[5px] hidden h-[calc(100%+4px)] w-[12%] rounded-r-[2rem] border-b-2 border-r-2 border-t-2 border-[#3b82f6] md:block"
            />
          )}
          <ol className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-12">
            {row.map((post) => (
              <li key={post.url} className="relative pt-6">
                <span aria-hidden className="pointer-events-none absolute left-1/2 top-0 h-[calc(100%+2rem)] w-0.5 -translate-x-1/2 bg-[#3b82f6]/40 md:hidden" />
                <span aria-hidden className="absolute left-1/2 top-0 z-10 size-3 -translate-x-1/2 rounded-full border-2 border-[#3b82f6] bg-background" />
                <p className="relative z-10 mx-auto mb-3 w-fit bg-background px-2 text-center font-mono text-sm text-muted-fg">{post.when}</p>
                <div className="relative z-10">{renderPost ? renderPost(post) : <PostCard post={post} />}</div>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}
