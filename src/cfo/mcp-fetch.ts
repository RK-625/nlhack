/** Resolve credentials at request time, including calls resumed after a long approval pause. */
export function createCfoMcpFetch(
  getToken: () => Promise<string | null>,
  send: typeof fetch = globalThis.fetch,
): typeof fetch {
  return async (input, init) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    if (url.protocol !== "https:" || url.hostname !== "api.cfo.ai") {
      throw new Error("Refusing to send cfo.ai credentials to another host.");
    }
    const token = await getToken();
    if (!token) throw new Error("cfo.ai connection expired or unavailable. Reconnect your account and try again.");
    const headers = new Headers(input instanceof Request ? input.headers : undefined);
    new Headers(init?.headers).forEach((value, name) => headers.set(name, value));
    headers.set("Authorization", `Bearer ${token}`);
    return send(input, { ...init, headers });
  };
}
