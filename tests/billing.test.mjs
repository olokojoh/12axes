import assert from "node:assert/strict";
import test, { before, after } from "node:test";
import { build } from "esbuild";
import { createHmac, randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { createRuntime, testSecret } from "./runtime.mjs";

let runtime, cryptoHelpers, stripe, emailWorker;
before(async () => {
  runtime = await createRuntime();
  for (const [name, entry] of [["crypto", "app/lib/secure-payload.ts"], ["stripe", "app/lib/stripe-events.ts"], ["email", "worker/report-email.ts"]]) {
    const output = new URL(`../output/tests/${name}-${process.pid}.mjs`, import.meta.url);
    await build({ entryPoints: [entry], bundle: true, platform: "node", format: "esm", outfile: fileURLToPath(output) });
    const loaded = await import(output.href);
    if (name === "crypto") cryptoHelpers = loaded;
    if (name === "stripe") stripe = loaded;
    if (name === "email") emailWorker = loaded.default;
  }
});
after(async () => { await runtime?.mf.dispose(); });

const result = { axes: Array.from({ length: 12 }, (_, i) => 20 + i * 5), locale: "pt", quizLength: 60, variant: "baseline" };
const post = (path, body, headers = {}) => runtime.request(path, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) });
const getOrder = (id) => runtime.db.prepare("SELECT * FROM orders WHERE id = ?").bind(id).first();
async function order(status = "pending") {
  const id = randomUUID(), token = cryptoHelpers.randomToken();
  const payload = await cryptoHelpers.encryptPayload({ axes: result.axes, result: { synthetic: true }, quizLength: 60 }, testSecret);
  const encryptedToken = await cryptoHelpers.encryptPayload({ token }, testSecret);
  const now = Math.floor(Date.now() / 1000);
  await runtime.db.prepare("INSERT INTO orders (id, checkout_session_id, token_hash, token_payload, status, payload, locale, variant, quiz_length, created_at, updated_at, customer_email) VALUES (?, ?, ?, ?, ?, ?, 'pt', 'baseline', 60, ?, ?, ?)")
    .bind(id, "cs_" + id, await cryptoHelpers.hashToken(token), encryptedToken, status, payload, now, now, id + "@example.test").run();
  return { id, token };
}
function paidEvent(id, type = "checkout.session.completed") {
  return { id: "evt_" + randomUUID(), type, data: { object: { id: "cs_" + id, metadata: { order_id: id }, payment_intent: "pi_" + id, payment_status: "paid", amount_total: 499, currency: "usd" } } };
}
function refundEvent(id, amount = 499, withMetadata = true) {
  return { id: "evt_" + randomUUID(), type: "charge.refunded", data: { object: { id: "ch_" + id, payment_intent: "pi_" + id, metadata: withMetadata ? { order_id: id } : {}, amount: 499, amount_refunded: amount, refunded: amount === 499 } } };
}
function signature(body, time = Math.floor(Date.now() / 1000)) {
  return `t=${time},v1=${createHmac("sha256", "whsec_test_fixture").update(time + "." + body).digest("hex")}`;
}

test("encrypted results use random IVs and reject tampering or the wrong key", async () => {
  const a = await cryptoHelpers.encryptPayload(result, testSecret);
  const b = await cryptoHelpers.encryptPayload(result, testSecret);
  assert.notEqual(a, b);
  assert.deepEqual(await cryptoHelpers.decryptPayload(a, testSecret), result);
  await assert.rejects(cryptoHelpers.decryptPayload(a, "wrong-key"));
  const parts = a.split(".");
  parts[1] = (parts[1][0] === "A" ? "B" : "A") + parts[1].slice(1);
  await assert.rejects(cryptoHelpers.decryptPayload(parts.join("."), testSecret));
});

test("sharing requires consent and expires; stored payload and URLs do not reveal scores", async () => {
  assert.equal((await post("/api/share", result)).status, 400);
  assert.equal((await post("/api/share", { ...result, consent: "yes" })).status, 400);
  assert.equal((await post("/api/share", { ...result, axes: [1], consent: true })).status, 400);
  const response = await post("/api/share", { ...result, consent: true });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const { id } = await response.json();
  assert.match(id, /^[A-Za-z0-9_-]{43}$/);
  const saved = await runtime.db.prepare("SELECT * FROM shared_results WHERE id = ?").bind(id).first();
  assert.ok(!saved.payload.includes('"axes"'));
  assert.equal(saved.expires_at - saved.created_at, 365 * 86400);
  assert.deepEqual((await (await runtime.request("/api/share?id=" + id)).json()).axes, result.axes);
  await runtime.db.prepare("UPDATE shared_results SET expires_at = 1 WHERE id = ?").bind(id).run();
  assert.equal((await runtime.request("/api/share?id=" + id)).status, 404);
});

