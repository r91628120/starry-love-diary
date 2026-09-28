# Build 20 Release Handoff

## Official Baseline

- App: 星星戀愛日記 / Starry Love Diary
- Bundle ID: `com.miracle.starrylovediary`
- Marketing version: `1.0.0`
- TestFlight build: `20`
- Remote branch and HEAD: `main` / `b833bed4be7ce7dedaa173d0c17d218dc03bff33`
- Build-number commit: `b833bed` — `chore(ios): bump build number to 20`
- Heart Card V2 commit: `7bfe7d1` — `feat(heart-card): finalize V2 layout and content-aware wrapping`
- Official uploader: `.github/workflows/ios-testflight.yml`
- Workflow run: https://github.com/r91628120/starry-love-diary/actions/runs/36447002967

Build 20 completed Web build, Capacitor sync, iOS archive, IPA export, and TestFlight upload successfully. Apple accepted the IPA; App Store Connect processing may still be pending. **Do not upload Build 20 again.**

## Heart Card V2 — Sealed in Build 20

### Layout and title

- Canvas: `1080 × 1350`.
- Top image: `y=0–560`; lower text panel: `y=560–1350`.
- Built-in backgrounds and My Photo both use the same top-image / lower-text layout.
- Title is drawn only in the lower panel: `x=540`, baseline `y=615`, weight `600`, color `#76546f`, safe width `880`, candidates `[28, 26, 24]`.
- Title is a single line and uses `measureText()` to select the largest safe size.

### Body fitting contract

- Safe box: top `640`, bottom `1220`, height `580`, center `y=930`, width `880`.
- Font candidates: `[56, 46, 38, 34, 32, 30]`.
- Each candidate is rewrapped and measured for line width and total height; the first safe maximum size wins.
- If `30px` cannot fit, rendering fails explicitly. Never use silent truncation, ellipsis, or automatic summarization.

### 300-grapheme contract

- Message To You and Heart Card maximum: `300 graphemes`.
- Counting uses `Intl.Segmenter` with `Array.from()` fallback and supports emoji, ZWJ emoji, skin tones, and combining characters.
- The former 60-character card limit and first-60-character slice are removed: Heart Card is `300 → 300`.
- Existing or restored content above 300 remains intact. Creating a card from it shows a localized limit error; it does not modify or silently truncate the original content.

### Content-aware wrapping (do not revert)

Body wrapping is based on the actual content units, **not** the App UI locale. The former locale-driven CJK branch split normal English words when a zh-TW UI rendered English content.

- Latin words remain whole: `felt`, `wonder`, `ordinary`, `laughter`, `walking`, `sharing`.
- Spanish/French preserve accented characters and apostrophes: `distancia`, `cielo`, `l'amour`, `C'est`.
- CJK retains grapheme wrapping.
- Mixed text such as `今天真的很開心，Thank you for being with me. ❤️ 希望以後也能一起看很多漂亮的風景。` keeps English words intact while allowing natural CJK wrapping.
- Only a single unit that itself exceeds the safe width may use the final grapheme fallback to prevent canvas overflow.

Localhost manual QA passed for Chinese, English, long English, zh-TW UI with English body, and mixed Chinese/English. Do not refactor this renderer without a confirmed bug or explicit product decision.

### V2 built-in images

Build 20 includes:

- `heart-card-bg-01-starry-night-v2.png`
- `heart-card-bg-02-sunny-garden-v2.png`
- `heart-card-bg-03-blue-beach-v2.png`
- `heart-card-bg-04-romantic-sunset-v2.png`
- `heart-card-bg-05-winter-night-v2.png`
- `heart-card-bg-06-sakura-moonlight-v2.png`

Legacy non-V2 backgrounds `02`–`06` remain local and untracked. Do not delete them without separate verification.

### Final Heart Card verification

- Final seal: `88` test files / `826` tests passed; lint, production build, and diff check passed.
- Temporary runtime instrumentation was removed: `[HeartCardDebug] = 0`, `console.debug = 0`.

## Local-only Clear / 清醒 Work — Not in Build 20

