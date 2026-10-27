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
| # | Task | Sprint | Điểm | Trạng thái |
|---|---|---|---|---|
| 1 | Khởi tạo dự án và cấu trúc | 1 | 1 | Xong |
| 2 | API danh sách sản phẩm | 1 | 1 | Xong |
|  | Trang Menu (Frontend) | 1 | 1 | Xong |
![img.png](img.png)| 4 | Chi tiết và tùy chọn sản phẩm | 1 | 1 | Xong |
| 5 | Giỏ hàng | 2 | 1 | Xong |
| 6 | API tạo đơn hàng | 2 | 1 | Xong |
| 7 | Đăng ký / Đăng nhập JWT | 2 | 1 | Xong |
| 8 | Thanh toán không tiền mặt | 3 | 1 | Xong |
| 9 | Xác nhận, lịch sử đơn và bàn giao | 3 | 1 | Xong |
| 10 | Nghiệp vụ backend | 3 | 1 | Xong |

## 3. Sprint Backlog và Sprint Goal
- **Sprint 1** (Task 1-4): Nền tảng và hiển thị menu.
- **Sprint 2** (Task 5-7): Giỏ hàng, đặt đơn, đăng nhập. Thực tế làm theo thứ tự 5 → 7 → 6 vì Task 6 cần JWT Guard của Task 7.
- **Sprint 3** (Task 8-10): Thanh toán, bàn giao, nghiệp vụ nâng cao.

## 4. Daily Scrum

### Ghi nhận cuộc họp thứ Hai, 26/10/2026

- Thời lượng: 15 phút.
- Nội dung thực tế: trao đổi và phân công công việc cho các thành viên.
- Tiến độ tại thời điểm họp: các đầu việc mới được giao chưa bắt đầu thực hiện.

| Ngày | Đã làm | Sẽ làm | Vướng mắc |
|---|---|---|---|
| 26/10/2026 (Thứ Hai) | Đã họp nhóm 15 phút và thống nhất phân công công việc; chưa triển khai các đầu việc mới tại thời điểm họp. | Các thành viên bắt đầu thực hiện nhiệm vụ đã nhận. Trường viết unit test cho `vnd()` và `cartCount()`, theo dõi Daily và chuẩn bị Burndown. | Chưa có thông tin được xác nhận về vướng mắc trong buổi họp. |

## 5. Burndown

**Trạng thái: chờ số liệu thực tế để vẽ biểu đồ.** Hiện chưa xác nhận tổng story points của Sprint và số story points còn lại theo từng ngày.

Story points (SP) là đơn vị nhóm dùng để ước lượng khối lượng và độ phức tạp của công việc. Nhóm cần thống nhất ước lượng cho các hạng mục trong Sprint, xác nhận ngày bắt đầu/kết thúc và cập nhật SP còn lại theo từng ngày. Cột "Điểm" (1 điểm/task) trong Product Backlog theo đề bài là điểm đánh giá, chưa có căn cứ để coi đó là story points.

Chỉ vẽ đường thực tế (Actual) khi có số liệu đã được xác nhận; chưa điền số SP hoặc tạo ảnh Burndown khi thiếu dữ liệu.

- Sprint 1: (chèn ảnh)
- Sprint 2: (chèn ảnh)
- Sprint 3: (chèn ảnh)

## 6. Sprint Review
- Sprint 1: demo menu, trang chi tiết. Phản hồi: (điền)
- Sprint 2: demo giỏ hàng, đăng nhập, tạo đơn. Phản hồi: (điền)
- Sprint 3: demo end-to-end và test. Phản hồi: (điền)

## 7. Retrospective
- Làm tốt: (điền)
- Cần cải thiện: (điền)
- Hành động lần sau: (điền)

## 8. Definition of Done
- Code chạy được, không lỗi build, đúng tiêu chí chấp nhận.
- Commit rõ ràng, được review trong nhóm.
- API có validate, UI có loading/lỗi.
- README có hướng dẫn chạy.

## 9. Ghi chú
- Task 4 commit chung với Task 5. Task 1 và Task 7 có 2 commit (backend/frontend riêng).
- Giả định (đề không quy định): giá size/topping, điểm thưởng 1 điểm/10.000đ, mã BREW10 giảm 10%, idempotency áp dụng cho POST /payments.
