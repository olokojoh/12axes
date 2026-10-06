"use client";

import { useEffect, useState } from "react";
import { isLocale, localePath, type Locale } from "./i18n";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const copy: Record<Locale, { title: string; body: string; accept: string; reject: string; privacy: string; settings: string }> = {
  en: { title: "Analytics choice", body: "Allow visit and interaction measurement?", accept: "Allow analytics", reject: "No thanks", privacy: "Privacy", settings: "Analytics settings" },
  pt: { title: "Escolha de análise", body: "Permitir a medição de visitas e interações?", accept: "Permitir análise", reject: "Agora não", privacy: "Privacidade", settings: "Configurações de análise" },
  es: { title: "Elección de analítica", body: "¿Permitir la medición de visitas e interacciones?", accept: "Permitir analítica", reject: "Ahora no", privacy: "Privacidad", settings: "Configuración de analítica" },
  ru: { title: "Настройки аналитики", body: "Разрешить измерение посещений и взаимодействий?", accept: "Разрешить аналитику", reject: "Не сейчас", privacy: "Конфиденциальность", settings: "Настройки аналитики" },
  zh: { title: "分析设置", body: "是否允许衡量访问和互动？", accept: "允许分析", reject: "暂不允许", privacy: "隐私政策", settings: "分析设置" },
};

function enableAnalytics() {
  if (window.gtag) return;
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://www.googletagmanager.com/gtag/js?id=G-CE8EXPY4K6";
  document.head.appendChild(script);
  window.dataLayer = window.dataLayer ?? [];
  // eslint-disable-next-line prefer-rest-params -- Google distinguishes Arguments objects from arrays.
  window.gtag = function () { window.dataLayer?.push(arguments); };
  window.gtag("js", new Date());
  window.gtag("consent", "default", { analytics_storage: "granted", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
  window.gtag("config", "G-CE8EXPY4K6", { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false, page_location: window.location.origin + window.location.pathname, page_referrer: "", page_title: "12Axes" });
  trackEvent("page_view");
}

export function trackEvent(name: string, params: Record<string, string | number | boolean> = {}) {
  if (typeof window === "undefined" || !window.gtag || window.localStorage.getItem("12axes:analytics-consent") !== "granted") return;
  const allowed = new Set(["variant", "language", "device", "quiz_length", "entry_type", "plan"]);
  const safe = Object.fromEntries(Object.entries(params).filter(([key]) => allowed.has(key)));
  window.gtag("event", name, { ...safe, page_location: window.location.origin + window.location.pathname, page_referrer: "", page_title: "12Axes" });
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
        <button className="secondary-button" onClick={() => { window.localStorage.setItem("12axes:analytics-consent", "denied"); setChoice("denied"); }}>{text.reject}</button>
        <button className="primary-button" onClick={() => { window.localStorage.setItem("12axes:analytics-consent", "granted"); enableAnalytics(); setChoice("granted"); }}>{text.accept}</button>
      </div>
    </aside>
  );
}

export function AnalyticsSettings({ locale }: { locale: Locale }) {
  return <button className="secondary-button" onClick={() => window.dispatchEvent(new Event("analytics-reset"))}>{copy[locale].settings}</button>;
}