**IN PROGRESS / LOCAL ONLY / NOT IN BUILD 20.** The following current working-tree files are deliberately uncommitted and must be preserved:

- Modified: `src/data/clearPersistence.test.ts`, `src/features/clear/ClearContent.tsx`, `src/features/clear/ClearFreeTalkFlow.test.tsx`, `src/features/clear/clear.css`, `src/i18n/clearLocalization.test.ts`, `src/i18n/messages.ts`.
- Untracked Clear work: `src/features/clear/ClearHistoryAiHandoff.test.tsx`, `src/features/clear/ClearHistoryDetail.test.tsx`, `src/features/clear/ClearHistoryDetail.tsx`, `src/features/clear/clearHistoryAiHandoff.ts`, `src/i18n/clearHistoryDetailMessages.ts`.
- Other protected untracked reference asset: `design/ui-reference/star-bottle/star-bottle-ritual-burst.png`.

This batch spans Clear history detail, AI handoff, persistence, i18n, tests, UI, and CSS. A future session must inspect the current diff first, preserve it, confirm it against the original requirement, run localhost acceptance and tests/lint/build, then decide whether to make a separate scoped commit. Never assume it was included in Build 20.

## QA-12 and Workflow Notes

- QA-12 remains a continuing real-device observation area: after long iOS backgrounding, the UI can be visible but non-interactive until force-close/relaunch. Do not remove its diagnostics, buffers, or touch counters merely because Build 20 succeeded.
- `.github/workflows/ios-testflight.yml` is the official manual uploader. It checks out a remote ref, accepts numeric `CURRENT_PROJECT_VERSION`, and uploads only when `upload_to_testflight = true`.
- `.github/workflows/ios-dry-run.yml` is not the uploader and retains stale Build 4 assertions around lines 137, 253, and 290. Build 20 upload was unaffected. Do not expect that workflow to pass until those assertions are separately reviewed and updated.
- Existing warnings: Clear history has a duplicate React key warning in the full suite; it does not fail tests and is unrelated to Heart Card. Production build has a non-blocking bundle-size warning. Do not fix either incidentally during handoff work.

## Next Steps

1. Confirm Apple processing completes for TestFlight Build 20; do not submit Build 20 again.
2. Perform Build 20 device QA: Heart Card V2, QA-12 long-background/resume, Backup/Restore smoke test, five primary tabs, and six-language switching.
3. Resume the local-only Clear work only after reviewing its diff without overwriting it.
4. After Clear localhost acceptance and validation, decide on a separate scoped commit and a future Build 21.

## DO NOT

- Do not upload Build 20 again.
- Do not delete, reset, restore, checkout, stash, or clean local Clear changes.
- Do not use `git add .` while unrelated local work exists.
- Do not delete legacy Heart Card assets without a separate verification.
- Do not revert content-aware Heart Card wrapping to locale-based wrapping.
- Do not change the sealed Heart Card V2 layout without a confirmed bug or explicit product decision.
- Do not remove QA-12 diagnostics.
- Do not run `ios-dry-run.yml` expecting success until its stale Build 4 assertions are addressed.
- Do not assume local Clear work was included in Build 20.

---

# Historical Handoffs

# Build 18 QA-12 V5 Diagnostic Release

- Version: `1.0.0`; iOS build: `18`.
- QA-12 V5 is a real-device forensic diagnostic build only.
- Adds a bounded `router-location-render` probe between browser pathname mutation and the existing effect/commit evidence.
- Marks same-route diagnostic noise separately from cross-route attempts.
- Reduces high-frequency `pointermove` / `touchmove` synchronous diagnostic persistence while retaining movement and cancellation evidence.
- Preserves passive busy-state evidence.
- No QA-12 production fix, recovery, retry, reload, remount, Router architecture change, or product UI change is included.

---

# Build 17 Pre-Release Handoff

## Current Release State

- Marketing version: `1.0.0`
- Current released build: `16`
- Next planned build: `17`
- Build 17 is **not yet released**.

## Build 16 Baseline

- Release commit: `21d5557cc2c00d013dbc407d2d7ddc0dca4bd38c`

