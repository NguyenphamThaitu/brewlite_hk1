# Tài liệu Scrum - BrewLite

## 1. Vai trò
| Vai trò | Họ tên | MSSV | Phụ trách |
|---|---|---|---|
| Developer chính | Nguyễn Phạm Thái Tú | 3124410385 | Code, Docker, Git, kiểm thử tự động |
| Scrum Master | Quách Văn Trường | 3124410384 | Daily Scrum, Burndown, Review, Retrospective |
| Product Owner | Đặng Tuấn Vỹ | 3124410412 | Backlog, nghiệm thu, phản hồi |
| Tester | La Hữu Mẫn | 3122410235 | Test luồng chính |
| Tester, Reviewer | Quách Anh Vũ | 3124410410 | Test trường hợp lỗi, review Pull Request |
| Tài liệu, Demo | Trần Minh Trí | 3124410371 | README, slide, dẫn demo |

## 2. Product Backlog

Nhóm đã hoàn thành cả 10 task. Mỗi task được ước lượng bằng story points (SP) để theo dõi tiến độ và vẽ Burndown.

- **Điểm chấm bài:** 1 điểm/task theo đề.
- **Story points:** độ lớn tương đối của task (khối lượng, độ khó, rủi ro). Hai cột này dùng cho hai việc khác nhau nên không cộng chung.
- **Ngày hoàn thành:** ngày code của task được đưa lên nhánh `main`, kèm mã commit để kiểm tra trên GitHub.

<!-- sp-table:start -->
| # | Task | Sprint | Điểm chấm bài | Story points | Trạng thái | Ngày hoàn thành | Commit minh chứng |
|---|---|---|---|---|---|---|---|
| 1 | Khởi tạo dự án và cấu trúc | 1 | 1 | 2 | Hoàn thành | 20/10/2026 | `14e3b4c + 1f8a181` |
| 2 | API danh sách sản phẩm | 1 | 1 | 2 | Hoàn thành | 20/10/2026 | `46b3ca3` |
| 3 | Trang Menu | 1 | 1 | 3 | Hoàn thành | 20/10/2026 | `76002ae` |
| 4 | Chi tiết và tùy chọn sản phẩm | 1 | 1 | 5 | Hoàn thành | 21/10/2026 | `575dfc5` |
| 5 | Giỏ hàng | 2 | 1 | 5 | Hoàn thành | 21/10/2026 | `575dfc5` |
| 6 | API tạo đơn hàng | 2 | 1 | 5 | Hoàn thành | 21/10/2026 | `4b5237e` |
| 7 | Đăng ký / Đăng nhập JWT | 2 | 1 | 5 | Hoàn thành | 21/10/2026 | `d491869 + e4ea0fc` |
| 8 | Thanh toán không tiền mặt | 3 | 1 | 5 | Hoàn thành | 21/10/2026 | `6abfdcc + 3ca42b2` |
| 9 | Xác nhận, lịch sử đơn và bàn giao | 3 | 1 | 8 | Hoàn thành | 21/10/2026 | `9d1e1e0 + 41cc986 + 7a5329f` |
| 10 | Nghiệp vụ backend nâng cao | 3 | 1 | 13 | Hoàn thành | 26/10/2026 | `517633a → 62fba46` |
| **Tổng** | **10 task** | **3 Sprint** | **10** | **53** | **10/10 hoàn thành** | | |
<!-- sp-table:end -->

Ảnh giao diện tham khảo: [img.png](img.png).

### 2.1. Cách ước lượng story points

1. Chọn Task 2 (API lấy danh sách sản phẩm) làm mốc **2 SP**, vì đây là task đơn giản, cả nhóm dễ hình dung.
2. Các task còn lại so với mốc này, dùng thang Fibonacci 1, 2, 3, 5, 8, 13:
   - Task 1 tương đương mốc nên được 2 SP. Task 3 nhỉnh hơn một chút nên được 3 SP.
   - Task 4–8 (tùy chọn món, giỏ hàng, tạo đơn, đăng nhập, thanh toán) mỗi task 5 SP.
   - Task 9 phải ghép nhiều phần (2 màn hình đơn hàng, Docker, README, demo) nên được 8 SP.
   - Task 10 được 13 SP vì gồm state machine, idempotency, khóa tồn kho, khuyến mãi/điểm thưởng và test. Task 6 và 8 chỉ tính phần cơ bản, phần nâng cao tính vào Task 10 để không bị tính trùng.
