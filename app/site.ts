import { headers } from "next/headers";
import type { Metadata } from "next";
import { copy, htmlLang, localePath, locales, type Locale } from "./i18n";

export async function requestBaseUrl() {
  const values = await headers();
  const host = values.get("x-forwarded-host") ?? values.get("host") ?? "localhost:3000";
  const protocol = values.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return new URL(`${protocol}://${host}`);
}

export async function homeMetadata(locale: Locale): Promise<Metadata> {
  const base = await requestBaseUrl();
  const titles: Record<Locale, string> = {
    en: "12Axes Test — Free Political Ideology Quiz in 12 Axes",
    pt: "Teste 12Axes — Quiz político gratuito em 12 eixos",
    es: "Test 12Axes — Quiz político gratuito de 12 ejes",
    ru: "Тест 12Axes — политический тест по 12 осям",
    zh: "12Axes 测试中文版 — 免费 12 轴政治意识形态测试",
  };
  const descriptions: Record<Locale, string> = {
    en: "Take the free 12axes test in 36, 60 or 240 questions. Map your political ideology across 12 axes and match with ideologies, countries and personalities.",
    pt: "Faça o teste 12axes grátis com 36, 60 ou 240 perguntas e descubra sua ideologia política em 12 eixos.",
    es: "Haz el test 12axes gratis con 36, 60 o 240 preguntas y descubre tu ideología política en 12 ejes.",
    ru: "Пройдите бесплатный тест 12axes из 36, 60 или 240 вопросов и определите политический профиль по 12 осям.",
    zh: "免费完成 36、60 或 240 题 12Axes 中文版政治测试，查看 12 个轴、意识形态、国家与人物匹配结果。",
  };
  const path = localePath(locale);
  const languages = Object.fromEntries(locales.map((item) => [htmlLang[item], new URL(localePath(item), base).toString()]));
  return {
    metadataBase: base,
    title: titles[locale],
    description: descriptions[locale],
    alternates: { canonical: path, languages: { ...languages, "x-default": new URL("/", base).toString() } },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
    openGraph: { type: "website", title: titles[locale], description: descriptions[locale], url: path, siteName: "12 Axes Test", images: [{ url: "/og.png", width: 1730, height: 909, alt: "12Axes Test — discover your political ideology across 12 axes" }] },
    twitter: { card: "summary_large_image", title: titles[locale], description: descriptions[locale], images: ["/og.png"] },
  };
}

export function homeSchema(locale: Locale, base: URL) {
  const text = copy[locale];
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "12 Axes Test",
      url: new URL(localePath(locale), base).toString(),
      applicationCategory: "EducationalApplication",
      operatingSystem: "Any",
      inLanguage: htmlLang[locale],
      isAccessibleForFree: true,
      description: text.lead,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: text.faq.map(([question, answer]) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: { "@type": "Answer", text: answer },
      })),
    },
  ];
}
