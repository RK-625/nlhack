// USD prices per 1M tokens, used to estimate the cost of each model step for the per-turn caps.
//
// Source: DeepSeek's official pricing page, https://api-docs.deepseek.com/quick_start/pricing
// (checked 2026-10-12). deepseek-flash (DeepSeek-V4.1-Flash) at PEAK rates:
//   input (cache miss) $0.30, input (cache hit) $0.006, output $1.20.
// Off-peak rates are half of these. For safety the caps always use the peak rates and count every
// input token at the cache-miss rate, so the estimate never under-counts the real bill.

export type ModelPrice = { inputPerMTok: number; outputPerMTok: number };

const PRICES: Record<string, ModelPrice> = {
  // The legacy names are served by DeepSeek-V4.1-Flash and billed at the Flash price.
  "deepseek/deepseek-flash": { inputPerMTok: 0.3, outputPerMTok: 1.2 },
  "deepseek/deepseek-v4-flash": { inputPerMTok: 0.3, outputPerMTok: 1.2 },
  "deepseek/deepseek-v4-flash-vision-exp": { inputPerMTok: 0.3, outputPerMTok: 1.2 },
  "deepseek/deepseek-v4-pro": { inputPerMTok: 1.32, outputPerMTok: 3.96 },
};

/** Deliberately high, so a model missing from the table is over- rather than under-counted. */
export const FALLBACK_PRICE: ModelPrice = { inputPerMTok: 5, outputPerMTok: 25 };

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

/** Estimated USD cost of one model call. */
export function estimateCostUsd(modelId: string | undefined, inputTokens: number, outputTokens: number): number {
  const price = priceFor(modelId);
  return (inputTokens * price.inputPerMTok + outputTokens * price.outputPerMTok) / 1_000_000;
}
