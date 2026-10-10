import { createTool } from "@mastra/core/tools";
import { z } from "zod";

// Docs: https://docs.crustdata.com (API version 2025-11-01).
// Auth: `Authorization: Bearer <key>` (docs show Bearer, not Token) + `x-api-version` header.
const BASE_URL = "https://api.crustdata.com";
const API_VERSION = "2025-11-01";

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

const ENRICH_SECTIONS = [
  "basic_info", "revenue", "headcount", "funding", "hiring", "locations", "taxonomy",
  "people", "competitors", "web_traffic", "news", "market_intel",
] as const;

export const crustdataCompanyEnrich = createTool({
  id: "crustdata-company-enrich",
  description:
    "Get a detailed company profile from Crustdata by website domain or company name: description, headcount, funding, revenue, hiring, key people, competitors, web traffic, news. 2 credits per company; rate limit 15 req/min.",
  inputSchema: z.object({
    domain: z.string().optional().describe("Company website domain, e.g. retool.com (preferred)"),
    name: z.string().optional().describe("Company name, used if no domain is known"),
    fields: z
      .array(z.enum(ENRICH_SECTIONS))
      .default(["basic_info", "headcount", "funding", "competitors", "people"])
      .describe("Profile sections to return"),
  }),
  outputSchema: z.object({ results: z.array(z.any()) }),
  execute: async ({ domain, name, fields }) => {
    if (!domain && !name) throw new Error("Provide either domain or name");
    const data = await crustdata("/company/enrich", {
      ...(domain ? { domains: [domain], exact_match: true } : { names: [name] }),
      fields,
    });
    // Response is a top-level array: [{ matched_on, match_type, matches: [{ confidence_score, company_data }] }]
    const results = (Array.isArray(data) ? data : []).flatMap((entry: any) =>
      (entry.matches ?? []).slice(0, 2).map((m: any) => ({ confidence: m.confidence_score, ...m.company_data })),
    );
    return { results };
  },
});

export const crustdataCompanySearch = createTool({
  id: "crustdata-company-search",
  description:
    "Find companies in a market from Crustdata using a natural-language query (e.g. 'AI code review tools'), optionally restricted to a country. Use it to discover competitors; then enrich the interesting ones.",
  inputSchema: z.object({
    query: z.string().describe("Natural-language description of the companies to find"),
    country: z.string().optional().describe("Country filter value as in Crustdata, e.g. USA"),
    limit: z.number().int().min(1).max(25).default(10),
  }),
  outputSchema: z.object({ companies: z.array(z.any()) }),
  execute: async ({ query, country, limit }) => {
    const data = await crustdata("/company/search", {
      search: { query, mode: "hybrid" },
      ...(country ? { filters: { field: "locations.country", type: "=", value: country } } : {}),
      fields: [
        "basic_info.name", "basic_info.primary_domain", "basic_info.description",
        "basic_info.year_founded", "locations.headquarters", "headcount.total",
      ],
      limit,
    });
    // Response envelope key is not shown in the docs excerpt we read; handle common shapes.
    const rows = data?.companies ?? [];
    return { companies: rows };
  },
});

export const crustdataWebSearch = createTool({
  id: "crustdata-web-search",
  description:
    "Search the live web and news via Crustdata (1 credit/query, 10 req/min). Use for recent news, pricing pages, market trends and analyst coverage. Returns titles, URLs and snippets.",
  inputSchema: z.object({
    query: z.string(),
    sources: z.array(z.enum(["web", "news"])).default(["web", "news"]),
  }),
  outputSchema: z.object({ results: z.array(z.any()) }),
  execute: async ({ query, sources }) => {
    const data = await crustdata("/web/search/live", { query, sources, location: "US" });
    const results = (data?.results ?? []).slice(0, 10).map((r: any) => ({
      source: r.source,
      title: r.title,
      url: r.url,
      snippet: r.snippet,
    }));
    return { results };
  },
});

export const crustdataTools = {
  crustdataCompanyEnrich,
  crustdataCompanySearch,
  crustdataWebSearch,
};
