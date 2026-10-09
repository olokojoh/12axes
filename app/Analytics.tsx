"use client";

import { useEffect, useState } from "react";
import { isLocale, localePath, type Locale } from "./i18n";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const copy: Record<Locale, { title: string; body: string; accept: string; ads: string; reject: string; privacy: string; settings: string }> = {
  en: { title: "Analytics choice", body: "Measure visits and purchases with Google Analytics? You can also allow Google Ads attribution. No answers or political results are sent.", accept: "Analytics only", ads: "Analytics + ad measurement", reject: "No thanks", privacy: "Privacy", settings: "Analytics settings" },
  pt: { title: "Escolha de análise", body: "Medir visitas e compras com o Google Analytics? Você também pode permitir a atribuição do Google Ads. Não enviamos respostas nem resultados políticos.", accept: "Só análise", ads: "Análise + medição de anúncios", reject: "Agora não", privacy: "Privacidade", settings: "Configurações de análise" },
  es: { title: "Elección de analítica", body: "¿Medir visitas y compras con Google Analytics? También puedes permitir la atribución de Google Ads. No enviamos respuestas ni resultados políticos.", accept: "Solo analítica", ads: "Analítica + medición de anuncios", reject: "Ahora no", privacy: "Privacidad", settings: "Configuración de analítica" },
  ru: { title: "Настройки аналитики", body: "Измерять посещения и покупки через Google Analytics? Можно также разрешить атрибуцию Google Ads. Ответы и политические результаты не передаются.", accept: "Только аналитика", ads: "Аналитика и оценка рекламы", reject: "Не сейчас", privacy: "Конфиденциальность", settings: "Настройки аналитики" },
  zh: { title: "分析设置", body: "是否允许 Google Analytics 衡量访问和购买？你也可以允许 Google Ads 衡量广告效果。不会发送答案或政治结果。", accept: "仅允许分析", ads: "分析及广告效果衡量", reject: "暂不允许", privacy: "隐私政策", settings: "分析设置" },
};

let analyticsReady = false;
let purchaseInFlight = false;

function measurementPage() {
  const page = new URL(window.location.origin + window.location.pathname);
  if (window.localStorage.getItem("12axes:ads-consent") === "granted") {
    const query = new URLSearchParams(window.location.search);
    // Only campaign identifiers reach Analytics; report credentials and scores never do.
    for (const key of ["gclid", "gbraid", "wbraid", "utm_source", "utm_medium", "utm_campaign", "utm_content"]) {
      const value = query.get(key);
      if (value && /^[A-Za-z0-9_.~-]{1,250}$/.test(value)) page.searchParams.set(key, value);
    }
  }
  return page.href;
}

function measurementReferrer() {
  const referrer = document.referrer;
  if (!referrer) return "";
  try {
    const parsed = new URL(referrer);
    if (parsed.origin === window.location.origin || !["http:", "https:"].includes(parsed.protocol)
      || parsed.hostname === "stripe.com" || parsed.hostname.endsWith(".stripe.com")) return "";
    return parsed.origin;
  } catch {
    return "";
  }
}

function enableAnalytics() {
  if (window.gtag || window.location.hostname !== "12axes.net" || window.localStorage.getItem("12axes:analytics-consent") !== "granted") return;
  window.dataLayer = window.dataLayer ?? [];
  // eslint-disable-next-line prefer-rest-params -- Google distinguishes Arguments objects from arrays.
  window.gtag = function () { window.dataLayer?.push(arguments); };
  const ads = window.localStorage.getItem("12axes:ads-consent") === "granted" ? "granted" : "denied";
  window.gtag("consent", "default", { analytics_storage: "granted", ad_storage: ads, ad_user_data: ads, ad_personalization: "denied" });
  window.gtag("js", new Date());
  window.gtag("config", "G-CE8EXPY4K6", { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false, page_location: measurementPage(), page_referrer: measurementReferrer(), page_title: "12Axes" });
  trackEvent("page_view");
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://www.googletagmanager.com/gtag/js?id=G-CE8EXPY4K6";
  script.onload = () => { analyticsReady = true; window.dispatchEvent(new Event("analytics-ready")); };
  document.head.appendChild(script);
}

