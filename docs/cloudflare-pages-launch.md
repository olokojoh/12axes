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

Final deployment identifiers, DNS state, Search Console submission state, commit SHA, verification date, alternate-domain redirect, and any remaining authorization gaps are recorded after production verification.
