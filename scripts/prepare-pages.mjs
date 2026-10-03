import { rm } from "node:fs/promises";
import { build } from "esbuild";

await build({
  entryPoints: ["dist/server/index.js"],
  bundle: true,
  format: "esm",
  platform: "neutral",
  external: ["node:*", "cloudflare:*"],
  outfile: "dist/client/_worker.js",
});

await rm(".wrangler/deploy/config.json", { force: true });