## Newly Approved and Locked Work

1. **Seven Heart Notes Phrase Limit V3**
   - Final limit: **80 Unicode code points**.
   - Approved and locked.
   - Shared source: `src/data/heartPhraseLimit.ts`.
   - UI, repository, and Canvas renderer use the same Unicode-safe count/limit.
   - Native HTML `maxLength` is intentionally absent to avoid UTF-16 conflicts; truncation uses `Array.from`.

2. **Heart Reveal Canvas Overlay V2**
   - Approved and locked.
   - Content-aware panel width and height; short text remains compact.
   - Normal sentences remain single line when they fit.
   - Long text wraps inside the maximum panel width.
   - Six overlay placements remain supported, including final panel-width/height positioning.
   - Emoji and symbols remain within the panel and image bounds.
   - Existing font, visual style, and photo reveal behavior are unchanged.

3. **Latin Word Wrapping**
   - Approved and locked.
   - Whitespace-delimited Latin words wrap at word boundaries.
   - Chinese, Japanese, and Korean retain Unicode-safe character wrapping.
   - Mixed CJK/Latin remains safe.
   - A single token wider than the available width falls back to Unicode-safe character wrapping.

## Manual Visual QA

Passed on desktop localhost:

- Emoji and symbols
- English and long English notes
- Left-bottom, center-bottom, and right-bottom overlay placements
- Content-aware panel width and multiline height
- Latin word-boundary wrapping

Validated example:

> Even on busy days, I always find a quiet moment to think of you. ❤️

## Locked Areas

Do not casually modify:

- Seven Heart Notes 80-code-point limit
- Heart Reveal Canvas layout and Latin wrapping
- QA-12 V4 diagnostics; do not add speculative navigation fixes
- Star Bottle Wish-Grow V3
- Our Moments approved mobile layout
- Memory Wall approved layout
- Camera permission fix
- Remote update reminder
- Accepted date UI
- Existing Backup/Restore behavior

## Build 17 Release Rule

Before an explicitly authorized Build 17 release:

1. Audit the worktree and include only approved changes.
2. Run focused tests, the full suite, lint, production build, and `git diff --check`.
3. Only then bump the iOS build number, commit, push, and dispatch the existing TestFlight workflow.

## Git Safety

Never run `reset`, `revert`, `stash`, or `clean` without explicit approval. Preserve unrelated worktree files.

## Build 17 Final I18n Responsive QA

- Result: PASS; no product-code change was needed.
- Six locales reviewed: zh-TW, en, ja, ko, es, and fr.
- Narrow mobile behavior: .moment-card switches to a single column at max-width: 30rem, keeping the photo above the content.
- Wide/tablet behavior: the base two-column grid remains active, keeping the photo left and content right.
- The narrow and wide layouts intentionally differ.
- The responsive rules retain min-width: 0, overflow-wrap: anywhere, wrapping actions, and full-width date constraints to prevent clipping and horizontal overflow.
- Existing focused localization and Moment Carousel tests cover the surrounding Our-page controls and the responsive card rule.
- No overflow, clipping, collision, or image-distortion defect was found in the inspected layout paths.
- Build 17 remains ready pending explicit release authorization.
## Current Stop Point

Build 17 pre-release audit is in progress. No commit, push, build-number bump, Build 17 archive, or TestFlight upload has occurred.

---
# Starry Love Diary Mobile Test Handoff

## Current Release Candidate

Web/package version: 0.1.1
iOS candidate marketing version: 1.0.0
iOS candidate build: 1
Platform: iOS / Android
Stage: CAPACITOR NATIVE BOOTSTRAP COMPLETE / REAL DEVICE QA PENDING

## Completed

- Today, Mood, Seven Heart Phrases, and Photo Reveal cycles
- Star Bottle and Footprints
- Our: Memory Wall, Important Dates, Moments, Message To You V1, message history, seven-type statistics, and Star Cards
- Clear tools and Love Brain Assessment
- Settings User Guide, six-language i18n, export/import, and local persistence

## Current Persistence

