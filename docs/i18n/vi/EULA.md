# Thỏa thuận cấp phép cho người dùng cuối (EULA)

Cập nhật lần cuối: 2026-05-05

> **Lưu ý**: Đây là bản dịch tiếng Việt mang tính tham khảo cho cộng đồng. **Bản tiếng Anh tại [`docs/EULA.md`](../../EULA.md) là bản chính thức** và sẽ được dùng để giải thích trong trường hợp có khác biệt giữa hai phiên bản.

EULA này áp dụng cho **mã nguồn và nội dung của `free-games-itchio-list`** — catalog JSON, pipeline Python, webapp React, app desktop Tauri, các bảng markdown, và tài liệu. EULA này **không** áp dụng cho bản thân các game, vốn được cấp phép riêng bởi nhà phát triển thông qua itch.io.

> **Tóm tắt**: Repo này là MIT. Fork, sửa, phân phối lại — giữ thông báo bản quyền, đừng đổ lỗi cho người duy trì nếu có lỗi. Game không phải của bạn chỉ vì chúng được liệt kê tại đây.

## 1. Định nghĩa

- **"Repository"** — `free-games-itchio-list` trên GitHub tại <https://github.com/poli0981/free-games-itchio-list>, bao gồm toàn bộ mã nguồn, file dữ liệu, bảng markdown và tài liệu.
- **"Webapp"** — ứng dụng React + TypeScript trong `webapp/`, deploy tại <https://poli0981.github.io/free-games-itchio-list/app/>.
- **"Desktop App"** — bản build native Tauri 2 của Webapp, phân phối dưới dạng installer qua GitHub Releases.
- **"Catalog"** — metadata game có cấu trúc trong `data_game/` và các bảng markdown được tạo trong `lists/`.
- **"Người duy trì"** — GitHub user `poli0981` (alias: SkullMute), tác giả của Repository này.
- **"Bạn"** — bất kỳ cá nhân, tổ chức hoặc tác nhân tự động nào truy cập, tải về, clone, fork, chạy, sửa, hoặc sử dụng Repository hoặc bất kỳ phần nào.

## 2. Cấp phép

Repository được cấp phép theo **Giấy phép MIT** (xem [`LICENSE`](../../../LICENSE) cho văn bản gốc). Trong phạm vi giấy phép đó, Bạn được cấp quyền toàn cầu, miễn phí bản quyền, không độc quyền, vĩnh viễn để:

- Sử dụng, sao chép, sửa đổi, sáp nhập, công bố, phân phối, cấp lại giấy phép, và/hoặc bán các bản sao của mã, dữ liệu và tài liệu trong Repository.
- Chạy Webapp và Desktop App cho bất kỳ mục đích nào, cá nhân hoặc thương mại.
- Xây dựng các tác phẩm phái sinh (fork, patch, port, repackage).

Toàn bộ điều khoản MIT áp dụng. Hai nhắc nhở thực tế:

- **Giữ thông báo bản quyền và giấy phép** khi bạn phân phối lại các phần đáng kể.
- **Không bảo đảm.** Xem [DISCLAIMER](DISCLAIMER.md).

## 3. Phạm vi — những gì giấy phép này KHÔNG bao phủ

EULA này không cấp quyền nào đối với:

- **Các game được Catalog liệt kê.** Mỗi game là sở hữu trí tuệ của nhà phát triển tương ứng và được cấp phép bởi họ thông qua itch.io. Catalog chỉ cung cấp link và metadata; việc tải về, chơi, sửa, hoặc phân phối lại game được điều chỉnh bởi điều khoản của nhà phát triển và của itch.io.
- **Thư viện bên thứ ba.** Webapp phụ thuộc vào nhiều package open-source (React, Tauri, shadcn/ui, v.v.), mỗi cái có giấy phép riêng — xem mục **Third-party software** trong [trang About](https://poli0981.github.io/free-games-itchio-list/app/#/about).
- **Nhãn hiệu, logo, hoặc dấu hiệu dịch vụ của itch.io.** Chúng thuộc itch corp và được tham chiếu chỉ để nhận diện.
- **Thumbnail, ảnh chụp màn hình, mô tả, hoặc trailer** của các game được liệt kê. Chúng được sao chép theo nguyên tắc fair-use cho mục đích lập chỉ mục/khám phá và vẫn thuộc sở hữu của chủ sở hữu.

## 4. Chấp nhận

Bạn chấp nhận EULA này khi thực hiện bất kỳ hành động nào sau: clone, fork, tải về, cài đặt, chạy, sửa, hoặc sử dụng Repository, Webapp hoặc Desktop App theo cách khác. Nếu Bạn không đồng ý, đừng sử dụng và hãy xóa các bản sao cục bộ.

## 5. Hạn chế

Mặc dù giấy phép MIT là rộng rãi, Bạn đồng ý không:

- Sử dụng Repository hoặc các thành phần của nó để host, phân phối, hoặc tạo điều kiện phân phối malware, trang phishing, hoặc nội dung vi phạm pháp luật hiện hành.
- Trình bày sai nguồn gốc của Repository (ví dụ: tự xưng là tác giả của các bản sao chưa sửa).
- Sử dụng tên Người duy trì, GitHub handle `poli0981`, hoặc alias "SkullMute" để chứng thực hoặc quảng bá tác phẩm phái sinh mà không có sự cho phép trước bằng văn bản.
- Sử dụng tính năng xử lý PAT của Webapp để truy cập GitHub repository hoặc API mà bạn không được phép.

Các hạn chế này bổ sung, không thay thế, các điều khoản của giấy phép MIT.

## 6. Cập nhật và chấm dứt

Người duy trì có thể cập nhật, sửa, lưu trữ, hoặc xóa Repository bất kỳ lúc nào mà không cần báo trước. Các bản tagged release (`vX.Y.Z`) là bất biến trên GitHub Releases trừ khi được rút lại tường minh; nhánh `main` thì không.

Quyền của Bạn theo EULA này tự động chấm dứt nếu Bạn vi phạm trọng yếu. Việc cấp phép MIT vẫn còn hiệu lực sau khi EULA này chấm dứt trong phạm vi mà điều khoản MIT cho phép.

## 7. Luật áp dụng

EULA này được điều chỉnh bởi pháp luật của **Cộng hòa Xã hội Chủ nghĩa Việt Nam**, không xét đến nguyên tắc xung đột pháp luật. Bất kỳ tranh chấp nào không thể giải quyết không chính thức sẽ được đưa ra tòa án có thẩm quyền của Việt Nam.

Bản thân giấy phép MIT có tính khả chuyển quốc tế và được giải thích như vậy.

## 8. Tính độc lập của điều khoản

Nếu bất kỳ điều khoản nào của EULA này bị coi là vô hiệu hoặc không thể cưỡng chế tại một khu vực tài phán, các điều khoản còn lại vẫn giữ đầy đủ hiệu lực, và điều khoản vô hiệu sẽ được thay thế (chỉ tại khu vực đó) bằng điều khoản gần với ý định ban đầu nhất.

## 9. Không phải tư vấn pháp lý

EULA này là tài liệu cho dự án sở thích, được soạn bởi một người không phải luật sư, có hỗ trợ AI. Nó không thay thế tư vấn pháp lý chuyên nghiệp. Nếu Bạn cần sự chắc chắn pháp lý cho một triển khai nghiêm túc, hãy tham khảo luật sư có chuyên môn.

## 10. Lời cuối

Đây vẫn là một dự án sở thích sinh ra từ thất nghiệp, buồn chán và sự bướng bỉnh không xóa repo. Dùng nó, fork nó, kệ nó. Xây thứ gì hay hơn. Vui chơi săn game miễn phí — hoặc không. Không ai phán xét (có thể trừ Người duy trì, tự với chính mình).

Built with zero budget, too much free time, and two AI buddies. 🚀

**P/S:** Không ai đọc EULA. Chắc bạn là người đầu tiên :D
