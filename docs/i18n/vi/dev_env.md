# Môi trường phát triển

> Bản dịch từ bản tiếng Anh cập nhật ngày 2026-09-18 (English source revision 2026-09-18). Nếu có khác biệt, bản tiếng Anh được ưu tiên.
> Bản gốc: [`dev_env.md`](../../dev_env.md).

Bộ công cụ Maintainer dùng để viết và kiểm thử code trong repo này, và cách chạy từng phần trên máy.
Bạn không cần cài đặt giống hệt mới đóng góp được — công cụ nào tương thích với các toolchain yêu cầu
đều dùng được. Tài liệu này nhằm giúp tái lập môi trường.

## IDE

JetBrains 2026.x (dòng trả phí):

- **PyCharm** — pipeline Python (`scripts/`, các wrapper trong `bash/`).
- **WebStorm** — `webapp/` (React + TypeScript + Vite, Cloudflare Worker).
- **RustRover** — `webapp/src-tauri/` (shell native Tauri 2).

VS Code, Sublime, vim, v.v. đều dùng tốt; repo không chứa gì đặc thù của JetBrains.

## Toolchain ngôn ngữ

| Stack | Yêu cầu | Dùng cho |
|-------|---------|----------|
| Python | 3.14 (`.python-version`) | Pipeline dữ liệu (`scripts/`) và test của nó |
| Node.js | 22.22+ (CI dùng `webapp/.node-version`) | Web app, admin app, Worker, phần front end của Tauri |
| npm | đi kèm Node.js | Dependency (`npm ci` theo `package-lock.json`) |
| Wrangler | dependency của dự án (`npx wrangler`) | Worker chạy local, D1 local, deploy |
| Rust | stable (qua `rustup`) | Chỉ để build Tauri desktop / Android |
| Git | bản gần đây | Lịch sử repo, commit và tag có chữ ký |

