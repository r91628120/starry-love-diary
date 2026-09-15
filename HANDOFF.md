# Starry Love Diary Mobile Test Handoff

## Current Release Candidate

Version: 0.1.1
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

Consider 1.0.0 only after the primary iOS and Android real-device flows are complete.
