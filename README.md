# BrewLite — Cashless Coffee Ordering System

Hệ thống đặt cà phê và thanh toán không dùng tiền mặt. Đồ án môn **Công nghệ Phần mềm** — Trường Đại học Sài Gòn (SGU), được phát triển theo quy trình Agile Scrum.

---

## 👥 Danh sách thành viên & Phân công công việc

| Họ tên | MSSV | Vai trò | Công việc phụ trách |
|---|---|---|---|
| **Nguyễn Phạm Thái Tú** | 3124410385 | Developer chính | Thiết kế cấu trúc hệ thống, Docker, Git flow, lập trình API & tích hợp frontend |
| **Quách Văn Trường** | 3124410384 | Scrum Master | Quản lý quy trình Scrum, tổ chức Daily Scrum, biểu đồ Burndown, Review & Retrospective |
| **Đặng Tuấn Vỹ** | 3124410412 | Product Owner | Quản trị Product Backlog, làm rõ yêu cầu chức năng, nghiệm thu sản phẩm |
| **La Hữu Mẫn** | 3122410235 | Tester luồng chính | Kiểm thử các luồng đặt món, giỏ hàng, tùy chọn size/topping, thanh toán và kiểm tra tồn kho |
| **Quách Anh Vũ** | 3124410410 | Tester lỗi, Reviewer | Kiểm thử các trường hợp biên/lỗi (trùng email, sai mã, lỗi giao dịch), viết tài liệu HTTP, review code |
| **Trần Minh Trí** | 3124410371 | Developer Back-office | Xây dựng phân hệ Back-office (Quản trị kho & định lượng, Báo cáo doanh thu, Quản lý khuyến mãi & Thực đơn món), viết tài liệu và dẫn demo |

---

## 🛠 Công nghệ sử dụng

- **Frontend:** Next.js 16 (App Router, React 19, TypeScript), TailwindCSS v4, TanStack React Query v5, Zustand.
- **Backend:** NestJS 12, TypeScript, Prisma ORM 6, Passport JWT, class-validator, oxlint.
- **Cơ sở dữ liệu:** PostgreSQL 16.
- **Thanh toán:** Mock Gateway (Ví điện tử & Thẻ ngân hàng) tích hợp cơ chế chống lặp `Idempotency-Key`.
- **Kiểm thử:** Vitest (Frontend unit tests), Jest & Supertest (Backend E2E tests).
- **Môi trường & Triển khai:** Docker, Docker Compose.

---

## ✨ Tổng quan chức năng hệ thống

### 1. Phía Khách hàng (Storefront)
- **Menu & Tìm kiếm:** Xem danh sách cà phê truyền thống và pha máy, bố cục tinh gọn, hỗ trợ tìm kiếm tức thì theo tên có chuẩn hóa tiếng Việt không dấu.
- **Tùy biến món:** Chọn kích cỡ (Size S/M/L) và tùy chọn custom (`+ Đậm cafe`), tự động tính toán giá tương ứng.
- **Giỏ hàng:** Thêm món, điều chỉnh số lượng hoặc xóa món, tự động lưu trữ trạng thái giỏ hàng.
- **Tài khoản:** Đăng ký và đăng nhập bảo mật với Bcrypt + JWT token.
- **Thanh toán không dùng tiền mặt:** Chọn thanh toán qua Ví điện tử hoặc Thẻ ngân hàng, áp dụng mã khuyến mãi hợp lệ, tự động tích lũy điểm thưởng theo giá trị đơn hàng.
- **Theo dõi đơn hàng:** Xem trạng thái đơn hàng (`PENDING` ➔ `PAID` / `PAYMENT_FAILED` ➔ `PREPARING` ➔ `READY` ➔ `COMPLETED`) và lịch sử các đơn hàng đã đặt.

### 2. Phía Quản lý (Admin Back-office)
- **Quản lý Kho nguyên liệu (`/admin/inventory`):**
  - Quản lý danh mục nguyên liệu: Thêm mới, xóa an toàn, đánh số thứ tự (STT) tự động liên tục.
  - Theo dõi tồn thực tế, số lượng đang giữ chỗ và cảnh báo khi nguyên liệu chạm ngưỡng thấp.
  - Nhập kho & Điều chỉnh kiểm kê kèm ghi nhận lý do giải trình.
  - Báo cáo xuất - nhập - tồn cân đối theo ngày (UTC+7), đảm bảo kế thừa chuẩn kế toán: *Tồn cuối ca hôm trước = Tồn đầu ca hôm sau*.
  - Quản lý định lượng công thức pha chế theo từng size (S/M/L) và tùy chọn custom.
- **Quản lý Doanh thu & Khuyến mãi (`/admin/revenue`):**
  - **Báo cáo Doanh thu:** Bộ lọc theo khoảng ngày (từ 00:00:00 đến 23:59:59 UTC+7), 4 thẻ KPI (Tổng doanh thu, Tổng đơn gồm số đơn hoàn tất & số đơn hủy, AOV, Tỷ lệ hoàn tất), danh sách đơn hàng và Top món bán chạy nhất trong kỳ.
  - **Quản lý Mã khuyến mãi:** Thêm, sửa, xóa mã ưu đãi với thời gian hiệu lực (startDate - endDate), giới hạn lượt dùng và giá trị đơn tối thiểu.
  - **Quản lý Thực đơn món:** Thêm món mới kèm tự động gán công thức mặc định để bán được ngay, chỉnh sửa giá/ảnh, upload ảnh trực tiếp từ máy tính, bật/tắt tạm ngừng bán hoặc xóa món vĩnh viễn.

---

## 📡 Danh sách API Endpoints

