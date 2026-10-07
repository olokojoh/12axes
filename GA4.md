# GA4

- Property: `12axes.net`, ID `549901989`, account `385899329`.
- Web stream: `https://12axes.net`, ID `15438421657`.
- Measurement ID: `G-CE8EXPY4K6`.
- Shared integration: `app/Analytics.tsx` in both root layouts.
- Enhanced Measurement: disabled in GA4 on 2026-10-08; only explicit filtered events are collected.
- Google Ads account `166-761-0037` linked on 2026-10-08 with auto-tagging, personalized advertising disabled, and embedded Analytics management access disabled.
- Imported purchase conversion: `12axes.net (web) purchase`, conversion ID `7827714845`.

Analytics loads only on `12axes.net` and after analytics consent. Separate ad-measurement consent controls `ad_storage` and `ad_user_data`; `ad_personalization` and Google Signals stay disabled. Existing analytics consent is not upgraded to advertising consent. Campaign parameters are allowlisted; scores, private credentials, answers and emails are excluded.

`purchase` requires the original tab's pending checkout ID, a successful return, server-confirmed live payment, and analytics consent. `/api/purchase` atomically claims each payment once using migration `0006_purchase_measurement.sql`. Upgrade receipts use the actual extra payment. Recovering/reopening a report without a pending checkout cannot create a purchase. Local and preview hosts never load the production tag, and test Checkout sessions cannot produce receipts.

This is browser measurement, not a complete financial ledger. No consent, blocking, not returning from Checkout, network failure after a receipt is claimed, or cross-device completion can cause undercounting. Refunds are not automatically uploaded to GA4/Ads; calculate net contribution from Stripe/order records. The claim timestamp means a receipt was issued, not proof Google received it.

Validation on 2026-10-08: production build, TypeScript, server tests and client consent/attribution/receipt tests passed. Live receipt of the new purchase event and real Ads click attribution still require verification after deployment; do not fabricate a production purchase for testing.
