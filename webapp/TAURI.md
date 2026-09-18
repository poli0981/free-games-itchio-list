# Tauri desktop & Android apps

The desktop apps (Windows / macOS / Linux) and the sideloadable Android `.apk` are Tauri 2 builds of
the same React app as the website <https://freeitchgames.win>. Desktop instructions come first; the
**[Android](#android-apk)** section is at the bottom.

## What the apps are

**Read-only viewers** of the public catalog: no sign-in, no editing, no telemetry.

- **Catalog data** is downloaded from **<https://freeitchgames.win/data>** (served with
  `Access-Control-Allow-Origin: *`). The Tauri build does not bundle the catalog (`vite.config.ts`
  only adds the `catalogData` plugin to the web build), so the apps always show the current catalog.
  The last downloaded copy is cached in IndexedDB for up to 7 days.
- **Cover images** load **directly from itch.io's image CDN (`img.itch.zone`)**. The website's `/img`
  proxy is not used by the apps ([`src/lib/thumbnail.ts`](src/lib/thumbnail.ts)).
- **Links** open in the system browser through `tauri-plugin-opener` (capability scope: `https://*`
  only, [`src-tauri/capabilities/default.json`](src-tauri/capabilities/default.json)).
- **Suggest** is a web-only form: in the apps the `/suggest` page links to
  <https://freeitchgames.win/suggest>. The admin app is not part of the Tauri build.
- **Routing** uses hash routes (`HashRouter`) on Tauri's custom protocol, and Vite builds with a
  relative `base` (`./`). The website uses real paths.
- **CSP** (`app.security.csp` in [`src-tauri/tauri.conf.json`](src-tauri/tauri.conf.json)) limits
  `connect-src` to the app itself, Tauri IPC and `https://freeitchgames.win`, and `img-src` to the
  app, `data:` URLs and `https://img.itch.zone`.
- **Updates** are manual: download a new release from GitHub Releases.

### Runtime requirements (end users)

The apps' JavaScript targets Vite's default `baseline-widely-available` (Chrome / Edge 111+,
Firefox 114+, Safari 16.4+).

