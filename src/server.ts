import http from "node:http";
import { readFile } from "node:fs/promises";
import { bot } from "./bot/whatsapp";

const policyPages: Record<string, URL> = {
  "/privacy": new URL("../public/privacy.html", import.meta.url),
  "/data-deletion": new URL("../public/data-deletion.html", import.meta.url),
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

  if (req.method === "GET" && url.pathname === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  if ((req.method === "GET" || req.method === "HEAD") && Object.hasOwn(policyPages, url.pathname)) {
    try {
      const page = await readFile(policyPages[url.pathname]);
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(req.method === "HEAD" ? undefined : page);
    } catch {
      res.writeHead(500).end("Page unavailable");
    }
    return;
  }

  // Meta webhook endpoint
  if (url.pathname === "/api/webhooks/whatsapp") {
    try {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(chunk);

      const webReq = new Request(url, {
        method: req.method,
        headers: req.headers as any,
        body: req.method === "POST" ? Buffer.concat(chunks) : undefined,
      });

      const response = await bot.webhooks.whatsapp(webReq);
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(await response.text());
    } catch (error: unknown) {
      console.error("WhatsApp webhook failed", error);
      if (!res.headersSent) res.writeHead(500);
      res.end("Webhook failed");
    }
    return;
  }

  res.writeHead(404).end();
});

const PORT = Number(process.env.PORT) || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