export function trackEvent(name: string, params: Record<string, string | number | boolean> = {}) {
  if (typeof window === "undefined" || !window.gtag || window.localStorage.getItem("12axes:analytics-consent") !== "granted") return;
  const allowed = new Set(["variant", "language", "device", "quiz_length", "entry_type", "plan", "error_type", "quiz_run_id", "measurement_entry", "progress_stage", "choice"]);
  const safe = Object.fromEntries(Object.entries(params).filter(([key]) => allowed.has(key)));
  window.gtag("event", name, { ...safe, page_location: measurementPage(), page_referrer: measurementReferrer(), page_title: "12Axes" });
}

export function rememberCheckout(orderId: string) {
  if (window.localStorage.getItem("12axes:analytics-consent") === "granted") {
    window.sessionStorage.setItem("12axes:pending-purchase", JSON.stringify({ orderId, createdAt: Date.now() }));
  }
}

export async function trackPurchase(token: string) {
  if (!analyticsReady || purchaseInFlight || !window.gtag || window.localStorage.getItem("12axes:analytics-consent") !== "granted") return;
  const saved = window.sessionStorage.getItem("12axes:pending-purchase");
  if (!saved) return;
  purchaseInFlight = true;
  try {
    const pending = JSON.parse(saved) as { orderId: string; createdAt: number };
    if (Date.now() - pending.createdAt > 7 * 86400000) { window.sessionStorage.removeItem("12axes:pending-purchase"); return; }
    const response = await fetch("/api/purchase", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, orderId: pending.orderId, consent: true }) });
    if (!response.ok || response.status === 204) return;
    const purchase = await response.json() as { transaction_id: string; value: number; currency: string; plan: string };
    window.gtag("event", "purchase", { transaction_id: purchase.transaction_id, value: purchase.value, currency: purchase.currency,
      items: [{ item_id: purchase.plan, item_name: "Report", price: purchase.value, quantity: 1 }],
      page_location: window.location.origin + "/results", page_referrer: measurementReferrer(), page_title: "12Axes" });
    window.sessionStorage.removeItem("12axes:pending-purchase");
  } catch { /* Measurement must never interrupt access to a paid report. */ }
  finally { purchaseInFlight = false; }
}

export function Analytics({ locale }: { locale: Locale }) {
  const [choice, setChoice] = useState<string | null>(null);
  const [displayLocale, setDisplayLocale] = useState(locale);
  const text = copy[displayLocale];
  useEffect(() => {
    const update = (event: Event) => {
      const next = (event as CustomEvent).detail;
      if (isLocale(next)) setDisplayLocale(next);
    };
    window.addEventListener("locale-change", update);
    return () => window.removeEventListener("locale-change", update);
  }, []);

  useEffect(() => {
    const stored = window.localStorage.getItem("12axes:analytics-consent");
    if (stored === "granted") enableAnalytics();
    const timeout = window.setTimeout(() => setChoice(stored), 0);
    const reset = () => {
      window.localStorage.removeItem("12axes:analytics-consent");
      window.localStorage.removeItem("12axes:ads-consent");
      window.sessionStorage.removeItem("12axes:pending-purchase");
      window.location.reload();
    };
    window.addEventListener("analytics-reset", reset);
    return () => { window.clearTimeout(timeout); window.removeEventListener("analytics-reset", reset); };
  }, []);

  if (choice) return null;
  return (
    <aside className="analytics-consent" aria-label={text.title}>
      <div><strong>{text.title}</strong><p>{text.body} <a href={localePath(displayLocale, "/privacy")}>{text.privacy}</a></p></div>
      <div className="analytics-consent-actions">
        <button className="secondary-button" onClick={() => { window.localStorage.setItem("12axes:analytics-consent", "denied"); window.localStorage.setItem("12axes:ads-consent", "denied"); setChoice("denied"); }}>{text.reject}</button>
        <button className="primary-button" onClick={() => { window.localStorage.setItem("12axes:analytics-consent", "granted"); window.localStorage.setItem("12axes:ads-consent", "denied"); enableAnalytics(); setChoice("granted"); }}>{text.accept}</button>
        <button className="primary-button" onClick={() => { window.localStorage.setItem("12axes:analytics-consent", "granted"); window.localStorage.setItem("12axes:ads-consent", "granted"); enableAnalytics(); setChoice("granted"); }}>{text.ads}</button>
      </div>
    </aside>
  );
}

export function AnalyticsSettings({ locale }: { locale: Locale }) {
  return <button className="secondary-button" onClick={() => window.dispatchEvent(new Event("analytics-reset"))}>{copy[locale].settings}</button>;
}
