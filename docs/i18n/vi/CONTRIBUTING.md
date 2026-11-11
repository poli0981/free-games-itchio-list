# Hướng dẫn đóng góp

> Bản dịch từ bản tiếng Anh cập nhật ngày 2026-11-11 (English source revision 2026-11-11). Nếu có khác biệt, bản tiếng Anh được ưu tiên.
>
> Bản tiếng Anh tại [`CONTRIBUTING.md`](../../../CONTRIBUTING.md) là bản chính thức.

Cảm ơn bạn vì đã có suy nghĩ đóng góp cho cái repo random này! Tôi chỉ là một dev người Việt thất nghiệp, hướng nội, kỹ năng tầm tầm, có hai trợ lý AI không phán xét: **Grok (xAI)** cho brainstorming đêm khuya và **Claude Code (Anthropic)** cho phần việc code/docs nặng hơn. Danh sách này sống nhờ sự giúp đỡ của cộng đồng, vì tôi quá lười để tự đi săn/sửa hết một mình :D Bất kỳ đóng góp nào (kể cả chỉ một game) cũng khiến bạn thành huyền thoại.

## Trạng thái dự án: ổn định, chỉ bảo trì

Từ phiên bản 4.6.1 (2026-11-11), dự án ở trạng thái **ổn định và chỉ bảo trì**. Dự án đã đủ tính năng: website, các ứng dụng và pipeline dữ liệu vẫn chạy, danh mục vẫn tự cập nhật.

- **Maintainer vẫn làm**: vá bảo mật (CVE và báo cáo gửi qua [SECURITY](SECURITY.md)), cập nhật runtime và thư viện phụ thuộc, và sửa khi có gì đó làm website hoặc việc cập nhật dữ liệu hằng ngày ngừng chạy.
- **Không còn làm**: tính năng mới, thiết kế lại, refactor.
- **Issue và pull request chỉ được nhận cho dữ liệu**: thêm game (mục 1), sửa dữ liệu của một game hoặc gỡ game (mục 2 và 3). Rào cản trợ năng (mục 3) và báo cáo bảo mật vẫn giữ kênh riêng. Mọi thứ khác sẽ bị đóng mà không review; không giận gì nhau cả.

## Cách đóng góp (Đi đúng cửa, tôi lười ;D)

Game thì gửi qua website; sửa dữ liệu và gỡ game thì qua các issue template trên GitHub hoặc email. Chúng làm cuộc đời tôi dễ hơn và giảm các khoảnh khắc "wtf".

### 1. Đề xuất game mới (Hoan nghênh nhất!)

- Vào **<https://freeitchgames.win/suggest>** và dán link một game itch.io. Mỗi lần gửi một link.
- Tùy chọn: một ghi chú ngắn (vì sao game hay, cảnh báo nội dung…), tối đa 500 ký tự. Ghi chú bị xóa sau 180 ngày. Vui lòng đừng ghi dữ liệu cá nhân vào đó.
- Một bước kiểm tra Cloudflare Turnstile và giới hạn tần suất giúp chặn bot; nếu bị chặn, đợi một lúc rồi thử lại.
- Chỉ game itch.io **miễn phí**. Game trả phí sẽ tự động bị loại khi trang game được cào.
- Game phải chơi được hoặc tải được **ngay trên trang itch.io của nó** (bản chạy trên trình duyệt hoặc file đã tải lên). Trang chỉ dẫn sang launcher hay link tải ở site khác thì không đủ điều kiện, kể cả khi miễn phí: [Tuyên bố miễn trừ](DISCLAIMER.md) nói với người dùng rằng mọi lượt tải diễn ra trên itch.io.
- Không có gì lên site ngay lập tức: mọi đề xuất đều vào **hàng chờ duyệt**, nơi Maintainer duyệt hoặc từ chối, bằng tay hoặc qua quy tắc tự động (một đề xuất không có cờ cảnh báo mà không ai từ chối trong khoảng một ngày có thể được duyệt tự động). Link được duyệt sau đó được pipeline dữ liệu cào và xuất hiện trên site sau lần deploy kế tiếp.