IndexedDB schema: v5
Migration: No new migration for 0.1.1

## Update Service

- Remote source: `/version.json` served with the app.
- Comparison: numeric semantic-version comparison, not string comparison.
- iOS/Android: native runtime detection uses the Capacitor global when it is available; a newer remote version shows a soft update notice.
- Store links: empty URLs do not open a link; the notice keeps only the defer action.
- Fetch/config failure: ignored safely, so app startup continues.
- Policy: soft update only; users can defer for the current app session.

## Capacitor Native Bootstrap

- Capacitor: core, CLI, Android, and iOS are all `8.5.2`.
- App identity: `com.miracle.starrylovediary` / `星星戀愛日記`.
- Bundled web directory: `dist`; no localhost or remote development server is configured.
- Android: project generated and `npx cap sync` passed. A debug build was not run because this Windows environment has no configured Android SDK path.
- iOS: project generated and `npx cap sync` passed. Xcode, CocoaPods/SPM runtime validation, simulator, and device builds require macOS.
- Native permissions: no additional native permissions or plugins were added. Photo picker, share/download, import/export, safe-area, Android back behavior, and update notice require real-device QA before product release.

## App Icon Native Integration V1

- Official master: `assets/branding/app-icon/starry-love-diary-app-icon-ios-1024.png` (tracked in checkpoint `a95f8911b3da0a7278d62805dd1b01296847b30e`).
- Master SHA-256: `08948834af2d3d2175654874a892773039fd69143b5bcc02585621cf95a2640e`; identical before and after integration. Original pixels and metadata are preserved.
- Master format: 1024 x 1024, 8-bit RGB PNG, fully opaque, no visible text.
- iOS: replaced the existing universal 1024 AppIcon image; retained the existing Contents.json schema and filename. Output is pixel-identical to the master, fully opaque, with no added rounding.
- Android: replaced legacy and round launcher PNGs at mdpi/hdpi/xhdpi/xxhdpi/xxxhdpi (48/72/96/144/192 px), plus adaptive foregrounds (108/162/216/324/432 px). Existing manifest and adaptive XML references remain valid. Removed two unused bootstrap launcher drawable vectors.
- Android adaptive layout: complete artwork centered at 46dp square on a 108dp transparent foreground; all artwork corners fit within the 66dp diameter safe circle at every density. Background `#062263` is sampled from the master's upper night sky. Legacy round icons contain the full artwork at 70% of the circle diameter, with transparent outer corners.
- Static circle, rounded-square and squircle previews preserve the cat, both eyes, diary and hearts. Conservative padding produces a visible blue border and reduces small-size detail. At 40px, the pink diary remains visible but its heart is less distinct; launcher appearance still needs device review.
- Generated native PNGs contain no XMP, author/account, organization or other unnecessary metadata. Master metadata is intentionally unchanged.
- Validation: 62 test files / 542 tests passed; build and lint passed (build reports a chunk-size warning). Both Capacitor sync commands passed; all 16 native PNG hashes were unchanged by sync. Static PNG dimensions, iOS opacity, resource references and Android safe-zone checks passed.
- Xcode runtime validation: PENDING macOS CI.
- Android real-device icon validation: PENDING, including launcher masks, scaling and icon caching. iOS home-screen small-size/mask QA is also pending.
- Icon checkpoint: `a95f8911b3da0a7278d62805dd1b01296847b30e`. No workflow, signing, version or app identity changes were included in that checkpoint. Push and TestFlight upload have not been performed.

## iOS 1.0.0 Build 1 Release Identity

- First iOS/TestFlight candidate: `MARKETING_VERSION = 1.0.0` and `CURRENT_PROJECT_VERSION = 1` in both App target Debug and Release configurations. Xcode build settings remain the source of truth.
- Info.plist resolves `CFBundleIdentifier` from `$(PRODUCT_BUNDLE_IDENTIFIER)`, `CFBundleShortVersionString` from `$(MARKETING_VERSION)`, and `CFBundleVersion` from `$(CURRENT_PROJECT_VERSION)`; no duplicate version literals are added.
- Display name remains `星星戀愛日記`. `CFBundleName` uses `$(PRODUCT_NAME)`, and `PRODUCT_NAME` uses `$(TARGET_NAME)`; target and product remain `App`.
- Web/package and package-lock versions remain `0.1.1`; IndexedDB remains schema v5. Android versions and all icon artwork remain unchanged.
- Expected scheme: `App`. No explicit .xcscheme is present; scheme availability and resolved build settings must be verified with Xcode on macOS CI. This Windows preparation does not validate an archive or IPA.