test("report credentials grant access only to paid orders", async () => {
  const item = await order();
  assert.equal((await post("/api/report", { token: item.token })).status, 202);
  assert.equal((await post("/api/report", { token: "made-up" })).status, 404);
  await runtime.db.prepare("UPDATE orders SET status = 'paid' WHERE id = ?").bind(item.id).run();
  const response = await post("/api/report", { token: item.token });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("referrer-policy"), "no-referrer");
  assert.deepEqual((await response.json()).axes, result.axes);
  await runtime.db.prepare("UPDATE orders SET status = 'revoked' WHERE id = ?").bind(item.id).run();
  assert.equal((await post("/api/report", { token: item.token })).status, 404);
});

test("cancelled checkout restores free scores without granting paid report access", async () => {
  const item = await order();
  const response = await post("/api/report", { token: item.token, preview: true });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "preview", axes: result.axes, quizLength: 60 });
  assert.equal((await post("/api/report", { token: item.token })).status, 202);
  await runtime.db.prepare("UPDATE orders SET status = 'revoked' WHERE id = ?").bind(item.id).run();
  assert.equal((await post("/api/report", { token: item.token, preview: true })).status, 404);
});

test("webhook verifies signature and freshness before changing an order", async () => {
  const item = await order(), event = paidEvent(item.id), body = JSON.stringify(event);
  assert.equal((await post("/api/stripe/webhook", event, { "stripe-signature": "bad" })).status, 400);
  assert.equal((await post("/api/stripe/webhook", event, { "stripe-signature": signature(body, 1) })).status, 400);
  assert.equal((await getOrder(item.id)).status, "pending");
  assert.equal((await post("/api/stripe/webhook", event, { "stripe-signature": signature(body) })).status, 200);
  assert.equal((await getOrder(item.id)).status, "paid");
  assert.equal(await stripe.verifyStripeSignature(body + " ", signature(body), "whsec_test_fixture"), false);
});

test("unpaid completion and unrelated success events cannot fulfill a report", async () => {
  const item = await order();
  const event = paidEvent(item.id);
  event.data.object.payment_status = "unpaid";
  const jobs = [], queue = { send: async (job) => jobs.push(job) };
  await stripe.processStripeEvent(event, runtime.db, queue);
  await stripe.processStripeEvent(paidEvent(item.id, "payment_intent.succeeded"), runtime.db, queue);
  const wrongSession = paidEvent(item.id);
  wrongSession.data.object.id = "cs_other";
  await stripe.processStripeEvent(wrongSession, runtime.db, queue);
  assert.equal((await getOrder(item.id)).status, "pending");
  assert.equal(jobs.length, 0);
});

test("duplicate and different success events use one order-level email identity", async () => {
  const item = await order(), event = paidEvent(item.id);
  const jobs = [], queue = { send: async (job) => jobs.push(job) };
  await stripe.processStripeEvent(event, runtime.db, queue);
  await stripe.processStripeEvent(event, runtime.db, queue);
  await stripe.processStripeEvent(paidEvent(item.id, "checkout.session.async_payment_succeeded"), runtime.db, queue);
  assert.equal(jobs.length, 2);
  assert.deepEqual(jobs[0], jobs[1]);
  assert.equal(jobs[0].deliveryId, "paid/" + item.id);
  assert.equal((await getOrder(item.id)).status, "paid");
});

test("queue failure leaves webhook retryable after an order is marked paid", async () => {
  const item = await order(), event = paidEvent(item.id);
  await assert.rejects(stripe.processStripeEvent(event, runtime.db, { send: async () => { throw new Error("queue unavailable"); } }));
  assert.equal(await runtime.db.prepare("SELECT event_id FROM webhook_events WHERE event_id = ?").bind(event.id).first(), null);
  const jobs = [];
  await stripe.processStripeEvent(event, runtime.db, { send: async (job) => jobs.push(job) });
  assert.equal(jobs.length, 1);
});

