import { createTool } from "@mastra/core/tools";
import { z } from "zod";

// Docs: https://docs.crustdata.com (API version 2025-11-01).
// Auth: `Authorization: Bearer <key>` (docs show Bearer, not Token) + `x-api-version` header.
//
// Payload size is capped at the API: every request names exactly the fields it needs
// (Enrich and Search accept dot-path `fields`), Search passes `limit`, and Web Search
// asks for a single results `page`. Enrich has no per-list limit, so list-heavy groups
// (people.decision_makers: 300 full profiles ≈ 4.5 MB for zeptonow.com) are never requested.
const BASE_URL = "https://api.crustdata.com";
const API_VERSION = "2025-11-01";

/**
 * Last resort only: if a response is still larger than this after API-side field
 * selection, return a short error to the model instead of flooding its context.
 */
const MAX_RESULT_BYTES = 150_000;

async function crustdata(path: string, body: unknown): Promise<any> {
  const key = process.env.CRUSTDATA_API_KEY;
  if (!key) throw new Error("CRUSTDATA_API_KEY is not set");

  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
      "x-api-version": API_VERSION,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Crustdata ${path} failed (${res.status}): ${text.slice(0, 500)}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Crustdata ${path} returned non-JSON: ${text.slice(0, 200)}`);
  }
}

/** Last-resort guard (see MAX_RESULT_BYTES); the real cap is the request's field selection. */
function guardSize<T extends object>(tool: string, result: T): T | { error: string } {
  const bytes = Buffer.byteLength(JSON.stringify(result), "utf8");
  if (bytes <= MAX_RESULT_BYTES) return result;
  return {
    error: `${tool} result was ${Math.round(bytes / 1024)} KB, too large to use. Ask for a narrower request (fewer extras, a smaller limit or a more specific query).`,
  };
}

// Enrich `fields` accept section names or dot paths. A dot path returns only that subfield
// populated (siblings come back as null placeholders), which is how each group is narrowed.
// https://docs.crustdata.com/company-docs/enrichment/introduction (subfield warning)
const ENRICH_CORE_FIELDS = [
  "basic_info",
  "locations.headquarters",
  "headcount.total",
  "headcount.growth_percent",
  "headcount.largest_headcount_country",
  "funding.total_investment_usd",
  "funding.last_round_amount_usd",
  "funding.last_round_type",
  "funding.last_fundraise_date",
  "funding.num_funding_rounds",
  "funding.investors",
  "competitors.all_domains",
  "competitors.organic_seo",
];

// Optional extras, each narrowed to the subfields worth reading.
const ENRICH_EXTRAS = {
  people: [
    "people.founders.basic_profile.name",
    "people.founders.basic_profile.current_title",
    "people.cxos.basic_profile.name",
    "people.cxos.basic_profile.current_title",
  ],
  news: ["news.article_title", "news.article_url", "news.article_publish_date"],
  revenue: ["revenue.estimated", "revenue.acquisition_status"],
  hiring: ["hiring.openings_count", "hiring.openings_growth_percent"],
  taxonomy: ["taxonomy.categories", "taxonomy.professional_network_industry"],
} as const;
type EnrichExtra = keyof typeof ENRICH_EXTRAS;

export const crustdataCompanyEnrich = createTool({
  id: "crustdata-company-enrich",
  description:
    "Get a compact company profile from Crustdata by website domain or company name: description, HQ, headcount and growth, funding (total, last round, investors) and competitor domains. Add `extras` only when the task needs them: people (founders/CXO names and titles), news (recent headlines), revenue, hiring, taxonomy. One call per company; 2 credits; rate limit 15 req/min.",
  inputSchema: z.object({
    domain: z.string().optional().describe("Company website domain, e.g. retool.com (preferred)"),
    name: z.string().optional().describe("Company name, used if no domain is known"),
    extras: z
      .array(z.enum(Object.keys(ENRICH_EXTRAS) as [EnrichExtra, ...EnrichExtra[]]))
      .default([])
      .describe("Extra sections to include beyond the core profile"),
  }),
  outputSchema: z.object({ results: z.array(z.any()) }).or(z.object({ error: z.string() })),
  execute: async ({ domain, name, extras }) => {
    if (!domain && !name) throw new Error("Provide either domain or name");
    const fields = [...ENRICH_CORE_FIELDS, ...extras.flatMap((extra) => ENRICH_EXTRAS[extra])];
    const data = await crustdata("/company/enrich", {
      ...(domain ? { domains: [domain], exact_match: true } : { names: [name] }),
      fields,
    });
    // Response is a top-level array: [{ matched_on, match_type, matches: [{ confidence_score, company_data }] }].
    // The API has no match-count parameter; keep the best match (this picks a company, it does not trim data).
    const results = (Array.isArray(data) ? data : []).flatMap((entry: any) =>
      (entry.matches ?? []).slice(0, 1).map((m: any) => ({ confidence: m.confidence_score, ...m.company_data })),
    );
    return guardSize("crustdataCompanyEnrich", { results });
  },
});

export const crustdataCompanySearch = createTool({
  id: "crustdata-company-search",
  description:
    "Find companies in a market from Crustdata using a natural-language query (e.g. 'AI code review tools'), optionally restricted to a country. Returns name, domain, short description, founding year, HQ and headcount. Use it to discover competitors; then enrich only the 2-4 most relevant.",
  inputSchema: z.object({
    query: z.string().describe("Natural-language description of the companies to find"),
    country: z.string().optional().describe("Country filter value as in Crustdata, e.g. USA or IND"),
    limit: z.number().int().min(1).max(25).default(5).describe("Number of companies to return"),
  }),
  outputSchema: z.object({ companies: z.array(z.any()) }).or(z.object({ error: z.string() })),
  execute: async ({ query, country, limit }) => {
    // `limit` and dot-path `fields` are applied by the API (ranked search: limit 1-100).
    // https://docs.crustdata.com/company-docs/search/reference
    const data = await crustdata("/company/search", {
      search: { query, mode: "hybrid" },
      ...(country ? { filters: { field: "locations.country", type: "=", value: country } } : {}),
      fields: [
        "basic_info.name", "basic_info.primary_domain", "basic_info.description",
        "basic_info.year_founded", "locations.headquarters", "headcount.total",
      ],
      limit,
    });
    // Response envelope: { companies: [...], next_cursor, total_count }.
    return guardSize("crustdataCompanySearch", { companies: data?.companies ?? [] });
  },
});

export const crustdataWebSearch = createTool({
  id: "crustdata-web-search",
  description:
    "Search the live web and news via Crustdata (1 credit/query, 10 req/min). Use for recent news, pricing pages, market trends and analyst coverage. Returns titles, URLs and snippets from one results page per source.",
  inputSchema: z.object({
    query: z.string(),
    sources: z.array(z.enum(["web", "news"])).default(["web", "news"]),
  }),
  outputSchema: z.object({ results: z.array(z.any()) }).or(z.object({ error: z.string() })),
  execute: async ({ query, sources }) => {
    // `page: 1` asks the API for a single results page per source; Web Search has no
    // result-count parameter (https://docs.crustdata.com/web-docs/search/reference).
    const data = await crustdata("/web/search/live", { query, sources, location: "US", page: 1 });
    const results = (data?.results ?? []).slice(0, 10).map((r: any) => ({
      source: r.source,
      title: r.title,
      url: r.url,
      snippet: r.snippet,
    }));
    return guardSize("crustdataWebSearch", { results });
  },
});

export const crustdataTools = {
  crustdataCompanyEnrich,
  crustdataCompanySearch,
  crustdataWebSearch,
};