### Future TestFlight Workflow Identity Gates

- Required project: `ios/App/App.xcodeproj`; scheme: `App`; configuration: `Release`.
- Required bundle ID: `com.miracle.starrylovediary`; marketing version: `1.0.0`; build: `1`.
- Before building, verify the project/scheme exists and resolved Release build settings match these exact values. Fail on missing or mismatched values.
- Before any upload, validate both the archived app Info.plist and the exported IPA app Info.plist: `CFBundleIdentifier = com.miracle.starrylovediary`, `CFBundleShortVersionString = 1.0.0`, and `CFBundleVersion = 1`. Missing metadata or any mismatch MUST fail before upload.
- No GitHub Actions workflow or Secrets are created in this phase. No staging, commit, push or TestFlight upload is performed for this identity preparation. Native runtime and real-device QA remain pending.

## GitHub Actions iOS Dry-Run Workflow V1

- Workflow: `.github/workflows/ios-dry-run.yml` / `Starry Love Diary iOS Dry Run`. Manual `workflow_dispatch` only, with required `ref` (default `main`); `contents: read`. No push, pull-request or scheduled trigger.
- Reference inspected read-only: Quiet Sloth committed workflow at `b55f4c5dfaa2916a72630e51dcd6d44e8a0c84a3`, workflow history, HANDOFF and PROJECT_MEMORY. Its working-tree workflow differs from the commit. Documentation records prior successful deliveries; the exact current reference revision's run was not independently verified.
- Reused architecture: macos-15, Node 22 / npm ci, web validation and Capacitor sync, temporary keychain, distribution certificate import, temporary profile installation, manual archive, dynamic export options, archive/IPA identity checks, cleanup. Quiet Sloth-specific IDs, versions, profiles and filenames are not reused.
- Runner discovers installed stable Xcode 26.x and selects the highest available version in that major family. It reports Xcode/SDK versions and rejects other major versions. Checkout/setup-node use v6; npm caching is enabled.
- Required GitHub Variables (names only): `APPLE_TEAM_ID`, `IOS_BUNDLE_ID`, `IOS_SCHEME`. No fallback values: bundle must equal `com.miracle.starrylovediary`, scheme must equal `App`; team must be supplied.
- Required GitHub Secrets (names only): `KEYCHAIN_PASSWORD`, `IOS_DISTRIBUTION_CERTIFICATE_BASE64`, `IOS_DISTRIBUTION_CERTIFICATE_PASSWORD`, `IOS_PROVISIONING_PROFILE_BASE64`. These are scoped to the signing step. No App Store Connect upload credentials are required.
- Stages: npm ci; verify installed Capacitor 8.5.2 family; tests/build/lint; verify dist/index.html; cap sync ios; verify generated Capacitor config and unchanged icon/native identity; discover App scheme; validate archive-action resolved Release settings; signing presence preflight; validate/install signing materials; archive; archive metadata gate; export; IPA metadata/signature gate; cleanup.
- Identity gates require project `ios/App/App.xcodeproj`, target/scheme `App`, Release configuration, bundle `com.miracle.starrylovediary`, version `1.0.0`, build `1`. Missing scheme or settings fails before signing. Archive identity failure prevents export; IPA identity failure fails the job. The actual archive remains the final proof of scheme archive capability.
- Profile checks cover exact bundle identity, team, expiration, iOS platform, App Store beta entitlement, non-development/non-device/non-enterprise profile, and a matching valid Apple Distribution identity in the temporary keychain. Profile UUID and name are obtained dynamically.
- ExportOptions are generated only in runner temp, using manual signing, `app-store-connect`, `destination: export`, dynamic profile/certificate mapping and disabled version management. No TestFlight upload code, upload input or GitHub artifact publishing exists.
- Cleanup always attempts to restore the keychain search list and remove the temporary keychain, installed profile copies, decoded signing files, archive, IPA, ExportOptions and private logs. It only deletes the dedicated runner temp directory and recorded profile paths; repository sources are preserved. Forced runner termination can prevent an always step from completing.
- Logging: no shell tracing, environment dumps, secret echoes or full certificate/profile dumps. Signing/archive/export details stay in temporary logs and are discarded; failure messages identify the failed stage without publishing those logs.
- Status: workflow has NOT run on GitHub; successful signed archive/IPA generation is NOT proven. GitHub Secrets/Variables have not been configured by this work, and remote configuration has not been inspected. Xcode scheme availability, resolved settings, signing compatibility and real-device QA remain pending.
- Local validation: YAML parse and actionlint passed; all embedded Bash scripts pass syntax checks and all Python blocks compile. Synthetic settings/profile/archive fixtures and mocked IPA checks reject missing schemes, wrong identities and unsuitable profiles (14 negative cases total). These do not exercise Apple signing tools. Repository tests passed 62 files / 542 tests; build and lint passed, with the existing build chunk-size warning.
- Before the first run: review and authorize checkpoint/publication separately, place workflow on the remote default branch, configure the named variables/secrets with valid matching signing materials, and manually dispatch a trusted source ref. No staging, commit, push, Secrets changes or Apple upload is performed in this workflow-authoring phase.

