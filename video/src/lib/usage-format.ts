// Copied from web/src/lib/turn-usage.ts so the video's live counters format numbers exactly
// like the app's usage popover ("$0.017 / $0.03", "254k / 300k", amber at ≥ 80%).

/** "$0.0031" under a cent, "$0.25" / "$0.263" under a dollar, "$5.00" above. */
export function formatUsd(value: number): string {
  const usd = Math.max(0, value);
  if (usd === 0) return "$0.00";
  if (usd < 0.01) return `$${usd.toFixed(4)}`;
  if (usd < 1) {
    const three = usd.toFixed(3);
    return `$${three.endsWith("0") ? three.slice(0, -1) : three}`;
  }
  return `$${usd.toFixed(2)}`;
}

const trim = (value: number, digits: number) => value.toFixed(digits).replace(/\.?0+$/, "");

/** 950 → "950", 1500 → "1.5k", 36_400 → "36k", 300_000 → "300k", 1_250_000 → "1.25M". */
export function formatTokens(value: number): string {
  const tokens = Math.max(0, Math.round(value));
  if (tokens < 1000) return String(tokens);
  if (tokens < 10_000) return `${trim(tokens / 1000, 1)}k`;
  if (tokens < 1_000_000) return `${Math.round(tokens / 1000)}k`;
  return `${trim(tokens / 1_000_000, 2)}M`;
}

/** Bar colour level: ≥ 80% of the cap → amber ("warn"), as in the app. */
export const isWarn = (used: number, cap: number) => cap > 0 && used / cap >= 0.8;
