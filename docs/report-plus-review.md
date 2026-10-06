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

## Result CTA and quiz navigation regression — 2026-10-06

Reproduced three rapid answer clicks advancing from question 1 directly to question 4. Each click queued a separate timer, leaving unanswered questions behind. Choosing No after question 36 then changed the missing-question index without leaving the extension screen or displaying its error.

The fix permits one pending advance, saves answers with a functional state update, and cancels the timer on manual navigation, reset, home and unmount. Missing answers return to the quiz with the error visible. The results CTA now shows both prices together and links to each purchase card; both purchase buttons have two short shine cycles when enabled, respecting reduced-motion preferences.

Validation:

- Browser regression in all five languages: eight immediate clicks per question, all 36 questions followed by No, and 36 + 24 questions followed by results. No skipped questions or completion errors.
- Direct 60- and 240-question versions also pass with rapid clicks. Back, Next, retake and home cancel pending navigation; Back preserves answers and retake clears them.
- Both prices fit at 320, 390 and 1280 CSS pixels in all five languages. Both buttons require consent, animate only twice, stop animating under reduced-motion preferences, and the Plus anchor reveals its card.
- Build, 32 automated tests, TypeScript, ESLint and whitespace checks pass. Payment, entitlement, email and recovery implementations are unchanged from the sandbox acceptance above.

The reproducible browser regression is `tests/quiz-browser.mjs`. From an existing ego-browser task, import `verifyQuiz` and call it with that task's page and a running local or dev base URL. It performs no checkout or payment.

Local Claude Code reviewed this patch separately. Its keyboard-focus finding was reproduced: native disabling moved focus to the document body. Answers now use `aria-disabled` while the synchronous ref guard rejects repeated activation; a keyboard regression checks focus after advancing. Its fragment warning also applies to unpaid checkout-return previews, so plan links scroll without replacing a report fragment. The existing button base already uses `inline-flex`, and no extra layout rule or unreachable extension timer cleanup was added.

## Plan comparison cards and visible checkout — 2026-10-06

Both unpaid report cards now list the same seven features in all five languages. Basic retains its four included features and marks three Plus-only comparisons with red crosses; Plus marks all seven with green checks. The same-row purchase buttons sit in a sticky footer bounded by the result offer. Its offset follows the analytics banner's measured height, and the footer leaves the viewport when readers reach the free results. Result entry resets scrolling instantly, and the exposure observer tracks the visible checkout footer.

Local Claude Code reviewed the patch in read-only mode. Its localized-price finding was fixed with short localized USD labels, and the existing browser regression now checks the entitlement matrix. The conditional star-position warning does not apply: the stars are absolutely positioned. The claimed restriction on subgrid and implicit tracks was not reproduced; browser geometry confirms aligned rows. Two mobile columns are intentional, with wrapping for long localized words. Instant scroll avoids the site's global smooth-scroll setting.

Validation: build, 32 automated tests, TypeScript, ESLint and whitespace checks passed. All five languages passed six CSS viewport sizes (320×568, 390×844, 768×1024, 1280×720, 1920×1080 and 844×390), checking alignment, full button visibility, hit targets, horizontal overflow and included/excluded features. Five-language quiz regression covered 36 → No and 36 + 24 questions. Consent toggling, analytics-banner dismissal, footer release and reduced-motion preferences also passed. Desktop and Russian mobile screenshots were inspected. These checks use browser emulation, not physical phones; payment, report and delivery code is unchanged.

## Integrated cards and in-place language switching — 2026-10-07

Purchase buttons are back inside their respective feature cards, below the price and above the comparison list. The shared sticky checkout is removed. Compact result headings keep the top match and purchase actions visible; match descriptions remain expandable. Five locales passed 20 CSS viewport checks at 320×568, 390×844, 768×1024 and 1280×720. On short phone screens analytics consent remains in normal document flow to avoid covering the card actions.

TestApp now changes locale without replacing the document. Question IDs/order, answers/index, calculated percentages, paid credentials and child form state stay in memory. Localized question/result requests cancel superseded responses; the pending-result screen also exposes language selection. Header and footer locale controls use the same behavior. Equal match scores retain a locale-independent order. Recovery status messages and existing friend comparisons relabel without clearing their input or values.

Local Claude Code reviewed the implementation read-only. Adopted its concrete observations about reserving the exchange-rate row and localizing result-route metadata. Verified the fixed question IDs/scoring and axis order across all five shipped banks, rather than adding fallback answers or speculative report caching. There are no remaining BrlEstimate or analytics-banner-height consumers. Report reads are repeatable, and existing amount labels are defined in every locale.

Currency references now cover BRL/PT, EUR/ES, RUB/RU and CNY/ZH, with USD/EN. They use a dated attributed exchange rate, validate all required positive rates and freshness, and remain explicitly estimates. Actual Stripe charges and the 499/999/500 cent entitlement validation are unchanged. This does not infer residence from language or assert payment availability in any country.

Validation: build, TypeScript, ESLint and 33 automated tests pass. Existing question-bank tests additionally assert identical IDs, scoring and axis order across languages. Browser tests preserve home/format/question/extension/result/loading state, result values, paid Plus access, expanded details, friend comparisons and recovery drafts. The repeatable entry point is `tests/locale-browser.mjs`; its paid fixtures use local synthetic orders, not real payments. Five-language rapid 36/60-question regression remains covered by `tests/quiz-browser.mjs`.