test("partial refund preserves access; full refund revokes and cannot be undone by late success", async () => {
  const item = await order(), queue = { send: async () => {} };
  await stripe.processStripeEvent(paidEvent(item.id), runtime.db, queue);
  await stripe.processStripeEvent(refundEvent(item.id, 100), runtime.db, queue);
  assert.equal((await getOrder(item.id)).status, "paid");
  await stripe.processStripeEvent(refundEvent(item.id), runtime.db, queue);
  await stripe.processStripeEvent(paidEvent(item.id), runtime.db, queue);
  const saved = await getOrder(item.id);
  assert.equal(saved.status, "revoked");
  assert.equal(saved.refunded_amount, 499);
  assert.equal((await post("/api/report", { token: item.token })).status, 404);
});

test("refund before payment, including without order metadata, is remembered", async () => {
  for (const amount of [100, 499]) {
    const item = await order(), queue = { send: async () => {} };
    await stripe.processStripeEvent(refundEvent(item.id, amount, false), runtime.db, queue);
    await stripe.processStripeEvent(paidEvent(item.id), runtime.db, queue);
    const saved = await getOrder(item.id);
    assert.equal(saved.status, amount === 499 ? "revoked" : "paid");
    assert.equal(saved.refunded_amount, amount);
  }
});

test("email retries delivery failures, suppresses duplicates and skips revoked orders", async () => {
  const item = await order("paid");
  const env = { DB: runtime.db, REPORT_ENCRYPTION_KEY: testSecret, RESEND_API_KEY: "synthetic-key", REPORT_FROM_EMAIL: "test@example.test", PUBLIC_BASE_URL: "https://12axes.test" };
  const requests = [];
  const originalFetch = globalThis.fetch;
  let fail = true;
  globalThis.fetch = async (url, init) => {
    if (url === "https://api.resend.com/emails") {
      requests.push(init);
      return new Response("{}", { status: fail ? 503 : 200 });
    }
    return originalFetch(url, init);
  };
  let acks = 0, retries = 0;
  const job = { body: { orderId: item.id, deliveryId: "paid/" + item.id }, ack: () => acks++, retry: () => retries++ };
  try {
    await emailWorker.queue({ messages: [job] }, env);
    assert.equal(retries, 1);
    assert.equal((await getOrder(item.id)).email_sent_at, null);
    fail = false;
    await emailWorker.queue({ messages: [job] }, env);
    await emailWorker.queue({ messages: [job] }, env);
    assert.equal(requests.length, 2);
    assert.equal(acks, 2);
    assert.equal(requests[0].headers["idempotency-key"], requests[1].headers["idempotency-key"]);
    const body = JSON.parse(requests[1].body);
    assert.match(body.text, /#report=/);
    assert.doesNotMatch(body.text, /"axes"|score|ideologyId/);
    await runtime.db.prepare("UPDATE orders SET status = 'revoked' WHERE id = ?").bind(item.id).run();
    await emailWorker.queue({ messages: [{ ...job, body: { orderId: item.id, deliveryId: "recover/" + item.id } }] }, env);
    assert.equal(requests.length, 2);
  } finally { globalThis.fetch = originalFetch; }
});

test("recovery responses do not enumerate buyers and repeated requests are throttled", async () => {
  const item = await order("paid"), email = item.id + "@example.test";
  assert.equal((await post("/api/report/recover", { email: "invalid" })).status, 400);
  const known = await (await post("/api/report/recover", { email })).json();
  const unknown = await (await post("/api/report/recover", { email: "nobody@example.test" })).json();
  assert.deepEqual(known, unknown);
  const first = await runtime.db.prepare("SELECT requested_at FROM recovery_requests WHERE email_hash = ?").bind(await cryptoHelpers.hashToken(email)).first();
  await post("/api/report/recover", { email });
  const next = await runtime.db.prepare("SELECT requested_at FROM recovery_requests WHERE email_hash = ?").bind(await cryptoHelpers.hashToken(email)).first();
  assert.deepEqual(first, next);
});

test("checkout fails closed without configured payment", async () => {
  assert.equal((await post("/api/checkout", result)).status, 400);
  assert.equal((await post("/api/checkout", { ...result, consent: "yes" })).status, 400);
  assert.equal((await post("/api/checkout", { ...result, consent: true })).status, 503);
});

test("local matching returns complete localized results and validates inputs", async () => {
  assert.equal((await post("/api/match", { axes: [50] })).status, 400);
  assert.equal((await post("/api/match", { axes: result.axes, locale: "unknown" })).status, 400);
  for (const locale of ["en", "pt", "es", "ru", "zh"]) {
    const response = await post("/api/match", { axes: result.axes, locale });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    const matched = await response.json();
    assert.equal(matched.axes.length, 12);
    assert.equal(matched.matches.length, 10);
    assert.deepEqual(matched.topMatch, matched.matches[0]);
    assert.ok(matched.topCountryMatch.name);
    assert.ok(matched.topPersonalityMatch.name);
    assert.deepEqual(matched.axes.map((axis) => axis.leftPercent), result.axes);
    assert.ok(matched.matches.every((item, i, all) => item.compatibility >= 0 && item.compatibility <= 100 && (!i || item.compatibility <= all[i - 1].compatibility)));
  }
});

test("delivery and recovery emails use each order's saved origin and language", async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (url, init) => {
    if (url === "https://api.resend.com/emails") { requests.push(JSON.parse(init.body)); return new Response("{}", { status: 200 }); }
    return originalFetch(url, init);
  };
  try {
    for (const locale of ["en", "pt", "es", "ru", "zh"]) {
      const item = await order("paid");
      await runtime.db.prepare("UPDATE orders SET locale = ?, delivery_base_url = 'https://dev.12axes.test' WHERE id = ?").bind(locale, item.id).run();
      const env = { DB: runtime.db, REPORT_ENCRYPTION_KEY: testSecret, RESEND_API_KEY: "synthetic", REPORT_FROM_EMAIL: "report@example.test", PUBLIC_BASE_URL: "https://production.12axes.test" };
      for (const kind of ["paid", "recover"]) {
        await emailWorker.queue({ messages: [{ body: { orderId: item.id, deliveryId: kind + "/" + item.id }, ack() {}, retry() { assert.fail("Email should not retry"); } }] }, env);
        const mail = requests.at(-1);
        assert.ok(mail.text.includes("https://dev.12axes.test" + (locale === "en" ? "" : "/" + locale) + "/results?paid=1#report=" + item.token));
        assert.ok(!mail.text.includes("production.12axes.test"));
      }
    }
    assert.equal(requests.length, 10);
  } finally { globalThis.fetch = originalFetch; }
});


