# Chính sách bảo mật (Privacy Policy)

Cập nhật lần cuối: 2026-05-10

> **Lưu ý**: Đây là bản dịch tiếng Việt mang tính tham khảo cho cộng đồng. **Bản tiếng Anh tại [`docs/PrivacyPolicy.md`](../../PrivacyPolicy.md) là bản chính thức** và sẽ được dùng để giải thích trong trường hợp có khác biệt giữa hai phiên bản.

Chính sách Bảo mật này mô tả cách Repository, Webapp và Desktop App xử lý dữ liệu của Bạn. Bản ngắn: Người duy trì không thu thập gì trên bất kỳ server nào do mình kiểm soát. Mọi thứ được lưu lại đều được lưu cục bộ trên thiết bị của Bạn.

> **Tóm tắt**: Không backend, không analytics, không cookie, không tracking, không telemetry. Webapp giữ vài mục trong `localStorage` (theme, trạng thái sidebar, PAT đã mã hóa tùy chọn) và một cache IndexedDB của catalog công khai. Desktop App fetch trực tiếp tới itch.io và GitHub để vượt CORS. Đó là toàn bộ câu chuyện dữ liệu.

## 1. Định nghĩa

Các thuật ngữ được định nghĩa trong [EULA §1](EULA.md#1-định-nghĩa) cũng áp dụng tại đây.

## 2. Thu thập dữ liệu phía Người duy trì

**Người duy trì thu thập, lưu trữ và xử lý dữ liệu cá nhân ở mức KHÔNG trên bất kỳ server nào do mình kiểm soát.** Không có backend, không có database, không có dịch vụ analytics, không có endpoint báo lỗi, không có telemetry, không có quảng cáo, không có fingerprinting.

Repository chạy hoàn toàn trên:

- **GitHub** (host mã nguồn, Actions, raw file CDN, Pages cho Webapp).
- **Thiết bị của Bạn** (Webapp trong trình duyệt, hoặc Desktop App trong webview Tauri 2).
- **itch.io** (trang game, được fetch theo yêu cầu bởi scraper hoặc tính năng preview của Desktop App).

Người duy trì không có hạ tầng nào có thể thu thập dữ liệu của Bạn ngay cả khi muốn.

## 3. GitHub

Repository này, deployment Webapp (GitHub Pages) và artifact phát hành Desktop App được host trên GitHub. GitHub có thể log dữ liệu HTTP request tiêu chuẩn (địa chỉ IP, user agent, referrer) theo chính sách của họ. Người duy trì không có quyền truy cập các log đó ngoài insight cấp repository của GitHub (số clone / view tổng hợp).

Chính sách Bảo mật của GitHub: <https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement>

Khi Bạn đóng góp (mở issue, comment, fork, gửi PR), Bạn xuất bản thông tin đó trên GitHub dưới tài khoản của mình. Người duy trì chỉ thấy phần GitHub công khai.

## 4. itch.io

Tất cả link game trong Catalog trỏ trực tiếp tới trang itch.io. Click vào link sẽ đưa Bạn tới itch.io; những gì xảy ra ở đó được điều chỉnh bởi điều khoản và chính sách của itch.io:

- Privacy Policy của itch.io: <https://itch.io/docs/legal/privacy-policy>
- Terms of Service của itch.io: <https://itch.io/docs/legal/terms>

GitHub Action `update.yml` của Repository cũng thực hiện request server-to-server tới itch.io để scrape metadata trang; những request đó đến từ dải IP của GitHub, không phải từ thiết bị của Bạn.

## 5. Webapp lưu gì trong trình duyệt của Bạn

Webapp lưu các mục sau cục bộ và **không bao giờ** gửi chúng tới bất kỳ server nào do Người duy trì kiểm soát.

| Lưu trữ | Khóa | Nội dung | Khi nào ghi |
|---|---|---|---|
| `localStorage` | `webapp.pat.encrypted` | PAT GitHub của Bạn, mã hóa AES-GCM 256-bit. Khóa mã hóa được dẫn xuất từ passphrase qua PBKDF2-SHA256 (100.000 vòng) với salt ngẫu nhiên cho mỗi token. PAT plaintext **không bao giờ** được lưu xuống đĩa. | Khi Bạn bật quyền ghi trong Settings. |
| `localStorage` | `webapp.theme` | Một trong `'light'`, `'dark'`, `'system'`. | Khi Bạn chuyển theme. |
| `localStorage` | `webapp.prefs` | Tùy chỉnh UI (sidebar collapsed, mật độ, ngôn ngữ, cài đặt thông báo, ghi đè tác giả commit tùy chọn) và phiên bản điều khoản pháp lý Bạn đã chấp nhận (`acceptedLegalVersion`). | Khi Bạn thay đổi tùy chỉnh UI hoặc chấp nhận điều khoản pháp lý. |
| `IndexedDB` (qua `idb-keyval`) | Khóa cache TanStack Query | Bản sao cache của catalog JSON công khai để tải nhanh và đọc offline có giới hạn. | Tự động, sau lần fetch đầu tiên. |

Bạn có thể xóa toàn bộ những gì ở trên bất kỳ lúc nào bằng cách:

- Click **Settings → Remove saved PAT** (chỉ xóa entry PAT).
- Dùng "Clear site data" / "Clear cookies and storage" của trình duyệt cho `poli0981.github.io` (xóa hết).
- Gỡ Desktop App và xóa thư mục profile WebView2 / WebKit (chỉ Desktop; vị trí khác nhau theo OS).

## 6. Xử lý PAT — chi tiết

Tính năng ghi tùy chọn của Webapp (sửa annotation, dispatch workflow scraper, bulk delete) yêu cầu PAT fine-grained GitHub. Vòng đời PAT hoàn toàn ở phía client:

1. **Tạo** — Bạn tạo PAT fine-grained trên github.com, giới hạn về `poli0981/free-games-itchio-list`, với `Contents: Read & write` và `Actions: Read & write`. Người duy trì không bao giờ thấy bước này.
2. **Mã hóa** — Bạn dán PAT vào Settings + một passphrase. Webapp dẫn xuất khóa AES-GCM từ passphrase qua PBKDF2-SHA256 (100k vòng, salt ngẫu nhiên 16-byte). PAT được mã hóa; ciphertext + salt + IV được lưu vào `localStorage` ở khóa `webapp.pat.encrypted`. PAT plaintext và passphrase không bao giờ được ghi vào bất kỳ storage nào.
3. **Mở khóa** — Ở session sau, Bạn nhập passphrase. Webapp dẫn xuất lại khóa và giải mã PAT vào store Zustand trong bộ nhớ. PAT đã giải mã chỉ tồn tại trong bộ nhớ JavaScript.
4. **Sử dụng** — Lệnh gọi Octokit tới `api.github.com` bao gồm PAT dưới dạng `Authorization: Bearer <pat>` qua HTTPS. PAT chỉ được gửi tới `api.github.com` và không bao giờ tới host khác.
5. **Khóa** — Click Lock (hoặc đóng tab) loại bỏ PAT trong bộ nhớ. Blob mã hóa vẫn còn trong `localStorage` cho lần mở khóa tiếp theo.
6. **Xóa** — Click Remove saved PAT xóa entry `webapp.pat.encrypted` khỏi `localStorage`.

Nếu Bạn nghi ngờ PAT bị lộ:

- Khóa hoặc xóa nó ngay lập tức.
- Thu hồi nó trên github.com (Settings → Developer settings → Personal access tokens → Fine-grained tokens).
- Tạo PAT mới với passphrase mới.

Xem thêm: [SECURITY.md](SECURITY.md).

## 7. Network request

Khi chạy, Webapp và Desktop App thực hiện request tới các endpoint sau — và chỉ những endpoint này:

| Endpoint | Mục đích | Auth |
|---|---|---|
| `raw.githubusercontent.com/poli0981/free-games-itchio-list/main/data_game/*.json` | Đọc dữ liệu catalog công khai. | Không. |
| `api.github.com/repos/poli0981/free-games-itchio-list/...` | Thao tác ghi: sửa, xóa, dispatch workflow, list run. | PAT (chỉ khi đã mở khóa). |
| `*.itch.io/*`, `img.itch.zone/*` | (Chỉ Desktop App) Fetch itch.io trực tiếp cho preview game trong app, vượt CORS trình duyệt. | Không. |

Không có CDN bên thứ ba, không endpoint analytics, không telemetry collector, không font CDN. Tailwind, Radix, lucide-react, v.v. đều được bundle ở build time.

## 8. Cookie

Webapp và Desktop App **không đặt bất kỳ cookie nào.** GitHub Pages có thể phát hành cookie như một phần của hành vi CDN; những cookie đó là của GitHub, không phải của Người duy trì.

## 9. Quyền riêng tư của trẻ em

Repository lập chỉ mục các game host trên itch.io, bao gồm cả nội dung người lớn. Cờ `nsfw` là best-effort (xem [DISCLAIMER §2](DISCLAIMER.md#2-không-bảo-đảm-về-các-game)). Webapp không gating truy cập theo tuổi. Nếu Bạn dưới tuổi thành niên ở khu vực của mình, vui lòng sử dụng Repository dưới sự giám sát của cha mẹ hoặc người giám hộ và tôn trọng age-gating của itch.io ở những nơi áp dụng.

Người duy trì không cố ý thu thập dữ liệu cá nhân từ trẻ em. (Người duy trì không thu thập dữ liệu cá nhân từ bất kỳ ai — xem §2.)

## 10. Quyền của Bạn

Vì Người duy trì không nắm dữ liệu cá nhân nào, các yêu cầu theo GDPR, CCPA, Nghị định 13/2023/NĐ-CP của Việt Nam, hoặc các chế định tương tự nhằm vào Người duy trì sẽ không có gì để thực hiện. Đối với dữ liệu trên thiết bị của Bạn:

- **Quyền truy cập**: mở DevTools trình duyệt → Application → Storage → Local Storage / IndexedDB.
- **Quyền xóa**: clear site data như mô tả ở §5.
- **Quyền chuyển đổi**: export `localStorage` qua DevTools (là JSON thuần; PAT đã mã hóa).

Đối với dữ liệu mà GitHub hoặc itch.io nắm về tương tác của Bạn với nền tảng của họ, hãy liên hệ trực tiếp các nhà cung cấp đó qua đầu mối liên hệ về quyền riêng tư trong chính sách của họ.

## 11. Dịch vụ bên thứ ba

| Dịch vụ | Dùng cho | Chính sách |
|---|---|---|
| GitHub | Repo, CI, Pages, Releases, API | <https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement> |
| itch.io | Trang game, nguồn scrape | <https://itch.io/docs/legal/privacy-policy> |

Webapp **không** tích hợp bất kỳ nhà cung cấp analytics, mạng quảng cáo, dịch vụ báo lỗi (không Sentry, không Datadog), SDK mạng xã hội hay font CDN nào.

## 12. Thay đổi Chính sách này

Người duy trì có thể cập nhật Chính sách này. Ngày `Cập nhật lần cuối` ở đầu phản ánh thay đổi mới nhất. Các thay đổi trọng yếu sẽ được ghi thêm trong [CHANGELOG.md](../../../CHANGELOG.md). Việc tiếp tục sử dụng sau khi thay đổi đồng nghĩa với chấp nhận.

## 13. Liên hệ

Cho câu hỏi về Chính sách này:

- Mở issue `[General]` hoặc `[Feedback]`.
- DM qua bất kỳ kênh nào liệt kê trên [trang About](https://poli0981.github.io/free-games-itchio-list/app/#/about).

## 14. Lời cuối

Không tracking, không analytics, không telemetry, không spying. Người duy trì quá lười và quá thất nghiệp để xây pipeline dữ liệu kể cả khi muốn. Cứ duyệt thoải mái.

## 15. Telegram bot — đường đóng góp tùy chọn

[`CONTRIBUTING.md`](CONTRIBUTING.md) mô tả một flow tùy chọn để gửi game qua
[@my_skull_bot](https://t.me/my_skull_bot). Flow này bao gồm việc tự nguyện
chia sẻ Telegram numeric ID với Người duy trì (operator: poli0981). Mục
này giải thích cách ID đó được xử lý.

| Mục | Lưu ở đâu | Thời gian sống | Đồng bộ ngoài thiết bị | Trong repo này |
|---|---|---|---|---|
| Telegram numeric ID của Bạn | Máy cục bộ của operator, trong Docker volume hoặc file cục bộ dùng cho whitelist của bot | Cho tới khi Bạn yêu cầu gỡ, hoặc operator rotate whitelist | Không | **Không** |
| Tin nhắn Telegram Bạn gửi cho bot | Server Telegram (theo chính sách Telegram) + bộ nhớ tạm của process bot trong khi parse | Theo quy định lưu trữ của Telegram; bot không persist ngoài request đang xử lý | Không (bot không log message body xuống đĩa) | Không |
| URL itch.io Bạn gửi qua bot | File [`scripts/temp_link.json`](../../../scripts/temp_link.json) trong repo, sau đó merge hàng ngày vào [`data_game/*.json`](../../../data_game/) | Vĩnh viễn (Git history); trở thành catalog công khai | Có — công khai qua GitHub | **Có (chỉ URL, không Telegram metadata)** |
| Workflow run ID + commit message của batch bot-ingest | GitHub Actions log (theo retention của GitHub) và Git history (commit `bot-ingest: run NNN`) | Retention mặc định GitHub (90 ngày cho log); Git history vĩnh viễn | Có — GitHub | Có (chỉ commit message; không Telegram ID) |

**Gỡ**: DM Người duy trì "remove me from whitelist". Lần khởi động bot kế
tiếp sẽ drop ID của Bạn; các request đã được chấp nhận khi Bạn còn trong
whitelist không bị revert ngược (URL Bạn đã gửi vẫn nằm trong catalog với
tư cách dữ liệu công khai, giống y URL gửi qua GitHub Issue).

**Mã nguồn bot + ghi chú vận hành**:
[poli0981/telegram-scraper-bot](https://github.com/poli0981/telegram-scraper-bot)
([USER_GUIDE.md](https://github.com/poli0981/telegram-scraper-bot/blob/main/docs/USER_GUIDE.md)).

Cơ sở pháp lý cho việc xử lý dữ liệu trong flow này là **sự đồng ý rõ ràng
của Bạn** theo Nghị định 13/2023/NĐ-CP của Việt Nam và các quy định tương
đương của GDPR / CCPA. Bạn có thể rút lại sự đồng ý bất kỳ lúc nào theo
bước gỡ ở trên; việc rút lại không ảnh hưởng tới tính hợp pháp của xử lý
trước thời điểm rút lại.

Built with boredom and zero data harvesting. 🚀
