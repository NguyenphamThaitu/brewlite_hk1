# ☕ BrewLite — Cashless Coffee Ordering System

> **Dự án Bài tập lớn môn Công nghệ Phần mềm — Đại học Sài Gòn (SGU)**  
> Ứng dụng web đặt cà phê và thanh toán không dùng tiền mặt, phát triển theo quy trình **Agile Scrum**.

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

## 🚀 Công nghệ sử dụng (Tech Stack)

- **Frontend:** Next.js (App Router, React 19, TypeScript), TailwindCSS, TanStack React Query v5, Zustand (State Management & Persistence).
- **Backend:** NestJS, TypeScript, RESTful API, Prisma ORM, Passport & JWT Authentication, Class Validator.
- **Cơ sở dữ liệu:** PostgreSQL 16.
- **Thanh toán:** Mock Cashless Payment Gateway (Ví điện tử & Thẻ ngân hàng), cơ chế chống trùng lặp **Idempotency-Key**.
- **DevOps & Container:** Docker, Docker Compose.
- **Kiểm thử (Testing):** Vitest (Frontend unit tests), Jest & Supertest (Backend unit & E2E tests).

---

## ✨ Các chức năng chính (Features)

### 1. 📋 Xem Menu & Tìm kiếm đồ uống (Menu & Search)
- **Danh sách món trực quan:** Hiển thị danh mục thức uống với hình ảnh sắc nét, tên món và giá tiền định dạng chuẩn Việt Nam (`VND`).
- **Tìm kiếm tức thì (Client-side Search):** Tìm món theo tên trực tiếp trên trình duyệt không cần gọi lại API. Hỗ trợ chuẩn hóa tiếng Việt (tìm kiếm không dấu hoặc có dấu, không phân biệt hoa thường).
- **Giao diện phản hồi:** Xử lý mượt mà các trạng thái đang tải (Loading Skeleton), không tìm thấy món phù hợp và thông báo lỗi kết nối.

### 2. 🧋 Chi tiết món & Tùy chọn (Customization)
- **Tùy chọn kích cỡ (Size):** Hỗ trợ 3 kích cỡ **S** (+0đ), **M** (+5.000đ), **L** (+10.000đ) với giá tiền cập nhật theo thời gian thực.
- **Tùy chọn Topping:** Cho phép chọn nhiều topping đi kèm (Trân châu +5.000đ, Kem +5.000đ).
- **Kiểm tra tồn kho (Stock Checking):** Tự động phát hiện món hết hàng, hiển thị nhãn cảnh báo đỏ và vô hiệu hóa nút thêm vào giỏ.

### 3. 🛒 Giỏ hàng thông minh (Shopping Cart)
- **Quản lý trạng thái với Zustand:** Lưu trữ và đồng bộ giỏ hàng an toàn với cơ chế chống lỗi Hydration mismatch trên Next.js SSR.
- **Thao tác linh hoạt:** Tăng / giảm số lượng từng món trực tiếp, xóa món, tự động tính tổng tiền giỏ hàng (`cartTotal`).
- **Huy hiệu số lượng (Badge):** Hiển thị số lượng món trên thanh Header theo thời gian thực.
- **Điều hướng thông minh:** Tự động chuyển hướng sang trang Đăng nhập nếu khách chưa có phiên đăng nhập khi bấm "Thanh toán".

### 4. 🔐 Xác thực người dùng (Authentication - JWT)
- **Đăng ký & Đăng nhập:** Hệ thống mã hóa mật khẩu an toàn bằng `bcrypt`, cấp phát và xác thực qua JSON Web Token (JWT).
- **Phân quyền truy cập (Guards):** Bảo vệ các thao tác nhạy cảm (tạo đơn, thanh toán, xem lịch sử đơn) qua `JwtAuthGuard`.
- **Thanh Header thích ứng:** Tự động cập nhật menu điều hướng khi đăng nhập thành công (hiển thị mục "Đơn của tôi", nút "Đăng xuất").

