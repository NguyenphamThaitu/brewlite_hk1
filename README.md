# BrewLite — Cashless Coffee Ordering System

Hệ thống đặt cà phê và thanh toán không dùng tiền mặt, tích hợp **Quản lý Định lượng & Tồn kho Nguyên liệu (Ingredient Inventory Management)**. Đồ án môn **Công nghệ Phần mềm** — Trường Đại học Sài Gòn (SGU), phát triển theo quy trình **Agile Scrum**.

---

## 👥 Thành viên nhóm

| Họ tên | MSSV | Vai trò |
|---|---|---|
| Nguyễn Phạm Thái Tú | 3124410385 | Developer chính |
| Quách Văn Trường | 3124410384 | Scrum Master |
| Đặng Tuấn Vỹ | 3124410412 | Product Owner |
| La Hữu Mẫn | 3122410235 | Tester |
| Quách Anh Vũ | 3124410410 | Tester, Reviewer |
| Trần Minh Trí | 3124410371 | Quản lý kho, Tài liệu, Demo |

---

## 🛠 Công nghệ sử dụng

- **Frontend:** Next.js 16 (App Router, React 19, TypeScript), TailwindCSS v4, TanStack React Query v5, Zustand.
- **Backend:** NestJS 12, TypeScript, Prisma ORM 6, Passport JWT, class-validator, oxlint.
- **Database:** PostgreSQL 16 (PostgreSQL Numeric / Decimal, khóa chống deadlock `SELECT ... FOR UPDATE`, ràng buộc `CHECK` toàn vẹn dữ liệu).
- **Thanh toán:** Mock Gateway (Ví điện tử & Thẻ ngân hàng), cơ chế chống trùng lặp **Idempotency-Key**, xử lý giữ chỗ nguyên liệu theo vòng đời thanh toán.
- **Container & DevOps:** Docker, Docker Compose.
- **Testing:** Vitest (Frontend unit tests), Jest & Supertest (Backend unit & E2E integration tests).

---

## ✨ Các chức năng chính (Features)

### 1. Phía Khách hàng (Customer Experience)
- **Xem Menu & Tìm kiếm:** Danh mục đồ uống từ API (`GET /products`), tìm kiếm tức thì phía client hỗ trợ chuẩn hóa tiếng Việt không dấu.
- **Chi tiết món & Tùy biến:** Chọn size (S/M/L) và topping (Trân châu, Kem); **kiểm tra thời gian thực khả năng pha chế dựa trên tồn kho nguyên liệu thực tế** (cảnh báo hết nguyên liệu theo từng size/topping cụ thể; ước tính số ly độc lập).
- **Giỏ hàng (Cart):** Quản lý trạng thái bằng Zustand (xử lý hydration SSR), tăng/giảm số lượng, tính tổng tiền và huy hiệu số lượng trên header.
- **Xác thực người dùng:** Đăng ký / Đăng nhập với Bcrypt + JWT; mặc định phân quyền khách hàng (`role: CUSTOMER`).
- **Thanh toán không tiền mặt:** Hỗ trợ Ví điện tử / Thẻ ngân hàng; mã giảm giá (`BREW10`); cơ chế **Idempotency-Key** chống giao dịch trùng; xử lý thử lại thông minh (tái sử dụng đơn hàng cũ và key khi lỗi mạng, cấp key mới khi tạo lượt thanh toán mới); tự động cộng điểm thưởng (1 điểm / 10.000đ).
- **Theo dõi & Hủy đơn hàng:** Quản lý vòng đời đơn (`PENDING` ➔ `PAID` / `PAYMENT_FAILED` ➔ `PREPARING` ➔ `READY` ➔ `COMPLETED`). Hỗ trợ hủy đơn hợp lệ khi chưa pha chế (`POST /orders/:id/cancel`), tự động giải phóng giữ chỗ nguyên liệu.

