import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const workspace = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const project = path.join(workspace, "work", "goodie-company-cloudflare-v1");
const clientRoot = path.join(project, "dist", "client");
const worker = (await import(pathToFileURL(path.join(project, "dist", "server", "index.js")).href)).default;
const port = Number(process.argv[2] || 4175);

const mimeTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".woff2", "font/woff2"],
]);

async function fetchAsset(request) {
  const url = new URL(request.url);
  const pathname = decodeURIComponent(url.pathname).replace(/^\/+/, "");
  const resolved = path.resolve(clientRoot, pathname);
  if (!resolved.startsWith(path.resolve(clientRoot) + path.sep)) {
    return new Response("Forbidden", { status: 403 });
  }
  try {
    const contents = await fs.readFile(resolved);
    const contentType = mimeTypes.get(path.extname(resolved).toLowerCase()) || "application/octet-stream";
    return new Response(contents, { status: 200, headers: { "content-type": contentType } });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

const server = http.createServer(async (incoming, outgoing) => {
  try {
    const chunks = [];
    for await (const chunk of incoming) chunks.push(chunk);
    const body = chunks.length ? Buffer.concat(chunks) : undefined;
    const request = new Request(`http://localhost:${port}${incoming.url || "/"}`, {
      method: incoming.method,
      headers: incoming.headers,
      body: incoming.method === "GET" || incoming.method === "HEAD" ? undefined : body,
      duplex: body ? "half" : undefined,
    });
    const response = await worker.fetch(
      request,
      { ASSETS: { fetch: fetchAsset } },
      { waitUntil() {}, passThroughOnException() {} },
    );
    outgoing.statusCode = response.status;
    response.headers.forEach((value, key) => outgoing.setHeader(key, value));
    outgoing.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    console.error(error);
    outgoing.statusCode = 500;
    outgoing.end("Local preview error");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Goodie preview: http://localhost:${port}/`);
});
