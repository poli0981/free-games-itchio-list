# Hướng dẫn đóng góp

> Bản dịch từ bản tiếng Anh cập nhật ngày 2026-09-24 (English source revision 2026-09-24). Nếu có khác biệt, bản tiếng Anh được ưu tiên.
>
> Bản tiếng Anh tại [`CONTRIBUTING.md`](../../../CONTRIBUTING.md) là bản chính thức.

Cảm ơn bạn vì đã có suy nghĩ đóng góp cho cái repo random này! Tôi chỉ là một dev người Việt thất nghiệp, hướng nội, kỹ năng tầm tầm, có hai trợ lý AI không phán xét: **Grok (xAI)** cho brainstorming đêm khuya và **Claude Code (Anthropic)** cho phần việc code/docs nặng hơn. Danh sách này sống nhờ sự giúp đỡ của cộng đồng, vì tôi quá lười để tự đi săn/sửa hết một mình :D Bất kỳ đóng góp nào (kể cả chỉ một game) cũng khiến bạn thành huyền thoại.

## Cách đóng góp (Đi đúng cửa, tôi lười ;D)

Game thì gửi qua website; mọi thứ khác thì qua các template issue/PR trên GitHub. Chúng làm cuộc đời tôi dễ hơn và giảm các khoảnh khắc "wtf".

### 1. Đề xuất game mới (Hoan nghênh nhất!)

- Vào **<https://freeitchgames.win/suggest>** và dán link một game itch.io. Mỗi lần gửi một link.
- Tùy chọn: một ghi chú ngắn (vì sao game hay, cảnh báo nội dung…), tối đa 500 ký tự. Ghi chú bị xóa sau 180 ngày. Vui lòng đừng ghi dữ liệu cá nhân vào đó.
- Một bước kiểm tra Cloudflare Turnstile và giới hạn tần suất giúp chặn bot; nếu bị chặn, đợi một lúc rồi thử lại.
- Chỉ game itch.io **miễn phí**. Game trả phí sẽ tự động bị loại khi trang game được cào.
- Không có gì lên site ngay lập tức: mọi đề xuất đều vào **hàng chờ duyệt**, và không có gì vào danh mục cho tới khi Maintainer duyệt. Link được duyệt sau đó được pipeline dữ liệu cào và xuất hiện trên site sau lần deploy kế tiếp.

