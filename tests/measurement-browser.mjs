import assert from "node:assert/strict";

// Run through ego-browser on localhost or the sandbox preview; never production.
export async function verifyMeasurement(page, base) {
  const origin = new URL(base).origin;
  assert.ok(["localhost", "127.0.0.1", "[::1]", "dev.12axes-1dg.pages.dev"].includes(new URL(origin).hostname), "Measurement tests require a local or sandbox origin");
  await page.goto(origin);
  await page.waitForFunction(() => typeof document.querySelector(".hero-actions button")?.onclick === "function");
  const saved = await page.evaluate(() => Object.fromEntries(["12axes:analytics-consent", "12axes:ads-consent", "12axes-local-test"].map(key => [key, localStorage.getItem(key)])));
  await page.evaluate(() => {
    localStorage.setItem("12axes:analytics-consent", "denied");
    window.__measurementTest = { events: [], checkoutAttempts: 0 };
    window.gtag = (...args) => window.__measurementTest.events.push(args);
    const originalFetch = window.fetch;
    window.fetch = (...args) => {
      const target = args[0] instanceof Request ? args[0].url : String(args[0]);
      if (new URL(target, location.href).pathname === "/api/checkout") {
        window.__measurementTest.checkoutAttempts++;
        return Promise.resolve(new Response(JSON.stringify({ error: "measurement-private-error" }), { status: 503, headers: { "content-type": "application/json" } }));
      }
      return originalFetch(...args);
    };
  });

  async function events() {
    return page.evaluate(() => window.__measurementTest.events.filter(event => event[0] === "event").map(event => ({ name: event[1], ...event[2] })));
  }
  async function start() {
    await page.press(".format-panel .format-card:first-child", "Enter");
    await page.waitForSelector(".quiz-shell .answer-grid [role=radio]");
  }
  async function answerRange(first, last, total) {
    for (let index = first; index <= last; index++) {
      assert.deepEqual(await page.evaluate(() => document.querySelector(".progress-copy b").textContent.match(/\d+/g).map(Number)), [index, total]);
      await page.press(".answer-grid button:first-child", "Enter");
      if (index < total) await page.waitForFunction(next => Number(document.querySelector(".progress-copy b")?.textContent.match(/\d+/)?.[0]) === next, index + 1);
      else if (total === 36) await page.waitForSelector(".extend-card");
      else await page.waitForSelector(".quiz-actions .primary-button:not(:disabled)");
    }
  }
  async function grant() {
    await page.evaluate(() => {
      localStorage.setItem("12axes:analytics-consent", "granted");
      window.dispatchEvent(new Event("analytics-ready"));
    });
  }

  try {
    if (await page.evaluate(() => !!document.querySelector(".analytics-consent"))) await page.press(".analytics-consent .secondary-button", "Enter");
    await page.press(".hero-actions button:first-child", "Enter");
    await start();
    await answerRange(1, 36, 36);
    await page.press(".extend-card .answer-button:last-child", "Enter");
    await page.waitForSelector(".result-shell");
    assert.deepEqual(await events(), [], "Denied consent must not record the quiz or result");

    await page.evaluate(() => {
      history.replaceState(null, "", location.pathname + "?est=measurement-private-score#report=measurement-private-token");
      const button = document.querySelector('#report-basic [data-measure-event="plan_view"]');
      const bounds = button.getBoundingClientRect();
      window.scrollTo({ top: scrollY + bounds.top + bounds.height * 0.75, behavior: "instant" });
    });
    await page.waitForFunction(() => {
      const bounds = document.querySelector('#report-basic [data-measure-event="plan_view"]').getBoundingClientRect();
      const visible = Math.max(0, Math.min(innerHeight, bounds.bottom) - Math.max(0, bounds.top)) / bounds.height;
      return visible > 0.15 && visible < 0.35;
    });
    await grant();
    await page.waitForFunction(() => window.__measurementTest.events.some(event => event[1] === "result_preview_view"));
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    assert.equal((await events()).filter(event => event.name === "plan_view" && event.plan === "basic").length, 0, "A quarter-visible button is not an exposure");
    await page.evaluate(() => document.querySelector('#report-basic [data-measure-event="plan_view"]').scrollIntoView({ block: "center", behavior: "instant" }));
    await page.waitForFunction(() => window.__measurementTest.events.some(event => event[1] === "plan_view" && event[2].plan === "basic"));
    await grant();
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const resultEvents = await events();
    assert.equal(resultEvents.filter(event => event.name === "result_preview_view").length, 1);
    assert.equal(resultEvents.find(event => event.name === "result_preview_view").measurement_entry, "result");
    assert.equal(resultEvents.filter(event => event.name === "plan_view" && event.plan === "basic").length, 1);
    assert.equal(resultEvents.some(event => event.name === "quiz_start" || event.name === "quiz_complete"), false, "Result-page consent must not backfill quiz events");

    const privateFragment = await page.evaluate(() => location.hash);
    await page.press('.result-quick-actions a[href="#free-results"]', "Enter");
    assert.equal(await page.evaluate(() => location.hash), privateFragment, "Jumping to free results must preserve private report credentials");

    await page.press("#report-basic .report-buy-button", "Enter");
    await page.waitForFunction(() => window.__measurementTest.events.some(event => event[1] === "checkout_create_error"));
    assert.equal(await page.evaluate(() => window.__measurementTest.checkoutAttempts), 1);
    const checkoutEvents = await events();
    assert.equal(checkoutEvents.filter(event => event.name === "checkout_start").length, 1);
    assert.equal(checkoutEvents.some(event => event.name === "checkout_create_success"), false);
    assert.doesNotMatch(JSON.stringify(checkoutEvents), /measurement-private|"answers"|"axes"|"ideology"|"reportToken"/);
    assert.equal(new URL(await page.url()).origin, origin, "The checkout mock must prevent payment navigation");

    await page.evaluate(() => { localStorage.setItem("12axes:analytics-consent", "denied"); window.__measurementTest.events = []; });
    await page.press(".result-actions .secondary-button", "Enter");
    await start();
    await answerRange(1, 8, 36);
    assert.deepEqual(await events(), []);
    await grant();
    await page.waitForFunction(() => window.__measurementTest.events.some(event => event[1] === "quiz_observation_start"));
    await answerRange(9, 36, 36);
    await page.press(".extend-card .answer-button:first-child", "Enter");
    await page.waitForSelector(".quiz-actions");
    await answerRange(37, 60, 60);
    await page.press(".quiz-actions .primary-button", "Enter");
    await page.waitForSelector(".result-shell");
    await page.waitForFunction(() => window.__measurementTest.events.some(event => event[1] === "result_preview_view"));
    const quizEvents = await events();
    const runEvents = quizEvents.filter(event => event.quiz_run_id);
    assert.equal(quizEvents.some(event => event.name === "quiz_start"), false, "Mid-quiz consent must not backfill a start");
    assert.equal(new Set(runEvents.map(event => event.quiz_run_id)).size, 1, "36 to 60 questions must keep the same measurement ID");
    assert.ok(runEvents.every(event => event.measurement_entry === "midway"));
    assert.ok(runEvents.some(event => event.quiz_length === 36) && runEvents.some(event => event.quiz_length === 60));
    assert.equal(runEvents.filter(event => event.name === "quiz_complete" && event.quiz_length === 60).length, 1);
    assert.doesNotMatch(JSON.stringify(quizEvents), /"answers"|"axes"|"questionIds"|"ideology"|"reportToken"/);
    console.log("Consent boundaries, late result measurement, visible plan exposure, mocked checkout failure and 36→60 funnel passed");
  } finally {
    await page.goto(origin + "/privacy");
    await page.waitForSelector(".commerce-article");
    await page.evaluate(values => {
      for (const [key, value] of Object.entries(values)) {
        if (value === null) localStorage.removeItem(key);
        else localStorage.setItem(key, value);
      }
    }, saved);
  }
}