3. Cả nhóm cùng xem và thống nhất. PO giải thích phạm vi từng task, Scrum Master ghi lại kết quả.

Lý do ước lượng của từng task nằm trong [story-points.csv](burndown/story-points.csv).

## 3. Sprint Backlog và Sprint Goal

| Sprint | Task | Sprint Goal |
|---|---|---|
| 1 | Task 1–4 | Dựng nền tảng dự án và hiển thị menu |
| 2 | Task 5–7 | Giỏ hàng, đăng nhập và đặt đơn |
| 3 | Task 8–10 | Thanh toán, bàn giao và nghiệp vụ nâng cao |

Ở Sprint 2, nhóm làm theo thứ tự 5 → 7 → 6, vì API tạo đơn (Task 6) cần đăng nhập JWT (Task 7) làm trước.

<!-- sp-totals:start -->
- **Sprint 1: 12 SP** — hoàn thành ngày 21/10/2026.
- **Sprint 2: 15 SP** — hoàn thành ngày 21/10/2026.
- **Sprint 3: 26 SP** — hoàn thành ngày 26/10/2026.
- **Toàn bộ backlog: 53 SP** (tách biệt với 10 điểm chấm bài).
<!-- sp-totals:end -->

## 4. Daily Scrum

### Thứ Hai, 26/10/2026

Họp 15 phút để phân công công việc cho từng người.

| Đã làm | Sẽ làm | Vướng mắc |
|---|---|---|
| Họp và chia việc cho cả nhóm. | Mọi người bắt đầu làm phần được giao. Trường viết unit test cho `vnd()` và `cartCount()`, theo dõi Daily và chuẩn bị Burndown. | Không có. |

### Thứ Ba, 27/10/2026

Các thành viên báo cáo tiến độ cho Scrum Master:

| Thành viên | Đã làm | Sẽ làm | Vướng mắc |
|---|---|---|---|
| La Hữu Mẫn (Tester) | Hiện nhãn "Hết hàng" và khóa nút "Thêm vào giỏ" khi hết hàng. Test đổi size/topping, giỏ hàng, đăng ký, thanh toán Ví, "Đơn của tôi". | Tổng hợp kết quả test Task 3, 4, 5, 8, 9. | Không có. |
| Quách Anh Vũ (Tester, Reviewer) | Viết file `backend/http/api.http`. Test trùng email, sai mật khẩu, giỏ rỗng, mã giảm giá, thanh toán thành công/thất bại, dùng lại Idempotency-Key. PR #3 đã merge. | Tổng hợp kết quả test Task 6–10, review các PR. | Không có. |
| Đặng Tuấn Vỹ (PO) | Thêm ô tìm món theo tên trên Menu (PR #4). Nghiệm thu Task 1, 2, 3, 4, 8, 9. Viết phản hồi khách hàng và backlog bản sau. | Chuẩn bị nghiệm thu ở buổi Review. | Không có. |
| Trần Minh Trí (Tài liệu, Demo) | Thêm trang 404 tiếng Việt và footer (PR #1). Cập nhật README. | Làm phần quản lý tồn kho nguyên liệu (đã merge PR #5 ngày 02/11). Chuẩn bị demo. | Không có. |
| Quách Văn Trường (Scrum Master) | Viết 12 unit test cho `vnd()` và `cartCount()` (PR #2). Chạy test, lint, build đều đạt. | Ước lượng story points và vẽ Burndown. | Không có. |

### Tình hình hiện tại (03/11/2026)

- 10/10 task đã xong, còn lại 0 SP. Sprint 1 và 2 xong ngày 21/10, Sprint 3 xong ngày 26/10.
- PR #1–#4 merge ngày 27/10, PR #5 (tồn kho nguyên liệu) merge ngày 02/11.
- 28/10: chỉnh màu giao diện các trang cho đồng bộ với header.
- 03/11: Trí hoàn thiện README.

## 5. Burndown

![Burndown BrewLite: 53 SP, hoàn thành 10/10 task ngày 26/10/2026](burndown/burndown.png)

### 5.1. Cách đọc biểu đồ

- **Trục Y:** số SP còn lại (chưa làm xong). Ban đầu là 53 SP.
- **Trục X:** các ngày từ 20/10 đến 28/10 (ngày Sprint Review). Mỗi điểm là SP còn lại vào cuối ngày đó.
- **Đường nét đứt (Lý tưởng):** nếu làm đều mỗi ngày thì SP giảm thẳng từ 53 về 0 vào ngày 28/10.
- **Đường cam (Thực tế):** SP còn lại thật, tính từ ngày hoàn thành của từng task.
- **Cột màu:** SP còn lại của Sprint 1 (xanh), Sprint 2 (tím), Sprint 3 (hồng).

### 5.2. Cách tính

- Tổng `S` = 53 SP, `D` = 9 ngày (20/10 → 28/10), `d` = số ngày đã qua.
- **Lý tưởng** = `S × (1 − d / D)`. Ví dụ cuối ngày 21/10 (d = 2): 53 × (1 − 2/9) ≈ 41.2 SP.
- **Thực tế** = tổng SP của các task chưa xong. Task chỉ được trừ SP khi đã xong hoàn toàn.
- Ví dụ: cuối ngày 20/10 xong Task 1, 2, 3 (2 + 2 + 3 = 7 SP), còn 53 − 7 = 46 SP.

<!-- burndown-daily:start -->
| Thời điểm | Task hoàn thành trong ngày | SP trừ | Còn lại S1 | Còn lại S2 | Còn lại S3 | Lý tưởng | **Thực tế** |
|---|---|---|---|---|---|---|---|
| Bắt đầu 20/10 | — | 0 | 12 | 15 | 26 | 53 | **53** |
| Cuối 20/10 | Task 1, Task 2, Task 3 | 7 | 5 | 15 | 26 | 47.1 | **46** |
| Cuối 21/10 | Task 4, Task 5, Task 6, Task 7, Task 8, Task 9 | 33 | 0 | 0 | 13 | 41.2 | **13** |
| Cuối 22/10 | — | 0 | 0 | 0 | 13 | 35.3 | **13** |
| Cuối 23/10 | — | 0 | 0 | 0 | 13 | 29.4 | **13** |
| Cuối 24/10 | — | 0 | 0 | 0 | 13 | 23.6 | **13** |
| Cuối 25/10 | — | 0 | 0 | 0 | 13 | 17.7 | **13** |
| Cuối 26/10 | Task 10 | 13 | 0 | 0 | 0 | 11.8 | **0** |
| Cuối 27/10 | — | 0 | 0 | 0 | 0 | 5.9 | **0** |
| Cuối 28/10 | — | 0 | 0 | 0 | 0 | 0 | **0** |
<!-- burndown-daily:end -->

### 5.3. Nhận xét

- Đường Thực tế luôn nằm dưới hoặc bằng đường Lý tưởng, tức là nhóm làm nhanh hơn kế hoạch. Riêng ngày 21/10 xong 6 task (33 SP), hoàn thành luôn Sprint 1 và Sprint 2.
- Từ 22/10 đến 25/10 đường Thực tế đi ngang ở 13 SP vì chỉ còn Task 10. Ngày 24/10 đã làm xong state machine và idempotency, nhưng Task 10 chưa xong hết nên chưa được trừ.
- Ngày 26/10 Task 10 xong, về 0 SP, sớm 2 ngày so với ngày Review (28/10).

### 5.4. Vẽ lại biểu đồ

Dữ liệu nằm trong [story-points.csv](burndown/story-points.csv). Khi sửa file này, chạy lại script để cập nhật biểu đồ và các bảng ở mục 2, 3, 5:

```bash
python -m pip install -r docs/burndown/requirements.txt
python docs/burndown/generate_charts.py
```

## 6. Sprint Review

Sprint Review sáng thứ Tư, 28/10/2026.

| Sprint | Sprint Goal | SP | Kết quả |
|---|---|---|---|
| 1 | Dựng nền tảng và hiển thị menu | 12 | Đạt, xong 21/10 |
| 2 | Giỏ hàng, đăng nhập, đặt đơn | 15 | Đạt, xong 21/10 |
| 3 | Thanh toán, bàn giao, nghiệp vụ nâng cao | 26 | Đạt, xong 26/10 |

Nội dung demo:

| Sprint | Demo |
|---|---|
| 1 (Task 1–4) | Chạy dự án, xem menu, tìm món, mở chi tiết món, đổi size/topping để xem giá thay đổi. |
| 2 (Task 5–7) | Thêm/sửa/xóa món trong giỏ, đăng ký, đăng nhập, tạo đơn (trạng thái PENDING), thử đặt đơn với giỏ rỗng. |
| 3 (Task 8–10) | Thanh toán Ví/Thẻ thành công và thất bại, thanh toán lại, xem trang xác nhận và lịch sử đơn, chạy bằng Docker. |

Phân công: Trí dẫn demo, Tú hỗ trợ kỹ thuật, Trường điều phối, Vỹ nghiệm thu theo tiêu chí, Mẫn và Vũ trình bày kết quả test.

Sau Review, nhóm làm thêm: chỉnh màu giao diện (28/10) và phần quản lý tồn kho nguyên liệu (PR #5, 02/11). Xem mục 10.2.

## 7. Retrospective

**Điều làm tốt**

- Hoàn thành cả 10 task, sớm 2 ngày so với kế hoạch.
- Code của mọi người đều được đưa lên `main` qua Pull Request.
- Có unit test cho frontend, test state machine và test tích hợp cho backend.

**Điều cần cải thiện**

- Task 10 quá lớn (13 SP) nên Burndown đi ngang 4 ngày, khó theo dõi tiến độ. Lần sau nên chia nhỏ, mỗi task không quá 5 SP.
- Việc dồn vào ngày 21/10 (33 SP trong 1 ngày). Nên chia đều hơn trong Sprint.
- Các PR được merge nhưng chưa có lượt review/Approve trên GitHub.
- Kết quả test của tester chưa được lưu thành bảng trong repo.

**Hành động cho lần sau**

| Hành động | Người phụ trách | Khi nào |
|---|---|---|
| Ước lượng SP ngay khi lập kế hoạch Sprint, ghi SP còn lại cuối mỗi ngày. | Cả nhóm, Scrum Master theo dõi | Sprint Planning và cuối mỗi ngày |
| Lưu bảng kết quả test (PASS/FAIL) và ảnh lỗi vào repo. | Mẫn, Vũ | Trước khi nghiệm thu |
| Mỗi PR phải có ít nhất 1 người review/Approve rồi mới merge. | Vũ và người được phân công | Mỗi Pull Request |

## 8. Definition of Done

Một task được coi là xong khi:

- Code chạy được, build không lỗi, đúng tiêu chí chấp nhận.
- Commit rõ ràng, có người trong nhóm review.
- API có kiểm tra dữ liệu đầu vào, giao diện có trạng thái đang tải và báo lỗi.
- README có hướng dẫn chạy.

Hiện tại: 12 unit test frontend, lint và build đều chạy đạt. README đã có hướng dẫn chạy bằng Docker, chạy local và chạy test.

## 9. Ghi chú
- Task 4 commit chung với Task 5. Task 1 và Task 7 có 2 commit (backend/frontend riêng).
- Giả định (đề không quy định): giá size/topping, điểm thưởng 1 điểm/10.000đ, mã BREW10 giảm 10%, idempotency áp dụng cho POST /payments.

## 10. Nghiệm thu của Product Owner – Đặng Tuấn Vỹ

Phạm vi nghiệm thu: Task 1, 2, 3, 4, 8, 9 theo Product Backlog của đề bài BrewLite.

Đánh giá dựa trên việc rà soát source code và cấu hình repository. Các tiêu chí cần chạy thử thực tế phải được kiểm tra trước khi xác nhận hoàn tất Definition of Done.

| Task | Tiêu chí nghiệm thu | Kết quả | Căn cứ rà soát |
|---|---|---|---|
| 1 | Khởi tạo dự án, cấu trúc frontend Next.js và backend NestJS, README, Git, .env.example | Đạt | Có thư mục frontend/backend, README, file môi trường mẫu và cấu hình Docker Compose. Cần chạy thử trên máy demo. |
| 2 | API GET /products trả về danh sách sản phẩm gồm id, tên, giá và ảnh | Đạt | Backend có endpoint GET /products cung cấp dữ liệu menu. Cần kiểm tra phản hồi API thực tế. |
| 3 | Trang Menu gọi API, hiển thị sản phẩm, loading/empty state | Đạt | Trang frontend/src/app/page.tsx gọi API /products. Đã thêm ô tìm món theo tên, lọc trực tiếp trên trình duyệt và thông báo khi không có kết quả. |
| 4 | Trang chi tiết cho chọn size S/M/L và topping, tính giá theo lựa chọn | Đạt | Có trang chi tiết sản phẩm hỗ trợ chọn size, topping và tính giá. Cần kiểm thử các lựa chọn trước buổi demo. |
| 8 | Thanh toán Ví/Thẻ, gọi POST /payments, cập nhật PAID hoặc PAYMENT_FAILED | Đạt | Có chức năng thanh toán và lựa chọn phương thức. Cần chạy thử cả trường hợp thành công và thất bại. |
| 9 | Xác nhận đơn, lịch sử đơn, Docker Compose, README và demo end-to-end | Đạt | Có trang xác nhận đơn, trang lịch sử đơn, cấu hình Docker Compose và README. Cần chạy đủ dịch vụ và demo trọn luồng. |

### 10.1. Phản hồi khách hàng

Các nội dung dưới đây là phản hồi mô phỏng để chuẩn bị cho Sprint Review, không phải phản hồi đã được xác nhận từ khách hàng thật.

1. Giao diện menu hiển thị tên, hình ảnh và giá đồ uống rõ ràng. Chức năng tìm món theo tên giúp khách hàng tìm sản phẩm nhanh hơn.
2. Chức năng chọn size và topping giúp khách hàng tùy chỉnh đồ uống theo sở thích.
3. Luồng thanh toán Ví/Thẻ và màn hình xác nhận giúp khách hàng theo dõi kết quả đặt hàng.
4. Khi thanh toán thất bại, khách hàng mong muốn có thông báo rõ ràng và hướng dẫn thử lại an toàn.
5. Khách hàng đề nghị nhóm kiểm thử đầy đủ luồng đặt hàng, thanh toán và bàn giao trước khi đưa sản phẩm vào sử dụng.

### 10.2. Product Backlog và Tiến độ triển khai các tính năng mở rộng

| Ưu tiên | Hạng mục | Mục tiêu | Trạng thái ghi nhận |
|---|---|---|---|
| Đã hoàn thành | Quản lý định lượng & Tồn kho nguyên liệu (Ingredient Inventory) | Mô hình nguyên liệu (g, ml, pcs), công thức theo size S/M/L, công thức topping, giữ chỗ nguyên liệu trong 10 phút, đối soát biến động kho. | Đã hoàn thành (Code, Migration, Seed, Test E2E) |
| Đã hoàn thành | Dự báo cơ cấu bán hàng (Sales Mix Forecast 500+ ly) | Cho phép người quản lý nhập số ly dự kiến (500+ ly), tự động gộp nguyên liệu dùng chung và xuất bảng phân tích thiếu hụt không làm thay đổi tồn kho. | Đã hoàn thành (API, UI, E2E Test) |
| Đã hoàn thành | Cải thiện thông báo lỗi và thử lại khi thanh toán thất bại | Tái sử dụng đơn hàng cũ, cơ chế Idempotency-Key chống lặp, xử lý rõ ràng khi hết hạn giữ chỗ và hỗ trợ hủy đơn giải phóng giữ chỗ. | Đã hoàn thành |
| Đã hoàn thành | Báo cáo cân đối xuất-nhập-tồn hàng ngày | Báo cáo xuất-nhập-tồn theo múi giờ Asia/Ho_Chi_Minh (UTC+7), đối soát toán học chính xác 100%. | Đã hoàn thành |
| Cao | Lọc menu theo danh mục và khoảng giá | Giúp khách hàng tìm đồ uống nhanh hơn theo sở thích. | Đang chờ phiên bản kế tiếp |
| Trung bình | Lưu món yêu thích và đặt lại từ lịch sử đơn | Rút ngắn thời gian đặt hàng cho khách hàng thường xuyên. | Đang chờ phiên bản kế tiếp |
| Thấp | Cải thiện khả năng truy cập và giao diện trên thiết bị di động | Tối ưu hóa nâng cao trải nghiệm người dùng mobile. | Đang chờ phiên bản kế tiếp |

### 10.3. Ghi chú của Product Owner

- Kết quả Đạt trong bảng là đánh giá ban đầu dựa trên rà soát source code, chưa thay thế cho kiểm thử thực tế.
- Trước khi chốt nghiệm thu, cần chạy ứng dụng, kiểm tra tiêu chí chấp nhận, lưu bằng chứng kiểm thử và xác nhận commit/review theo Definition of Done.
- Phản hồi khách hàng mô phỏng cần được cập nhật bằng ý kiến thực tế nếu nhóm đã tổ chức Sprint Review.
