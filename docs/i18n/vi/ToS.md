# Điều khoản sử dụng (Terms of Use)

Cập nhật lần cuối: 2026-09-18

Áp dụng từ: khi phát hành phiên bản 4.0.0.

Bản dịch từ bản tiếng Anh cập nhật ngày 2026-09-18 (English source revision 2026-09-18). Nếu có khác biệt, bản tiếng Anh được ưu tiên.

Bản tiếng Anh: [`docs/ToS.md`](../../ToS.md).

Các Điều khoản sử dụng này ("Điều khoản") điều chỉnh việc bạn sử dụng website **https://freeitchgames.win**, các ứng dụng desktop và Android, và dữ liệu catalog công khai của `free-games-itchio-list`. Văn bản được viết bằng ngôn ngữ dễ hiểu, nhưng đây là một thỏa thuận thực sự. Điều khoản này thay thế bản Điều khoản cũ và bao gồm cả những gì trước đây nằm trong "EULA" của web app cũ; [EULA](EULA.md) giờ chỉ áp dụng cho các bộ cài ứng dụng và file APK Android.

> **Tóm tắt**: Cứ thoải mái duyệt, chia sẻ, fork code (MIT) và dùng lại dữ liệu kèm ghi nguồn (CC BY 4.0). Đừng scrape hàng loạt website (hãy dùng các file `/data`), đừng hotlink `/img`, đừng spam form Suggest, đừng mò vào `/admin`, và đừng giả danh itch.io hay Người duy trì. Người làm game có thể yêu cầu gỡ hoặc sửa thông tin game của mình. Nội dung người lớn luôn bị ẩn trừ khi bạn chủ động bật.

## 1. Định nghĩa

- **"Website"**: https://freeitchgames.win, bao gồm các trang và endpoint của nó (như `/data`, `/img`, `/suggest` và `/api/…`). Địa chỉ cũ https://poli0981.github.io/free-games-itchio-list/ chỉ chuyển hướng về đây.
- **"Ứng dụng"**: các ứng dụng desktop (Windows, macOS, Linux) và file APK Android, được build từ cùng một mã nguồn và phân phối trên GitHub Releases. Đây là các ứng dụng chỉ đọc, dùng để xem Danh mục.
- **"Danh mục"** (Catalog): danh sách game và dữ liệu của chúng, gồm `data_game/`, `scripts/deleted_games.json`, và các file được tạo ra từ đó, phục vụ tại https://freeitchgames.win/data.
- **"Repository"**: https://github.com/poli0981/free-games-itchio-list, bao gồm code, dữ liệu, tài liệu, issue và discussion.
- **"Dự án"**: Website, Ứng dụng, Danh mục và Repository nói chung.
- **"Game"**: các game trên itch.io mà Danh mục liệt kê và liên kết tới.
- **"Người duy trì"** (Maintainer): poli0981 (SkullMute), một cá nhân tại Việt Nam vận hành Dự án như một sở thích.
- **"Bạn"**: bất kỳ người nào, hoặc bất kỳ tác nhân tự động nào, sử dụng Dự án.

## 2. Chấp nhận và độ tuổi

- Khi sử dụng Website hoặc Ứng dụng, bạn đồng ý với các Điều khoản này và với các chính sách được dẫn chiếu: [Chính sách quyền riêng tư (Privacy Policy)](PrivacyPolicy.md), [Tuyên bố miễn trừ trách nhiệm (Disclaimer)](DISCLAIMER.md) và, đối với Ứng dụng, [EULA](EULA.md).
- Trong lần truy cập đầu tiên, Website và Ứng dụng hiển thị một màn hình pháp lý (legal gate) liệt kê các văn bản này. Bạn chấp nhận bằng cách đánh dấu vào ô xác nhận và chọn "Chấp nhận & tiếp tục". Nếu bạn từ chối, Website và Ứng dụng sẽ bị khóa; khi đó, vui lòng đừng sử dụng chúng.
- Bạn phải **đủ 16 tuổi trở lên** để sử dụng Website hoặc Ứng dụng; màn hình pháp lý sẽ yêu cầu bạn xác nhận điều này. Để xem nội dung người lớn, bạn phải **đủ 18 tuổi trở lên** (xem mục 8).
- Khi bạn đóng góp qua GitHub (issue, pull request, comment, discussion), các Điều khoản này áp dụng cho đóng góp của bạn, cùng với điều khoản riêng của GitHub và [Quy tắc ứng xử (Code of Conduct)](CODE_OF_CONDUCT.md).

