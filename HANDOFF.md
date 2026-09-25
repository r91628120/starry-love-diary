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