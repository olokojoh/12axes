# GA4

- Property: `12axes.net`, ID `549901989`, account `385899329`.
- Web stream: `https://12axes.net`, ID `15438421657`.
- Measurement ID: `G-CE8EXPY4K6`.
- Shared integration: `app/Analytics.tsx` in both root layouts.
- Enhanced Measurement: disabled in GA4 on 2026-10-08; only explicit filtered events are collected.
- Google Ads account `166-761-0037` linked on 2026-10-08 with auto-tagging, personalized advertising disabled, and embedded Analytics management access disabled.
- Imported purchase conversion: `12axes.net (web) purchase`, conversion ID `7827714845`.
- Ads action is Primary, uses actual value/currency with US$0 fallback, and counts every purchase. It is not an account-wide default. Both `12axes_US_EN_Search_Exact_Total100` (`24336646225`, preferred) and `12axes_US_EN_Search_Exact_Test` (`24324270945`, backup) use campaign-specific purchase-only goals.

Analytics loads only on `12axes.net` and after analytics consent. Separate ad-measurement consent controls `ad_storage` and `ad_user_data`; `ad_personalization` and Google Signals stay disabled. Existing analytics consent is not upgraded to advertising consent. Campaign parameters are allowlisted; scores, private credentials, answers and emails are excluded.

`purchase` requires the original tab's pending checkout ID, a successful return, server-confirmed live payment, and analytics consent. `/api/purchase` atomically claims each payment once using migration `0006_purchase_measurement.sql`. Upgrade receipts use the actual extra payment. Recovering/reopening a report without a pending checkout cannot create a purchase. Local and preview hosts never load the production tag, and test Checkout sessions cannot produce receipts.

This is browser measurement, not a complete financial ledger. No consent, blocking, not returning from Checkout, network failure after a receipt is claimed, or cross-device completion can cause undercounting. Refunds are not automatically uploaded to GA4/Ads; calculate net contribution from Stripe/order records. The claim timestamp means a receipt was issued, not proof Google received it.

Validation on 2026-10-08: production build, TypeScript, server tests and client consent/attribution/receipt tests passed. Commit `e0caec8b0a3ba05f157f89c3d1bdb3751f74c986` deployed successfully to production (Cloudflare Pages deployment `4185d245-7e83-4871-9217-35c24d71e12b`); migration `0006` applied remotely.

Live Chrome Network verification: `gtag/js?id=G-CE8EXPY4K6` returned 200 and GA4 `g/collect` returned 204. Inspected payload used the correct measurement ID, `en=page_view`, cleaned `dl=https://12axes.net/privacy`, generic `dt=12Axes`, empty referrer and `npa=1`. GA4 Realtime shows ordinary page and quiz events. A new real purchase reaching GA4 still needs verification against the paid order. Real Ads attribution needs a subsequent genuine ad click and purchase after the experiment begins; neither a natural purchase nor a fabricated gclid proves Ads attribution.

Both US/English campaigns are published and paused, with zero spend at verification. The preferred campaign uses a US$100 campaign total budget for October 9–15, 2026 (account Pacific time), Maximize Clicks with a US$0.04 CPC cap, and `utm_campaign=us_en_exact_total100`. Its saved purchase goal, budget, CPC cap and URL suffix were read back after publication. Keep the US$5 average-daily-budget backup paused; enable at most one campaign after purchase validation. See `docs/ads-launch-2026-10-08.md` for settings, observed market data, UI instructions and activation conditions.