test("legacy basic orders retain their complete report and production delivery origin", async () => {
  const item = await order("paid");
  const saved = await getOrder(item.id);
  assert.equal(saved.plan, "basic"); assert.equal(saved.expected_amount, 499);
  assert.equal(saved.delivery_base_url, "https://12axes.net");
  const report = await (await post("/api/report", { token: item.token })).json();
  assert.equal(report.plan, "basic"); assert.equal(report.result.matches.length, 10);
  assert.equal(report.result.axes.length, 12); assert.equal(report.plus, null);
});

test("upgrade delivery uses the original lasting link and stops if the original order is revoked", async () => {
  const parent = await order("paid"), child = await order("paid");
  await runtime.db.prepare("UPDATE orders SET parent_order_id = ?, plan = 'plus' WHERE id = ?").bind(parent.id, child.id).run();
  const originalFetch = globalThis.fetch, sent = [];
  globalThis.fetch = async (url, init) => {
    if (url === "https://api.resend.com/emails") { sent.push(JSON.parse(init.body)); return new Response("{}", { status: 200 }); }
    return originalFetch(url, init);
  };
  const env = { DB: runtime.db, REPORT_ENCRYPTION_KEY: testSecret, RESEND_API_KEY: "synthetic", REPORT_FROM_EMAIL: "report@example.test" };
  const job = (kind) => ({ body: { orderId: child.id, deliveryId: kind + "/" + child.id }, ack() {}, retry() { assert.fail("Unexpected retry"); } });
  try {
    await emailWorker.queue({ messages: [job("paid")] }, env);
    assert.equal(sent.length, 1); assert.ok(sent[0].text.includes("#report=" + parent.token));
    assert.ok(!sent[0].text.includes(child.token));
    await runtime.db.prepare("UPDATE orders SET status = 'revoked' WHERE id = ?").bind(parent.id).run();
    await emailWorker.queue({ messages: [job("recover")] }, env);
    assert.equal(sent.length, 1);
  } finally { globalThis.fetch = originalFetch; }
});
