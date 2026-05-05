# Điều khoản sử dụng (Terms of Use)

Cập nhật lần cuối: 2026-05-05

> **Lưu ý**: Đây là bản dịch tiếng Việt mang tính tham khảo cho cộng đồng. **Bản tiếng Anh tại [`docs/ToS.md`](../../ToS.md) là bản chính thức** và sẽ được dùng để giải thích trong trường hợp có khác biệt giữa hai phiên bản.

Các Điều khoản sử dụng này ("Điều khoản") điều chỉnh việc Bạn sử dụng Repository, Webapp và Desktop App. Văn bản dùng ngôn ngữ phổ thông kèm chút humor có chủ đích — nhưng vẫn áp dụng được.

> **Tóm tắt**: Đừng phá đồ, đừng spam, đừng thêm malware, đừng lạm dụng GitHub API hay itch.io. Dùng tính năng PAT của webapp một cách có trách nhiệm. Người duy trì có thể gỡ bất cứ thứ gì vì bất kỳ lý do nào.

## 1. Định nghĩa

Các thuật ngữ được định nghĩa trong [EULA §1](EULA.md#1-định-nghĩa) cũng áp dụng tại đây: "Repository", "Webapp", "Desktop App", "Catalog", "Người duy trì", "Bạn".

## 2. Chấp nhận

Bằng việc xem, clone, fork, star, đóng góp, mở issue, deploy, chạy, hoặc tương tác với Repository, Webapp hoặc Desktop App theo cách khác, Bạn đồng ý với các Điều khoản này. Nếu không đồng ý, đừng sử dụng.

## 3. Sử dụng được phép

Bạn được hoan nghênh:

- Duyệt Catalog, trên GitHub hoặc qua Webapp / Desktop App.
- Click sang trang itch.io và tải game (theo điều khoản của itch.io và của từng nhà phát triển).
- Gửi URL game mới qua issue template **[Add Games]**.
- Gửi yêu cầu gỡ qua **[Remove Games]**.
- Báo bug, đề xuất tính năng, gửi feedback qua các template tương ứng.
- Mở Pull Request với cải tiến code, dữ liệu hoặc tài liệu.
- Tự host Webapp hoặc build Desktop App cho mục đích cá nhân, học tập, hoặc thương mại theo Giấy phép MIT.

## 4. Nghĩa vụ của người đóng góp

Nếu Bạn đóng góp cho Repository (issue, PR, sửa qua Webapp), Bạn cam đoan rằng:

- Nội dung Bạn gửi (code, văn bản, URL game) hoặc là tác phẩm của chính Bạn, hoặc đã được ghi nguồn và cấp phép phù hợp để đưa vào.
- URL game Bạn gửi trỏ đến game **thực sự miễn phí** trên itch.io. Bản demo của game trả phí, "name your own price (mức tối thiểu > 0)" và game được miễn phí có thời hạn không tính.
- Nội dung gửi không chứa malware, không phishing, không doxxing, không vi phạm bản quyền, và không có gì làm xấu mặt mẹ của Người duy trì.
- Bạn cấp cho Người duy trì quyền sáp nhập đóng góp của Bạn vào Repository theo Giấy phép MIT.

## 5. Hành vi bị cấm

Bạn đồng ý **không**:

### 5.1 Catalog & nội dung

- Gửi game không miễn phí, là scam, phát tán malware, hoặc vi phạm điều khoản của itch.io.
- Spam tracker issue với bài đăng kém chất lượng, trùng lặp, hoặc lạc đề.
- Gửi yêu cầu gỡ cho game không thuộc sở hữu của Bạn (dùng template **Bug Report** hoặc **Feedback** thay vào đó).
- Đăng thông tin cá nhân của Người duy trì hoặc bất kỳ người đóng góp nào.

### 5.2 Webapp

- Sử dụng tính năng PAT của Webapp với token cấp quyền truy cập tới repository mà Bạn không được phép ghi.
- Cố tình trích xuất PAT của người dùng khác từ thiết bị dùng chung bằng cách khai thác quyền truy cập browser-storage (cũng vi phạm điều khoản của GitHub).
- Tìm cách phá vỡ mã hóa AES-GCM được áp dụng cho PAT trong `localStorage` để truy cập trái phép.
- Dùng Webapp như một relay để thực hiện các cuộc gọi GitHub API tự động ở quy mô lớn vào repository hoặc tổ chức mà Bạn không được phép tương tác.

### 5.3 itch.io và scraping

- Liên tục trigger workflow `update.yml` đối với các URL theo cách tạo tải bất hợp lý lên itch.io (Webapp đã rate-limit phía client; đừng script vòng qua nó).
- Fork scraper, gỡ rate-limit (`scraper.py` đang nghỉ 2.5–5 giây giữa các request + 15–30 giây sau mỗi 20 request) và chạy ở tần suất cao. Điều khoản của itch.io điều chỉnh truy cập tự động; Người duy trì không chịu trách nhiệm cho các fork vi phạm.

### 5.4 Desktop App

- Đóng gói lại các installer đã ký và phân phối lại như thể chúng được sản xuất bởi nhà cung cấp khác.
- Bỏ trang About hoặc thông tin attribution trước khi phân phối Desktop App công khai.

### 5.5 Chung

- Sử dụng Repository, Webapp, hoặc Desktop App cho bất kỳ mục đích trái pháp luật nào theo luật ở khu vực của Bạn hoặc của Người duy trì (Việt Nam).
- Quấy rối, đe dọa hoặc giả danh người khác qua bất kỳ kênh nào liên quan tới dự án này (issue, PR, server Discord, mạng xã hội).

## 6. Personal Access Token (PAT) — trách nhiệm của Bạn

Tính năng ghi tùy chọn của Webapp yêu cầu PAT fine-grained của GitHub. **Bạn** chịu trách nhiệm duy nhất về:

- Chọn phạm vi PAT không rộng hơn mức Bạn thực sự cần (thông thường `Contents: Read & write` + `Actions: Read & write`, giới hạn về một repository duy nhất).
- Chọn passphrase mạnh cho mã hóa AES-GCM tại thiết bị.
- Khóa PAT (Settings → Lock) khi rời khỏi thiết bị dùng chung.
- Xóa PAT (Settings → Remove saved PAT) khi không còn cần.
- Xoay vòng PAT nếu Bạn nghi ngờ bị lộ.

Người duy trì không bao giờ thấy, truyền, hoặc lưu PAT của Bạn. Xem [Privacy Policy](PrivacyPolicy.md) và [Security Policy](SECURITY.md) để biết chi tiết về vòng đời PAT.

## 7. Sở hữu trí tuệ

- Code, cấu trúc dữ liệu, script, các bảng được tạo, mã nguồn webapp và tài liệu là © Người duy trì (poli0981 / SkullMute), được cấp phép theo [Giấy phép MIT](../../../LICENSE).
- Game và metadata game (tên, mô tả, screenshot, tag) thuộc các nhà phát triển tương ứng và itch.io. Xem [DISCLAIMER §4](DISCLAIMER.md#4-nội-dung-của-bên-thứ-ba).
- Các thư viện open-source bên thứ ba được điều chỉnh bởi giấy phép riêng; xem mục **Third-party software** trong [trang About](https://poli0981.github.io/free-games-itchio-list/app/#/about).

## 8. Chấm dứt

Người duy trì có thể, bất kỳ lúc nào và không cần báo trước:

- Gỡ hoặc sửa đổi bất kỳ nội dung nào (entry game, tài liệu, code).
- Từ chối, đóng, hoặc ẩn issue, PR, hoặc comment vi phạm các Điều khoản này.
- Block người dùng vi phạm lặp lại các Điều khoản này.
- Gỡ hoặc lưu trữ Repository, deploy Webapp, hoặc bản phát hành Desktop App.

Các bản tagged release (`vX.Y.Z`) được dự định giữ lại nhưng không có SLA.

## 9. Thay đổi các Điều khoản

Người duy trì có thể cập nhật các Điều khoản này. Ngày `Cập nhật lần cuối` ở đầu phản ánh thay đổi mới nhất. Việc tiếp tục sử dụng sau khi thay đổi đồng nghĩa với chấp nhận. Các thay đổi trọng yếu sẽ được ghi thêm trong [CHANGELOG.md](../../../CHANGELOG.md).

## 10. Luật áp dụng và tranh chấp

Các Điều khoản này được điều chỉnh bởi pháp luật của **Cộng hòa Xã hội Chủ nghĩa Việt Nam**, không xét đến nguyên tắc xung đột pháp luật.

Tranh chấp được giải quyết theo thứ tự sau:

1. **Không chính thức trước**: mở issue `[Feedback]` hoặc `[General]`, hoặc DM qua bất kỳ kênh nào liệt kê trên [trang About](https://poli0981.github.io/free-games-itchio-list/app/#/about). Hầu hết bất đồng dừng ở đây.
2. **Hòa giải**: nếu liên hệ không chính thức không thành, các bên có thể thử hòa giải theo thỏa thuận chung.
3. **Tòa án**: nếu mọi cách đều thất bại, tòa án có thẩm quyền của Việt Nam có thẩm quyền độc quyền.

## 11. Tính độc lập của các điều khoản

Nếu bất kỳ điều khoản nào của Điều khoản này bị coi là vô hiệu hoặc không thể cưỡng chế, các điều khoản còn lại vẫn giữ đầy đủ hiệu lực.

## 12. Không phải tư vấn pháp lý

Các Điều khoản này là tài liệu cho dự án sở thích, được soạn bởi một người không phải luật sư, có hỗ trợ AI. Không thay thế tư vấn pháp lý chuyên nghiệp.

## 13. Lời cuối

Đây vẫn là một danh sách game miễn phí + một webapp + một desktop app, xây dựng bởi một dev mệt mỏi và hai LLM. Hãy "be cool", đừng phá đồ, vui vẻ, và mọi người đều hòa thuận.

Câu hỏi? Mở issue. Hoặc DM qua bất kỳ kênh nào trên trang About. Người duy trì sẽ cố gắng không ghost.

Built with boredom, zero budget, and two AI buddies who actually read the EULA. 🚀
