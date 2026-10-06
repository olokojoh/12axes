import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test, { before, after } from "node:test";
import { createRuntime } from "./runtime.mjs";
let runtime;
before(async () => { runtime = await createRuntime(); });
after(async () => { await runtime?.mf.dispose(); });
const render = (path = "/") => runtime.request(path, { headers: { accept: "text/html" } });

test("renders the free quiz and SEO contract without advertising or automatic analytics", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<html lang="en">/);
  assert.match(html, /<title>12 Axes Political Test — Free 12Axes Quiz<\/title>/);
  assert.match(html, /<h1[^>]*>12 Axes<br\/><em>Political Test<\/em><\/h1>/);
  assert.match(html, /rel="canonical"/);
  assert.match(html, /hrefLang="pt-BR"/);
  assert.match(html, /"@type":"WebApplication"/);
  assert.match(html, /"@type":"FAQPage"/);
  assert.doesNotMatch(html, /profitableratecpmnetwork|Adsterra|<script[^>]+googletagmanager/i);
});

test("renders localized homes and SEO pages", async () => {
  const home = await (await render("/zh")).text();
  const page = await (await render("/es/ideologies")).text();
  assert.match(home, /<html lang="zh-CN">/);
  assert.match(home, /12 Axes 中文版/);
  assert.match(home, /12 轴政治测试/);
  assert.match(page, /<html lang="es">/);
  assert.match(page, /Ideologías de 12Axes/);
});

test("serves all six commerce pages in each language", async () => {
  for (const locale of ["", "/pt", "/es", "/ru", "/zh"]) {
    for (const page of ["privacy", "terms", "refund", "pricing", "about", "contact"]) {
      const response = await render(locale + "/" + page);
      const html = await response.text();
      assert.equal(response.status, 200);
      assert.match(html, /<h1/);
      assert.doesNotMatch(html, /profitableratecpmnetwork|Adsterra|<script[^>]+googletagmanager/i);
      if (page === "privacy") assert.match(html, /Stripe/);
      if (page === "refund") assert.match(html, /type="email"/);
    }
  }
});

test("renders localized privacy controls and pricing in every language", async () => {
  const translations = [
    ["", "Analytics settings", "Pricing"],
    ["/pt", "Configurações de análise", "Preços"],
    ["/es", "Configuración de analítica", "Precios"],
    ["/ru", "Настройки аналитики", "Цены"],
    ["/zh", "分析设置", "定价"],
  ];
  for (const [prefix, settings, pricing] of translations) {
    const privacyHtml = await (await render(prefix + "/privacy")).text();
    const pricingHtml = await (await render(prefix + "/pricing")).text();
    assert.ok(privacyHtml.includes(settings));
    assert.ok(pricingHtml.includes(`<h1>${pricing}</h1>`));
  }
});

test("shared and paid result routes are noindex and do not echo access secrets", async () => {
  for (const path of ["/results?share=synthetic-share", "/pt/results?paid=1", "/zh/results?cancelled=1"]) {
    const response = await render(path);
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.match(html, /<meta name="robots" content="noindex, follow"/);
    assert.match(html, /rel="canonical"[^>]+\/results/);
  }
  const sitemap = await (await render("/sitemap.xml")).text();
  assert.match(sitemap, /\/zh\/pricing/);
  assert.doesNotMatch(sitemap, /\?share=|\?est=/);
});

test("preserves published seller record without loading advertisements", async () => {
  const expected = "google.com, pub-6112182006844125, DIRECT, f08c47fec0942fa0\n";
  assert.equal(await readFile(new URL("../public/ads.txt", import.meta.url), "utf8"), expected);
});

test("keeps all five existing question banks intact pending content review", async () => {
  let structure;
  for (const locale of ["en", "pt", "es", "ru", "zh"]) {
    const quiz = JSON.parse(await readFile(new URL(`../public/data/quiz.${locale}.json`, import.meta.url), "utf8"));
    assert.equal(quiz.questions.length, 240);
    assert.equal(quiz.axes.length, 12);
    assert.equal(quiz.answerOptions.length, 5);
    const current = {
      questions: quiz.questions.map(({ id, axisId, agreePole, weight }) => ({ id, axisId, agreePole, weight })),
      axes: quiz.axes.map(axis => axis.id),
      options: quiz.answerOptions.map(({ id, scoreTowardAgreement }) => ({ id, scoreTowardAgreement })),
    };
    if (structure) assert.deepEqual(current, structure, "Language changes must preserve question IDs, scoring and axis order");
    structure = current;
  }
});

test("matching profiles and API results are localized in all five languages", async () => {
  const catalog = JSON.parse(await readFile(new URL("../app/data/matching.json", import.meta.url), "utf8"));
  const translations = JSON.parse(await readFile(new URL("../app/data/matching-translations.json", import.meta.url), "utf8"));
  for (const group of ["ideologies", "countries", "personalities"]) {
    for (const profile of catalog[group]) {
      for (const locale of ["es", "ru", "zh"]) {
        for (const field of group === "personalities" ? ["name", "role", "description"] : ["name", "category", "description"]) {
          assert.ok(translations[group][profile.id]?.[locale]?.[field], `${group}/${profile.id}/${locale}/${field}`);
        }
      }
    }
  }
  const axes = Array(12).fill(50);
  const responses = {};
  for (const locale of ["en", "pt", "es", "ru", "zh"]) {
    const response = await runtime.request("/api/match", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ axes, locale }),
    });
    assert.equal(response.status, 200);
    responses[locale] = await response.json();
  }
  for (const locale of ["pt", "es", "ru", "zh"]) {
    assert.deepEqual(responses[locale].matches.map(match => [match.ideologyId, match.compatibility]), responses.en.matches.map(match => [match.ideologyId, match.compatibility]));
  }
  const ideologyId = responses.en.topMatch.ideologyId;
  const countryId = catalog.countries.find((item) => item.name.en === responses.en.topCountryMatch.name).id;
  const personalityId = catalog.personalities.find((item) => item.name.en === responses.en.topPersonalityMatch.name).id;
  for (const locale of ["es", "ru", "zh"]) {
    assert.equal(responses[locale].topMatch.name, translations.ideologies[ideologyId][locale].name);
    assert.equal(responses[locale].topMatch.description, translations.ideologies[ideologyId][locale].description);
    assert.equal(responses[locale].topCountryMatch.name, translations.countries[countryId][locale].name);
    assert.equal(responses[locale].topPersonalityMatch.role, translations.personalities[personalityId][locale].role);
  }
  assert.equal(catalog.personalities.find((item) => item.id === "andy-burnham").role.en, "Mayor of Greater Manchester");
  assert.equal(translations.personalities.lenin.ru.role, "Революционер");
  assert.equal(translations.personalities.lenin.zh.role, "革命家");
});