### 2. Phía Quản lý (Ingredient Inventory & Management)
- **Kho nguyên liệu & Cảnh báo sắp hết:** Quản lý số dư tồn thực tế (`stock`), số lượng giữ chỗ (`reservedQty`), tồn khả dụng (`availableQty = stock - reservedQty`), và cảnh báo khi chạm ngưỡng tối thiểu (`lowStockThreshold`).
- **Nhập kho (Stock-In):** Nhập thêm nguyên liệu, cập nhật số dư tức thì và lưu vết nhật ký biến động kho (`InventoryMovement`).
- **Kiểm kê & Điều chỉnh số dư (Adjustment):** Cho phép điều chỉnh tồn thực tế sau kiểm kê định kỳ kèm **giải trình lý do bắt buộc**. Ngăn chặn điều chỉnh tồn kho thấp hơn lượng đang giữ chỗ cho đơn chưa thanh toán.
- **Quản lý & Chỉnh sửa công thức định lượng (Recipes):** Xem và cập nhật trực tiếp định lượng thành phần cho từng sản phẩm theo từng kích cỡ (Size S/M/L) và từng loại topping thông qua giao diện modal tiện lợi, có xác thực dữ liệu và đồng bộ tức thì vào hệ thống.
- **Báo cáo cân đối xuất-nhập-tồn hàng ngày (Daily Report):** Tổng hợp theo ngày chuẩn múi giờ `Asia/Ho_Chi_Minh` (UTC+7): Tồn đầu ngày (kế thừa tồn khả dụng cuối ngày hôm trước), Nhập trong ngày, Xuất tiêu hao pha chế, Điều chỉnh kiểm kê, Tồn cuối ngày, Đang giữ chỗ và Khả dụng hiện tại.

---

## 🚀 Hướng dẫn khởi chạy & Cài đặt

### Yêu cầu tiên quyết
- Node.js LTS (>= 20.x hoặc >= 22.x)
- PostgreSQL 16 (hoặc Docker / Docker Desktop)
- Git

---

### Khởi chạy Môi trường Local Development

**1. Cấu hình cơ sở dữ liệu PostgreSQL:**
Đảm bảo PostgreSQL đang chạy trên cổng `5432` với tài khoản `brew:brew` và database `brewlite` (hoặc cấu hình lại URL trong `.env`):
```env
DATABASE_URL=postgresql://brew:brew@localhost:5432/brewlite
JWT_SECRET=change-me
CORS_ORIGIN=http://localhost:3000
PORT=3001
```

**2. Khởi chạy Backend (NestJS):**
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate deploy       # Triển khai các bản migration bảo toàn dữ liệu
npx ts-node prisma/seed.ts      # Khởi tạo sản phẩm, nguyên liệu, công thức & tài khoản Admin
npm run build                   # Biên dịch kiểm tra TypeScript
npm run start:dev               # Khởi động máy chủ backend tại cổng 3001
```

**3. Khởi chạy Frontend (Next.js):**
```bash
cd frontend
npm install
npm run dev                     # Khởi động giao diện Next.js tại cổng 3000
```

---

## 🔑 Tài khoản Quản trị viên mẫu (Admin Demo)

Hệ thống tự động khởi tạo sẵn tài khoản quản trị khi chạy lệnh `seed`:
- **Email:** `admin@brewlite.vn`
- **Mật khẩu:** `admin123`
- **Vai trò:** `ADMIN` (Được cấp quyền truy cập toàn bộ menu **Quản lý kho** `/admin/inventory`).

*Lưu ý bảo mật:* Đăng ký tài khoản công khai tại `/register` sẽ luôn gán vai trò `CUSTOMER` và bị từ chối truy cập (HTTP 403 Forbidden) vào các endpoint quản lý kho.

---

## 🧪 Kiểm thử tự động (Automated Verification)

### Chạy Unit Tests & E2E Tests Backend:
```bash
cd backend

# Chạy Unit Tests
npm test

# Chạy E2E Tests (bao gồm kiểm thử toàn diện 20 ca kiểm thử cho kho, dự báo 500 ly, đồng thời, và đối soát)
npm run test:e2e

