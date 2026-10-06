import { homeTitles, homeDescriptions } from "./home-seo";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { htmlLang, localePath, locales, type Locale } from "./i18n";

export async function requestBaseUrl() {
  const values = await headers();
  const host = values.get("x-forwarded-host") ?? values.get("host") ?? "localhost:3000";
  const protocol = values.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return new URL(`${protocol}://${host}`);
}

export async function homeMetadata(locale: Locale): Promise<Metadata> {
  const base = await requestBaseUrl();
  const path = localePath(locale);
  const languages = Object.fromEntries(locales.map((item) => [htmlLang[item], new URL(localePath(item), base).toString()]));
  return {
    metadataBase: base,
    title: homeTitles[locale],
    description: homeDescriptions[locale],
    alternates: { canonical: path, languages: { ...languages, "x-default": new URL("/", base).toString() } },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
    openGraph: { type: "website", title: homeTitles[locale], description: homeDescriptions[locale], url: path, siteName: "12 Axes Test", images: [{ url: "/og.png", width: 1730, height: 909, alt: "12Axes Test — discover your political ideology across 12 axes" }] },
    twitter: { card: "summary_large_image", title: homeTitles[locale], description: homeDescriptions[locale], images: ["/og.png"] },
  };
}
