# Tauri desktop & Android wrapper

The webapp can also ship as a native desktop app (Windows / macOS / Linux) and
as a sideloadable Android `.apk` through Tauri 2. The same React build is reused
on every platform; the native runtime is opt-in and skipped when running as a
plain web SPA. Desktop instructions come first; the **[Android](#android-apk)**
section is at the bottom.

## What desktop adds over web

- **Smaller footprint than Electron** — installer is ~10 MB.
- **Native window chrome** — system tray, OS notifications, etc. (not
  enabled yet; can be added in a follow-up).

## Local prerequisites

1. **Rust toolchain** (stable). Install via <https://rustup.rs>.
2. **Platform deps**:
   - **Windows**: WebView2 ships with Windows 11 already. On Windows 10
     install via <https://developer.microsoft.com/microsoft-edge/webview2/>.
   - **macOS**: Xcode Command Line Tools (`xcode-select --install`).
   - **Linux** (Debian/Ubuntu):
     ```sh
     sudo apt install libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf
     ```

## Run dev mode

```sh
cd webapp
npm install
npm run tauri:dev
```

This starts the Vite dev server and launches a native window pointing at it.
HMR works the same as plain web dev.

## Build native installers

```sh
cd webapp
npm run tauri:build
```

Outputs:

- Windows: `webapp/src-tauri/target/release/bundle/msi/*.msi` and `nsis/*.exe`
- macOS: `webapp/src-tauri/target/release/bundle/dmg/*.dmg`
- Linux: `webapp/src-tauri/target/release/bundle/{appimage,deb}/*`

## CI builds

`.github/workflows/release_desktop.yml` builds for all three platforms when
a `v*` tag is pushed (or via `workflow_dispatch`) and attaches the
installers to a draft GitHub Release. Bump `webapp/src-tauri/tauri.conf.json`
and `webapp/src-tauri/Cargo.toml` together (that's the version the bundlers
read — `webapp/package.json` stays `0.0.0`), tag, and push.

## Detecting Tauri at runtime

```ts
import { isTauri } from '@/lib/runtime'

if (isTauri()) {
  // running inside the native desktop shell
}
```

The sidebar shows a small "Desktop app (Tauri)" / "Mobile app (Tauri)" badge
(picked by `useIsMobile()`) when running native.

## Adding new Rust commands

`src-tauri/src/lib.rs` already exposes `runtime_info`. To add another:

```rust
#[tauri::command]
fn my_thing(arg: String) -> String { ... }

// inside run():
.invoke_handler(tauri::generate_handler![runtime_info, my_thing])
```

Then call from the frontend:

```ts
const { invoke } = await import('@tauri-apps/api/core')
await invoke<string>('my_thing', { arg: 'hello' })
```

## Android APK

Same React build, wrapped in an Android WebView via Tauri mobile, shipped as a
**sideloadable `.apk`** (no Play Store). The Rust side is already mobile-ready
(`#[cfg_attr(mobile, tauri::mobile_entry_point)]` in `lib.rs`, `cdylib` crate
type, single-instance plugin gated to desktop).

### Prerequisites

- Android Studio + SDK + **NDK** + command-line tools.
- **JDK 17 or 21** for the Gradle build — Android Studio's bundled JBR is ideal.
  The Android Gradle Plugin does **not** support JDK 26, so if a newer JDK is
  your system default, point `JAVA_HOME` at a 17/21 JDK (or the JBR) for the
  `android build` step. CI uses Temurin 17.
- Env vars (Windows example — adjust paths):
  ```powershell
  setx JAVA_HOME    "C:\Program Files\Android\Android Studio\jbr"   # JDK 17/21 — NOT 26
  setx ANDROID_HOME "$env:LOCALAPPDATA\Android\Sdk"
  setx NDK_HOME     "$env:LOCALAPPDATA\Android\Sdk\ndk\<version>"   # ls $ANDROID_HOME\ndk
  ```
- Rust Android targets:
  ```sh
  rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android
  ```

### Init / dev / build

```sh
cd webapp
npm run tauri -- android init                                # generates src-tauri/gen/android (gitignored)
npm run tauri -- android dev                                 # live-reload on a connected device/emulator
npm run tauri -- android build --apk --debug --target aarch64  # debug APK you can install by hand
npm run tauri -- android build --apk --target aarch64        # release (unsigned) APK, arm64-v8a only
```

We ship **arm64-v8a only** (every phone since ~2017; smaller download). `minSdkVersion`
is **30** (Android 11), set in `tauri.conf.json` `bundle.android`. `versionName`/`versionCode`
derive from the `tauri.conf.json` version (`versionCode = major*1e6 + minor*1e3 + patch`).

#### Why Android 11 (API 30)?

The floor was **24** (Android 7.0) through v3.8.0; v3.9.0 raised it to **30**. The reasoning,
stated honestly so it's defensible:

- **It's not a JS-feature floor.** The Android System WebView is independently updatable from
  the Play Store down to API 24, so SubtleCrypto / OpenPGP.js / IndexedDB / ES2020 work fine on
  older OSes too. That is *not* the binding constraint.
- **Security + patch availability is the constraint.** Android 11 brought scoped-storage
  enforcement, one-time and auto-reset permissions, and a tighter sandbox. Older releases are
  also off Google's AOSP monthly Security Bulletins (Android 10 ended 2023-03-06, Android 11
  itself ended 2024-02-05; only Android 14/15/16 are still on the bulletins as of mid-2026).
