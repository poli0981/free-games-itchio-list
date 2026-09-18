# Danh sách Game Itch.io Miễn Phí

[![Version](https://img.shields.io/badge/version-3.6.1-blue.svg)](https://github.com/poli0981/free-games-itchio-list/)
[![License: MIT](https://img.shields.io/badge/license-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![English](https://img.shields.io/badge/lang-English-blue.svg)](README.md)

> Đây là bản dịch tiếng Việt mang tính tham khảo cho cộng đồng. Bản tiếng Anh tại [`README.md`](README.md) là bản chính thức cho mọi điều khoản pháp lý / kỹ thuật.

Một danh mục được duy trì tự động của các game miễn phí trên [itch.io](https://itch.io). Game được cào (scrape), xác thực và hiển thị trên website có thể tìm kiếm, lọc — **<https://freeitchgames.win>** — cập nhật hàng ngày qua GitHub Actions.

## Mục lục

- [Duyệt danh mục](#duyệt-danh-mục)
- [Webapp (duyệt + sửa + analytics)](#webapp-duyệt--sửa--analytics)
- [Cách hoạt động](#cách-hoạt-động)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [Tự động hóa (GitHub Actions)](#tự-động-hóa-github-actions)
- [Đóng góp](#đóng-góp)
- [Kết nối / hỗ trợ](#kết-nối--hỗ-trợ)
- [Pháp lý](#pháp-lý)

## Duyệt danh mục

Danh mục nằm trên website: **<https://freeitchgames.win>** — tìm kiếm, lọc theo thể loại / nền tảng / trạng thái, sắp xếp và mở game trên itch.io. (Các bảng markdown theo thể loại trong `lists/` đã được bỏ để dùng website.) Dữ liệu gốc là JSON trong [`data_game/`](data_game/).

## Webapp (duyệt + sửa + analytics)

Một SPA React + TypeScript trong [`webapp/`](webapp/) cung cấp giao diện duyệt trên cùng catalog JSON: DataTable virtualized cho 2,600+ game, faceted filter (thể loại / trạng thái / nền tảng / NSFW), 16 chart (Recharts), bulk edit/delete qua GitHub Git Data API, và một flow "add" một-click dispatch workflow scraper với input URL.

- **Bản web**: deploy lên **<https://freeitchgames.win>** bởi Cloudflare Workers Builds từ [`webapp/wrangler.jsonc`](webapp/wrangler.jsonc) — mỗi lần push vào `main` tự ship (không cần GitHub Actions deploy). Địa chỉ GitHub Pages cũ chỉ còn chuyển hướng sang đây.
- **Bản desktop (tùy chọn)**: cùng code React đóng gói thành app native Tauri 2 cho Windows / macOS / Linux. Xem [`webapp/TAURI.md`](webapp/TAURI.md) để biết yêu cầu và `npm run tauri:dev`.
- **Bản Android (tùy chọn)**: cùng app cũng xuất thành file `.apk` cài tay (arm64-v8a) qua Tauri mobile. APK đã ký được build bởi [`.github/workflows/release_android.yml`](.github/workflows/release_android.yml) và đính vào cùng draft Release. Xem [Android (tải & cài đặt)](#android-tải--cài-đặt) bên dưới và mục Android trong [`webapp/TAURI.md`](webapp/TAURI.md).
- **Auth**: PAT fine-grained với `contents:write` + `actions:write` được mã hóa AES-GCM trong localStorage (PBKDF2-SHA256). Token đã giải mã chỉ tồn tại trong bộ nhớ.
- **Edit commit dạng `chore(webapp): …`** để dễ lọc khỏi commit của scraper hàng ngày.

Dev cục bộ:

```sh
cd webapp
npm install
npm run dev          # http://localhost:5173
npm run build        # ghi vào webapp/dist/
npm run tauri:dev    # native desktop (cần Rust)
```

## Android (tải & cài đặt)

Không lên Play Store — chỉ cần tải `.apk` về và cài tay (Android cho phép, chỉ hỏi xác nhận trước):

1. Mở [Release](https://github.com/poli0981/free-games-itchio-list/releases) mới nhất và tải `FreeGamesItchio_<version>_arm64-v8a.apk`.
2. Bấm vào file. Android sẽ hỏi **cho phép cài từ nguồn này** (trình duyệt / trình quản lý file) — hãy bật lên (Cài đặt → *Ứng dụng* → *Truy cập đặc biệt* → *Cài ứng dụng không xác định*).
3. Chấp nhận cảnh báo "không từ Play Store" và cài. Vẫn là app y hệt bản web/desktop, chỉ là do mình ký thay vì Google.

Lưu ý: **chỉ arm64-v8a** (mọi điện thoại từ ~2017 — không hỗ trợ máy 32-bit), và Android **11+** (API 30). Bản cũ hơn sẽ không cài được — đây là cố ý: giữ sàn ở phiên bản còn được vá bảo mật và là phiên bản mình thật sự test (≈87% thiết bị đang hoạt động; [lý do](webapp/TAURI.md#why-android-11-api-30)). Cách tự build có trong mục Android của [`webapp/TAURI.md`](webapp/TAURI.md).

## Cách hoạt động

```
temp_link.json ─→ update_info.py ─┐                     ┌─→ data_game/*.json ─→ freeitchgames.win
(URL chờ xử lý)   (scrape, free?) ├─→ patch.json ─→ apply_patch.py
data_game/     ─→ refresh.py    ──┘   (theo URL)     (validate + push)
(1/7 mỗi ngày)    (còn sống / trả phí / rating / trạng thái)
```

1. **Thêm link** — URL itch.io được đưa vào hàng chờ `scripts/temp_link.json` (qua extension trình duyệt đi kèm, hoặc thủ công / PR).
2. **Ingest** — `update.yml` chạy `update_info.py` ngay khi hàng chờ thay đổi (và mỗi ngày một lần để dự phòng). Mỗi link được chuẩn hoá, fetch, kiểm tra free rồi cào metadata; game trả phí, đã chết, trùng hoặc từng bị gỡ sẽ bị bỏ qua. Lỗi tạm thời được giữ lại để thử lại (tối đa 3 lần chạy).
3. **Refresh** — `refresh.yml` mỗi ngày kiểm tra 1/7 danh mục (mỗi game một request), nên mọi game được kiểm tra lại hằng tuần: link chết (404/410), game chuyển sang trả phí, rating và trạng thái. Game chỉ bị gỡ khi cùng một vấn đề được thấy lại sau lần đầu ít nhất 20 giờ; việc gỡ được log kèm lý do, và một lượt chạy định gỡ số game bất thường sẽ giữ lại và cảnh báo thay vì gỡ.
4. **Commit an toàn** — cả hai bước xuất ra một patch theo URL; `apply_patch.py` áp nó lên `main` mới nhất, validate mọi file dữ liệu (`validate.py`) rồi mới push, và thử lại nếu có writer khác push trước.

## Cấu trúc dự án

Xem [`README.md`](README.md#project-structure) phiên bản tiếng Anh để có sơ đồ thư mục đầy đủ và mới nhất.

## Tự động hóa (GitHub Actions)

| Workflow | Lịch | Mục đích |
|---|---|---|
| Ingest queued games | Khi hàng chờ đổi + hàng ngày 01:23 UTC | Scrape link từ `temp_link.json` (+ input `url` tùy chọn), bỏ qua game trả phí / đã chết / từng bị gỡ |
| Refresh catalog | Hàng ngày 02:47 UTC | Kiểm tra 1/7 danh mục: link chết, game chuyển trả phí, rating, trạng thái |
| Force update | Thủ công | Scrape lại mọi trường (một URL hoặc lô tiếp theo); giữ `safe_virus` / `notes` / `nsfw` |
| Python CI / Webapp CI | Pull request | Lint, test, validate dữ liệu / type-check và build |
| Deploy webapp | Khi push vào main | Cloudflare Workers Builds (`webapp/wrangler.jsonc`) → freeitchgames.win |
| Release desktop | Khi push tag `v*` | Build installer Tauri (Win/macOS/Linux) → draft Release |
| Release Android | Khi push tag `v*` | Build APK đã ký (arm64-v8a) → draft Release |

Scraper tự xưng danh tính (`FreeItchGamesBot`), giãn nhịp request (delay ngẫu nhiên, batch pause) và lùi lại khi gặp HTTP 429. Lỗi mạng được coi là tạm thời; game chỉ bị gỡ khi cùng lỗi 404/410 hoặc trạng thái trả phí được thấy lại sau lần đầu ít nhất 20 giờ. Lỗi, bị huỷ, bị giới hạn tốc độ hoặc thay đổi hàng loạt bất thường đều được báo về Discord.

## Đóng góp

Xem [CONTRIBUTING.vi](docs/i18n/vi/CONTRIBUTING.md) (hoặc [bản tiếng Anh CONTRIBUTING.md](CONTRIBUTING.md) cho bản chính thức).

- **Thêm game** — dùng issue template "Add New Games" (tối đa 50 link / issue).
- **Thêm game qua Telegram bot** — đường thay thế cho batch submissions qua
  [@my_skull_bot](https://t.me/my_skull_bot); DM owner để được whitelist.
  Flow đầy đủ + ghi chú riêng tư: [CONTRIBUTING §1b](docs/i18n/vi/CONTRIBUTING.md#1b-th%C3%AAm-game-qua-telegram-bot-my_skull_bot--thay-th%E1%BA%BF-cho-issue)
  · Repo bot: [poli0981/telegram-scraper-bot](https://github.com/poli0981/telegram-scraper-bot)
  ([USER_GUIDE.md](https://github.com/poli0981/telegram-scraper-bot/blob/main/docs/USER_GUIDE.md)).
- **Báo bug** — dùng template "Bug Report".
- **Đề xuất tính năng** — mở issue hoặc gửi PR.

Người đóng góp được ghi nhận trong [ACKNOWLEDGEMENTS.md](docs/ACKNOWLEDGEMENTS.md).
Cấu hình máy maintainer + môi trường dev: [`docs/pc_spec.md`](docs/pc_spec.md) ([VI](docs/i18n/vi/pc_spec.md)), [`docs/dev_env.md`](docs/dev_env.md) ([VI](docs/i18n/vi/dev_env.md)).

## Kết nối / hỗ trợ

Hai server Discord giờ đã tồn tại (câu "if I ever make one" chính thức lỗi thời):

- **Chat**: Discord — [Repo discussion](https://discord.gg/2aNR3aVt) · [Game chat](https://discord.gg/kDM9GMu5vm)
- **Mạng xã hội**: [X/@SkullMute0011](https://x.com/SkullMute0011) · [YouTube/@SkullMute](https://youtube.com/@SkullMute) · [Bluesky](https://bsky.app/profile/skullmute0011.bsky.social) · [Mastodon](https://mastodon.social/@skullmute1122)
- **Messaging**: [Telegram (DM)](https://t.me/SkullMute0011) · [Telegram bot — gửi game](https://t.me/my_skull_bot) (DM numeric ID riêng tư, đừng đăng kênh chung)
- **Hỗ trợ** (hoàn toàn tùy chọn, mirror [`.github/FUNDING.yml`](.github/FUNDING.yml)): [GitHub Sponsors](https://github.com/sponsors/poli0981) · [Patreon](https://patreon.com/skullmute) · [Ko-fi](https://ko-fi.com/skullmute) · [Buy Me a Coffee](https://buymeacoffee.com/skullmute) · [PayPal](https://paypal.me/DungDang212)
- **Gaming**: [Steam profile](https://steamcommunity.com/profiles/76561199544666292/)

DM mở khắp nơi — trả lời chậm, introvert max level. Trang About trong [webapp](https://freeitchgames.win/#/about) có cùng danh sách dạng nút bấm.

## Pháp lý

Bản tiếng Việt nằm trong [`docs/i18n/vi/`](docs/i18n/vi/) — bản tiếng Anh là bản chính thức cho mọi giải thích pháp lý.

- [Disclaimer](docs/i18n/vi/DISCLAIMER.md) ([EN](docs/DISCLAIMER.md))
- [Privacy Policy](docs/i18n/vi/PrivacyPolicy.md) ([EN](docs/PrivacyPolicy.md))
- [Terms of Use](docs/i18n/vi/ToS.md) ([EN](docs/ToS.md))
- [EULA](docs/i18n/vi/EULA.md) ([EN](docs/EULA.md))
- [Code of Conduct](docs/i18n/vi/CODE_OF_CONDUCT.md) ([EN](CODE_OF_CONDUCT.md))
- [Security](docs/i18n/vi/SECURITY.md) ([EN](SECURITY.md))

Cấp phép theo [MIT](LICENSE).
