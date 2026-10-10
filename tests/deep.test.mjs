import assert from "node:assert/strict";
import test, { before, after } from "node:test";
import { build } from "esbuild";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createRuntime, testSecret } from "./runtime.mjs";

let runtime, scorer, stripe, cryptoHelpers, sessions = [];
const missingSessions = new Set();
const post = (path, body) => runtime.request(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
before(async () => {
  const bindings = { STRIPE_SECRET_KEY: "sk_test_synthetic", PUBLIC_BASE_URL: "https://dev.12axes-1dg.pages.dev" };
  for (const tier of ["", "PLUS_", "UPGRADE_", "DEEP_", "DEEP_PLUS_UPGRADE_", "DEEP_BASIC_UPGRADE_"]) for (const locale of ["", "_PT", "_ES", "_RU", "_ZH"]) bindings["STRIPE_" + tier + "PRICE_ID" + locale] = "price_" + tier + locale;
  runtime = await createRuntime({ bindings, outboundService: async request => {
    if (request.method === "GET" && missingSessions.has(request.url.split("/").at(-1))) return Response.json({ error: "missing" }, { status: 404 });
    if (request.method === "GET") return Response.json({ status: "open", url: "https://checkout.stripe.com/test-pending" });
    if (request.url.endsWith("/expire")) return Response.json({ status: "expired" });
    const params = new URLSearchParams(await request.text());
    const price = params.get("line_items[0][price]");
    const amount = price.includes("DEEP_BASIC_UPGRADE") ? 1000 : price.includes("UPGRADE") ? 500 : price.includes("DEEP") ? 1499 : price.includes("PLUS") ? 999 : 499;
    const item = { id: "cs_test_" + randomUUID(), params, amount };
    sessions.push(item);
    return Response.json({ id: item.id, url: "https://checkout.stripe.com/test-session", amount_total: amount, currency: "usd", livemode: false });
  } });
  for (const [name, entry] of [["evidence", "app/lib/quiz-evidence.ts"], ["stripe", "app/lib/stripe-events.ts"], ["crypto", "app/lib/secure-payload.ts"]]) {
    const outfile = `output/tests/deep-${name}.mjs`;
    await build({ entryPoints: [entry], bundle: true, platform: "node", format: "esm", outfile });
    const mod = await import(new URL("../" + outfile, import.meta.url));
    if (name === "evidence") scorer = mod; else if (name === "stripe") stripe = mod; else cryptoHelpers = mod;
  }
});
after(async () => { await runtime?.mf.dispose(); });
function evidence(length = 36) {
  const bank = scorer.quizBanks.en;
  const questions = bank.axes.flatMap(axis => bank.questions.filter(q => q.axisId === axis.id).slice(0, length / 12));
  return { version: scorer.quizVersion, questionIds: questions.map(q => q.id), answers: questions.map((_, i) => bank.answerOptions[i % 5].id) };
}
function input(plan, locale = "en", token, ev = evidence()) {
  return { axes: scorer.evidenceAxes(ev), locale, quizLength: ev.questionIds.length, variant: "baseline", consent: true, plan, ...(plan === "deep" ? { evidence: ev, answerConsent: true } : {}), ...(token ? { upgradeToken: token } : {}) };
}
async function buy(plan, locale = "en", token, ev) {
  const response = await post("/api/checkout", input(plan, locale, token, ev));
  assert.equal(response.status, 200, await response.text());
  const session = sessions.at(-1);
  const item = { session, token: new URLSearchParams(new URL(session.params.get("success_url")).hash.slice(1)).get("report"), id: session.params.get("metadata[order_id]") };
  await stripe.processStripeEvent({ id: "evt_" + randomUUID(), type: "checkout.session.completed", data: { object: { id: session.id, payment_intent: "pi_" + item.id, metadata: { order_id: item.id }, payment_status: "paid", amount_total: session.amount, currency: "usd" } } }, runtime.db, { send: async () => {} });
  return item;
}
async function refund(item) {
  await stripe.processStripeEvent({ id: "evt_" + randomUUID(), type: "charge.refunded", data: { object: { id: "ch_" + item.id, payment_intent: "pi_" + item.id, amount: item.session.amount, amount_refunded: item.session.amount, refunded: true } } }, runtime.db, { send: async () => {} });
}
async function report(item, locale = "en", original = false) { return (await post("/api/report", { token: item.token, locale, original })).json(); }

test("five-language Deep purchases preserve evidence, simulate without mutating, and include Plus", async () => {
  for (const locale of ["en", "pt", "es", "ru", "zh"]) {
    const ev = evidence(); const item = await buy("deep", locale, undefined, ev);
    assert.equal(item.session.amount, 1499);
    const data = await report(item, locale);
    assert.equal(data.plan, "deep"); assert.equal(data.plus.countries.length, 10);
    assert.deepEqual(data.deep.evidence, ev);
    assert.equal(data.deep.axes.flatMap(a => a.rows).length, 36);
    const changed = { ...ev, answers: [...ev.answers] }; changed.answers[0] = "STRONGLY_DISAGREE";
    const response = await post("/api/report/simulate", { token: item.token, locale, questionId: ev.questionIds[0], answerId: changed.answers[0] });
    assert.equal(response.status, 200); assert.equal(response.headers.get("cache-control"), "no-store");
    assert.deepEqual((await response.json()).axes, scorer.evidenceAxes(changed));
    assert.deepEqual((await report(item)).deep.evidence, ev);
    const saved = await runtime.db.prepare("SELECT payload FROM orders WHERE id = ?").bind(item.id).first();
    assert.ok(!saved.payload.includes(ev.questionIds[0]));
    assert.deepEqual((await cryptoHelpers.decryptPayload(saved.payload, testSecret)).evidence, ev);
    await refund(item); assert.equal((await post("/api/report/simulate", { token: item.token, locale, questionId: ev.questionIds[0], answerId: changed.answers[0] })).status, 403);
  }
});

test("Deep requires complete balanced versioned answers, separate consent and matching scores", async () => {
  const valid = input("deep");
  for (const patch of [{ answerConsent: false }, { evidence: undefined }, { evidence: { ...valid.evidence, version: "future" } }, { axes: Array(12).fill(0) }, { evidence: { ...valid.evidence, questionIds: Array(36).fill(valid.evidence.questionIds[0]) } }, { evidence: { ...valid.evidence, answers: Array(36).fill("made-up") } }]) assert.equal((await post("/api/checkout", { ...valid, ...patch })).status, 400);
  for (const length of [36, 60, 240]) assert.ok(scorer.validEvidence(evidence(length)));
  const basic = await buy("basic");
  assert.equal((await post("/api/report/simulate", { token: basic.token, locale: "en", questionId: valid.evidence.questionIds[0], answerId: "NEUTRAL" })).status, 403);
  const stored = await runtime.db.prepare("SELECT payload FROM orders WHERE id = ?").bind(basic.id).first();
  assert.equal((await cryptoHelpers.decryptPayload(stored.payload, testSecret)).evidence, undefined);
});

test("sequential upgrades keep original result and roll back entitlements on ancestor refunds", async () => {
  const basic = await buy("basic"); const plus = await buy("plus", "en", basic.token);
  const ev = evidence(); ev.answers = ev.answers.map(() => "STRONGLY_AGREE");
  const deep = await buy("deep", "en", basic.token, ev);
  assert.equal(plus.session.amount, 500); assert.equal(deep.session.amount, 500);
  assert.equal(deep.token, basic.token);
  assert.deepEqual((await report(basic)).axes, scorer.evidenceAxes(ev));
  assert.deepEqual((await report(basic, "en", true)).axes, scorer.evidenceAxes(evidence()));
  assert.equal((await report(basic, "en", true)).plan, "plus");
  await refund(deep); assert.equal((await report(basic)).plan, "plus");
  const deep2 = await buy("deep", "en", basic.token, ev);
  await refund(plus); assert.equal((await report(basic)).plan, "basic");
  assert.equal((await post("/api/checkout", input("deep", "en", basic.token, ev))).status, 200);
  assert.equal(sessions.at(-1).amount, 1000);
  await refund(basic); assert.equal((await post("/api/report", { token: deep2.token })).status, 404);
});

test("Plus and Deep search arbitrary profiles with domain/category filters; Basic cannot", async () => {
  const basic = await buy("basic"); const plus = await buy("plus");
  const query = { token: plus.token, locale: "zh", group: "ideologies", domain: "all", query: "", filter: "all" };
  assert.equal((await post("/api/report/explore", { ...query, token: basic.token })).status, 403);
  const all = await (await post("/api/report/explore", query)).json(); assert.equal(all.profiles.length, 20);
  assert.match(all.profiles[0].name, /[\u4e00-\u9fff]/);
  const search = await (await post("/api/report/explore", { ...query, query: all.profiles[12].name })).json();
  assert.ok(search.profiles.some(p => p.id === all.profiles[12].id)); assert.equal(search.profiles[0].axes.length, 12);
  const history = await (await post("/api/report/explore", { ...query, group: "countries", filter: "historical", domain: "economic" })).json(); assert.ok(history.profiles.every(p => p.context));
  const distant = await (await post("/api/report/explore", { ...query, furthest: true })).json(); assert.ok(distant.profiles[0].compatibility <= distant.profiles.at(-1).compatibility);
});

test("five-language pricing and library expose accurate initial HTML and valid canonical details", async () => {
  for (const prefix of ["", "/pt", "/es", "/ru", "/zh"]) {
    const pricing = await (await runtime.request(prefix + "/pricing")).text(); assert.match(pricing, /14[.,]99/); assert.match(pricing, /Deep/);
    const library = await runtime.request(prefix + "/library"); assert.equal(library.status, 200);
    const html = await library.text(); assert.match(html, /library\/ideologies--liberalismo/);
    const detail = await runtime.request(prefix + "/library/ideologies--liberalismo"); assert.equal(detail.status, 200);
    const body = await detail.text(); assert.equal((body.match(/<h1[ >]/g) || []).length, 1); assert.match(body, /rel="canonical"/); assert.match(body, /class="profile-radar"/);
    const values = [...body.matchAll(/class="visual-axis-track"[^>]*style="--axis-value:([\d.]+)%"/g)].map(match => Number(match[1]));
    const catalog = JSON.parse(await readFile(new URL("../app/data/matching.json", import.meta.url), "utf8"));
    assert.deepEqual(values, catalog.ideologies.find(item => item.id === "liberalismo").vector);
    assert.equal((await runtime.request(prefix + "/library/not-real")).status, 404);
  }
  const sitemap = await (await runtime.request("/sitemap.xml")).text(); assert.match(sitemap, /\/zh\/library\/ideologies--liberalismo/);
  const copy = await readFile(new URL("../app/deep-copy.ts", import.meta.url), "utf8"); assert.ok(!copy.includes("100% accurate"));
});

test("changing answers expires a pending Deep upgrade instead of charging for the stale snapshot", async () => {
  const basic = await buy("basic");
  const request = input("deep", "en", basic.token);
  assert.equal((await post("/api/checkout", request)).status, 200);
  const count = sessions.length;
  assert.equal((await post("/api/checkout", request)).status, 200);
  assert.equal(sessions.length, count);
  const changed = evidence(); changed.answers[0] = "STRONGLY_DISAGREE";
  assert.equal((await post("/api/checkout", input("deep", "en", basic.token, changed))).status, 200);
  assert.equal(sessions.length, count + 1);
  const { results } = await runtime.db.prepare("SELECT status FROM orders WHERE parent_order_id = ?").bind(basic.id).all();
  assert.equal(results.filter(r => r.status === "pending").length, 1);
  assert.equal(results.filter(r => r.status === "failed").length, 1);
});

test("frozen report question banks share every scoring ID, direction, axis and answer value", async () => {
  const canonical = scorer.quizBanks.en;
  for (const locale of ["en", "pt", "es", "ru", "zh"]) {
    const bank = scorer.quizBanks[locale];
    assert.deepEqual(bank.axes.map(a => a.id), canonical.axes.map(a => a.id));
    assert.deepEqual(bank.questions.map(({ id, axisId, agreePole, weight }) => ({ id, axisId, agreePole, weight })), canonical.questions.map(({ id, axisId, agreePole, weight }) => ({ id, axisId, agreePole, weight })));
    assert.deepEqual(bank.answerOptions.map(({ id, scoreTowardAgreement }) => ({ id, scoreTowardAgreement })), canonical.answerOptions.map(({ id, scoreTowardAgreement }) => ({ id, scoreTowardAgreement })));
    assert.deepEqual(scorer.deepReport(evidence(), locale).axes.map(a => a.score), scorer.evidenceAxes(evidence()));
  }
  assert.equal((await post("/api/checkout", { ...input("deep"), upgradeToken: "" })).status, 400);
});


test("missing Stripe upgrade session can be replaced without stranding the order", async () => {
  const basic = await buy("basic");
  const request = input("deep", "en", basic.token);
  assert.equal((await post("/api/checkout", request)).status, 200);
  missingSessions.add(sessions.at(-1).id);
  const count = sessions.length;
  assert.equal((await post("/api/checkout", request)).status, 200);
  assert.equal(sessions.length, count + 1);
  const invalid = await post("/api/checkout", { ...request, consent: false });
  assert.equal(invalid.status, 400);
  assert.equal(invalid.headers.get("cache-control"), "no-store");
});


test("cancelled Deep checkout restores its own answers without unlocking paid content", async () => {
  assert.equal((await post("/api/checkout", input("deep"))).status, 200);
  const session = sessions.at(-1);
  const token = new URLSearchParams(new URL(session.params.get("success_url")).hash.slice(1)).get("report");
  const response = await post("/api/report", { token, preview: true });
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.status, "preview");
  assert.deepEqual(data.evidence, evidence());
  assert.equal(data.deep, undefined);
  assert.equal((await post("/api/report/simulate", { token, locale: "en", questionId: evidence().questionIds[0], answerId: "NEUTRAL" })).status, 403);
});