# Chạy linter
npm run lint
```

### Chạy Unit Tests & Lint Frontend:
```bash
cd frontend
npm test
npm run lint
npm run build
```

---

## 📋 Kịch bản Demo: "500 ly Cà phê sữa M + 500 ly Trà đào M"

Để chứng minh đầy đủ yêu cầu nghiệp vụ chính của đề bài:

1. Đăng nhập vào hệ thống bằng tài khoản Admin:
   - Truy cập http://localhost:3000/login
   - Nhập `admin@brewlite.vn` / `admin123`
2. Bấm vào nút **Quản lý kho** màu vàng cam trên thanh Header (hoặc mở trực tiếp http://localhost:3000/admin/inventory).
3. Chọn tab **"Dự báo cơ cấu bán hàng (500+ ly)"**.
4. Bấm vào nút kịch bản nhanh: **"★ 500 ly Cà phê sữa M + 500 ly Trà đào M"** (hoặc tự chọn món, chọn Size M và nhập số lượng 500 vào 2 dòng sản phẩm).
5. Bấm nút **"Tính toán dự báo nguyên liệu"**.
6. **Quan sát kết quả tính toán:**
   - `Cà phê hạt / bột`: $500 \times 25\text{g} = 12.500\text{g}$.
   - `Sữa đặc`: $500 \times 40\text{g} = 20.000\text{g}$.
   - `Cốt trà đào`: $500 \times 15\text{g} = 7.500\text{g}$.
   - `Siro đào`: $500 \times 35\text{ml} = 17.500\text{ml}$.
   - `Đường nước`: $500 \times 20\text{ml} = 10.000\text{ml}$.
   - `Ly giấy kèm nắp` (Nguyên liệu dùng chung gộp lại): $(500 + 500) \times 1 = 1.000\text{ pcs}$.
   - Bảng hiển thị đầy đủ các cột: **Cần dùng**, **Tồn thực tế**, **Đang giữ chỗ**, **Khả dụng**, **Thiếu hụt**, **Dự kiến còn lại**, và nhãn đánh giá tính khả thi tổng thể.
7. **Thử nghiệm kịch bản thiếu hụt:**
   - Chọn kịch bản "Thiếu hụt (1.500 ly cỡ L)" hoặc tăng số lượng ly lên 2.000 ly. Bấm tính toán và thấy hệ thống báo đỏ: *"Kế hoạch KHÔNG THỂ đáp ứng toàn bộ (Thiếu hụt nguyên liệu)"*, nêu rõ định lượng thiếu hụt từng thành phần.
   - Bấm nút **+ Nhập kho**, chọn nguyên liệu thiếu và nhập bù thêm số lượng, sau đó bấm tính lại để thấy kế hoạch chuyển sang trạng thái khả thi.

---

## 📡 Danh sách API Endpoints Bổ sung

| Method | Endpoint | Quyền | Mô tả |
|---|---|:---:|---|
| `POST` | `/inventory/forecast` | Admin | Dự báo nhu cầu nguyên liệu theo cơ cấu bán hàng (500+ ly) |
| `GET` | `/inventory/ingredients` | Admin | Danh sách số dư nguyên liệu, giữ chỗ và cảnh báo sắp hết |
| `POST` | `/inventory/stock-in` | Admin | Nhập kho nguyên liệu mới |
| `POST` | `/inventory/adjust` | Admin | Điều chỉnh số dư kiểm kê kèm giải trình bắt buộc |
| `GET` | `/inventory/recipes` | Admin | Xem công thức định lượng đồ uống và topping |
| `PUT` | `/inventory/recipes/product` | Admin | Cập nhật định lượng món theo size |
| `PUT` | `/inventory/recipes/topping` | Admin | Cập nhật định lượng topping |
| `GET` | `/inventory/reports/daily` | Admin | Báo cáo cân đối xuất-nhập-tồn hàng ngày (múi giờ UTC+7) |
| `GET` | `/inventory/product-availability/:id` | Public | Kiểm tra nguyên liệu và ước tính số ly độc lập cho biến thể |
| `POST` | `/orders/:id/cancel` | Khách / Admin | Hủy đơn hàng hợp lệ và tự động giải phóng giữ chỗ nguyên liệu |
