# Cloudflare Pages Launch

- Repository: https://github.com/olokojoh/12axes
- Production branch: `main`
- Pages project: `12axes`
- Deployment mode: Native GitHub integration with Pages Advanced Mode
- Install command: `npm ci`
- Build command: `npm run build`
- Root directory: repository root
- Output directory: `dist/client`
- Runtime version: Node.js 22 or newer; Pages Functions compatibility date `2026-05-15` with `nodejs_compat`
- Canonical domain: `https://12axes.net`
- Public contact: https://github.com/olokojoh/12axes/issues
- Functions routes: server-rendered pages, dynamic `robots.txt`, dynamic `sitemap.xml`, and `/api/match`; static assets are excluded through `public/_routes.json`
- Bindings: Pages-provided `ASSETS` fetcher only
- ads.txt source and URL: `public/ads.txt` -> `https://12axes.net/ads.txt`
- robots/sitemap URLs: `https://12axes.net/robots.txt`, `https://12axes.net/sitemap.xml`
- Search Console property: `sc-domain:12axes.net`
- Rollback: select the prior successful production deployment in Cloudflare Pages and choose rollback

The build validates the exact authorized AdSense seller line before compiling. It then bundles the vinext Worker as `dist/client/_worker.js` for Pages Advanced Mode and removes vinext's generated local Worker deployment redirect so Pages reads the repository `wrangler.jsonc`. That file is the source of truth for the Pages output directory and Functions compatibility settings. No secret, D1, R2, KV, Queue, or service binding is required.

## 2026-08-01 production state

- GitHub source: public `olokojoh/12axes`; native Pages Git integration deploys pushes to `main` automatically.
- Verified application commit: `e90ebdff3219402a1bdf80306d3de445c64bd7f1`.
- Successful Pages deployment: `73f2a086-63ff-48c3-b8dd-d6181a3ea477` at `https://73f2a086.12axes-1dg.pages.dev`.
- `12axes.net` and `www.12axes.net` both show `Active` and `SSL enabled` in Pages.
- Apex DNS is a DNS-only flattened CNAME to `12axes-1dg.pages.dev`. The proxied record was changed because it did not return apex A/AAAA answers; public DNS-over-HTTPS now returns the Pages addresses and TLS validation succeeds.
- `www.12axes.net` is proxied and an active Cloudflare Redirect Rule sends it to the apex with HTTP 301 while preserving the path and query string.
- Google Search Console domain ownership is verified through a durable apex TXT record. `https://12axes.net/sitemap.xml` was submitted, read successfully on 2026-08-01, and reports 40 discovered pages.
- Production checks passed for representative localized pages, `ads.txt`, `robots.txt`, sitemap XML, a hashed JavaScript asset, `/api/match`, canonical/contact markup, a real 404, TLS, and the `www` redirect.

The release does not establish licensing or authorization for the external profile, country, or personality data. AdSense connection, a certified CMP, link-spam exposure, review risk, and reputation risk remain follow-up items. The independent pcManager promotion session was not stopped, paused, restarted, or modified during release work.
