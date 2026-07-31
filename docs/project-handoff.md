# 12Axes Project Handoff

## Objective and source material

This project recreates the complete user-facing behavior and visual direction
of the archived 12Axes Vercel application:

`https://web.archive.org/web/20260724211411/https://12axes.vercel.app/`

Product and keyword decisions come from
`12axes词调研报告_2026-07-31.md`. The primary search topic is **12axes test**;
**12axes vercel app** is the navigational recovery topic.

## Delivered behavior

- Responsive landing page matching the snapshot's green editorial layout.
- Short, full, and extreme tests with 36, 60, and 240 questions.
- Balanced random selection by axis and answer direction.
- Optional 24-question accuracy extension after the short test.
- Five answer strengths, automatic progression, back/next navigation, and
  progress display.
- Local twelve-axis scoring.
- Closest ideology plus three additional ideologies, country, and personality.
- Shareable `/results` URLs using the original twelve parameter names.
- Direct result URL hydration after a reload.
- English, Portuguese, Spanish, Russian, and Simplified Chinese routes and
  question banks.
- Localized metadata and editorial SEO pages.

## Architecture

The application is a vinext/React application built for Cloudflare Pages
Advanced Mode. There is no database and no user account.

`app/(en)` owns the unprefixed English root. `app/[segment]` resolves either a
locale home page, an English SEO route, or a result route. Nested localized SEO
routes are handled by `app/[segment]/[slug]`.

`TestApp.tsx` is the client state machine:

`home → format → quiz → optional extension → loading → results`

Question data is loaded from `public/data/quiz.<locale>.json`. The final score
for each axis is the mean percentage toward its left pole. Only the resulting
twelve numbers are passed to `/api/match`.

`/api/match` validates exactly twelve numbers in the range 0–100, then requests
profile matches from:

`https://one2axes-backend.onrender.com/api/results/by-axes`

The upstream match service currently supports English and Portuguese result
copy. Spanish, Russian, and Chinese have fully localized site UI and question
banks, while proper profile names and match descriptions returned by that
service can remain English. Since 2026-08-01 the result page shows a short
localized notice on the Spanish, Russian, and Chinese routes stating that
profile names and descriptions may appear in English, and `/api/match` maps
the requested language through an explicit allowlist (`en`, `pt`) before
calling the service.

## Quiz selection rules

- Short: three questions per axis, 36 total.
- Full: five questions per axis, 60 total.
- Extreme: all twenty questions per axis, 240 total.
- Short extension: one unused left-directed and one unused right-directed
  question per axis, 24 total.

Short and full selection alternates which pole receives the extra question on
odd question counts so the complete test is balanced across axes.

## Share URL contract

The query values are left-pole percentages in this exact order:

| Parameter | Axis |
| --- | --- |
| `est` | State |
| `rep` | Representation |
| `pod` | Power |
| `imi` | Immigration |
| `dip` | Diplomacy |
| `int` | Intervention |
| `eco` | Economy |
| `con` | Control |
| `com` | Commerce |
| `rel` | Religion |
| `mor` | Morality |
| `tec` | Technology |

The public result URL contains scores only. It never contains the individual
answers, a name, email address, or account identifier.

## Localization

Supported locale codes:

| Route | HTML language | Source |
| --- | --- | --- |
| `/` | `en` | English |
| `/pt` | `pt-BR` | Portuguese |
| `/es` | `es` | Spanish |
| `/ru` | `ru` | Russian |
| `/zh` | `zh-CN` | Simplified Chinese |

English and Portuguese questions come from the functioning 12Axes API.
Spanish, Russian, and Chinese files were generated from the same IDs, axes,
weights, and answer values so scoring remains identical. Re-run
`node scripts/prepare-quiz-data.mjs` only when the upstream question bank must
be refreshed.

## SEO implementation

- Unique title, description, canonical, and H1 for every route and locale.
- Bidirectional hreflang cluster with `x-default`.
- Request-derived production origin; no hardcoded canonical domain.
- `WebApplication`, `FAQPage`, and `WebPage` JSON-LD.
- Dynamic `robots.txt` and sitemap with the full locale/page matrix.
- Open Graph and Twitter social image at `/og.png`.
- Editorial recovery, results, ideology, and comparison pages based on the
  research keyword clusters.
- The Worker forwards the incoming request origin to the Metadata API so
  canonical, hreflang, Open Graph and social-image URLs never fall back to a
  localhost origin.
