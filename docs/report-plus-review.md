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
