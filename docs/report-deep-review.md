# Deep report review and acceptance

## Local verification

- Build, TypeScript and ESLint pass. 42 automated tests pass, including five-language Deep purchase/unlock, complete balanced answer/version validation, explicit answer consent, encrypted payloads, no raw answer storage for Basic/Plus, non-mutating simulations, arbitrary profile search, original report preservation, sequential upgrades/refunds and pending-checkout replacement after changed answers.
- Existing rapid-click quiz regression passes in all five languages for 36→No and 36+24 completion, plus keyboard focus, Back/Next and retake behavior.
- Browser checks pass for all five Deep reports: 36 evidence rows, simulation of a changed answer, profile search, 30 Plus tables in print, and no horizontal overflow at 320/390/768/1280 CSS pixels.
- Browser-local progress preserves question order and chosen answers after reload. Completed free results recover identically; local deletion removes the saved record. PNG export is generated locally and contains only the visible result, without private tokens.
- All three integrated purchase buttons are aligned and fully visible in all five languages at 320×568, 390×844, 768×1024 and 1280×720. Reduced-motion disables the decorative stars. These are browser-emulated sizes, not physical-device testing.
- The frozen versioned question banks prevent future public question edits from silently changing an existing Deep report's answer evidence.
- Stripe test/live Prices are verified as active one-time USD amounts: 1499 direct, 1000 Basic→Deep, 500 Plus→Deep in all five languages. No live charge is made.
- Database backed up privately before migration 0005; local and remote migration succeeded. Existing orders retain their plan values.

## Claude Code review

Local Claude Code reviewed the implementation read-only, with a separate focused payment review. Valid findings were applied: empty upgrade-token rejection, order-independent evidence comparison, canonical scoring across frozen translations, explicit subset labels, no-store on invalid checkout requests, status-guarded failure updates, and recovery from a Stripe 404 for a stale pending upgrade. Additional regression covers cancellation restoring the owner’s answers without unlocking paid content.

The final UI review also led to clearing stale share links when starting/resuming a quiz, hiding the saved-progress claim after deletion or failed browser storage, and retaining the restored quiz if result fetching fails. The review was split across bounded passes; its findings were checked against actual code rather than treated as automatic release blockers.

The review also raised findings that did not match the implementation: library routes exist and are exercised over HTTP; support deletion already erases root and child report payloads; localized Stripe Prices are provisioned. Goodwill partial refunds intentionally retain access. Full ancestor refunds intentionally revoke dependent upgrades; this is now stated in all five refund policies, with related charges handled together by support. Only the root link is delivered to upgrade buyers, so a child-token fallback is not needed.

The existing Stripe redirect contains a private bearer link; the five-language privacy policy now states that Stripe processes this return link. Replacing it with a checkout-session ID alone would only replace one bearer credential with another. No answer/score is sent to Stripe metadata or analytics. Internal SELECT results are not spread into API responses.

## Deployed sandbox acceptance

Completed on 7 October 2026 (Asia/Shanghai), using the Git-deployed dev preview and Stripe test cards only.

| Language | Basic / Plus / Deep test payment and unlock | Basic→Deep $10 / Plus→Deep $5 | Deep delivery email and recovery form/email | Private link after clearing browser site storage | Refund downgrade / revocation |
| --- | --- | --- | --- | --- | --- |
| English | Pass | Pass | Pass | Pass | Pass |
| Portuguese | Pass | Pass | Pass | Pass | Pass |
| Spanish | Pass | Pass | Pass | Pass | Pass |
| Russian | Pass | Pass | Pass | Pass | Pass |
| Chinese | Pass | Pass | Pass | Pass | Pass |

- 28 sandbox Checkout payments completed: 15 direct purchases, 10 Deep upgrades and a three-payment Basic→Plus→Deep chain. Stripe amounts, mode, currency and final payment state were checked independently from browser redirects.
- All 28 initial email jobs completed. For each of the five Deep purchases, the original and recovered localized emails were inspected in authenticated Gmail and their private links matched the order. This verifies delivery to the tested mailbox, not universal inbox placement.
- Every Deep report rendered 36 submitted evidence rows in its requested language. Hosted simulation changed the hypothetical score without changing stored evidence. Catalog exploration and the original Basic/Plus snapshots remained accessible after upgrade.
- The cross-device scenario was tested by clearing the site's cookies and browser storage, then opening the emailed bearer link. This establishes independence from the original browser's state; it is not a physical-device compatibility test.
- All 28 sandbox payments were refunded after acceptance. Refunding a Deep upgrade restored Basic/Plus; direct Deep and root refunds revoked access. Refunding the intermediate Plus payment removed dependent Deep access in the sequential-upgrade case.
- Private test identities, tokens and order records are retained only in ignored `.openai/` acceptance artifacts, not this repository document. No real card was charged.

## Release

Deploy through Git: push the final reviewed changes and acceptance record to dev, then fast-forward main. Production verification checks all five pricing pages and all three live Checkout configurations by creating and immediately expiring unpaid sessions; it never submits a real payment.
