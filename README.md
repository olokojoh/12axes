# 12Axes Test

Independent 12-axis quiz implementation with English, Portuguese, Spanish,
Russian and Simplified Chinese interfaces.

**2026-10-06: Report Plus release, in all five site languages.**
Production: https://12axes.net. Preview: https://dev.12axes-1dg.pages.dev (Stripe test mode only).
Sandbox payment, recovery, duplicate webhook and refund revocation passed; no real payment was made for verification.
The October 6 acceptance run confirmed purchase and recovery emails in Gmail Inbox; this does not certify delivery to every mailbox provider.
Matching runs locally against a pinned reference catalog. The owner approved encrypted Cloudflare D1
storage and requested skipping the content authorization review; commercial
authorization has not been verified.
See [the implementation record](docs/monetization-implementation.md) for completed
infrastructure, verification, design decisions and remaining launch work.

The Report Plus implementation and release checks are described in [Report Plus](docs/report-plus.md).

## Development and validation

Node.js 22.13 or newer is required.

```bash
npm install
npm run dev
npm test
npx tsc --noEmit
npm run lint
```

`npm test` builds the Cloudflare Pages artifact, tests localized HTML and
commerce pages, then exercises encryption, consent, report access, Stripe
webhook processing, refunds, recovery and email retries against local D1.
Fixtures are synthetic and email delivery is mocked.

## Important paths

- `app/TestApp.tsx`: quiz, free results, optional report and sharing UI.
- `app/Analytics.tsx`: consent-gated analytics with filtered event parameters.
- `app/CommercePage.tsx`: localized privacy, terms, refund, pricing, about and contact.
- `app/api/checkout`, `app/api/stripe`, `app/api/report`: payment and report access.
- `app/api/share`: consented, encrypted, expiring public result links.
- `app/api/support`: private encrypted support submissions.
- `app/api/match`, `app/lib/matching.ts`: local profile matching; no upstream API dependency.
- `scripts/import-matching-data.mjs`: imports the catalog from a pinned source revision.
- `worker/report-email.ts`: durable email delivery and expired-record cleanup.
- `scripts/retry-report-emails.mjs`: requeue failed delivery jobs after checking order access.
- `scripts/support-inbox.mjs`: support review and verified deletion requests.
- `wrangler.email.jsonc`: separate queue consumer deployment.
- `migrations`: D1 schema; no plaintext answers or axis scores.
- `public/data/quiz.*.json`: existing question banks.

## Privacy and reports

The preview does not load advertising scripts. Analytics loads
only after consent; GA4 dashboard settings still need verification.
Explicit consent is separate for sharing and buying a report.

The owner approved encrypted result storage in Cloudflare D1, linked to an
order and payment email, for cross-device recovery. This **is storage, not
anonymity**. Public share links do not include experimental assignments or
private report tokens. Private report credentials use URL fragments and POST
requests. All report APIs return `no-store`.

The basic report costs US$4.99, Report Plus costs US$9.99, and an existing basic report can add Plus for US$5. All are one-time purchases, without subscriptions,
false discount anchors, invented country averages, or permanent access promises.
PDF export currently uses browser print/save, not an emailed PDF attachment.
Full refunds revoke online access; downloaded files cannot be revoked.
Portuguese pages show a dated BRL estimate, while checkout charges USD.
The paid result can be copied directly as a private link if email is delayed.

## Routes and licenses

English has no language prefix; other locales use `/pt`, `/es`, `/ru`, `/zh`.
Supporting pages include `/results`, `/ideologies`, `/vercel-app`, comparisons,
`/license`, and the six commerce pages. Old score-parameter links are read for
compatibility and removed from the browser URL; this cannot erase historical
CDN or server logs.

The legacy notice in `LICENSE` must not be represented as permission covering
all current questions and matching profiles. The owner requested skipping the
authorization review; no verified commercial-license claim is made.
No access-control bypass is implemented.
