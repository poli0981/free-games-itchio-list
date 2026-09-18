# Chính sách bảo mật (Security Policy)

Cập nhật lần cuối: 2026-09-18

Áp dụng từ: khi phát hành phiên bản 4.0.0.

> Bản dịch từ bản tiếng Anh cập nhật ngày 2026-09-18 (English source revision 2026-09-18). Nếu có khác biệt, bản tiếng Anh được ưu tiên. Bản gốc: [`SECURITY.md`](../../../SECURITY.md).

Chào bạn — đây là một dự án sở thích do một người vận hành, poli0981 (SkullMute), dưới đây gọi là "Người duy trì": một danh mục được tuyển chọn gồm các game itch.io miễn phí. Từ v4, dự án gồm một **website chỉ đọc** tại https://freeitchgames.win (chạy trên một Cloudflare Worker), một **pipeline dữ liệu Python** trên GitHub Actions, và các **ứng dụng desktop và Android chỉ đọc**. Không có tài khoản công khai, không đăng nhập và không thanh toán; lần đăng nhập duy nhất là trang quản trị riêng của Người duy trì, được bảo vệ bởi Cloudflare Access. Bề mặt tấn công nhỏ — nhưng nếu bạn tìm thấy lỗ hổng, Người duy trì thực sự muốn được biết.

## 1. Báo cáo lỗ hổng

Vui lòng **đừng** báo cáo lỗ hổng qua issue, discussion, pull request công khai hay trên Discord. Thay vào đó, hãy báo cáo riêng tư:

- **Báo cáo lỗ hổng riêng tư trên GitHub** (private vulnerability reporting): tab **Security** của repository → **Report a vulnerability** ([liên kết trực tiếp](https://github.com/poli0981/free-games-itchio-list/security/advisories/new)), hoặc
- email tới **security@freeitchgames.win**.

Một báo cáo tốt nên có:

- thành phần bị ảnh hưởng (URL hoặc endpoint, workflow, hoặc phiên bản ứng dụng và nền tảng);
- các bước tái hiện, hoặc một proof of concept chạy được;
- tác động mà bạn cho là lỗ hổng có thể gây ra;
- bạn có muốn được ghi công không, và ghi công theo cách nào.

## 2. Phạm vi

**Trong phạm vi**

- Website https://freeitchgames.win và Cloudflare Worker của nó, bao gồm proxy ảnh (`/img`), API Suggest (`/api/suggest`), API ingest mà tiện ích trình duyệt của Người duy trì sử dụng (`/api/ingest`), cùng ứng dụng và API quản trị (`/admin`, `/api/admin`).
- Pipeline dữ liệu (`scripts/`) và các workflow GitHub Actions (`.github/workflows/`).
- Các ứng dụng desktop và file APK Android được phát hành trên [GitHub Releases](https://github.com/poli0981/free-games-itchio-list/releases).
- Dữ liệu được công bố (`data_game/`, `scripts/deleted_games.json` và https://freeitchgames.win/data) — ví dụ: một cách đưa nội dung vào catalog mà không cần Người duy trì phê duyệt.

**Ngoài phạm vi**

- Bản thân itch.io — hãy báo cho itch.io.
- Lỗi nền tảng của Cloudflare hoặc GitHub — hãy báo cho họ qua chương trình riêng của họ.
- Các game được liên kết trong catalog. Một game chứa mã độc không phải là lỗ hổng của dự án này, nhưng vẫn xin hãy báo cho Người duy trì qua **takedown@freeitchgames.win** để game đó được gắn cờ hoặc gỡ bỏ.
- Tấn công từ chối dịch vụ theo lưu lượng (DoS/DDoS) và kiểm thử tải.
- Báo cáo từ công cụ quét tự động mà không có proof of concept chạy được.

Tiện ích trình duyệt (poli0981/itch-f2p-extension) nằm trong repository riêng; lỗi của chính tiện ích xin báo ở đó. Lỗi trong API ingest mà tiện ích kết nối tới thì thuộc phạm vi ở đây.

## 3. Phiên bản được hỗ trợ

| Thành phần | Được hỗ trợ |
|---|---|
| Website đang hoạt động (https://freeitchgames.win) | Có |
| Bản phát hành mới nhất (4.x) của ứng dụng desktop và Android | Có |
| Các bản phát hành cũ hơn (gồm toàn bộ 3.x trở về trước) | Không — vui lòng cập nhật |

Bản sửa cho website có hiệu lực ngay khi được deploy. Các ứng dụng không tự cập nhật: bản sửa được phát hành trong một bản release mới, bạn tải về từ GitHub Releases.

## 4. Những gì bạn có thể mong đợi

- **Xác nhận đã nhận báo cáo**: mục tiêu trong vòng **7 ngày**. Đây là dự án sở thích do một người làm, nên đó là mục tiêu chứ không phải cam kết, và thường sẽ sớm hơn nhiều.
- Người duy trì sẽ kiểm tra xem vấn đề có hợp lệ không, xử lý bản sửa, và cập nhật tình hình cho bạn.
- Vui lòng giữ kín chi tiết cho đến khi bản sửa được phát hành, hoặc đến ngày công bố mà bạn và Người duy trì đã thống nhất.
- **Ghi công**: nếu bạn muốn, bạn sẽ được ghi công trong ghi chú phát hành (release notes).
- Không có bug bounty (tài khoản ngân hàng < $50), chỉ có ghi công và lời cảm ơn mãi mãi.

## 5. Bảo vệ cho nghiên cứu thiện chí (safe harbor)

Nếu bạn nghiên cứu bảo mật một cách thiện chí và tuân thủ chính sách này, Người duy trì sẽ coi hoạt động nghiên cứu đó là được phép, sẽ không khởi kiện hay hỗ trợ hành động pháp lý nào chống lại bạn vì nó, và sẽ không coi đó là vi phạm các quy định về truy cập trái phép hoặc sử dụng tự động trong [Điều khoản sử dụng](ToS.md). Để được bảo vệ theo mục này:

- **Tránh xâm phạm quyền riêng tư.** Không truy cập, thay đổi, lưu giữ hay chia sẻ dữ liệu không thuộc về bạn vượt quá mức tối thiểu cần để chứng minh lỗ hổng (ví dụ: ghi chú gửi qua trang Suggest, hàng đợi duyệt, hoặc nhật ký kiểm toán của trang quản trị). Nếu bạn gặp dữ liệu cá nhân, hãy dừng lại và báo cáo.
- **Tránh làm gián đoạn dịch vụ.** Không tấn công từ chối dịch vụ, không quét hay scrape tự động với khối lượng lớn, không spam form Suggest, và không cố làm cạn giới hạn tốc độ (rate limit).
- **Không thay đổi gì cả.** Không sửa hay xóa dữ liệu catalog, hàng đợi duyệt hoặc repository, và không duyệt hay từ chối mục nào, không push commit hay kích hoạt bản phát hành, kể cả khi bạn tìm được cách làm vậy.
- **Không dùng social engineering, phishing hay tấn công vật lý** nhắm vào Người duy trì hoặc bất kỳ ai khác, và không tấn công tài khoản Cloudflare, GitHub hay itch.io của bất kỳ ai.
- **Cho Người duy trì thời gian hợp lý** để sửa lỗi trước khi bạn công bố công khai.

Sự bảo vệ này chỉ bao gồm các khiếu nại của chính Người duy trì. Nó không thể cho phép bạn kiểm thử Cloudflare, GitHub hay itch.io; chính sách riêng của các bên đó sẽ được áp dụng. Nếu không chắc một việc có được phép không, hãy hỏi trước qua **security@freeitchgames.win**.

## 6. Bảo mật dependency và chuỗi cung ứng

Những gì repository thực sự làm:

- **Dependabot** ([`.github/dependabot.yml`](../../../.github/dependabot.yml)) được cấu hình để giữ các dependency npm, pip, GitHub Actions và cargo luôn được cập nhật.
- Mọi **GitHub Action của bên thứ ba đều được ghim theo commit SHA đầy đủ**, và mỗi workflow khai báo `permissions` ở mức tối thiểu cần thiết.
- Các thao tác ghi vào repository từ trang quản trị của website đều đi qua một **GitHub App** (commit được xác minh), và trang quản trị nằm sau Cloudflare Access (đăng nhập GitHub hoặc mã PIN dùng một lần qua email) và chỉ dành cho Người duy trì.
- Form Suggest được bảo vệ bằng Cloudflare Turnstile và giới hạn tốc độ.
- File APK Android được ký bằng khóa của dự án. Chỉ cài APK, cũng như các ứng dụng desktop, từ trang [GitHub Releases](https://github.com/poli0981/free-games-itchio-list/releases) của dự án.

Nếu một lỗ hổng đã biết trong dependency thực sự ảnh hưởng tới một thành phần đang chạy (website, Worker, pipeline hoặc các ứng dụng), hãy báo cáo riêng tư như ở [§1](#1-báo-cáo-lỗ-hổng). Nếu đó chỉ là một dependency lỗi thời, không có tác động thực tế, thì mở issue hoặc pull request thông thường là được.

## 7. Lừa đảo và mạo danh

Dự án không có tài khoản và không nhận thanh toán, nên sẽ không ai từ dự án yêu cầu mật khẩu, token hay thông tin thanh toán của bạn. Website chính thức duy nhất là https://freeitchgames.win (địa chỉ github.io cũ chỉ chuyển hướng về đó), và nơi tải chính thức duy nhất là GitHub Releases. Nếu bạn thấy thứ gì đó mạo danh dự án này, vui lòng báo cho Người duy trì qua **security@freeitchgames.win**.

## 8. Lời cuối

Hãy giữ an toàn — đặc biệt khi tải các game miễn phí ngẫu nhiên. Cảm ơn bạn đã báo cáo có trách nhiệm. Bạn đã giỏi bảo mật hơn cả Người duy trì rồi đấy. 🚀
