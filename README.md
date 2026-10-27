# BrewLite — Cashless Coffee Ordering System

Hệ thống đặt cà phê và thanh toán không dùng tiền mặt. Đồ án môn **Công nghệ Phần mềm** — Trường Đại học Sài Gòn (SGU), phát triển theo quy trình **Agile Scrum**.

---

## 👥 Thành viên nhóm

| Họ tên | MSSV | Vai trò |
|---|---|---|
| Nguyễn Phạm Thái Tú | 3124410385 | Developer chính |
| Quách Văn Trường | 3124410384 | Scrum Master |
| Đặng Tuấn Vỹ | 3124410412 | Product Owner |
| La Hữu Mẫn | 3122410235 | Tester |
| Quách Anh Vũ | 3124410410 | Tester, Reviewer |
| Trần Minh Trí | 3124410371 | Tài liệu, Demo |

---

## 🛠 Công nghệ sử dụng

- **Frontend:** Next.js 16 (App Router, React 19, TypeScript), TailwindCSS v4, TanStack React Query v5, Zustand.
- **Backend:** NestJS 12, TypeScript, Prisma ORM 6, Passport JWT, class-validator.
- **Database:** PostgreSQL 16.
- **Thanh toán:** Mock Gateway (Ví điện tử & Thẻ ngân hàng), cơ chế chống trùng lặp **Idempotency-Key**.
- **Container & DevOps:** Docker, Docker Compose.
- **Testing:** Vitest (Frontend unit tests), Jest & Supertest (Backend unit & E2E tests).

---

## ✨ Các chức năng chính (Features)

- **Xem Menu & Tìm kiếm:** Hiển thị danh mục món từ API (`GET /products`), lọc tìm kiếm tức thì phía client hỗ trợ chuẩn hóa tiếng Việt (bỏ dấu), kiểm soát tồn kho (`stock <= 0` hiển thị hết hàng).
- **Chi tiết món & Tùy biến:** Tùy chọn size (S: +0đ, M: +5.000đ, L: +10.000đ) và topping (Trân châu: +5.000đ, Kem: +5.000đ); đồng bộ công thức tính giá giữa frontend và backend.
- **Giỏ hàng (Shopping Cart):** Quản lý state với Zustand (xử lý hydration an toàn trên SSR); hỗ trợ tăng/giảm số lượng, xóa món, tự động tính tổng tiền và cập nhật badge số lượng trên header.
- **Xác thực người dùng (Auth):** Đăng ký/Đăng nhập bảo mật với Bcrypt + JWT; bảo vệ các endpoint nghiệp vụ bằng `JwtAuthGuard`; tự động chuyển đổi giao diện theo trạng thái đăng nhập.
- **Thanh toán không tiền mặt:** Hỗ trợ thanh toán qua Ví điện tử hoặc Thẻ ngân hàng; áp dụng mã giảm giá (`BREW10` giảm 10%); cơ chế **Idempotency-Key** (UUID) chống lặp giao dịch; hỗ trợ giả lập lỗi thanh toán (giữ nguyên giỏ hàng để thử lại); tự động cộng điểm thưởng (1 điểm / 10.000đ).
- **Theo dõi & Lịch sử đơn hàng:** Trang xác nhận đơn (`/confirmation/[orderId]`); lịch sử đơn của tôi (`/orders`); quản lý vòng đời đơn hàng qua Order State Machine (`PENDING` ➔ `PAID` / `PAYMENT_FAILED` ➔ `PREPARING` ➔ `READY` ➔ `COMPLETED`).
- **Giao diện & Điều hướng:** Trang lỗi 404 tùy biến (`not-found.tsx`) hỗ trợ quay lại trang chủ; Header và Footer đồng bộ thương hiệu và liên kết điều hướng.

---

## 🚀 Hướng dẫn chạy dự án

### Yêu cầu tiên quyết
- Node.js LTS (>= 22.12.0)
- Docker & Docker Desktop
- Git

### Cách 1: Khởi chạy bằng Docker (Khuyến nghị để chấm bài)

```bash
docker compose up --build
```
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **Database:** `localhost:5432` (PostgreSQL)

*(Backend container tự động chạy migrate database và nạp dữ liệu mẫu ban đầu. Dừng hệ thống bằng `Ctrl+C` hoặc `docker compose down`)*.

---

### Cách 2: Chạy môi trường Local Development

**1. Khởi động PostgreSQL qua Docker:**
```bash
docker compose up -d db
```

**2. Khởi chạy Backend (NestJS):**
```bash
cd backend
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev       # Hoặc: npx prisma db push
npx prisma db seed          # Nạp dữ liệu menu và mã giảm giá
npm run start:dev
```

**3. Khởi chạy Frontend (Next.js - terminal mới):**
```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

---

## ⚙️ Biến môi trường

| Biến | Vị trí | Giá trị mẫu | Ý nghĩa |
|---|---|---|---|
| `DATABASE_URL` | backend | `postgresql://brew:brew@localhost:5432/brewlite` | Kết nối PostgreSQL |
| `JWT_SECRET` | backend | `change-me` | Secret key ký JWT |
| `CORS_ORIGIN` | backend | `http://localhost:3000` | Cấp phép CORS cho frontend |
| `PORT` | backend | `3001` | Cổng chạy Backend API |
| `NEXT_PUBLIC_API_URL` | frontend | `http://localhost:3001` | URL Backend API |

---

## 📡 Danh sách API Endpoints

| Method | Endpoint | Auth | Mô tả |
|---|---|:---:|---|
| `GET` | `/products` | Không | Danh sách sản phẩm menu |
| `GET` | `/products/:id` | Không | Chi tiết sản phẩm |
| `POST` | `/auth/register` | Không | Đăng ký tài khoản mới |
| `POST` | `/auth/login` | Không | Đăng nhập và nhận JWT token |
| `POST` | `/orders` | Bearer JWT | Tạo đơn hàng mới (`PENDING`) |
| `POST` | `/payments` | Bearer JWT | Thanh toán đơn hàng (Header `Idempotency-Key`) |
| `GET` | `/orders/me` | Bearer JWT | Lịch sử đơn hàng của người dùng |

---

## 🎁 Dữ liệu demo & Giá quy ước

- **Menu mẫu (Seed tự động):** Cà phê sữa (35.000đ), Americano (40.000đ), Cappuccino (45.000đ), Trà đào (39.000đ).
- **Quy chuẩn giá:** Size S (+0đ), M (+5.000đ), L (+10.000đ). Topping Trân châu (+5.000đ), Kem (+5.000đ).
- **Mã khuyến mãi:** `BREW10` (giảm 10% tổng hóa đơn).
- **Tài khoản:** Đăng ký tự do tại `/register`.

---

## 🧪 Kiểm thử tự động (Testing)

### Frontend (Vitest)
Kiểm tra logic hàm định dạng tiền `vnd()` và hàm tính tổng số lượng món `cartCount()`:
```bash
cd frontend
npm test            # Chạy kiểm thử một lần
npm run test:watch  # Chạy theo dõi tự động
```

### Backend (Jest & Supertest)
Kiểm tra Order State Machine và tích hợp toàn bộ luồng nghiệp vụ API:
```bash
cd backend
npm test            # Unit tests
npm run test:e2e    # E2E integration tests (yêu cầu Docker DB đang chạy)
```

---

## 📌 Ghi chú phát triển
- Code Task 4 (chi tiết & pricing) được commit chung với Task 5 (giỏ hàng).
- Quy trình kiểm thử, Definition of Done và biên bản Agile Scrum được lưu chi tiết trong thư mục `docs/`.
