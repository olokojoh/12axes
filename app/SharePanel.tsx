"use client";

import { useEffect, useRef, useState } from "react";
import { localePath, type Locale } from "./i18n";
import { trackEvent } from "./Analytics";
import { platformShareUrls, resultShareText, shareCopy } from "./share-copy";
import { generateShareCard, type ShareImageFormat, type ShareResult } from "./lib/share-card";

type Props = { locale: Locale; axes: number[]; quizLength: number; result: ShareResult };
type PublicShare = { id: string; uploadToken: string; url: string; imageUrl: string };
type Images = Record<ShareImageFormat, { blob: Blob; objectUrl: string; file: File }>;

export function SharePanel(props: Props) {
  const [consent, setConsent] = useState(false);
  const [open, setOpen] = useState(false);
  const [published, setPublished] = useState(false);
  return <SharePanelContent key={`${props.locale}:${props.quizLength}:${props.axes.join(",")}`} {...props} consent={consent} setConsent={setConsent} open={open} setOpen={setOpen} published={published} setPublished={setPublished} />;
}

function SharePanelContent({ locale, axes, quizLength, result, consent, setConsent, open, setOpen, published, setPublished }: Props & { consent: boolean; setConsent: (value: boolean) => void; open: boolean; setOpen: (value: boolean) => void; published: boolean; setPublished: (value: boolean) => void }) {
  const text = shareCopy[locale];
  const [share, setShare] = useState<PublicShare | null>(null);
  const [images, setImages] = useState<Images | null>(null);
  const [state, setState] = useState<"idle" | "preparing" | "ready" | "error">("idle");
  const [status, setStatus] = useState("");
  const [format, setFormat] = useState<ShareImageFormat>("portrait");
  const [showPreview, setShowPreview] = useState(false);
  const preview = useRef<HTMLElement>(null);
  const linkInput = useRef<HTMLInputElement>(null);
  const controller = useRef<AbortController | null>(null);
  const alive = useRef(true);
  const resources = useRef<Images | null>(null);
  const busy = useRef(false);
  const shareText = resultShareText(locale, result.topMatch.name, result.topMatch.compatibility);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false; controller.current?.abort();
      if (resources.current) for (const image of Object.values(resources.current)) URL.revokeObjectURL(image.objectUrl);
    };
  }, []);

  function measure(choice: string) {
    try { trackEvent("share_result", { language: locale, quiz_length: quizLength, choice }); }
    catch { /* Sharing remains available when analytics is unavailable. */ }
  }

  async function prepare() {
    if (!consent || busy.current) return;
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
        if (!alive.current) return;
        published = created; setShare(created); setPublished(true);
      }
      let prepared = resources.current;
      if (!prepared) {
        const [landscape, portrait] = await Promise.all([
          generateShareCard(result, locale, published.url, "landscape"),
          generateShareCard(result, locale, published.url, "portrait"),
        ]);
        if (!alive.current) return;
        prepared = {
          landscape: { blob: landscape, objectUrl: URL.createObjectURL(landscape), file: new File([landscape], "12axes-landscape.png", { type: "image/png" }) },
          portrait: { blob: portrait, objectUrl: URL.createObjectURL(portrait), file: new File([portrait], "12axes-portrait.png", { type: "image/png" }) },
        };
        resources.current = prepared; setImages(prepared);
      }
      const form = new FormData(); form.set("id", published.id); form.set("uploadToken", published.uploadToken); form.set("image", prepared.landscape.blob, "12axes-landscape.png");
      const response = await fetch("/api/share", { method: "PUT", body: form, signal: request.signal });
      if (!response.ok) throw new Error("Image upload failed");
      if (!alive.current) return;
      setState("ready"); setStatus(text.ready); measure("prepared");
    } catch {
      if (alive.current) { setState("error"); setStatus(published ? text.imageError : text.error); }
    } finally { busy.current = false; }
  }

  async function copyLink() {
    if (!share) return;
    try { await navigator.clipboard.writeText(`${shareText} ${share.url}`); setStatus(text.copied); measure("copy"); }
    catch { setStatus(text.copyFailed); linkInput.current?.focus(); linkInput.current?.select(); }
  }

  function revealPreview() {
    setShowPreview(true);
    requestAnimationFrame(() => { preview.current?.focus(); preview.current?.scrollIntoView({ block: "nearest" }); });
  }

  async function nativeShare(image: boolean) {
    if (!share) return;
    const file = images?.[format].file;
    if (!navigator.share) { setStatus(image ? text.noFile : text.noNative); if (image && file) revealPreview(); return; }
    if (image) {
      if (!file) { setStatus(text.preparing); return; }
      let supported = false;
      try { supported = typeof navigator.canShare === "function" && navigator.canShare({ files: [file] }); } catch { /* Unsupported file sharing. */ }
      if (!supported) { setStatus(text.noFile); revealPreview(); return; }
    }
    try {
      // Blobs are already prepared, so the browser still has this click's user activation.
      await navigator.share(image ? { files: [file!], title: text.title, text: `${shareText} ${share.url}` } : { title: text.title, text: shareText, url: share.url });
      setStatus(text.nativeDone); measure(image ? "native_image" : "native_link");
    } catch (error) {
      setStatus(error instanceof Error && error.name === "AbortError" ? text.canceled : text.shareFailed);
    }
  }

  const currentImage = images?.[format];
  return <details className="result-sharing-top social-share-panel" open={open} onToggle={event => setOpen(event.currentTarget.open)}>
    <summary className="secondary-button">{text.share}</summary>
    <div className="share-panel-content">
      <p>{text.intro}</p>
      <label className="consent-label result-consent"><input type="checkbox" checked={consent} disabled={state === "preparing" || published} onChange={event => setConsent(event.target.checked)} />{text.consent}</label>
      {published && <p className="share-public-notice">{text.published} <a href={localePath(locale, "/contact")}>{text.removeLink}</a></p>}
      {state !== "ready" && <button className="primary-button" type="button" disabled={!consent || state === "preparing"} onClick={prepare}>{state === "preparing" ? text.preparing : state === "error" && share ? text.retry : text.prepare}</button>}
      <p className="share-status" role="status" aria-live="polite">{status}</p>
      {share && consent && state !== "preparing" && <>
        <div className="share-main-actions">
          <button className="primary-button" type="button" disabled={!images} onClick={() => void nativeShare(true)}>{text.image}</button>
          <button className="secondary-button" type="button" onClick={copyLink}>{text.copy}</button>
        </div>
        <label className="share-link-label">{text.link}<input ref={linkInput} readOnly value={share.url} onFocus={event => event.currentTarget.select()} /></label>
        <nav className="share-platforms" aria-label={text.platforms}>
          {Object.entries(platformShareUrls(share.url, shareText)).map(([platform, url]) => <a key={platform} className="secondary-button" href={url} target="_blank" rel="noopener noreferrer" onClick={() => measure(platform.toLowerCase())}>{platform}</a>)}
        </nav>
        <p className="share-platform-note">{text.platformsNote}</p>
        <div className="share-extra-actions">
          <button className="secondary-button" type="button" onClick={() => void nativeShare(false)}>{text.nativeLink}</button>
          {images && <button className="secondary-button" type="button" onClick={revealPreview}>{text.preview}</button>}
        </div>
        {images && <>
          <div className="share-image-formats" role="group" aria-label={text.preview}>
            {(["portrait", "landscape"] as const).map(option => <button key={option} type="button" className="secondary-button" aria-pressed={format === option} onClick={() => setFormat(option)}>{text[option]}</button>)}
          </div>
          <div className="share-extra-actions">
            <a className="secondary-button" href={currentImage!.objectUrl} target="_blank" rel="noopener noreferrer">{text.open}</a>
            <a className="secondary-button" href={currentImage!.objectUrl} download={`12axes-${format}.png`} onClick={() => { setStatus(text.downloaded); measure("download_image"); }}>{text.download}</a>
          </div>
          {showPreview && <figure className={`share-image-preview ${format}`} ref={preview} tabIndex={-1}>
            {/* Canvas output must stay a local image so it can be saved without another network request. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={currentImage!.objectUrl} width={format === "portrait" ? 1080 : 1200} height={format === "portrait" ? 1920 : 630} alt={text.previewAlt.replace("{name}", result.topMatch.name)} />
            <figcaption>{text.saveHint}</figcaption>
          </figure>}
        </>}
      </>}
    </div>
  </details>;
}
