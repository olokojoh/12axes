import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${path}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`https://12axes.test${path}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the English 12axes test and SEO contract", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<html lang="en">/);
  assert.match(html, /<title>12Axes Test — Free Political Ideology Quiz in 12 Axes<\/title>/);
  assert.match(html, /<h1[^>]*>.*Do you really know your.*political ideology/s);
  assert.match(html, /rel="canonical" href="https:\/\/12axes\.test\/"/);
  assert.match(html, /hrefLang="pt-BR"/);
  assert.match(html, /"@type":"WebApplication"/);
  assert.match(html, /"@type":"FAQPage"/);
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview|react-loading-skeleton/);
});

test("server-renders translated language and localized SEO pages", async () => {
  const [homeResponse, pageResponse] = await Promise.all([
    render("/zh"),
    render("/es/ideologies"),
  ]);
  const [home, page] = await Promise.all([homeResponse.text(), pageResponse.text()]);
  assert.match(home, /<html lang="zh-CN">/);
  assert.match(home, /12Axes 测试中文版/);
  assert.match(home, /你真的了解自己的/);
  assert.match(home, /rel="canonical" href="https:\/\/12axes\.test\/zh"/);
  assert.match(page, /<html lang="es">/);
  assert.match(page, /Ideologías de 12Axes/);
  assert.match(page, /rel="canonical" href="https:\/\/12axes\.test\/es\/ideologies"/);
});

test("keeps indexable pages discoverable and shared result URLs out of the index", async () => {
  const [homeResponse, sharedResponse, sitemapResponse, robotsResponse] = await Promise.all([
    render(),
    render("/results?est=50&rep=50&pod=50&imi=50&dip=50&int=50&eco=50&con=50&com=50&rel=50&mor=50&tec=50"),
    render("/sitemap.xml"),
    render("/robots.txt"),
  ]);
  const [home, shared, sitemap, robots] = await Promise.all([
    homeResponse.text(), sharedResponse.text(), sitemapResponse.text(), robotsResponse.text(),
  ]);
  assert.match(home, /href="\/12axes-vs-9axes"/);
  assert.match(home, /href="\/12axes-vs-8values"/);
  assert.match(shared, /<meta name="robots" content="noindex, follow"/);
  assert.match(shared, /rel="canonical" href="https:\/\/12axes\.test\/results"/);
  assert.match(sitemap, /<loc>https:\/\/12axes\.test\/zh\/12axes-vs-8values<\/loc>/);
  assert.doesNotMatch(sitemap, /\?est=/);
  assert.match(robots, /Sitemap: https:\/\/12axes\.test\/sitemap\.xml/);
  assert.match(home, /href="https:\/\/github\.com\/olokojoh\/12axes\/issues"/);
});

test("publishes the authorized ads.txt seller record at the Pages root", async () => {
  const expected = "google.com, pub-6112182006844125, DIRECT, f08c47fec0942fa0\n";
  assert.equal(await readFile(new URL("../public/ads.txt", import.meta.url), "utf8"), expected);
  assert.equal(await readFile(new URL("../dist/client/ads.txt", import.meta.url), "utf8"), expected);
});

test("bundles complete quiz data for all five languages", async () => {
  for (const locale of ["en", "pt", "es", "ru", "zh"]) {
    const quiz = JSON.parse(await readFile(new URL(`../public/data/quiz.${locale}.json`, import.meta.url), "utf8"));
    assert.equal(quiz.questions.length, 240);
    assert.equal(quiz.axes.length, 12);
    assert.equal(quiz.answerOptions.length, 5);
  }
});