- **Tested range is the other constraint.** We only validate on Android 11+ (see
  [`docs/pc_spec.md`](../docs/pc_spec.md)); shipping a floor we haven't tested is the real risk.
- **Reach cost is small.** API 30+ ≈ 86.9% of active devices (was 96.6% at API 24) — we drop
  only the pre-2020 long tail.

`minSdkVersion` is *also* the install block: Android's package installer refuses an APK whose
`minSdkVersion` exceeds the device's API level ("app not installed / incompatible"), so there's
no runtime version check by design.

Data sources: [endoflife.date/android](https://endoflife.date/android),
[Android Security Bulletins](https://source.android.com/docs/security/bulletin),
[StatCounter version share](https://gs.statcounter.com/android-version-market-share/mobile/worldwide/),
[apilevels.com](https://apilevels.com/) (StatCounter cumulative distribution).

**Tested on:** emulator Android 11 → latest; real phone vivo 1907 / Android 12.

### Signing for distribution

`src-tauri/gen/android` is **gitignored and regenerated** by `android init`, so we do
**not** edit the generated Gradle. Instead, build an unsigned APK and sign it afterwards
with `zipalign` + `apksigner` (the CI workflow does exactly this).

```sh
# one-time: create a release keystore (keep the .jks out of git, never lose it)
keytool -genkey -v -keystore release.jks -storetype JKS \
  -keyalg RSA -keysize 2048 -validity 10000 -alias itchio-release

# after `android build --apk`:
BT="$ANDROID_HOME/build-tools/<ver>"
UNSIGNED=$(find src-tauri/gen/android/app/build/outputs/apk -name "*-release-unsigned.apk" | head -1)
"$BT/zipalign" -v -p 4 "$UNSIGNED" aligned.apk          # zipalign BEFORE apksigner
"$BT/apksigner" sign --ks release.jks --ks-key-alias itchio-release \
  --out FreeGamesItchio.apk aligned.apk
"$BT/apksigner" verify --verbose FreeGamesItchio.apk
```

### CI

`.github/workflows/release_android.yml` builds + signs on a `v*` tag and attaches the APK
to the same draft Release as the desktop installers (manual `workflow_dispatch` instead
uploads it as a downloadable workflow artifact for device testing). Required repo secrets:

- `ANDROID_KEYSTORE_BASE64` — `base64` of `release.jks`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS` (`itchio-release`)

### Gotchas (each cost a release if relearned)

1. **Identifier must be hyphen- AND underscore-free.** Android rejects hyphens in the
   package id (`android init` panics); Tauri's config validator rejects underscores. The
   only string valid on both is alphanumeric — ours is `com.poli0981.freegamesitchio`.
2. **`zipalign` BEFORE `apksigner`.** Re-aligning a signed APK invalidates the signature.
3. **`gen/android` is gitignored** — signing is a post-build step, not a Gradle edit, so it
   survives regeneration. Don't commit `gen/`.
4. **Pin the NDK** in CI to match local. A floating NDK is a "works locally, breaks in CI."
5. **Keep the signing key forever.** Lose it and users can't upgrade an installed APK in
   place (Android requires a stable signing identity).
