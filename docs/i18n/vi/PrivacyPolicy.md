# Chính sách quyền riêng tư (Privacy Policy)

Cập nhật lần cuối: 2026-09-24

Áp dụng từ: khi phát hành phiên bản 4.1.0.

> Bản dịch từ bản tiếng Anh cập nhật ngày 2026-09-24 (English source revision 2026-09-24). Nếu có khác biệt, bản tiếng Anh được ưu tiên. Bản gốc: [`docs/PrivacyPolicy.md`](../../PrivacyPolicy.md).

Chính sách quyền riêng tư này giải thích dự án `free-games-itchio-list` xử lý những dữ liệu cá nhân nào, vì sao, ai hỗ trợ xử lý, dữ liệu được lưu trong bao lâu và bạn có những quyền gì. Chính sách áp dụng cho website **https://freeitchgames.win**, các ứng dụng desktop và Android, dữ liệu danh mục công khai và repository. Nói ngắn gọn: không có tài khoản, không quảng cáo, không cookie theo dõi. Dự án giữ ít dữ liệu nhất có thể, và phần lớn những gì tồn tại chỉ nằm trong trình duyệt của chính bạn.

> **Tóm tắt (TL;DR)**
>
> - Không tài khoản, không đăng nhập, không quảng cáo, không bán dữ liệu, không lập hồ sơ (profiling). Các Ứng dụng không có telemetry.
> - Website chạy trên Cloudflare. Cloudflare xử lý dữ liệu request tiêu chuẩn (địa chỉ IP, trình duyệt, URL, thời gian) để phân phối và bảo vệ trang, và để đếm lượt truy cập ở dạng tổng hợp, không dùng cookie. Mã nguồn của chính Dự án không bao giờ lưu địa chỉ IP của bạn.
> - Để chặn bot, trình duyệt của bạn qua một bước kiểm tra nhanh của Cloudflare Turnstile trước khi Website tải, khoảng 48 giờ một lần; một cookie thật sự cần thiết ghi nhớ rằng bạn đã qua.
> - Cài đặt của bạn (giao diện sáng/tối, ngôn ngữ, lựa chọn 18+, phiên bản điều khoản đã chấp nhận) và bản cache của danh mục công khai nằm trong trình duyệt của bạn và không bao giờ được gửi về Dự án.
> - Nếu bạn dùng trang Suggest, Người duy trì nhận được link game, ghi chú tùy chọn của bạn (bị xóa sau 180 ngày) và thời điểm gửi. Vui lòng không đưa dữ liệu cá nhân vào ghi chú.
> - Câu hỏi hoặc yêu cầu: **privacy@freeitchgames.win**.

## 1. Ai chịu trách nhiệm, và Chính sách này áp dụng cho những gì

### 1.1 Bên kiểm soát dữ liệu

Bên kiểm soát dữ liệu cá nhân được mô tả trong Chính sách này là **Người duy trì**: poli0981 (SkullMute), một cá nhân tại Việt Nam, tự vận hành Dự án như một sở thích. Liên hệ: **privacy@freeitchgames.win** (xem mục 12).

### 1.2 Định nghĩa

- **"Website"**: https://freeitchgames.win, bao gồm các trang và endpoint của nó (như `/data`, `/img`, `/suggest`, `/admin` và `/api/…`). Địa chỉ cũ https://poli0981.github.io/free-games-itchio-list/ chỉ chuyển hướng về đây.
- **"Các Ứng dụng"**: các ứng dụng desktop (Windows, macOS, Linux) và file APK Android, được build từ cùng mã nguồn với Website và phân phối trên GitHub Releases. Đây là các trình xem Danh mục chỉ đọc.
- **"Danh mục"** (Catalog): danh sách game và dữ liệu của chúng, gồm `data_game/`, `scripts/deleted_games.json` và các file được tạo ra từ đó, phục vụ tại https://freeitchgames.win/data.
- **"Repository"**: https://github.com/poli0981/free-games-itchio-list, bao gồm pipeline dữ liệu chạy trên GitHub Actions của repository này.
- **"Dự án"**: Website, các Ứng dụng, Danh mục và Repository nói chung.
- **"Người duy trì"**: poli0981 (SkullMute), như mô tả ở mục 1.1.
- **"Dữ liệu cá nhân"**: mọi thông tin về một người đã được xác định hoặc có thể xác định được.
- **"Bạn"**: bất kỳ ai sử dụng Dự án, kể cả các nhà sáng tạo có game nằm trong Danh mục.

