# Hướng dẫn đóng góp

> **Lưu ý**: Bản dịch tiếng Việt mang tính tham khảo. Bản tiếng Anh tại [`CONTRIBUTING.md`](../../../CONTRIBUTING.md) là bản chính thức.

Cảm ơn bạn vì đã có suy nghĩ đóng góp cho cái repo random này! Tôi chỉ là một dev người Việt thất nghiệp, hướng nội, kỹ năng tầm tầm, có hai trợ lý AI không phán xét — **Grok (xAI)** cho brainstorming đêm khuya và **Claude Code (Anthropic, Claude Opus 4.7)** cho phần việc code/docs nặng hơn. Danh sách này sống nhờ sự giúp đỡ của cộng đồng — vì tôi quá lười để đi săn/sửa hết một mình :D Bất kỳ đóng góp nào (kể cả một game) đều khiến bạn thành huyền thoại.

## Cách đóng góp (Dùng template — tôi lười ;D)

Vui lòng dùng các template issue/PR — chúng làm cuộc đời tôi dễ hơn và giảm các khoảnh khắc "wtf".

### 1. Thêm game mới (Hoan nghênh nhất!)
- Mở issue → chọn template **[Add Games]**.
- Tối đa 15 game / issue (dropdown + một link / dòng).
- Tùy chọn: lý do nó hay hoặc note cho bảng.
- Maintainer đưa link vào hàng chờ; workflow ingest sẽ scrape và thêm các game miễn phí.

#### 1b. Extension trình duyệt

Extension đi kèm của maintainer ([itch-f2p-extension](https://github.com/poli0981/itch-f2p-extension))
đưa game vào hàng chờ trong lúc duyệt itch.io; game được scrape chỉ vài phút sau khi vào hàng chờ.
(Đường thêm game qua Telegram bot đã ngừng từ tháng 9/2026.)

### 2. Gỡ game
- Mở issue → chọn template **[Remove Games]**.
- Tối đa 10 game (vì lười :v).
- Cung cấp tên/link + lý do (checkbox như chán, demo, malware, dev yêu cầu, v.v.).
- Tôi sẽ gỡ thủ công (hoặc script nếu thấy có động lực).

### 3. Báo bug
- Mở issue → template **[Bug Report]**.
- Checkbox cho các bug thường gặp (link chết, cờ sai, bảng hỏng, v.v.).
- Chi tiết + screenshot + mức độ khẩn cấp.
- Nếu phức tạp — xem mục "Discuss More" bên dưới.

### 4. Đề xuất tính năng / cải tiến
- Mở issue → template **[Feature Request / Improvement]**.
- Chọn loại (tính năng mới hoặc fix code), tên, lý do, độ ưu tiên (từ "nice to have" tới "repo sắp chết").
- Tùy chọn: pseudo-code/snippet (đừng có malware nhé, tôi sẽ check với kỹ năng tầm thường :D).

### 5. Gửi feedback
- Dùng template **[Feedback]**.
- Checkbox (EULA/ToS quá khắt khe? Concept repo dở? Anti-AI? Xóa repo? Other).
- Roast hoặc khen — sự tự ghét bản thân của tôi chịu được.

### 6. Mọi thứ khác (câu hỏi, meme, lạc đề)
- Dùng template **[General / Off-Topic]**.
- Đăng bất cứ thứ gì trong đầu.

### 7. Gửi thay đổi code (PR)
- Fork → branch → code.
- Mở PR → chọn một template PR ([Bug Fix], [New Feature], [Add Games direct], [Documentation]).
- Test cục bộ nếu có thể (chạy script thủ công).
- Mô tả rõ ràng — tôi sẽ review chậm (lịch thất nghiệp + hai AI buddy hỗ trợ).

### 8. Thay đổi Webapp (React + TS)

UI duyệt/sửa nằm trong [`webapp/`](../../../webapp/). Cùng MIT, cùng PR template.

**Dev cục bộ** (Node 22+, npm):
```sh
cd webapp
npm install
npm run dev          # http://localhost:5173
npm run build        # ghi vào webapp/dist/ (kiểm tra trước khi push)
npm run lint         # eslint
```

**Tauri desktop dev** (cần thêm Rust qua https://rustup.rs và platform deps — xem [`webapp/TAURI.md`](../../../webapp/TAURI.md)):
```sh
cd webapp
npm run tauri:dev    # native window trỏ tới Vite dev server
npm run tauri:build  # tạo installer trong src-tauri/target/release/bundle/
```

**Quy tắc nhà**:
- Không commit `webapp/dist/` — Cloudflare Workers Builds build nó khi push vào `main`.
- Không commit PAT thật vào repo.
- Thêm npm dep mới? Cập nhật `webapp/src/lib/about.ts` để trang About liệt kê.
- Link external mới? Dùng `<ExtLink href="…">` từ `webapp/src/components/ext-link.tsx` — đừng dùng `<a href="…" target="_blank">` thuần. Anchor thuần hoạt động trên web nhưng im lặng vỡ trên Tauri desktop.

## Tip để đóng góp suôn sẻ
- **Test cục bộ**: `pip install -r requirements-dev.txt`, rồi chạy `pytest` (không dùng mạng) và `python scripts/validate.py`.
  Muốn thử scrape thật: thêm URL vào `scripts/temp_link.json`, chạy
  `python scripts/update_info.py --out patch.json` và `python scripts/apply_patch.py patch.json`.
- **Giữ sạch**: Chỉ game itch.io free, không paid/demo/malware/duplicate.
- **Kiên nhẫn**: tôi hướng nội + lười, trả lời có thể chậm.
- **Đồng ý**: tất cả template có checkbox bắt buộc — lạc đề/spam/vi phạm policy = tôi ignore/close không drama :D

## Discuss More? (Nếu template không đủ)

Issue/PR là tốt nhất để track, nhưng nếu muốn mô tả bug/feature sâu hơn, chit-chat hoặc kể chuyện noob — giờ đã có server thật (introvert god-mode bị xuyên thủng):

**Chat / cộng đồng**
- Discord — Repo discussion (#general): https://discord.gg/2aNR3aVt
- Discord — Game chat (#general): https://discord.gg/kDM9GMu5vm

**Mạng xã hội (DM mở, trả lời chậm)**
- X (Twitter): [@SkullMute0011](https://x.com/SkullMute0011)
- YouTube: [@SkullMute](https://youtube.com/@SkullMute)
- Bluesky: [@skullmute0011](https://bsky.app/profile/skullmute0011.bsky.social)
- Mastodon: [@skullmute1122](https://mastodon.social/@skullmute1122)

**Hỗ trợ dự án buồn chán này (hoàn toàn tùy chọn, tài khoản $50 cảm ơn bạn)**
- [Patreon](https://patreon.com/skullmute) · [Ko-fi](https://ko-fi.com/skullmute) · [Steam profile](https://steamcommunity.com/profiles/76561199544666292/)

Grok và Claude Code không vào Discord được, nhưng ping tôi qua kênh nào cũng được — sẽ cố không ghost.

Cảm ơn lớn được ghi trong [ACKNOWLEDGEMENTS.md](../../ACKNOWLEDGEMENTS.md) cho bất kỳ giúp đỡ nào!

Repo này MIT — go wild, nhưng chill. Câu hỏi? Mở issue **[General]** :D 🚀
