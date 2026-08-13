import fs from "node:fs";

// Keep the deployment output directory available before vinext starts.
// The official Worker source entry remains vinext/server/fetch-handler; vinext
// replaces this temporary file with the complete Worker bundle during build.
fs.mkdirSync("dist/server", { recursive: true });
if (!fs.existsSync("dist/server/index.js")) {
  fs.writeFileSync(
    "dist/server/index.js",
    "export default { fetch() { return new Response('Build in progress', { status: 503 }); } };\n",
  );
}
