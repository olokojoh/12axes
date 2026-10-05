import { Miniflare } from "miniflare";
import { readFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve, extname } from "node:path";
import { build } from "esbuild";

export const testSecret = "synthetic-test-encryption-secret-only";
export async function createRuntime(options = {}) {
  const root = fileURLToPath(new URL("../", import.meta.url));
  await mkdir(root + "output/tests", { recursive: true });
  const output = root + "output/tests/runtime-" + process.pid + "-" + crypto.randomUUID() + ".mjs";
  await build({ stdin: { contents: `import worker from "./dist/client/_worker.js";
    export default { async fetch(request, env, ctx) {
      const path = new URL(request.url).pathname;
      if (path.startsWith("/assets/") || path.startsWith("/data/") || path === "/favicon.png") return env.ASSETS.fetch(request);
      if (new URL(request.url).pathname === "/__test/sql") {
        const {query, values, method} = await request.json();
        const statement = env.DB.prepare(query).bind(...values);
        return Response.json(await statement[method]());
      }
      return worker.fetch(request, env, ctx);
    }, async queue(batch) { batch.ackAll(); }};`, resolveDir: root }, bundle: true, platform: "neutral", format: "esm", external: ["node:*", "cloudflare:*"], outfile: output });
  const mf = new Miniflare({
    modules: true, scriptPath: output,
    compatibilityDate: "2026-05-15", compatibilityFlags: ["nodejs_compat"],
    d1Databases: ["DB"],
    bindings: { REPORT_ENCRYPTION_KEY: testSecret, STRIPE_WEBHOOK_SECRET: "whsec_test_fixture", RESEND_API_KEY: "synthetic-not-a-real-key", ...options.bindings },
    outboundService: options.outboundService,
    queueProducers: { REPORT_EMAIL_QUEUE: "test-report-email" },
    queueConsumers: { "test-report-email": { maxBatchTimeout: 0 } },
    serviceBindings: { ASSETS: async (request) => {
      const path = resolve(root + "dist/client", "." + new URL(request.url).pathname);
      if (!path.startsWith(root + "dist/client/") || path.endsWith("_worker.js")) return new Response("Not found", { status: 404 });
      try {
        const content = await readFile(path);
        const type = { ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon" }[extname(path)] ?? "application/octet-stream";
        return new Response(content, { headers: { "content-type": type } });
      } catch { return new Response("Not found", { status: 404 }); }
    } },
  });
  const url = await mf.ready;
  const request = (path, init = {}) => fetch(new URL(path, url), { ...init, headers: { ...init.headers, "x-forwarded-host": "12axes.test" } });
  const db = { prepare(query) { return { bind(...values) { return Object.fromEntries(["first", "all", "run"].map((method) => [method, async() => {
    const response = await request("/__test/sql", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ query, values, method }) });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  }])); }, run() { return this.bind().run(); } }; } };
  for (const migration of ["0001_billing.sql", "0002_support.sql", "0003_refunds.sql", "0004_report_plus.sql"]) {
    const sql = await readFile(new URL("../migrations/" + migration, import.meta.url), "utf8");
    for (const statement of sql.split(";").filter((part) => part.trim())) await db.prepare(statement).run();
  }
  return { mf, db, request };
}
