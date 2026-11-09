# Trợ năng (Accessibility)

Cập nhật lần cuối: 2026-11-09

Áp dụng từ: khi phát hành phiên bản 4.6.0 (website và các ứng dụng desktop, Android).

> Bản dịch từ bản tiếng Anh cập nhật ngày 2026-11-09 (English source revision 2026-11-09). Nếu có khác biệt, bản tiếng Anh được ưu tiên. Bản gốc: [`ACCESSIBILITY.md`](../../../ACCESSIBILITY.md).

Đây là một dự án sở thích do một người vận hành, poli0981 (SkullMute), dưới đây gọi là "Người duy trì": một danh mục game itch.io miễn phí, có trên website https://freeitchgames.win và trong các ứng dụng desktop, Android hiển thị cùng các trang đó. Ai cũng nên dùng được, dù bạn chỉ dùng bàn phím, trình đọc màn hình, phóng to, giao diện tương phản cao, nhập liệu bằng giọng nói hay bất cứ công cụ nào khác. Tuyên bố này cho biết những gì đã hoạt động, cách kiểm tra, những gì chưa ổn, và cách báo cho Người duy trì khi có gì đó cản trở bạn.

> **Tóm tắt (TL;DR)**
>
> - Mục tiêu là [WCAG 2.2](https://www.w3.org/TR/WCAG22/) mức AA cho website và các ứng dụng. Đó là mục tiêu, không phải chứng nhận: chưa có ai ngoài dự án đánh giá.
> - Mọi trang đều dùng được chỉ với bàn phím và với trình đọc màn hình. Người duy trì kiểm tra bằng bàn phím (không dùng chuột) và Windows Narrator.
> - Màu sắc đạt tỉ lệ tương phản WCAG ở cả giao diện sáng và tối, và một bài test kiểm tra lại sau mỗi thay đổi. Hỗ trợ chế độ tương phản (Contrast themes) của Windows và làm theo thiết lập "giảm chuyển động" của hệ thống.
> - Mỗi biểu đồ đều có bảng dữ liệu đi kèm.
> - Các hạn chế đã biết nằm ở [§6](#6-các-hạn-chế-đã-biết).
> - Có gì cản trở bạn? Hãy mở một [issue trợ năng](https://github.com/poli0981/free-games-itchio-list/issues/new?template=accessibility.yml) hoặc email **contact@poli0981.dev**.

## 1. Phạm vi

Tuyên bố này áp dụng cho:

- **website** https://freeitchgames.win: mọi trang công khai (Trang chủ, Games, trang từng game, Charts, Removed, Suggest, Settings, About, các trang lỗi) và trang xác minh hiện ra trước đó;
- **các ứng dụng desktop** (Windows, macOS, Linux) **và ứng dụng Android**, vốn hiển thị cùng các trang trong web view của hệ thống.

Tuyên bố này không áp dụng cho:

- bản thân các game, trang itch.io của chúng, và những gì người tạo game viết hay làm ra (tên, mô tả, tag, ảnh bìa);
- Cloudflare Turnstile, bước kiểm tra của bên thứ ba trên trang xác minh và trên form Suggest (Cloudflare chịu trách nhiệm về trợ năng của nó);
- trang quản trị của Người duy trì, vốn chỉ có một người dùng;
- các trang web khác được liên kết tới, kể cả GitHub.

## 2. Mục tiêu và ưu tiên

- **Mục tiêu**: [WCAG 2.2](https://www.w3.org/TR/WCAG22/) mức AA, trong khả năng của một dự án sở thích do một người làm.
- **Trước hết**: các việc chính dùng được với bàn phím và trình đọc màn hình: tìm game, đọc thông tin, mở game trên itch.io, đổi cài đặt, gợi ý game.
- **Tiếp theo**: chữ và nút dễ đọc (tương phản, phóng to, dàn lại bố cục), không có chuyển động bạn không yêu cầu, và đúng ngôn ngữ cho trình đọc màn hình (tiếng Anh hoặc tiếng Việt).
- **Luôn luôn**: tính năng mới phải giữ được tất cả những điều trên (xem [§8](#8-dành-cho-người-đóng-góp)).

## 3. Những gì đã hoạt động

### Di chuyển trong trang

- "Chuyển đến nội dung" (Skip to content) là thứ đầu tiên phím Tab chạm tới.
- Mỗi trang có các vùng mốc (landmark) được đặt tên (đầu trang, menu chính, tìm kiếm, nội dung chính, phân trang, chân trang), một tiêu đề cấp 1 và tiêu đề trang riêng.
- Khi bạn bấm một liên kết bên trong site, focus chuyển tới tiêu đề của trang mới, nên trình đọc màn hình đọc tên trang và phím Tab đi tiếp từ đó. Khi quay lại, focus trở về liên kết bạn vừa dùng, ví dụ game bạn mở từ danh sách.
- Thanh đầu trang cố định không bao giờ che phần tử đang có focus bàn phím.

### Bàn phím

- Mọi thứ đều dùng được chỉ với bàn phím: menu, bộ lọc, hộp thoại và biểu đồ.
- Focus luôn nhìn thấy được: một đường viền tím, hoặc màu tô sáng của hệ thống trong chế độ tương phản.
- Hộp thoại giữ focus bên trong khi đang mở và trả focus về chỗ cũ khi đóng.
- Phím "/" đưa bạn tới ô tìm kiếm. Bạn có thể tắt phím tắt này trong **Settings → Trợ năng**, hữu ích khi nhập liệu bằng giọng nói hoặc khi phím này xung đột với trình đọc màn hình hay chức năng tìm nhanh của trình duyệt.
- Khi một nút biến mất sau khi bạn dùng nó (xoá ô tìm kiếm, bỏ một bộ lọc), focus chuyển tới chỗ hợp lý tiếp theo thay vì bị mất.

### Trình đọc màn hình

- Mọi nút điều khiển đều có tên, bằng tiếng Anh hoặc tiếng Việt. Biểu tượng được ẩn khỏi trình đọc màn hình.
- Số kết quả, gợi ý tìm kiếm, trạng thái đang tải và thông báo của form đều được đọc lên.
- Trên màn hình rộng, danh sách game là một bảng có tiêu đề cột; trên điện thoại là một danh sách đơn giản.
- Liên kết mở thẻ mới (trong ứng dụng: mở trình duyệt) đều nói rõ điều đó.
- Chữ thuộc ngôn ngữ kia, như tên các ngôn ngữ và tên tiếng Anh của các văn bản pháp lý, được đánh dấu đúng ngôn ngữ.

### Nhìn nội dung

- Chữ và nút đạt tỉ lệ tương phản WCAG 2.2 AA ở cả hai giao diện: 4.5:1 cho chữ, 3:1 cho viền ô nhập, đường viền focus và màu biểu đồ. Bài test [`webapp/scripts/check-contrast.test.mjs`](../../../webapp/scripts/check-contrast.test.mjs) kiểm tra màu sau mỗi thay đổi.
- Giao diện sáng, tối hoặc theo hệ thống; dòng gọn hoặc thường; ẩn thanh cuộn: tất cả nằm trong Settings.
- Chế độ tương phản của Windows (forced colors): tab đang chọn, nút bật/tắt đang bấm, trang hiện tại và các công tắc dùng màu tô sáng của hệ thống.
- Không bao giờ chặn phóng to. Ở mức phóng 400 % hoặc cửa sổ rộng 320 pixel, bố cục điện thoại được dùng và trang không phải cuộn ngang.
- Liên kết nằm trong câu đều được gạch chân. Không có gì chỉ dựa vào màu sắc: trạng thái luôn kèm thay đổi chữ, viền hoặc gạch chân.

### Chuyển động

- Khi bạn bật "giảm chuyển động" trong hệ thống, hiệu ứng, phần biểu đồ hiện ra và cuộn mượt đều tắt.
- Trên website, ảnh bìa thường được hiển thị dạng ảnh tĩnh (ảnh bìa động được chuyển thành ảnh tĩnh).
- Ngoài các khối giữ chỗ khi đang tải, không có gì tự chuyển động.

### Biểu đồ

- Mỗi biểu đồ được đặt tên theo tiêu đề của nó. Đưa focus vào biểu đồ rồi dùng phím mũi tên trái, phải: giá trị bạn chuyển tới sẽ được đọc lên.
- Dưới mỗi biểu đồ, **Bảng dữ liệu** mở cùng các số liệu dưới dạng bảng, kèm tỉ lệ từng phần với biểu đồ tròn.

### Ngôn ngữ

- Các trang có tiếng Anh và tiếng Việt (Settings), và ngôn ngữ của trang đi theo lựa chọn của bạn, nên trình đọc màn hình chọn đúng giọng đọc. Số và ngày tháng cũng theo ngôn ngữ đó.

## 4. Cách kiểm tra

- **Người duy trì kiểm tra thủ công** (tháng 11/2026): website trên Windows 11 và ứng dụng desktop Windows, chỉ dùng bàn phím (tắt chuột) và Windows Narrator. Không thấy lỗi nào chặn việc sử dụng.
- **Cho bản 4.6.0**: các trang chính và hộp thoại được đi hết bằng bàn phím, và cây trợ năng (accessibility tree) của chúng được kiểm tra (tên, vai trò, tiêu đề, vùng mốc, thông báo) bằng tiếng Anh và tiếng Việt, trên màn hình máy tính và màn hình cỡ điện thoại.
- **Tự động, sau mỗi thay đổi**: bài test tương phản ở trên và các unit test của ứng dụng (focus đi đâu sau khi đổi trang, bảng dữ liệu biểu đồ).
- **Trước mỗi lần phát hành**: một lượt kiểm tra nhanh. Gồm đi hết các việc chính bằng bàn phím, thử nhanh với trình đọc màn hình, phóng to 200 % và cửa sổ hẹp, giảm chuyển động, và một chế độ tương phản của Windows.
- **Chưa có**: quét tự động trên trình duyệt (như axe hay Lighthouse) trong CI, và việc kiểm tra bởi những người dùng hằng ngày nhiều công cụ hỗ trợ khác nhau. Mọi sự giúp đỡ đều được hoan nghênh.

## 5. Môi trường được hỗ trợ

| | Phiên bản |
|---|---|
| Website | Chrome, Edge, Firefox và Safari hiện hành trên máy tính và điện thoại. Các phiên bản cũ nhất mà site được build cho là Chrome và Edge 111, Firefox 114, Safari và iOS 15.4. |
| Ứng dụng desktop | Windows 10 và 11 (Microsoft Edge WebView2), macOS (WebKit 16.4 trở lên), Linux (WebKitGTK 4.1) |
| Ứng dụng Android | Android 11 trở lên |

Công cụ hỗ trợ (assistive technology):

- **Đã kiểm tra**: Windows Narrator trên Windows 11, và dùng chỉ bàn phím.
- **Dự kiến dùng được, chưa kiểm tra thường xuyên**: NVDA và JAWS trên Windows, VoiceOver trên macOS và iOS, TalkBack trên Android, phóng to của trình duyệt, chế độ tương phản của Windows, nhập liệu bằng giọng nói. Chúng dựa trên cùng mã HTML chuẩn.
- **Hạn chế**: Orca trong ứng dụng desktop Linux, vì WebKitGTK hỗ trợ trình đọc màn hình kém hơn các trình duyệt.

## 6. Các hạn chế đã biết

- **Chữ của người tạo game không được đánh dấu ngôn ngữ.** Tên, mô tả và tag của game lấy từ itch.io bằng nhiều ngôn ngữ, và trình đọc màn hình đọc chúng theo ngôn ngữ của trang.
- **Ảnh bìa chỉ có mô tả chung** ("Tên game cover"). Nội dung bức ảnh không được mô tả.
- **Biểu đồ**: phím mũi tên chỉ di chuyển trái và phải. Biểu đồ treemap thể loại không đi từng phần được, nhưng số liệu của nó có trong bảng dữ liệu và trong biểu đồ Genres. Chữ trong biểu đồ có cỡ pixel cố định, nên tăng cỡ chữ mặc định của trình duyệt không làm nó to lên (phóng to trang thì có).
- **Ứng dụng desktop**: không có phím phóng to bên trong ứng dụng, cửa sổ không phóng to toàn màn hình (maximize) được, và không thu nhỏ hơn 900 × 600. Nếu cần chữ lớn hơn, hãy dùng tỉ lệ hiển thị (display scaling) của hệ thống hoặc mở website trong trình duyệt.
- **Ứng dụng Android**: không phóng to bằng hai ngón tay được. Website trong trình duyệt điện thoại thì phóng to được.
- **Ảnh bìa động trong ứng dụng**: ứng dụng tải ảnh bìa trực tiếp từ itch.io, nên ảnh bìa động vẫn chạy ở đó.
- **Bước kiểm tra của Cloudflare**: bước xác minh (chỉ trên website) và bước chống spam của form Suggest là widget Cloudflare Turnstile. Thường chúng tự qua mà bạn không cần làm gì. Nếu có lúc chúng yêu cầu điều bạn không làm được, hãy email Người duy trì.
- **Trang trên GitHub**: các chính sách, tuyên bố này và các form issue nằm trên GitHub, nên trợ năng của chính GitHub áp dụng ở đó.
- **Chưa có đánh giá độc lập**, và chỉ có một người duy trì.

## 7. Báo cáo rào cản trợ năng

Nếu có gì ngăn bạn hoặc làm bạn chậm lại, hãy cho biết. Báo cáo chưa đầy đủ cũng có ích.

- **GitHub**: mở một [issue Accessibility barrier](https://github.com/poli0981/free-games-itchio-list/issues/new?template=accessibility.yml).
- **Email**: **contact@poli0981.dev**. Không cần tài khoản GitHub; viết tiếng Anh hay tiếng Việt đều được.

Những chi tiết có ích, trong chừng mực bạn thấy thoải mái chia sẻ (đừng bao giờ gửi thông tin sức khoẻ):

- bạn đang định làm gì, và điều gì đã xảy ra;
- trang (địa chỉ) hoặc ứng dụng và phiên bản của nó, xem trên trang About;
- thiết bị, hệ điều hành và trình duyệt;
- công cụ hỗ trợ bạn dùng và phiên bản, nếu có;
- ảnh chụp màn hình hoặc video, nếu được.

Mức độ ảnh hưởng:

| Mức độ | Ý nghĩa |
|---|---|
| Critical (nghiêm trọng nhất) | Bạn hoàn toàn không làm được một việc chính, ví dụ mở game hay đọc thông tin của nó. |
| Serious (nghiêm trọng) | Bạn làm được, nhưng rất vất vả hoặc phải đi đường vòng. |
| Moderate (trung bình) | Gây phiền hoặc không nhất quán, nhưng vẫn làm được. |
| Minor (nhỏ) | Một chi tiết nhỏ cần chỉnh. |

Điều gì xảy ra tiếp theo. Đây là mục tiêu, không phải cam kết, vì đây là dự án sở thích của một người:

- **Xác nhận đã nhận** trong vòng 7 ngày, thường sớm hơn.
- **Sửa lỗi hoặc đưa cách khắc phục tạm**: Critical trong 30 ngày, Serious trong 60 ngày, Moderate và Minor ở một bản phát hành sau.
- **Bản sửa cho website** có hiệu lực khi được deploy; **bản sửa cho ứng dụng** đi kèm bản phát hành tiếp theo.
- Bạn sẽ được hỏi bản sửa đã ổn với bạn chưa, và được ghi công trong release notes nếu muốn.

Lỗ hổng bảo mật không nên đưa vào issue công khai: xem [Chính sách bảo mật](SECURITY.md).

## 8. Dành cho người đóng góp

Thay đổi giao diện phải giữ đúng những điều ở [§3](#3-những-gì-đã-hoạt-động):

- **Bàn phím**: mọi nút đều tới được và dùng được, focus luôn nhìn thấy và không bị mất.
- **Tên**: mọi nút có nhãn, với chữ có trong cả `webapp/src/lib/i18n/en.ts` và `vi.ts`.
- **Màu sắc**: dùng các token của theme. `npm test` kiểm tra tương phản (4.5:1 cho chữ, 3:1 cho viền, focus và màu biểu đồ), và màu sắc không bao giờ là tín hiệu duy nhất.
- **Chuyển động**: tôn trọng `prefers-reduced-motion`; quy tắc CSS dùng chung và `SERIES_ANIMATION` đã làm việc đó.
- **Trình đọc màn hình**: kiểm tra thay đổi ít nhất một lần với một trình đọc (Narrator, NVDA, VoiceOver hoặc TalkBack).
- **Mã HTML**: ưu tiên phần tử gốc và các component Radix / shadcn đang dùng, chỉ thêm ARIA khi thật cần.

Tài liệu: tiêu đề theo đúng thứ tự, chữ của liên kết nói rõ nó dẫn tới đâu, ảnh có alt, bảng có ô tiêu đề, và bản tiếng Việt được cập nhật (hoặc ghi rõ trong pull request là chưa).

[Pull request template](../../../.github/pull_request_template.md) có sẵn danh sách kiểm tra.

## 9. Tìm game có hỗ trợ tiếp cận

Danh mục hiển thị các tính năng hỗ trợ tiếp cận mà người tạo game liệt kê trên trang itch.io của họ, như phụ đề, điều khiển tuỳ chỉnh được hay chế độ cho người mù màu:

- trên trang của từng game, ở mục "Hỗ trợ tiếp cận";
- trong bộ lọc Hỗ trợ tiếp cận ở trang Games, ví dụ https://freeitchgames.win/games?access=Subtitles;
- trong biểu đồ "Tính năng hỗ trợ tiếp cận" (Charts → Khám phá).

Người tạo game tự khai báo các tính năng này, và dự án không kiểm chứng. Nếu thông tin của một game sai, hãy báo bằng issue template "Bug Report".

## 10. Tài liệu tham khảo

- [Open Source Guides: Accessibility best practices for your project](https://opensource.guide/accessibility-best-practices-for-your-project/)
- [Open Source Accessibility toolkit](https://github.com/open-source-accessibility/accessibility-toolkit): tuyên bố này theo dàn ý của mẫu ACCESSIBILITY.md trong đó, với lời văn riêng.
- [Web Content Accessibility Guidelines (WCAG) 2.2](https://www.w3.org/TR/WCAG22/)
- [W3C: Developing an accessibility statement](https://www.w3.org/WAI/planning/statements/)

## 11. Liên hệ

- **Rào cản trợ năng**: [form issue](https://github.com/poli0981/free-games-itchio-list/issues/new?template=accessibility.yml) hoặc **contact@poli0981.dev**.
- **Mọi việc khác**: xem các địa chỉ trong [README → Pháp lý](../../../README.vi.md#pháp-lý).

## 12. Lời cuối

Một người, một danh mục, và mọi cách duyệt web. Nếu có gì ở đây không hợp với cách bạn dùng web, Người duy trì thật sự muốn được biết — đó là cách danh sách này ngày càng tốt hơn. 🚀
