import { EmbeddedTweet, TweetSkeleton, useTweet } from "react-tweet";
import type { Post } from "../content";

/** Status id is the last path segment of the X URL. */
export function tweetId(url: string) {
  return url.split("/").filter(Boolean).pop()?.split("?")[0] ?? "";
}

function Fallback({ post }: { post: Post }) {
  return (
    <article className="rounded-2xl border border-line bg-card p-5 text-left">
      <p className="font-semibold leading-snug">{post.title}</p>
      <p className="mt-2 text-sm text-muted-fg">The embedded post could not be loaded.</p>
      <a href={post.url} target="_blank" rel="noreferrer" className="mt-4 inline-block text-sm text-link underline-offset-4 hover:underline">
        Open on X
      </a>
    </article>
  );
}

/** Real embedded post (fetched client side from react-tweet's public API). Follows the site's light/dark scheme. */
export function TweetCard({ post }: { post: Post }) {
  const { data, error, isLoading } = useTweet(tweetId(post.url));
  return (
    <div className="mx-auto w-full max-w-[550px] min-w-0 [&_.react-tweet-theme]:!my-0 [&_.react-tweet-theme]:!w-full">
      {isLoading ? <TweetSkeleton /> : error || !data ? <Fallback post={post} /> : <EmbeddedTweet tweet={data} />}
    </div>
  );
}
