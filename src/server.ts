import http from "node:http";
import { bot } from "./bot/whatsapp";

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host}`);

  // Meta webhook endpoint
  if (url.pathname === "/api/webhooks/whatsapp") {
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
    return;
  }

  res.writeHead(404).end();
});

const PORT = Number(process.env.PORT) || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
