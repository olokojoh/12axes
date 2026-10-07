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
async function setup(host = "12axes.net", ads = false) {
  const target = new EventTarget();
  const location = new URL(`https://${host}/pt?gclid=test-click&utm_campaign=br_pt_exact_test&est=85&share=private-share#report=private-token`);
  globalThis.window = { location, localStorage: storage(), sessionStorage: storage(), dispatchEvent: event => target.dispatchEvent(event) };
  let script;
  globalThis.document = { createElement: () => ({}), head: { appendChild: node => { script = node; } } };
  window.localStorage.setItem("12axes:analytics-consent", "granted");
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
