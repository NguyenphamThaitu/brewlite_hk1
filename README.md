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
| **Trần Minh Trí** | 3124410371 | Tài liệu, Demo | Xây dựng chức năng kiểm soát nguyên liệu, trang 404, footer, viết tài liệu README và dẫn demo |

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
- **Menu & Tìm kiếm:** Xem danh sách đồ uống, hỗ trợ tìm kiếm tức thì theo tên có chuẩn hóa tiếng Việt không dấu.
- **Tùy biến món:** Chọn kích cỡ (Size S/M/L) và topping (Trân châu, Kem), tự động tính toán giá tương ứng.
- **Giỏ hàng:** Thêm món, điều chỉnh số lượng hoặc xóa món, tự động lưu trữ trạng thái giỏ hàng.
- **Tài khoản:** Đăng ký và đăng nhập bảo mật với Bcrypt + JWT token.
- **Thanh toán không dùng tiền mặt:** Chọn thanh toán qua Ví điện tử hoặc Thẻ ngân hàng, nhập mã khuyến mãi giảm giá (`BREW10`), tự động tích lũy điểm thưởng theo giá trị đơn hàng.
- **Theo dõi đơn hàng:** Xem trạng thái đơn hàng (`PENDING` ➔ `PAID` / `PAYMENT_FAILED` ➔ `PREPARING` ➔ `READY` ➔ `COMPLETED`) và lịch sử các đơn hàng đã đặt.

### 2. Phía Quản lý (Admin Dashboard)
- **Kho nguyên liệu:** Theo dõi định lượng thực tế, số lượng đang giữ chỗ và cảnh báo khi nguyên liệu chạm ngưỡng thấp.
- **Nhập kho & Kiểm kê:** Nhập thêm nguyên liệu vào kho, điều chỉnh số dư sau kiểm kê định kỳ kèm ghi nhận lý do giải trình.
- **Báo cáo cân đối ngày:** Bảng đối soát xuất - nhập - tồn nguyên liệu theo ngày chuẩn múi giờ Việt Nam (UTC+7).
- **Quản lý công thức:** Xem và cập nhật định lượng thành phần nguyên liệu cho từng kích cỡ đồ uống và topping.

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
| `POST` | `/inventory/stock-in` | Admin | Nhập thêm nguyên liệu vào kho |
| `POST` | `/inventory/adjust` | Admin | Điều chỉnh số dư tồn kho kiểm kê kèm lý do |
| `GET` | `/inventory/reports/daily` | Admin | Báo cáo cân đối xuất-nhập-tồn theo ngày (UTC+7) |
| `GET` | `/inventory/recipes` | Admin | Xem danh sách công thức pha chế đồ uống & topping |
| `PUT` | `/inventory/recipes/product` | Admin | Cập nhật định lượng món theo từng size |
| `PUT` | `/inventory/recipes/topping` | Admin | Cập nhật định lượng topping |
| `POST` | `/inventory/forecast` | Admin | Dự báo nhu cầu nguyên liệu theo cơ cấu bán hàng |
| `GET` | `/inventory/product-availability/:id` | Public | Kiểm tra khả năng pha chế dựa trên tồn kho nguyên liệu |

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
