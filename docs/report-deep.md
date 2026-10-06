# Deep Report release

Personal remains $4.99, Plus remains $9.99, and Deep is $14.99, all one-time USD prices with the existing localized currency estimates. Basic→Plus costs $5, Basic→Deep $10, Plus→Deep $5. Existing entitlements are preserved.

Free: browser-local quiz progress/result recovery for 30 days, deletion control, PNG result download, midpoint-answer counts and low-information notices. Paid bearer tokens are not written to local progress storage. This is browser-local storage, not anonymity or cross-device free recovery.

Plus adds arbitrary catalog search and 12-axis comparisons, political/social/economic subset ranking, country present-day/historical filters, personality occupational categories and furthest matches. Categories are catalog metadata/role groupings; they are not measured populations. The existing 30 comparisons and friend comparison stay available.

Deep additionally stores separately consented individual answer IDs, selected question IDs and question version in the encrypted order payload. Server validates the complete balanced questionnaire, answer values and scores before checkout. The frozen five-language question snapshot is in `app/data/report-quiz/2026-10-07.*.json`; retain old snapshots when revising the test. Basic and Plus orders do not store raw answers on the server.

Deep delivers question evidence for all axes, cross-axis explanations selected from the actual scores plus supporting answers, a one-answer what-if explorer with rescored ideology matches, and a three-topic reading/reflection plan ordered by distance from midpoint. Simulations never change stored answers or results. Reading references are educational SEP entries; they may be in English. Neither matching nor simulation measures accuracy or political identity. Print/PDF includes all evidence, interpretations and reading plans.

Legacy orders need a new quiz before Deep checkout. The upgrade stores the new snapshot separately, keeps the original report accessible and uses the original private link for delivery/recovery. Current entitlement determines the price difference server-side. Dependency IDs track successive upgrades so an intermediate refund removes dependent Deep access. Root refund revokes the whole family; existing deletion operation erases all family payloads. A refunded upgrade restores the highest remaining valid entitlement.

Migration 0005 widens the plan constraint while retaining existing values, adds upgrade dependency and replaces the old one-upgrade-per-parent index with a one-pending-upgrade index. Apply before dev acceptance. Stripe checkout still validates expected USD totals, live/test mode and webhook signatures; Link remains disabled. All acceptance uses test cards, never a real charge.

Validation and release evidence are recorded in `report-deep-review.md` after completion. Private test tokens, checkout URLs and test mailbox aliases stay under ignored `.openai/`.
