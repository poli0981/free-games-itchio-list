# Tuyên bố miễn trừ trách nhiệm (Disclaimer)

Cập nhật lần cuối: 2026-09-18

Áp dụng từ: khi phát hành phiên bản 4.0.0.

> Bản dịch từ bản tiếng Anh cập nhật ngày 2026-09-18 (English source revision 2026-09-18). Nếu có khác biệt, bản tiếng Anh được ưu tiên. Bản gốc: [`docs/DISCLAIMER.md`](../../DISCLAIMER.md).

Dự án này — repository `free-games-itchio-list` và website **[freeitchgames.win](https://freeitchgames.win)** — là một dự án sở thích: một danh mục được tuyển chọn và tự động cập nhật gồm các game miễn phí trên [itch.io](https://itch.io). Dự án do một dev người Việt đang thất nghiệp, poli0981 (SkullMute), vận hành — dưới đây gọi là "Người duy trì" — với các trợ lý AI gánh phần lớn việc nặng. Làm ra vì vibes, để khám phá game indie và giải khuây. Không hứa hẹn gì lớn lao — nhưng các điều khoản mang tính pháp lý dưới đây là thật.

> **Tóm tắt**: Website, các ứng dụng và dữ liệu được cung cấp theo nguyên trạng. Dự án chỉ liên kết tới game; Dự án không làm, không lưu trữ và không quét game, và không liên kết với itch.io. Game người lớn bị ẩn trừ khi bạn tự bật. Hãy quét mọi thứ bạn tải về. Nếu bạn là người làm game và muốn gỡ game của mình, hãy email **takedown@freeitchgames.win**.

## 1. Phạm vi áp dụng

Tuyên bố này áp dụng cho (gọi chung là "Dự án"):

- website **https://freeitchgames.win**, bao gồm trang Suggest công khai — chỉ đọc với tất cả mọi người, không có tài khoản;
- các ứng dụng desktop (Windows, macOS, Linux) và file APK Android được phát hành trên GitHub Releases;
- dữ liệu catalog: `data_game/`, `scripts/deleted_games.json` và các file được phục vụ tại https://freeitchgames.win/data;
- mã nguồn, pipeline dữ liệu và tài liệu trong repository này.

Tuyên bố này đi kèm [Điều khoản sử dụng](ToS.md), [Chính sách quyền riêng tư](PrivacyPolicy.md) và, đối với ứng dụng desktop và Android, [EULA](EULA.md).

## 2. Cơ sở "AS IS" (nguyên trạng)

Dự án — bao gồm dữ liệu catalog, pipeline Python (`scripts/`) cùng các workflow GitHub Actions, website và mã phía server (`webapp/`), ứng dụng desktop và Android (`webapp/src-tauri/`), và tài liệu — được cung cấp theo nguyên trạng (**"AS IS"** / **"AS AVAILABLE"**), không kèm bất kỳ bảo đảm nào, dù minh thị hay ngầm định, bao gồm nhưng không giới hạn ở các bảo đảm về tính thương mại, sự phù hợp cho một mục đích cụ thể, độ chính xác, tính đầy đủ, không xâm phạm quyền, hoặc hoạt động không gián đoạn hay không có lỗi.

## 3. Không liên kết với itch.io

Dự án hoạt động độc lập. Dự án **không liên kết với, không được chứng thực hay tài trợ bởi** itch.io, itch corp hay Leaf Corcoran, cũng như bởi bất kỳ nhà phát triển hay nhà phát hành nào có game trong catalog. Tên "itch.io" cùng mọi tên game, logo và nhãn hiệu thuộc về chủ sở hữu tương ứng; chúng chỉ được dùng để nhận diện game và nơi game được lưu trữ. Việc một game có mặt trong danh sách không có nghĩa là người làm game ủng hộ, hay thậm chí biết đến, Dự án.

## 4. Danh mục liên kết, không phải nơi lưu trữ game

Dự án **không làm, không lưu trữ, không phân phối, không bán và không chứng thực** các game được liệt kê. Mỗi game liên kết tới trang riêng của nó trên itch.io, và mọi lượt tải về đều diễn ra tại đó, theo điều khoản của itch.io và điều khoản hoặc giấy phép riêng của người làm game.

Game được đưa vào catalog qua trang Suggest công khai, tiện ích trình duyệt của Người duy trì, hoặc các RSS feed công khai của itch.io, và không có gì được thêm vào cho đến khi Người duy trì duyệt. Việc duyệt đó **không phải** là kiểm tra bảo mật, đánh giá chất lượng hay sự chứng thực.

## 5. Không bảo đảm về các game

Người duy trì không bảo đảm bất cứ điều gì về một game được liệt kê, bao gồm:

- **Chất lượng, độ vui hoặc khả năng chơi được** — có game là viên ngọc quý, có game thì "jank", đa số ở giữa. Tùy gu bạn.
- **Tính an toàn, toàn vẹn hoặc không có mã độc** — Dự án **không** quét các bản tải về. Trường `safe_virus` (`?`, `Yes`, `No`, `Caution`) là ghi chú thủ công của Người duy trì, không phải lời bảo đảm, và game mới luôn bắt đầu với `?`. Hãy coi mọi bản tải về là không đáng tin cho đến khi bạn tự kiểm tra bằng phần mềm chống mã độc uy tín.
- **Nội dung** — xem [§6](#6-nội-dung-người-lớn-nsfw) về nội dung người lớn.
- **Độ chính xác của metadata** — tên, nhà phát triển, mô tả, thể loại, tag, đánh giá, nền tảng và các trường khác được sao chép từ trang itch.io công khai và phản ánh trang đó tại lần kiểm tra gần nhất. Lượt refresh hằng ngày kiểm tra lại khoảng một phần bảy catalog mỗi ngày, tức mỗi game khoảng một lần mỗi tuần; các thay đổi trên itch.io (đổi tên, gỡ game, đổi giá) có thể mất chừng ấy thời gian mới được cập nhật.
- **Trạng thái miễn phí** — được kiểm tra khi thêm game và ở mỗi lần kiểm tra lại, nhưng game có thể chuyển sang trả phí hoặc biến mất khỏi itch.io bất cứ lúc nào. Để tránh gỡ nhầm game vì trục trặc tạm thời, Dự án chỉ gỡ một game khi cùng một vấn đề (trang không còn — HTTP 404/410 — hoặc game đã chuyển sang trả phí) được thấy lại sau ít nhất 20 giờ. Vì vậy một game trong danh sách có thể bị lỗi thời trong một khoảng thời gian.
- **Thống kê và biểu đồ** — các con số, biểu đồ và số liệu khác được tính từ catalog và chỉ mang tính tham khảo.

## 6. Nội dung người lớn (NSFW)

- Các game có cờ `nsfw: Yes` **bị ẩn theo mặc định** (ảnh bìa cũng không hiển thị). Bạn chỉ có thể bật nội dung 18+ trong **Settings** sau khi xác nhận mình đủ 18 tuổi trở lên. Lựa chọn này chỉ được lưu trên thiết bị của bạn (local storage của trình duyệt) và không bao giờ được gửi tới Dự án.
- Cờ này chỉ mang tính cố gắng tối đa (best-effort). Ban đầu nó được đặt tự động dựa trên tag và mô tả của game trên itch.io khi game được thêm, và Người duy trì có thể sửa lại. Một game vẫn có thể bị gắn nhãn sai theo cả hai chiều, nên hãy kiểm tra trang itch.io (và các cảnh báo nội dung của chính trang đó) trước khi tải nếu điều này quan trọng với bạn. Để báo cờ bị sai, hãy dùng quy trình yêu cầu ở [§8](#8-yêu-cầu-gỡ-và-sửa-thông-tin).
- Dự án không hướng tới trẻ em dưới 16 tuổi, và nội dung người lớn chỉ dành cho người trưởng thành tự chọn xem.

## 7. Nội dung của bên thứ ba và quyền sở hữu

Với mỗi game, Dự án sao chép từ trang itch.io công khai của game: tên, nhà phát triển, phần mô tả, thể loại, tag và các metadata khác, cùng URL ảnh bìa. Website hiển thị các bản sao đã thu nhỏ của ảnh bìa, được lưu trên Cloudflare R2 và phục vụ từ freeitchgames.win; ứng dụng desktop và Android tải ảnh bìa trực tiếp từ CDN ảnh của itch.io (`img.itch.zone`).

Mô tả game và mọi văn bản khác do người làm game viết, ảnh bìa và các nội dung đa phương tiện khác, tên game, logo và nhãn hiệu **vẫn thuộc quyền sở hữu của người tạo ra và chủ sở hữu của chúng**. Dự án không cấp phép những nội dung này cho bất kỳ ai: giấy phép CC BY 4.0 cho dữ liệu catalog ([`data_game/LICENSE.md`](../../../data_game/LICENSE.md)) chỉ bao gồm phần đóng góp riêng của Người duy trì — việc tuyển chọn và sắp xếp bộ sưu tập, ba trường do Người duy trì viết (`safe_virus`, `notes`, `nsfw`), các bản ghi gỡ game, cấu trúc và số liệu thống kê phái sinh — và loại trừ rõ ràng các nội dung của bên thứ ba nói trên. Nếu bạn tái sử dụng dữ liệu, việc xin phép đối với phần nội dung bị loại trừ là trách nhiệm của bạn.

Nếu bạn là người làm game hoặc chủ sở hữu quyền và không muốn nội dung của mình xuất hiện ở đây, xem [§8](#8-yêu-cầu-gỡ-và-sửa-thông-tin).

## 8. Yêu cầu gỡ và sửa thông tin

Bất kỳ ai — đặc biệt là người làm game và chủ sở hữu quyền — đều có thể yêu cầu gỡ một game hoặc sửa dữ liệu của game đó:

- gửi email tới **takedown@freeitchgames.win**, hoặc
- mở một [issue "Remove a game"](https://github.com/poli0981/free-games-itchio-list/issues/new?template=remove_game.yml) trên GitHub (biểu mẫu này cũng dùng cho khiếu nại bản quyền). Issue trên GitHub là công khai, nên hãy dùng email cho những gì bạn muốn giữ riêng tư.

Vui lòng ghi rõ URL itch.io của game, bạn là ai (người làm game hoặc chủ sở hữu quyền, hoặc người được họ ủy quyền), và lý do yêu cầu.

Những gì diễn ra tiếp theo:

- Người duy trì gỡ bản ghi khỏi catalog. Việc gỡ được ghi lại kèm lý do trong danh sách công khai các game đã gỡ (`scripts/deleted_games.json`, hiển thị tại https://freeitchgames.win/removed).
- Các bản sao ảnh bìa đã thu nhỏ lưu trên Cloudflare R2 bị xóa, và các bản sao lưu đệm sẽ hết hạn khỏi bộ nhớ đệm (cache) của Cloudflare.
- Các phiên bản cũ của dữ liệu vẫn còn trong lịch sử git công khai của repository. Người duy trì không thể viết lại lịch sử công khai, trừ trường hợp ngoại lệ khi pháp luật buộc phải làm vậy.
- Mục tiêu: trong vòng 7 ngày; các yêu cầu pháp lý khẩn cấp được xử lý sớm hơn.

Quy trình đầy đủ được mô tả trong [Điều khoản sử dụng](ToS.md). Gỡ một game khỏi catalog không có nghĩa là gỡ game đó khỏi itch.io.

## 9. Tính sẵn sàng và dịch vụ bên thứ ba

Website chạy trên Cloudflare; mã nguồn, dữ liệu và bản tải ứng dụng nằm trên GitHub; còn catalog phụ thuộc vào các trang và feed công khai của itch.io. Bất kỳ dịch vụ nào trong số này đều có thể chậm, ngừng hoạt động, thay đổi hoặc bị chặn bất cứ lúc nào. Người duy trì có thể thay đổi, tạm dừng hoặc chấm dứt bất kỳ phần nào của Dự án vào bất cứ lúc nào và không hứa rằng Dự án sẽ luôn trực tuyến.

## 10. Không chịu trách nhiệm pháp lý

Trong phạm vi tối đa mà pháp luật hiện hành cho phép, Người duy trì và những người đóng góp không chịu trách nhiệm đối với bất kỳ thiệt hại trực tiếp, gián tiếp, ngẫu nhiên, hệ quả, đặc biệt, mang tính răn đe hay trừng phạt nào phát sinh từ hoặc liên quan tới:

- việc sử dụng website, các ứng dụng, dữ liệu catalog, hoặc bất kỳ mã nguồn hay tài liệu nào trong Dự án;
- việc không thể sử dụng những thứ trên (ví dụ: website ngừng hoạt động, deploy lỗi, hoặc bộ cài hay file APK bị hỏng);
- bất kỳ game nào được truy cập qua liên kết trong catalog (crash, mất save, mất dữ liệu, hư hỏng phần cứng, mã độc, bị chiếm tài khoản trên nền tảng bên thứ ba, hoặc cảm giác hối tiếc);
- lỗi, thiếu sót hoặc sai lệch trong dữ liệu catalog.

Điều này áp dụng kể cả khi Người duy trì đã được báo trước về khả năng xảy ra các thiệt hại đó. Không điều gì trong Tuyên bố này loại trừ hoặc giới hạn trách nhiệm mà pháp luật không cho phép loại trừ hoặc giới hạn, hay bất kỳ quyền bảo vệ người tiêu dùng bắt buộc nào mà bạn có theo pháp luật của quốc gia nơi bạn cư trú.

## 11. Luật áp dụng và tính độc lập của các điều khoản

Tuyên bố này được điều chỉnh bởi pháp luật của **Cộng hòa Xã hội Chủ nghĩa Việt Nam**, không xét đến các nguyên tắc xung đột pháp luật, và tranh chấp được giải quyết như mô tả trong [Điều khoản sử dụng](ToS.md). Không điều gì trong mục này giới hạn các quyền bảo vệ người tiêu dùng bắt buộc của quốc gia nơi bạn cư trú. Nếu bất kỳ điều khoản nào bị coi là không thể thi hành tại một khu vực tài phán cụ thể, các điều khoản còn lại vẫn giữ nguyên hiệu lực.

## 12. Liên hệ

- Yêu cầu gỡ, sửa thông tin và khiếu nại bản quyền: **takedown@freeitchgames.win**
- Câu hỏi và yêu cầu về quyền riêng tư: **privacy@freeitchgames.win**
- Các vấn đề pháp lý khác: **legal@freeitchgames.win**

Các địa chỉ này được chuyển tiếp tới Người duy trì.

## 13. Không phải tư vấn pháp lý

Không nội dung nào trong tài liệu này là tư vấn pháp lý. Đây là tuyên bố miễn trừ của một dự án sở thích, được soạn bởi một người không phải luật sư với sự hỗ trợ của AI, và hiệu lực thi hành của nó phụ thuộc vào pháp luật nơi bạn sinh sống. Nếu bạn thực sự cần sự chắc chắn về mặt pháp lý cho việc gì đó, hãy thuê một luật sư thật.

## 14. Lời cuối

Đây vẫn chỉ là một danh sách game miễn phí do một dev mệt mỏi và vài LLM làm ra. Chơi vui, giữ an toàn, quét file tải về, và nhớ rằng: đời quá ngắn để lôi một repo GitHub ngẫu nhiên ra tòa.

Built with boredom, AI buddies, và niềm mong mỏi sâu sắc là sẽ không bao giờ phải đối mặt với một vụ kiện thật. 🚀
