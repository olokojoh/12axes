import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
await mkdir(root + "output/tests", { recursive: true });
const copyPath = root + "output/tests/share-copy-" + process.pid + ".mjs";
await build({ entryPoints: [root + "app/share-copy.ts"], bundle: true, platform: "node", format: "esm", outfile: copyPath });
const { platformShareUrls, resultShareText, shareCopy } = await import(copyPath);

const target = "https://preview.12axes-1dg.pages.dev/share/Abc123?locale=zh&v=1";
const message = "中心 & 自由 / 12Axes：你呢？ + # 100%";
test("platform URLs preserve unicode, delimiters and the current deployment URL", () => {
  const links = platformShareUrls(target, message);
  assert.equal(new URL(links.X).searchParams.get("text"), message);
  assert.equal(new URL(links.X).searchParams.get("url"), target);
  assert.equal(new URL(links.Facebook).searchParams.get("u"), target);
  assert.equal(new URL(links.WhatsApp).searchParams.get("text"), message + " " + target);
  assert.equal(new URL(links.Telegram).searchParams.get("url"), target);
  assert.equal(new URL(links.Telegram).searchParams.get("text"), message);
  assert.equal(new URL(links.Reddit).searchParams.get("url"), target);
  assert.equal(new URL(links.Reddit).searchParams.get("title"), message);
  for (const link of Object.values(links)) assert.equal(new URL(link).protocol, "https:");
});

test("all five share experiences have complete copy and use the current result", () => {
  for (const locale of ["en", "pt", "es", "ru", "zh"]) {
    assert.deepEqual(Object.keys(shareCopy[locale]).sort(), Object.keys(shareCopy.en).sort());
    for (const value of Object.values(shareCopy[locale])) assert.ok(value.length > 0);
    const text = resultShareText(locale, "A & B", 86.5);
    assert.ok(text.includes("A & B")); assert.ok(text.includes("86.5"));
    assert.doesNotMatch(text, /\{name\}|\{score\}/);
  }
});

const cardPath = root + "output/tests/share-card-" + process.pid + ".mjs";
await build({ entryPoints: [root + "app/lib/share-card.ts"], bundle: true, platform: "node", format: "esm", outfile: cardPath,
  plugins: [{ name: "qr-canvas-test", setup(builder) {
    builder.onResolve({ filter: /^qrcode\/lib\/browser$/ }, () => ({ path: "qrcode", namespace: "test" }));
    builder.onLoad({ filter: /.*/, namespace: "test" }, () => ({ contents: "export async function toCanvas(canvas, url, options) { globalThis.qrCalls.push({url, options}); }", loader: "js" }));
  } }],
});
const { generateShareCard } = await import(cardPath);
const result = { topMatch: { name: "A & B", compatibility: 86.5 }, axes: Array.from({ length: 12 }, (_, i) => ({ axisId: String(i), label: "Axis " + i, leftPole: "Left", rightPole: "Right", leftPercent: 40, rightPercent: 60 })) };
function canvasDocument(blob) {
  const canvases = [], text = [];
  const ctx = { fillRect() {}, fillText(value) { text.push(value); }, measureText(value) { return { width: value.length * 9 }; }, drawImage() {} };
  globalThis.qrCalls = [];
  globalThis.document = { fonts: { ready: Promise.resolve() }, createElement: () => {
    const canvas = { width: 0, height: 0, getContext: () => ctx, toBlob(callback, type) { assert.equal(type, "image/png"); callback(blob); } };
    canvases.push(canvas); return canvas;
  } };
  return { canvases, text };
}

test("both cards contain the match, all axes and a QR for the public deployment URL", async () => {
  for (const [format, width, height] of [["portrait", 1080, 1920], ["landscape", 1200, 630]]) {
    const expected = new Blob(["png"], { type: "image/png" });
    const mock = canvasDocument(expected);
    const blob = await generateShareCard(result, "zh", target, format);
    assert.equal(blob, expected);
    assert.equal(mock.canvases[0].width, width); assert.equal(mock.canvases[0].height, height);
    assert.ok(mock.text.includes("A & B"));
    for (const axis of result.axes) assert.ok(mock.text.includes(axis.label));
    assert.equal(globalThis.qrCalls.length, 1); assert.equal(globalThis.qrCalls[0].url, target);
  }
});

test("failed canvas export rejects instead of leaving preparation pending", async () => {
  canvasDocument(null);
  await assert.rejects(generateShareCard(result, "en", target, "landscape"), /PNG export failed/);
});
