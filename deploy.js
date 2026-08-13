import { spawnSync } from "node:child_process";
import fs from "node:fs";

const generatedConfigPath = ".wrangler/deploy/config.json";
const generatedWorkerPath = "dist/server/index.js";

if (!fs.existsSync(generatedConfigPath) || !fs.existsSync(generatedWorkerPath)) {
  console.error("尚未找到完整的 Cloudflare 建置檔，請先執行 npm run build。");
  process.exit(1);
}

const workerSource = fs.readFileSync(generatedWorkerPath, "utf8");
if (workerSource.includes("Build in progress")) {
  console.error("目前只有暫時占位檔，已停止部署以避免網站變成空白。請重新執行 npm run build。");
  process.exit(1);
}

const wranglerCli = "node_modules/wrangler/bin/wrangler.js";
const deployEnvironment = { ...process.env };
if (!deployEnvironment.WRANGLER_LOG_PATH) {
  deployEnvironment.WRANGLER_LOG_PATH = ".wrangler/wrangler.log";
}

const result = spawnSync(process.execPath, [wranglerCli, "deploy", ...process.argv.slice(2)], {
  stdio: "inherit",
  env: deployEnvironment,
});

if (result.error) throw result.error;
process.exit(result.status ?? 1);
