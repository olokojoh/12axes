import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

export async function verifyLocaleState(page, base, { paidUrl, friendUrl } = {}) {
  const banks = Object.fromEntries(await Promise.all(["en", "pt", "es", "ru", "zh"].map(async locale => [locale, JSON.parse(await readFile(new URL(`../public/data/quiz.${locale}.json`, import.meta.url), "utf8"))])));
  let origin;
  async function switchTo(locale, selector) {
    await page.selectOption('select[aria-label="Language"]', locale);
    await page.waitForFunction(l => document.documentElement.lang.startsWith(l), locale);
    assert.equal(await page.evaluate(() => performance.timeOrigin), origin, "Language must not reload the document");
    assert.equal(await page.evaluate(s => Boolean(document.querySelector(s)), selector), true, "Current stage must remain mounted");
  }
  await page.goto(base);
  await page.waitForFunction(() => typeof document.querySelector(".hero-actions button")?.onclick === "function");
  await page.waitForFunction(() => !!document.querySelector(".hero-actions button"));
  origin = await page.evaluate(() => performance.timeOrigin);
  if (await page.evaluate(() => !!document.querySelector(".analytics-consent"))) await page.click(".analytics-consent .secondary-button");
  await switchTo("zh", ".hero");
  assert.match(await page.evaluate(() => document.title), /中文版/);
  await page.click(".hero-actions button");
  await switchTo("pt", ".format-panel");
  await page.click(".format-card:first-child");
  await page.waitForFunction(() => !!document.querySelector(".question-card h1"));
  const firstText = await page.evaluate(() => document.querySelector(".question-card h1").textContent);
  const id = banks.pt.questions.find(q => q.text === firstText).id;
  await page.click(".answer-grid button:first-child");
  await page.waitForFunction(() => document.querySelector(".progress-copy b")?.textContent.match(/\d+/)?.[0] === "2");
  await page.click(".quiz-actions .secondary-button");
  for (const locale of ["en", "es", "ru", "zh", "pt"]) {
    await switchTo(locale, ".quiz-shell");
    await page.waitForFunction(text => document.querySelector(".question-card h1")?.textContent === text, banks[locale].questions.find(q => q.id === id).text);
    assert.equal(await page.evaluate(() => document.querySelector('.answer-grid button[aria-checked="true"]') === document.querySelector(".answer-grid button:first-child")), true);
    assert.equal(await page.evaluate(() => document.querySelector(".progress-copy b").textContent.match(/\d+/)[0]), "1");
  }
  for (let index = 1; index <= 36; index++) {
    await page.click(".answer-grid button:first-child");
    if (index < 36) await page.waitForFunction(i => document.querySelector(".progress-copy b")?.textContent.match(/\d+/)?.[0] === String(i + 1), index);
    else await page.waitForFunction(() => !!document.querySelector(".extend-card"));
  }
  await switchTo("en", ".extend-card");
  await page.evaluate(() => {
    const original = window.fetch;
    window.fetch = (...args) => {
      if (args[0] === "/api/match") {
        window.fetch = original;
        return new Promise(resolve => setTimeout(() => resolve(original(...args)), 400));
      }
      return original(...args);
    };
  });
  await page.click(".extend-card .answer-button:last-child");
  await page.waitForFunction(() => !!document.querySelector(".loading-shell select"));
  await switchTo("zh", ".loading-shell");
  await page.waitForFunction(() => !!document.querySelector(".result-shell"));
  const axes = await page.evaluate(() => [...document.querySelectorAll(".axis-results .axis-bar span")].map(e => e.style.width));
  await page.fill('.report-recovery input[type="email"]', "locale-check@example.com");
  await page.click(".result-sharing-top summary");
  await page.click(".result-consent input");
  await page.click(".purchase-consent:not(.answer-consent) input");
  for (const locale of ["pt", "es", "ru", "zh", "en"]) {
    await switchTo(locale, ".result-shell");
    await page.waitForFunction(label => document.querySelector(".axis-results h2")?.textContent === label, banks[locale].axes[0].label);
    assert.deepEqual(await page.evaluate(() => [...document.querySelectorAll(".axis-results .axis-bar span")].map(e => e.style.width)), axes);
    assert.equal(await page.evaluate(() => document.querySelector('.report-recovery input').value), "locale-check@example.com");
    assert.equal(await page.evaluate(() => document.querySelector('.result-consent input').checked), true);
    assert.equal(await page.evaluate(() => document.querySelector('.result-sharing-top').open), true);
    assert.equal(await page.evaluate(() => [...document.querySelectorAll('.plan-options button')].every(e => e.disabled)), true);
  }
  console.log("Home, format, question/answer, extension, free scores and recovery draft preserved across languages");

  if (paidUrl) {
    await page.goto(paidUrl);
    await page.waitForFunction(() => !!document.querySelector(".plus-report"));
    origin = await page.evaluate(() => performance.timeOrigin);
    const fragment = await page.evaluate(() => location.hash);
    await page.click(".plus-profile details:first-of-type >> nth=0");
    await page.fill('.friend-form input[type="url"]', friendUrl);
    await page.click('.friend-form input[type="checkbox"]');
    await page.click('.friend-form button');
    await page.waitForFunction(() => !!document.querySelector('.friend-comparison .comparison-table'));
    const values = await page.evaluate(() => [...document.querySelectorAll('.friend-comparison td')].map(e => e.textContent));
    for (const locale of ["pt", "es", "ru", "zh", "en"]) {
      await switchTo(locale, ".plus-report");
      await page.waitForFunction(label => document.querySelector('.friend-comparison tbody th')?.textContent.startsWith(label), banks[locale].axes[0].label);
      assert.deepEqual(await page.evaluate(() => [...document.querySelectorAll('.friend-comparison td')].map(e => e.textContent)), values);
      assert.equal(await page.evaluate(() => document.querySelector('.friend-form input[type="url"]').value), friendUrl);
      assert.equal(await page.evaluate(() => document.querySelector('.plus-profile details').open), true);
      assert.equal(await page.evaluate(() => location.hash), fragment);
      assert.equal(await page.evaluate(() => document.querySelectorAll('.plus-profile').length), 30);
    }
    console.log("Paid Plus access, token, expanded comparisons, friend input/consent and numeric comparison preserved");
  }
}
