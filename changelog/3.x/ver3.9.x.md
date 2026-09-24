# Changelog — 3.9.x

Release notes for 3.9.0, newest first. Every version: [CHANGELOG.md](../../CHANGELOG.md).

## [3.9.0] - 2026-06-15 (Android minSdk → 11 / API 30)

### Changed

- **Android APK floor raised from API 24 (Android 7.0) to API 30 (Android 11).**
  `minSdkVersion` in [`webapp/src-tauri/tauri.conf.json`](../../webapp/src-tauri/tauri.conf.json)
  `bundle.android` is now `30`. Because Android's package installer refuses any APK whose
  `minSdkVersion` exceeds the device API level, this **is** the install block — the app simply
  can't install on Android < 11 ("app not installed / incompatible"); no runtime check by design.
  Rationale, stated honestly:
  - **Not a JS-feature floor** — the System WebView is independently updatable down to API 24, so
    SubtleCrypto / OpenPGP.js / IndexedDB / ES2020 already work on older OSes. That's not the
    binding constraint.
  - **Security + patch availability** — Android 11 added scoped-storage enforcement, one-time /
    auto-reset permissions, and a tighter sandbox; pre-11 releases are also off Google's AOSP
    monthly Security Bulletins (Android 10 ended 2023-03-06, Android 11 ended 2024-02-05; only
    14 / 15 / 16 remain as of mid-2026).
  - **Tested range** — we validate only on Android 11+ (emulator 11 → latest; real phone
    vivo 1907 / Android 12 — see [`docs/pc_spec.md`](../../docs/pc_spec.md)). Shipping an untested floor
    was the real risk.
  - **Reach cost is small** — API 30+ ≈ 86.9% of active devices (was 96.6% at API 24); only the
    pre-2020 long tail is dropped.

  Data sources: [endoflife.date/android](https://endoflife.date/android),
  [Android Security Bulletins](https://source.android.com/docs/security/bulletin),
  [StatCounter version share](https://gs.statcounter.com/android-version-market-share/mobile/worldwide/) (May 2026),
  [apilevels.com](https://apilevels.com/) (StatCounter cumulative distribution, Apr 2026).

### Notes

- `versionCode` re-derives to `3009000` (see the Android `versionCode` gotcha in [CLAUDE.md](../../CLAUDE.md)). The web and desktop builds are unaffected by
  the Android floor. The `about.ts` version bump busts the IndexedDB catalog cache (harmless).