### 5. 💳 Thanh toán không dùng tiền mặt (Cashless Payment)
- **Phương thức thanh toán:** Hỗ trợ thanh toán qua **Ví điện tử (E-Wallet)** hoặc **Thẻ ngân hàng (Card)** theo đúng tiêu chí 100% Cashless.
- **Mã khuyến mãi (Promotion):** Hỗ trợ nhập voucher giảm giá (mã demo `BREW10` giảm 10% tổng đơn hàng).
- **An toàn giao dịch với Idempotency-Key:** Header `Idempotency-Key` (chuẩn UUID) ngăn chặn việc trừ tiền hoặc tạo đơn trùng lặp khi người dùng bấm thanh toán nhiều lần hoặc mất kết nối mạng.
- **Giả lập lỗi thanh toán (Simulate Fail):** Hỗ trợ checkbox kiểm thử luồng lỗi thanh toán. Khi gặp lỗi, giỏ hàng vẫn được giữ nguyên để khách hàng có thể thử lại an toàn.
- **Tích lũy điểm thưởng thành viên (Loyalty Points):** Tự động cộng 1 điểm cho mỗi 10.000đ khi đơn hàng thanh toán thành công.

### 6. 📦 Trạng thái & Lịch sử đơn hàng (Order Tracking)
- **Xác nhận đặt hàng (`/confirmation/[orderId]`):** Màn hình xác nhận thành công ngay sau khi thanh toán, hiển thị mã đơn, trạng thái đơn và hướng dẫn đến quầy nhận nước.
- **Lịch sử đơn của tôi (`/orders`):** Người dùng dễ dàng theo dõi toàn bộ các đơn hàng đã đặt, trạng thái đơn (`PENDING`, `PAID`, `PAYMENT_FAILED`,...), chi tiết món, size, số lượng và tổng thanh toán.
- **Máy trạng thái đơn hàng (Order State Machine):** Quản lý nghiêm ngặt chuyển đổi trạng thái ở Backend: `PENDING` ➔ `PAID` / `PAYMENT_FAILED` ➔ `PREPARING` ➔ `READY` ➔ `COMPLETED`.

### 7. 🎨 Giao diện người dùng & Tiện ích (UI/UX)
- **Trang 404 tùy biến (`not-found.tsx`):** Giao diện thông báo lỗi trang đẹp mắt với hiệu ứng nền lơ lửng (glassmorphism blobs), biểu tượng ly cà phê động và nút chuyển hướng về trang chủ.
- **Thanh Footer đồng bộ:** Cung cấp liên kết nhanh (Trang chủ, Giỏ hàng, Đơn hàng), thông tin thương hiệu BrewLite và thông tin bản quyền sinh viên.

---

## 🛠 Hướng dẫn chạy dự án

### Yêu cầu tiên quyết
- **Node.js:** Phiên bản 22.x trở lên (khuyến nghị Node 22.12+ hoặc Node 24.x).
- **Docker & Docker Desktop:** Đang bật và hoạt động.
- **Git**

---

### Cách 1: Khởi chạy toàn bộ bằng Docker (Khuyến nghị)

Chỉ cần một câu lệnh duy nhất để khởi tạo và chạy Database, Backend API và Frontend:

```bash
docker compose up --build
```

