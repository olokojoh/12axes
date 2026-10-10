import assert from "node:assert/strict";

// Run with ego-browser against localhost. Public creation/upload and native sharing are stubbed; scoring and Canvas rendering are real.
export async function verifySharing(page, base = "http://localhost:3000") {
  const origin = new URL(base).origin;
  assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(new URL(origin).hostname));
  const query = "?est=75&rep=20&pod=70&imi=35&dip=60&int=45&eco=65&con=30&com=55&rel=25&mor=85&tec=40";
  await page.goto(origin + "/results" + query);
  await page.waitForSelector(".social-share-panel");
  await page.evaluate(() => {
    const state = window.__shareQA = { postCount: 0, uploads: [], native: [], copied: [], downloads: 0, failUpload: false, failCopy: false, nullBlob: false, fileSupport: true, nativeMode: "success", urls: [], revoked: [], popups: [], popupBlocked: false, forceInactive: false, delayShare: 0, clipboardWrites: [] };
    const originalActivation = navigator.userActivation;
    Object.defineProperty(navigator, "userActivation", { configurable: true, get: () => state.forceInactive ? { isActive: false } : originalActivation });
    window.open = () => {
      if (state.popupBlocked) return null;
      const popup = { opener: window, closed: false, document: document.implementation.createHTMLDocument(""), location: { replace: url => { state.popups.at(-1).url = url; state.popups.at(-1).uploadsAtNavigation = state.uploads.length; } }, close() { this.closed = true; } };
      state.popups.push({ activated: navigator.userActivation.isActive, popup });
      return popup;
    };
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const url = new URL(args[0] instanceof Request ? args[0].url : String(args[0]), location.href);
      const options = args[1] ?? {};
      if (url.pathname !== "/api/share") return originalFetch(...args);
      if (options.method === "POST") {
        state.postCount++;
        if (state.delayShare) await new Promise(resolve => setTimeout(resolve, state.delayShare));
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
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: {
      writeText: async value => { if (state.failCopy) throw new Error("Clipboard unavailable"); state.copied.push(value); },
      write: async items => {
        state.clipboardWrites.push({ activated: navigator.userActivation.isActive, uploadsAtCall: state.uploads.length });
        if (state.failCopy) throw new Error("Clipboard unavailable");
        state.copied.push(await (await items[0].getType("text/plain")).text());
      },
    } });
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
  const state = () => page.evaluate(() => ({ ...window.__shareQA, shareFunction: undefined, popups: window.__shareQA.popups.map(({ popup, ...rest }) => ({ ...rest, closed: popup.closed, openerNull: popup.opener === null })) }));
  async function waitStatus(value) { await page.waitForFunction(expected => document.querySelector(".share-status")?.textContent === expected, value); }
  async function set(options) { await page.evaluate(options => Object.assign(window.__shareQA, options), options); }
  async function waitReady() { await page.waitForFunction(() => !!document.querySelector(".share-link-label input") && !document.querySelector(".share-main-actions button:disabled")); }

  assert.equal(await page.evaluate(() => document.querySelectorAll(".social-share-panel input[type=checkbox],.social-share-panel summary").length), 0);
  assert.equal(await page.evaluate(() => document.querySelectorAll(".share-platforms button").length), 5);
  assert.equal((await state()).postCount, 0, "Showing the result must not publish it");
  await page.hover(".share-platforms .social-x");
  assert.equal((await state()).postCount, 0, "Hover must not publish a result");
  await page.press(".share-platforms .social-x", "Enter"); await waitReady();
  await waitStatus("The platform sharing screen is open. You choose whether to publish.");
  const first = await state();
  assert.equal(first.postCount, 1); assert.equal(first.uploads.length, 1);
  assert.deepEqual([first.uploads[0].width, first.uploads[0].height, first.uploads[0].type], [1200, 630, "image/png"]);
  assert.ok(first.uploads[0].size > 10000 && first.uploads[0].size < 1024 * 1024);
  assert.equal(first.lastInput.consent, true); assert.equal(first.lastInput.axes.length, 12);
  assert.equal(first.popups[0].activated, true); assert.equal(first.popups[0].openerNull, true);
  assert.equal(first.popups[0].uploadsAtNavigation, 1, "Platform navigation waits for uploaded OG image");
  assert.equal(new URL(first.popups[0].url).searchParams.get("url"), "https://12axes.test/en/share/synthetic-1");

  for (const platform of ["facebook", "whatsapp", "telegram", "reddit"]) await page.press(".share-platforms .social-" + platform, "Enter");
  assert.equal((await state()).postCount, 1, "Warm platform actions reuse the public result");
  const opened = (await state()).popups;
  assert.equal(opened.length, 5);
  assert.equal(new URL(opened[1].url).searchParams.get("u"), "https://12axes.test/en/share/synthetic-1");
  assert.ok(new URL(opened[2].url).searchParams.get("text").endsWith("https://12axes.test/en/share/synthetic-1"));
  assert.equal(new URL(opened[3].url).searchParams.get("url"), "https://12axes.test/en/share/synthetic-1");
  assert.equal(new URL(opened[4].url).searchParams.get("url"), "https://12axes.test/en/share/synthetic-1");
  await set({ popupBlocked: true }); await page.press(".share-platforms .social-x", "Enter");
  await waitStatus("Your link is ready. Allow pop-ups or open the platform using the link below.");
  assert.equal(await page.evaluate(() => document.querySelector(".share-popup-fallback").rel), "noopener noreferrer");
  await set({ popupBlocked: false, forceInactive: false, delayShare: 0, clipboardWrites: [] });

  await page.press(".share-main-actions .share-secondary", "Enter"); await waitStatus("Text and link copied.");
  assert.match((await state()).copied[0], /Traditionalism.*https:\/\/12axes\.test\/en\/share\/synthetic-1/);
  await set({ failCopy: true }); await page.press(".share-main-actions .share-secondary", "Enter"); await waitStatus("Please manually copy the link below.");
  assert.equal(await page.evaluate(() => document.activeElement === document.querySelector(".share-link-label input") && document.activeElement.selectionEnd === document.activeElement.value.length), true);
  await set({ failCopy: false });

  for (const image of [false, true]) {
    const selector = image ? ".share-main-actions .share-primary" : ".share-extra-actions button:first-child";
    await set({ nativeMode: "success" }); await page.press(selector, "Enter");
    await waitStatus("System sharing finished. The receiving app controls whether it is posted.");
    const call = (await state()).native.at(-1);
    assert.equal(call.activated, true); assert.equal(call.fileCount, image ? 1 : 0);
    if (image) { assert.equal(call.fileType, "image/png"); assert.ok(call.size > 10000); }
    await set({ nativeMode: "cancel" }); await page.press(selector, "Enter"); await waitStatus("Sharing canceled.");
    assert.equal((await state()).downloads, 0, "Cancel must not trigger a download");
    await set({ nativeMode: "error" }); await page.press(selector, "Enter");
    await waitStatus("Sharing failed. Use the copy, open image or download options below.");
  }
  await set({ fileSupport: false }); const calls = (await state()).native.length;
  await page.press(".share-main-actions .share-primary", "Enter");
  await waitStatus("This browser cannot share image files. Preview, save or download the image below.");
  await page.waitForFunction(() => document.querySelector(".share-image-preview img")?.naturalWidth === 1080);
  assert.equal((await state()).native.length, calls); assert.equal((await state()).downloads, 0);
  assert.equal(await page.evaluate(() => document.querySelector(".share-image-preview img").naturalHeight), 1920);
  await page.press(".share-image-formats button:last-child", "Enter");
  await page.waitForFunction(() => document.querySelector(".share-image-preview img")?.naturalWidth === 1200);
  assert.equal(await page.evaluate(() => document.querySelector(".share-image-preview img").naturalHeight), 630);

  for (const locale of ["pt", "es", "ru", "zh"]) {
    const before = (await state()).postCount;
    await page.selectOption('select[aria-label="Language"]', locale);
    await page.waitForFunction(locale => document.documentElement.lang.startsWith(locale) && !document.querySelector(".share-link-label input"), locale);
    assert.equal((await state()).postCount, before, "Language changes must not publish a result");
    assert.equal(await page.evaluate(() => document.querySelectorAll(".share-platforms button:not(:disabled)").length), 5);
    await page.press(".share-platforms .social-x", "Enter"); await waitReady();
    const current = await state(); assert.equal(current.lastInput.locale, locale);
    assert.equal(current.uploads.at(-1).width, 1200); assert.equal(current.uploads.at(-1).height, 630);
    assert.equal(await page.evaluate(() => document.querySelector(".share-link-label input").value), `https://12axes.test/${locale}/share/synthetic-${current.postCount}`);
  }
  assert.equal((await state()).revoked.length, 8);

  await page.selectOption('select[aria-label="Language"]', "en");
  await page.waitForFunction(() => document.querySelector(".share-heading h2")?.textContent === "Share result" && !document.querySelector(".share-link-label input"));
  await set({ nativeMode: "success", fileSupport: true, forceInactive: true });
  const beforeNative = (await state()).native.length;
  await page.press(".share-main-actions .share-primary", "Enter");
  await waitStatus("Ready. Tap the system sharing button again to open your device’s share sheet.");
  assert.equal((await state()).native.length, beforeNative, "Cold native sharing must explicitly request a fresh click");
  await set({ forceInactive: false, delayShare: 0, clipboardWrites: [] });
  await page.press(".share-main-actions .share-primary", "Enter");
  await waitStatus("System sharing finished. The receiving app controls whether it is posted.");
  assert.equal((await state()).native.at(-1).activated, true);

  await page.selectOption('select[aria-label="Language"]', "zh");
  await page.waitForFunction(() => document.querySelector(".share-heading h2")?.textContent === "分享结果" && !document.querySelector(".share-link-label input"));
  await set({ failUpload: true }); await page.press(".share-platforms .social-x", "Enter"); await waitReady();
  await waitStatus("链接可以访问，但图片预览尚未准备好。你可以先复制链接，或重新准备图片。");
  assert.equal((await state()).popups.at(-1).closed, true, "Failed preparation closes the temporary popup");
  const failed = await state(); await set({ failUpload: false }); await page.press(".share-retry", "Enter");
  await waitStatus("分享链接和图片已准备好。");
  assert.equal((await state()).postCount, failed.postCount); assert.equal((await state()).urls.length, failed.urls.length);

  await page.selectOption('select[aria-label="Language"]', "pt");
  await page.waitForFunction(() => document.querySelector(".share-heading h2")?.textContent === "Compartilhar resultado" && !document.querySelector(".share-link-label input"));
  await set({ nullBlob: true }); await page.press(".share-platforms .social-x", "Enter"); await waitReady();
  assert.equal(await page.evaluate(() => !!document.querySelector(".share-retry")), true);
  assert.equal(await page.evaluate(() => !!document.querySelector(".share-main-actions button:disabled")), false);
  await set({ nullBlob: false }); await page.press(".share-retry", "Enter"); await waitStatus("Seu link e suas imagens estão prontos.");
  assert.equal((await state()).downloads, 0);
  await page.selectOption('select[aria-label="Language"]', "en");
  await page.waitForFunction(() => document.querySelector(".share-heading h2")?.textContent === "Share result" && !document.querySelector(".share-link-label input"));
  const activeColdBefore = (await state()).native.length;
  await page.press(".share-main-actions .share-primary", "Enter");
  await waitStatus("System sharing finished. The receiving app controls whether it is posted.");
  assert.equal((await state()).native.length, activeColdBefore + 1, "Cold sharing continues in one click while activation is retained");
  assert.equal((await state()).native.at(-1).activated, true);
  await page.selectOption('select[aria-label="Language"]', "pt");
  await page.waitForFunction(() => document.querySelector(".share-heading h2")?.textContent === "Compartilhar resultado" && !document.querySelector(".share-link-label input"));
  const unsupportedBefore = (await state()).postCount;
  await page.evaluate(() => Object.defineProperty(navigator, "share", { configurable: true, value: undefined }));
  await page.press(".share-extra-actions button:first-child", "Enter");
  await waitStatus("O compartilhamento pelo sistema não está disponível. Use um botão de plataforma ou copie o link.");
  assert.equal((await state()).postCount, unsupportedBefore, "Unavailable native link sharing must not publish a result");
  await page.evaluate(() => Object.defineProperty(navigator, "share", { configurable: true, value: window.__shareQA.shareFunction }));
  const delayedBefore = (await state()).uploads.length;
  await set({ delayShare: 150 });
  await page.press(".share-main-actions .share-secondary", "Enter");
  await waitStatus("Texto e link copiados.");
  const delayedWrite = (await state()).clipboardWrites.at(-1);
  assert.equal(delayedWrite.activated, true, "Cold ClipboardItem write starts under the original click");
  assert.equal(delayedWrite.uploadsAtCall, delayedBefore, "Clipboard permission is requested before image preparation finishes");
  assert.match((await state()).copied.at(-1), /https:\/\/12axes\.test\/pt\/share\//);
  await page.selectOption('select[aria-label="Language"]', "en");
  await page.waitForFunction(() => document.querySelector(".share-heading h2")?.textContent === "Share result" && !document.querySelector(".share-link-label input"));
  await set({ failCopy: true }); await page.press(".share-main-actions .share-secondary", "Enter");
  await waitStatus("Please manually copy the link below.");
  assert.equal((await state()).clipboardWrites.at(-1).activated, true);
  assert.equal(await page.evaluate(() => document.activeElement === document.querySelector(".share-link-label input") && document.activeElement.selectionEnd === document.activeElement.value.length), true);
  await set({ failCopy: false, delayShare: 0 });
  console.log("One-click sharing passed: all 5 visible platforms, deferred publication, safe synchronous popup, uploaded preview before platform navigation, 5 languages, copy fallback, 8 native outcomes including retained/lost cold activation, real PNG dimensions, upload/null-Blob retry, delayed ClipboardItem success/failure and unsupported native nonpublication. No external platform navigation.");
  return { languages: 5, platforms: 5, ...await page.evaluate(() => ({ publicMocks: window.__shareQA.postCount, imageUploads: window.__shareQA.uploads.length, nativeCalls: window.__shareQA.native.length, automaticDownloads: window.__shareQA.downloads })) };
}
