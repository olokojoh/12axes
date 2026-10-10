"use client";

import { useEffect, useRef, useState } from "react";
import { localePath, type Locale } from "./i18n";
import { trackEvent } from "./Analytics";
import { platformShareUrls, resultShareText, shareCopy } from "./share-copy";
import { generateShareCard, type ShareImageFormat, type ShareResult } from "./lib/share-card";
import "./share-panel.css";

type Props = { locale: Locale; axes: number[]; quizLength: number; result: ShareResult };
type PublicShare = { id: string; uploadToken: string; url: string; imageUrl: string };
type Images = Record<ShareImageFormat, { blob: Blob; objectUrl: string; file: File }>;
type Platform = keyof ReturnType<typeof platformShareUrls>;

const platformPaths: Record<Platform, string> = {
  X: "M13.9 10.7 21.3 2h-1.8l-6.4 7.4L8.1 2H2.4l7.8 11.2L2 22h1.8l7.1-7.6 5.3 7.6h5.7l-8-11.3Zm-2.5 2.7-.8-1.1L4.7 3.4h2.6l4.8 6.9.8 1.1 6.4 9.2h-2.6l-5.3-7.2Z",
  Facebook: "M14 8.3h3V4h-3.6C10 4 8 6.2 8 9.6V12H5v4.2h3V24h4.6v-7.8h3.1l.7-4.2h-3.8v-2c0-1.2.4-1.7 1.4-1.7Z",
  WhatsApp: "M12 2a9.7 9.7 0 0 0-8.4 14.5L2.3 22l5.7-1.3A9.7 9.7 0 1 0 12 2Zm0 17.5a7.7 7.7 0 0 1-3.9-1.1l-.4-.2-3 .7.7-2.9-.2-.4A7.7 7.7 0 1 1 12 19.5Zm4.4-5.7c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.6.1-.2.3-.7.8-.8 1-.2.2-.3.2-.6.1a6.3 6.3 0 0 1-3.1-2.7c-.2-.3 0-.4.1-.6l.4-.4c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.7-1.7c-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4 0 1.4 1 2.7 1.2 2.9.1.2 2 3.1 4.9 4.2.7.3 1.2.4 1.6.5.7.2 1.3.2 1.8.1.6-.1 1.4-.6 1.6-1.1.2-.6.2-1 .2-1.1-.1-.2-.3-.3-.5-.4Z",
  Telegram: "M21.8 4.1 18.6 19c-.2 1.1-.9 1.4-1.8.9l-5-3.7-2.4 2.3c-.3.3-.5.5-1 .5l.4-5.1 9.3-8.4c.4-.4-.1-.6-.6-.2L6 12.6 1.1 11c-1-.3-1-1 .2-1.5l19-7.3c.9-.3 1.7.2 1.5 1.9Z",
  Reddit: "M21 11.7c0-.9-.7-1.7-1.7-1.7-.5 0-.9.2-1.2.5-1.4-1-3.3-1.6-5.3-1.7l1-4.6 3.2.7c.1.8.8 1.4 1.6 1.4.9 0 1.6-.7 1.6-1.6S19.5 3 18.6 3c-.6 0-1.2.4-1.5.9l-3.8-.8c-.3-.1-.6.1-.7.4l-1.1 5.3c-2.2.1-4.1.7-5.5 1.7-.3-.3-.8-.5-1.3-.5-.9 0-1.7.8-1.7 1.7 0 .7.4 1.3 1 1.6v.5c0 2.8 3.4 5.1 7.5 5.1s7.5-2.3 7.5-5.1v-.5c.6-.3 1-.9 1-1.6ZM8.7 13c0-.7.5-1.2 1.2-1.2S11 12.3 11 13s-.5 1.2-1.1 1.2c-.7 0-1.2-.5-1.2-1.2Zm6.8 3.1c-1.1.9-3.3.9-4.4 0-.2-.2-.2-.5 0-.7.2-.2.5-.2.7 0 .7.5 2.3.5 3 0 .2-.2.5-.2.7 0 .2.2.2.5 0 .7ZM15 14.2c-.7 0-1.2-.5-1.2-1.2s.5-1.2 1.2-1.2 1.2.5 1.2 1.2-.5 1.2-1.2 1.2Z",
};

