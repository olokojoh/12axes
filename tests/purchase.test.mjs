import assert from "node:assert/strict";
import test, { before, after } from "node:test";
import { build } from "esbuild";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { createRuntime, testSecret } from "./runtime.mjs";

let runtime, helpers;
before(async () => {
  runtime = await createRuntime({ bindings: { PUBLIC_BASE_URL: "https://12axes.net" } });
  const output = new URL(`../output/tests/purchase-crypto-${process.pid}.mjs`, import.meta.url);
  await build({ entryPoints: ["app/lib/secure-payload.ts"], bundle: true, platform: "node", format: "esm", outfile: fileURLToPath(output) });
  helpers = await import(output.href);
});
after(async () => { await runtime?.mf.dispose(); });

async function order({ status = "paid", amount = 499, plan = "basic", parent = null, dependency = null, live = true } = {}) {
  const id = randomUUID(), token = helpers.randomToken();
  await runtime.db.prepare(`INSERT INTO orders (id, checkout_session_id, token_hash, token_payload, status, payload, locale, variant, quiz_length, created_at, updated_at, amount_total, currency, plan, parent_order_id, dependency_order_id)
    VALUES (?, ?, ?, ?, ?, ?, 'pt', 'baseline', 36, 1, 1, ?, 'usd', ?, ?, ?)`)
    .bind(id, (live ? "cs_live_" : "cs_test_") + id, await helpers.hashToken(token), await helpers.encryptPayload({ token }, testSecret), status, "encrypted-political-results-must-not-leave", amount, plan, parent, dependency).run();
  return { id, token };
}
const claim = (item, extra = {}) => runtime.request("/api/purchase", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token: item.token, orderId: item.id, consent: true, ...extra }) });

test("a live payment produces one receipt across concurrent attempts and reopening", async () => {
  const item = await order();
  const responses = await Promise.all([claim(item), claim(item)]);
  assert.deepEqual(responses.map(r => r.status).sort(), [200, 204]);
  const success = responses.find(r => r.status === 200);
  assert.equal(success.headers.get("cache-control"), "no-store");
  assert.deepEqual(await success.json(), { transaction_id: item.id, value: 4.99, currency: "USD", plan: "basic" });
  assert.equal((await claim(item)).status, 204);
});

test("consent, payment state, environment and report ownership are enforced", async () => {
  const paid = await order(), other = await order();
  assert.equal((await claim(paid, { consent: false })).status, 400);
  assert.equal((await claim(paid, { token: other.token })).status, 204);
  for (const status of ["pending", "failed", "revoked"]) assert.equal((await claim(await order({ status }))).status, 204);
  assert.equal((await claim(await order({ live: false }))).status, 204);
  const preview = await order();
  await runtime.db.prepare("UPDATE orders SET delivery_base_url = ? WHERE id = ?").bind("https://dev.12axes-1dg.pages.dev", preview.id).run();
  assert.equal((await claim(preview)).status, 204);
  assert.equal((await claim(paid)).status, 200);
});

test("upgrade receipts use the extra payment, including access through a previous upgrade", async () => {
  const basic = await order();
  const plus = await order({ amount: 500, plan: "plus", parent: basic.id, dependency: basic.id });
  assert.deepEqual(await (await claim(plus, { token: basic.token })).json(), { transaction_id: plus.id, value: 5, currency: "USD", plan: "plus" });
  const deep = await order({ amount: 500, plan: "deep", parent: basic.id, dependency: plus.id });
  assert.equal((await (await claim(deep, { token: plus.token })).json()).value, 5);
  const directDeep = await order({ amount: 1499, plan: "deep" });
  assert.equal((await (await claim(directDeep)).json()).value, 14.99);
});

test("a refunded parent cannot produce an upgrade conversion", async () => {
  const basic = await order({ status: "revoked" });
  const plus = await order({ amount: 500, plan: "plus", parent: basic.id, dependency: basic.id });
  assert.equal((await claim(plus)).status, 204);
});
