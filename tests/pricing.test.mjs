import assert from "node:assert/strict";
import test from "node:test";
import { createRuntime } from "./runtime.mjs";

test("currency references cover every locale, reject stale or incomplete upstream rates", async () => {
  let payload = { result: "success", base_code: "USD", time_last_update_unix: Math.floor(Date.now() / 1000), rates: { BRL: 5, EUR: 0.9, RUB: 85, CNY: 6.7 } };
  const runtime = await createRuntime({ outboundService: async request => {
    assert.equal(request.url, "https://open.er-api.com/v6/latest/USD");
    return Response.json(payload);
  } });
  try {
    const response = await runtime.request("/api/pricing");
    assert.equal(response.status, 200);
    assert.deepEqual((await response.json()).rates, payload.rates);
    payload = { ...payload, time_last_update_unix: Math.floor(Date.now() / 1000) - 8 * 86400 };
    assert.equal((await runtime.request("/api/pricing")).status, 503);
    payload = { ...payload, time_last_update_unix: Math.floor(Date.now() / 1000), rates: { BRL: 5 } };
    assert.equal((await runtime.request("/api/pricing")).status, 503);
  } finally { await runtime.mf.dispose(); }
});
