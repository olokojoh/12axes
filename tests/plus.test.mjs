import assert from "node:assert/strict";
import test, { before, after } from "node:test";
import { build } from "esbuild";
import { randomUUID } from "node:crypto";
import { createRuntime } from "./runtime.mjs";

let runtime, stripe, sessions = [], wrongCheckoutAmount = false;
const axes = [20,25,30,35,40,45,50,55,60,65,70,75];
const post = (path, body) => runtime.request(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
before(async () => {
  const bindings = { STRIPE_SECRET_KEY: "sk_test_synthetic", PUBLIC_BASE_URL: "https://dev.12axes-1dg.pages.dev" };
  for (const tier of ["", "PLUS_", "UPGRADE_"]) for (const locale of ["", "_PT", "_ES", "_RU", "_ZH"]) bindings["STRIPE_" + tier + "PRICE_ID" + locale] = "price_" + tier + locale;
  runtime = await createRuntime({ bindings, outboundService: async (request) => {
    assert.ok(request.url.startsWith("https://api.stripe.com/v1/checkout/sessions"));
    if (request.url.endsWith("/expire")) return Response.json({ status: "expired" });
    if (request.method === "GET") return Response.json({ status: "open", url: "https://checkout.stripe.com/test-pending" });
    const params = new URLSearchParams(await request.text());
    const session = { id: "cs_test_" + randomUUID(), url: "https://checkout.stripe.com/test-session", params };
    sessions.push(session);
    return Response.json({ id: session.id, url: session.url, amount_total: wrongCheckoutAmount ? 1 : params.get("line_items[0][price]").includes("UPGRADE") ? 500 : params.get("line_items[0][price]").includes("PLUS") ? 999 : 499, currency: "usd", livemode: false });
  } });
  for (const [key, entry] of [["stripe", "app/lib/stripe-events.ts"]]) {
    const outfile = `output/tests/plus-${key}.mjs`;
    await build({ entryPoints: [entry], bundle: true, platform: "node", format: "esm", outfile });
    const mod = await import(new URL("../" + outfile, import.meta.url));
    stripe = mod;
  }
});
after(async () => { await runtime?.mf.dispose(); });
async function create(plan, locale = "en", upgradeToken) {
  const response = await post("/api/checkout", { axes, locale, quizLength: 36, variant: "baseline", consent: true, plan, ...(upgradeToken ? { upgradeToken } : {}) });
  assert.equal(response.status, 200);
  const session = sessions.at(-1);
  return { session, token: new URLSearchParams(new URL(session.params.get("success_url")).hash.slice(1)).get("report"), id: session.params.get("metadata[order_id]") };
}
async function pay(item, amount = 999, currency = "usd") {
  await stripe.processStripeEvent({ id: "evt_" + randomUUID(), type: "checkout.session.completed", data: { object: { id: item.session.id, payment_intent: "pi_" + item.id, metadata: { order_id: item.id }, payment_status: "paid", amount_total: amount, currency } } }, runtime.db, { send: async () => {} });
}
async function refund(item, amount) {
  await stripe.processStripeEvent({ id: "evt_" + randomUUID(), type: "charge.refunded", data: { object: { id: "ch_" + item.id, payment_intent: "pi_" + item.id, amount, amount_refunded: amount, refunded: true } } }, runtime.db, { send: async () => {} });
}

test("both plans checkout in every language and paid Plus alone exposes extended profiles", async () => {
  for (const locale of ["en", "pt", "es", "ru", "zh"]) {
    for (const plan of ["basic", "plus"]) {
      const item = await create(plan, locale);
      const params = item.session.params;
      const saved = await runtime.db.prepare("SELECT delivery_base_url, expected_amount FROM orders WHERE id = ?").bind(item.id).first();
      assert.equal(saved.delivery_base_url, "https://dev.12axes-1dg.pages.dev");
      assert.equal(saved.expected_amount, plan === "plus" ? 999 : 499);
      assert.equal(params.get("locale"), locale);
      assert.equal(params.get("wallet_options[link][display]"), "never");
      assert.equal(params.get("adaptive_pricing[enabled]"), "false");
      assert.equal(params.get("line_items[0][price]"), "price_" + (plan === "plus" ? "PLUS_" : "") + (locale === "en" ? "" : "_" + locale.toUpperCase()));
      assert.equal((await post("/api/report", { token: item.token })).status, 202);
      await pay(item, plan === "plus" ? 999 : 499);
      const response = await post("/api/report", { token: item.token, locale, plan: "plus" });
      const report = await response.json();
      assert.equal(report.plan, plan);
      assert.equal(report.result.matches.length, 10);
      assert.equal(report.result.axes.length, 12);
      assert.equal(response.headers.get("cache-control"), "no-store");
      if (plan === "basic") assert.equal(report.plus, null);
      else for (const group of ["ideologies", "countries", "personalities"]) {
        assert.equal(report.plus[group].length, 10);
        assert.ok(report.plus[group].every(p => p.axes.length === 12 && p.axes.every((a, i) => a.user === axes[i] && a.difference === Math.round(Math.abs(a.user - a.target) * 10) / 10)));
        if (locale === "zh") assert.match(report.plus[group][0].description, /[\u4e00-\u9fff]/);
        if (locale === "ru") assert.match(report.plus[group][0].description, /[А-Яа-я]/);
      }
    }
  }
});

test("invalid plan, unpaid or environment-mismatched upgrades, and incorrect amounts cannot unlock Plus", async () => {
  assert.equal((await post("/api/checkout", { axes, locale: "en", quizLength: 36, variant: "baseline", consent: true, plan: "fake" })).status, 400);
  const basic = await create("basic");
  assert.equal((await post("/api/checkout", { axes, locale: "en", quizLength: 36, variant: "baseline", consent: true, plan: "plus", upgradeToken: basic.token })).status, 409);
  const plus = await create("plus");
  await assert.rejects(pay(plus, 499));
  await assert.rejects(pay(plus, 999, "brl"));
  assert.equal((await post("/api/report", { token: plus.token })).status, 202);
  await pay(basic, 499);
  await runtime.db.prepare("UPDATE orders SET checkout_session_id = 'cs_live_synthetic' WHERE id = ?").bind(basic.id).run();
  assert.equal((await post("/api/checkout", { axes, locale: "en", quizLength: 36, variant: "baseline", consent: true, plan: "plus", upgradeToken: basic.token })).status, 409);
});

test("five-dollar upgrade uses saved result, reuses pending checkout and preserves basic on upgrade refund", async () => {
  const basic = await create("basic"); await pay(basic, 499);
  const upgrade = await create("plus", "en", basic.token);
  assert.equal(upgrade.token, basic.token);
  assert.equal(upgrade.session.params.get("line_items[0][price]"), "price_UPGRADE_");
  assert.equal((await runtime.db.prepare("SELECT expected_amount FROM orders WHERE id = ?").bind(upgrade.id).first()).expected_amount, 500);
  assert.ok(upgrade.session.params.get("cancel_url").endsWith("#report=" + basic.token));
  const count = sessions.length;
  await create("plus", "en", basic.token);
  assert.equal(sessions.length, count);
  await pay(upgrade, 500);
  assert.equal((await (await post("/api/report", { token: basic.token })).json()).plan, "plus");
  assert.equal((await (await post("/api/report", { token: upgrade.token })).json()).plan, "plus");
  await refund(upgrade, 500);
  assert.equal((await (await post("/api/report", { token: basic.token })).json()).plan, "basic");
  assert.equal((await (await post("/api/report", { token: upgrade.token })).json()).plan, "basic");
  const second = await create("plus", "en", basic.token); await pay(second, 500);
  await refund(basic, 499);
  assert.equal((await post("/api/report", { token: second.token })).status, 404);
});

test("friend comparison requires paid Plus, consent and an unexpired share; never exposes private tokens", async () => {
  const basic = await create("basic"); await pay(basic, 499);
  const plus = await create("plus"); await pay(plus, 999);
  const shared = await (await post("/api/share", { axes: axes.map(a => 100-a), locale: "en", quizLength: 60, variant: "baseline", consent: true })).json();
  const input = { token: plus.token, shareId: shared.id, locale: "en", consent: true };
  assert.equal((await post("/api/report/compare", { ...input, token: basic.token })).status, 403);
  assert.equal((await post("/api/report/compare", { ...input, consent: false })).status, 400);
  assert.equal((await post("/api/report/compare", { ...input, locale: "fake" })).status, 400);
  assert.equal((await post("/api/report/compare", { ...input, shareId: "invalid" })).status, 400);
  const response = await post("/api/report/compare", input);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const comparison = await response.json();
  assert.equal(comparison.axes.length, 12);
  assert.equal(comparison.yourQuizLength, 36); assert.equal(comparison.friendQuizLength, 60);
  assert.ok(!JSON.stringify(comparison).includes(plus.token));
  await runtime.db.prepare("UPDATE shared_results SET expires_at = 0 WHERE id = ?").bind(shared.id).run();
  assert.equal((await post("/api/report/compare", input)).status, 404);
  await refund(plus, 999);
  assert.equal((await post("/api/report/compare", input)).status, 403);
});

test("five-language pricing preserves basic and discloses Plus and upgrade", async () => {
  for (const prefix of ["", "/pt", "/es", "/ru", "/zh"]) {
    const response = await runtime.request(prefix + "/pricing");
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /4[.,]99/);
    assert.match(html, /9[.,]99/);
    assert.match(html, /5[.,]00/);
    assert.match(html, /Plus/);
  }
});

 test("mismatched Stripe checkout prices fail before exposing a payment URL", async () => {
  wrongCheckoutAmount = true;
  try {
    const response = await post("/api/checkout", { axes, locale: "en", quizLength: 36, variant: "baseline", consent: true, plan: "plus" });
    assert.equal(response.status, 502);
    assert.equal((await response.json()).url, undefined);
  } finally { wrongCheckoutAmount = false; }
});

test("an already-Plus report cannot buy a discounted upgrade", async () => {
  const plus = await create("plus"); await pay(plus);
  assert.equal((await post("/api/checkout", { axes, locale: "en", quizLength: 36, variant: "baseline", consent: true, plan: "plus", upgradeToken: plus.token })).status, 409);
});
