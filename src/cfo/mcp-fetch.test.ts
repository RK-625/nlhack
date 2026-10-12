import assert from "node:assert/strict";
import test from "node:test";
import { createCfoMcpFetch } from "./mcp-fetch";

test("a retained MCP transport uses refreshed credentials on the next call", async () => {
  let token: string | null = "old-token";
  const sent: string[] = [];
  const transport = createCfoMcpFetch(async () => token, async (_input, init) => {
    sent.push(new Headers(init?.headers).get("Authorization")!);
    assert.equal(new Headers(init?.headers).get("mcp-session-id"), "session");
    return new Response("{}", { status: 200 });
  });
  const init = { headers: { Authorization: "Bearer stale", "mcp-session-id": "session" } };
  await transport("https://api.cfo.ai/mcp", init);
  token = "refreshed-token";
  await transport("https://api.cfo.ai/mcp", init);
  assert.deepEqual(sent, ["Bearer old-token", "Bearer refreshed-token"]);
  assert.equal(init.headers.Authorization, "Bearer stale");
});

test("never sends when credentials are unavailable or the destination is wrong", async () => {
  let sends = 0;
  const transport = createCfoMcpFetch(async () => null, async () => { sends++; return new Response(); });
  await assert.rejects(transport("https://api.cfo.ai/mcp"), /Reconnect/);
  await assert.rejects(transport("https://example.com/mcp"), /another host/);
  await assert.rejects(transport("http://api.cfo.ai/mcp"), /another host/);
  assert.equal(sends, 0);
});
