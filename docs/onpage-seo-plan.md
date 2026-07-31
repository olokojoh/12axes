# 12Axes On-Page SEO Plan

Mode: BUILD  
Source: `12axes词调研报告_2026-07-31.md`  
Primary topic: **12axes test**  
Navigation/recovery topic: **12axes vercel app**

## Page map

| Route | Primary intent | Primary phrase | Required content |
| --- | --- | --- | --- |
| `/` | Take the quiz | 12axes test | Test value, 12 axes, three depths, FAQ |
| `/vercel-app` | Recover disabled site traffic | 12axes vercel app | Outage context and working-test CTA |
| `/results` | Understand results | 12axes all results | Twelve dimensions, scoring, match meaning |
| `/ideologies` | Explore possible profiles | 12axes ideologies | Ideology families and 153-profile context |
| `/12axes-vs-9axes` | Compare tests | 12axes vs 9axes | Dimensions, depth, result differences |
| `/12axes-vs-8values` | Compare tests | 12axes vs 8values | Dimensions, depth, ideal use |
| `/privacy` | Trust/legal | 12axes privacy | Answers, sharing, cookies |
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
- Canonicals are self-referencing and use the request origin.
- Every equivalent language page links to all other language versions and an
  English `x-default`.
- Locale routing and `html lang` agree.
- Internal links expose results, ideology, recovery, privacy, and license pages
  without requiring JavaScript interaction.
- The social image contains only the product promise and readable brand text.

## Structured data

- Home: `WebApplication` and visible-content-matched `FAQPage`.
- Supporting pages: `WebPage`.
- No review, rating, medical, or scientific claims.

## Content safeguards

- The quiz is described as educational, not scientific or diagnostic.
- Compatibility is explained as similarity, not endorsement.
- The Vercel recovery page states the observed deployment error and clearly
  identifies this site as an independent rebuild.
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
