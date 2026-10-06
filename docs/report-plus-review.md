# Report Plus review and acceptance

## Claude Code review

Local Claude Code 2.1.261 reviewed the implementation in read-only plan mode before the dev commit. Its final review identified checkout configuration, upgrade-link lifetime, delivery origin, erasure scope, and test coverage issues. The following changes were made:

- Disable Adaptive Pricing explicitly. Validate the returned Stripe session's amount, USD currency, and test/live mode before exposing its URL; expire a mismatched session. Keep signed webhook amount verification and retries rather than silently acknowledging an unfulfilled payment.
- Independently retrieve and verify all 30 configured Stripe Prices (five languages × basic/Plus/upgrade × sandbox/live): active, one-time, USD 499/999/500, correct environment.
- Upgrade success and upgrade emails use the original basic report token. An upgrade-only refund leaves that link usable with basic entitlements.
- Delivery origins must be the configured production or dev domain; never derive emailed bearer links from a request host. Preview documentation points to dev.
- Erasure resolves either a basic or an upgrade order to the root and clears the family, preserving accounting.
- Add currency, checkout mismatch, upgrade-price, original-link refund, already-Plus, legacy default, and email-origin/parent-revocation tests.
- Round axis gaps to one decimal and enforce five-language copy key parity.

The review's claim that Adaptive Pricing replaces Checkout `amount_total`/`currency` with the buyer's currency was checked against Stripe's current documentation. Stripe's example keeps original USD totals and puts converted amounts in `presentment_details`. This claim was not used as a reason to weaken webhook verification. Reference: https://docs.stripe.com/payments/currencies/localize-prices/adaptive-pricing

Print-only comparison tables are intentional: collapsed details must still print in full across browsers. Ranking reuse and unrelated defensive checks were not added without a demonstrated need. Current comparisons cover only 867 local catalog entries, not an external AI service.

Local validation: build and all 32 tests passed, TypeScript and ESLint passed. Browser sandbox acceptance is recorded below after dev deployment; these local tests alone do not certify payment or email delivery.


## Five-language sandbox acceptance — 2026-10-06

Accepted on the Git-triggered dev deployment of implementation commit `394d324`, at https://dev.12axes-1dg.pages.dev. The only subsequent product edit shortens one Chinese heading; no payment or entitlement behavior changed. Migration 0004 is applied. Email worker version: `ca04502a-4008-4533-89e1-fba7af5eff15`.

| Language | $4.99 purchase + unlock | $9.99 purchase + unlock | $5 upgrade + original link | Purchase / recovery email | Independent browser access | Friend comparison / mobile / print |
|---|---|---|---|---|---|---|
| English | Pass | Pass | Pass | Pass, Gmail Inbox | Pass | Pass |
| Portuguese | Pass | Pass | Pass | Pass, Gmail Inbox | Pass | Pass |
| Spanish | Pass | Pass | Pass | Pass, Gmail Inbox | Pass | Pass |
| Russian | Pass | Pass | Pass | Pass, Gmail Inbox | Pass | Pass |
| Simplified Chinese | Pass | Pass | Pass | Pass, Gmail Inbox | Pass | Pass |

- Completed 15 actual Stripe **test-mode** Checkout payments using Stripe's test card: five per price tier. Verified `livemode=false`, USD amounts, localized Checkout, Link disabled, signed webhook fulfillment, report data and browser redirects. No real charge was made.
- Submitted each localized Plus recovery form, observed its success message, verified the queue's recovery timestamp, then inspected Gmail and checked that the received report link matches that order and language. Upgrade emails in all five languages point to the original basic report link.
- Cross-device behavior was simulated with **independent browser storage**: payments in Ego Browser, report links in Codex's in-app browser, plus HTTP requests without cookies. This checks that the original browser's cookies/local storage are unnecessary; no physical second phone was used.
- Each language displays all 30 Plus profiles, compares 12 axes with a synthetic friend's public link, and has no page-level horizontal overflow at a 390px viewport. Print media exposes all 30 profile comparison tables and the friend table. Desktop layout and a Chinese expanded comparison table were visually inspected.
- Refunds were exercised against real sandbox payments: refunding the English parent revoked both parent and dependent upgrade access; refunding the other four upgrades left their original links usable as basic reports. Refunding Plus and the remaining basic orders returned 404 for the reports. All 15 synthetic orders were refunded after verification.
- Build, all **32 automated tests**, TypeScript and ESLint passed again after the final copy edit. Local tests also cover duplicate webhook processing, email retries, legacy $4.99 defaults, invalid amount/currency, consent, expired shares and revoked access.

Private tokens, test session URLs, mailbox aliases and detailed API evidence remain in ignored local acceptance files, outside Git. These acceptance results do not predict paid conversion rates or guarantee inbox placement for every provider.
