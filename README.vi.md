# Danh sách Game Itch.io Miễn Phí

[![Version](https://img.shields.io/badge/version-4.0.0-blue.svg)](https://github.com/poli0981/free-games-itchio-list/releases/latest)
[![Website](https://img.shields.io/badge/website-freeitchgames.win-purple.svg)](https://freeitchgames.win)
[![Stars](https://img.shields.io/github/stars/poli0981/free-games-itchio-list?style=social)](https://github.com/poli0981/free-games-itchio-list/stargazers)
[![Forks](https://img.shields.io/github/forks/poli0981/free-games-itchio-list?style=social)](https://github.com/poli0981/free-games-itchio-list/network/members)
[![Last Updated](https://img.shields.io/github/last-commit/poli0981/free-games-itchio-list?label=last%20updated)](https://github.com/poli0981/free-games-itchio-list/commits/main)
[![Code: MIT](https://img.shields.io/badge/code-MIT-yellow.svg)](LICENSE)
[![Data & docs: CC BY 4.0](https://img.shields.io/badge/data%20%26%20docs-CC%20BY%204.0-lightgrey.svg)](data_game/LICENSE.md)
[![English](https://img.shields.io/badge/lang-English-blue.svg)](README.md)

> Bản dịch từ bản tiếng Anh cập nhật ngày 2026-09-18 (English source revision 2026-09-18). Nếu có khác biệt, bản tiếng Anh được ưu tiên.
>
> Bản tiếng Anh tại [`README.md`](README.md) là bản chính thức. Bản dịch tiếng Việt của các tài liệu chính sách nằm trong [`docs/i18n/vi/`](docs/i18n/vi/).

Một danh mục được tuyển chọn và tự động cập nhật gồm **hơn 2,600 game miễn phí trên [itch.io](https://itch.io)**. Duyệt tại **<https://freeitchgames.win>**: tìm kiếm, lọc, sắp xếp và mở thẳng trang itch.io của bất kỳ game nào. Website chỉ để xem, với tất cả mọi người: không tài khoản, không đăng nhập, không bình luận, không quảng cáo, không thanh toán.

## Mục lục

- [Duyệt danh mục](#duyệt-danh-mục)
- [Ứng dụng desktop và Android](#ứng-dụng-desktop-và-android)
- [Thêm game](#thêm-game)
- [Dữ liệu được cập nhật thế nào](#dữ-liệu-được-cập-nhật-thế-nào)
- [Bên trong dự án](#bên-trong-dự-án)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [Tự động hóa](#tự-động-hóa)
- [Các trường dữ liệu](#các-trường-dữ-liệu)
- [Đóng góp](#đóng-góp)
- [Kết nối / hỗ trợ](#kết-nối--hỗ-trợ)
- [Giấy phép](#giấy-phép)
- [Pháp lý](#pháp-lý)

## Duyệt danh mục

Mọi thứ nằm trên website **<https://freeitchgames.win>**:

- **Danh sách game**: toàn bộ danh mục trong một bảng chạy nhanh (dạng thẻ trên điện thoại), lọc theo thể loại, nền tảng, trạng thái và nhiều thứ khác, cùng một trang chi tiết cho từng game.
- **Biểu đồ**: danh mục được chia ra sao, và đã lớn lên thế nào theo thời gian.
- **Đã gỡ** (Removed): mọi game bị loại khỏi danh mục, kèm lý do (<https://freeitchgames.win/removed>).
- **Nội dung 18+ bị ẩn theo mặc định.** Game được đánh dấu `nsfw: Yes` sẽ bị ẩn (kể cả ảnh bìa) trừ khi bạn tự bật trong Settings sau khi xác nhận mình đủ 18 tuổi. Lựa chọn đó chỉ được lưu trong trình duyệt của bạn.

Mọi link đều dẫn tới trang riêng của game trên itch.io. Ảnh bìa trên website là bản thu nhỏ do freeitchgames.win phục vụ, nên trình duyệt của bạn không kết nối tới itch.io cho tới khi bạn bấm vào một link.

Muốn lấy dữ liệu gốc? Đó là JSON thuần, nằm trong [`data_game/`](data_game/) của repo này và tại <https://freeitchgames.win/data/index.json> (cùng các file mà nó liệt kê). Vui lòng dùng các file đó thay vì cào (scrape) website; xem [Giấy phép](#giấy-phép) để biết bạn được tái sử dụng chúng thế nào.

(Địa chỉ cũ `poli0981.github.io/free-games-itchio-list` giờ chỉ chuyển hướng sang website mới. Các bảng markdown theo thể loại trong `lists/` và file `deleted_games.txt` đã bị bỏ: danh mục giờ chỉ có trên web.)

## Ứng dụng desktop và Android

Cùng một app cũng được phát hành dưới dạng **ứng dụng native chỉ để xem**, build bằng Tauri 2 từ cùng mã nguồn. Tải từ [GitHub Release](https://github.com/poli0981/free-games-itchio-list/releases/latest) mới nhất:

| Nền tảng | File |
|---|---|
| Windows | Trình cài đặt `.msi` hoặc `.exe` |
| macOS | `.dmg`, `.pkg` hoặc `.app.tar.gz` (cần Safari/WebKit 16.4 trở lên) |
| Linux | `.deb` hoặc `.AppImage` |
| Android 11+ (arm64-v8a) | `.apk` (cài tay, xem bên dưới) |

Các app tải JSON danh mục từ <https://freeitchgames.win/data> và tải ảnh bìa trực tiếp từ CDN ảnh của itch.io (`img.itch.zone`); bấm vào một game sẽ mở itch.io trong trình duyệt của bạn. Không có telemetry. Cập nhật thủ công: khi có bản mới thì tải bản mới về. Cài app đồng nghĩa với việc chấp nhận [EULA](docs/i18n/vi/EULA.md) ([EN](docs/EULA.md)).

### Android (tải & cài đặt)

Không có trên Play Store: chỉ cần tải `.apk` về và cài tay (Android cho phép, chỉ hỏi xác nhận trước):

1. Mở [Release](https://github.com/poli0981/free-games-itchio-list/releases/latest) mới nhất và tải `FreeGamesItchio_<version>_arm64-v8a.apk`. Chỉ cài APK từ trang đó: file được ký bằng khóa của dự án.
2. Bấm vào file. Android sẽ hỏi **cho phép cài từ nguồn này** (trình duyệt / trình quản lý file). Hãy bật lên (Cài đặt → *Ứng dụng* → *Truy cập đặc biệt* → *Cài ứng dụng không xác định*).
3. Chấp nhận cảnh báo "không từ Play Store" và cài. Vẫn là app y hệt bản web/desktop.

Lưu ý: **chỉ arm64-v8a** (mọi điện thoại từ ~2017; không hỗ trợ máy chỉ chạy 32-bit), và Android **11+** (API 30). Phiên bản cũ hơn không cài được. Đây là cố ý: giữ mức tối thiểu ở phiên bản còn được gia cố bảo mật và là phiên bản bọn mình thật sự test (≈87% thiết bị đang hoạt động; [lý do](webapp/TAURI.md#why-android-11-api-30)). Cách tự build có trong mục Android của [`webapp/TAURI.md`](webapp/TAURI.md).

## Thêm game

Có ba cách để một game vào danh mục. **Cả ba đều đi qua hàng chờ duyệt**: không có gì được thêm cho tới khi Maintainer duyệt.

1. **Trang Suggest**: <https://freeitchgames.win/suggest>. Dán link game itch.io và, nếu muốn, một ghi chú ngắn (tối đa 500 ký tự; ghi chú bị xóa sau 180 ngày). Một bước kiểm tra Cloudflare Turnstile và giới hạn tần suất giúp chặn spam. Vui lòng không ghi dữ liệu cá nhân vào ghi chú.
2. **Extension trình duyệt**: [itch-f2p-extension](https://github.com/poli0981/itch-f2p-extension) của chính Maintainer (repo riêng, GPL-3.0) gửi link qua một API có xác thực trong lúc duyệt itch.io.
3. **Tự động phát hiện**: cứ 4 giờ một lần, website đọc một trong các RSS feed công khai của itch.io về game miễn phí mới và phổ biến (mỗi lượt một feed) rồi đưa những gì tìm được vào hàng chờ.

Maintainer duyệt hàng chờ trong một khu vực quản trị riêng (được bảo vệ bởi Cloudflare Access). Link được duyệt sẽ được chuyển cho pipeline dữ liệu, pipeline này cào từng trang game; game trả phí bị loại.

Thích dùng GitHub hơn, hoặc có cả một danh sách dài? Issue template "Add Games (bulk list)" cũng dùng được; các link đó đi qua cùng quy trình duyệt. Xem [CONTRIBUTING](docs/i18n/vi/CONTRIBUTING.md#1-đề-xuất-game-mới-hoan-nghênh-nhất).

Muốn **gỡ** một game, hoặc sửa dữ liệu của nó (nhất là các nhà phát triển game)? Gửi email tới **takedown@freeitchgames.win** hoặc mở issue ["Remove a game"](https://github.com/poli0981/free-games-itchio-list/issues/new?template=remove_game.yml). Ghi rõ URL game, bạn là ai (người tạo / chủ sở hữu quyền, hoặc người được họ ủy quyền) và lý do. Chi tiết: [Điều khoản sử dụng](docs/i18n/vi/ToS.md) và [Tuyên bố miễn trừ](docs/i18n/vi/DISCLAIMER.md).

## Dữ liệu được cập nhật thế nào

```
Trang Suggest ─┐
Extension     ─┼─→ hàng chờ duyệt ─→ Maintainer duyệt ─→ scripts/temp_link.json
RSS feed      ─┘                       (admin)                │
                                                              ▼
                         update.yml → update_info.py (game mới)    ──┐
                         refresh.yml → refresh.py (1/7 mỗi ngày)   ──┴─→ patch ─→ apply_patch.py
                                                                          (validate + push)
                                                                                 │
                                          freeitchgames.win/data ←── data_game/*.json
```

1. **Hàng chờ**: link đã duyệt được GitHub App của dự án commit vào `scripts/temp_link.json` (commit đã xác minh).
2. **Ingest**: `update.yml` chạy `update_info.py` ngay khi hàng chờ thay đổi (và mỗi ngày một lần để dự phòng). Mỗi link được chuẩn hóa, fetch, kiểm tra còn miễn phí không rồi cào dữ liệu; game trả phí, đã chết, trùng hoặc từng bị gỡ sẽ bị bỏ qua. Lỗi tạm thời được giữ lại trong hàng chờ để thử lại (tối đa 3 lượt chạy).
3. **Refresh**: `refresh.yml` mỗi ngày kiểm tra lại 1/7 danh mục (mỗi game một request), nên mọi game được kiểm tra lại hằng tuần: link chết (404/410), game chuyển sang trả phí, rating và trạng thái. Game chỉ bị gỡ khi cùng một vấn đề được thấy lại sau ít nhất 20 giờ. Việc gỡ được ghi kèm lý do trong [`scripts/deleted_games.json`](scripts/deleted_games.json), và một lượt chạy định gỡ số game nhiều bất thường sẽ giữ chúng lại và cảnh báo thay vì gỡ.
4. **Commit an toàn**: cả hai bước xuất ra một patch theo URL; `apply_patch.py` áp nó lên `main` mới nhất, validate mọi file dữ liệu (`validate.py`) rồi mới push, và thử lại nếu có tiến trình ghi khác push trước.
5. **Xuất bản**: mỗi lần push vào `main` sẽ build lại website, gói kèm danh mục tại <https://freeitchgames.win/data>.

Pipeline cư xử lịch sự với itch.io: nó tự xưng danh là `FreeItchGamesBot/4.0 (+https://freeitchgames.win/about)`, giãn nhịp request và tuân thủ HTTP 429 / `Retry-After`. Chỉ các trang và feed công khai của itch.io được đọc.

## Bên trong dự án

- **Web app** ([`webapp/src/`](webapp/src/)): React + TypeScript + Vite + Tailwind CSS, TanStack Query / Table / Virtual, React Router, Zustand. Giao diện tiếng Anh và tiếng Việt.
- **Cloudflare Worker** ([`webapp/worker/`](webapp/worker/)): phục vụ website và `/data`, proxy ảnh (`/img`, ảnh bìa WebP đã thu nhỏ lưu trên Cloudflare R2), API Suggest và ingest, hàng chờ duyệt (Cloudflare D1), API quản trị và lịch phát hiện qua RSS. Cấu hình: [`webapp/wrangler.jsonc`](webapp/wrangler.jsonc).
- **App quản trị** ([`webapp/admin/`](webapp/admin/)): màn hình duyệt chỉ dành cho Maintainer tại `/admin`, đứng sau Cloudflare Access. Nó ghi vào repo này dưới danh nghĩa một GitHub App.
- **Vỏ native** ([`webapp/src-tauri/`](webapp/src-tauri/)): Tauri 2 cho Windows, macOS, Linux và Android. Xem [`webapp/TAURI.md`](webapp/TAURI.md).
- **Pipeline dữ liệu** ([`scripts/`](scripts/), Python 3.14): scraper, refresh, patch/apply và validate, chạy bằng GitHub Actions.

Việc deploy do Cloudflare Workers Builds đảm nhận (thư mục gốc `webapp`, `npm run build`, rồi `npx wrangler deploy`): mỗi lần push vào `main` sẽ tự động lên site.

Dev cục bộ nhanh (thiết lập đầy đủ, gồm Worker, secret và test, có trong [`docs/dev_env.md`](docs/dev_env.md) ([VI](docs/i18n/vi/dev_env.md))):

```sh
cd webapp
npm ci
npm run dev          # http://localhost:5173 (Vite)
npm run build        # ghi vào webapp/dist/ (Worker phục vụ thư mục này làm assets)
npx wrangler dev     # terminal thứ hai: Worker ở cổng :8787; Vite chuyển tiếp /api và /img tới đó
npm run tauri:dev    # cửa sổ desktop native (cần Rust)
```

## Cấu trúc dự án

```
data_game/              # Danh mục (JSON chia khối, tối đa 500 game/file) + LICENSE.md (CC BY 4.0)
├── game_info_001.json
├── ...
├── index.json          # Bảng kê các khối (tổng + số lượng từng file)
└── count_history.json  # Tổng số theo ngày cho biểu đồ "số game theo thời gian"

scripts/
├── scraper.py          # Dùng chung: HTTP session, giãn nhịp / lùi lại khi 429, nhận diện free, parse
├── data_store.py       # Dùng chung: đọc/ghi theo khối (diff tối thiểu), index.json, count_history.json
├── canonical.py        # Một dạng chuẩn duy nhất cho URL game itch.io
├── update_info.py      # URL trong hàng chờ → patch (game mới)
├── refresh.py          # Kiểm tra xoay vòng → patch (còn sống / trả phí / rating / trạng thái); --full cào lại
├── apply_patch.py      # Áp patch lên main mới nhất, rồi validate
├── validate.py         # Kiểm tra schema + tính nhất quán cho mọi file dữ liệu
├── temp_link.json      # Hàng chờ ingest (link đã duyệt)
├── deleted_games.json  # Nhật ký game đã gỡ kèm lý do (công khai)
└── state/              # Sổ sách của pipeline (lần kiểm tra cuối, strike, lần thử lại), không công khai

bash/commit_push.sh     # fetch main → áp patch → validate → commit → push (có thử lại)
tests/                  # Bộ test pytest (không dùng mạng) + fixture dùng chung với Worker

webapp/
├── src/                # App React (route, component, store, i18n)
├── admin/              # App quản trị chỉ dành cho Maintainer (/admin)
├── worker/             # Cloudflare Worker (dữ liệu, proxy ảnh, API, hàng chờ duyệt, phát hiện qua RSS)
├── src-tauri/          # Vỏ Tauri 2 (desktop + Android)
├── wrangler.jsonc      # Cấu hình Cloudflare
└── TAURI.md            # Ghi chú build desktop / Android

LICENSE                 # MIT (mã nguồn)
LICENSES/CC-BY-4.0.txt  # Toàn văn pháp lý CC BY 4.0 (dữ liệu + tài liệu)
NOTICE.md               # Bản đồ giấy phép, tuyên bố không liên kết, ghi công
docs/                   # Chính sách, môi trường dev, danh sách bên thứ ba (+ bản tiếng Việt trong docs/i18n/vi/)
```

## Tự động hóa

| Tác vụ | Lịch | Mục đích |
|---|---|---|
| Ingest (`update.yml`) | Khi hàng chờ đổi + hằng ngày 01:23 UTC | Cào link đã duyệt từ `temp_link.json`, bỏ qua game trả phí / đã chết / từng bị gỡ |
| Refresh (`refresh.yml`) | Hằng ngày 02:47 UTC | Kiểm tra lại 1/7 danh mục: link chết, game chuyển sang trả phí, rating, trạng thái |
| Force update (`force_update.yml`) | Thủ công | Cào lại mọi trường (một URL hoặc lô tiếp theo); giữ nguyên `safe_virus` / `notes` / `nsfw` |
| Phát hiện qua RSS (Cloudflare Worker) | Mỗi 4 giờ | Đọc một feed itch.io mỗi lượt; game mới vào hàng chờ duyệt |
| Python CI / Webapp CI | Pull request | Lint, test, validate dữ liệu / type-check, test, build |
| Deploy website | Khi push vào `main` | Cloudflare Workers Builds (`webapp/wrangler.jsonc`) → freeitchgames.win |
| Release desktop / Android | Khi push tag `v*` | Trình cài đặt Tauri (Win/macOS/Linux) và APK đã ký → draft Release |

Lỗi mạng được coi là tạm thời; game chỉ bị gỡ khi cùng lỗi 404/410 hoặc trạng thái trả phí được thấy lại ít nhất 20 giờ sau lần đầu. Lỗi, lượt bị hủy, bị giới hạn tốc độ và thay đổi hàng loạt đáng ngờ được báo về Discord của dự án dưới dạng thông báo tự động.

## Các trường dữ liệu

Mỗi game trong `data_game/game_info_NNN.json` có 20 trường sau (cộng thêm dấu thời gian tùy chọn `added_at` / `updated_at` do pipeline thêm vào). Chỉ `safe_virus`, `notes` và `nsfw` do Maintainer quản lý; mọi thứ khác được cào từ trang itch.io công khai của game, và không lần cào lại nào ghi đè ba trường đó.

| Trường            | Mô tả                                                      |
|-------------------|------------------------------------------------------------|
| `url`             | URL trang game                                             |
| `name`            | Tên game                                                   |
| `dev`             | Tên nhà phát triển / tác giả                               |
| `description`     | Mô tả ngắn (câu đầu tiên, tối đa 200 ký tự)                |
| `genre`           | Thể loại theo itch.io                                      |
| `tags`            | Tất cả tag                                                 |
| `status`          | Trạng thái phát hành                                       |
| `platforms`       | Nền tảng hỗ trợ (Windows, macOS, Linux, Web)               |
| `publisher`       | Nhà phát hành (nếu khác tác giả)                           |
| `release_date`    | Ngày phát hành đầy đủ từ metadata của trang                |
| `made_with`       | Engine / công cụ sử dụng                                   |
| `rating`          | Điểm đánh giá trung bình (tổng hợp từ itch.io)             |
| `rating_count`    | Số lượt đánh giá                                           |
| `average_session` | Thời lượng một phiên chơi điển hình                        |
| `languages`       | Ngôn ngữ hỗ trợ                                            |
| `inputs`          | Cách điều khiển (bàn phím, chuột, tay cầm)                 |
| `nsfw`            | Cờ 18+, `Yes` / `No` (được gợi ý từ tag, cảnh báo nội dung và mô tả khi thêm game; do Maintainer quản lý) |
| `safe_virus`      | Ghi chú an toàn thủ công: `?` (mặc định), `Yes`, `No`, `Caution`. Chỉ là ghi chú, không phải bảo đảm: file tải về không được quét |
| `notes`           | Ghi chú thủ công                                           |
| `thumbnail`       | URL ảnh bìa (trên itch.io)                                 |

Các trường được cào mặc định là `N/A` khi trang game không có thông tin.

## Đóng góp

Xem [CONTRIBUTING (tiếng Việt)](docs/i18n/vi/CONTRIBUTING.md) để có hướng dẫn đầy đủ (bản chính thức: [CONTRIBUTING.md](CONTRIBUTING.md)).

- **Thêm game**: dùng [trang Suggest](https://freeitchgames.win/suggest).
- **Gỡ game / sửa dữ liệu**: gửi email tới takedown@freeitchgames.win hoặc mở issue ["Remove a game"](https://github.com/poli0981/free-games-itchio-list/issues/new?template=remove_game.yml).
- **Báo lỗi**: dùng issue template "Bug Report".
- **Đề xuất tính năng**: dùng template "Feature Request / Improvement", hoặc gửi PR.
- **Vấn đề bảo mật**: báo cáo riêng tư, đừng bao giờ mở issue công khai. Xem [SECURITY](docs/i18n/vi/SECURITY.md) ([EN](SECURITY.md)).
- **Câu hỏi về quyền riêng tư**: xem [Chính sách quyền riêng tư](docs/i18n/vi/PrivacyPolicy.md) ([EN](docs/PrivacyPolicy.md)) hoặc gửi email tới privacy@freeitchgames.win.
- Vui lòng tuân thủ [Quy tắc ứng xử](docs/i18n/vi/CODE_OF_CONDUCT.md) ([EN](CODE_OF_CONDUCT.md)).

Người đóng góp được ghi nhận trong [ACKNOWLEDGEMENTS.md](docs/ACKNOWLEDGEMENTS.md).
Cấu hình máy + môi trường dev của Maintainer: [`docs/pc_spec.md`](docs/pc_spec.md) ([VI](docs/i18n/vi/pc_spec.md)), [`docs/dev_env.md`](docs/dev_env.md) ([VI](docs/i18n/vi/dev_env.md)).

## Kết nối / hỗ trợ

Hai server Discord giờ đã tồn tại (câu "if I ever make one" chính thức lỗi thời):

- **Chat**: Discord: [Repo discussion](https://discord.gg/2aNR3aVt) · [Game chat](https://discord.gg/kDM9GMu5vm)
- **Mạng xã hội**: [X/@SkullMute0011](https://x.com/SkullMute0011) · [YouTube/@SkullMute](https://youtube.com/@SkullMute) · [Bluesky](https://bsky.app/profile/skullmute0011.bsky.social) · [Mastodon](https://mastodon.social/@skullmute1122)
- **Nhắn tin**: [Telegram (DM)](https://t.me/SkullMute0011)
- **Ủng hộ** (hoàn toàn tùy chọn, giống [`.github/FUNDING.yml`](.github/FUNDING.yml)): [GitHub Sponsors](https://github.com/sponsors/poli0981) · [Patreon](https://patreon.com/skullmute) · [Ko-fi](https://ko-fi.com/skullmute) · [Buy Me a Coffee](https://buymeacoffee.com/skullmute) · [PayPal](https://paypal.me/DungDang212)
- **Gaming**: [Steam profile](https://steamcommunity.com/profiles/76561199544666292/)

DM mở ở mọi nơi; trả lời chậm (hướng nội max level). [Trang About](https://freeitchgames.win/about) của website có cùng danh sách dưới dạng nút bấm.

## Giấy phép

Repo này dùng ba giấy phép (bản đồ đầy đủ trong [NOTICE.md](NOTICE.md)):

| Phần nào | Giấy phép | File |
|---|---|---|
| **Mã nguồn**: `scripts/`, `webapp/`, `bash/`, workflow, test, mọi thứ không liệt kê bên dưới | MIT, Copyright (c) 2025-2026 poli0981 (SkullMute) | [`LICENSE`](LICENSE) |
| **Dữ liệu danh mục**: `data_game/`, `scripts/deleted_games.json` và các file dẫn xuất tại <https://freeitchgames.win/data> | CC BY 4.0, cho phần đóng góp của Maintainer (xem bên dưới) | [`data_game/LICENSE.md`](data_game/LICENSE.md) |
| **Tài liệu**: các file `*.md` ở thư mục gốc repo và trong `docs/` (README này, các chính sách) | CC BY 4.0 | [`LICENSES/CC-BY-4.0.txt`](LICENSES/CC-BY-4.0.txt) |

**Giấy phép dữ liệu bao gồm:** việc tuyển chọn và sắp xếp bộ sưu tập, ba trường do Maintainer viết (`safe_virus`, `notes`, `nsfw`), các bản ghi gỡ game, cùng cấu trúc và số liệu thống kê dẫn xuất.

**Không bao gồm** (thuộc sở hữu của người khác, dự án không cấp phép): mô tả game và mọi văn bản khác do người làm game viết, ảnh bìa / thumbnail và các phương tiện khác, tên game, logo và nhãn hiệu, cùng nhãn hiệu của itch.io. Các dữ kiện đơn thuần như URL, giá và điểm đánh giá vốn không được bảo hộ quyền tác giả.

Khi tái sử dụng dữ liệu, vui lòng ghi công như sau:

```
Free itch.io games catalog by poli0981 (SkullMute) — https://freeitchgames.win — CC BY 4.0
```

Các thành phần bên thứ ba giữ giấy phép riêng của chúng: xem [`docs/THIRD_PARTY.md`](docs/THIRD_PARTY.md) và trang About của website. Extension trình duyệt là một repo riêng theo GPL-3.0. Đóng góp được nhận theo cùng giấy phép với phần mà nó thay đổi (inbound = outbound): MIT cho mã nguồn, CC BY 4.0 cho dữ liệu và tài liệu.

**Không liên kết với itch.io.** Đây là một dự án độc lập do người hâm mộ làm. Dự án không liên kết với, không được chứng thực hay tài trợ bởi itch.io, Leaf Corcoran hoặc itch corp. "itch.io" cùng mọi tên game, logo và nhãn hiệu thuộc về chủ sở hữu tương ứng.

## Pháp lý

Bản tiếng Việt nằm trong [`docs/i18n/vi/`](docs/i18n/vi/); bản tiếng Anh là bản chính thức cho mọi giải thích pháp lý.

- [Điều khoản sử dụng](docs/i18n/vi/ToS.md) ([EN](docs/ToS.md)): áp dụng cho website và mọi thứ trên đó
- [Chính sách quyền riêng tư](docs/i18n/vi/PrivacyPolicy.md) ([EN](docs/PrivacyPolicy.md))
- [Tuyên bố miễn trừ](docs/i18n/vi/DISCLAIMER.md) ([EN](docs/DISCLAIMER.md))
- [EULA](docs/i18n/vi/EULA.md) ([EN](docs/EULA.md)): chỉ áp dụng cho app desktop và Android
- [Quy tắc ứng xử](docs/i18n/vi/CODE_OF_CONDUCT.md) ([EN](CODE_OF_CONDUCT.md))
- [Chính sách bảo mật (Security Policy)](docs/i18n/vi/SECURITY.md) ([EN](SECURITY.md))
- [NOTICE](NOTICE.md)

Liên hệ (được chuyển tiếp tới Maintainer):

- Quyền riêng tư: **privacy@freeitchgames.win**
- Gỡ nội dung / bản quyền: **takedown@freeitchgames.win**
- Lỗ hổng bảo mật: **security@freeitchgames.win** (hoặc tính năng báo cáo lỗ hổng riêng tư của GitHub)
- Mọi vấn đề pháp lý khác: **legal@freeitchgames.win**