## 3. Dự án là gì (và không phải là gì)

- Một danh mục game miễn phí trên itch.io, được tuyển chọn và cập nhật tự động. Phần lớn dữ liệu của mỗi game được sao chép từ trang itch.io công khai của game đó và được kiểm tra lại theo lịch; chỉ có ba trường (`safe_virus`, `notes`, `nsfw`) do Người duy trì viết.
- Website là **chỉ đọc với tất cả mọi người**: không có tài khoản, không đăng nhập, không bình luận, không quảng cáo và không thanh toán. Khu vực quản trị chỉ dành cho Người duy trì.
- Dự án **không** lưu trữ, bán hay phân phối bất kỳ game nào. Mọi liên kết game đều dẫn tới itch.io, nơi việc tải và chơi game chịu sự điều chỉnh của điều khoản itch.io và điều khoản riêng của từng người làm game.
- Dự án được cung cấp miễn phí, như một sở thích. Không có cam kết mức độ dịch vụ (SLA).

## 4. Những gì bạn được làm

- Duyệt Website và Ứng dụng, và mở các liên kết tới itch.io.
- Chia sẻ liên kết tới Website và tới trang game.
- Tải về và dùng lại dữ liệu Danh mục theo **CC BY 4.0**, kèm ghi nguồn (xem mục 11). Nếu truy cập bằng chương trình, hãy dùng các file JSON được công bố tại https://freeitchgames.win/data hoặc Repository; vui lòng cache chúng thay vì tải lại mỗi lần có request.
- Sử dụng, fork, sửa đổi và phân phối lại code theo **Giấy phép MIT**.
- Đề xuất một game itch.io miễn phí trên trang Suggest (xem mục 5).
- Báo bug, gửi góp ý và mở pull request qua các template của Repository.
- Yêu cầu gỡ một game hoặc sửa dữ liệu của game đó (xem mục 7).

## 5. Đề xuất và đóng góp

