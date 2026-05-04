# Tauri desktop wrapper

The webapp can also ship as a native desktop app (Windows / macOS / Linux)
through Tauri 2. The same React build is reused; the desktop runtime is
opt-in and skipped when running as a plain web SPA.

## What desktop adds over web

- **No CORS** — `tauri-plugin-http` lets the renderer fetch any whitelisted
  URL (itch.io, GitHub API, raw.githubusercontent.com) directly. The
  `tauri-scrape.ts` helper uses this to preview a game record without
  dispatching the workflow (~5 s vs ~75–120 s).
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
installers to a draft GitHub Release. Bump `webapp/package.json` and
`webapp/src-tauri/Cargo.toml` together, tag, and push.

## Detecting Tauri at runtime

```ts
import { isTauri, getRuntimeInfo } from '@/lib/runtime'

if (isTauri()) {
  const info = await getRuntimeInfo() // { platform: 'windows', version: '0.1.0' }
}
```

The sidebar shows a small "Desktop mode (Tauri)" badge when running native.

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

## Roadmap (Phase 8b)

The current scrape preview parses `og:title` / `og:description` / `og:image`
from the HTML in TS. The full 23-field extraction (genre, tags, platforms,
languages, made_with, …) still lives in `scripts/scraper.py` and runs in
CI. Porting that to Rust (using `scraper` crate) is tracked as Phase 8b
and would make the desktop app fully autonomous (no workflow_dispatch
needed for adds).
