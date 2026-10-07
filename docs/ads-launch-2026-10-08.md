# Google Ads setup — 2026-10-08

The requested experiment is one Brazil/Portuguese Search campaign, exact 12axes-related keywords, one responsive search ad, Google Search only, Maximize Clicks with a US$0.04 CPC cap, US$5 average daily budget, and a seven-day initial observation period. US$30 is a review threshold, not a platform hard spending cap.

## Completed setup

- GA4 property `549901989` and stream `15438421657` verified against the existing measurement ID.
- Disabled Enhanced Measurement so automatic form/outbound/history events cannot bypass the source filters.
- Linked Google Ads account `166-761-0037`; personalization and embedded GA4 management access disabled, auto-tagging selected.
- Imported `12axes.net (web) purchase` (conversion ID `7827714845`).
- Added separate optional ad measurement consent and a server-confirmed, single-claim purchase receipt. No political results, report credentials or email are sent to Google.
- Applied additive D1 migration `0006_purchase_measurement.sql` to the existing shared production/preview database.

## Verification and boundaries

- Server tests cover consent, unpaid/refunded/test orders, ownership, concurrent duplicate claims, and actual upgrade amounts.
- Client tests cover attribution consent, private URL filtering, preview isolation, loading/return timing and duplicate reporting.
- Payment status continues to come from the existing signed Stripe webhook. No production charge was made for verification.
- Browser measurements can undercount; refunds remain reconciled in Stripe. See `GA4.md`.
- Google political-content policy, Brazil section, inspected in Chrome: prohibits political-electoral ads featuring elections, political parties/federations/coalitions, elected positions, government proposals, legislative bills, voting/political rights or electoral matters. An educational label alone is not an exemption. Source: https://support.google.com/adspolicy/answer/6014595?hl=en#zippy=%2Cbrazil

Campaign setup, deployment evidence, and final activation status will be recorded after verification.