## REAL DEVICE QA — iOS

- [ ] First launch and nickname setup
- [ ] Today, Mood Star sync, Seven Heart Phrases, and Photo Reveal
- [ ] Star Bottle, Footprints, diary, and Our
- [ ] Message To You seven types, save, history, statistics, edit, delete, Star Card save/share
- [ ] Clear tools, Love Brain Assessment, result, clarity star sync
- [ ] Six-language switch, export/import, and restart persistence
- [ ] Update notice and App Store link (configure a real URL first)
- [ ] Safe area, keyboard, photo permission, and share sheet

## REAL DEVICE QA — Android

- [ ] First launch and nickname setup
- [ ] Today, Mood Star sync, Seven Heart Phrases, and Photo Reveal
- [ ] Star Bottle, Footprints, diary, and Our
- [ ] Message To You seven types, save, history, statistics, edit, delete, Star Card save/share
- [ ] Clear tools, Love Brain Assessment, result, clarity star sync
- [ ] Six-language switch, export/import, and restart persistence
- [ ] Update notice and Google Play link (configure a real URL first)
- [ ] Android back behavior, storage/photo permission, share intent, keyboard resize, status/navigation bars

## Known Risks

- Android SDK tooling is not configured in this Windows environment, so an Android debug build remains pending.
- iOS build and runtime validation require macOS/Xcode.
- Store URLs are intentionally empty until official listings exist.
- Real-device visual, permission, share-sheet, and safe-area validation remains outstanding.

## Release Rule

The iOS 1.0.0 (1) identity is reserved for the first TestFlight candidate; it does not indicate completed QA or public-release approval. Public release remains gated on completion of the primary iOS and Android real-device flows.

## TestFlight Upload Workflow V1 — Local Review Candidate

- First iOS Dry Run passed in GitHub Actions run `35058735770`: signing, archive, IPA export, identity gates, codesign and embedded-profile validation all passed.
- Added local `.github/workflows/ios-testflight.yml`, a manual-only workflow that preserves the proven Starry signing/archive/export pipeline and uploads only when `upload_to_testflight` is explicitly `true`.
- The new workflow requires three future App Store Connect secrets: `APP_STORE_CONNECT_ISSUER_ID`, `APP_STORE_CONNECT_KEY_ID`, and `APP_STORE_CONNECT_PRIVATE_KEY`. They are intentionally not configured by this change.
- This workflow is not staged, committed, pushed, or executed. No TestFlight upload occurred.
