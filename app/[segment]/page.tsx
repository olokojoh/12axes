import { notFound } from "next/navigation";
import { isLocale, type Locale } from "../i18n";
import { pageMetadata, SeoPage, seoSlugs, type SeoSlug } from "../SeoPage";
import { homeMetadata, homeSchema, requestBaseUrl } from "../site";
import { TestApp } from "../TestApp";

export async function generateMetadata({ params, searchParams }: { params: Promise<{ segment: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { segment } = await params;
  const query = await searchParams;
  if (segment === "results" && query.est) {
    const metadata = pageMetadata("en", "results", await requestBaseUrl());
    return { ...metadata, robots: { index: false, follow: true } };
  }
  if (isLocale(segment)) return homeMetadata(segment);
  if (seoSlugs.includes(segment as SeoSlug)) return pageMetadata("en", segment as SeoSlug, await requestBaseUrl());
  return {};
}

export default async function SingleSegmentPage({ params, searchParams }: { params: Promise<{ segment: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { segment } = await params;
  if (isLocale(segment)) {
    const locale = segment as Locale;
    const schema = homeSchema(locale, await requestBaseUrl());
    return <><TestApp locale={locale} />{schema.map((item, index) => <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }} />)}</>;
  }
  const query = await searchParams;
  if (segment === "results" && query.est) return <TestApp locale="en" />;
  if (seoSlugs.includes(segment as SeoSlug)) return <SeoPage locale="en" slug={segment as SeoSlug} />;
  notFound();
}
