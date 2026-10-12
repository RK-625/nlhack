// USD prices per 1M tokens, used to estimate the cost of each model step for the per-turn caps.
//
// Source: DeepSeek's official pricing page, https://api-docs.deepseek.com/quick_start/pricing
// (checked 2026-10-12). deepseek-flash (DeepSeek-V4.1-Flash) at PEAK rates:
//   input (cache miss) $0.30, input (cache hit) $0.006, output $1.20.
// Off-peak rates are half of these. For safety the caps always use the peak rates. Input tokens the
// provider reports as cache hits are priced at the cache-hit rate (as DeepSeek and Neatlogs do);
// when a step reports no cached count, every input token is priced at the cache-miss rate.

export type ModelPrice = { inputPerMTok: number; cacheHitPerMTok: number; outputPerMTok: number };

const PRICES: Record<string, ModelPrice> = {
  // The legacy names are served by DeepSeek-V4.1-Flash and billed at the Flash price.
  "deepseek/deepseek-flash": { inputPerMTok: 0.3, cacheHitPerMTok: 0.006, outputPerMTok: 1.2 },
  "deepseek/deepseek-v4-flash": { inputPerMTok: 0.3, cacheHitPerMTok: 0.006, outputPerMTok: 1.2 },
  "deepseek/deepseek-v4-flash-vision-exp": { inputPerMTok: 0.3, cacheHitPerMTok: 0.006, outputPerMTok: 1.2 },
  "deepseek/deepseek-v4-pro": { inputPerMTok: 1.32, cacheHitPerMTok: 0.044, outputPerMTok: 3.96 },
};

/** Deliberately high, so a model missing from the table is over- rather than under-counted. */
export const FALLBACK_PRICE: ModelPrice = { inputPerMTok: 5, cacheHitPerMTok: 5, outputPerMTok: 25 };

const warned = new Set<string>();

/**
 * Price for a model id, either "provider/model" or a bare model id as reported by the provider
 * ("deepseek-flash"). Unknown models get FALLBACK_PRICE and a one-time warning.
 */
export function priceFor(modelId: string | undefined): ModelPrice {
  const id = (modelId ?? "").trim().toLowerCase();
  const exact = PRICES[id];
  if (exact) return exact;
  const bare = id.includes("/") ? id.slice(id.lastIndexOf("/") + 1) : id;
  const match = Object.entries(PRICES).find(([key]) => key.slice(key.lastIndexOf("/") + 1) === bare);
  if (match) return match[1];
  if (!warned.has(id)) {
    warned.add(id);
    console.warn(`[usage] no price for model "${modelId ?? "unknown"}"; using the conservative fallback price.`);
  }
  return FALLBACK_PRICE;
}

/**
 * Estimated USD cost of one model call. `inputTokens` is the total prompt size; `cachedInputTokens`
 * is the part of it served from the provider's cache (0 or omitted when unknown: all input is then
 * priced at the cache-miss rate).
 */
export function estimateCostUsd(
  modelId: string | undefined,
  inputTokens: number,
  outputTokens: number,
  cachedInputTokens = 0,
): number {
  const price = priceFor(modelId);
  const cached = Math.min(Math.max(cachedInputTokens, 0), inputTokens);
  return ((inputTokens - cached) * price.inputPerMTok + cached * price.cacheHitPerMTok + outputTokens * price.outputPerMTok) / 1_000_000;
}
