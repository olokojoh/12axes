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

The review also raised findings that did not match the implementation: library routes exist and are exercised over HTTP; support deletion already erases root and child report payloads; localized Stripe Prices are provisioned. Goodwill partial refunds intentionally retain access. Full ancestor refunds intentionally revoke dependent upgrades; this is now stated in all five refund policies, with related charges handled together by support. Only the root link is delivered to upgrade buyers, so a child-token fallback is not needed.

The existing Stripe redirect contains a private bearer link; the five-language privacy policy now states that Stripe processes this return link. Replacing it with a checkout-session ID alone would only replace one bearer credential with another. No answer/score is sent to Stripe metadata or analytics. Internal SELECT results are not spread into API responses.

## Deployed sandbox acceptance

Pending completion; local unit tests do not establish hosted payment, email or cross-browser acceptance.
