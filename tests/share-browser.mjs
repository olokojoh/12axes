import assert from "node:assert/strict";

// Run with ego-browser against localhost. Public creation/upload and native sharing are stubbed; scoring and Canvas rendering are real.
export async function verifySharing(page, base = "http://localhost:3000") {
  const origin = new URL(base).origin;
  assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(new URL(origin).hostname));
  const query = "?est=75&rep=20&pod=70&imi=35&dip=60&int=45&eco=65&con=30&com=55&rel=25&mor=85&tec=40";
  await page.goto(origin + "/results" + query);
  await page.waitForSelector(".social-share-panel");
  await page.evaluate(() => {
    const state = window.__shareQA = { postCount: 0, uploads: [], native: [], copied: [], downloads: 0, failUpload: false, failCopy: false, nullBlob: false, fileSupport: true, nativeMode: "success", urls: [], revoked: [] };
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const url = new URL(args[0] instanceof Request ? args[0].url : String(args[0]), location.href);
      const options = args[1] ?? {};
      if (url.pathname !== "/api/share") return originalFetch(...args);
      if (options.method === "POST") {
        state.postCount++;
        const input = JSON.parse(options.body); state.lastInput = input;
        const id = "synthetic-" + state.postCount;
        return new Response(JSON.stringify({ id, uploadToken: "synthetic-upload", url: `https://12axes.test/${input.locale}/share/${id}`, imageUrl: `https://12axes.test/api/share/${id}/image`, ready: false }), { headers: { "content-type": "application/json" } });
      }
      if (options.method === "PUT") {
        const image = options.body.get("image"), bitmap = await createImageBitmap(image);
        state.uploads.push({ id: options.body.get("id"), type: image.type, size: image.size, width: bitmap.width, height: bitmap.height }); bitmap.close();
        return new Response(JSON.stringify({ ready: !state.failUpload }), { status: state.failUpload ? 503 : 200, headers: { "content-type": "application/json" } });
      }
      throw new Error("Unexpected share API operation");
    };
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async value => { if (state.failCopy) throw new Error("Clipboard unavailable"); state.copied.push(value); } } });
    state.shareFunction = async value => {
      state.native.push({ fileCount: value.files?.length ?? 0, fileType: value.files?.[0]?.type, size: value.files?.[0]?.size, fileName: value.files?.[0]?.name, title: value.title, text: value.text, url: value.url, activated: navigator.userActivation.isActive });
      if (state.nativeMode === "cancel") throw new DOMException("User canceled", "AbortError");
      if (state.nativeMode === "error") throw new Error("Native sharing failed");
    };
    Object.defineProperty(navigator, "share", { configurable: true, value: state.shareFunction });
    Object.defineProperty(navigator, "canShare", { configurable: true, value: payload => state.fileSupport && payload.files?.[0] instanceof File && payload.files[0].type === "image/png" });
    const originalToBlob = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob = function(callback, ...rest) { if (state.nullBlob) { callback(null); return; } return originalToBlob.call(this, callback, ...rest); };
    const create = URL.createObjectURL.bind(URL), revoke = URL.revokeObjectURL.bind(URL);
    URL.createObjectURL = blob => { const url = create(blob); state.urls.push(url); return url; };
    URL.revokeObjectURL = url => { state.revoked.push(url); return revoke(url); };
    document.addEventListener("click", event => { if (event.target.closest?.("a[download]")) state.downloads++; }, true);
  });
  const state = () => page.evaluate(() => ({ ...window.__shareQA, shareFunction: undefined }));
  async function waitStatus(value) { await page.waitForFunction(expected => document.querySelector(".share-status")?.textContent === expected, value); }
  async function prepare() {
    await page.press(".share-panel-content > button", "Enter");
    await page.waitForFunction(() => !document.querySelector(".share-panel-content > button:disabled") && !!document.querySelector(".share-link-label input"));
  }
  async function set(options) { await page.evaluate(options => Object.assign(window.__shareQA, options), options); }

  await page.press(".social-share-panel > summary", "Enter");
  assert.equal(await page.evaluate(() => document.querySelector(".social-share-panel .result-consent input").checked), false);
  assert.equal(await page.evaluate(() => document.querySelector(".share-panel-content > button").disabled), true);
  await page.press(".social-share-panel .result-consent input", "Space");
  await prepare();
  await waitStatus("Your link and images are ready.");
  const first = await state();
  assert.equal(first.postCount, 1); assert.equal(first.uploads.length, 1);
  assert.deepEqual([first.uploads[0].width, first.uploads[0].height, first.uploads[0].type], [1200, 630, "image/png"]);
  assert.ok(first.uploads[0].size > 10000 && first.uploads[0].size < 1024 * 1024);
  assert.equal(first.lastInput.consent, true); assert.equal(first.lastInput.axes.length, 12);
  assert.equal(first.urls.length, 2);
  assert.equal(await page.evaluate(() => document.querySelector(".social-share-panel .result-consent input").disabled), true, "Published consent must not imply that unchecking removes a public link");
  assert.equal(await page.evaluate(() => document.querySelector(".share-public-notice a").getAttribute("href")), "/contact");

  await page.press(".share-main-actions .secondary-button", "Enter"); await waitStatus("Text and link copied.");
  assert.match((await state()).copied[0], /Traditionalism.*https:\/\/12axes\.test\/en\/share\/synthetic-1/);
  await set({ failCopy: true }); await page.press(".share-main-actions .secondary-button", "Enter"); await waitStatus("Please manually copy the link below.");
  assert.equal(await page.evaluate(() => document.activeElement === document.querySelector(".share-link-label input") && document.activeElement.selectionEnd === document.activeElement.value.length), true);
  await set({ failCopy: false });

  for (const image of [false, true]) {
    const selector = image ? ".share-main-actions .primary-button" : ".share-extra-actions button:first-child";
    await set({ nativeMode: "success" }); await page.press(selector, "Enter");
    await waitStatus("System sharing finished. The receiving app controls whether it is posted.");
    const call = (await state()).native.at(-1);
    assert.equal(call.activated, true, "Native share needs the original user activation");
    assert.equal(call.fileCount, image ? 1 : 0);
    if (image) { assert.equal(call.fileType, "image/png"); assert.ok(call.size > 10000); }
    else assert.match(call.url, /^https:\/\/12axes\.test\/en\/share\//);
    await set({ nativeMode: "cancel" }); await page.press(selector, "Enter"); await waitStatus("Sharing canceled.");
    assert.equal((await state()).downloads, 0, "Cancel must not trigger a download");
    await set({ nativeMode: "error" }); await page.press(selector, "Enter");
    await waitStatus("Sharing failed. Use the copy, open image or download options below.");
    assert.equal((await state()).downloads, 0);
  }
  await set({ fileSupport: false });
  const calls = (await state()).native.length;
  await page.press(".share-main-actions .primary-button", "Enter");
  await waitStatus("This browser cannot share image files. Preview, save or download the image below.");
  await page.waitForSelector(".share-image-preview img");
  await page.waitForFunction(() => document.querySelector(".share-image-preview img")?.naturalWidth === 1080);
  assert.equal((await state()).native.length, calls); assert.equal((await state()).downloads, 0);
  assert.deepEqual(await page.evaluate(() => { const img = document.querySelector(".share-image-preview img"); return [img.naturalWidth, img.naturalHeight]; }), [1080, 1920]);
  await page.press(".share-image-formats button:last-child", "Enter");
  await page.waitForFunction(() => document.querySelector(".share-image-preview img")?.naturalWidth === 1200);
  assert.equal(await page.evaluate(() => document.querySelector(".share-image-preview img").naturalHeight), 630);
  await page.evaluate(() => Object.defineProperty(navigator, "share", { configurable: true, value: undefined }));
  await page.press(".share-extra-actions button:first-child", "Enter");
  await waitStatus("System sharing is unavailable here. Use a platform button or copy the link.");
  await page.evaluate(() => Object.defineProperty(navigator, "share", { configurable: true, value: window.__shareQA.shareFunction }));

  const links = await page.evaluate(() => [...document.querySelectorAll(".share-platforms a")].map(a => ({ name: a.textContent, url: a.href, rel: a.rel, target: a.target })));
  assert.equal(links.length, 5);
  for (const link of links) { assert.equal(new URL(link.url).protocol, "https:"); assert.equal(link.target, "_blank"); assert.match(link.rel, /noopener/); assert.match(link.rel, /noreferrer/); }
  assert.equal(new URL(links.find(link => link.name === "Telegram").url).searchParams.get("url"), "https://12axes.test/en/share/synthetic-1");

  for (const locale of ["pt", "es", "ru", "zh"]) {
    await page.selectOption('select[aria-label="Language"]', locale);
    await page.waitForFunction(locale => document.documentElement.lang.startsWith(locale) && document.querySelector(".share-panel-content > button") && !document.querySelector(".share-link-label input"), locale);
    assert.equal(await page.evaluate(() => document.querySelector(".social-share-panel").open), true);
    assert.equal(await page.evaluate(() => document.querySelector(".social-share-panel .result-consent input").checked), true);
    assert.equal(await page.evaluate(() => document.querySelector(".social-share-panel .result-consent input").disabled), true, "Published status survives language changes");
    assert.equal(await page.evaluate(() => document.querySelector(".share-public-notice a").getAttribute("href")), `/${locale}/contact`);
    await prepare();
    const current = await state();
    assert.equal(current.lastInput.locale, locale);
    assert.equal(current.uploads.at(-1).width, 1200);
    assert.equal(current.uploads.at(-1).height, 630);
    assert.equal(await page.evaluate(() => document.querySelector(".share-link-label input").value), `https://12axes.test/${locale}/share/synthetic-${current.postCount}`);
  }
  assert.equal((await state()).revoked.length, 8, "Language changes release both cached images");

  await page.selectOption('select[aria-label="Language"]', "en");
  await page.waitForFunction(() => document.querySelector(".share-panel-content > button")?.textContent === "Create share link and images");
  await set({ failUpload: true }); await prepare();
  await waitStatus("Your link works, but its image preview is not ready. You can copy the link or retry preparing images.");
  assert.equal(await page.evaluate(() => document.querySelectorAll(".share-platforms a").length), 5);
  assert.equal(await page.evaluate(() => document.querySelector(".share-panel-content > button").textContent), "Retry preparing images");
  const failed = await state();
  await set({ failUpload: false }); await prepare(); await waitStatus("Your link and images are ready.");
  assert.equal((await state()).postCount, failed.postCount, "Upload retry reuses the existing public link");
  assert.equal((await state()).urls.length, failed.urls.length, "Upload retry reuses cached images");

  await page.selectOption('select[aria-label="Language"]', "zh");
  await page.waitForFunction(() => document.querySelector(".share-panel-content > button")?.textContent === "生成分享链接和图片");
  await set({ nullBlob: true }); await prepare();
  await waitStatus("链接可以访问，但图片预览尚未准备好。你可以先复制链接，或重新准备图片。");
  assert.equal(await page.evaluate(() => document.querySelector(".share-panel-content > button").disabled), false);
  assert.equal(await page.evaluate(() => document.querySelector(".share-main-actions .primary-button").disabled), true);
  assert.equal(await page.evaluate(() => document.querySelectorAll(".share-platforms a").length), 5);
  await set({ nullBlob: false }); await prepare(); await waitStatus("分享链接和图片已准备好。");
  assert.equal((await state()).downloads, 0, "No fallback silently downloaded any files");
  console.log("Sharing browser checks passed: 5 languages, 2 real PNG dimensions, consent, copy success/failure, 6 native outcomes, unsupported link/file, 5 platform links, language state/cache cleanup, upload retry and null-Blob recovery. No platform posts or real share records.");
  return { languages: 5, nativeOutcomes: 6, platformLinks: 5, pngDimensions: [[1200, 630], [1080, 1920]], ...await page.evaluate(() => ({ publicMocks: window.__shareQA.postCount, imageUploads: window.__shareQA.uploads.length, nativeCalls: window.__shareQA.native.length, automaticDownloads: window.__shareQA.downloads })) };
}