- **Trang Suggest** (https://freeitchgames.win/suggest): bạn có thể gửi một liên kết game itch.io và một ghi chú tùy chọn dài tối đa 500 ký tự. Trang này dùng Cloudflare Turnstile để chống spam và có giới hạn tần suất (rate limit).
- Ghi chú chỉ Người duy trì xem được và sẽ bị xóa sau 180 ngày. **Đừng đưa dữ liệu cá nhân vào ghi chú.** Xem [Chính sách quyền riêng tư](PrivacyPolicy.md).
- Mọi đề xuất đều vào một **hàng đợi duyệt**. Không có gì được đưa vào Danh mục cho tới khi Người duy trì phê duyệt, và Người duy trì không có nghĩa vụ phải chấp nhận hay phản hồi một đề xuất. Sau khi được duyệt, liên kết sẽ được pipeline scrape, và game nào hóa ra là game trả phí sẽ bị loại.
- Chỉ những game **thực sự miễn phí** trên itch.io mới đủ điều kiện. Bản demo của game trả phí, game "name your own price" có mức giá tối thiểu lớn hơn 0, và game chỉ miễn phí trong thời gian khuyến mãi thì không.
- Khi gửi bất cứ thứ gì cho Dự án (đề xuất, issue, pull request hay comment), bạn xác nhận rằng:
  - đó là sản phẩm của chính bạn, hoặc bạn có quyền chia sẻ nó;
  - nó không chứa và không liên kết tới malware, phishing, lừa đảo, doxxing, nội dung vi phạm bản quyền hay nội dung bất hợp pháp;
  - bạn không dùng nó để gửi dữ liệu cá nhân của người khác.
- **Vào sao, ra vậy (inbound = outbound)**: đóng góp cho code được cấp phép theo Giấy phép MIT, còn đóng góp cho dữ liệu và tài liệu được cấp phép theo CC BY 4.0, đúng như các giấy phép mà Dự án đang dùng.
- Issue, pull request và comment được công khai trên GitHub dưới tài khoản của bạn.

## 6. Những gì bạn không được làm

Bạn đồng ý **không**:

1. **Scrape hàng loạt** Website hoặc API của nó, ngoài các file `/data` đã được công bố. Hãy dùng các file JSON trong `/data` hoặc Repository; cách đó tốn ít tài nguyên hơn cho tất cả mọi người.
2. **Lạm dụng image proxy** (`/img`): proxy này chỉ để hiển thị ảnh bìa trên Website. Đừng hotlink các URL `/img` từ website hay ứng dụng khác, và đừng dùng nó để tải ảnh hàng loạt.
3. **Truy cập trái phép các khu vực bị hạn chế**: `/admin`, API quản trị (`/api/admin/…`) và API ingest (`/api/ingest`) chỉ dành cho Người duy trì. Nghiên cứu bảo mật thiện chí luôn được hoan nghênh, theo các quy tắc trong [Security Policy](SECURITY.md).
4. **Spam form Suggest**, hoặc tìm cách vượt qua Turnstile hay giới hạn tần suất (ví dụ bằng script hoặc xoay vòng địa chỉ IP).
5. **Gửi liên kết tới malware**, lừa đảo, phishing hoặc nội dung bất hợp pháp, ở bất kỳ đâu trong Dự án.
6. **Mạo nhận liên kết**: đừng tự nhận là Người duy trì hay là Dự án, đừng giới thiệu một bản fork hay bản sao như thể đó là Dự án chính thức, đừng nói rằng Dự án do itch.io vận hành hoặc bảo trợ, và đừng dùng tên "poli0981" hay "SkullMute" để quảng bá sản phẩm của bạn khi chưa có sự cho phép trước bằng văn bản.
7. **Gây gián đoạn Dự án**: đừng tìm cách làm quá tải, phá hỏng hoặc làm suy giảm hoạt động của Website (ví dụ bằng tấn công từ chối dịch vụ), và đừng dùng Dự án để tạo tải bất hợp lý lên itch.io. Nếu bạn tự chạy code pipeline, bạn tự chịu trách nhiệm tuân thủ điều khoản của itch.io và giữ nguyên nhịp giãn cách request của nó.
8. **Gửi yêu cầu gỡ hoặc khiếu nại bản quyền sai sự thật**, hoặc tự nhận là người làm game hay chủ sở hữu quyền khi bạn không phải.
9. **Quấy rối, đe dọa, doxx hoặc giả danh** bất kỳ ai qua bất kỳ kênh nào liên quan tới Dự án (issue, pull request, discussion, Discord, mạng xã hội).
10. Sử dụng Dự án cho bất kỳ mục đích nào trái pháp luật tại nơi bạn ở hoặc tại Việt Nam.

## 7. Gỡ nội dung và bản quyền

Bất kỳ ai cũng có thể yêu cầu gỡ một game khỏi Danh mục hoặc sửa dữ liệu của game đó. Người làm game và chủ sở hữu quyền đặc biệt được hoan nghênh làm điều này.

**Cách yêu cầu**

- Gửi email tới **takedown@freeitchgames.win**, hoặc
- mở một [issue "Remove a game"](https://github.com/poli0981/free-games-itchio-list/issues/new?template=remove_game.yml) trong Repository (có sẵn phần khiếu nại bản quyền). Issue trên GitHub là công khai, nên hãy dùng email cho những gì bạn không muốn bị công bố.

**Cần cung cấp**

- URL itch.io của game (hoặc trang của game trên Website);
- bạn là ai: người làm game, chủ sở hữu quyền, hoặc người được ủy quyền thay mặt họ;
- lý do (ví dụ: khiếu nại bản quyền, bạn không muốn game được liệt kê, dữ liệu sai, hoặc game không còn miễn phí). Với khiếu nại bản quyền, hãy nêu rõ nội dung nào (ví dụ phần mô tả hay ảnh bìa) mà khiếu nại nhắm tới.

**Điều gì sẽ xảy ra**

- Người duy trì gỡ bản ghi khỏi Danh mục và ghi lại việc gỡ, kèm lý do, trong danh sách công khai các game đã gỡ (https://freeitchgames.win/removed).
- Các bản sao ảnh bìa đã thu nhỏ lưu trên Cloudflare R2 sẽ bị xóa, và các bản đã cache sẽ hết hạn khỏi cache của Cloudflare.
- Lịch sử Git của Repository công khai vẫn giữ các phiên bản dữ liệu trước đây. Người duy trì không thể viết lại lịch sử công khai, trừ trường hợp đặc biệt có yêu cầu bắt buộc về mặt pháp lý. Những bản sao mà người khác đã tạo (fork, dữ liệu đã tải về) nằm ngoài tầm kiểm soát của Người duy trì.
- Mục tiêu: trong vòng **7 ngày**; các yêu cầu pháp lý khẩn cấp được xử lý sớm hơn. Nếu yêu cầu chưa rõ, Người duy trì có thể hỏi thêm.

## 8. Nội dung người lớn (NSFW)

- Các game được gắn cờ `nsfw: Yes` **bị ẩn theo mặc định**, kể cả ảnh bìa.
- Bạn có thể bật nội dung 18+ trong Cài đặt (https://freeitchgames.win/settings) sau khi xác nhận mình **đủ 18 tuổi trở lên**. Khi bật, bạn cũng xác nhận rằng việc xem nội dung đó là hợp pháp tại nơi bạn ở. Lựa chọn này chỉ được lưu trong trình duyệt của bạn (`webapp.prefs`), và bạn có thể tắt nó bất cứ lúc nào.
- Cờ `nsfw` là nhãn được gắn theo khả năng tốt nhất và có thể sai. Hãy tự kiểm tra trang itch.io trước khi tải nếu điều này quan trọng với bạn.

## 9. Game, an toàn và dịch vụ bên thứ ba

- Các Game thuộc về người làm game và được họ cung cấp thông qua itch.io. Dự án không kiểm soát các Game.
- Dự án **không** quét các file tải về. Trường `safe_virus` là ghi chú thủ công, không phải lời bảo đảm. Hãy coi mọi file tải về là không đáng tin cho tới khi bạn tự kiểm tra. Xem [Tuyên bố miễn trừ trách nhiệm](DISCLAIMER.md).
- Dự án dựa vào các dịch vụ bên thứ ba như itch.io, GitHub và Cloudflare; mỗi dịch vụ có điều khoản và chính sách riêng. [Chính sách quyền riêng tư](PrivacyPolicy.md) giải thích mỗi dịch vụ xử lý những gì.

## 10. Không liên kết với itch.io

Dự án **không liên kết với, không được bảo trợ hay tài trợ bởi itch.io** hoặc Leaf Corcoran / itch corp. "itch.io", tên game, logo và các nhãn hiệu khác thuộc về chủ sở hữu tương ứng và chỉ được dùng để nhận diện game và nền tảng. Xem [NOTICE.md](../../../NOTICE.md).

## 11. Sở hữu trí tuệ và giấy phép

- **Code** (mọi thứ trong Repository không được liệt kê bên dưới, như `scripts/`, `webapp/`, `bash/`, workflow và test): **Giấy phép MIT**, Copyright (c) 2025-2026 poli0981 (SkullMute). Xem [`LICENSE`](../../../LICENSE).
- **Dữ liệu Danh mục** (`data_game/`, `scripts/deleted_games.json`, và các file được tạo ra từ đó tại https://freeitchgames.win/data): **CC BY 4.0** cho phần đóng góp của Người duy trì, cụ thể là việc tuyển chọn và sắp xếp bộ sưu tập, ba trường do Người duy trì viết (`safe_virus`, `notes`, `nsfw`), các bản ghi gỡ game, cùng cấu trúc và số liệu thống kê được tạo ra từ dữ liệu. Xem [`data_game/LICENSE.md`](../../../data_game/LICENSE.md) và toàn văn pháp lý trong [`LICENSES/CC-BY-4.0.txt`](../../../LICENSES/CC-BY-4.0.txt).
  - Cách ghi nguồn gợi ý: `Free itch.io games catalog by poli0981 (SkullMute) — https://freeitchgames.win — CC BY 4.0`
- **Không được Dự án cấp phép** (thuộc sở hữu của người khác): mô tả game và mọi văn bản khác do người làm game viết; ảnh bìa, thumbnail và các nội dung đa phương tiện khác; tên game, logo và nhãn hiệu; và các nhãn hiệu của itch.io. Để dùng lại những nội dung này, bạn cần sự cho phép của chủ sở hữu hoặc một ngoại lệ pháp lý áp dụng cho bạn. Các dữ kiện như URL, giá và điểm đánh giá vốn không được bảo hộ quyền tác giả.
- Ảnh bìa hiển thị trên Website là bản sao đã thu nhỏ, chỉ dùng để hiển thị; chúng vẫn thuộc quyền sở hữu của người làm game.
- **Tài liệu** (các file `*.md` ở thư mục gốc của repository và trong `docs/`, bao gồm README và các chính sách này): **CC BY 4.0**.
- **Thành phần bên thứ ba** giữ nguyên giấy phép riêng của chúng. Xem trang About (https://freeitchgames.win/about) và [`docs/THIRD_PARTY.md`](../../THIRD_PARTY.md).

## 12. Không bảo đảm và giới hạn trách nhiệm

- Dự án được cung cấp **"nguyên trạng" ("as is") và "tùy theo khả năng sẵn có" ("as available")**, không kèm bất kỳ bảo đảm nào, kể cả về độ chính xác, tính đầy đủ, tính sẵn sàng, tình trạng miễn phí của game hay độ an toàn. Chi tiết trong [Tuyên bố miễn trừ trách nhiệm](DISCLAIMER.md).
- Trong phạm vi pháp luật cho phép, Người duy trì và những người đóng góp không chịu trách nhiệm cho bất kỳ thiệt hại nào phát sinh từ việc sử dụng Dự án, từ bất kỳ Game hay website bên thứ ba nào truy cập qua Dự án, từ việc ngừng hoạt động, hoặc từ lỗi trong dữ liệu.
- Không điều nào trong các Điều khoản này loại trừ hay giới hạn trách nhiệm mà pháp luật hiện hành không cho phép loại trừ hay giới hạn.

## 13. Thay đổi dịch vụ, kiểm duyệt và chấm dứt

Người duy trì có thể, bất cứ lúc nào và không cần báo trước:

- thay đổi, tạm dừng hoặc ngừng hẳn Website, Ứng dụng hoặc dữ liệu được công bố;
- gỡ hoặc thay đổi bất kỳ nội dung nào (mục game, tài liệu, code);
- từ chối đề xuất, và đóng, khóa hoặc ẩn các issue, pull request hay comment vi phạm các Điều khoản này;
- chặn những người vi phạm các Điều khoản này nhiều lần, và giới hạn hoặc chặn lưu lượng truy cập lạm dụng Website.

Nếu bạn vi phạm các Điều khoản này, quyền sử dụng Website và Ứng dụng của bạn chấm dứt. Mọi quyền bạn đã nhận theo Giấy phép MIT hoặc CC BY 4.0 được điều chỉnh bởi chính các giấy phép đó. Các bản phát hành có tag (`vX.Y.Z`) dự kiến vẫn được giữ trên GitHub Releases, nhưng điều này không được bảo đảm.

## 14. Thay đổi các Điều khoản

- Người duy trì có thể cập nhật các Điều khoản này. Phiên bản mới được công bố trong Repository, kèm ngày `Cập nhật lần cuối` ở đầu văn bản, và các thay đổi quan trọng được ghi trong [CHANGELOG.md](../../../CHANGELOG.md).
- Khi một thay đổi cần bạn chấp nhận lại, giá trị `LEGAL_VERSION` trong Website và Ứng dụng sẽ thay đổi, và màn hình pháp lý sẽ yêu cầu bạn chấp nhận các văn bản đã cập nhật trước khi tiếp tục. Nếu bạn không chấp nhận, vui lòng ngừng sử dụng Website và Ứng dụng.

## 15. Luật áp dụng và giải quyết tranh chấp

- Các Điều khoản này được điều chỉnh bởi pháp luật của **Cộng hòa Xã hội Chủ nghĩa Việt Nam**, không xét đến các nguyên tắc xung đột pháp luật.
- Tranh chấp được giải quyết theo thứ tự sau:
  1. **Trao đổi không chính thức trước**: gửi email tới **legal@freeitchgames.win**, mở một issue, hoặc dùng một kênh liên hệ được liệt kê trên trang About (https://freeitchgames.win/about). Hầu hết bất đồng đều dừng ở đây.
  2. **Hòa giải**: nếu trao đổi không chính thức không thành, các bên có thể thử hòa giải theo thỏa thuận chung.
  3. **Tòa án**: nếu vẫn không được, tòa án có thẩm quyền của Việt Nam sẽ giải quyết.
- **Quyền của người tiêu dùng**: không điều nào trong các Điều khoản này giới hạn các quyền bảo vệ người tiêu dùng mang tính bắt buộc mà bạn có theo pháp luật của quốc gia nơi bạn cư trú, bao gồm mọi quyền mà pháp luật đó cho phép bạn khởi kiện tại tòa án địa phương.

## 16. Tính độc lập của các điều khoản và bản dịch

- Nếu bất kỳ quy định nào trong các Điều khoản này bị coi là vô hiệu hoặc không thể thi hành, các quy định còn lại vẫn giữ nguyên hiệu lực.
- Các bản dịch (như bản tiếng Việt này trong `docs/i18n/vi/`) được cung cấp để thuận tiện cho người đọc. Nếu bản dịch khác với bản tiếng Anh, [bản tiếng Anh](../../ToS.md) được ưu tiên.

## 17. Liên hệ

Các địa chỉ này được Cloudflare Email Routing chuyển tiếp tới Người duy trì.

- **legal@freeitchgames.win**: các Điều khoản này và mọi vấn đề pháp lý khác.
- **takedown@freeitchgames.win**: gỡ nội dung và bản quyền.
- **privacy@freeitchgames.win**: câu hỏi và yêu cầu về quyền riêng tư.
- **security@freeitchgames.win**: lỗ hổng bảo mật (hoặc dùng tính năng báo cáo lỗ hổng riêng tư của GitHub; xem [Security Policy](SECURITY.md)).

## 18. Lời cuối

Đây vẫn chỉ là một danh sách game miễn phí, cộng thêm một website và vài ứng dụng, được làm bởi một dev mệt mỏi với ngân sách bằng 0 và hai người bạn AI. Cứ "be cool", đừng phá đồ, nhớ ghi nguồn dữ liệu, và vui vẻ săn game miễn phí nhé.

Có câu hỏi? Gửi email tới legal@freeitchgames.win, mở một issue, hoặc dùng bất kỳ kênh nào trên trang About. Người duy trì sẽ cố gắng không "ghost".

## 19. Không phải tư vấn pháp lý

Các Điều khoản này là tài liệu của một dự án sở thích, được soạn bởi một người không phải luật sư với sự hỗ trợ của AI. Văn bản này không thay thế cho tư vấn pháp lý chuyên nghiệp.
