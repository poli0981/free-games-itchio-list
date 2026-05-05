# Tuyên bố miễn trừ trách nhiệm (Disclaimer)

Cập nhật lần cuối: 2026-05-05

> **Lưu ý**: Đây là bản dịch tiếng Việt mang tính tham khảo cho cộng đồng. **Bản tiếng Anh tại [`docs/DISCLAIMER.md`](../../DISCLAIMER.md) là bản chính thức** và sẽ được dùng để giải thích trong trường hợp có khác biệt giữa hai phiên bản.

Repository này — `free-games-itchio-list` — là một dự án sở thích: một danh mục các game miễn phí đang được lưu trữ trên [itch.io](https://itch.io), được duy trì bởi một dev người Việt đang thất nghiệp cùng hai trợ lý AI (Grok và Claude Code). Mục đích: vibes, khám phá indie game, và giải sầu lúc rảnh. Không hứa hẹn gì lớn lao — nhưng các điều khoản dạng pháp lý dưới đây là thật.

> **Tóm tắt**: Sử dụng catalog, webapp và desktop app dưới đây mọi rủi ro thuộc về bạn. Người duy trì không cam kết bảo đảm gì, không chịu trách nhiệm pháp lý, và không chịu trách nhiệm về các game được liên kết tại đây.

## 1. Cơ sở "AS IS"

Toàn bộ nội dung trong repository này — bao gồm nhưng không giới hạn ở: catalog JSON (`data_game/`), bảng được tạo tự động (`lists/`), pipeline Python (`scripts/`), webapp (`webapp/`), Tauri desktop wrapper (`webapp/src-tauri/`) và tài liệu — được cung cấp theo nguyên trạng (**"AS IS"** / **"AS AVAILABLE"**), không có bất kỳ bảo đảm nào dù là minh thị hay ngầm định, bao gồm nhưng không giới hạn ở các bảo đảm về tính thương mại, sự phù hợp với một mục đích cụ thể, độ chính xác, tính đầy đủ, không xâm phạm quyền sở hữu trí tuệ, hoặc hoạt động không gián đoạn.

## 2. Không bảo đảm về các game

Repository này là một danh mục các liên kết và metadata. **Repository không host, không phát triển, không phân phối và không chứng thực bất kỳ game nào được lập chỉ mục tại đây.** Tất cả các game đều được liên kết trực tiếp tới itch.io và thuộc quyền sở hữu của các nhà phát triển và nhà phát hành tương ứng.

Người duy trì không bảo đảm cho bất kỳ game nào về:

- **Chất lượng, sự thú vị hoặc khả năng chơi được** — có game hay, có game dở, đa số ở giữa. Tùy gu bạn.
- **Tính an toàn, toàn vẹn hoặc không có mã độc** — trường `safe_virus` mặc định là `?` vì các bản tải về không được quét từng cái. Hãy coi mọi bản tải về là không đáng tin cho đến khi bạn tự xác minh bằng phần mềm anti-malware uy tín.
- **Phân loại NSFW** — cờ `nsfw` được tự dò từ tag / cảnh báo / mô tả của itch.io và chỉ là best-effort. Hãy tự kiểm tra trang game nếu nội dung NSFW có ý nghĩa với bạn (theo cả hai chiều).
- **Độ chính xác của metadata** — tên, mô tả, thể loại, đánh giá, nền tảng và các trường khác được cào (scrape) từ itch.io và phản ánh trạng thái trang tại thời điểm scrape gần nhất. Các thay đổi (đổi tên, gỡ, thêm phí) sẽ được cập nhật ở lần cleanup tiếp theo nhưng có thể trễ.
- **Trạng thái free-to-play** — được xác minh tại thời điểm scrape; một game có thể chuyển sang trả phí sau đó. Job `check_paid.py` chạy mỗi 2 ngày để kiểm tra lại và gỡ các game đã chuyển sang trả phí, nhưng có thể có một khoảng ngắn trễ dữ liệu.

## 3. Không chịu trách nhiệm pháp lý

Trong phạm vi tối đa được pháp luật hiện hành cho phép, người duy trì và những người đóng góp không chịu trách nhiệm cho bất kỳ thiệt hại trực tiếp, gián tiếp, ngẫu nhiên, hệ quả, đặc biệt, ví dụ hay trừng phạt nào phát sinh từ hoặc liên quan tới:

- Việc sử dụng repository này, webapp, desktop app hoặc bất kỳ code/dữ liệu nào trong đó.
- Việc không thể sử dụng những thứ trên (ví dụ: site downtime, deploy lỗi, installer hỏng).
- Bất kỳ game nào được truy cập qua các liên kết trong catalog (crash, mất save, mất dữ liệu, hư phần cứng, malware, lộ tài khoản trên nền tảng bên thứ ba, hoặc cảm giác tiếc nuối).
- Lỗi, thiếu sót hoặc thiếu chính xác trong dữ liệu catalog.

Điều này áp dụng kể cả khi người duy trì đã được cảnh báo về khả năng xảy ra các thiệt hại đó.

## 4. Nội dung của bên thứ ba

Trang game, ảnh chụp màn hình, mô tả, tag, đánh giá và thumbnail thuộc sở hữu của các nhà phát triển/nhà phát hành tương ứng và itch.io. Chúng xuất hiện ở đây theo nguyên tắc fair-use cho mục đích lập chỉ mục và khám phá. Nếu bạn là nhà phát triển và muốn game của mình bị gỡ khỏi danh sách, xem mục **Yêu cầu gỡ** bên dưới.

## 5. Yêu cầu gỡ game

Nếu bạn là nhà phát triển và muốn game của mình bị gỡ khỏi danh mục:

- Mở issue dạng **[Remove Games]** (`.github/ISSUE_TEMPLATE/remove_game.yml`) và tick ô "I'm the dev and don't want it listed".
- Hoặc DM qua bất kỳ kênh nào liệt kê trên [trang About](https://poli0981.github.io/free-games-itchio-list/app/#/about).

Việc gỡ được xử lý thủ công. Dự kiến vài ngày (lịch của một dev thất nghiệp, nhưng không phải vài tuần).

## 6. Không phải tư vấn pháp lý

Không có nội dung nào trong tài liệu này là tư vấn pháp lý. Đây là disclaimer cho dự án sở thích, được soạn bởi một người không phải luật sư, có hỗ trợ AI; tính khả thi cưỡng chế phụ thuộc vào pháp luật của khu vực bạn cư trú. Nếu bạn cần sự chắc chắn pháp lý cho một việc thực sự, hãy thuê luật sư thật.

## 7. Luật áp dụng và tính độc lập của các điều khoản

Tuyên bố miễn trừ này được điều chỉnh bởi pháp luật của **Cộng hòa Xã hội Chủ nghĩa Việt Nam**, không xét đến nguyên tắc xung đột pháp luật. Nếu bất kỳ điều khoản nào bị coi là không thể cưỡng chế trong một khu vực tài phán cụ thể, các điều khoản còn lại vẫn giữ nguyên hiệu lực.

## 8. Lời cuối

Đây vẫn chỉ là một danh sách game miễn phí được làm bởi một dev mệt mỏi cộng với hai LLM. Vui chơi, an toàn, quét file tải về, và nhớ: cuộc đời quá ngắn để lôi nhau ra tòa vì một repo GitHub ngẫu nhiên.

Built with boredom, two AI buddies, và niềm hy vọng sâu sắc rằng sẽ không bao giờ phải gặp một vụ kiện thật. 🚀
