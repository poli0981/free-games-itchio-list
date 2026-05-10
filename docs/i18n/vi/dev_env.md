# Môi trường phát triển

Tooling maintainer dùng để code và test repo này. Bạn không cần setup giống
hệt để contribute — bất cứ thứ gì tương thích với toolchain ngôn ngữ yêu
cầu đều OK. Đây là cho reproducibility.

> Bản tiếng Anh là bản chính thức cho mọi diễn giải kỹ thuật.
> Xem: [`dev_env.md`](../../dev_env.md).

## IDE

JetBrains 2026.x (bản trả phí):

- **PyCharm** — Python pipeline (`scripts/`, wrapper `bash/`).
- **WebStorm** — `webapp/` (React + TypeScript + Vite).
- **RustRover** — `webapp/src-tauri/` (Tauri 2 native shell).

VS Code, Sublime, vim, v.v. đều dùng được; không có gì JetBrains-specific
được commit vào repo.

## Toolchain ngôn ngữ

| Stack | Yêu cầu | Dùng cho |
|-------|--------|---------|
| Python | 3.12 | Scraper / data pipeline (`scripts/`) |
| Node.js | ≥ 22 (LTS) | Webapp build + dev server |
| npm | đi kèm Node 22 | Webapp deps |
| Rust | stable (qua `rustup`) | Tauri desktop build |
| Git | bản gần đây | Repo history + signed commits |

## Quick start

### Python pipeline

```sh
pip install beautifulsoup4 requests
python scripts/update_info.py
```

Pipeline đọc `scripts/temp_link.json` (mảng JSON các URL itch.io)
và ghi vào `data_game/game_info_NNN.json`.

### Webapp (web)

```sh
cd webapp
npm install
npm run dev          # http://localhost:5173 với HMR
npm run build        # output vào ../docs/app/ (KHÔNG phải webapp/dist)
npm run lint
```

### Webapp (Tauri desktop)

```sh
cd webapp
npm run tauri:dev    # native window + HMR
npm run tauri:build  # native installers
```

Prereq nền tảng (WebView2 trên Windows 10, Xcode CLT trên macOS,
`libwebkit2gtk-4.1-dev` trên Debian/Ubuntu) xem
[`webapp/TAURI.md`](../../../webapp/TAURI.md).

## Test trên mobile

Thay đổi UI webapp đụng tới responsive layout, navigation, hoặc data table
phải smoke-test trên thiết bị iOS thật trước khi tag release. Xem
[`pc_spec.md`](pc_spec.md) cho thiết bị test.

## Git hygiene

- Tag release chỉ từ `origin/main`.
- Commit và tag đều ký GPG (`commit.gpgsign=true`).
- Không commit `webapp/dist/`, `webapp/src-tauri/target/`, `Cargo.lock`,
  hoặc PAT GitHub thật.

## Xem thêm

- [`pc_spec.md`](pc_spec.md) — cấu hình phần cứng.
- [`webapp/TAURI.md`](../../../webapp/TAURI.md) — chi tiết build Tauri.
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — luồng đóng góp.
