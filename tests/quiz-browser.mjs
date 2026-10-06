import assert from "node:assert/strict";

// Run through ego-browser with an existing task page and a local or dev base URL.
export async function verifyQuiz(page, base, { locales = ["en", "pt", "es", "ru", "zh"], longVersions = true } = {}) {
  async function start(locale, format = 0) {
    await page.goto(base + (locale === "en" ? "/" : "/" + locale));
    await page.waitForSelector(".hero-actions .primary-button");
    if (await page.evaluate(() => !!document.querySelector(".analytics-consent"))) {
      await page.click(".analytics-consent .secondary-button");
    }
    await page.click(".hero-actions .primary-button");
    await page.waitForSelector(".format-panel");
    await page.click(`.format-panel .format-card:nth-child(${format + 1})`);
    await page.waitForSelector(".quiz-shell .answer-grid [role=radio]");
  }

  async function progress() {
    return page.evaluate(() => document.querySelector(".progress-copy b")?.textContent.match(/\d+/g).map(Number));
  }

  async function answerRange(first, last, total, extend = false) {
    for (let index = first; index <= last; index++) {
      assert.deepEqual(await progress(), [index, total], "Rapid answers must not skip a question");
      await page.evaluate(() => {
        const options = document.querySelectorAll(".answer-grid [role=radio]");
        // Same-render bursts exercise the synchronous lock, not just disabled styling.
        for (let click = 0; click < 8; click++) options[click % options.length].click();
      });
      if (index < total) {
        await page.waitForFunction(previous => Number(document.querySelector(".progress-copy b")?.textContent.match(/\d+/)?.[0]) !== previous, index);
      } else if (extend) {
        await page.waitForSelector(".extend-card");
      } else {
        await page.waitForSelector(".quiz-actions .primary-button:not(:disabled)");
      }
    }
  }

  async function result() {
    await page.waitForSelector(".result-shell", { timeout: 15000 });
    await page.waitForFunction(() => Math.abs(window.scrollY) < 1);
    assert.equal(await page.evaluate(() => document.querySelector("[role=alert]")?.textContent ?? null), null);
    assert.equal(await page.evaluate(() => document.querySelectorAll(".plan-options button").length), 2);
    assert.equal(await page.evaluate(() => document.querySelector(".plan-overview") === null), true);
    assert.equal(await page.evaluate(() => document.querySelector(".paid-report-cta > .consent-label input")?.checked), true);
    assert.equal(await page.evaluate(() => document.querySelectorAll(".plan-attention-star").length), 2);
    assert.equal(await page.evaluate(() => {
      const match = document.querySelector(".match-card.large")?.getBoundingClientRect();
      const cta = document.querySelector(".paid-report-cta")?.getBoundingClientRect();
      return Boolean(match && cta && match.top < cta.top);
    }), true);
  }

  for (const locale of locales) {
    await start(locale);
    await answerRange(1, 36, 36, true);
    await page.click(".extend-card .answer-button:last-child");
    await result();
    console.log(`${locale}: rapid 36 answers → No → results passed`);

    await start(locale);
    await answerRange(1, 36, 36, true);
    await page.click(".extend-card .answer-button:first-child");
    await page.waitForSelector(".quiz-actions");
    await answerRange(37, 60, 60);
    await page.click(".quiz-actions .primary-button");
    await result();
    console.log(`${locale}: rapid 36 + 24 answers → results passed`);
  }

  await start("en");
  await page.focus(".answer-grid button:first-child");
  await page.press(".answer-grid button:first-child", "Enter");
  await page.waitForFunction(() => document.querySelector(".progress-copy b")?.textContent === "Question 2 of 36");
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("role")), "radio", "Auto-advance must preserve keyboard focus");
  console.log("Keyboard answer advances without losing focus");

  await start("en");
  await answerRange(1, 1, 36);
  await page.evaluate(() => {
    document.querySelector(".answer-grid button").click();
    document.querySelector(".quiz-actions .secondary-button").click();
  });
  // Deliberately wait past the old timer to catch unwanted navigation after Back.
  await new Promise(resolve => setTimeout(resolve, 250));
  assert.deepEqual(await progress(), [1, 36]);
  await page.click(".quiz-actions .primary-button");
  await page.waitForFunction(() => document.querySelector(".progress-copy b")?.textContent === "Question 2 of 36");
  assert.equal(await page.evaluate(() => document.querySelectorAll('.answer-grid [aria-checked="true"]').length), 1, "Back must preserve the answer just entered");
  await page.evaluate(() => {
    document.querySelector(".answer-grid button").click();
    document.querySelector(".quiz-actions .primary-button").click();
  });
  await new Promise(resolve => setTimeout(resolve, 250));
  assert.deepEqual(await progress(), [3, 36], "Next must cancel auto-advance");
  await page.evaluate(() => {
    document.querySelector(".answer-grid button").click();
    document.querySelector(".header-action").click();
  });
  await new Promise(resolve => setTimeout(resolve, 250));
  assert.equal(await page.evaluate(() => !!document.querySelector(".format-panel")), true);
  await page.click(".format-panel .format-card:first-child");
  await page.waitForSelector(".quiz-actions");
  assert.deepEqual(await progress(), [1, 36]);
  assert.equal(await page.evaluate(() => document.querySelectorAll('.answer-grid [aria-checked="true"]').length), 0);
  await page.evaluate(() => {
    document.querySelector(".answer-grid button").click();
    document.querySelector(".logo").click();
  });
  await new Promise(resolve => setTimeout(resolve, 250));
  assert.equal(await page.evaluate(() => !!document.querySelector(".hero")), true);
  console.log("Back, Next, retake and home cancel pending advancement and preserve/reset answers correctly");

  if (longVersions) {
    for (const [format, total] of [[1, 60], [2, 240]]) {
      await start("en", format);
      await answerRange(1, total, total);
      await page.click(".quiz-actions .primary-button");
      await result();
      console.log(`Direct ${total}-question version with rapid clicks passed`);
    }
  }
}
