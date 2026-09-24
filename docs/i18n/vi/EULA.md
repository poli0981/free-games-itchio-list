# Thỏa thuận cấp phép cho người dùng cuối (EULA)

Cập nhật lần cuối: 2026-09-24

Áp dụng từ: khi phát hành phiên bản 4.1.0.

Bản dịch từ bản tiếng Anh cập nhật ngày 2026-09-24 (English source revision 2026-09-24). Nếu có khác biệt, bản tiếng Anh được ưu tiên.

> Bản tiếng Anh: [`docs/EULA.md`](../../EULA.md).

EULA này **chỉ áp dụng cho ứng dụng desktop và ứng dụng Android** của Itch.io Free Games DB: các bộ cài (`.msi`, `.exe`, `.dmg`, `.pkg`, `.app.tar.gz`, `.deb`, `.rpm`, `.AppImage`) và file `.apk` Android được phát hành trên GitHub Releases. EULA này **không** áp dụng cho:

- website <https://freeitchgames.win>, được điều chỉnh bởi [Điều khoản sử dụng](ToS.md);
- mã nguồn, theo [Giấy phép MIT](../../../LICENSE);
- dữ liệu catalog, theo CC BY 4.0 (xem [`data_game/LICENSE.md`](../../../data_game/LICENSE.md) và [toàn văn pháp lý của giấy phép](../../../LICENSES/CC-BY-4.0.txt));
- bản thân các game, vốn được nhà phát triển cấp phép riêng thông qua itch.io.

> **Tóm tắt**: Các ứng dụng là trình xem catalog miễn phí, chỉ đọc, theo giấy phép MIT. Không tài khoản, không quảng cáo, không telemetry. Chỉ tải chúng từ GitHub Releases, tự cập nhật bằng tay, và tự chịu rủi ro khi sử dụng. Game không phải của bạn chỉ vì chúng được liệt kê ở đây.

## 1. Định nghĩa