### 1.3 Những gì Chính sách này không áp dụng

Chính sách này không áp dụng cho các dịch vụ tự xử lý dữ liệu với tư cách của chính họ: itch.io (mọi link game và mọi lượt tải đều dẫn tới đó), GitHub đối với tài khoản GitHub và hoạt động của bạn trên github.com, việc Cloudflare dùng dữ liệu cho mục đích riêng của họ như mô tả trong chính sách quyền riêng tư của Cloudflare, bản thân các game, và tiện ích trình duyệt của Người duy trì (một dự án riêng, có tài liệu riêng). Chính sách của từng bên sẽ được áp dụng (link ở mục 4).

## 2. Dữ liệu nào được xử lý và vì sao

### 2.1 Khi truy cập Website

- **Dữ liệu request.** Website được host trên Cloudflare. Khi trình duyệt của bạn tải một trang, một file hay một hình ảnh, Cloudflare xử lý dữ liệu request tiêu chuẩn: địa chỉ IP, user agent (loại trình duyệt và thiết bị), URL được yêu cầu, referrer và thời gian. Việc này cần thiết để phân phối trang, bảo vệ trang (TLS, tường lửa, chống bot và chống tấn công từ chối dịch vụ) và hạn chế lạm dụng.
- **Bước xác minh.** Trước khi các trang và ảnh bìa của Website được tải, trình duyệt của bạn qua một bước kiểm tra của Cloudflare Turnstile. Turnstile xử lý các tín hiệu về thiết bị và trình duyệt để phân biệt người thật với bot; thường bước này tự hoàn tất mà bạn không phải làm gì. Để kiểm tra kết quả, Website gửi token Turnstile và địa chỉ IP của bạn tới dịch vụ xác minh của Cloudflare, rồi đặt cookie `__Host-fig_gate` (mục 3.2) để không phải kiểm tra lại trong 48 giờ. Bot của công cụ tìm kiếm và bot tạo bản xem trước link đã được Cloudflare xác minh thì bỏ qua bước này. Dữ liệu danh mục trong `/data` vẫn truy cập được mà không cần bước này.
- **Thống kê tổng hợp.** Website dùng Cloudflare Web Analytics: một script nhỏ được tải từ Cloudflare để đếm lượt truy cập ở dạng tổng hợp, không dùng cookie và, theo Cloudflare, không dùng fingerprinting. Người duy trì chỉ thấy số liệu tổng (như số lượt xem trang), không thấy từng người truy cập. Dự án không chạy công cụ analytics nào khác.
- **Log máy chủ.** Các request do mã máy chủ của Website (Cloudflare Workers) xử lý được Cloudflare Workers Logs ghi lại theo mẫu 10% và lưu khoảng 7 ngày, để tìm lỗi và điều tra hành vi lạm dụng.
- **Báo cáo lỗi mạng.** Cloudflare có thể thêm header Network Error Logging (NEL), yêu cầu trình duyệt của bạn báo các lỗi kết nối về Cloudflare.
- **Dự án không lưu địa chỉ IP.** Mã nguồn của chính Dự án không bao giờ ghi địa chỉ IP của bạn vào cơ sở dữ liệu, file hay Repository của Dự án.
- **Ảnh bìa** do chính Website phục vụ (bản sao đã thu nhỏ, lưu trên Cloudflare R2), nên trình duyệt của bạn không liên lạc với itch.io trong lúc bạn duyệt web. itch.io chỉ nhận được thông tin từ bạn khi bạn bấm vào link game và chuyển sang đó; khi ấy Website chỉ gửi tối đa địa chỉ của chính nó (không phải trang bạn đang xem) làm referrer.

### 2.2 Khi dùng các Ứng dụng

- Các Ứng dụng là trình xem chỉ đọc, **không telemetry, không analytics và không tài khoản**.
- Chúng tải JSON của Danh mục từ https://freeitchgames.win/data (Cloudflare xử lý dữ liệu request như mô tả ở mục 2.1) và tải ảnh bìa **trực tiếp từ máy chủ ảnh của itch.io (img.itch.zone)**, vì vậy itch.io nhận được địa chỉ IP và user agent của bạn khi ảnh bìa được tải.
- Bấm vào một game sẽ mở trang itch.io của game đó trong trình duyệt của bạn.
- Việc cập nhật là thủ công: các Ứng dụng không tự kiểm tra bản cập nhật. Khi bạn tải bộ cài hoặc file APK từ GitHub Releases, GitHub xử lý request đó.
- Các Ứng dụng dùng cùng kiểu lưu trữ cục bộ như Website (mục 3.1), chỉ trên thiết bị của bạn. Gỡ cài đặt Ứng dụng sẽ xóa dữ liệu này.

