import assert from "node:assert/strict";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";

export async function verifyReportLayout(page, base = "http://localhost:3000") {
  const origin = new URL(base).origin;
  assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(new URL(origin).hostname), "Report fixtures require localhost");
  const root = fileURLToPath(new URL("../", import.meta.url));
  const built = await build({ stdin: { contents: 'export { matchResult, plusReport, exploreProfiles } from "./app/lib/matching"; export { deepReport, evidenceAxes, quizBanks, quizVersion } from "./app/lib/quiz-evidence";', resolveDir: root }, bundle: true, platform: "node", format: "esm", write: false });
  const { matchResult, plusReport, exploreProfiles, deepReport, evidenceAxes, quizBanks, quizVersion } = await import("data:text/javascript;base64," + Buffer.from(built.outputFiles[0].text).toString("base64"));
  const bank = quizBanks.en;
  const questions = bank.axes.flatMap(axis => bank.questions.filter(question => question.axisId === axis.id).slice(0, 3));
  const neutralAnswer = bank.answerOptions.find(answer => answer.scoreTowardAgreement === 0.5).id;
  const positiveAnswer = bank.answerOptions.find(answer => answer.scoreTowardAgreement === 1).id;
  const negativeAnswer = bank.answerOptions.find(answer => answer.scoreTowardAgreement === 0).id;
  const token = "qa-report-layout-local-only";
  await page.goto(origin);
  const consent = await page.evaluate(() => localStorage.getItem("12axes:analytics-consent"));
  let scriptId;
  const checked = [];
  try {
    for (const locale of ["en", "pt", "es", "ru", "zh"]) {
      for (const plan of ["basic", "plus", "deep"]) {
        const evidence = { version: quizVersion, questionIds: questions.map(question => question.id), answers: questions.map((question, index) => index < 9 ? question.agreePole === "LEFT" ? positiveAnswer : negativeAnswer : neutralAnswer) };
        const axes = evidenceAxes(evidence);
        const payload = { status: "paid", axes, result: matchResult(axes, locale), plan, entitlement: plan, plus: plan !== "basic" ? plusReport(axes, locale) : null, deep: plan === "deep" ? deepReport(evidence, locale) : null, hasOriginal: false, locale, quizLength: 36, variant: "baseline" };
        const profiles = exploreProfiles(axes, locale, "ideologies", "all");
        const source = `localStorage.setItem("12axes:analytics-consent", "denied");
          window.__layoutPayload = ${JSON.stringify(payload)};
          window.__layoutProfiles = ${JSON.stringify(profiles)};
          const realFetch = window.fetch.bind(window);
          window.fetch = (...args) => {
            const path = new URL(args[0] instanceof Request ? args[0].url : String(args[0]), location.href).pathname;
            if (path === "/api/report") return Promise.resolve(Response.json(window.__layoutPayload));
            if (path === "/api/report/explore") return Promise.resolve(Response.json({ profiles: window.__layoutProfiles }));
            if (path === "/api/checkout" || path === "/api/report/recover") throw new Error("No mutations in layout QA");
            return realFetch(...args);
          };`;
        scriptId = (await page.cdp("Page.addScriptToEvaluateOnNewDocument", { source })).identifier;
        await page.goto(origin + (locale === "en" ? "" : "/" + locale) + "/results?paid=1&layoutcase=" + plan + "#report=" + token);
        await page.waitForSelector(".result-summary");
        await page.waitForFunction(() => document.querySelectorAll(".axis-interpretation").length === 12);
        for (const width of [390, 1600]) {
          await page.cdp("Emulation.setDeviceMetricsOverride", { width, height: 1000, deviceScaleFactor: 1, mobile: width < 640 });
          await page.evaluate(() => window.scrollTo(0, 0));
          const state = await page.evaluate(() => {
            const summary = document.querySelector(".result-summary");
            const actions = document.querySelector(".result-quick-actions");
            const bounds = node => { const b = node.getBoundingClientRect(); return { left: b.left, right: b.right, top: b.top, width: b.width }; };
            const before = (a, b) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
            const upgrades = document.querySelector(".report-upgrades");
            const targets = [...document.querySelectorAll(".result-summary-nav a")].map(link => ({ hash: link.hash, exists: !!document.querySelector(link.hash) }));
            return { summary: bounds(summary), actions: bounds(actions), summaryBeforeDetails: before(summary, document.querySelector("#axis-readings")), summaryBeforeActions: before(summary, actions), interpretations: document.querySelectorAll(".axis-interpretation").length, matches: document.querySelectorAll("#ideology-matches .result-match, #ideology-matches .match-card").length, ideologyChildren: document.querySelector("#ideology-matches .match-grid")?.children.length, strongest: document.querySelectorAll(".result-summary-axes article").length, neutral: !!document.querySelector(".result-summary-neutral"), targets, upgradeExists: !!upgrades, upgradeClosed: !upgrades?.open, upgradeAfterContent: !upgrades || ["#axis-readings", "#ideology-matches", "#report-comparisons", "#answer-evidence"].every(selector => !document.querySelector(selector) || before(document.querySelector(selector), upgrades)), overflow: document.documentElement.scrollWidth - innerWidth, bodyText: summary.textContent };
          });
          assert.equal(state.interpretations, 12, `${locale}/${plan}: full paid axis readings`);
          assert.equal(state.ideologyChildren, 9, `${locale}/${plan}: top match plus nine other matches`);
          assert.equal(state.strongest, 3, `${locale}/${plan}: three actual pronounced axes`);
          assert.equal(state.neutral, false);
          assert.equal(state.summaryBeforeDetails && state.summaryBeforeActions, true);
          assert.equal(state.upgradeExists, plan !== "deep");
          assert.equal(state.upgradeClosed && state.upgradeAfterContent, true);
          assert.equal(state.targets.every(target => target.exists), true);
          assert.equal(state.targets.some(target => target.hash === "#report-comparisons"), plan !== "basic", `${locale}/${plan}/${width}: comparison navigation entitlement`);
          assert.equal(state.targets.some(target => target.hash === "#answer-evidence"), plan === "deep", `${locale}/${plan}/${width}: evidence navigation entitlement`);
          assert.ok(state.overflow <= 1, `${locale}/${plan}/${width}: horizontal overflow ${state.overflow}`);
          assert.ok(Math.abs(state.actions.left - state.summary.left) <= 1, `${locale}/${plan}/${width}: actions not aligned with report`);
          assert.ok(state.actions.width <= 920.5 && state.actions.left >= 13, `${locale}/${plan}/${width}: action container reaches viewport edge`);
          assert.doesNotMatch(state.bodyText, /undefined|\{count\}|\{total\}|\{score\}/);
          checked.push({ locale, plan, width });
        }
        const links = await page.evaluate(() => [...document.querySelectorAll(".result-summary-nav a")].map(link => link.getAttribute("href")));
        for (const href of links) {
          await page.press(`.result-summary-nav a[href="${href}"]`, "Enter");
          assert.equal(await page.evaluate(() => location.hash), "#report=" + token, "Section navigation must preserve private report access");
        }
        await page.cdp("Page.removeScriptToEvaluateOnNewDocument", { identifier: scriptId });
        scriptId = null;
        if (plan === "basic") {
          const neutralAxes = Array(12).fill(50);
          const neutralPayload = { ...payload, axes: neutralAxes, result: matchResult(neutralAxes, locale) };
          scriptId = (await page.cdp("Page.addScriptToEvaluateOnNewDocument", { source: source.replace(JSON.stringify(payload), JSON.stringify(neutralPayload)) })).identifier;
          await page.goto(origin + (locale === "en" ? "" : "/" + locale) + "/results?paid=1&layoutcase=neutral#report=" + token);
          await page.waitForSelector(".result-summary-neutral");
          const neutral = await page.evaluate(() => ({ cards: document.querySelectorAll(".result-summary-axes article").length, balanced: document.querySelector(".result-summary-balanced").textContent }));
          assert.equal(neutral.cards, 0, `${locale}: neutral scores must not fabricate strongest preferences`);
          assert.equal((neutral.balanced.match(/12/g) ?? []).length, 2);
          await page.cdp("Page.removeScriptToEvaluateOnNewDocument", { identifier: scriptId });
          scriptId = null;
        }
      }
    }
    console.log("Paid report layout passed:", checked.length, "locale / tier / viewport cases; all tier navigation preserves the private report hash.");
    return checked;
  } finally {
    if (scriptId) await page.cdp("Page.removeScriptToEvaluateOnNewDocument", { identifier: scriptId });
    await page.cdp("Emulation.clearDeviceMetricsOverride");
    await page.goto(origin);
    await page.evaluate(value => { if (value === null) localStorage.removeItem("12axes:analytics-consent"); else localStorage.setItem("12axes:analytics-consent", value); }, consent);
  }
}