### 1. Khách hàng & Đơn hàng
| Method | Endpoint | Quyền | Mô tả |
|---|---|:---:|---|
| `GET` | `/products` | Public | Lấy danh sách đồ uống trên Menu |
| `GET` | `/products/:id` | Public | Lấy chi tiết món, size và topping |
| `POST` | `/auth/register` | Public | Đăng ký tài khoản người dùng mới |
| `POST` | `/auth/login` | Public | Đăng nhập và nhận JWT access token |
| `POST` | `/orders` | Khách hàng | Tạo đơn hàng mới |
| `GET` | `/orders/me` | Khách hàng | Xem lịch sử đơn hàng của tài khoản |
| `POST` | `/orders/:id/cancel` | Khách / Admin | Hủy đơn hàng hợp lệ |
| `POST` | `/payments` | Khách hàng | Thực hiện thanh toán không tiền mặt |

### 2. Quản trị Tồn kho & Định lượng (Admin)
| Method | Endpoint | Quyền | Mô tả |
|---|---|:---:|---|
| `GET` | `/inventory/ingredients` | Admin | Xem danh sách số dư nguyên liệu và cảnh báo tồn thấp |
| `POST` | `/inventory/ingredients` | Admin | Thêm nguyên liệu mới vào kho |
| `DELETE` | `/inventory/ingredients/:id` | Admin | Xóa nguyên liệu và dọn dẹp liên kết công thức |
| `POST` | `/inventory/stock-in` | Admin | Nhập thêm nguyên liệu vào kho |
| `POST` | `/inventory/adjust` | Admin | Điều chỉnh số dư tồn kho kiểm kê kèm lý do |
| `GET` | `/inventory/reports/daily` | Admin | Báo cáo cân đối xuất-nhập-tồn theo ngày (UTC+7) |
| `GET` | `/inventory/recipes` | Admin | Xem danh sách công thức pha chế đồ uống & custom |
| `PUT` | `/inventory/recipes/product` | Admin | Cập nhật định lượng món theo từng size |
| `PUT` | `/inventory/recipes/topping` | Admin | Cập nhật định lượng custom |
| `POST` | `/inventory/forecast` | Admin | Dự báo nhu cầu nguyên liệu theo cơ cấu bán hàng |
| `GET` | `/inventory/product-availability/:id` | Public | Kiểm tra khả năng pha chế dựa trên tồn kho nguyên liệu |

### 3. Quản trị Back-office (Doanh thu, Khuyến mãi & Thực đơn)
| Method | Endpoint | Quyền | Mô tả |
|---|---|:---:|---|
| `GET` | `/admin/reports/revenue` | Admin | Báo cáo doanh thu theo khoảng ngày, KPIs, top món bán chạy |
| `GET` | `/admin/promotions` | Admin | Xem danh sách toàn bộ mã khuyến mãi |
| `POST` | `/admin/promotions` | Admin | Tạo mới mã khuyến mãi (hạn dùng, lượt dùng, đơn tối thiểu) |
| `PUT` | `/admin/promotions/:id` | Admin | Cập nhật thông tin và điều kiện mã khuyến mãi |
| `DELETE` | `/admin/promotions/:id` | Admin | Xóa mã khuyến mãi |
| `GET` | `/admin/products` | Admin | Danh sách món thực đơn kèm trạng thái mở/ngừng bán |
| `POST` | `/admin/products` | Admin | Tạo món mới, tự động khởi tạo công thức cơ bản |
| `PUT` | `/admin/products/:id` | Admin | Cập nhật thông tin món, giá hoặc tạm ngừng bán |
| `DELETE` | `/admin/products/:id` | Admin | Xóa vĩnh viễn món |
| `POST` | `/admin/products/upload-image` | Admin | Upload ảnh món trực tiếp từ máy tính |

---

## 🚀 Hướng dẫn cài đặt & Khởi chạy

### 1. Khởi chạy bằng Docker Compose (Khuyên dùng)
```bash
docker compose up -d --build
```
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **Database:** PostgreSQL chạy tại port `5432`

---

### 2. Khởi chạy thủ công (Development)

#### Yêu cầu:
- Node.js 20+ và PostgreSQL 16 đang hoạt động.

#### Bước 1: Cấu hình và chạy Backend
```bash
cd backend
cp .env.example .env
npm install

# Đồng bộ Database và nạp dữ liệu ban đầu
npx prisma migrate reset --force

# Khởi chạy server phát triển
npm run start:dev
```

#### Bước 2: Chạy Frontend
```bash
cd ../frontend
cp .env.example .env.local
npm install

# Khởi chạy giao diện web
npm run dev
```

---

## 🧪 Tài khoản thử nghiệm (Demo Accounts)

- **Tài khoản Admin (Quản trị kho):**
  - Email: `admin@brewlite.vn`
  - Mật khẩu: `admin123`
- **Tài khoản Khách hàng:**
  - Có thể đăng ký tài khoản mới trực tiếp tại trang web
- **Mã khuyến mãi giảm 10%:** `BREW10`

---

## 📋 Kiểm thử tự động & Linter (Testing & Quality)

### Kiểm tra Backend:
```bash
cd backend

# Chạy Unit Tests
npm test

# Chạy E2E Tests
npm run test:e2e

# Chạy linter kiểm tra mã nguồn (Oxlint)
npm run lint

# Kiểm tra build TypeScript
npm run build
```

### Kiểm tra Frontend:
```bash
cd frontend

# Chạy Unit Tests (Vitest)
npm test

# Chạy linter kiểm tra mã nguồn (ESLint)
npm run lint

# Kiểm tra build sản phẩm (Next.js)
npm run build
```
