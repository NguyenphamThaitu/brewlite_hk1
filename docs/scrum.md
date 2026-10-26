# Tài liệu Scrum - BrewLite

## 1. Vai trò
| Vai trò | Họ tên | MSSV |
|---|---|---|
| Product Owner | (điền) | (điền) |
| Scrum Master | (điền) | (điền) |
| Developer | (điền) | (điền) |

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
| Ngày | Đã làm | Sẽ làm | Vướng mắc |
|---|---|---|---|
| (điền) | (điền) | (điền) | (điền) |

## 5. Burndown
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