export function SharePanel(props: Props) {
  return <SharePanelContent key={`${props.locale}:${props.quizLength}:${props.axes.join(",")}`} {...props} />;
}

function SharePanelContent({ locale, axes, quizLength, result }: Props) {
  const text = shareCopy[locale];
  const [share, setShare] = useState<PublicShare | null>(null);
  const [images, setImages] = useState<Images | null>(null);
  const [state, setState] = useState<"idle" | "preparing" | "ready" | "error">("idle");
  const [status, setStatus] = useState("");
  const [format, setFormat] = useState<ShareImageFormat>("portrait");
  const [showPreview, setShowPreview] = useState(false);
  const [blockedPlatform, setBlockedPlatform] = useState<Platform | null>(null);
  const preview = useRef<HTMLElement>(null), linkInput = useRef<HTMLInputElement>(null);
  const controller = useRef<AbortController | null>(null), pendingPopup = useRef<Window | null>(null);
  const alive = useRef(true), busy = useRef(false), resources = useRef<Images | null>(null);
  const shareText = resultShareText(locale, result.topMatch.name, result.topMatch.compatibility);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false; controller.current?.abort(); pendingPopup.current?.close();
      if (resources.current) for (const image of Object.values(resources.current)) URL.revokeObjectURL(image.objectUrl);
    };
  }, []);

  function measure(choice: string) {
    try { trackEvent("share_result", { language: locale, quiz_length: quizLength, choice }); }
    catch { /* Sharing remains available when analytics is unavailable. */ }
  }

  async function prepare() {
    if (state === "ready" && share && resources.current) return { share, images: resources.current, ready: true };
    if (busy.current) return null;
    busy.current = true; setState("preparing"); setStatus(text.preparing);
    const request = new AbortController(); controller.current = request;
    let published = share;
    try {
      if (!published) {
        const response = await fetch("/api/share", { method: "POST", signal: request.signal, headers: { "content-type": "application/json" }, body: JSON.stringify({ axes, locale, quizLength, consent: true, variant: "baseline" }) });
        if (!response.ok) throw new Error("Share creation failed");
        const created = await response.json() as PublicShare;
        const url = new URL(created.url), imageUrl = new URL(created.imageUrl);
        if (url.protocol !== "https:" || imageUrl.protocol !== "https:" || url.origin !== imageUrl.origin) throw new Error("Invalid public URLs");
        if (!alive.current) return null;
        published = created; setShare(created);
      }
      let prepared = resources.current;
      if (!prepared) {
        const [landscape, portrait] = await Promise.all([
          generateShareCard(result, locale, published.url, "landscape"),
          generateShareCard(result, locale, published.url, "portrait"),
        ]);
        if (!alive.current) return null;
        prepared = {
          landscape: { blob: landscape, objectUrl: URL.createObjectURL(landscape), file: new File([landscape], "12axes-landscape.png", { type: "image/png" }) },
          portrait: { blob: portrait, objectUrl: URL.createObjectURL(portrait), file: new File([portrait], "12axes-portrait.png", { type: "image/png" }) },
        };
        resources.current = prepared; setImages(prepared);
      }
      const form = new FormData(); form.set("id", published.id); form.set("uploadToken", published.uploadToken); form.set("image", prepared.landscape.blob, "12axes-landscape.png");
      const response = await fetch("/api/share", { method: "PUT", body: form, signal: request.signal });
      if (!response.ok) throw new Error("Image upload failed");
      if (!alive.current) return null;
      setState("ready"); setStatus(text.ready); measure("prepared");
      return { share: published, images: prepared, ready: true };
    } catch {
      if (alive.current) { setState("error"); setStatus(published ? text.imageError : text.error); }
      return alive.current && published ? { share: published, images: resources.current, ready: false } : null;
    } finally { busy.current = false; }
  }

  async function socialShare(platform: Platform) {
    if (busy.current) return;
    // Open under the original click, then remove opener access before navigating externally.
    const popup = window.open("about:blank", "_blank");
    if (popup) {
      popup.opener = null;
      const referrer = popup.document.createElement("meta"); referrer.name = "referrer"; referrer.content = "no-referrer"; popup.document.head.appendChild(referrer);
      popup.document.title = text.share; popup.document.body.textContent = text.preparing;
    }
    pendingPopup.current = popup; setBlockedPlatform(null);
    const prepared = await prepare();
    if (!alive.current) return;
    if (!prepared?.ready) { popup?.close(); pendingPopup.current = null; return; }
    const url = platformShareUrls(prepared.share.url, shareText)[platform];
    if (!popup || popup.closed) { pendingPopup.current = null; setBlockedPlatform(platform); setStatus(text.popupBlocked); return; }
    popup.location.replace(url); pendingPopup.current = null;
    setStatus(text.platformOpened); measure(platform.toLowerCase());
  }

  async function copyLink() {
    if (!share && typeof ClipboardItem === "function" && typeof navigator.clipboard?.write === "function") {
      const pending = prepare();
      const blob = pending.then(prepared => {
        if (!prepared) throw new Error("Share preparation failed");
        return new Blob([`${shareText} ${prepared.share.url}`], { type: "text/plain" });
      });
      // A denied clipboard operation may stop consuming the pending Blob.
      void blob.catch(() => {});
      try {
        await navigator.clipboard.write([new ClipboardItem({ "text/plain": blob })]);
        if (alive.current && await pending) { setStatus(text.copied); measure("copy"); }
      } catch {
        if (await pending && alive.current) { setStatus(text.copyFailed); linkInput.current?.focus(); linkInput.current?.select(); }
      }
      return;
    }
    const prepared = share ? { share } : await prepare();
    if (!prepared || !alive.current) return;
    try { await navigator.clipboard.writeText(`${shareText} ${prepared.share.url}`); setStatus(text.copied); measure("copy"); }
    catch { setStatus(text.copyFailed); linkInput.current?.focus(); linkInput.current?.select(); }
  }

  function revealPreview() {
    setShowPreview(true);
    requestAnimationFrame(() => { preview.current?.focus(); preview.current?.scrollIntoView({ block: "nearest" }); });
  }

  async function nativeShare(image: boolean) {
    if (!image && typeof navigator.share !== "function") { setStatus(text.noNative); return; }
    let currentShare = share, currentImages = images;
    if (!currentShare || (image && !currentImages)) {
      const prepared = await prepare();
      if (!prepared || !alive.current) return;
      if (!image && !navigator.share) { setStatus(text.noNative); return; }
      if (image) {
        if (!prepared.images) return;
        let supported = false;
        try { supported = typeof navigator.share === "function" && typeof navigator.canShare === "function" && navigator.canShare({ files: [prepared.images[format].file] }); } catch { /* Unsupported file sharing. */ }
        if (!supported) { setStatus(text.noFile); revealPreview(); return; }
      }
      currentShare = prepared.share; currentImages = prepared.images;
      if (!navigator.userActivation?.isActive) { setStatus(text.nativeReady); if (image) revealPreview(); return; }
    }
    const file = currentImages?.[format].file;
    if (!navigator.share) { setStatus(image ? text.noFile : text.noNative); if (image && file) revealPreview(); return; }
    if (image) {
      let supported = false;
      try { supported = typeof navigator.canShare === "function" && navigator.canShare({ files: [file!] }); } catch { /* Unsupported file sharing. */ }
      if (!supported) { setStatus(text.noFile); revealPreview(); return; }
    }
    try {
      // Continue a cold start only while the browser still accepts the original click.
      await navigator.share(image ? { files: [file!], title: text.title, text: `${shareText} ${currentShare.url}` } : { title: text.title, text: shareText, url: currentShare.url });
      setStatus(text.nativeDone); measure(image ? "native_image" : "native_link");
    } catch (error) { setStatus(error instanceof Error && error.name === "AbortError" ? text.canceled : text.shareFailed); }
  }

  async function imageAction(download: boolean) {
    const prepared = images ? { images } : await prepare();
    if (!prepared?.images || !alive.current) return;
    if (!download) { revealPreview(); return; }
    const link = document.createElement("a"); link.href = prepared.images[format].objectUrl; link.download = `12axes-${format}.png`; link.click();
    setStatus(text.downloaded); measure("download_image");
  }

  const currentImage = images?.[format], preparing = state === "preparing";
  return <section className="result-sharing-top social-share-panel" aria-labelledby="result-share-title">
    <div className="share-heading"><span className="share-eyebrow">12AXES</span><h2 id="result-share-title">{text.share}</h2><p>{text.intro}</p></div>
    <div className="share-hub">
      <div className="share-main-actions">
        <button className="share-primary" type="button" disabled={preparing} onClick={() => void nativeShare(true)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 0 12m-4-8 4-4 4 4M5 14v6h14v-6" /></svg>{text.image}</button>
        <button className="share-secondary" type="button" disabled={preparing} onClick={copyLink}><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V3H3v13h5"/></svg>{text.copy}</button>
      </div>
      <div className="share-platforms" role="group" aria-label={text.platforms}>
        {(Object.keys(platformPaths) as Platform[]).map(platform => <button type="button" key={platform} className={`social-button social-${platform.toLowerCase()}`} disabled={preparing} onClick={() => void socialShare(platform)} aria-label={`${text.share}: ${platform}`}><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d={platformPaths[platform]}/></svg><span>{platform}</span></button>)}
      </div>
      <p className="share-disclosure">{text.disclosure}</p>
      <div className="share-extra-actions">
        <button type="button" disabled={preparing} onClick={() => void nativeShare(false)}>{text.nativeLink}</button>
        <button type="button" disabled={preparing} onClick={() => void imageAction(false)}>{text.preview}</button>
        <button type="button" disabled={preparing} onClick={() => void imageAction(true)}>{text.download}</button>
      </div>
    </div>
    <p className="share-status" role="status" aria-live="polite">{status}</p>
    {state === "error" && <button className="share-retry" type="button" onClick={() => void prepare()}>{text.retry}</button>}
    {blockedPlatform && share && <a className="share-popup-fallback" href={platformShareUrls(share.url, shareText)[blockedPlatform]} target="_blank" rel="noopener noreferrer">{text.platforms}: {blockedPlatform} ↗</a>}
    {share && <div className="share-link-area"><label className="share-link-label">{text.link}<input ref={linkInput} readOnly value={share.url} onFocus={event => event.currentTarget.select()} /></label><p className="share-public-notice">{text.published} <a href={localePath(locale, "/contact")}>{text.removeLink}</a></p></div>}
    <p className="share-platform-note">{text.platformsNote}</p>
    {showPreview && images && <>
      <div className="share-image-formats" role="group" aria-label={text.preview}>{(["portrait", "landscape"] as const).map(option => <button key={option} type="button" aria-pressed={format === option} onClick={() => setFormat(option)}>{text[option]}</button>)}</div>
      <figure className={`share-image-preview ${format}`} ref={preview} tabIndex={-1}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={currentImage!.objectUrl} width={format === "portrait" ? 1080 : 1200} height={format === "portrait" ? 1920 : 630} alt={text.previewAlt.replace("{name}", result.topMatch.name)} />
        <figcaption>{text.saveHint}</figcaption>
      </figure>
      <a className="share-open-image" href={currentImage!.objectUrl} target="_blank" rel="noopener noreferrer">{text.open} ↗</a>
    </>}
  </section>;
}
