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
