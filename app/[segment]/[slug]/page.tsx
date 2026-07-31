import { notFound } from "next/navigation";
import { isLocale } from "../../i18n";
import { pageMetadata, SeoPage, seoSlugs, type SeoSlug } from "../../SeoPage";
import { requestBaseUrl } from "../../site";
import { TestApp } from "../../TestApp";

export async function generateMetadata({ params, searchParams }: { params: Promise<{ segment: string; slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { segment, slug } = await params;
  const query = await searchParams;
  if (isLocale(segment) && slug === "results" && query.est) {
    const metadata = pageMetadata(segment, "results", await requestBaseUrl());
    return { ...metadata, robots: { index: false, follow: true } };
  }
  if (isLocale(segment) && seoSlugs.includes(slug as SeoSlug)) return pageMetadata(segment, slug as SeoSlug, await requestBaseUrl());
  return {};
}

export default async function LocalizedSeoPage({ params, searchParams }: { params: Promise<{ segment: string; slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { segment, slug } = await params;
  if (!isLocale(segment) || !seoSlugs.includes(slug as SeoSlug)) notFound();
  const query = await searchParams;
  if (slug === "results" && query.est) return <TestApp locale={segment} />;
  return <SeoPage locale={segment} slug={slug as SeoSlug} />;
}
