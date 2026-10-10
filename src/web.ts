import type http from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

type NodeHandler = (req: http.IncomingMessage, res: http.ServerResponse) => void;

const webRoot = fileURLToPath(new URL("../web/", import.meta.url));
const distRoot = path.join(webRoot, "dist");

const contentTypes: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".txt": "text/plain; charset=utf-8",
};

// The subset of Vite's dev server used here. Vite is owned by web/ (one version, no root dep),
// so it is loaded from web/node_modules at runtime instead of being imported at the type level.
type ViteDevServer = {
  middlewares: (req: http.IncomingMessage, res: http.ServerResponse, next: (error?: unknown) => void) => void;
  close(): Promise<void>;
};
type ViteModule = {
  createServer(config: Record<string, unknown>): Promise<ViteDevServer>;
};

/** Dev: Vite in middleware mode (HMR over the app's own HTTP server). Prod: static web/dist. */
export async function createWebHandler(server: http.Server): Promise<NodeHandler> {
  if (process.env.NODE_ENV === "production") return serveDist;

  const requireFromWeb = createRequire(path.join(webRoot, "package.json"));
  const vite = (await import(pathToFileURL(requireFromWeb.resolve("vite")).href)) as ViteModule;
  const devServer = await vite.createServer({
    root: webRoot,
    configFile: path.join(webRoot, "vite.config.ts"),
    appType: "spa",
    // HMR websocket rides on the app's own HTTP server (one port).
    server: { middlewareMode: true, ws: { server } },
  });
  server.on("close", () => void devServer.close());
  return (req, res) => {
    devServer.middlewares(req, res, (error) => {
      if (error) console.error("Vite middleware failed", error);
      if (!res.headersSent) res.writeHead(error ? 500 : 404);
      res.end();
    });
  };
}

const serveDist: NodeHandler = async (req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { allow: "GET, HEAD" }).end();
    return;
  }
  const url = new URL(req.url ?? "/", "http://localhost");
  let pathname: string;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    res.writeHead(400).end();
    return;
  }
  const filePath = path.resolve(distRoot, `.${pathname}`);
  // Reject anything that escapes web/dist (e.g. encoded "../").
  if (filePath !== distRoot && !filePath.startsWith(distRoot + path.sep)) {
    res.writeHead(404).end();
    return;
  }

  const file = (await isFile(filePath)) ? filePath : path.join(distRoot, "index.html");
  if (file !== filePath && path.extname(pathname)) {
    // A missing asset is a 404, not the SPA shell.
    res.writeHead(404).end();
    return;
  }
  if (!(await isFile(file))) {
    res.writeHead(503, { "content-type": "text/plain; charset=utf-8" });
    res.end("Web UI is not built. Run `npm run web:build`.");
    return;
  }

  const hashedAsset = file.startsWith(path.join(distRoot, "assets") + path.sep);
  res.writeHead(200, {
    "content-type": contentTypes[path.extname(file)] ?? "application/octet-stream",
    "cache-control": hashedAsset ? "public, max-age=31536000, immutable" : "no-cache",
  });
  if (req.method === "HEAD") {
    res.end();
    return;
  }
  createReadStream(file).pipe(res);
};

async function isFile(filePath: string): Promise<boolean> {
  try {
    return (await stat(filePath)).isFile();
  } catch {
    return false;
  }
}