- **"Ứng dụng"**: các bản build Tauri 2 của Itch.io Free Games DB, gồm ứng dụng desktop cho Windows, macOS và Linux và ứng dụng Android (arm64-v8a, Android 11 trở lên), do Người duy trì phát hành trên [trang GitHub Releases](https://github.com/poli0981/free-games-itchio-list/releases).
- **"Website"**: <https://freeitchgames.win>.
- **"Catalog"**: metadata các game miễn phí trong `data_game/`, được Website công bố tại <https://freeitchgames.win/data> và được Ứng dụng hiển thị.
- **"Repository"**: `free-games-itchio-list` trên GitHub tại <https://github.com/poli0981/free-games-itchio-list>, nơi chứa mã nguồn của Ứng dụng.
- **"Người duy trì"**: GitHub user `poli0981` (alias: SkullMute), một cá nhân tại Việt Nam duy trì dự án như một sở thích.
- **"Bạn"**: cá nhân hoặc tổ chức cài đặt hoặc sử dụng Ứng dụng.

## 2. Cấp phép

Ứng dụng được build từ mã nguồn trong Repository, vốn được cấp phép theo **Giấy phép MIT** (xem [`LICENSE`](../../../LICENSE) cho văn bản gốc; `Copyright (c) 2025-2026 poli0981 (SkullMute)`). Theo giấy phép đó, Bạn được phép, hoàn toàn miễn phí:

- cài đặt và chạy Ứng dụng trên bao nhiêu thiết bị tùy ý, cho bất kỳ mục đích nào, cá nhân hay thương mại;
- sao chép và phân phối lại các bộ cài hoặc file APK, miễn là giữ nguyên thông báo bản quyền và giấy phép;
- tự build phiên bản riêng từ mã nguồn (mục 8 giải thích cách giữ cho bản đó tách biệt rõ ràng với các bản phát hành chính thức).

Các thành phần bên thứ ba đi kèm trong Ứng dụng (React, Tauri và các thành phần khác) vẫn theo giấy phép riêng của chúng. Xem [`THIRD_PARTY.md`](../../THIRD_PARTY.md) hoặc trang Giới thiệu (About) trong Ứng dụng.

Không điều gì trong EULA này lấy đi quyền mà Giấy phép MIT trao cho Bạn đối với mã nguồn. Nếu hai văn bản mâu thuẫn, Giấy phép MIT được ưu tiên đối với phần mã.

## 3. Ứng dụng là gì (và không phải là gì)

- Một **trình xem chỉ đọc**: Bạn có thể duyệt, tìm kiếm, lọc và xem biểu đồ của Catalog. Không có tài khoản, không đăng nhập, không chỉnh sửa, không bình luận, không quảng cáo và không thanh toán.
- Việc đề xuất game được thực hiện trên Website (<https://freeitchgames.win/suggest>). Ứng dụng chỉ dẫn link tới đó.
- Các game được gắn cờ nội dung người lớn (`nsfw: Yes`) bị ẩn theo mặc định, kể cả ảnh bìa. Bạn có thể bật chúng trong trang Cài đặt (Settings) sau khi xác nhận mình từ 18 tuổi trở lên.
- Trường `safe_virus` là ghi chú thủ công của Người duy trì, không phải lời bảo đảm. Dự án không quét bất kỳ game hay file tải về nào được liên kết từ Ứng dụng.
- Ở lần mở đầu tiên, Ứng dụng hiển thị cùng màn hình pháp lý như Website và yêu cầu Bạn chấp nhận các điều khoản của dự án. Màn hình này sẽ hỏi lại khi các điều khoản đó thay đổi.

## 4. Kết nối mạng và quyền riêng tư

Ứng dụng **không có telemetry**: không analytics, không báo cáo lỗi (crash reporting), không theo dõi. Ứng dụng chỉ kết nối tới hai nơi:

- **freeitchgames.win**, để tải file JSON của Catalog từ <https://freeitchgames.win/data>. Website chạy trên Cloudflare; Cloudflare xử lý dữ liệu yêu cầu thông thường (như địa chỉ IP và user agent của Bạn) để phân phối nội dung, như mô tả trong [Chính sách quyền riêng tư (Privacy Policy)](PrivacyPolicy.md).
- **img.itch.zone**, máy chủ ảnh của itch.io, để tải trực tiếp ảnh bìa. itch.io nhận dữ liệu yêu cầu thông thường cho các ảnh đó, như với bất kỳ ảnh nào được tải từ web (xem [chính sách quyền riêng tư của itch.io](https://itch.io/docs/legal/privacy-policy)).

Khi Bạn bấm vào một game hoặc một link bên ngoài khác, link đó sẽ mở trong trình duyệt mặc định của Bạn (itch.io, GitHub hoặc Website). Từ lúc đó, điều khoản và chính sách quyền riêng tư của chính trang đó được áp dụng.

Ứng dụng lưu các tùy chọn của Bạn (ngôn ngữ, giao diện sáng/tối, mật độ bố cục, lựa chọn 18+, và phiên bản điều khoản pháp lý Bạn đã chấp nhận) cùng một bản sao lưu đệm (cache) của Catalog (giữ tối đa 7 ngày) chỉ trên thiết bị của Bạn. Không dữ liệu nào trong số đó được gửi cho Người duy trì.

## 5. Cài đặt ứng dụng, cập nhật và gỡ bỏ

- **Chỉ tải Ứng dụng từ [trang GitHub Releases](https://github.com/poli0981/free-games-itchio-list/releases).** Bản sao từ bất kỳ nơi nào khác có thể đã bị sửa đổi, và Người duy trì không chịu trách nhiệm về chúng.
- **Android:** file APK không có trên Google Play. Nó được cài thủ công (sideload), nên Android sẽ yêu cầu Bạn cho phép cài ứng dụng từ ứng dụng mà Bạn dùng để tải file về (ví dụ trình duyệt hoặc trình quản lý file). APK được ký bằng khóa của dự án. Ứng dụng cần Android 11 trở lên trên thiết bị arm64-v8a.
- **macOS:** Ứng dụng cần Safari/WebKit 16.4 trở lên.
- **Cập nhật thủ công.** Ứng dụng không tự cập nhật và không tự kiểm tra bản mới. Để cập nhật, hãy tải và cài một bản phát hành mới hơn. Chỉ bản phát hành mới nhất được hỗ trợ.
- **Gỡ bỏ:** gỡ cài đặt Ứng dụng như mọi ứng dụng khác. Việc gỡ cài đặt sẽ xóa Ứng dụng và dữ liệu cục bộ của nó. Nếu trình gỡ cài đặt trên desktop để lại thư mục dữ liệu của Ứng dụng (thư mục có tên `com.poli0981.freegamesitchio`), Bạn có thể tự xóa thư mục đó.
- Ứng dụng phụ thuộc vào Website để lấy dữ liệu. Nếu Website không truy cập được, Ứng dụng chỉ có thể hiển thị bản sao lưu đệm, nếu có.

## 6. Những gì EULA này KHÔNG bao phủ

EULA này không cấp quyền nào đối với:

- **Các game được liệt kê trong Catalog.** Mỗi game thuộc về nhà phát triển của nó và được họ cấp phép thông qua itch.io. Ứng dụng chỉ hiển thị link và metadata. Việc tải về, chơi, sửa đổi hoặc phân phối lại một game được điều chỉnh bởi điều khoản riêng của nhà phát triển và điều khoản của itch.io.
- **Nội dung do người khác tạo ra**: tên game, mô tả và các văn bản khác do nhà sáng tạo game viết, ảnh bìa và các nội dung đa phương tiện khác, logo và nhãn hiệu. Chúng được hiển thị để Bạn tìm và nhận diện game, và vẫn thuộc sở hữu của chủ sở hữu. Nhà sáng tạo game có thể yêu cầu gỡ bỏ (xem [Điều khoản sử dụng](ToS.md) hoặc gửi email tới takedown@freeitchgames.win).
- **Nhãn hiệu, logo hoặc nhãn hiệu dịch vụ của itch.io.** Dự án không liên kết với itch.io, cũng không được itch.io chứng thực hay tài trợ. Tên itch.io chỉ được dùng để nhận diện.
- **Thư viện bên thứ ba** đi kèm trong Ứng dụng, vốn vẫn theo giấy phép riêng của chúng.
- **Website, dữ liệu Catalog và mã nguồn**, lần lượt được điều chỉnh bởi Điều khoản sử dụng, CC BY 4.0 và Giấy phép MIT.

## 7. Chấp nhận

Bạn chấp nhận EULA này khi cài đặt hoặc sử dụng Ứng dụng, ví dụ khi chấp nhận EULA trong bộ cài Windows hoặc khi cài file APK. Nếu Bạn không đồng ý, đừng cài Ứng dụng, hoặc hãy gỡ cài đặt nó.

## 8. Quy tắc sử dụng

Bạn đồng ý không:

- Trình bày một bản build đã sửa đổi như một bản phát hành chính thức, ví dụ phân phối nó dưới tên và biểu tượng của dự án, hoặc với app identifier chính thức `com.poli0981.freegamesitchio`, mà không ghi rõ đó là bản không chính thức. Fork luôn được chào đón theo Giấy phép MIT; chỉ cần làm rõ rằng đó là bản của Bạn.
- Sử dụng tên Người duy trì, GitHub handle `poli0981`, hoặc alias "SkullMute" để chứng thực hoặc quảng bá tác phẩm phái sinh mà không có sự cho phép trước bằng văn bản.
- Sử dụng Ứng dụng, hoặc một phiên bản đã sửa đổi của nó, theo cách vi phạm [Điều khoản sử dụng](ToS.md) của Website, ví dụ gửi yêu cầu tự động hàng loạt vượt ngoài các file `/data` đã công bố, hoặc cố truy cập khu vực quản trị (admin) hay ingest API khi không được phép.
- Sử dụng Ứng dụng hoặc các bộ cài của nó để lưu trữ, phân phối hoặc tạo điều kiện phân phối malware, trang phishing, hoặc nội dung vi phạm pháp luật hiện hành.

Các quy tắc này là về cách Bạn sử dụng Ứng dụng cũng như tên và dịch vụ của dự án. Chúng tồn tại song song với Giấy phép MIT và không hạn chế các quyền mà giấy phép đó trao đối với mã nguồn.

## 9. Không bảo đảm và giới hạn trách nhiệm

Ứng dụng được cung cấp **"nguyên trạng"** ("as is") và **"tùy theo khả năng sẵn có"** ("as available"), không kèm bất kỳ bảo đảm nào, dù rõ ràng hay ngụ ý, bao gồm bảo đảm về khả năng thương mại, sự phù hợp cho một mục đích cụ thể, tính chính xác hoặc đầy đủ của Catalog, hoạt động không gián đoạn, và việc không vi phạm quyền.

Trong phạm vi pháp luật hiện hành cho phép, Người duy trì và những người đóng góp không chịu trách nhiệm về bất kỳ thiệt hại nào phát sinh từ việc cài đặt hoặc sử dụng Ứng dụng, từ việc không thể sử dụng nó, hoặc từ các game và trang mà Bạn truy cập thông qua nó. Xem [Tuyên bố miễn trừ trách nhiệm](DISCLAIMER.md) để biết chi tiết.

## 10. Thay đổi và chấm dứt

Người duy trì có thể thay đổi hoặc dừng Ứng dụng, các bản phát hành của nó hoặc Website bất kỳ lúc nào. Các bản phát hành đã công bố vẫn được giữ trên GitHub Releases trừ khi được rút lại một cách rõ ràng.

Các phiên bản mới của EULA này được công bố trong Repository và đi kèm các bản phát hành sau, và màn hình pháp lý của Ứng dụng sẽ hỏi lại Bạn khi các điều khoản của dự án thay đổi.

Quyền của Bạn theo EULA này tự động chấm dứt nếu Bạn vi phạm nghiêm trọng. Bạn có thể chấm dứt EULA bất kỳ lúc nào bằng cách gỡ cài đặt Ứng dụng. Quyền được cấp theo Giấy phép MIT đối với mã nguồn vẫn còn hiệu lực sau khi EULA này chấm dứt, trong phạm vi mà điều khoản MIT cho phép.

## 11. Luật áp dụng

EULA này được điều chỉnh bởi pháp luật của **Cộng hòa Xã hội Chủ nghĩa Việt Nam**, không xét đến các nguyên tắc xung đột pháp luật. Bất kỳ tranh chấp nào không thể giải quyết một cách không chính thức sẽ được đưa ra tòa án có thẩm quyền của Việt Nam.

Không điều gì trong EULA này hạn chế các quyền bắt buộc về bảo vệ người tiêu dùng mà pháp luật tại quốc gia Bạn cư trú trao cho Bạn.

Bản thân Giấy phép MIT có tính khả chuyển quốc tế và được giải thích như vậy.

## 12. Tính độc lập của điều khoản

Nếu bất kỳ điều khoản nào của EULA này bị coi là vô hiệu hoặc không thể thực thi tại một khu vực tài phán, các điều khoản còn lại vẫn giữ nguyên hiệu lực, và điều khoản vô hiệu sẽ được thay thế (chỉ tại khu vực tài phán đó) bằng điều khoản gần nhất với ý định ban đầu.

## 13. Liên hệ

- Câu hỏi về EULA này, hoặc bất kỳ vấn đề pháp lý nào khác: legal@freeitchgames.win
- Yêu cầu về quyền riêng tư: privacy@freeitchgames.win
- Gỡ bỏ nội dung và bản quyền: takedown@freeitchgames.win
- Lỗ hổng bảo mật trong Ứng dụng: security@freeitchgames.win hoặc tính năng báo cáo lỗ hổng riêng tư của GitHub (xem [SECURITY.md](SECURITY.md)). Vui lòng không mở issue công khai cho lỗ hổng bảo mật.

## 14. Không phải tư vấn pháp lý

EULA này là tài liệu cho một dự án sở thích, được soạn bởi một người không phải luật sư, có hỗ trợ của AI. Nó không thay thế tư vấn pháp lý chuyên nghiệp. Nếu Bạn cần sự chắc chắn về pháp lý cho một triển khai nghiêm túc, hãy tham khảo ý kiến luật sư có giấy phép hành nghề.

## 15. Lời cuối

Đây vẫn là một dự án sở thích sinh ra từ thất nghiệp, buồn chán và sự bướng bỉnh không chịu xóa repo. Cài app, fork nó, hay kệ nó. Xây thứ gì đó hay hơn. Vui vẻ săn game miễn phí, hoặc không. Không ai phán xét (có lẽ trừ Người duy trì, đang tự phán xét code của chính mình).

Built with zero budget, too much free time, and two AI buddies. 🚀

**P/S:** Không ai đọc EULA cả. Chắc bạn là người đầu tiên :D