- **Windows**: Microsoft Edge WebView2 (built into Windows 11; on Windows 10 install it from
  <https://developer.microsoft.com/microsoft-edge/webview2/>).
- **macOS**: Safari / WebKit **16.4 or newer** (the app uses the system WebKit).
- **Linux**: WebKitGTK 4.1 (release builds are made on Ubuntu 22.04 to keep the glibc floor low).
- **Android**: Android 11+ on arm64-v8a (see [below](#why-android-11-api-30)).
- An internet connection to download the catalog and covers.

## Local prerequisites (building)

1. **Rust toolchain** (stable). Install via <https://rustup.rs>.
2. **Node.js + npm** as for the web app (see [`README.md`](README.md#local-dev)).
3. **Platform deps**:
   - **Windows**: WebView2 (see above).
   - **macOS**: Xcode Command Line Tools (`xcode-select --install`).
   - **Linux** (Debian/Ubuntu):
     ```sh
     sudo apt install libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf
     ```

## Run dev mode

```sh
cd webapp
npm ci
npm run tauri:dev
```

This runs `npm run dev` (Vite on port 5173, `beforeDevCommand`) and opens a native window pointing at
it; HMR works as in web dev. The dev app, like the release app, reads the catalog from the live site,
so it needs internet access. The Worker (`wrangler dev`) is not needed.

## Build native installers

```sh
cd webapp
npm run tauri:build
```

`beforeBuildCommand` runs `npm run build` (Tauri mode: public app only, no bundled `/data`) into
`webapp/dist/`, which Tauri packages. Outputs:

- Windows: `webapp/src-tauri/target/release/bundle/msi/*.msi` and `nsis/*.exe`
- macOS: `webapp/src-tauri/target/release/bundle/dmg/*.dmg` and `macos/*.app`
- Linux: `webapp/src-tauri/target/release/bundle/{appimage,deb}/*`

### Installer license page

`bundle.licenseFile` points to [`src-tauri/installer/EULA.rtf`](src-tauri/installer/EULA.rtf), shown
by the Windows installers. It must be **RTF**: WiX (`.msi`) requires it and NSIS (`.exe`) accepts it.
(`bundle.windows.nsis.license` does not exist in the pinned `@tauri-apps/cli` and fails config
validation on every platform.) Keep it in sync with [`docs/EULA.md`](../docs/EULA.md), which covers
only the desktop and Android apps.

## CI builds

[`.github/workflows/release_desktop.yml`](../.github/workflows/release_desktop.yml) runs on a `v*` tag
push (or `workflow_dispatch`). Its `create-release` job opens **one draft** GitHub Release; the build
jobs (Windows, macOS aarch64 + x86_64 cross-compiled from an Apple Silicon runner, Linux) upload into
it: `.msi` / `.exe`, `.dmg` / `.app.tar.gz` / `.pkg` (built with `pkgbuild`, identifier read from
`tauri.conf.json`), `.deb` / `.AppImage`. Release builds use no npm / cargo caches. The Android job
([below](#ci)) attaches the APK to the same draft; the Maintainer publishes it once every asset is
there (release steps: [`CLAUDE.md`](../CLAUDE.md#release--tag-process)).

Before tagging, keep the version equal in `webapp/src-tauri/tauri.conf.json`,
`webapp/src-tauri/Cargo.toml` (+ `Cargo.lock`), `webapp/package.json` and `webapp/src/lib/about.ts`
(`APP.version`). The bundlers read `tauri.conf.json`, and the Android `versionCode` is derived from
it.

## Detecting Tauri at runtime

```ts
import { isTauri } from '@/lib/runtime'

if (isTauri()) {
  // running inside the desktop or Android shell
}
```

The app uses it for the data URL, cover URLs, external links, the router, the Suggest page and the
app-only EULA link in the legal gate. The sidebar shows a small "Desktop app (Tauri)" /
"Mobile app (Tauri)" badge (picked by `useIsMobile()`), and on Android the back button walks the
router history (`src/hooks/useBackButton.ts`).

## Adding new Rust commands

`src-tauri/src/lib.rs` exposes `runtime_info`. To add another:

```rust
#[tauri::command]
fn my_thing(arg: String) -> String { ... }

// inside run():
.invoke_handler(tauri::generate_handler![runtime_info, my_thing])
```

Then call it from the frontend:

```ts
const { invoke } = await import('@tauri-apps/api/core')
await invoke<string>('my_thing', { arg: 'hello' })
```

If a command needs a new permission, add it to
[`src-tauri/capabilities/default.json`](src-tauri/capabilities/default.json) with the narrowest scope.

## Android APK

Same React build, wrapped in an Android WebView via Tauri mobile, shipped as a
**sideloadable `.apk`** (no Play Store) on the GitHub Releases page. The Rust side is mobile-ready
(`#[cfg_attr(mobile, tauri::mobile_entry_point)]` in `lib.rs`, `cdylib` crate type, single-instance
plugin gated to desktop).

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
  CI pins the NDK version in `release_android.yml` (`NDK_VERSION`); point `NDK_HOME` at the same
  version locally, otherwise Tauri picks the highest installed NDK.
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
  the Play Store down to API 24, so IndexedDB and the modern JavaScript the app needs work fine on
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
with `zipalign` + `apksigner` (the CI workflow does exactly this). Release APKs are signed with the
project's key; users should only install the APK from the GitHub Releases page.

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

`*.jks` and `*.keystore` are gitignored.

### CI

[`.github/workflows/release_android.yml`](../.github/workflows/release_android.yml) builds + signs on
a `v*` tag and attaches the APK to the same draft Release as the desktop installers (manual
`workflow_dispatch` instead uploads it as a downloadable workflow artifact for device testing).
Required repo secrets:

- `ANDROID_KEYSTORE_BASE64` — `base64` of `release.jks`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS` (`itchio-release`)

The JDK setup must **not** use `cache: gradle`: `gen/android` is generated mid-job, so there are no
Gradle files at checkout to key the cache on (the step hard-fails). Like the desktop job, the
Android release build uses no dependency caches at all (a poisoned cache could end up in a signed
release).

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
