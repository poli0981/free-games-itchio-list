# Development environment

Tooling the maintainer uses to write and test code in this repo. You don't
need exactly the same setup to contribute — anything compatible with the
required language toolchains works. This is for reproducibility.

## IDEs

JetBrains 2026.x (paid lineup):

- **PyCharm** — Python pipeline (`scripts/`, `bash/` wrappers).
- **WebStorm** — `webapp/` (React + TypeScript + Vite).
- **RustRover** — `webapp/src-tauri/` (Tauri 2 native shell).

VS Code, Sublime, vim, etc. all work fine; nothing JetBrains-specific is
checked into the repo.

## Language toolchains

| Stack | Required | Used for |
|-------|----------|----------|
| Python | 3.12 | Scraper / data pipeline (`scripts/`) |
| Node.js | ≥ 22 (LTS) | Webapp build + dev server |
| npm | ships with Node 22 | Webapp deps |
| Rust | stable (via `rustup`) | Tauri desktop build |
| Git | recent | Repo history + signed commits |

## Quick start

### Python pipeline

```sh
pip install -r scripts/requirements.txt   # if/when present, else: beautifulsoup4 requests
python scripts/update_info.py
```

The pipeline reads `scripts/temp_link.json` (a JSON array of itch.io URLs)
and writes to `data_game/game_info_NNN.json`. See [CLAUDE.md](../CLAUDE.md)
for the data layer overview.

### Webapp (web)

```sh
cd webapp
npm install
npm run dev          # http://localhost:5173 with HMR
npm run build        # writes to ../docs/app/ (NOT webapp/dist)
npm run lint
```

### Webapp (Tauri desktop)

```sh
cd webapp
npm run tauri:dev    # native window + HMR
npm run tauri:build  # native installers
```

Platform prerequisites (WebView2 on Windows 10, Xcode CLT on macOS,
`libwebkit2gtk-4.1-dev` on Debian/Ubuntu) are documented in
[`webapp/TAURI.md`](../webapp/TAURI.md).

## Mobile testing

Webapp UI changes that touch responsive layout, navigation, or the data
table must be smoke-tested on a real iOS device before tagging a release.
See [`pc_spec.md`](pc_spec.md) for the test devices.

## Git hygiene

- Tag releases from `origin/main` only (per [release_pipeline](#) note in
  CHANGELOG and CLAUDE.md).
- Signed commits + signed tags via `gpg-agent` (`commit.gpgsign=true`).
- Never commit `webapp/dist/`, `webapp/src-tauri/target/`, `Cargo.lock`,
  or a real GitHub PAT.

## See also

- [`pc_spec.md`](pc_spec.md) — hardware spec.
- [`webapp/TAURI.md`](../webapp/TAURI.md) — Tauri build details.
- [`CONTRIBUTING.md`](../CONTRIBUTING.md) — contribution flows.