### 2.3 Khi đề xuất game

Khi bạn dùng trang Suggest (https://freeitchgames.win/suggest):

- **Những gì được lưu**: URL game, ghi chú tùy chọn của bạn (tối đa 500 ký tự) và thời điểm gửi, trong hàng chờ duyệt (mục 2.4). Trang không yêu cầu và không lưu tên, địa chỉ email hay tài khoản nào.
- **Chống spam**: Cloudflare Turnstile xử lý các tín hiệu về thiết bị và trình duyệt của bạn để phân biệt người thật với bot. Để kiểm tra kết quả, Website gửi token Turnstile và địa chỉ IP của bạn tới dịch vụ xác minh của Cloudflare.
- **Giới hạn tần suất**: địa chỉ IP của bạn chỉ được dùng tạm thời để đếm số request. Dự án không lưu nó.
- **Mục đích**: để xem xét đề xuất của bạn. Nếu được duyệt, URL game trở thành một phần của Danh mục công khai. Ghi chú của bạn không bao giờ được công bố và **tự động bị xóa sau 180 ngày**.
- **Vui lòng không đưa dữ liệu cá nhân vào ghi chú**, dù là của bạn hay của người khác. Biểu mẫu này chỉ dành cho link game.

### 2.4 Hàng chờ duyệt và khu vực quản trị

- **Game đến từ đâu**: đề xuất từ trang Suggest; dữ liệu gửi từ tiện ích trình duyệt của Người duy trì qua một API có xác thực (URL game, tiêu đề và ghi chú tùy chọn, và ID service token của tiện ích; các bản ghi chống gửi trùng được giữ 7 ngày); và tự động phát hiện từ các RSS feed công khai của itch.io.
- **Hàng chờ duyệt** (Cloudflare D1) chứa các URL game ứng viên cùng nguồn gửi, tiêu đề, URL ảnh bìa và gợi ý thể loại lấy từ itch.io, các cờ tự động, ghi chú, mốc thời gian và quyết định của Người duy trì. Không game nào được đưa vào Danh mục cho tới khi Người duy trì duyệt. Các URL bị từ chối được giữ vô thời hạn làm danh sách chặn; chỉ cần URL là đủ để không phải xét lại cùng một game.
- **Khu vực quản trị** (https://freeitchgames.win/admin) chỉ dành cho Người duy trì. Khu vực này được bảo vệ bằng Cloudflare Access (đăng nhập bằng GitHub hoặc mã PIN dùng một lần gửi qua email); Cloudflare Access đặt cookie phiên `CF_Authorization` trong trình duyệt của Người duy trì. Các thao tác quản trị được ghi vào nhật ký kiểm tra (audit log) kèm địa chỉ email của Người duy trì. Nhật ký này không bao giờ được công bố.

### 2.5 Dữ liệu game công khai trong Danh mục

- Danh mục được xây dựng từ các trang game công khai trên itch.io: tên game, tên nhà phát triển và nhà phát hành, mô tả, thể loại, tag, nền tảng, đánh giá và các metadata tương tự, cùng URL ảnh bìa. Pipeline tự nhận diện là `FreeItchGamesBot/4.0 (+https://freeitchgames.win/about)` và giãn nhịp các request.
- Tên nhà phát triển hoặc nhà phát hành, hay địa chỉ itch.io của nhà sáng tạo nằm trong URL game, có thể là tên hoặc biệt danh của một người, nên có thể là dữ liệu cá nhân. Thông tin này chỉ được dùng để nhận diện và ghi công cho game, và để giúp mọi người khám phá game.
- Dữ liệu này được công bố trên Website, trong Repository và tại https://freeitchgames.win/data. Khi một game bị gỡ, URL, tên, lý do và ngày gỡ được ghi vào [`scripts/deleted_games.json`](../../../scripts/deleted_games.json); Website hiển thị danh sách này ở trang Removed (https://freeitchgames.win/removed).
- Nhà sáng tạo có thể yêu cầu sửa hoặc gỡ bất kỳ lúc nào (mục 7).

### 2.6 Khi liên hệ Người duy trì

- Email gửi tới các địa chỉ của Dự án (mục 12) được Cloudflare Email Routing chuyển tiếp tới hộp thư của Người duy trì. Người duy trì nhận địa chỉ email của bạn, tên bạn dùng (nếu có) và nội dung thư, và chỉ dùng chúng để xử lý yêu cầu của bạn.
- Thư từ về yêu cầu gỡ game và yêu cầu liên quan đến bản quyền được giữ trong thời gian cần thiết để xử lý yêu cầu.

### 2.7 Đóng góp trên GitHub

Issue, pull request, discussion và bình luận đều công khai trên GitHub dưới tài khoản GitHub của bạn, và tuyên bố quyền riêng tư của GitHub áp dụng cho chúng. Người duy trì chỉ thấy những gì GitHub hiển thị. Biểu mẫu issue "Remove a game" cũng công khai, nên hãy dùng email cho những gì bạn không muốn công bố.

### 2.8 Những điều Dự án không làm

- Không có tài khoản hay đăng nhập cho công chúng, không bình luận, không quảng cáo và không thanh toán.
- Mã nguồn của chính Dự án không đặt cookie nào trên Website công khai, ngoại trừ cookie xác minh, vốn không nhận diện bất kỳ ai (mục 3.2).
- Không bán hay chia sẻ dữ liệu cá nhân, dù cho quảng cáo hay bất kỳ mục đích nào khác.
- Không lập hồ sơ (profiling) và không ra quyết định tự động gây hệ quả pháp lý hoặc ảnh hưởng đáng kể tương tự đối với bạn.
- Không có telemetry trong các Ứng dụng, và không có analytics nào ngoài Cloudflare Web Analytics trên Website.

## 3. Lưu trữ trên trình duyệt và cookie

### 3.1 Website và các Ứng dụng lưu gì trên thiết bị của bạn

Website và các Ứng dụng chỉ lưu các mục sau trên thiết bị của bạn. Không mục nào được gửi về Dự án.

| Lưu trữ | Khóa | Nội dung | Giữ đến khi |
|---|---|---|---|
| `localStorage` | `webapp.prefs` | Tùy chọn giao diện như ngôn ngữ và mật độ hiển thị, lựa chọn nội dung 18+ (NSFW) của bạn, và phiên bản các văn bản pháp lý bạn đã chấp nhận | Bạn xóa nó |
| `localStorage` | `webapp.theme` | Giao diện: `light`, `dark` hoặc `system` | Bạn xóa nó |
| `localStorage` | `webapp.gate` | Thời điểm lượt xác minh hiện tại (mục 3.2) hết hạn, để tab đang mở kịp kiểm tra lại | Bị thay bởi lần kiểm tra sau; bạn có thể xóa nó |
| IndexedDB (qua `idb-keyval`) | `webapp.query-cache` | Bản cache của JSON Danh mục công khai, để tải nhanh và dùng offline ở mức hạn chế | Tối đa 7 ngày, sau đó được làm mới hoặc bị bỏ đi |
| `sessionStorage` | `reloaded-after-deploy` | Một mốc thời gian, để trang chỉ tự tải lại tối đa một lần sau khi site được cập nhật | Tab được đóng |

Ở lần tải đầu tiên, Website và các Ứng dụng cũng xóa các mục mà ứng dụng v3 cũ để lại trong bộ nhớ trình duyệt (một GitHub access token đã mã hóa và dữ liệu khóa ký commit). v4 không dùng tới các mục này.

Các mục trên là thật sự cần thiết cho những tính năng bạn dùng (giữ cài đặt, tải trang nhanh, phục hồi sau khi site cập nhật, không phải xác minh lặp lại), nên không cần sự đồng ý theo các quy định ePrivacy của EU hay PECR của Vương quốc Anh. Bạn có thể xóa chúng bất kỳ lúc nào bằng tùy chọn "Clear site data" (xóa dữ liệu trang web) của trình duyệt cho `freeitchgames.win`, hoặc xem chúng trong công cụ dành cho nhà phát triển (developer tools) của trình duyệt. Với các Ứng dụng, gỡ cài đặt sẽ xóa chúng; nếu trình gỡ cài đặt trên desktop để sót lại thư mục dữ liệu của Ứng dụng (`com.poli0981.freegamesitchio`), bạn có thể tự xóa thư mục đó. Trên Android, bạn cũng có thể xóa bộ nhớ của ứng dụng trong phần cài đặt hệ thống.

### 3.2 Cookie

- Mã nguồn của chính Dự án đặt **một cookie** trên Website công khai: `__Host-fig_gate`, sau khi bạn qua bước xác minh (mục 2.1). Cookie này chỉ chứa thời điểm cấp và một chữ ký, không nhận diện ai, tồn tại **48 giờ** và chỉ được gửi tới freeitchgames.win (`HttpOnly`, `Secure`, `SameSite=Lax`). Cookie này thật sự cần thiết để chặn truy cập tự động, nên không cần sự đồng ý theo các quy định ePrivacy của EU hay PECR của Vương quốc Anh. Nếu bạn chặn nó, bước kiểm tra sẽ chạy lại ở mỗi lần truy cập.
- Cloudflare có thể đặt các cookie bảo mật thật sự cần thiết, như `__cf_bm` hoặc `cf_clearance`, khi cơ chế chống bot hoặc thử thách (challenge) của họ hoạt động. Các cookie này chỉ phục vụ mục đích bảo mật.
- Bước xác minh và trang Suggest dùng Cloudflare Turnstile (mục 2.1 và 2.3); xem phụ lục quyền riêng tư Turnstile của Cloudflare (mục 4).
- Khu vực quản trị dùng cookie phiên `CF_Authorization` của Cloudflare Access, cookie này chỉ tồn tại trong trình duyệt của Người duy trì.

## 4. Nhà cung cấp dịch vụ và các bên khác

| Bên | Vai trò và công việc | Dữ liệu liên quan | Chính sách quyền riêng tư |
|---|---|---|---|
| **Cloudflare** | Bên xử lý dữ liệu cho Website: DNS, CDN, tường lửa và TLS; Workers (mã máy chủ của site) và static assets; R2 (ảnh bìa đã thu nhỏ); D1 (hàng chờ duyệt); Images (thu nhỏ ảnh); Turnstile (bước xác minh và trang Suggest); Web Analytics; Workers Logs; Access (chỉ cho đăng nhập quản trị); Rate Limiting; Email Routing (chuyển tiếp các địa chỉ liên hệ của Dự án) | Dữ liệu request, đề xuất từ trang Suggest, hàng chờ duyệt, email được chuyển tiếp | <https://www.cloudflare.com/privacypolicy/> · Turnstile: <https://www.cloudflare.com/turnstile-privacy-policy/> |
| **GitHub** | Host mã nguồn, dữ liệu Danh mục, issue và discussion, pipeline dữ liệu (GitHub Actions) và các bản phát hành để tải về. Là bên kiểm soát độc lập đối với tài khoản và hoạt động GitHub của bạn | Các đóng góp công khai của bạn; dữ liệu request khi bạn truy cập GitHub hoặc tải bản phát hành | <https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement> |
| **itch.io** | Nền tảng độc lập, không liên kết với Dự án. Là nguồn dữ liệu game; mọi link game và lượt tải đều dẫn tới đó; các Ứng dụng tải ảnh bìa từ img.itch.zone | Những gì trình duyệt của bạn hoặc các Ứng dụng gửi đi khi bạn truy cập itch.io hoặc tải ảnh bìa từ đó. Pipeline không gửi thông tin nào về bạn | <https://itch.io/docs/legal/privacy-policy> |
| **Discord** | Nhận thông báo build và phát hành tự động từ GitHub Actions | Không có dữ liệu người truy cập | — |

Cloudflare có thể xử lý dữ liệu ở bất kỳ đâu trên mạng lưới toàn cầu của họ (xem mục 9). Người duy trì không cung cấp dữ liệu cá nhân cho bất kỳ ai khác, trừ khi pháp luật yêu cầu.

## 5. Dữ liệu được lưu trong bao lâu

| Dữ liệu | Thời gian lưu |
|---|---|
| Dữ liệu request do Cloudflare xử lý để phân phối và bảo mật | Do Cloudflare lưu theo chính sách quyền riêng tư của họ; Dự án không lưu |
| Workers Logs (mẫu 10% các request do mã máy chủ của Website xử lý) | Khoảng 7 ngày |
| Web Analytics | Chỉ có thống kê tổng hợp; Người duy trì không thể thấy từng người truy cập |
| Địa chỉ IP dùng cho giới hạn tần suất và Turnstile | Chỉ dùng tạm thời; Dự án không bao giờ lưu |
| Ghi chú trên trang Suggest | Tự động xóa sau **180 ngày** |
| URL game được đề xuất hoặc được phát hiện, kèm nguồn và mốc thời gian | Nằm trong hàng chờ duyệt chừng nào còn cần để không phải xét cùng một game hai lần. URL được duyệt trở thành một phần của Danh mục công khai; URL bị từ chối được giữ vô thời hạn làm danh sách chặn |
| Bản ghi chống gửi trùng từ tiện ích trình duyệt | **7 ngày** |
| Nhật ký kiểm tra quản trị (kèm địa chỉ email của Người duy trì) | Được giữ làm hồ sơ các thay đổi quản trị; không bao giờ công bố |
| Mục trong Danh mục (bao gồm tên nhà phát triển và nhà phát hành) | Khi game còn được liệt kê. Bản ghi gỡ bỏ vẫn nằm trong danh sách game đã gỡ công khai, và lịch sử Git của Repository giữ các phiên bản trước (xem mục 7.3) |
| Email, bao gồm yêu cầu gỡ game và yêu cầu liên quan đến bản quyền | Trong thời gian cần thiết để xử lý yêu cầu |
| Đóng góp trên GitHub | Trên GitHub, cho tới khi bạn hoặc GitHub xóa |
| Lưu trữ trên trình duyệt | Xem mục 3.1 |
| Cookie xác minh `__Host-fig_gate` | **48 giờ** (mục 3.2) |
| Cookie `CF_Authorization` (chỉ Người duy trì) | Trong thời gian của phiên Cloudflare Access |

## 6. Cơ sở pháp lý

### 6.1 Việt Nam

Người duy trì xử lý dữ liệu cá nhân theo **Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15** của Việt Nam (được thông qua ngày 26/6/2025, có hiệu lực từ ngày 01/01/2026) và các văn bản hướng dẫn thi hành. Dự án xử lý ít dữ liệu cá nhân nhất có thể, và chỉ cho các mục đích nêu ở mục 2.

Khi Luật này yêu cầu sự đồng ý của bạn, bạn thể hiện sự đồng ý bằng một hành động rõ ràng: chấp nhận Chính sách này tại màn hình xác nhận pháp lý (legal gate) ở lần truy cập đầu tiên, và, đối với những gì bạn tự nhập, gửi biểu mẫu Suggest hoặc gửi email. Bạn có thể rút lại sự đồng ý bất kỳ lúc nào (mục 7). Việc rút lại không ảnh hưởng tới việc xử lý đã được thực hiện trước đó.

### 6.2 EU/EEA và Vương quốc Anh

Nếu bạn ở EU/EEA hoặc Vương quốc Anh, GDPR hoặc UK GDPR áp dụng cho việc xử lý dữ liệu cá nhân của bạn, trên các cơ sở pháp lý sau:

| Hoạt động xử lý | Cơ sở pháp lý |
|---|---|
| Phân phối và bảo mật Website cùng dữ liệu mà các Ứng dụng tải về (dữ liệu request, log máy chủ, giới hạn tần suất, Turnstile, cookie bảo mật) | Lợi ích hợp pháp (Điều 6(1)(f)): vận hành một dịch vụ hoạt động tốt, an toàn và ngăn chặn lạm dụng |
| Thống kê truy cập tổng hợp | Lợi ích hợp pháp: hiểu cách trang được sử dụng nói chung, không theo dõi từng cá nhân |
| Đề xuất và hàng chờ duyệt | Lợi ích hợp pháp: xử lý đề xuất mà bạn chọn gửi và chọn lọc Danh mục |
| Dữ liệu game công khai về nhà sáng tạo | Lợi ích hợp pháp: giúp mọi người khám phá game miễn phí bằng thông tin mà nhà sáng tạo đã công bố trên itch.io. Bạn có thể phản đối bất kỳ lúc nào (mục 7) |
| Email và yêu cầu gỡ game | Lợi ích hợp pháp: trả lời bạn và xử lý yêu cầu của bạn |
| Lưu trữ trên trình duyệt (mục 3.1) | Thật sự cần thiết cho các tính năng bạn dùng; không cần sự đồng ý theo quy định ePrivacy hoặc PECR |

## 7. Quyền của bạn và cách thực hiện

### 7.1 Quyền của bạn

Tùy theo luật áp dụng cho bạn, bao gồm Luật số 91/2025/QH15 và, tại EU/EEA và Vương quốc Anh, GDPR hoặc UK GDPR, bạn có quyền:

- được biết dữ liệu cá nhân của bạn được xử lý như thế nào (chính là Chính sách này);
- truy cập dữ liệu cá nhân mà Dự án đang giữ về bạn;
- chỉnh sửa dữ liệu nếu dữ liệu không chính xác;
- yêu cầu xóa dữ liệu;
- phản đối việc xử lý, bao gồm việc xử lý dựa trên lợi ích hợp pháp;
- rút lại sự đồng ý khi việc xử lý dựa trên sự đồng ý;
- khiếu nại tới cơ quan giám sát: cơ quan có thẩm quyền về bảo vệ dữ liệu cá nhân tại Việt Nam, hoặc cơ quan bảo vệ dữ liệu của quốc gia EU/EEA nơi bạn ở hoặc của Vương quốc Anh.

Theo GDPR và UK GDPR, bạn cũng có thể yêu cầu hạn chế việc xử lý, hoặc nhận bản sao dữ liệu ở định dạng có thể chuyển giao (portable), khi các quyền đó được áp dụng.

### 7.2 Cách gửi yêu cầu

- Gửi email tới **privacy@freeitchgames.win**. Hãy nói rõ bạn muốn gì và cung cấp đủ chi tiết để tìm được dữ liệu: ví dụ URL game bạn đã đề xuất và khoảng thời gian gửi, hoặc địa chỉ email bạn đã dùng để viết thư. Người duy trì có thể hỏi thêm để xác nhận yêu cầu đúng là của bạn.
- Mục tiêu là trả lời trong vòng **30 ngày**; nhiều yêu cầu được xử lý sớm hơn nhiều. Việc gửi yêu cầu là miễn phí.
- Nhà sáng tạo muốn gỡ game hoặc sửa dữ liệu game cũng có thể gửi email tới **takedown@freeitchgames.win** hoặc mở issue ["Remove a game"](https://github.com/poli0981/free-games-itchio-list/issues/new?template=remove_game.yml) (công khai). Mục tiêu cho việc gỡ là trong vòng 7 ngày. Quy trình gỡ được mô tả trong [Điều khoản sử dụng](ToS.md).

### 7.3 Những giới hạn nên biết

- Dự án không lưu địa chỉ IP và không có tài khoản, nên không thể liên kết các lượt truy cập Website với bạn. Dữ liệu bảo mật và log của Cloudflare chỉ được giữ trong thời gian ngắn (mục 5).
- Lưu trữ trên trình duyệt nằm trong tầm kiểm soát của bạn: bạn có thể tự xem và xóa (mục 3.1).
- Lịch sử Git của Repository công khai giữ các phiên bản trước của Danh mục. Người duy trì không thể viết lại lịch sử công khai, trừ trường hợp đặc biệt có yêu cầu pháp lý bắt buộc. Các bản sao mà người khác đã tạo (fork, dữ liệu đã tải về) nằm ngoài tầm kiểm soát của Người duy trì.
- Nội dung trên GitHub (issue, bình luận) được quản lý qua GitHub; bạn có thể sửa hoặc xóa bình luận của mình tại đó.

## 8. Trẻ em

- Dự án không hướng tới trẻ em dưới 16 tuổi. Màn hình xác nhận pháp lý yêu cầu mọi người truy cập xác nhận mình đủ 16 tuổi trở lên.
- Nội dung người lớn (18+) bị ẩn theo mặc định, kể cả ảnh bìa. Nội dung này chỉ hiện ra nếu người truy cập tự bật trong Settings sau khi xác nhận mình đủ 18 tuổi trở lên. Lựa chọn đó chỉ được lưu trong trình duyệt của họ (`webapp.prefs`). Cờ `nsfw` chỉ là nhãn được gắn ở mức cố gắng tốt nhất (xem [Tuyên bố miễn trừ trách nhiệm](DISCLAIMER.md)).
- Người duy trì không cố ý thu thập dữ liệu cá nhân của trẻ em dưới 16 tuổi. Nếu bạn cho rằng một trẻ em đã gửi dữ liệu cá nhân (ví dụ trong ghi chú Suggest hoặc qua email), cha mẹ hoặc người giám hộ có thể viết tới **privacy@freeitchgames.win** và dữ liệu đó sẽ được xóa.

## 9. Chuyển dữ liệu ra nước ngoài

- Người duy trì ở Việt Nam. Email bạn gửi và dữ liệu trong hàng chờ duyệt được Người duy trì xử lý từ Việt Nam.
- Cloudflare xử lý dữ liệu trên mạng lưới toàn cầu của họ, và GitHub hoạt động ở phạm vi quốc tế, nên dữ liệu của bạn có thể được xử lý bên ngoài quốc gia của bạn, kể cả ở những nước có luật bảo vệ dữ liệu khác với nơi bạn sống. Các nhà cung cấp này mô tả các biện pháp bảo vệ họ áp dụng cho việc chuyển dữ liệu quốc tế trong chính sách quyền riêng tư và điều khoản xử lý dữ liệu của họ (link ở mục 4).

## 10. Bảo mật

- Website chỉ được phục vụ qua HTTPS.
- Truy cập tự động phải qua bước kiểm tra Cloudflare Turnstile trước khi các trang và ảnh bìa của Website được tải (mục 2.1).
- Tối thiểu hóa dữ liệu: không tài khoản, mã nguồn của Dự án không lưu địa chỉ IP, ghi chú Suggest bị xóa sau 180 ngày, bản ghi chống gửi trùng bị xóa sau 7 ngày.
- Khu vực quản trị và API ingest được bảo vệ bằng Cloudflare Access, và mã máy chủ của Website tự xác minh token Access ở mọi request được bảo vệ.
- Các thông tin bí mật (như private key của GitHub App) được giữ trong kho lưu trữ bí mật của Cloudflare, không bao giờ nằm trong Repository. Khu vực quản trị ghi vào Repository dưới danh nghĩa một GitHub App, với các commit đã được xác minh (verified).
- Content Security Policy chặt chẽ chỉ cho phép script từ chính Website, cộng với Cloudflare Web Analytics và Turnstile.
- Các GitHub Actions được ghim theo commit SHA cụ thể với quyền tối thiểu cần thiết, và Dependabot giữ cho các dependency luôn được cập nhật.
- Không hệ thống nào an toàn tuyệt đối. Nếu bạn phát hiện lỗ hổng, vui lòng báo cáo riêng tư theo hướng dẫn trong [Chính sách bảo mật (Security Policy)](SECURITY.md) hoặc qua **security@freeitchgames.win**. Nếu xảy ra sự cố vi phạm dữ liệu cá nhân, Người duy trì sẽ thông báo cho những người bị ảnh hưởng và cơ quan chức năng theo yêu cầu của pháp luật.

## 11. Thay đổi Chính sách này

- Người duy trì có thể cập nhật Chính sách này. Các phiên bản mới được công bố trong Repository kèm ngày `Cập nhật lần cuối` ở đầu văn bản, và các thay đổi quan trọng được ghi trong [CHANGELOG.md](../../../CHANGELOG.md). Các phiên bản trước vẫn còn trong lịch sử của Repository.
- Khi một thay đổi cần bạn chấp nhận lại, màn hình xác nhận pháp lý trên Website và trong các Ứng dụng sẽ yêu cầu bạn xem và chấp nhận các văn bản đã cập nhật trước khi tiếp tục.

## 12. Liên hệ

Cả bốn địa chỉ dưới đây đều được Cloudflare Email Routing chuyển tiếp tới Người duy trì.

- **privacy@freeitchgames.win**: câu hỏi về quyền riêng tư và yêu cầu liên quan đến dữ liệu của bạn (mục tiêu trả lời: trong vòng 30 ngày).
- **takedown@freeitchgames.win**: gỡ game hoặc sửa dữ liệu game, bao gồm khiếu nại bản quyền.
- **security@freeitchgames.win**: lỗ hổng bảo mật (hoặc tính năng báo cáo lỗ hổng riêng tư của GitHub; xem [Chính sách bảo mật (Security Policy)](SECURITY.md)).
- **legal@freeitchgames.win**: mọi vấn đề pháp lý khác.

Với những câu hỏi không cần riêng tư, bạn cũng có thể mở issue trong Repository; issue là công khai.

## 13. Lời cuối

Một danh sách game miễn phí thì chẳng cần tới dữ liệu của bạn, nên Dự án gần như không đụng tới nó: không tài khoản, không quảng cáo, không cookie theo dõi, không bán gì cả. Chút dữ liệu ít ỏi còn lại được giữ ngắn nhất có thể và bị xóa khi không còn cần. Cứ thoải mái mà duyệt game.
