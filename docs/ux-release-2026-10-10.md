# 12Axes results UX release — 2026-10-10

Based on [the GA4/GSC UX review](ux-analytics-review-2026-10-09.md). Status: implemented and locally checked; final sandbox delivery checks and production deployment are pending.

## User-facing changes

- Keep the US$4.99 / US$9.99 / US$14.99 prices and all existing entitlements. Each result card now shows its purpose and three highlights, with a direct purchase button. The expandable comparison preserves 4 / 8 / 12 included features. Mobile cards stack; desktop buttons align inside their cards. Star animation and reduced-motion support remain.
- Put free results, PNG download and consented public sharing beside the top match. Public sharing remains unchecked until the user agrees. Free-result navigation preserves private report credentials in the URL fragment; private report sharing remains separate.
- Show five-language fictional report samples, explicitly distinct from the visitor's result. Country profiles are model references, not population averages. Explain Deep's answer requirement inside its card before offering a new test.
- After 36 answers, show 36/36 and explain that the user can view the result or optionally answer 24 more, taking about four minutes. The copy does not claim a report has already been generated.

## Measurement changes

- Restore external referrer origins after analytics consent, stripping paths, queries and fragments. Exclude the site's own domains and Stripe, Link and Stripe network domains. Answers, scores, ideology labels and private access credentials remain excluded from event parameters.
- Record observed quiz segments, coarse progress, extension choice, result entry type, actual ≥50% purchase-button exposure, free-result view/click, successful PNG generation and Checkout creation success/failure/cancellation. `plan_state` distinguishes a purchasable Deep report from a prompt to retake the test.
- Late consent observes the current state; it does not fabricate earlier starts or completions. Measurement failure cannot prevent starting/resuming a test or delete its saved progress. Language switches and original/latest report toggles do not duplicate the same result exposure.
- Update the measurement disclosure in all five languages, effective 10 October 2026.

On 10 October, seven event-scoped GA4 custom dimensions were registered: `plan`, `plan_state`, `quiz_length`, `entry_type`, `measurement_entry`, `progress_stage`, and `choice`. GA4 processing is not immediate and the dimensions do not backfill historical reports.

`quiz_run_id` is intentionally **not** registered as a custom dimension because it has high cardinality. It can support event-level joins only in a raw export containing that parameter; this release does not enable an export. Standard reports should use the registered low-cardinality dimensions. For 36→60 extensions, always group progress by **both `quiz_length` and `progress_stage`**: the denominator changes, so stage 50 can occur once at each length, and a 60-question stage 25 is not retroactively created.

IDs identify an observed in-memory segment, not a person or a persistent cross-device test. Reload/resume starts a new segment. GA4 covers consenting, unblocked browsers only. Orders remain the source of truth for payment totals. These changes neither repair historical data nor demonstrate a conversion uplift. No pricing experiment or payment-method change is included.

## Claude Code review and second iteration

The first completed local Claude Code review read the implementation and tests. Its release-blocking finding was a measurement exception that could enter the saved-test failure path. The second iteration isolates measurement failures and adds a browser regression with an unavailable UUID generator.

Other actionable findings were addressed:

- Preserve completed-test resume attribution, deduplicate original/latest paid-report views, and make observation-start deduplication and `variant` consistent.
- Treat late consent consistently when starting or resuming; distinguish Deep purchase and retake exposures.
- Broaden internal/payment referrer exclusions and their tests.
- Use third-person fictional sample readings, correct the 36-question completion copy/eyebrow, and observe a compact heading for free-result visibility.
- Remove obsolete layout rules and the empty mobile currency row; check horizontal overflow with the feature comparison expanded.

Two review points are handled as reporting constraints above: high-cardinality run IDs and the changing progress denominator. The review also noted that an external origin can imply an affiliation; origin-only collection remains consent-gated and disclosed, without political answers or labels. No source-level review can certify mail delivery or Stripe end-to-end behavior; those require the acceptance checks below.

Follow-up Claude Code review: pending final disposition.

## Verification

- Production build, TypeScript and changed-file ESLint pass. The full lint run has zero errors and one pre-existing warning in an ignored scratch script.
- **55 automated tests pass**, including analytics consent/privacy and existing billing, entitlement and refund coverage.
- Browser tests pass in all five languages for rapid 36→results and 36+24→results. Keyboard focus, Back/Next/reset and direct 60/240-question flows pass. An initial development hot update interrupted one 240-question run; a fresh complete run after edits stopped passed.
- Language changes preserve quiz answers, extension/loading stage, result scores, sharing consent/open state, purchase consent and the recovery draft.
- **20 layout combinations pass:** 320/390/430/1280px × en/pt/es/ru/zh. Checks include readable mobile controls, ≥44px actions, desktop alignment, no horizontal overflow with the comparison expanded and all 4/8/12 entitlements.
- Browser measurement checks pass for rejection, mid-quiz/result-only consent, event deduplication, actual button visibility, mocked Checkout failure, sensitive URL/parameter filtering and a single observed segment through 36→60. UUID failure does not break resume or delete saved progress.
- Actual PNG download is 1080×1450. Sharing is unavailable until public-sharing consent.

## Sandbox and release checklist

No real-money purchase is part of this validation. Sandbox acceptance covers each of the five languages and all three report tiers.

| Check | Current result |
| --- | --- |
| Stripe sandbox payments | 15/15 paid test purchases confirmed |
| Report API unlock and tier entitlements | 15/15 confirmed |
| Transactional email submission | Provider acceptance confirmed for the 15 purchases; inbox delivery is a separate check |
| Gmail inbox receipt and correct localized links | Pending |
| Email report recovery in each language | Pending |
| Private-link access from a clean browser state / cross-device equivalent | Pending |
| Sandbox refund and revoked access | Pending |
| Final Claude Code follow-up disposition | Pending |
| Push final iteration to dev, merge main and production verification | Pending |

Complete and record the pending gates before marking this release live. Private order IDs, report tokens and recipient addresses are intentionally excluded from this report.
