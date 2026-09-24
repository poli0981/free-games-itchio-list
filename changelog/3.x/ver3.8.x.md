# Changelog — 3.8.x

Release notes for 3.8.0, newest first. Every version: [CHANGELOG.md](../../CHANGELOG.md).

## [3.8.0] - 2026-06-15 (Android APK target 📱)

### Added

- **Android APK build & packaging via Tauri mobile.** The same React + Tauri app now ships as a
  sideloadable **arm64-v8a `.apk`** (no Play Store), built and **post-signed** (`zipalign` →
  `apksigner`) by [`.github/workflows/release_android.yml`](../../.github/workflows/release_android.yml)
  and attached to the same draft Release as the desktop installers (manual `workflow_dispatch`
  uploads it as a downloadable workflow artifact instead). `gen/android` stays gitignored — signing
  is a post-build step, not a Gradle edit. New repo secrets: `ANDROID_KEYSTORE_BASE64` /
  `ANDROID_KEYSTORE_PASSWORD` / `ANDROID_KEY_ALIAS`. Full build/signing docs in
  [`webapp/TAURI.md`](../../webapp/TAURI.md).
- **Mobile UX** — the Android hardware / gesture back button is wired to in-app router history
  (`useBackButton`), safe-area insets are respected, and the sidebar shows a platform-aware badge
  ("Mobile app" / "Desktop app").
- Added dependency: `@tauri-apps/api`.

### Changed

- **Bundle `identifier` is now alphanumeric** — `com.poli0981.freegamesitchio` (was the hyphenated
  `com.poli0981.free-games-itchio-webapp`). Android rejects hyphens in the app id (`android init`
  panics) and Tauri's validator rejects underscores, so alphanumeric is the only form valid on
  both. Tauri uses one identifier across all platforms, so this also changed the **desktop** bundle
  ID (a one-time OS-level reinstall).
- **Realigned versions** — `tauri.conf.json` / `Cargo.toml` / `about.ts` set to `3.8.0` (was a
  long-standing `0.1.1` vs `3.x` drift), so `versionCode` / `versionName` are sensible and
  monotonic.

### Notes

- CI: the Android JDK setup must **not** use `cache: gradle` — `gen/android` is gitignored and
  generated mid-job, so there are no gradle files at checkout to key on (it hard-fails). rust-cache
  + npm cache still apply.