- **Frontend Web:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:3001](http://localhost:3001)
- **PostgreSQL Database:** `localhost:5432`

> **Lưu ý:** Lần đầu khởi tạo Docker sẽ mất 2–3 phút để tải image và cài đặt thư viện. Container backend sẽ tự động chạy lệnh di chuyển schema database (migration) và nạp dữ liệu mẫu (seed) vào CSDL.  
> **Dừng hệ thống:** Nhấn `Ctrl + C` hoặc mở terminal chạy `docker compose down`.

---

### Cách 2: Khởi chạy môi trường phát triển cục bộ (Local Development)

#### Bước 1: Khởi động CSDL PostgreSQL
Chạy database trong container ngầm:
```bash
docker compose up -d db
```

#### Bước 2: Thiết lập và chạy Backend (NestJS)
Mở một terminal mới:
```bash
cd backend

# 1. Tạo file cấu hình môi trường
cp .env.example .env

# 2. Cài đặt các gói phụ thuộc
npm install

# 3. Tạo Prisma Client và đồng bộ CSDL
npx prisma generate
npx prisma migrate dev       # Hoặc dùng: npx prisma db push (đồng bộ schema trực tiếp)

# 4. Nạp dữ liệu mẫu (menu và mã giảm giá)
npx prisma db seed

# 5. Khởi chạy server backend ở chế độ watch
npm run start:dev
```

#### Bước 3: Thiết lập và chạy Frontend (Next.js)
Mở thêm một terminal khác:
```bash
cd frontend

# 1. Tạo file cấu hình môi trường
cp .env.example .env.local

# 2. Cài đặt các gói phụ thuộc
npm install

# 3. Khởi chạy máy chủ frontend
npm run dev
```

Truy cập ứng dụng tại: [http://localhost:3000](http://localhost:3000).

---

## ⚙️ Biến môi trường

| Biến | Nơi áp dụng | Giá trị mẫu | Ý nghĩa |
|---|---|---|---|
| `DATABASE_URL` | backend | `postgresql://brew:brew@localhost:5432/brewlite` | Chuỗi kết nối PostgreSQL |
| `JWT_SECRET` | backend | `change-me-secret-key` | Khóa bí mật dùng để ký và xác thực JWT token |
| `CORS_ORIGIN` | backend | `http://localhost:3000` | Địa chỉ frontend được phép gọi API |
| `PORT` | backend | `3001` | Cổng dịch vụ NestJS |
| `NEXT_PUBLIC_API_URL` | frontend | `http://localhost:3001` | Địa chỉ Backend API để Next.js giao tiếp |

---

## 🎁 Dữ liệu mẫu Demo

- **Menu đồ uống (Seed tự động):**
  1. Cà phê sữa — 35.000đ
  2. Americano — 40.000đ
  3. Cappuccino — 45.000đ
  4. Trà đào — 39.000đ
- **Tùy chọn kích cỡ (Size):** Size S (+0đ), Size M (+5.000đ), Size L (+10.000đ).
- **Tùy chọn Topping:** Trân châu (+5.000đ), Kem (+5.000đ).
- **Mã khuyến mãi:** `BREW10` (giảm 10% trên tổng đơn hàng).
- **Tài khoản người dùng:** Đăng ký trực tiếp tại trang `/register` hoặc sử dụng tài khoản tự tạo.

---

## 📡 Danh sách API Endpoint

| Phương thức | Endpoint | Yêu cầu Auth | Chức năng |
|---|---|:---:|---|
| `GET` | `/products` | Không | Lấy danh sách toàn bộ sản phẩm menu |
| `GET` | `/products/:id` | Không | Lấy thông tin chi tiết một sản phẩm |
| `POST` | `/auth/register` | Không | Đăng ký tài khoản người dùng mới |
| `POST` | `/auth/login` | Không | Đăng nhập và nhận JWT token |
| `POST` | `/orders` | Bearer JWT | Tạo đơn hàng mới (trạng thái ban đầu `PENDING`) |
| `POST` | `/payments` | Bearer JWT | Thực hiện thanh toán (kèm header `Idempotency-Key`) |
| `GET` | `/orders/me` | Bearer JWT | Lấy danh sách lịch sử đơn hàng của người dùng |

---

## 🧪 Hướng dẫn chạy kiểm thử (Testing)

### 1. Frontend Unit Test (Vitest)
Kiểm thử định dạng tiền tệ `vnd()` và hàm tính tổng số lượng món trong giỏ hàng `cartCount()`.

```bash
cd frontend
npm test            # Chạy kiểm thử một lần
npm run test:watch  # Chạy kiểm thử tự động theo dõi khi sửa code
```

### 2. Backend Unit & E2E Test (Jest & Supertest)
Kiểm thử logic máy trạng thái đơn hàng (`order-state.spec.ts`) và kiểm thử tích hợp toàn bộ luồng nghiệp vụ API Task 10 (`task10.e2e-spec.ts`).

```bash
cd backend
npm test            # Chạy unit tests
npm run test:e2e    # Chạy kiểm thử E2E (yêu cầu Docker DB đang chạy)
```

---

## 📌 Ghi chú phát triển & Git
- Mã nguồn Task 4 (Trang chi tiết, `pricing.ts`) được tích hợp chung trong commit của Task 5.
- Dự án tuân thủ nghiêm ngặt quy trình Agile Scrum: Definition of Done được kiểm soát qua việc review code, viết test tự động và tài liệu hóa trong thư mục `docs/`.
