export function GET(request: Request) {
  const base = new URL(request.url).origin;
  return new Response(`User-agent: *
Allow: /
Disallow: /api/

Sitemap: ${base}/sitemap.xml
`, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
