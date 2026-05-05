# Chính sách bảo mật

Cập nhật lần cuối: 2026-05-05

> **Lưu ý**: Bản dịch tiếng Việt mang tính tham khảo. Bản tiếng Anh tại [`SECURITY.md`](../../../SECURITY.md) là bản chính thức.

Đây chủ yếu là một repo sở thích — danh sách được duy trì các game itch.io miễn phí, kèm script Python scrape trên GitHub Actions, cộng với webapp React/TypeScript (và Tauri desktop wrapper) để duyệt và sửa catalog. Vẫn không backend, không database, không telemetry. Thứ duy nhất liên quan tới bảo mật là Personal Access Token GitHub mà webapp có thể giữ cho thao tác ghi — xem bên dưới.

## Phiên bản được hỗ trợ

Mọi thứ ở đây chỉ là "commit mới nhất". Tôi thất nghiệp với quá nhiều thời gian, nên fix (nếu có) đến khi nào tôi cảm thấy thích — hoặc khi nào AI buddy nhắc.

## Báo cáo lỗ hổng

Tìm thấy thứ gì đáng sợ? Như script có thể spam itch.io theo lý thuyết hoặc lộ... gì đó? Bạn là huyền thoại.

Vui lòng **đừng** mở issue công khai. Thay vào đó:

- Mở **issue riêng tư** trên GitHub (nếu repo cho phép — tôi introvert, có thể không có email công khai).
- Hoặc mở issue thường và prefix "[Security]" — tôi sẽ chuyển nó thành riêng tư nếu cần.
- Mô tả vấn đề rõ ràng (các bước reproduce, tác động tiềm tàng).
- Tôi sẽ review (với hỗ trợ AI, vì kiến thức bảo mật của tôi ở mức "easy mode").

Mong đợi:

- Tôi sẽ acknowledge trong vài ngày (lịch thất nghiệp, không phải 24/7).
- Nếu hợp lệ (cái "nếu" lớn :v), tôi sẽ fix và credit bạn trong changelog/acknowledgements.
- Nếu không hợp lệ — vẫn cảm ơn vì quan tâm tới code tầm thường của tôi.

"Lỗ hổng" thường gặp bạn có thể tìm thấy:

- Scraping vỡ nếu itch.io đổi HTML (không phải bảo mật, chỉ là cuộc đời).
- Rate limiting? Tôi đã `sleep(2)` — hãy tử tế với server.
- Dependencies? requests + bs4 ổn, nhưng cập nhật nếu cần.
- Webapp deps (npm/Rust)? Dependabot/security alert trên repo lo việc đó — bump landing qua PR.

## Xử lý PAT của Webapp (đọc nếu bạn dùng webapp có khả năng ghi)

Các flow chỉ đọc (Dashboard, Games table, Charts, Deleted) **không** cần auth và dùng public CDN tại `raw.githubusercontent.com`. Các flow ghi (sửa annotation, bulk edit/delete, dispatch workflow scraper) cần GitHub Personal Access Token, mà webapp lưu như sau:

- **Dùng PAT fine-grained** giới hạn về **chỉ** `poli0981/free-games-itchio-list` với scope tối thiểu bạn cần:
  - `contents: write` — bắt buộc cho sửa / xóa / queue URL.
  - `actions: write` — bắt buộc cho nút dispatch trang Add / Workflows.
  - `metadata: read` ngầm định.
- **Tại thiết bị** PAT được mã hóa AES-GCM 256-bit; khóa được dẫn xuất từ passphrase của bạn qua PBKDF2-SHA256 (100k vòng) với salt mới cho mỗi token. Blob mã hóa nằm trong `localStorage` ở `webapp.pat.encrypted`.
- **Trong bộ nhớ** PAT đã giải mã chỉ tồn tại trong store Zustand của React app giữa lúc unlock và Lock tường minh (hoặc đóng tab).
- **Khóa hoặc xóa bất kỳ lúc nào** từ Settings. Xóa cũng wipe entry localStorage.
- **Đừng dán classic PAT** với scope full repo trừ khi bạn thực sự muốn. Token fine-grained giới hạn tới một repo và một bộ thao tác.
- **Đừng share `localStorage`** giữa các user (ví dụ: máy kiosk dùng chung). Mã hóa bảo vệ PAT khỏi người đọc filesystem casual, không khỏi ai biết passphrase.

Nếu bạn tìm cách bypass mã hóa, exfiltrate PAT từ bộ nhớ qua khe hở CSP, hoặc lừa webapp gửi ghi vào sai repo — vui lòng báo cáo riêng tư như trên.

## Báo cáo lỗ hổng dependency Web/desktop

Cho lỗ hổng crate Tauri/Rust hoặc CVE npm package ảnh hưởng webapp, mở issue `[Security]` thường là OK; nếu nó actively exploitable trên site Pages đã deploy, vui lòng prefix `[CRITICAL]` để tôi có thể yank deploy đến khi fix xong.

Không có bounty (tài khoản < $50), nhưng cảm ơn vĩnh viễn và shoutout.

Repo này MIT, rủi ro thấp. Hãy an toàn — đặc biệt khi tải các game miễn phí ngẫu nhiên.

Cảm ơn vì đã báo cáo có trách nhiệm. Bạn đã giỏi bảo mật hơn tôi rồi. 🚀
