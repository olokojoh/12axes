# 12Axes On-Page SEO Plan

Mode: BUILD + AUDIT+FIX (2026-08-01)
Source: `12axes词调研报告_2026-07-31.md`  
Primary topic: **12axes test**  
Navigation/recovery topic: **12axes vercel app**

## Page map

| Route | Primary intent | Primary phrase | Required content |
| --- | --- | --- | --- |
| `/` | Take the quiz | 12axes test | Test value, 12 axes, three depths, FAQ |
| `/vercel-app` | Find an independent alternative | 12axes vercel app | Clear independence, available quiz options and test CTA |
| `/results` | Understand results | 12axes all results | Twelve dimensions, scoring, match meaning |
| `/ideologies` | Explore possible profiles | 12axes ideologies | Ideology families, per-family descriptions and match-source explanation |
| `/12axes-vs-9axes` | Compare tests | 12axes vs 9axes | Dimensions, depth, result differences |
| `/12axes-vs-8values` | Compare tests | 12axes vs 8values | Dimensions, depth, ideal use |
| `/privacy` | Trust/legal | 12axes privacy | Answers, matching service, sharing, advertising, cookies |
| `/license` | Attribution | 12axes license | Lineage, permission, independence |

Each route also exists under `/pt`, `/es`, `/ru`, and `/zh`; English uses the
unprefixed route.

## Site-wide decisions

- Brand spelling is consistently `12Axes` in reader copy and `12axes test` is
  used naturally in titles/descriptions where search intent benefits.
- The homepage is the only page targeting the broad “12axes test” intent.
- “12axes vercel app” is isolated on the recovery page to avoid competing with
  the homepage.
- Search pages contain visible explanatory content; none is metadata-only.
- Canonicals are self-referencing and use the request origin forwarded by the
  Worker to the Metadata API.
- Every equivalent language page links to all other language versions and an
  English `x-default`.
- Locale routing and `html lang` agree.
- Internal links expose results, ideology, recovery, privacy, and license pages
  without requiring JavaScript interaction.
- The social image contains only the product promise and readable brand text.
- The Vercel-app page does not assert whether the separate Vercel deployment is
  currently available; its copy remains accurate if that external state changes.

## Structured data

- Home: `WebApplication` and visible-content-matched `FAQPage`.
- Supporting pages: `WebPage`.
- No review, rating, medical, or scientific claims.

## Content safeguards

- The quiz is described as educational, not scientific or diagnostic.
- Compatibility is explained as similarity, not endorsement.
- The Vercel recovery page identifies this site as an independent rebuild and
  makes no claim about the external deployment's status.
- Privacy copy matches the implementation: raw answers stay in browser memory,
  while twelve final percentages are sent to the external match service.

## Acceptance record

| Check | Status |
| --- | --- |
| Unique title, description, and H1 | Passed |
| Primary phrase visible on homepage | Passed |
| `12axes vercel app` dedicated page | Passed |
| Canonical and hreflang cluster | Passed |
| Correct localized `html lang` | Passed |
| Crawlable internal links | Passed |
| Dynamic sitemap and robots | Passed |
| JSON-LD matches visible content | Passed |
| Open Graph and Twitter metadata | Passed |
| Mobile layout without horizontal overflow | Passed |
| Rendered HTML automated tests | Passed |

## AUDIT+FIX record — 2026-08-01

The dated keyword report remains useful historical evidence: it observed an
HTTP 402 response on 2026-07-31. A fresh request on 2026-08-01 returned HTTP
200, so outage language is not a durable page contract.

| Finding | Before | Remediation | Verification |
| --- | --- | --- | --- |
| Request origin lost in page metadata | Canonical, hreflang, Open Graph URLs and social images resolved to `http://localhost:3000` | The Worker now supplies `x-forwarded-host` and `x-forwarded-proto` from the incoming request URL | All 40 sampled pages emit the `https://12axes.test` audit origin |
| Localized-home sitemap URLs redirected | `/pt/`, `/es/`, `/ru/`, and `/zh/` returned 308 while canonical and sitemap used those URLs | Locale home URLs now use the actual no-trailing-slash 200 routes | All 40 sitemap entries return 200 and self-canonicalize |
| Comparison pages lacked ordinary internal links | The two comparison templates were discoverable only through sitemap | Added both comparison routes to home and SEO-page footers in every locale | All 40 sitemap pages are reachable from `/` through ordinary anchors |
| External outage claim had become stale | Five Vercel-app pages described the separate deployment as disabled | Reframed the pages as clearly independent alternatives without a status claim | No outage/error wording remains in rendered samples |
| Localized pages contained English content blocks | Ideology families and homepage result-axis examples remained English | Added locale-specific family and example copy | Browser sample `/zh/ideologies` contains localized families and no English family block |

Post-fix validation:

- `npm run lint` passed.
- `npm test` passed: production build plus four rendered-HTML/data tests.
- Full Worker scan passed: 40 pages, 40 unique titles, 40 unique
  descriptions, one H1 per page, 45 parseable JSON-LD blocks, and 40/40
  sitemap targets returning 200.
- Shared score URLs remain `noindex, follow`, canonicalize to `/results`, and
  are excluded from sitemap.
- Playwright at 390 × 844 found no horizontal overflow on `/` or
  `/zh/ideologies`; the primary H1 and CTA remained visible and the browser
  console had no warnings or errors.

Not verified in this run: production-domain deployment behavior, Search
Console index coverage, rankings, impressions, CTR, field Core Web Vitals, or
native-speaker review of every translation.

## Future measurement

After the final public domain is stable, submit the sitemap in Google Search
Console and monitor impressions separately for:

- `12axes test`
- `12axes vercel app`
- `12axes all results`
- `12axes ideologies`
- `12axes vs 9axes`
- `12axes vs 8values`

No keyword or ranking claim is made before production crawl data exists.
