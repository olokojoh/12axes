# 12Axes Test

Independent rebuild of the 12Axes political ideology test captured at
`https://web.archive.org/web/20260724211411/https://12axes.vercel.app/`.

The site includes the complete 36, 60, and 240-question flows, twelve-axis
scoring, ideology/country/personality matching, shareable result URLs, and
English, Portuguese, Spanish, Russian, and Simplified Chinese versions.

## Local development

Requirements: Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

The development server prints its local URL. Production verification:

```bash
npm test
```

`npm test` creates the production build and checks the rendered metadata,
localized routes, and all five 240-question data files.

## Important paths

- `app/TestApp.tsx` — home page, quiz, scoring, results, and result sharing.
- `app/i18n.ts` — UI copy and locale routing.
- `app/SeoPage.tsx` — supporting SEO pages.
- `app/site.ts` — metadata, canonical/hreflang, Open Graph, and schema data.
- `app/api/match/route.ts` — validated proxy to the comparison service.
- `public/data/quiz.*.json` — complete localized question banks.
- `scripts/prepare-quiz-data.mjs` — reproducible question-bank preparation.
- `docs/project-handoff.md` — architecture, behavior, and takeover notes.
- `docs/onpage-seo-plan.md` — SEO page map and validation record.

## Routes

English is served without a prefix. Other languages use `/pt`, `/es`, `/ru`,
and `/zh`. Every language also has:

- `/vercel-app`
- `/results`
- `/ideologies`
- `/12axes-vs-9axes`
- `/12axes-vs-8values`
- `/privacy`
- `/license`

The result route accepts the twelve original share parameters: `est`, `rep`,
`pod`, `imi`, `dip`, `int`, `eco`, `con`, `com`, `rel`, `mor`, and `tec`.

## Data and attribution

Questions are served locally. Final percentages are sent to
`one2axes-backend.onrender.com` to retrieve ideology, country, and personality
matches. Raw answers are not sent to that service.

The political-test lineage and upstream permission notice are documented in
[`LICENSE`](LICENSE). This rebuild is independent and is not affiliated with
Vercel or the disabled `12axes.vercel.app` deployment.