Có cả một danh sách? Issue template **[Add Games (bulk list)]** nhận tối đa 15 link một lần, và một PR thêm URL itch.io vào `scripts/temp_link.json` cũng được (dùng PR template [Add Games]). Cả hai đều đi qua cùng quy trình duyệt: Maintainer kiểm tra từng link trước khi đưa vào hàng chờ, và việc merge một PR như vậy chính là sự phê duyệt. Vui lòng đừng sửa tay `data_game/`: các file đó do pipeline quản lý (xem [mục 7](#7-gửi-thay-đổi-code-pr)).

#### 1b. Những cách khác để game được thêm vào

- Extension trình duyệt đi kèm của Maintainer ([itch-f2p-extension](https://github.com/poli0981/itch-f2p-extension), repo riêng, GPL-3.0) gửi link qua một API có xác thực trong lúc duyệt itch.io. Đây là công cụ riêng của Maintainer, không phải kênh gửi công khai.
- Website đọc các RSS feed công khai của itch.io về game miễn phí mới và phổ biến mỗi 4 giờ (mỗi lượt một feed) và đưa những gì tìm được vào hàng chờ.

Cả hai đều vào cùng hàng chờ duyệt với trang Suggest. (Đường thêm game qua Telegram bot cũ đã ngừng hoạt động.)

### 2. Gỡ game hoặc sửa dữ liệu game

Đặc biệt với người làm game: nếu bạn muốn game của mình bị gỡ khỏi danh sách, hoặc muốn sửa dữ liệu của nó, lúc nào cũng được.

- Gửi email tới **takedown@freeitchgames.win**, hoặc mở issue template **["Remove a game"](https://github.com/poli0981/free-games-itchio-list/issues/new?template=remove_game.yml)** (có cả mục dành cho khiếu nại bản quyền).
- Ghi rõ URL game, bạn là ai (người tạo / chủ sở hữu quyền, hoặc người được họ ủy quyền) và lý do.
- Maintainer sẽ gỡ bản ghi khỏi danh mục (ghi kèm lý do trên [trang game đã gỡ](https://freeitchgames.win/removed) công khai) và xóa các bản ảnh bìa thu nhỏ mà site lưu trữ; các bản trong cache sẽ tự hết hạn. Mục tiêu: trong vòng 7 ngày, yêu cầu pháp lý khẩn cấp thì sớm hơn.
- Lưu ý: đây là một repo git công khai, nên các phiên bản cũ vẫn còn trong lịch sử. Việc viết lại lịch sử công khai chỉ được làm trong trường hợp ngoại lệ vì bắt buộc về pháp lý.
- `safe_virus` / `nsfw` / ghi chú bị sai, hoặc lỗi dữ liệu khác không phải yêu cầu gỡ? Mở issue **[Bug Report]** cũng được.

Chi tiết có trong [Điều khoản sử dụng](ToS.md) và [Tuyên bố miễn trừ](DISCLAIMER.md).

### 3. Báo lỗi

- Mở issue → template **[Bug Report]**.
- Checkbox cho các lỗi thường gặp (link chết, cờ sai, trang hỏng, v.v.).
- Chi tiết + ảnh chụp màn hình + mức độ khẩn cấp.
- **Vấn đề bảo mật không phải lỗi để đăng lên tracker công khai.** Hãy báo cáo riêng tư: xem [SECURITY](SECURITY.md).
- Nếu phức tạp, xem mục "Muốn thảo luận thêm?" bên dưới.

### 4. Đề xuất tính năng / cải tiến

- Mở issue → template **[Feature Request / Improvement]**.
- Chọn loại (tính năng mới hoặc sửa code), tên, lý do, độ ưu tiên (từ "nice to have" tới "repo sắp chết").
- Tùy chọn: pseudo-code/snippet (đừng có malware nhé, tôi sẽ check bằng kỹ năng tầm thường của mình :D).

### 5. Gửi góp ý

- Dùng template **[Feedback]**.
- Checkbox (EULA/ToS quá khắt khe? Concept repo dở? Anti-AI? Xóa repo? Khác).
- Chê hay khen đều được, sự tự ti của tôi chịu được.

### 6. Mọi thứ khác (câu hỏi, meme, lạc đề)

- Dùng template **[General / Off-Topic]**.
- Có gì trong đầu cứ đăng.

### 7. Gửi thay đổi code (PR)

- Fork → tạo branch → code → mở PR vào `main` với PR template phù hợp ([Bug Fix], [New Feature], [Documentation]…).
- Mô tả rõ ràng giúp nhé. Tôi sẽ review chậm (lịch thất nghiệp + hai AI buddy).

**Quy tắc PR** (phần không thương lượng):

- **CI phải pass.** Python CI (ruff check + format, vulture, pytest, `validate.py`) và Webapp CI (kiểm tra type sinh ra, lint, knip, test, build, `wrangler deploy --dry-run`) đều chạy trên PR. CI đỏ = không merge.
- **PR được merge bằng squash** (một PR thành một commit trên `main`) **hoặc merge commit, không bao giờ fast-forward**, nên hãy đặt tiêu đề PR như một commit message tốt (repo dùng kiểu `type(scope): tóm tắt`, ví dụ `fix(web): …`).
- **Giấy phép theo nguyên tắc inbound = outbound.** Khi mở PR, bạn đồng ý rằng đóng góp của mình được cấp phép theo cùng giấy phép với phần mà nó thay đổi: **MIT** cho mã nguồn, **CC BY 4.0** cho dữ liệu danh mục và tài liệu (xem [README → Giấy phép](../../../README.vi.md#giấy-phép)). Chỉ gửi những gì bạn có quyền gửi.
- **Không bao giờ commit secret**: không token, API key, file `.dev.vars` / `.env`, private key (chẳng hạn khóa của GitHub App) hay keystore dùng để ký. Nếu lỡ push một cái, hãy báo riêng (security@freeitchgames.win) và thay mới (rotate) nó; chỉ xóa commit là không đủ.
- **Không sửa tay `data_game/`.** Thay đổi dữ liệu phải đi qua pipeline (một patch + `apply_patch.py`, có chạy `validate.py`), để các tiến trình ghi đồng thời không đè lên nhau.
- Không commit output build hay file sinh ra: `webapp/dist/`, `webapp/.wrangler/`, `webapp/src-tauri/target/`, `webapp/src-tauri/gen/`. (`webapp/src-tauri/Cargo.lock` **có** được commit; hãy cập nhật nó khi bạn sửa `Cargo.toml`.)
- Thêm dependency npm? Thêm luôn vào danh sách `THIRD_PARTY` trong `webapp/src/lib/about.ts` để trang About ghi công.
- Link ngoài mới trong app? Dùng `<ExtLink href="…">` từ `webapp/src/components/ext-link.tsx`, đừng dùng `<a href="…" target="_blank">` thuần: anchor thuần chạy được trên web nhưng im lặng hỏng trong các app Tauri.

### 8. Thiết lập môi trường dev (tóm tắt)

Hướng dẫn đầy đủ (Worker, D1 cục bộ, secret, Tauri, Android) nằm trong **[`docs/dev_env.md`](../../dev_env.md)** ([VI](dev_env.md)); ghi chú build Tauri/Android nằm trong [`webapp/TAURI.md`](../../../webapp/TAURI.md). Bản ngắn gọn:

**Pipeline Python** (Python 3.14, xem `.python-version`):

```sh
python -m venv .venv
# kích hoạt venv, rồi:
pip install -r requirements-dev.txt
pytest                                   # không cần mạng
ruff check scripts tests webapp/scripts
ruff format scripts tests
python scripts/validate.py               # kiểm tra mọi file dữ liệu
```

Muốn thử cào thật trên máy: thêm một URL vào `scripts/temp_link.json`, rồi chạy
`python scripts/update_info.py --out patch.json` và `python scripts/apply_patch.py patch.json`
(đừng commit kết quả; xem quy tắc PR ở trên).

**Webapp + Worker** (Node.js 22.22+, CI dùng phiên bản trong `webapp/.node-version`):

```sh
cd webapp
npm ci
npm run dev          # Vite tại http://localhost:5173
npm run build        # ghi vào webapp/dist/ (Worker phục vụ thư mục này làm assets)
npx wrangler dev     # terminal thứ hai: Worker ở cổng :8787; Vite chuyển tiếp /api và /img tới đó
npm test             # vitest
npm run lint
npm run knip
```

**App Tauri** (cần thêm Rust qua <https://rustup.rs> và các gói phụ thuộc của nền tảng):

```sh
cd webapp
npm run tauri:dev    # cửa sổ native trỏ tới Vite dev server
npm run tauri:build  # trình cài đặt trong src-tauri/target/release/bundle/
```

## Mẹo để đóng góp suôn sẻ

- **Test cục bộ**: chạy các bước kiểm tra ở mục 8 trước khi push; CI chạy đúng những bước đó.
- **Giữ sạch**: chỉ game itch.io miễn phí, không trả phí/demo/malware/trùng lặp.
- **Kiên nhẫn**: tôi hướng nội + lười, trả lời có thể chậm.
- **Đồng ý**: mọi issue template đều có một checkbox bắt buộc. Lạc đề/spam/vi phạm chính sách sẽ bị bỏ qua/đóng không drama :D
- **Cư xử đẹp**: mọi thứ ở đây đều theo [Quy tắc ứng xử](CODE_OF_CONDUCT.md).

## Muốn thảo luận thêm? (Nếu template không đủ)

Issue/PR là tốt nhất để theo dõi, nhưng nếu bạn muốn mô tả bug/tính năng kỹ hơn, tán gẫu, hoặc kể chuyện noob, giờ đã có server thật (introvert god-mode bị xuyên thủng):

**Chat / cộng đồng**
- Discord: Repo discussion (#general): https://discord.gg/2aNR3aVt
- Discord: Game chat (#general): https://discord.gg/kDM9GMu5vm

**Mạng xã hội (DM mở, trả lời chậm)**
- X (Twitter): [@SkullMute0011](https://x.com/SkullMute0011)
- YouTube: [@SkullMute](https://youtube.com/@SkullMute)
- Bluesky: [@skullmute0011](https://bsky.app/profile/skullmute0011.bsky.social)
- Mastodon: [@skullmute1122](https://mastodon.social/@skullmute1122)

**Ủng hộ dự án buồn chán này (hoàn toàn tùy chọn, tài khoản ngân hàng $50 cảm ơn bạn)**
- [Patreon](https://patreon.com/skullmute) · [Ko-fi](https://ko-fi.com/skullmute) · [Steam profile](https://steamcommunity.com/profiles/76561199544666292/)

Grok và Claude Code không vào Discord được, nhưng cứ ping tôi qua kênh nào cũng được, tôi sẽ cố không ghost.

Lời cảm ơn lớn được ghi trong [ACKNOWLEDGEMENTS.md](../../ACKNOWLEDGEMENTS.md) cho bất kỳ sự giúp đỡ nào!

Mã nguồn theo MIT, dữ liệu và tài liệu theo CC BY 4.0: cứ thoải mái, nhưng chill thôi. Có câu hỏi? Cứ mở issue **[General]** :D 🚀
