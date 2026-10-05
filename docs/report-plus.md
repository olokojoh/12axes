# Report Plus release

Report Plus costs US$9.99 once. The US$4.99 report and all existing purchases retain their current features: axis readings, 10 ideology matches, private link, email recovery and browser print/PDF. Free results still show four ideology matches plus the country and person.

Plus adds 10 country reference profiles, 10 personalities and comparisons of all 12 axes for each of the 10 ideologies, countries and people. Each shows smallest/largest score gaps and localized descriptions. These are modeled profiles, not population averages or scientific probabilities.

A Plus buyer can paste a friend's voluntarily shared public result link and consent to compare the 12 axes. The friend uses the free test and sharing flow. Comparison output is not saved separately. Private paid-report tokens are never invitations or share links.

A paid basic report can be upgraded for US$5. The server loads its saved scores and verifies its payment environment; browser-supplied price, scores and entitlements cannot grant an upgrade. Pending upgrades reuse checkout. The original report link gets Plus after successful payment. Refunding an upgrade restores basic access through the original link; refunding the original order revokes its dependent upgrade. The localized pricing page explains this before payment.

Migration `0004_report_plus.sql` defaults existing orders to basic/499 USD cents and adds expected amount, parent order and delivery origin. Only signed successful Stripe Checkout events with the expected amount and USD currency grant access. New sandbox emails link to dev; older orders retain their original delivery domain. The queue worker must be deployed after this additive migration and before sandbox acceptance.

Deployment order: local tests → Claude Code review → fixes → commit/push dev → D1 migration and email worker → five-language sandbox acceptance → merge/push main → verify Git production deployment. All payment acceptance uses Stripe test cards. Existing Gmail spam placement remains a delivery limitation; report access and copying do not depend on inbox placement.

Tests added for five-language checkout selection, paid-only extended data, matching differences, amount validation, pending checkout reuse, upgrade and parent refunds, consent and expiring friend links, and five-language pricing. Credentials and synthetic acceptance records are stored only in ignored local files.
