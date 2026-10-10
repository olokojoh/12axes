import assert from "node:assert/strict";
import test, { before, after } from "node:test";
import { deflateSync } from "node:zlib";
import { createRuntime } from "./runtime.mjs";

let runtime;
before(async () => { runtime = await createRuntime({ bindings: { PUBLIC_BASE_URL: "https://dev.12axes.test" } }); });
after(async () => { await runtime?.mf.dispose(); });
const result = { axes: [25, 80, 45, 75, 60, 20, 80, 40, 55, 90, 35, 75], locale: "en", quizLength: 36, variant: "baseline", consent: true };
const post = (body) => runtime.request("/api/share", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

function png(width = 1200, height = 630, shade = 240) {
  const chunk = (type, data) => {
    const body = Buffer.concat([Buffer.from(type), data]);
    let crc = 0xffffffff;
    for (const value of body) { crc ^= value; for (let bit = 0; bit < 8; bit++) crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1; }
    const length = Buffer.alloc(4), checksum = Buffer.alloc(4);
    length.writeUInt32BE(data.length); checksum.writeUInt32BE((crc ^ 0xffffffff) >>> 0);
    return Buffer.concat([length, body, checksum]);
  };
  const header = Buffer.alloc(13); header.writeUInt32BE(width, 0); header.writeUInt32BE(height, 4); header[8] = 8; header[9] = 6;
  const raw = Buffer.alloc((width * 4 + 1) * height, shade);
  for (let i = 0; i < height; i++) raw[i * (width * 4 + 1)] = 0;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", header), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}
const image = png();
function upload(share, bytes = image, type = "image/png") {
  const body = new FormData();
  body.set("id", share.id); body.set("uploadToken", share.uploadToken); body.set("image", new Blob([bytes], { type }), "card.png");
  return runtime.request("/api/share", { method: "PUT", body });
}
function path(url) { return new URL(url).pathname; }

test("robots permits public preview images while keeping other API routes excluded", async () => {
  const robots = await (await runtime.request("/robots.txt")).text();
  const rules = [...robots.matchAll(/^(Allow|Disallow):\s*(\S+)$/gm)].map(([, action, prefix]) => ({ action, prefix }));
  const actionFor = pathname => rules.filter(rule => pathname.startsWith(rule.prefix)).sort((a, b) => b.prefix.length - a.prefix.length)[0]?.action;
  assert.equal(actionFor("/share/" + "a".repeat(43)), "Allow");
  assert.equal(actionFor("/api/share/" + "a".repeat(43) + "/image.png"), "Allow");
  assert.equal(actionFor("/api/report"), "Disallow");
});

for (const locale of ["en", "pt", "es", "ru", "zh"]) {
  test(`${locale}: ready share serves server-rendered social metadata and public PNG without a cookie`, async () => {
    const creation = await post({ ...result, locale, reportToken: "private-paid-token-must-not-leak", answers: ["private-answer"] });
    assert.equal(creation.status, 200);
    const share = await creation.json();
    assert.equal(share.ready, false);
    assert.match(share.uploadToken, /^[A-Za-z0-9_-]{43}$/);
    assert.equal(share.url, "https://dev.12axes.test" + (locale === "en" ? "" : "/" + locale) + "/share/" + share.id);
    assert.equal(share.imageUrl, "https://dev.12axes.test/api/share/" + share.id + "/image.png");
    const pending = await runtime.request(path(share.url));
    assert.equal(pending.status, 200);
    const pendingHtml = await pending.text();
    assert.doesNotMatch(pendingHtml, /og:image|twitter:image|summary_large_image/);
    assert.match(pendingHtml, /twitter:card" content="summary"/);
    assert.equal((await runtime.request(path(share.imageUrl))).status, 404);
    const ready = await upload(share);
    assert.equal(ready.status, 200); assert.equal((await ready.json()).ready, true);
    const response = await runtime.request(path(share.url));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "text/html; charset=utf-8");
    assert.match(response.headers.get("x-robots-tag"), /noindex/);
    const html = await response.text();
    for (const tag of ["og:type", "og:url", "og:title", "og:description", "og:image", "og:image:type", "og:image:width", "og:image:height", "og:image:alt", "twitter:card", "twitter:title", "twitter:description", "twitter:image", "twitter:image:alt"]) assert.equal((html.match(new RegExp('(?:name|property)="' + tag + '"', "g")) ?? []).length, 1, tag);
    assert.match(html, /twitter:card" content="summary_large_image"/);
    assert.match(html, /og:image:width" content="1200"/); assert.match(html, /og:image:height" content="630"/);
    assert.ok(html.includes('rel="canonical" href="' + share.url + '"'));
    assert.ok(html.includes('property="og:image" content="' + share.imageUrl + '"'));
    assert.equal((html.match(/<li>/g) ?? []).length, 12);
    assert.doesNotMatch(html, /<script|#report=|reportToken|private-paid-token|private-answer|uploadToken|upload_token/);
    assert.ok(!html.includes(share.uploadToken));
    assert.ok(html.includes("/results?share=" + share.id));
    const dataResponse = await runtime.request("/api/share?id=" + share.id);
    assert.deepEqual(await dataResponse.json(), { axes: result.axes, quizLength: 36, locale });
    const pngResponse = await runtime.request(path(share.imageUrl));
    assert.equal(pngResponse.status, 200); assert.equal(pngResponse.headers.get("content-type"), "image/png");
    assert.equal(Number(pngResponse.headers.get("content-length")), image.length);
    assert.equal(pngResponse.headers.get("cache-control"), "no-store");
    assert.deepEqual(Buffer.from(await pngResponse.arrayBuffer()), image);
    const head = await runtime.request(path(share.imageUrl), { method: "HEAD" });
    assert.equal(head.status, 200); assert.equal(head.headers.get("content-type"), "image/png");
    assert.equal(Number(head.headers.get("content-length")), image.length); assert.equal((await head.arrayBuffer()).byteLength, 0);
    const htmlHead = await runtime.request(path(share.url), { method: "HEAD" });
    assert.equal(htmlHead.status, 200); assert.equal((await htmlHead.arrayBuffer()).byteLength, 0);
    const stored = await runtime.db.prepare("SELECT * FROM share_cards WHERE share_id = ?").bind(share.id).first();
    assert.notEqual(stored.upload_token_hash, share.uploadToken);
    assert.ok(!stored.image_payload.includes(image.toString("base64")));
    assert.equal(stored.image_bytes, image.length);
  });
}

test("image uploads require the private capability and validate format, dimensions, CRC and size", async () => {
  const share = await (await post(result)).json();
  assert.equal((await upload({ ...share, uploadToken: "z".repeat(43) })).status, 404);
  assert.equal((await upload(share, image, "image/jpeg")).status, 400);
  assert.equal((await upload(share, Buffer.from("not a png"))).status, 400);
  assert.equal((await upload(share, png(1199, 630))).status, 400);
  const badCrc = Buffer.from(image); badCrc[badCrc.length - 1] ^= 1;
  assert.equal((await upload(share, badCrc)).status, 400);
  assert.equal((await upload(share, Buffer.alloc(1024 * 1024 + 1))).status, 413);
  assert.equal((await runtime.request("/api/share", { method: "PUT", headers: { "content-type": "multipart/form-data; boundary=missing" }, body: "invalid" })).status, 400);
  assert.equal((await runtime.request(path(share.imageUrl))).status, 404);
  assert.equal((await upload(share)).status, 200);
});

test("a committed share image cannot be replaced; retries do not break published previews", async () => {
  const share = await (await post(result)).json();
  assert.equal((await upload(share)).status, 200);
  assert.equal((await upload(share, png(1200, 630, 30))).status, 200);
  assert.deepEqual(Buffer.from(await (await runtime.request(path(share.imageUrl))).arrayBuffer()), image);
});

test("expired shares are absent from JSON, HTML, image GET/HEAD and further uploads", async () => {
  const share = await (await post(result)).json();
  assert.equal((await upload(share)).status, 200);
  await runtime.db.prepare("UPDATE shared_results SET expires_at = ? WHERE id = ?").bind(Math.floor(Date.now() / 1000) + 10, share.id).run();
  const cache = (await runtime.request(path(share.imageUrl))).headers.get("cache-control");
  assert.equal(cache, "no-store");
  await runtime.db.prepare("UPDATE shared_results SET expires_at = 1 WHERE id = ?").bind(share.id).run();
  for (const endpoint of ["/api/share?id=" + share.id, path(share.url), path(share.imageUrl)]) {
    const response = await runtime.request(endpoint);
    assert.equal(response.status, 404); assert.equal(response.headers.get("cache-control"), "no-store");
  }
  assert.equal((await runtime.request(path(share.imageUrl), { method: "HEAD" })).status, 404);
  assert.equal((await upload(share)).status, 404);
});

test("legacy shared result records remain accessible without a social image", async () => {
  const share = await (await post(result)).json();
  await runtime.db.prepare("DELETE FROM share_cards WHERE share_id = ?").bind(share.id).run();
  assert.deepEqual(await (await runtime.request("/api/share?id=" + share.id)).json(), { axes: result.axes, quizLength: 36, locale: "en" });
});