Có cả một danh sách? Issue template **[Add Games (bulk list)]** nhận tối đa 15 link một lần, và một PR thêm URL itch.io vào `scripts/temp_link.json` cũng được (dùng PR template [Add Games]). Cả hai đều đi qua cùng quy trình duyệt: Maintainer kiểm tra từng link trước khi đưa vào hàng chờ, và việc merge một PR như vậy chính là sự phê duyệt. Vui lòng đừng sửa tay `data_game/`: các file đó do pipeline quản lý (xem [mục 7](#7-pull-request)).

#### 1b. Những cách khác để game được thêm vào

- Website đọc các RSS feed công khai của itch.io về game miễn phí mới và phổ biến mỗi 4 giờ (mỗi lượt một feed) và đưa những gì tìm được vào hàng chờ.
- Website cũng đọc các collection công khai trên itch.io mà Maintainer theo dõi và đưa thẳng game miễn phí mới của chúng vào hàng chờ ingest (game từng bị gỡ, hoặc có cờ cảnh báo, thì vào hàng chờ duyệt).

RSS feed vào cùng hàng chờ duyệt với trang Suggest. (Extension trình duyệt của Maintainer và Telegram bot cũ đã ngừng hoạt động; repo của chúng, [itch-f2p-extension](https://github.com/poli0981/itch-f2p-extension) và [telegram-scraper-bot](https://github.com/poli0981/telegram-scraper-bot), đã được lưu trữ (archive).)

### 2. Gỡ game hoặc sửa dữ liệu game

Đặc biệt với người làm game: nếu bạn muốn game của mình bị gỡ khỏi danh sách, hoặc muốn sửa dữ liệu của nó, lúc nào cũng được.

- Gửi email tới **takedown@poli0981.dev**, hoặc mở issue template **["Remove a game"](https://github.com/poli0981/free-games-itchio-list/issues/new?template=remove_game.yml)** (có cả mục dành cho khiếu nại bản quyền).
- Ghi rõ URL game, bạn là ai (người tạo / chủ sở hữu quyền, hoặc người được họ ủy quyền) và lý do.
- Maintainer sẽ gỡ bản ghi khỏi danh mục (ghi kèm lý do trên [trang game đã gỡ](https://freeitchgames.win/removed) công khai) và xóa các bản ảnh bìa thu nhỏ mà site lưu trữ; các bản trong cache sẽ tự hết hạn. Mục tiêu: trong vòng 7 ngày, yêu cầu pháp lý khẩn cấp thì sớm hơn.
- Lưu ý: đây là một repo git công khai, nên các phiên bản cũ vẫn còn trong lịch sử. Việc viết lại lịch sử công khai chỉ được làm trong trường hợp ngoại lệ vì bắt buộc về pháp lý.
- `safe_virus` / `nsfw` / ghi chú bị sai, hoặc lỗi dữ liệu khác không phải yêu cầu gỡ? Dùng issue template **[Report a problem]** (mục 3).

Chi tiết có trong [Điều khoản sử dụng](ToS.md) và [Tuyên bố miễn trừ](DISCLAIMER.md).

### 3. Báo sự cố (dữ liệu sai, có gì đó bị hỏng)

- Mở issue → template **[Report a problem]** ([link trực tiếp](https://github.com/poli0981/free-games-itchio-list/issues/new?template=bug_report.yml)).
- Dành cho **lỗi dữ liệu** (link chết, sai tên, thể loại, tag, ảnh bìa, cờ `nsfw` hoặc `safe_virus`…) và cho **những thứ bị hỏng** (một trang hay ứng dụng ngừng hoạt động, danh mục không còn cập nhật). Không dành cho ý tưởng: xem mục 4.
- Chi tiết + ảnh chụp màn hình + mức độ khẩn cấp.
- **Vấn đề bảo mật không dành cho tracker công khai.** Hãy báo cáo riêng tư: xem [SECURITY](SECURITY.md).
- **Rào cản trợ năng** (bàn phím, trình đọc màn hình, phóng to, tương phản, chuyển động…): dùng template **[Accessibility barrier]** ([link trực tiếp](https://github.com/poli0981/free-games-itchio-list/issues/new?template=accessibility.yml)), hoặc gửi email tới contact@poli0981.dev nếu bạn không muốn dùng GitHub. Điều gì xảy ra tiếp theo nằm trong [Trợ năng](ACCESSIBILITY.md#7-báo-cáo-rào-cản-trợ-năng).

### 4. Tính năng và cải tiến (đã đóng)

- Dự án đang ở chế độ bảo trì: **đề xuất tính năng, ý tưởng cải tiến và thay đổi code không còn được nhận**. Issue và pull request loại này sẽ bị đóng mà không review.
- Code dùng giấy phép MIT: bạn cứ thoải mái fork và tự làm phiên bản của mình ([README → Giấy phép](../../../README.vi.md#giấy-phép)).

### 5. Góp ý, câu hỏi, mọi thứ khác

- Dùng **[GitHub Discussions](https://github.com/poli0981/free-games-itchio-list/discussions)**, các server Discord hoặc email (xem "Muốn thảo luận thêm?" bên dưới). Chê hay khen đều được, sự tự ti của tôi chịu được.
- Tôi có đọc, nhưng chúng không biến thành tính năng mới (mục 4).

### 6. Thư viện phụ thuộc và vá bảo mật

- Việc cập nhật thư viện phụ thuộc do Dependabot và đợt rà soát hằng tuần của Maintainer lo: xin đừng gửi PR nâng phiên bản.
- Tìm thấy lỗ hổng? Hãy báo cáo riêng tư ([SECURITY](SECURITY.md)); Maintainer sẽ tự vá.

### 7. Pull request

- **Được nhận**: PR thêm URL itch.io vào `scripts/temp_link.json` (dùng PR template [Add Games]). Merge PR chính là sự chấp thuận của Maintainer.
- **Không được nhận**: mọi thứ khác (code, giao diện, tài liệu, refactor). Sửa hoặc gỡ dữ liệu của một game thì đi qua issue hoặc email (mục 2 và 3), vì pipeline quản lý `data_game/`.
- Các quy tắc dưới đây vẫn áp dụng cho mọi PR, kể cả PR của chính Maintainer.

**Quy tắc PR** (phần không thương lượng):

- **CI phải pass.** Python CI (ruff check + format, vulture, pytest, `validate.py`) và Webapp CI (kiểm tra phiên bản Tauri crate/npm, kiểm tra type sinh ra, lint, knip, test, build, `wrangler deploy --dry-run`) đều chạy trên PR. CI đỏ = không merge. SonarQube Cloud cũng phân tích mỗi PR (kèm test coverage) và báo quality gate qua check "SonarCloud Code Analysis", còn Qodana (JetBrains) phân tích code TypeScript / JavaScript, Python và Rust. Cả hai bỏ qua PR từ fork, vì fork không nhận được secret của repo.
- **PR được merge bằng squash** (một PR thành một commit trên `main`) **hoặc merge commit, không bao giờ fast-forward**, nên hãy đặt tiêu đề PR như một commit message tốt (repo dùng kiểu `type(scope): tóm tắt`, ví dụ `fix(web): …`).
- **Giấy phép theo nguyên tắc inbound = outbound.** Khi mở PR, bạn đồng ý rằng đóng góp của mình được cấp phép theo cùng giấy phép với phần mà nó thay đổi: **MIT** cho mã nguồn, **CC BY 4.0** cho dữ liệu danh mục và tài liệu (xem [README → Giấy phép](../../../README.vi.md#giấy-phép)). Chỉ gửi những gì bạn có quyền gửi.
- **Không bao giờ commit secret**: không token, API key, file `.dev.vars` / `.env`, private key (chẳng hạn khóa của GitHub App) hay keystore dùng để ký. Nếu lỡ push một cái, hãy báo riêng (security@poli0981.dev) và thay mới (rotate) nó; chỉ xóa commit là không đủ.
- **Không sửa tay `data_game/`.** Thay đổi dữ liệu phải đi qua pipeline (một patch + `apply_patch.py`, có chạy `validate.py`), để các tiến trình ghi đồng thời không đè lên nhau.
- Không commit output build hay file sinh ra: `webapp/dist/`, `webapp/.wrangler/`, `webapp/src-tauri/target/`, `webapp/src-tauri/gen/`. (`webapp/src-tauri/Cargo.lock` **có** được commit; hãy cập nhật nó khi bạn sửa `Cargo.toml`.)
- Thêm dependency npm? Thêm luôn vào danh sách `THIRD_PARTY` trong `webapp/src/lib/about.ts` để trang About ghi công.
- Link ngoài mới trong app? Dùng `<ExtLink href="…">` từ `webapp/src/components/ext-link.tsx`, đừng dùng `<a href="…" target="_blank">` thuần: anchor thuần chạy được trên web nhưng im lặng hỏng trong các app Tauri (và ExtLink báo cho trình đọc màn hình rằng link mở thẻ mới).
- **Trợ năng**: thay đổi giao diện phải vẫn dùng được chỉ với bàn phím và với trình đọc màn hình, và giữ tỉ lệ tương phản (`npm test` kiểm tra màu). Danh sách kiểm tra nằm trong [Trợ năng → Dành cho người đóng góp](ACCESSIBILITY.md#8-dành-cho-người-đóng-góp) và trong pull request template.

### 8. Thiết lập môi trường dev (tóm tắt)

Dành cho các bản fork, và cho việc bảo trì của chính Maintainer.

Hướng dẫn đầy đủ (Worker, D1 cục bộ, secret, Tauri, Android) nằm trong **[`docs/dev_env.md`](../../dev_env.md)** ([VI](dev_env.md)); ghi chú build Tauri/Android nằm trong [`webapp/TAURI.md`](../../../webapp/TAURI.md). Bản ngắn gọn:

**Pipeline Python** (Python 3.15, xem `.github/python-version`):

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

**Webapp + Worker** (Node.js 26+, CI dùng phiên bản trong `webapp/.node-version`):

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
- **Đồng ý**: mọi issue template đều có một checkbox bắt buộc. Lạc đề/spam/vi phạm chính sách, và mọi thứ nằm ngoài phạm vi bảo trì ở trên, sẽ bị bỏ qua/đóng không drama :D
- **Cư xử đẹp**: mọi thứ ở đây đều theo [Quy tắc ứng xử](CODE_OF_CONDUCT.md).

## Muốn thảo luận thêm? (Nếu template không đủ)

Issue là tốt nhất để theo dõi vấn đề dữ liệu, nhưng nếu bạn muốn tán gẫu, hỏi gì đó, hoặc kể chuyện noob, giờ đã có [GitHub Discussions](https://github.com/poli0981/free-games-itchio-list/discussions) và server thật (introvert god-mode bị xuyên thủng):

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
