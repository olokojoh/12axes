import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";
import { readFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
await mkdir(root + "output/tests", { recursive: true });
const out = root + "output/tests/analytics-client-" + process.pid + ".mjs";
await build({ stdin: { contents: await readFile(root + "app/Analytics.tsx", "utf8") + "\nexport { enableAnalytics };", loader: "tsx", resolveDir: root + "app" }, bundle: true, platform: "node", format: "esm", outfile: out });
const storage = () => {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
};
async function setup(host = "12axes.net", ads = false, { referrer = "", consent = "granted" } = {}) {
  const target = new EventTarget();
  const location = new URL(`https://${host}/pt?gclid=test-click&utm_campaign=br_pt_exact_test&est=85&share=private-share#report=private-token`);
  globalThis.window = { location, localStorage: storage(), sessionStorage: storage(), dispatchEvent: event => target.dispatchEvent(event) };
  let script;
  globalThis.document = { referrer, createElement: () => ({}), head: { appendChild: node => { script = node; } } };
  if (consent !== null) window.localStorage.setItem("12axes:analytics-consent", consent);
  if (ads) window.localStorage.setItem("12axes:ads-consent", "granted");
  const client = await import(out + "?case=" + crypto.randomUUID());
  client.enableAnalytics();
  return { client, loaded: () => script?.onload(), script: () => script, events: () => (window.dataLayer ?? []).map(args => Array.from(args)) };
}

test("campaign attribution requires separate ad consent and excludes private URL data", async () => {
  for (const ads of [false, true]) {
    const state = await setup("12axes.net", ads);
    const consent = state.events().find(e => e[0] === "consent")[2];
    assert.equal(consent.ad_user_data, ads ? "granted" : "denied");
    assert.equal(consent.ad_personalization, "denied");
    state.client.trackEvent("quiz_complete", { language: "pt", axes: "secret", report: "private" });
    const event = state.events().at(-1);
    assert.equal(new URL(event[2].page_location).searchParams.has("gclid"), ads);
    assert.doesNotMatch(JSON.stringify(state.events()), /private-token|private-share|est=85|secret/);
  }
});

test("external attribution keeps only the source origin, never sensitive URL contents", async () => {
  const state = await setup("12axes.net", false, { referrer: "https://www.google.com/political-profile/private-path?score=85&answer=private-answer#report=private-referrer-token" });
  state.client.trackEvent("result_preview_view", { language: "en" });
  const measured = state.events().filter(event => event[0] === "config" || event[0] === "event");
  assert.ok(measured.length >= 3);
  for (const event of measured) assert.equal(event[2].page_referrer, "https://www.google.com");
  assert.doesNotMatch(JSON.stringify(state.events()), /private-path|score=85|private-answer|private-referrer-token/);
});

test("same-site domain family and payment returns never become referral sources", async () => {
  for (const referrer of [
    "https://12axes.net/results?share=private-share#report=private-token",
    "http://12axes.net/results",
    "https://www.12axes.net/results",
    "http://www.12axes.net/results",
    "https://report.preview.12axes.net/results",
    "https://checkout.stripe.com/c/pay/private-checkout",
    "https://buy.stripe.com/private-payment",
    "https://stripe.com/private-payment",
    "https://link.com/private-payment",
    "https://checkout.link.com/private-payment",
    "https://stripe.network/private-payment",
    "https://checkout.stripe.network/private-payment",
    "javascript:private-token",
  ]) {
    const state = await setup("12axes.net", false, { referrer });
    state.client.trackEvent("result_preview_view", { language: "en" });
    for (const event of state.events().filter(event => event[0] === "config" || event[0] === "event")) assert.equal(event[2].page_referrer, "");
  }
});

test("lookalike domains remain external referrals without their private URL contents", async () => {
  for (const host of ["not12axes.net", "12axes.net.example.com", "evilstripe.com", "stripe.com.example.com", "notlink.com", "link.com.example.com", "evilstripe.network", "stripe.network.example.com"]) {
    const state = await setup("12axes.net", false, { referrer: `https://${host}/private-path?score=85#private-token` });
    state.client.trackEvent("result_preview_view", { language: "en" });
    for (const event of state.events().filter(event => event[0] === "config" || event[0] === "event")) assert.equal(event[2].page_referrer, `https://${host}`);
    assert.doesNotMatch(JSON.stringify(state.events()), /private-path|score=85|private-token/);
  }
});

test("denied or unanswered analytics consent loads no tag and records no events or checkout", async () => {
  for (const consent of ["denied", null]) {
    const state = await setup("12axes.net", true, { consent });
    state.client.trackEvent("quiz_start", { quiz_run_id: crypto.randomUUID() });
    state.client.rememberCheckout("should-not-be-saved");
    assert.equal(state.script(), undefined);
    assert.equal(window.gtag, undefined);
    assert.equal(state.events().length, 0);
    assert.equal(window.sessionStorage.getItem("12axes:pending-purchase"), null);
  }
});

test("funnel measurement admits a random run ID and stages while excluding political data", async () => {
  const state = await setup();
  const quizRunId = crypto.randomUUID();
  state.client.trackEvent("quiz_progress", {
    quiz_run_id: quizRunId, measurement_entry: "start", progress_stage: 50, choice: "extend",
    answers: "private-answer", axes: "private-score", ideology: "private-label", report: "private-token",
  });
  const event = state.events().at(-1)[2];
  assert.equal(event.quiz_run_id, quizRunId);
  assert.equal(event.measurement_entry, "start");
  assert.equal(event.progress_stage, 50);
  assert.equal(event.choice, "extend");
  assert.doesNotMatch(JSON.stringify(event), /private-answer|private-score|private-label|private-token/);
});

test("plan readiness is measured without allowing sensitive checkout or result fields", async () => {
  const state = await setup();
  for (const planState of ["ready", "requires_quiz"]) {
    state.client.trackEvent("plan_view", { plan: "basic", plan_state: planState, answers: "private-answer", report: "private-token", checkout_url: "private-checkout" });
    const event = state.events().at(-1)[2];
    assert.equal(event.plan, "basic");
    assert.equal(event.plan_state, planState);
    assert.doesNotMatch(JSON.stringify(event), /private-answer|private-token|private-checkout/);
  }
});

test("preview never loads the production measurement tag", async () => {
  const state = await setup("dev.12axes-1dg.pages.dev", true);
  assert.equal(state.script(), undefined);
  assert.equal(state.events().length, 0);
});

test("only a completed same-tab checkout can request a purchase receipt", async () => {
  const state = await setup("12axes.net", true);
  const originalFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (url, options) => {
    requests.push(JSON.parse(options.body));
    return Response.json({ transaction_id: "random-transaction", value: 5, currency: "USD", plan: "plus" });
  };
  try {
    await state.client.trackPurchase("private-token");
    assert.equal(requests.length, 0);
    state.client.rememberCheckout("order-upgrade");
    await state.client.trackPurchase("private-token");
    assert.equal(requests.length, 0, "wait until the Google script loads");
    state.loaded();
    await state.client.trackPurchase("private-token");
    await state.client.trackPurchase("private-token");
    assert.equal(requests.length, 1);
    const purchase = state.events().find(e => e[1] === "purchase")[2];
    assert.equal(purchase.value, 5);
    assert.equal(purchase.items[0].price, 5);
    assert.doesNotMatch(JSON.stringify(purchase), /private-token|gclid|share=/);
    window.localStorage.setItem("12axes:analytics-consent", "denied");
    state.client.rememberCheckout("denied-order");
    await state.client.trackPurchase("private-token");
    assert.equal(requests.length, 1);
  } finally { globalThis.fetch = originalFetch; }
});
