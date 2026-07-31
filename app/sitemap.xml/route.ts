import { htmlLang, localePath, locales } from "../i18n";
import { seoSlugs } from "../SeoPage";

export function GET(request: Request) {
  const base = new URL(request.url).origin;
  const pages = ["", ...seoSlugs];
  const entries = pages.flatMap((slug) => locales.map((locale) => {
    const path = localePath(locale, slug ? `/${slug}` : "");
    const alternates = locales.map((item) => `<xhtml:link rel="alternate" hreflang="${htmlLang[item]}" href="${base}${localePath(item, slug ? `/${slug}` : "")}"/>`).join("");
    return `<url><loc>${base}${path}</loc>${alternates}<xhtml:link rel="alternate" hreflang="x-default" href="${base}/${slug}"/></url>`;
  })).join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${entries}</urlset>`;
  return new Response(xml, { headers: { "content-type": "application/xml; charset=utf-8" } });
}