Build Android còn cần Android Studio, SDK / NDK và JDK 17 hoặc 21 — xem
[`webapp/TAURI.md`](../../../webapp/TAURI.md#android-apk).

## Pipeline Python

### Cài đặt

```sh
python -m venv .venv
# kích hoạt: .venv\Scripts\activate (Windows) · source .venv/bin/activate (macOS / Linux)
pip install -r requirements-dev.txt
```

Trên Windows, đặt `PYTHONUTF8=1` (PowerShell: `$env:PYTHONUTF8 = "1"`) để Python đọc và ghi các
file catalog dưới dạng UTF-8.

### Kiểm tra (giống `python-ci.yml`)

```sh
pytest                                   # tests/ — truy cập mạng bị chặn (tests/conftest.py)
ruff check scripts tests webapp/scripts  # lint (cấu hình ở pyproject.toml gốc)
ruff format --check scripts tests        # định dạng (bỏ --check để áp dụng)
vulture                                  # code chết
python scripts/validate.py               # kiểm tra mọi file dữ liệu catalog
```

### Thử scrape thật

Các lệnh này gửi request thật tới itch.io:

```sh
# thêm URL một game vào scripts/temp_link.json, rồi:
python scripts/update_info.py --out patch.json
python scripts/apply_patch.py patch.json

# hoặc kiểm tra lại vài game đã có trong catalog:
python scripts/refresh.py --out patch.json --budget 5
python scripts/apply_patch.py patch.json
```

Các scanner không bao giờ ghi thẳng vào catalog: chúng xuất ra một patch theo URL, và
`apply_patch.py` áp dụng patch đó rồi chạy `validate.py`. Chạy local sẽ thay đổi `data_game/`,
`scripts/*.json` và `scripts/state/` trong working tree của bạn — đừng đưa những thay đổi đó vào PR
code; trên `main`, các workflow pipeline cập nhật catalog. Xem [`CLAUDE.md`](../../../CLAUDE.md) để
nắm tổng quan tầng dữ liệu.

## Web app

```sh
cd webapp
npm ci
npm run dev          # app công khai ở http://localhost:5173 có HMR; /data lấy từ ../data_game
npm run build        # tsc -b + vite build → webapp/dist/ (app, /admin/, /data, sitemap.xml)
npm run preview      # chạy bản build production (không có Worker)
```

Ảnh bìa (`/img`), form Suggest (`/api/suggest`) và API admin là route của Worker. Vite proxy `/api`
và `/img` sang Worker ở cổng 8787, nên hãy chạy cả Worker (mục tiếp theo); không có Worker thì phần
còn lại của app vẫn chạy nhưng ảnh bìa không tải được.

## Worker (local)

Trong terminal thứ hai:

```sh
cd webapp
npm run build                                            # Worker phục vụ dist/ làm static assets
npx wrangler d1 migrations apply freeitchgames --local   # tạo database review queue local
npx wrangler dev                                         # http://localhost:8787 (giống npm run cf:dev)
```

Vẫn dùng http://localhost:5173 cho app; http://localhost:8787 phục vụ bản build gần nhất, nên hãy
build lại khi muốn nó hiện thay đổi của bạn. Mọi thứ chạy local (workerd); dữ liệu D1, R2 và cache
local nằm trong `webapp/.wrangler/` (đã gitignore — xóa thư mục này để làm lại từ đầu). Chạy lại lệnh
migrations sau khi thêm file vào `worker/migrations/` (không bao giờ sửa một migration đã được áp
dụng).

### `.dev.vars`

Cấu hình local đặt trong `webapp/.dev.vars` (định dạng dotenv, đã gitignore). Giá trị ở đây cũng ghi
đè các `vars` trong `wrangler.jsonc` khi chạy local. Một file điển hình:

```ini
DEV_ADMIN_EMAIL=you@example.com
SITE_ORIGIN=http://localhost:5173
TURNSTILE_SITEKEY=1x00000000000000000000AA
TURNSTILE_SECRET=1x0000000000000000000000000000000AA
```

| Key | Loại | Tác dụng |
|---|---|---|
| `DEV_ADMIN_EMAIL` | chỉ local, tùy chọn | Vào admin mà không cần Cloudflare Access. Chỉ có hiệu lực khi host là `localhost`, `127.0.0.1` hoặc `[::1]`; bị bỏ qua ở mọi nơi khác |
| `ADMIN_EMAILS` | secret | Danh sách email admin (phân cách bằng dấu phẩy), được kiểm tra sau Access. Không cần khi chạy local với `DEV_ADMIN_EMAIL` |
| `TURNSTILE_SECRET` | secret | Form Suggest, đi cùng var `TURNSTILE_SITEKEY` |
| `GH_APP_PRIVATE_KEY` | secret | Private key của GitHub App (PEM PKCS#8) cho các thao tác ghi của admin, đi cùng var `GH_APP_ID` và `GH_APP_INSTALLATION_ID` |
| `SITE_ORIGIN` | ghi đè var | Form Suggest chỉ nhận POST có `Origin` trùng với giá trị này |

Tính năng nào thiếu cấu hình sẽ trả về `503`; trang công khai không cần cấu hình nào trong số này.
Hai giá trị Turnstile ở trên là test key luôn-thành-công của Cloudflare
([Turnstile testing](https://developers.cloudflare.com/turnstile/troubleshooting/testing/)); không bao
giờ dùng chúng trên production. `npm run cf:types` bỏ qua `.dev.vars` (nó đọc file rỗng `types.env`),
nên secret local không bao giờ lọt vào `worker-configuration.d.ts` được commit.

### Form Suggest

Với file ở trên, D1 local đã migrate và cả hai server đang chạy, http://localhost:5173/suggest sẽ gửi
đề xuất vào review queue local.

### Admin

Khi đã đặt `DEV_ADMIN_EMAIL`, mở http://localhost:5173/admin/ (Vite, hot reload) hoặc
http://localhost:8787/admin/ (bản đã build, giống production). Không có cấu hình GitHub App thì admin
chỉ đọc: các thao tác ghi vào repo trả về `503`. Khi đặt `GH_APP_ID`, `GH_APP_INSTALLATION_ID` và
`GH_APP_PRIVATE_KEY`, việc duyệt và chỉnh sửa sẽ thành **commit thật** vào repo `GITHUB_REPO` (mặc
định là repo công khai) — hãy trỏ `GITHUB_REPO` sang một bản fork đã cài App của bạn.

### Cron (khám phá qua RSS)

```sh
npx wrangler dev --test-scheduled
# rồi mở http://localhost:8787/__scheduled
```

Lệnh này chạy `scheduled()` một lần: nó đọc **một feed RSS thật của itch.io** vào queue local, rồi làm
các việc bảo trì queue. Hãy dùng hạn chế.

## Kiểm tra web app (giống `webapp-ci.yml`)

```sh
cd webapp
npm run cf:types -- --check            # worker-configuration.d.ts khớp với wrangler.jsonc
npm run lint                           # ESLint
npm run knip                           # file / export / dependency không dùng
npm test                               # Vitest: app + Worker; test D1 khởi động một workerd local
npx tsc -b                             # chỉ kiểm tra kiểu (npm run build cũng chạy bước này)
npm run build
npx wrangler deploy --dry-run --env=""  # kiểm tra cấu hình Worker, không deploy gì
```

Sau khi sửa `wrangler.jsonc`, chạy `npm run cf:types` và commit file `worker-configuration.d.ts` vừa
được tạo lại.

## App desktop và Android (Tauri)

```sh
cd webapp
npm run tauri:dev    # cửa sổ native + HMR
npm run tauri:build  # bộ cài native
```

Các app đọc catalog trực tiếp từ https://freeitchgames.win/data và tải ảnh bìa từ `img.itch.zone`,
nên cần internet nhưng không cần Worker local. Yêu cầu theo nền tảng (WebView2 trên Windows 10, Xcode
CLT trên macOS, `libwebkit2gtk-4.1-dev` trên Debian/Ubuntu) và cách build Android có trong
[`webapp/TAURI.md`](../../../webapp/TAURI.md).

## Test trên mobile

Thay đổi UI web đụng tới layout responsive, điều hướng hoặc bảng dữ liệu phải được smoke-test trên
thiết bị iOS thật trước khi tag release; APK Android được duyệt trên các thiết bị Android. Xem
[`pc_spec.md`](pc_spec.md) để biết các thiết bị test.

## Deploy (Maintainer)

Cloudflare Workers Builds deploy mỗi lần push lên `main` (thư mục gốc `webapp`, build
`npm run build`, deploy `npx wrangler deploy`). Migration D1 được áp dụng thủ công
(`npx wrangler d1 migrations apply freeitchgames --remote`), secret được đặt bằng
`npx wrangler secret put <NAME>`, và `npx wrangler deploy --env staging` deploy Worker staging.
Chi tiết: [`webapp/README.md`](../../../webapp/README.md#deploy-web).

## Git hygiene

- Chỉ tag release từ `origin/main` (xem
  [quy trình release](../../../CLAUDE.md#release--tag-process)).
- Commit và tag release của Maintainer được ký trên máy local (`commit.gpgsign=true`, `git tag -s`).
- Không bao giờ commit `webapp/dist/`, `webapp/.wrangler/`, `webapp/.dev.vars`,
  `webapp/src-tauri/target/`, `webapp/src-tauri/gen/`, keystore Android, hay bất kỳ secret nào (key
  của GitHub App, secret Turnstile, token Access). `webapp/src-tauri/Cargo.lock` **có** được commit.

## Xem thêm

- [`pc_spec.md`](pc_spec.md) — phần cứng và thiết bị test.
- [`webapp/README.md`](../../../webapp/README.md) — chi tiết web app, Worker và admin.
- [`webapp/TAURI.md`](../../../webapp/TAURI.md) — build Tauri desktop và Android.
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — các cách đóng góp.
