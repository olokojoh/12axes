# Recovered report and social sharing — 2026-10-10

## Changes

- Paid reports open with their purchased tier, top model match, up to three strongest axis preferences, a midpoint count and links into the included report sections. Neutral synthetic results explicitly say that no pronounced preference was identified.
- Result actions share the report's centered container. Paid users see “View report details”; optional upgrades follow the purchased content and start collapsed. Existing Basic, Plus and Deep entitlements are preserved.
- Sharing requires explicit, initially unchecked public-sharing consent. The public link contains the free result only, never the paid report token, answers, order or email.
- Copy text/link, system link/file sharing, X/Facebook/WhatsApp/Telegram/Reddit entry points, local preview and PNG downloads are available in all five languages. Instagram/TikTok and similar apps use system image sharing or manual upload.
- Canvas generates 1200 × 630 and 1080 × 1920 PNGs with a QR code to the same public result. The landscape image is encrypted in D1; the portrait stays in the browser. Public HTML contains escaped, unique OG/Twitter tags without JavaScript. Image GET/HEAD works without cookies. The public image path is explicitly permitted by robots.txt; other API paths remain excluded. Uploaded images are immutable; a new language or result creates a new share URL.
- Preparing, ready, failed, unsupported and cancelled states are distinct. Image failure leaves the public text link usable. No native-share success is reported as a completed social post. The original private/local result download now reports export failure and is independent of analytics.

## Storage and rollout

Migration `0007_share_cards.sql` adds a table only. It references the existing `shared_results` table with cascading deletion. The existing one-year expiry/cleanup policy therefore also removes the public preview image. Upload capability tokens are stored hashed; public result and image payloads remain encrypted at rest. Privacy copy describes public access and third-party preview caching in all five languages.

The additive migration was applied to the shared preview/production D1 database before deploying the new reader. Application releases use the GitHub `dev` branch followed by `main`; no direct-upload deployment is used.

## Verification

- Production build, TypeScript and changed-file ESLint passed.
- All 69 automated tests passed, including 10 public-share integration cases and 4 client card/link tests, alongside the existing payment/report tests.
- Local browser sharing checks passed for five languages, actual Canvas PNG dimensions, copy success/failure, six simulated native-share outcomes, unsupported file/link handling, encoded platform links, upload retry, null-Blob recovery and locale cache cleanup.
- Paid report browser fixtures passed 30 language × tier × viewport cases, plus five neutral-result cases. All purchased sections and hash-preserving section navigation remain available. Expanded sharing also fits a 320px viewport.
- Real original local PNG download, injected export failure and subsequent retry passed without publishing a result.
- macOS Vision decoded both generated PNGs to their expected public URL.

Native OS sharing is capability-dependent. Automated native success/cancel/error checks exercise the browser handler with controlled native API responses; they do not establish that a post was published. External platform rendering and caches remain controlled by each platform.

## Review iteration

Local Claude Code performed a read-only review using actual source reads. Its confirmed P2 finding was that unchecking sharing consent after publication could imply withdrawal even though the public link remained active. The second iteration locks that consent once a link is created, preserves publication status across language changes, and provides localized contact links for removal. Existing expiry and deletion jobs also cascade to preview images. Root review additionally fixed overlapping landscape labels and the robots rule that otherwise excluded preview images.

Claude Code's final follow-up confirmed that the consent finding is resolved, the five-language copy is complete, and the robots exception is correct. It reported no remaining confirmed actionable findings in this patch. Final build, TypeScript and all 69 tests passed after the second iteration.

## Hosted preview acceptance

Cloudflare's native Git deployment for `dev` commit `8e59375` completed successfully. All five languages passed real browser creation and upload, first-response OG/Twitter HTML, unauthenticated PNG GET/HEAD, portrait download and opening the corresponding free result. All ten downloaded landscape/portrait PNG QR codes decoded to their own live preview URL. URLs remained on the configured dev origin. Requests with a social-crawler user agent also received the correct HTML, and robots allowed the public image path.

The retained authorized sandbox Basic report from the recovery email passed all five languages via real dev UI and independent cookie-free API requests. Summary, 12 paid readings, top 10 matches, collapsed upgrades, language switching and reload preserved access. No new email or payment was sent in this task; payment behavior remains covered by the existing automated regression suite.

Facebook's actual composer-preview check was blocked by a browser-owned notification permission prompt, which transferred the TaskSpace to user control. Browser operation stopped immediately; no Publish/Send action occurred. Actual Facebook preview rendering is **not verified**. The synthetic Web Share browser tests also do not replace testing an actual receiving mobile app.