- `/vercel-app` is an evergreen independent-alternative page. The source
  keyword report's 2026-07-31 outage observation is historical; do not restore
  a live outage claim without checking the external site again.

The full page map and acceptance record are in `docs/onpage-seo-plan.md`.

## Validation already performed

- Production build succeeds.
- Automated rendered-HTML tests pass.
- Each locale has exactly 240 questions across 12 axes.
- Desktop snapshot comparison completed at the original desktop layout.
- Complete 36-question neutral-answer flow completed.
- Optional extension screen displayed at question 36.
- Result service returned axis bars, ideology matches, country, and personality.
- Shared result URL survived reload and hydrated correctly.
- Chinese route emitted `lang="zh-CN"`, localized metadata, canonical, and all
  hreflang links.
- Mobile viewport at 390 × 844 had no horizontal overflow.
- The 2026-08-01 AUDIT+FIX scan verified all 40 sitemap pages return 200,
  self-canonicalize, have unique Title/Description and one H1, and are reachable
  from the homepage through ordinary links.

## Development and deployment

```bash
npm install
npm run dev
npm test
```

The public repository is `https://github.com/olokojoh/12axes`; `main` deploys
through the Cloudflare Pages native GitHub integration. The build bundles the
vinext server entry as `dist/client/_worker.js`, and Pages publishes
`dist/client`. `wrangler.jsonc` records the Pages output directory and Functions
compatibility settings. The internal `sites` Git remote and
`.openai/hosting.json` remain local and are not GitHub deployment targets.

The public contact channel is the repository's enabled Issues page:
`https://github.com/olokojoh/12axes/issues`.

## Known dependency

The site itself and question banks are static, but result matching depends on
the external `one2axes-backend.onrender.com` service. If it is unavailable, the
quiz answers remain in the current browser session and no result profile can be
resolved until the service returns.

## 2026-08-01 AdSense remediation (local changes)

These changes were made in the working tree ahead of the AdSense review
submission. No build, test, or network verification ran in this pass; formal
verification is owned by the next Codex phase.

- Privacy page (all five locales): removed the absolute "no advertising
  cookies" claims; added sections naming the external match service
  `one2axes-backend.onrender.com`, describing Google AdSense advertising
  cookies from third-party vendors, linking Google Ads Settings, Google's
  partner-data page, and the AboutAds opt-out page, and stating that EEA, UK,
  and Swiss visitors will pass a certified consent tool before personalized
  ads are shown.
- `/results` (all locales): per-axis guide for the twelve dimensions, a
  section on reading balanced results, and a list of common misreadings.
- `/ideologies` (all locales): removed the unverifiable "153 profiles" claim,
  added a one-line description per family and a section explaining that
  matches come from the external service.
- Comparison pages (all locales): added shared-lineage, "when the shorter
  test fits better", and limitations sections. Competitor statements stay
  within the facts already present in the comparison table.
- `/vercel-app` (all locales): added a walkthrough of the test flow and an
  independence statement.
- Result page: Spanish, Russian, and Chinese routes show a localized note
  that profile names and descriptions may appear in English.
- `/api/match`: the requested language now passes through an explicit
  allowlist (`en`, `pt`); behavior is unchanged.
- Removed the unused template file `app/chatgpt-auth.ts` and the empty
  `app/_sites-preview/` directory.

The authorized AdSense seller record is stored in `public/ads.txt`; every
production build verifies the exact line before compiling. A real public
contact channel is linked in every footer. AdSense site connection and a
certified CMP are still open. The licensing basis for the external
profile/country/personality data also remains unverified.

The pcManager promotion session is operationally independent from this
release. It must not be stopped, paused, restarted, or modified by deployment
work. Link-spam, AdSense-review, and reputation concerns are recorded as known
risks rather than treated as release controls.

Follow-up after the 2026-08-01 formal verification (R04): the privacy pages
no longer claim that "no result is stored anywhere" when the match service is
down (all five locales now state that no match profile is produced and raw
answers stay in browser memory); `docs/onpage-seo-plan.md` was aligned with
the shipped pages (153-profile wording, privacy section list, Vercel-page
status claim); `types/cloudflare.d.ts` provides minimal ambient Worker types
so a standalone `tsc --noEmit` can pass, pending a proper
`@cloudflare/workers-types` dependency; and the mobile stylesheet no longer
hides non-active language links on SEO pages.
